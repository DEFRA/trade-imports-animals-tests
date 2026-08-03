import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/shared/constants/sort-by-values';
import { SET_BASES } from '@page-objects/base/sets';

const SEEDED_DRAFT_REFERENCE = 'GBN-PP-26-SEED01';
const SEEDED_DELETED_REFERENCE = 'GBN-PP-26-SEED04';
const PAGE_SIZE = 25;
const CREATED_NOTIFICATIONS_NEEDED_FOR_SECOND_PAGE = 23;

const isPlantDashboardUrl = (url: URL): boolean => new RegExp(`^${SET_BASES.plantProducts}(?:\\?|$)`).test(`${url.pathname}${url.search}`);

test.describe('Plant-products dashboard pagination', { tag: '@integration' }, () => {
  test('uses 25-row pages and preserves page through sort while search resets it', async ({
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    for (let notificationCount = 0; notificationCount < CREATED_NOTIFICATIONS_NEEDED_FOR_SECOND_PAGE; notificationCount += 1) {
      await plantProductsApi.create();
    }
    await journey.toNotificationDashboard();
    const dashboard = pages.plantNotificationDashboard;
    await dashboard.sortBy(sortByValues.dateCreatedOldestToNewest);

    await expect(dashboard.resultsLabel).toHaveText(new RegExp(`^Showing 1 to ${PAGE_SIZE} of \\d+ results$`));
    await expect(dashboard.referenceRowHeaders).toHaveCount(PAGE_SIZE);
    await expect(dashboard.nextPage).toBeVisible();
    await expect(dashboard.row(SEEDED_DELETED_REFERENCE)).toHaveCount(0);
    await expect(dashboard.referenceRowHeaders.first()).toHaveText(SEEDED_DRAFT_REFERENCE);

    await dashboard.nextPage.click();

    await expect(pages.page).toHaveURL(
      (url) => isPlantDashboardUrl(url) && url.searchParams.get('page') === '2' && url.searchParams.get('sort') === 'createdAt,asc',
    );
    await expect(dashboard.previousPage).toBeVisible();
    await expect(dashboard.resultsLabel).toHaveText(/^Showing 26 to \d+ of \d+ results$/);
    await expect(dashboard.row(SEEDED_DELETED_REFERENCE)).toHaveCount(0);
    await expect(dashboard.referenceRowHeaders.first()).toHaveText(/.+/);
    await expect(dashboard.referenceRowHeaders.first()).not.toHaveText(SEEDED_DRAFT_REFERENCE);

    await dashboard.sortBy(sortByValues.dateCreatedNewestToOldest);

    await expect(pages.page).toHaveURL(
      (url) => isPlantDashboardUrl(url) && url.searchParams.get('page') === '2' && url.searchParams.get('sort') === 'createdAt,desc',
    );

    await dashboard.searchForReference(SEEDED_DRAFT_REFERENCE);

    await expect(pages.page).toHaveURL(
      (url) =>
        isPlantDashboardUrl(url) &&
        url.searchParams.get('referenceNumber') === SEEDED_DRAFT_REFERENCE &&
        url.searchParams.get('sort') === 'createdAt,desc' &&
        url.searchParams.get('page') === null,
    );
    await expect(dashboard.referenceRowHeaders).toHaveText([SEEDED_DRAFT_REFERENCE]);
  });
});
