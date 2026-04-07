import { test, expect } from '@fixtures';
import { MongoDbClient } from '@domain/clients/mongodb-client';

// Requires `docker/scripts/mongodb/20-seed-notifications.js` to seed notifications into the local MongoDB.

test.describe('Notifications (admin)', { tag: '@compose' }, () => {
  test.describe.configure({ mode: 'default' });
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAdminNotifications();
  });

  test('shows notifications for deletion', async ({ pages }) => {
    const rowCount = await pages.adminNotifications.tableRows.count();
    expect(rowCount).toBeGreaterThan(4);
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000001')).toBeVisible();
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000002')).toBeVisible();
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000003')).toBeVisible();
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000004')).toBeVisible();
  });

  test('allows deleting a notification by reference number', async ({ pages }) => {
    const referenceNumber = 'DRAFT.IMP.2026.69c12f11cafe202600000001';
    const initialRowCount = await pages.adminNotifications.tableRows.count();
    await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
    await pages.adminNotifications.btnDeleteByReferenceNumber.click();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
    await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: 10_000 }).toBe(initialRowCount - 1);
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).not.toBeVisible();
  });

  test('allows cancelling checkbox deletion and keeps notification visible', async ({ pages }) => {
    const referenceNumber = 'DRAFT.IMP.2026.69c12f11cafe202600000002';
    await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnCancel.click();
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
  });

  test('allows deleting a notification by checkbox', { tag: ['@integration', '@mongodb'] }, async ({ pages }) => {
    const referenceNumber = 'DRAFT.IMP.2026.69c12f11cafe202600000002';

    await test.step('delete notification by checkbox', async () => {
      const initialRowCount = await pages.adminNotifications.tableRows.count();
      await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
      await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: 10_000 }).toBe(initialRowCount - 1);
      await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).not.toBeVisible();
    });

    await test.step('writes a successful delete audit record for one notification delete', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const records = await collection
          .find({
            notificationReferenceNumbers: referenceNumber,
          })
          .toArray();

        expect(records).toHaveLength(1);
        expect(String(records[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(records[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(records[0].result).toBe('SUCCESS');
        expect(String(records[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(records[0].numberOfNotifications).toBe(1);
        expect(records[0].notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(records[0].traceId).toBe('test-trace-id');
        expect(records[0].userId).toBe('2100010101');
        expect(records[0]._class).toBe('uk.gov.defra.trade.imports.animals.audit.Audit');
      } finally {
        await client.close();
      }
    });
  });

  test('allows deleting all notifications by select all', { tag: ['@integration', '@mongodb'] }, async ({ pages }) => {
    const referenceNumbers = ['DRAFT.IMP.2026.69c12f11cafe202600000003', 'DRAFT.IMP.2026.69c12f11cafe202600000004'];

    await test.step('delete all notifications by select all', async () => {
      await pages.adminNotifications.checkBoxSelectAll.check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
      await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: 10_000 }).toBe(0);
      await expect(pages.adminNotifications.tableRowByReference(referenceNumbers[0])).not.toBeVisible();
      await expect(pages.adminNotifications.tableRowByReference(referenceNumbers[1])).not.toBeVisible();
    });

    await test.step('writes a successful delete audit record for multiple notifications deletes', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const records = await collection
          .find({
            notificationReferenceNumbers: { $all: referenceNumbers },
          })
          .toArray();

        expect(records).toHaveLength(1);
        expect(String(records[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(records[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(records[0].result).toBe('SUCCESS');
        expect(String(records[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(records[0].numberOfNotifications).toBeGreaterThanOrEqual(2);
        expect(records[0].notificationReferenceNumbers).toEqual(expect.arrayContaining(referenceNumbers));
        expect(records[0].traceId).toBe('test-trace-id');
        expect(records[0].userId).toBe('2100010101');
        expect(records[0]._class).toBe('uk.gov.defra.trade.imports.animals.audit.Audit');
      } finally {
        await client.close();
      }
    });
  });
});
