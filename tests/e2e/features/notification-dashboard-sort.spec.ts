import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Notification dashboard sort', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  // TODO: only Partial coverage elsewhere (notification-helper.test.js) — it
  // unit-tests parseNotificationSort()'s defaulting logic but no controller
  // test asserts the rendered `selected` option. Remove once closed.
  test('default sort option is "Arrival (newest to oldest)"', async ({ pages }) => {
    const selectedOption = pages.notificationDashboard.dropdownSort.locator('option:checked');
    await expect(selectedOption).toHaveText(sortByValues.arrivalNewestToOldest);
  });

  // TODO: no coverage elsewhere — NOTIFICATION_SORT_OPTIONS' rendered option
  // count/text isn't tested by any controller test. Remove once closed.
  test('sort dropdown contains all four expected options', async ({ pages }) => {
    const options = pages.notificationDashboard.dropdownSort.locator('option');
    await expect(options).toHaveCount(4);
    await expect(options).toHaveText([
      sortByValues.arrivalNewestToOldest,
      sortByValues.arrivalOldestToNewest,
      sortByValues.dateCreatedNewestToOldest,
      sortByValues.dateCreatedOldestToNewest,
    ]);
  });

  for (const value of Object.values(sortByValues)) {
    test(`selecting "${value}" submits and reloads without error`, async ({ pages }) => {
      await pages.notificationDashboard.sortBy(value);
      await expect(pages.page).toHaveURL(/\?sort=/);
      await expect(pages.notificationDashboard.heading).toBeVisible();
      await expect(pages.notificationDashboard.errorSummary).not.toBeVisible();

      // Sort order correctness is covered by lower-level tests; this spec validates sort option submission only.
    });
  }
});
