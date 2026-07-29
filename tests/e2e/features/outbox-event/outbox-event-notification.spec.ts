import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

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
    } finally {
      await client.close();
    }
  });
});
