import { expect, test } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { ObjectId } from 'mongodb';
import { skipIfCdpEnvironment } from '@utils/playwright/environment';

// Requires `docker/scripts/mongodb/20-seed-notifications.js` to seed notifications into the local MongoDB.

test.describe('Notifications (admin)', { tag: '@compose' }, () => {
  test.describe.configure({ mode: 'default' });
  test.beforeEach(async ({ adminJourneys }) => {
    await adminJourneys.toNotifications();
  });

  test('shows notifications for deletion', async ({ pages }) => {
    await expect.poll(() => pages.adminNotifications.tableRows.count()).toBeGreaterThan(4);
    for (const referenceNumber of ['GBN-AG-26-000001', 'GBN-AG-26-000002', 'GBN-AG-26-000003', 'GBN-AG-26-000004']) {
      await pages.adminNotifications.findRowByReference(referenceNumber);
      await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
    }
  });

  test('allows deleting a notification by reference number', async ({ pages }) => {
    const referenceNumber = 'GBN-AG-26-000001';
    await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
    await pages.adminNotifications.btnDeleteByReferenceNumber.click();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
    await expect
      .poll(async () => pages.adminNotifications.tableRowByReference(referenceNumber).isVisible(), { timeout: timeouts.medium })
      .toBe(false);
  });

  test('allows cancelling checkbox deletion and keeps notification visible', async ({ pages }) => {
    const referenceNumber = 'GBN-AG-26-000002';
    await pages.adminNotifications.findRowByReference(referenceNumber);
    await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnCancel.click();
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
  });

  test('allows deleting a notification by checkbox', { tag: ['@integration', '@mongodb'] }, async ({ pages }) => {
    const referenceNumber = 'GBN-AG-26-000002';

    await test.step('delete notification by checkbox', async () => {
      const initialRowCount = await pages.adminNotifications.tableRows.count();
      await pages.adminNotifications.findRowByReference(referenceNumber);
      await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
      await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: timeouts.medium }).toBe(initialRowCount - 1);
      await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).not.toBeVisible();
    });

    await test.step('writes a successful delete audit record for one notification delete', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const docs = await collection
          .find({
            notificationReferenceNumbers: referenceNumber,
          })
          .toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('SUCCESS');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBe(1);
        expect(docs[0].notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });

  test('allows deleting all current-page notifications by select all', { tag: ['@integration', '@mongodb'] }, async ({ pages }) => {
    skipIfCdpEnvironment('Compose/local only: destructive (deletes the current page of notifications); never run on CDP environments.');
    // By the time this test runs, GBN-AG-26-000001 and GBN-AG-26-000002 have
    // been deleted by earlier tests, leaving 52 docs. With DESC-by-created
    // sort and page-size 50:
    //   page 1 = GBN-AG-26-000004, 000003, then 000054..000007 (50 refs)
    //   page 2 = GBN-AG-26-000006, 000005                       (2 refs)
    // The "select all" checkbox is page-scoped, so we expect page-1 refs to
    // be deleted and page-2 refs to survive.
    const pageOneReferences = ['GBN-AG-26-000003', 'GBN-AG-26-000004'];
    const pageTwoReferences = ['GBN-AG-26-000005', 'GBN-AG-26-000006'];

    await test.step('select all deletes only the current page', async () => {
      await pages.adminNotifications.checkBoxSelectAll.check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
      for (const referenceNumber of pageOneReferences) {
        await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).not.toBeVisible();
      }
      for (const referenceNumber of pageTwoReferences) {
        await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
      }
    });

    await test.step('writes a successful delete audit record for the current page', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const docs = await collection
          .find({
            notificationReferenceNumbers: { $all: pageOneReferences },
          })
          .toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('SUCCESS');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBeGreaterThanOrEqual(pageOneReferences.length);
        expect(docs[0].notificationReferenceNumbers).toEqual(expect.arrayContaining(pageOneReferences));
        for (const referenceNumber of pageTwoReferences) {
          expect(docs[0].notificationReferenceNumbers).not.toContain(referenceNumber);
        }
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });

  test('does not allow deleting a notification by invalid reference number', { tag: ['@integration', '@mongodb'] }, async ({ pages }) => {
    const randomId = new ObjectId().toString();
    const invalidReference = `EXIST.NON.2026.${randomId}`;

    await test.step('attempt delete by invalid reference number shows an error', async () => {
      await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
      await pages.adminNotifications.btnDeleteByReferenceNumber.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertImportant).toContainText(
        'There was a problem deleting the notifications. Please try again.',
      );
    });

    await test.step('writes a failed delete audit record for one notification delete', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const docs = await collection
          .find({
            notificationReferenceNumbers: invalidReference,
          })
          .toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('FAILURE');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBe(1);
        expect(docs[0].notificationReferenceNumbers).toEqual([invalidReference]);
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });
});
