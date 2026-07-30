import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Import notification service dashboard', { tag: '@integration' }, () => {
  test('starts a journey at the promoted import-type filter and lists the draft', async ({ journey, pages }) => {
    const journeyId = await journey.startNotification();

    await expect(pages.page).toHaveURL(new RegExp(`/notifications/${journeyId}$`));
    await expect(pages.overview.heading).toBeVisible();

    // The listing is an eventually-consistent read-model, so reload newest-first
    // until the freshly created draft is indexed and tops page one.
    const card = pages.notificationDashboard.notificationCard(journeyId);
    await expect(async () => {
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await expect(card).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();
    await expect(pages.notificationDashboard.resume(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.copyAsNew(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.delete(journeyId)).toBeVisible();
  });
});
