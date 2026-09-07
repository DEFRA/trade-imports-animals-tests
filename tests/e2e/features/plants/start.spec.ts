import { test, expect } from '@fixtures';

/**
 * The plants reference has no type-code prefix: the backend's
 * ReferenceNumberGenerator mints {YY}-{XXXXXX} over a Crockford-style alphabet,
 * and the frontend's real records adapter carries it through as the journey id.
 * Assert the shape, never a literal — the prefix is still unagreed.
 */
const PLANTS_REFERENCE = /^\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;

test.describe('High-risk plants start section', { tag: '@integration' }, () => {
  test('the dashboard renders after signing in', { tag: '@smoke' }, async ({ pages }) => {
    await pages.plantsDashboard.open();

    await expect(pages.page).toHaveURL(pages.plantsDashboard.expectedUrl);
    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.btnStartNewNotification).toBeVisible();
    await expect(pages.plantsDashboard.errorSummary).not.toBeVisible();
  });

  test('starting a notification lands on the Overview with the journey strip', async ({ pages, plantsJourney, journeyContext }) => {
    const reference = await plantsJourney.startNotification();

    expect(reference).toMatch(PLANTS_REFERENCE);
    expect(journeyContext.referenceNumber).toBe(reference);
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.heading).toBeVisible();

    await expect(pages.plantsOverview.journeyStrip).toBeVisible();
    await expect(pages.plantsOverview.statusTag).toHaveText('Draft');
    await expect(pages.plantsOverview.reference).toHaveText(reference);

    // The hub landed with every group empty, and a group with no rows is not
    // rendered — each section's own spec asserts its row as that page lands.
    await expect(pages.plantsOverview.taskLists).toHaveCount(0);
    await expect(pages.plantsOverview.groupHeadings).toHaveCount(0);

    await expect(pages.plantsOverview.btnReturnToDashboard).toHaveAttribute('href', '/');
    await expect(pages.plantsOverview.linkBack).toHaveAttribute('href', '/');
  });

  test('the new draft is listed on the dashboard and Resume reopens it', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.returnToDashboard();
    await pages.plantsDashboard.searchForReference(reference);

    await expect(pages.plantsDashboard.notificationCard(reference)).toBeVisible();
    await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Draft');

    await pages.plantsDashboard.resume(reference).click();

    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.heading).toBeVisible();
  });

  test('No, return to dashboard leaves the notification untouched', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await expect(pages.page).toHaveURL(pages.plantsDeleteNotification.expectedUrl(reference));
    await expect(pages.plantsDeleteNotification.heading).toBeVisible();
    await expect(pages.plantsDeleteNotification.body).toBeVisible();
    await expect(pages.plantsDeleteNotification.btnNo).toHaveAttribute('href', '/');

    await pages.plantsDeleteNotification.btnNo.click();

    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.deletedBanner).toHaveCount(0);

    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference)).toBeVisible();
    await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Draft');
  });

  test('Yes, delete notification soft-deletes it and drops it from the listing', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await pages.plantsDeleteNotification.btnConfirm.click();

    await expect(pages.page).toHaveURL('/?deleted=1');
    await expect(pages.plantsDashboard.deletedBanner).toContainText('Notification deleted');
    await expect(pages.plantsDashboard.deletedBanner).toContainText('The notification has been deleted.');

    // DELETED rows are filtered out of the listing, so the reference now
    // matches nothing — proved against the search, not against page one.
    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference)).toHaveCount(0);
  });
});
