import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/shared/constants/sort-by-values';
import { SET_BASES } from '@page-objects/base/sets';

const SEEDED_DRAFT_REFERENCE = 'GBN-PP-26-SEED01';
const SEEDED_SUBMITTED_REFERENCE = 'GBN-PP-26-SEED02';
const SEEDED_AMEND_REFERENCE = 'GBN-PP-26-SEED03';
const SEEDED_DELETED_REFERENCE = 'GBN-PP-26-SEED04';
const DATE_FILTER_ARRIVAL = '2098-06-15';
const COUNTRY_FILTER_FR_ARRIVAL = '2097-12-25';
const COUNTRY_FILTER_NON_FR_ARRIVAL = '2097-12-24';

const isPlantDashboardUrl = (url: URL): boolean => new RegExp(`^${SET_BASES.plantProducts}(?:\\?|$)`).test(`${url.pathname}${url.search}`);

test.describe('Plant-products dashboard search and filters', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.toNotificationDashboard();
  });

  test('displays the search and filter controls exposed by the plant dashboard', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;

    await expect(dashboard.filterHeading).toBeVisible();
    await expect(dashboard.keywordsOrReference).toBeVisible();
    await expect(dashboard.status).toBeVisible();
    await expect(dashboard.countryOfOrigin).toBeVisible();
    await expect(dashboard.startDate.getByLabel('Day')).toBeVisible();
    await expect(dashboard.startDate.getByLabel('Month')).toBeVisible();
    await expect(dashboard.startDate.getByLabel('Year')).toBeVisible();
    await expect(dashboard.endDate.getByLabel('Day')).toBeVisible();
    await expect(dashboard.endDate.getByLabel('Month')).toBeVisible();
    await expect(dashboard.endDate.getByLabel('Year')).toBeVisible();
    await expect(dashboard.searchButton).toBeVisible();
    await expect(dashboard.clearFilters).toBeVisible();
  });

  test('exact reference search excludes the DELETED seed and returns the known DRAFT seed', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;

    await dashboard.searchForReference(SEEDED_DELETED_REFERENCE);

    await expect(pages.page).toHaveURL(
      (url) => isPlantDashboardUrl(url) && url.searchParams.get('referenceNumber') === SEEDED_DELETED_REFERENCE,
    );
    await expect(dashboard.referenceRowHeaders).toHaveCount(0);
    await expect(dashboard.noNotificationsFound).toBeVisible();
    await expect(dashboard.resultsLabel).toHaveText('0 results');

    await dashboard.searchForReference(SEEDED_DRAFT_REFERENCE);

    await expect(pages.page).toHaveURL(
      (url) => isPlantDashboardUrl(url) && url.searchParams.get('referenceNumber') === SEEDED_DRAFT_REFERENCE,
    );
    await expect(dashboard.referenceRowHeaders).toHaveText([SEEDED_DRAFT_REFERENCE]);
    await expect(dashboard.row(SEEDED_DELETED_REFERENCE)).toHaveCount(0);
    await expect(dashboard.resultsLabel).toHaveText('1 result');
  });

  test('partial reference search returns no matches because lookup is exact', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;
    const partialReference = 'GBN-PP-26-SEED';

    await dashboard.searchForReference(partialReference);

    await expect(pages.page).toHaveURL((url) => isPlantDashboardUrl(url) && url.searchParams.get('referenceNumber') === partialReference);
    await expect(dashboard.referenceRowHeaders).toHaveCount(0);
    await expect(dashboard.noNotificationsFound).toBeVisible();
    await expect(dashboard.resultsLabel).toHaveText('0 results');
  });

  test('free-text search returns no matches because lookup is by reference', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;
    const freeText = 'hyacinths from France';

    await dashboard.searchForReference(freeText);

    await expect(pages.page).toHaveURL((url) => isPlantDashboardUrl(url) && url.searchParams.get('referenceNumber') === freeText);
    await expect(dashboard.referenceRowHeaders).toHaveCount(0);
    await expect(dashboard.noNotificationsFound).toBeVisible();
    await expect(dashboard.resultsLabel).toHaveText('0 results');
  });

  test('a new search resets page while preserving the selected sort', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;
    await pages.page.goto(`${SET_BASES.plantProducts}?page=2&sort=createdAt%2Casc`);
    await dashboard.heading.waitFor();

    await dashboard.searchForReference(SEEDED_DRAFT_REFERENCE);

    await expect(pages.page).toHaveURL(
      (url) =>
        isPlantDashboardUrl(url) &&
        url.searchParams.get('referenceNumber') === SEEDED_DRAFT_REFERENCE &&
        url.searchParams.get('sort') === 'createdAt,asc' &&
        url.searchParams.get('page') === null,
    );
    await expect(dashboard.referenceRowHeaders).toHaveText([SEEDED_DRAFT_REFERENCE]);
  });

  test('status filter keeps only rows with the selected seeded status', async ({ plantProductsPages: pages }) => {
    const dashboard = pages.plantNotificationDashboard;
    await dashboard.sortBy(sortByValues.dateCreatedOldestToNewest);

    await dashboard.status.selectOption({ label: 'Draft' });
    await dashboard.searchButton.click();

    await expect(pages.page).toHaveURL(
      (url) => isPlantDashboardUrl(url) && url.searchParams.get('status') === 'draft' && url.searchParams.get('sort') === 'createdAt,asc',
    );
    await expect(dashboard.row(SEEDED_DRAFT_REFERENCE)).toBeVisible();
    await expect(dashboard.row(SEEDED_SUBMITTED_REFERENCE)).toHaveCount(0);
    await expect(dashboard.row(SEEDED_AMEND_REFERENCE)).toHaveCount(0);
    await expect(dashboard.row(SEEDED_DELETED_REFERENCE)).toHaveCount(0);
  });

  test('country filter includes a French arrival and excludes a non-French arrival', async ({
    plantProductsApi,
    plantProductsApiJourney: apiJourney,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const nonFrench = await apiJourney.createFullNotification();
    await plantProductsApi.replace(nonFrench.referenceNumber, {
      ...nonFrench,
      transport: { ...(nonFrench.transport ?? {}), arrivalDate: COUNTRY_FILTER_NON_FR_ARRIVAL },
    });
    const french = await apiJourney.createFullNotification();
    await plantProductsApi.replace(french.referenceNumber, {
      ...french,
      origin: { ...(french.origin ?? {}), countryCode: 'FR' },
      transport: { ...(french.transport ?? {}), arrivalDate: COUNTRY_FILTER_FR_ARRIVAL },
    });
    await journey.toNotificationDashboard();
    const dashboard = pages.plantNotificationDashboard;
    await dashboard.sortBy(sortByValues.arrivalNewestToOldest);

    await dashboard.countryOfOrigin.selectOption('FR');
    await dashboard.searchButton.click();

    await expect(pages.page).toHaveURL(
      (url) =>
        isPlantDashboardUrl(url) && url.searchParams.get('countryOfOrigin') === 'FR' && url.searchParams.get('sort') === 'arrivalDate,desc',
    );
    await expect(dashboard.row(french.referenceNumber)).toBeVisible();
    await expect(dashboard.row(nonFrench.referenceNumber)).toHaveCount(0);
  });

  test('arrival date range includes an API-created dated row and excludes undated seeds', async ({
    plantProductsApi,
    plantProductsApiJourney: apiJourney,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    await plantProductsApi.replace(created.referenceNumber, {
      ...created,
      transport: { ...(created.transport ?? {}), arrivalDate: DATE_FILTER_ARRIVAL },
    });
    await journey.toNotificationDashboard();
    const dashboard = pages.plantNotificationDashboard;

    await dashboard.startDate.getByLabel('Day').fill('15');
    await dashboard.startDate.getByLabel('Month').fill('6');
    await dashboard.startDate.getByLabel('Year').fill('2098');
    await dashboard.endDate.getByLabel('Day').fill('15');
    await dashboard.endDate.getByLabel('Month').fill('6');
    await dashboard.endDate.getByLabel('Year').fill('2098');
    await dashboard.searchButton.click();

    await expect(pages.page).toHaveURL(
      (url) =>
        isPlantDashboardUrl(url) &&
        url.searchParams.get('startDate-day') === '15' &&
        url.searchParams.get('startDate-month') === '6' &&
        url.searchParams.get('startDate-year') === '2098' &&
        url.searchParams.get('endDate-day') === '15' &&
        url.searchParams.get('endDate-month') === '6' &&
        url.searchParams.get('endDate-year') === '2098',
    );
    await expect(dashboard.row(created.referenceNumber)).toBeVisible();
    await expect(dashboard.row(SEEDED_DRAFT_REFERENCE)).toHaveCount(0);
    await expect(dashboard.row(SEEDED_SUBMITTED_REFERENCE)).toHaveCount(0);
    await expect(dashboard.row(SEEDED_AMEND_REFERENCE)).toHaveCount(0);
    await expect(dashboard.row(SEEDED_DELETED_REFERENCE)).toHaveCount(0);

    await dashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
    await expect(pages.page).toHaveURL(
      (url) =>
        isPlantDashboardUrl(url) &&
        url.searchParams.get('sort') === 'createdAt,desc' &&
        url.searchParams.get('startDate-year') === '2098' &&
        url.searchParams.get('endDate-year') === '2098',
    );
  });
});
