import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

/**
 * Belt-and-braces duplicate of the frontend canned suite's delete lifecycle (tagged @duplicated-in-frontend
 * — the seam to remove once the frontend net is trusted). Runs against the real-mode :3100 target. Navigates
 * to the notification's own delete URL rather than hunting the (paginated) dashboard.
 */
test.describe('Notification delete', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('deletes a draft notification', async ({ journey, journeyContext, pages }) => {
    test.slow();
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    await pages.page.goto(`${SET_BASES.liveAnimals}/notifications/${journeyId}/delete`);
    await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
    await pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await expect(pages.page.getByText('The notification has been deleted.')).toBeVisible();
  });
  test(
    'deletes the notification and removes it from the dashboard',
    { tag: '@smoke' },
    async ({ pages, apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.id;

      await notificationActions.deleteNotification(referenceNumber);
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    },
  );
});
