import { test } from '@fixtures/a11y';

const REFERENCE_NUMBER = 'GBN-AG-26-000001';

test.describe('Accessibility (admin) WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations after user input', async ({ adminNavigation, pages, runA11yScan }) => {
    await test.step('Admin notifications', async () => {
      await adminNavigation.toNotifications();
      await pages.adminNotifications.inputReferenceNumber.fill(REFERENCE_NUMBER);
      await pages.adminNotifications.checkBoxSelectAll.check();
      await runA11yScan();
    });

    await test.step('Admin notifications delete confirmation', async () => {
      await pages.adminNotifications.checkBoxSelectAll.uncheck();
      await pages.adminNotifications.btnDeleteByReferenceNumber.click();
      await runA11yScan();
    });

    await test.step('Admin outbox events search results', async () => {
      await adminNavigation.toOutboxEvents(REFERENCE_NUMBER);
      await pages.adminOutboxEvents.heading.waitFor();
      await runA11yScan();
    });
  });
});
