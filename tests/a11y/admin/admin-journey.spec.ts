import { test } from '@fixtures/a11y';
import { ObjectId } from 'mongodb';

test.describe('Accessibility (admin) WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.describe('Initial state (no user input)', () => {
    test('each visited page has no accessibility violations on initial load', async ({ adminJourneys, pages, runA11yScan }) => {
      // Scan admin dashboard
      await adminJourneys.toAdminDashboard();
      await runA11yScan();
      await pages.adminDashboard.btnNotifications.click();

      // Scan notifications page
      await runA11yScan();
    });
  });

  test.describe('Completed state (valid user input)', () => {
    test('each visited page has no accessibility violations after user input', async ({ adminJourneys, pages, runA11yScan }) => {
      await adminJourneys.toAdminDashboard();
      await pages.adminDashboard.btnNotifications.click();

      // Scan notifications page
      await pages.adminNotifications.inputReferenceNumber.fill('DRAFT.IMP.2026.69c12f11cafe202600000001');
      await pages.adminNotifications.checkBoxSelectAll.check();
      await runA11yScan();
    });
  });

  test.describe('Error state (validation failures)', () => {
    test('each visited page has no accessibility violations when validation errors are shown', async ({
      adminJourneys,
      pages,
      runA11yScan,
    }) => {
      await adminJourneys.toAdminDashboard();
      await pages.adminDashboard.btnNotifications.click();

      // Scan notifications page
      const invalidReference = `EXIST.NON.2026.${new ObjectId().toString()}`;
      await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
      await pages.adminNotifications.btnDeleteByReferenceNumber.click();
      await pages.adminNotifications.btnConfirm.click();
      await runA11yScan();
    });
  });
});
