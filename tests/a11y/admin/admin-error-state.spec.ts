import { test } from '@fixtures/a11y';
import { ObjectId } from 'mongodb';

test.describe('Accessibility (admin) WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations when validation errors are shown', async ({
    adminNavigation,
    pages,
    runA11yScan,
  }) => {
    await test.step('Admin notifications delete with an unknown reference', async () => {
      await adminNavigation.toNotifications();
      const invalidReference = `EXIST.NON.2026.${new ObjectId().toString()}`;
      await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
      await pages.adminNotifications.btnDeleteByReferenceNumber.click();
      await pages.adminNotifications.btnConfirm.click();
      await runA11yScan();
    });
  });
});
