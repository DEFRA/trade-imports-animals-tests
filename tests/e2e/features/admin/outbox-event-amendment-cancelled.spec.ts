import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_AMENDMENT_CANCELLED = 'uk.gov.defra.imports.notification.NotificationAmendmentCancelled';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Notification amendment cancelled outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationAmendmentCancelled event when an amendment is cancelled', async ({
    apiJourney,
    journeyContext,
    notificationApi,
  }) => {
    test.slow();
    await apiJourney.createAmendNotification();
    const referenceNumber = journeyContext.referenceNumber;
    await notificationApi.cancelAmendNotification(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_AMENDMENT_CANCELLED }), {
          timeout: timeouts.long,
        })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_AMENDMENT_CANCELLED }).toArray();

      expect(doc.aggregateVersion).toBeGreaterThan(1);
      expect(doc.eventType).toBe(NOTIFICATION_AMENDMENT_CANCELLED);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.correlationId).toBeDefined();
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(doc.statusChanges?.map(({ status }) => status)).toEqual(['DRAFT', 'SUBMITTED', 'AMEND', 'SUBMITTED']);
    } finally {
      await client.close();
    }
  });
});
