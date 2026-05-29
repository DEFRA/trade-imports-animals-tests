import { test, expect } from '@fixtures';
import { defaultJourneyOptions, CONSIGNOR_NAME } from '@flows/journeys';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';

const NOTIFICATION_SUBMITTED_EVENT_TYPE = 'uk.gov.defra.imports.notification.NotificationSubmitted';

test.describe('Notification outbox', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('does not write outbox event before submission', async ({ journeys, journeyContext }) => {
    await journeys.toDeclaration();
    const referenceNumber = journeyContext.notificationId;
    const aggregateId = `Imports.Notification.GBN-AG.${referenceNumber}`;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.short }).toBe(0);
    } finally {
      await client.close();
    }
  });

  test('records notification submitted event in outbox after submission', async ({ journeys, journeyContext, pages }) => {
    await journeys.submitNotification();
    const referenceNumber = journeyContext.notificationId;
    const aggregateId = `Imports.Notification.GBN-AG.${referenceNumber}`;
    const defaults = defaultJourneyOptions;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.short }).toBe(1);
      const docs = await collection.find({ aggregateId }).toArray();
      const [doc] = docs;

      await test.step('finds exactly one outbox event for the notification', () => {
        expect(docs).toHaveLength(1);
      });

      await test.step('asserts outbox event envelope and payload smoke checks', () => {
        const data = doc.data;

        // Outbox E2E: assert envelope and payload identity — not full notification parity
        // (see notification-persistence.spec.ts). One smoke field per major payload section.
        expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(doc.aggregateId).toBe(aggregateId);
        expect(doc.aggregateType).toBe('Notification');
        expect(doc.subType).toBe('GBN-AG');
        expect(doc.aggregateVersion).toBe(1);
        expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED_EVENT_TYPE);
        expect(doc.timestamp).toBeInstanceOf(Date);
        expect(doc.metadata.schemaVersion).toBe('1');
        expect(doc.metadata.correlationId).toBeDefined();
        expect(data.referenceNumber).toBe(referenceNumber);
        expect(data.origin.countryCode).toBe(defaults.countryCode);
        expect(data.commodity.name).toBe(defaults.commodityCode);
        expect(data.transport.portOfEntry).toBe(defaults.pointOfEntry);
        expect(data.consignor.name).toBe(CONSIGNOR_NAME);
      });

      // TODO: remove when submission navigates away from declaration; temporary resubmit to assert aggregateVersion increment.
      await test.step('resubmits notification from declaration page (temporary)', async () => {
        await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
        await expect(pages.declaration.heading).toBeVisible();
        await expect(pages.declaration.btnSubmitNotification).toBeVisible();

        if (!(await pages.declaration.checkboxDeclaration.isChecked())) {
          await pages.declaration.checkboxDeclaration.click();
        }

        await pages.declaration.btnSubmitNotification.click();
      });

      await test.step('finds two outbox events with incrementing aggregate versions', async () => {
        await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.short }).toBe(2);

        const resubmissionDocs = await collection.find({ aggregateId }).sort({ aggregateVersion: 1 }).toArray();
        expect(resubmissionDocs).toHaveLength(2);
        expect(resubmissionDocs[0].aggregateVersion).toBe(1);
        expect(resubmissionDocs[1].aggregateVersion).toBe(2);
        expect(resubmissionDocs[0].aggregateId).toBe(aggregateId);
        expect(resubmissionDocs[1].aggregateId).toBe(aggregateId);
        expect(resubmissionDocs[0].eventType).toBe(NOTIFICATION_SUBMITTED_EVENT_TYPE);
        expect(resubmissionDocs[1].eventType).toBe(NOTIFICATION_SUBMITTED_EVENT_TYPE);
        expect(resubmissionDocs[0].data.referenceNumber).toBe(referenceNumber);
        expect(resubmissionDocs[1].data.referenceNumber).toBe(referenceNumber);
      });
    } finally {
      await client.close();
    }
  });
});
