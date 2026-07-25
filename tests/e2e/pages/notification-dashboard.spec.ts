import { test, expect } from '@fixtures';

test.describe('Import notification service dashboard', { tag: '@integration' }, () => {
  test('starts a journey at the promoted import-type filter and lists the draft', async ({ journey, pages }) => {
    const journeyId = await journey.startNotification();

    await expect(pages.page).toHaveURL(new RegExp(`/notifications/${journeyId}$`));
    await expect(pages.overview.heading).toBeVisible();

    await pages.notificationDashboard.open();
    const card = pages.notificationDashboard.notificationCard(journeyId);
    await expect(card).toBeVisible();
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();
    await expect(pages.notificationDashboard.resume(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.copyAsNew(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.delete(journeyId)).toBeVisible();
  });
});
