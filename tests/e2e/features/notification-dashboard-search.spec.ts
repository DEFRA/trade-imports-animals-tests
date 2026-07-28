import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

const NO_MATCH_REFERENCE_NUMBER = 'GBN-AG-26-ZZZZZZ';

test.describe('Notification dashboard search', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('returns matching notification when searching by complete reference number', async ({ pages, apiJourney, journey }) => {
    const created = await apiJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(created.referenceNumber);

    await expect(pages.page).toHaveURL(new RegExp(`[?&]referenceNumber=${created.referenceNumber.replace(/-/g, '\\-')}(?:&|$)`));
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
    await expect(pages.notificationDashboard.notificationCard(0).details.heading).toContainText(created.referenceNumber);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('Showing 1 Results');
  });

  test('opens notification view when clicking View after searching by reference number', async ({ pages, apiJourney, journey }) => {
    const created = await apiJourney.createSubmittedNotification();
    const referenceNumber = created.referenceNumber;
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(referenceNumber);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);

    await pages.notificationDashboard.viewLink(referenceNumber).click();

    await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('shows no notifications found when search has no matches', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await expect(pages.page).toHaveURL(new RegExp(`[?&]referenceNumber=${NO_MATCH_REFERENCE_NUMBER.replace(/-/g, '\\-')}(?:&|$)`));
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
  });

  test('shows no notifications found when search text is free text', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference('not-a-valid-reference');

    await expect(pages.page).toHaveURL(/referenceNumber=not-a-valid-reference/);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
    await expect(pages.notificationDashboard.errorSummary).not.toBeVisible();
  });

  test('preserves referenceNumber when updating sort after search', async ({ pages, apiJourney, journey }) => {
    const created = await apiJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(created.referenceNumber);
    await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);

    await expect(pages.page).toHaveURL(new RegExp(`referenceNumber=${created.referenceNumber.replace(/-/g, '\\-')}`));
    await expect(pages.page).toHaveURL(/sort=createdAt%2Cdesc/);
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(created.referenceNumber);
  });

  test('preserves referenceNumber in the URL when a page param is present', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await pages.page.goto(`/?referenceNumber=${NO_MATCH_REFERENCE_NUMBER}&page=2`);
    await pages.notificationDashboard.heading.waitFor();
    await pages.notificationDashboard.waitForNotificationList();

    await expect(pages.page).toHaveURL(new RegExp(`referenceNumber=${NO_MATCH_REFERENCE_NUMBER.replace(/-/g, '\\-')}`));
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(NO_MATCH_REFERENCE_NUMBER);
  });
});
