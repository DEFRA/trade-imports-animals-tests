import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const EXPECTED_ACTOR: OutboxEventActor = {
  id: '2100010101',
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: 'Andrew Farmer',
  organisationId: '5900001',
  onBehalfOfOrganisationId: null,
};

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const actorWithNullableFields = (actor: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

/**
 * Integration seam: a real UI submission emits the transactional outbox event the gateway forwards.
 *
 * The outbox event is derived from the proposed notification the frontend Mapper B writes on submit (the
 * GBN-AG payload from the backend GbnAgMapper, EUDPA-274) — a direct /fulfilments API write does NOT
 * produce it, so the seam submits through the UI. promoted-lifecycle asserts status; this asserts emission
 * + envelope.
 */
test.describe('Notification outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test('does not write an outbox event before submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.toDeclaration();
    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.short }).toBe(0);
    } finally {
      await client.close();
    }
  });

  test('records a NotificationSubmitted outbox event on submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.long }).toBe(1);

      const [doc] = await collection.find({ aggregateId }).toArray();
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(Number(doc.aggregateVersion)).toBe(1);
      expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.data.$model).toBe('defra/certificate-internal/1');
      expect(doc.data.$type).toBe('gbn-ag');
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(doc.statusChanges).toHaveLength(1);
      expect(doc.statusChanges[0].status).toBe('SUBMITTED');
      expect(doc.statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(doc.statusChanges[0].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });
});
