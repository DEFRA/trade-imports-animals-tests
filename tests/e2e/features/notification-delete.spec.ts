import { test, expect } from '@fixtures';

/**
 * Belt-and-braces duplicate of the frontend canned suite's delete lifecycle (tagged @duplicated-in-frontend
 * — the seam to remove once the frontend net is trusted). Navigates to the notification's own delete
 * URL rather than hunting the (paginated) dashboard.
 */
test.describe('Notification delete', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('deletes a draft notification', async ({ journey, journeyContext, pages }) => {
    test.slow();
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    await pages.page.goto(`/notifications/${journeyId}/delete`);
    await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
    await pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await expect(pages.page.getByText('The notification has been deleted.')).toBeVisible();
  });
  // Fails on EUDPA-389, as cancel-amend does: engine/journey.js:182 passes the
  // actor and records/real/lifecycle/transition.js:44 drops it, so the parties on
  // the NotificationSubmissionDeleted event cannot resolve. Deleting a draft still
  // works — that event is draft-grade. Remove the test.fail() once it lands.
  test.fail(
    'deletes the notification and removes it from the dashboard',
    { tag: '@smoke' },
    async ({ pages, apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.referenceNumber;

      await notificationActions.deleteNotification(referenceNumber);
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    },
  );
});
