import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_CREATED = 'uk.gov.defra.imports.notification.NotificationCreated';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Notification created outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationCreated event immediately on draft creation', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.startNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_CREATED }), { timeout: timeouts.long })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_CREATED }).toArray();

      expect(doc.aggregateVersion).toBe(1);
      expect(doc.eventType).toBe(NOTIFICATION_CREATED);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('DRAFT');
      expect(doc.data.exchangedDocument.versionId).toBeUndefined();
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.statusChanges).toHaveLength(1);
      expect(doc.statusChanges?.[0].status).toBe('DRAFT');
    } finally {
      await client.close();
    }
  });
});
