import { test, expect } from '@fixtures';

/**
 * Belt-and-braces duplicate of the frontend canned suite's delete lifecycle (tagged @duplicated-in-frontend
 * — the seam to remove once the frontend net is trusted). Runs against the real-mode :3100 target. Navigates
 * to the notification's own delete URL rather than hunting the (owner-scoped, paginated) dashboard.
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
});
