import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/shared/constants/sort-by-values';
import { SET_BASES } from '@page-objects/base/sets';

const CREATED_ASCENDING_SEEDED_REFERENCES = ['GBN-PP-26-SEED01', 'GBN-PP-26-SEED02', 'GBN-PP-26-SEED03'];
const LATER_ARRIVAL = '2099-12-31';
const MIDDLE_ARRIVAL = '2099-12-30';
const EARLIER_ARRIVAL = '2099-12-29';

const sortOptions = [
  { label: sortByValues.arrivalNewestToOldest, token: 'arrivalDate,desc' },
  { label: sortByValues.arrivalOldestToNewest, token: 'arrivalDate,asc' },
  { label: sortByValues.dateCreatedNewestToOldest, token: 'createdAt,desc' },
  { label: sortByValues.dateCreatedOldestToNewest, token: 'createdAt,asc' },
] as const;

const isPlantDashboardUrl = (url: URL): boolean => new RegExp(`^${SET_BASES.plantProducts}(?:\\?|$)`).test(`${url.pathname}${url.search}`);

test.describe('Plant-products dashboard sort', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.toNotificationDashboard();
  });

  test('default sort option is "Arrival (newest to oldest)"', async ({ plantProductsPages: pages }) => {
    const selectedOption = pages.plantNotificationDashboard.sort.locator('option:checked');
    await expect(selectedOption).toHaveText(sortByValues.arrivalNewestToOldest);
  });

  test('sort dropdown contains all four expected options in order', async ({ plantProductsPages: pages }) => {
    const options = pages.plantNotificationDashboard.sort.locator('option');
    await expect(options).toHaveText([
      sortByValues.arrivalNewestToOldest,
      sortByValues.arrivalOldestToNewest,
      sortByValues.dateCreatedNewestToOldest,
      sortByValues.dateCreatedOldestToNewest,
    ]);
  });

  for (const { label, token } of sortOptions) {
    test(`selecting "${label}" submits the corresponding sort`, async ({ plantProductsPages: pages }) => {
      await pages.plantNotificationDashboard.sortBy(label);

      await expect(pages.page).toHaveURL((url) => isPlantDashboardUrl(url) && url.searchParams.get('sort') === token);
      await expect(pages.plantNotificationDashboard.heading).toBeVisible();
    });
  }

  test('date created oldest to newest puts the three seeded references first in exact order', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;

    await dashboard.sortBy(sortByValues.dateCreatedOldestToNewest);

    await expect(pages.page).toHaveURL((url) => isPlantDashboardUrl(url) && url.searchParams.get('sort') === 'createdAt,asc');
    for (const [index, reference] of CREATED_ASCENDING_SEEDED_REFERENCES.entries()) {
      await expect(dashboard.referenceRowHeaders.nth(index)).toHaveText(reference);
    }
  });

  test('arrival newest to oldest orders three API-created far-future arrivals by descending date', async ({
    plantProductsApi,
    plantProductsApiJourney: apiJourney,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const earlier = await apiJourney.createFullNotification();
    await plantProductsApi.replace(earlier.referenceNumber, {
      ...earlier,
      transport: { ...(earlier.transport ?? {}), arrivalDate: EARLIER_ARRIVAL },
    });
    const middle = await apiJourney.createFullNotification();
    await plantProductsApi.replace(middle.referenceNumber, {
      ...middle,
      transport: { ...(middle.transport ?? {}), arrivalDate: MIDDLE_ARRIVAL },
    });
    const later = await apiJourney.createFullNotification();
    await plantProductsApi.replace(later.referenceNumber, {
      ...later,
      transport: { ...(later.transport ?? {}), arrivalDate: LATER_ARRIVAL },
    });
    await journey.toNotificationDashboard();
    const dashboard = pages.plantNotificationDashboard;

    await dashboard.sortBy(sortByValues.arrivalNewestToOldest);

    await expect(pages.page).toHaveURL((url) => isPlantDashboardUrl(url) && url.searchParams.get('sort') === 'arrivalDate,desc');
    const createdReferences = new Set([later.referenceNumber, middle.referenceNumber, earlier.referenceNumber]);
    await expect
      .poll(async () =>
        (await dashboard.referenceRowHeaders.allTextContents())
          .map((reference) => reference.trim())
          .filter((reference) => createdReferences.has(reference)),
      )
      .toEqual([later.referenceNumber, middle.referenceNumber, earlier.referenceNumber]);
  });
});
