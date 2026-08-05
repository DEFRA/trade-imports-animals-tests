import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/shared/constants/sort-by-values';
import { SET_BASES } from '@page-objects/base/sets';

const NO_MATCH_REFERENCE_NUMBER = 'GBN-AG-26-ZZZZZZ';

test.describe('Notification dashboard search', () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey }) => {
    await journey.toNotificationDashboard();
  });

  test('displays the filter notifications search form', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.notificationDashboard.filterHeading).toBeVisible();
    await expect(pages.notificationDashboard.searchForm).toBeVisible();
    await expect(pages.notificationDashboard.inputReferenceSearch).toBeVisible();
    await expect(pages.notificationDashboard.btnSearch).toBeVisible();
  });

  test('returns matching notification when searching by complete reference number', async ({
    liveAnimalsPages: pages,
    liveAnimalsApiJourney: apiJourney,
    liveAnimalsJourney: journey,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(created.id);

    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('referenceNumber') === created.id,
    );
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
    await expect(pages.notificationDashboard.notificationCardDetails(0).heading).toContainText(created.id);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('Showing 1 Result');
  });

  test('opens notification view when clicking View after searching by reference number', async ({
    liveAnimalsPages: pages,
    liveAnimalsApiJourney: apiJourney,
    liveAnimalsJourney: journey,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    const referenceNumber = created.id;
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(referenceNumber);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);

    await pages.notificationDashboard.viewLink(referenceNumber).click();

    await expect(pages.page).toHaveURL((url) => url.pathname === pages.notificationView.expectedUrl(referenceNumber));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('shows no notifications found when search has no matches', async ({ liveAnimalsPages: pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('referenceNumber') === NO_MATCH_REFERENCE_NUMBER,
    );
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
  });

  test('shows no notifications found when search text is free text', async ({ liveAnimalsPages: pages }) => {
    await pages.notificationDashboard.searchForReference('not-a-valid-reference');

    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('referenceNumber') === 'not-a-valid-reference',
    );
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
    await expect(pages.notificationDashboard.errorSummary).not.toBeVisible();
  });

  test('preserves referenceNumber when updating sort after search', async ({
    liveAnimalsPages: pages,
    liveAnimalsApiJourney: apiJourney,
    liveAnimalsJourney: journey,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(created.id);
    await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);

    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('referenceNumber') === created.id,
    );
    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('sort') === 'createdAt,desc',
    );
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(created.id);
  });

  test('preserves referenceNumber in the URL when a page param is present', async ({ liveAnimalsPages: pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await pages.page.goto(`${SET_BASES.liveAnimals}?referenceNumber=${NO_MATCH_REFERENCE_NUMBER}&page=2`);
    await pages.notificationDashboard.heading.waitFor();
    await pages.notificationDashboard.waitForNotificationList();

    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.liveAnimals && url.searchParams.get('referenceNumber') === NO_MATCH_REFERENCE_NUMBER,
    );
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(NO_MATCH_REFERENCE_NUMBER);
  });
});
