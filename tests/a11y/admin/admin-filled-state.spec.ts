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
    const referenceNumber = journeyContext.referenceNumber;

    await test.step('Admin notifications', async () => {
      await adminNavigation.toNotifications();
      await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
      await pages.adminNotifications.checkBoxSelectAll.check();
      await runA11yScan();
    });

    await test.step('Admin notifications delete confirmation', async () => {
      await pages.adminNotifications.checkBoxSelectAll.uncheck();
      await pages.adminNotifications.deleteByReferenceNumber();
      await runA11yScan();
    });

    // DLQ status check on this page 502s while the DLQ is unstable.
    // await test.step('Admin outbox events search results', async () => {
    //   await adminNavigation.toOutboxEvents(referenceNumber);
    //   await pages.adminOutboxEvents.heading.waitFor();
    //   await runA11yScan();
    // });
    //
    // await test.step('Admin outbox events replay success', async () => {
    //   await pages.adminOutboxEvents.btnReplay.click();
    //   await pages.adminOutboxEvents.bannerSuccess.waitFor();
    //   await runA11yScan();
    // });

    await test.step('Admin outbox events with no results', async () => {
      await adminNavigation.toOutboxEvents('GBN-AG-00-000000');
      await pages.adminOutboxEvents.emptyStateMessage.waitFor();
      await runA11yScan();
    });
  });
});
