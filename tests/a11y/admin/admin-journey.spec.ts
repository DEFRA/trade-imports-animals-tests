import { test } from '@fixtures/a11y';
import { ObjectId } from 'mongodb';

test.describe('Accessibility (admin) WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ adminJourneys }) => {
    await adminJourneys.toAdminDashboard();
  });

  test.describe('Initial state (no user input)', () => {
    test('each visited page has no accessibility violations on initial load', async ({ pages, runA11yScan }) => {
      await test.step('Admin dashboard', async () => {
        await runA11yScan();
        await pages.adminDashboard.btnNotifications.click();
      });

      await test.step('Admin notifications', async () => {
        await runA11yScan();
      });
    });
  });

  test.describe('Completed state (valid user input)', () => {
    test('each visited page has no accessibility violations after user input', async ({ pages, runA11yScan }) => {
      await test.step('Admin dashboard', async () => {
        await pages.adminDashboard.btnNotifications.click();
      });

      await test.step('Admin notifications', async () => {
        await pages.adminNotifications.inputReferenceNumber.fill('GBN-AG-26-000001');
        await pages.adminNotifications.checkBoxSelectAll.check();
        await runA11yScan();
      });

      await test.step('Admin notifications confirmation', async () => {
        await pages.adminNotifications.checkBoxSelectAll.uncheck();
        await pages.adminNotifications.btnDeleteByReferenceNumber.click();
        await runA11yScan();
      });
    });
  });

  test.describe('Error state (validation failures)', () => {
    test('each visited page has no accessibility violations when validation errors are shown', async ({ pages, runA11yScan }) => {
      await test.step('Admin dashboard', async () => {
        await pages.adminDashboard.btnNotifications.click();
      });

      await test.step('Admin notifications', async () => {
        const invalidReference = `EXIST.NON.2026.${new ObjectId().toString()}`;
        await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
        await pages.adminNotifications.btnDeleteByReferenceNumber.click();
        await pages.adminNotifications.btnConfirm.click();
        await runA11yScan();
      });
    });
  });
});
