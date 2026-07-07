import { test } from '@fixtures/a11y';

test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test('the notification view page has no accessibility violations in its SUBMITTED, AMEND and delete-confirmation states', async ({
    notificationJourney,
    notificationActions,
    pages,
    journeyContext,
    runA11yScan,
  }) => {
    await test.step('Notification view (SUBMITTED)', async () => {
      await notificationJourney.submitNotification();
      await notificationActions.toNotificationView(journeyContext.notificationId);
      await runA11yScan();
    });

    await test.step('Notification view (AMEND)', async () => {
      await pages.notificationView.btnAmend.click();
      await pages.notificationView.amendStatusTag.waitFor();
      await runA11yScan();
    });

    await test.step('Notification view (delete confirmation)', async () => {
      await pages.notificationView.btnDelete.click();
      await pages.notificationView.deleteDialog.waitFor();
      await runA11yScan();
    });
  });
});
