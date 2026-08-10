import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { defaultJourneyOptions, CONSIGNOR_NAME } from '@domain/constants/journey-options';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const POINT_OF_ENTRY = 'GB ABD';
const EXPECTED_ACTOR: OutboxEventActor = {
  id: '2100010101',
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: 'Andrew Farmer',
  organisationId: '5900001',
  onBehalfOfOrganisationId: null,
};

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

test.describe('Notification outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records a NotificationSubmitted outbox event on UI submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const docs = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMITTED }).toArray();
      const [doc] = docs;
      const data = doc.data;
      const statusChanges = doc.statusChanges ?? [];

      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED);
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.metadata.correlationId).toBeDefined();
      expect(data.$model).toBe('defra/certificate-internal/1');
      expect(data.$type).toBe('gbn-ag');
      expect(data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(data.specifiedConsignment.consignorParty?.name).toBe(CONSIGNOR_NAME);
      expect(data.specifiedConsignment.originCountry?.code?.value).toBe(defaultJourneyOptions.countryCode.value);
      expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(POINT_OF_ENTRY);
      expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(2);
      expect(statusChanges[0].status).toBe('DRAFT');
      expect(statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(statusChanges[1].status).toBe('SUBMITTED');
      expect(statusChanges[1].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });
});
