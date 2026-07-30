import { test, expect } from '@main-fixtures';
import { seedNotifications } from '@main-flows/api-journey';

/** Matches `notification.list.page-size` in trade-imports-animals-backend application.yml */
const NOTIFICATION_LIST_PAGE_SIZE = 25;

test.describe('Import notification service - dashboard pagination', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test.describe('Dashboard pagination', () => {
    // beforeAll can't use the test-scoped apiJourney fixture.
    test.beforeAll(async () => {
      /** Enough to guarantee a second page regardless of how much other data already exists. */
      const seedCount = NOTIFICATION_LIST_PAGE_SIZE + 1;
      await seedNotifications(seedCount);
    });

    test('starts on page one when opening the dashboard', async ({ pages }) => {
      expect(pages.notificationDashboard.currentPageFromUrl()).toBe(1);
      await expect(pages.page).not.toHaveURL(/\?page=/);
      await expect(pages.notificationDashboard.totalResults).toHaveText(/^Showing 1 /);
      await expect(pages.notificationDashboard.nextPageNumberLabel).toHaveText(/^2 of \d+$/);
    });

    test('navigates to the next page and shows a different set of notifications', async ({ pages }) => {
      const firstPageReference = (await pages.notificationDashboard.notificationCard(0).details.heading.textContent())?.trim();

      await pages.notificationDashboard.linkNextPage.click();

      await expect(pages.page).toHaveURL(/\?page=2/);
      await expect(pages.notificationDashboard.linkPreviousPage).toBeVisible();
      await expect(pages.notificationDashboard.totalResults).toHaveText(
        new RegExp(`Showing ${NOTIFICATION_LIST_PAGE_SIZE + 1} to \\d+ of \\d+ Results`),
      );

      const secondPageReference = (await pages.notificationDashboard.notificationCard(0).details.heading.textContent())?.trim();
      expect(secondPageReference).toBeTruthy();
      expect(secondPageReference).not.toBe(firstPageReference);
    });

    test('navigates back to the previous page from page two', async ({ pages }) => {
      await pages.notificationDashboard.linkNextPage.click();
      await expect(pages.page).toHaveURL(/\?page=2/);

      await pages.notificationDashboard.linkPreviousPage.click();

      await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
      await expect(pages.notificationDashboard.linkPreviousPage).not.toBeVisible();
      await expect(pages.notificationDashboard.linkNextPage).toBeVisible();
      const resultsRange = await pages.notificationDashboard.getResultsRange();
      if (!resultsRange) {
        throw new Error('Expected results range label after returning to page one');
      }
      await expect(pages.notificationDashboard.totalResults).toHaveText(pages.notificationDashboard.formatResultsRangeLabel(resultsRange));
    });

    test('navigates to the last page of results', async ({ pages }) => {
      const firstPageReference = (await pages.notificationDashboard.notificationCard(0).details.heading.textContent())?.trim();

      const lastPageNumber = await pages.notificationDashboard.goToLastPage();

      expect(lastPageNumber).toBeGreaterThan(1);
      await expect(pages.page).toHaveURL(new RegExp(`\\?page=${lastPageNumber}(?:&|$)`));
      await expect(pages.notificationDashboard.linkNextPage).not.toBeVisible();
      await expect(pages.notificationDashboard.linkPreviousPage).toBeVisible();

      const cardCount = await pages.notificationDashboard.notificationCards.count();
      expect(cardCount).toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(NOTIFICATION_LIST_PAGE_SIZE);

      const lastPageResults = (await pages.notificationDashboard.totalResults.textContent()) ?? '';
      expect(lastPageResults).toMatch(/Showing .+ of (\d+) Results/);
      const total = Number(lastPageResults.match(/of (\d+) Results/)?.[1]);
      const rangeMatch = lastPageResults.match(/Showing (\d+) to (\d+) of \d+ Results/);
      const singleMatch = lastPageResults.match(/Showing (\d+) of \d+ Results/);
      const end = rangeMatch ? Number(rangeMatch[2]) : singleMatch ? Number(singleMatch[1]) : NaN;
      expect(end).toBe(total);

      const lastPageReference = (await pages.notificationDashboard.notificationCard(0).details.heading.textContent())?.trim();
      expect(lastPageReference).toBeTruthy();
      expect(lastPageReference).not.toBe(firstPageReference);
    });
  });
});
