import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { defaultJourneyOptions, CONSIGNOR_NAME } from '@domain/constants/journey-options';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const NOTIFICATION_SUBMISSION_AMENDED = 'uk.gov.defra.imports.notification.NotificationSubmissionAmended';
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

  test('records a NotificationSubmitted outbox event on UI submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.long }).toBe(1);

      const docs = await collection.find({ aggregateId }).toArray();
      const [doc] = docs;
      const data = doc.data;
      const statusChanges = doc.statusChanges ?? [];

      expect(docs).toHaveLength(1);
      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(Number(doc.aggregateVersion)).toBe(1);
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
      expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(defaultJourneyOptions.pointOfEntry.value);
      expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(1);
      expect(statusChanges[0].status).toBe('SUBMITTED');
      expect(statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(statusChanges[0].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });

  test('records API submission without an actor and the authenticated actor on a later UI amendment', async ({
    apiJourney,
    notificationActions,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    const referenceNumber = created.id;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.long }).toBe(1);

      const [submitted] = await collection.find({ aggregateId }).toArray();
      const submittedChanges = submitted.statusChanges ?? [];
      expect(submitted.actor).toBeUndefined();
      expect(submittedChanges).toHaveLength(1);
      expect(submittedChanges[0].status).toBe('SUBMITTED');
      expect(submittedChanges[0].actor).toBeUndefined();

      await notificationActions.amendNotification(referenceNumber);
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.long }).toBe(2);

      const events = await collection.find({ aggregateId }).sort({ aggregateVersion: 1 }).toArray();
      const amended = events[1];
      const amendedChanges = amended.statusChanges ?? [];

      expect(events.map(({ aggregateVersion }) => Number(aggregateVersion))).toEqual([1, 2]);
      expect(events.map(({ eventType }) => eventType)).toEqual([NOTIFICATION_SUBMITTED, NOTIFICATION_SUBMISSION_AMENDED]);
      expect(events.map(({ data }) => data.exchangedDocument.identifier)).toEqual([referenceNumber, referenceNumber]);
      expect(actorWithNullableFields(amended.actor)).toEqual(EXPECTED_ACTOR);
      expect(amendedChanges).toHaveLength(2);
      expect(amendedChanges.map(({ status }) => status)).toEqual(['SUBMITTED', 'AMEND']);
      expect(amendedChanges[0].actor).toBeUndefined();
      expect(actorWithNullableFields(amendedChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });
});
