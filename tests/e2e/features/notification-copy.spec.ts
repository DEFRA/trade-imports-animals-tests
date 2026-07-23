import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Notification copy', () => {
  test('copies draft notification from the view screen and redirects to the new draft', async ({
    pages,
    apiJourney,
    notificationActions,
  }) => {
    const created = await apiJourney.createFullNotification();
    const originalReferenceNumber = created.referenceNumber;

    await notificationActions.toNotificationView(originalReferenceNumber);
    await pages.notificationView.btnCopyAsNew.click();

    await pages.notificationView.heading.waitFor();
    const referenceNumber = await pages.notificationView.referenceNumberCaption.textContent();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(referenceNumber));
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(referenceNumber).not.toEqual(originalReferenceNumber);

    // Field retention/reset is covered by lower-level tests; this spec validates the copy feature only.
  });

  // TODO: use the dashboard search feature (in progress) to locate the notification by
  // reference instead of sorting + relying on it landing on the first page — the sort-based
  // lookup can miss the target under parallel test execution.
  test(
    'copies submitted notification from the dashboard and redirects to the new draft',
    { tag: ['@smoke', '@flaky'] },
    async ({ pages, apiJourney, journey }) => {
      const created = await apiJourney.createSubmittedNotification();
      const originalReferenceNumber = created.referenceNumber;

      await journey.toNotificationDashboard();
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await pages.notificationDashboard.btnCopyAsNew(originalReferenceNumber).click();

      await pages.notificationView.heading.waitFor();
      const referenceNumber = await pages.notificationView.referenceNumberCaption.textContent();
      await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(referenceNumber));
      expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
      expect(referenceNumber).not.toEqual(originalReferenceNumber);

      // Field retention/reset is covered by lower-level tests; this spec validates the copy feature only.
    },
  );
});
