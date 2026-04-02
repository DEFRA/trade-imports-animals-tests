import { test, expect } from '@fixtures';

// Requires `docker/scripts/mongodb/20-seed-notifications.js` to seed notifications into the local MongoDB.

test.describe('Notifications (admin)', () => {
  test.describe.configure({ mode: 'default' });
  test.beforeEach(async ({ pages }) => {
    await pages.adminDashboard.open();
    await pages.adminDashboard.btnNotifications.click();
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

  test('allows deleting a notification by checkbox', async ({ pages }) => {
    const referenceNumber = 'DRAFT.IMP.2026.69c12f11cafe202600000002';
    const initialRowCount = await pages.adminNotifications.tableRows.count();
    await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
    await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: 10_000 }).toBe(initialRowCount - 1);
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).not.toBeVisible();
  });

  test('allows deleting all notifications by select all', async ({ pages }) => {
    await pages.adminNotifications.checkBoxSelectAll.check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
    await expect.poll(async () => pages.adminNotifications.tableRows.count(), { timeout: 10_000 }).toBe(0);
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000003')).not.toBeVisible();
    await expect(pages.adminNotifications.tableRowByReference('DRAFT.IMP.2026.69c12f11cafe202600000004')).not.toBeVisible();
  });
});
