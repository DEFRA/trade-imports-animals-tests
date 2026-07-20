import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations after user input', async ({
    apiJourney,
    journeyContext,
    adminNavigation,
    pages,
    runA11yScan,
  }) => {
    await apiJourney.createSubmittedNotification();
    const referenceNumber = journeyContext.notificationId;

    await test.step('Admin notifications', async () => {
      await adminNavigation.toNotifications();
      await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
      await pages.adminNotifications.checkBoxSelectAll.check();
      await runA11yScan();
    });

    await test.step('Admin notifications delete confirmation', async () => {
      await pages.adminNotifications.checkBoxSelectAll.uncheck();
      await pages.adminNotifications.btnDeleteByReferenceNumber.click();
      await runA11yScan();
    });

    await test.step('Admin outbox events search results', async () => {
      await adminNavigation.toOutboxEvents(referenceNumber);
      await pages.adminOutboxEvents.heading.waitFor();
      await runA11yScan();
    });
  });
});
