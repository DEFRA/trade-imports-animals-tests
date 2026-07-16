import { test, expect } from '@fixtures';
import { defaultJourneyOptions, CONSIGNOR_NAME } from '@flows/journey';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';

const NOTIFICATION_SUBMITTED_EVENT_TYPE = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const NOTIFICATION_SUBMISSION_AMENDED_EVENT_TYPE = 'uk.gov.defra.imports.notification.NotificationSubmissionAmended';

test.describe('Notification outbox event', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('does not write outbox event before submission', async ({ journey, journeyContext }) => {
    await journey.toDeclaration();
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

  test('records notification submitted event in outbox after submission', async ({
    journey,
    journeyContext,
    pages,
    notificationActions,
  }) => {
    await journey.submitNotification();
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

      await test.step('asserts outbox event envelope and GBN-AG payload smoke checks', () => {
        const data = doc.data;

        // Outbox E2E: assert envelope and GBN-AG payload identity — not full notification
        // parity (see notification-persistence.spec.ts). One smoke field per major payload
        // section. The trade-line commodity name/description are not yet mapped (EUDPA-274
        // trade-line data gap), so the commodity section is smoke-checked structurally.
        expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(doc.aggregateId).toBe(aggregateId);
        expect(doc.aggregateType).toBe('Notification');
        expect(doc.subType).toBe('GBN-AG');
        expect(doc.aggregateVersion).toBe(1);
        expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED_EVENT_TYPE);
        expect(doc.timestamp).toBeInstanceOf(Date);
        expect(doc.metadata.schemaVersion).toBe('1');
        expect(doc.metadata.correlationId).toBeDefined();
        expect(data.$model).toBe('defra/certificate-internal/1');
        expect(data.$type).toBe('gbn-ag');
        expect(data.exchangedDocument.identifier).toBe(referenceNumber);
        expect(data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
        expect(data.specifiedConsignment.consignorParty?.name).toBe(CONSIGNOR_NAME);
        expect(data.specifiedConsignment.originCountry?.code?.value).toBe(defaults.countryCode);
        expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(defaults.pointOfEntry.code);
        expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      });

      await test.step('amends the submitted notification (SUBMITTED → AMEND)', async () => {
        await notificationActions.toNotificationView(referenceNumber);
        await pages.notificationView.btnAmend.click();
        await expect(pages.notificationView.amendStatusTag).toBeVisible();
      });

      await test.step('finds two outbox events with incrementing aggregate versions', async () => {
        await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.short }).toBe(2);

        const amendDocs = await collection.find({ aggregateId }).sort({ aggregateVersion: 1 }).toArray();
        expect(amendDocs).toHaveLength(2);
        expect(amendDocs[0].aggregateVersion).toBe(1);
        expect(amendDocs[1].aggregateVersion).toBe(2);
        expect(amendDocs[0].aggregateId).toBe(aggregateId);
        expect(amendDocs[1].aggregateId).toBe(aggregateId);
        expect(amendDocs[0].eventType).toBe(NOTIFICATION_SUBMITTED_EVENT_TYPE);
        expect(amendDocs[1].eventType).toBe(NOTIFICATION_SUBMISSION_AMENDED_EVENT_TYPE);
        expect(amendDocs[0].data.exchangedDocument.identifier).toBe(referenceNumber);
        expect(amendDocs[1].data.exchangedDocument.identifier).toBe(referenceNumber);
      });
    } finally {
      await client.close();
    }
  });
});
