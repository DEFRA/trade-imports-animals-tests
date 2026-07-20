import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the notification view page has no accessibility violations in its SUBMITTED, AMEND, cancel-amend-confirmation and delete-confirmation states', async ({
    journey,
    notificationActions,
    pages,
    journeyContext,
    runA11yScan,
  }) => {
    await test.step('Notification view (SUBMITTED)', async () => {
      await journey.submitNotification();
      await notificationActions.toNotificationView(journeyContext.referenceNumber);
      await runA11yScan();
    });

    await test.step('Notification view (AMEND)', async () => {
      await pages.notificationView.btnAmend.click();
      await pages.notificationView.amendStatusTag.waitFor();
      await runA11yScan();
    });

    await test.step('Cancel amendment confirmation', async () => {
      await pages.notificationView.btnCancelAmend.click();
      await pages.notificationCancelAmend.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Notification view (delete confirmation)', async () => {
      // "No" returns to the view page still in AMEND state, where Delete is available
      await pages.notificationCancelAmend.btnNoReturnToNotification.click();
      await pages.notificationView.amendStatusTag.waitFor();
      await pages.notificationView.btnDelete.click();
      await pages.notificationView.deleteDialog.waitFor();
      await runA11yScan();
    });
  });
});
