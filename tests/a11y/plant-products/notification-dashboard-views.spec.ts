import { expect, test, WCAG_STANDARD } from '@fixtures/a11y';
import { sortByValues } from '@domain/shared/constants/sort-by-values';

const seededDeletedReference = 'GBN-PP-26-SEED04';
const seededReferencePrefix = 'GBN-PP-26-SEED';
const createdNotificationsNeededForSecondPage = 23;

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.toNotificationDashboard();
  });

  test('the plant notification dashboard has no accessibility violations in its populated and sorted views', async ({
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    const dashboard = pages.plantNotificationDashboard;

    await test.step('Plant dashboard (populated)', async () => {
      await expect(dashboard.resultRows.first()).toBeVisible();
      await runA11yScan();
    });

    await test.step('Plant dashboard (sorted)', async () => {
      await dashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await dashboard.heading.waitFor();
      await expect(dashboard.resultRows.first()).toBeVisible();
      await runA11yScan();
    });
  });

  test('the plant notification dashboard has no accessibility violations in zero-row and searched views', async ({
    plantProductsPages: pages,
    plantProductsApiJourney: apiJourney,
    plantProductsJourney: journey,
    runA11yScan,
  }) => {
    const dashboard = pages.plantNotificationDashboard;

    await test.step('Plant dashboard (zero visible notifications)', async () => {
      // The compose database is deliberately seeded, and the frontend uses the same
      // zero-row rendering for an empty tenant and filtered/no-match results. Searching
      // for the known DELETED seed reaches that rendering without mutating shared data.
      await dashboard.searchForReference(seededDeletedReference);
      await dashboard.noNotificationsFound.waitFor();
      await runA11yScan();
    });

    await test.step('Plant dashboard (search match)', async () => {
      const created = await apiJourney.createSubmittedNotification();
      await journey.toNotificationDashboard();
      await dashboard.searchForReference(created.referenceNumber);
      await expect(dashboard.row(created.referenceNumber)).toBeVisible();
      await expect(dashboard.resultsLabel).toHaveText('1 result');
      await runA11yScan();
    });

    await test.step('Plant dashboard (search no match)', async () => {
      await dashboard.searchForReference(seededReferencePrefix);
      await dashboard.noNotificationsFound.waitFor();
      await runA11yScan();
    });
  });

  test('the plant notification dashboard has no accessibility violations when paginated', async ({
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    for (let count = 0; count < createdNotificationsNeededForSecondPage; count += 1) {
      await plantProductsApi.create();
    }
    await journey.toNotificationDashboard();
    await pages.plantNotificationDashboard.sortBy(sortByValues.dateCreatedOldestToNewest);
    await pages.plantNotificationDashboard.nextPage.click();
    await pages.plantNotificationDashboard.heading.waitFor();
    await runA11yScan();
  });
});
