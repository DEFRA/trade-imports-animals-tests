import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Notification copy', () => {
  test('copies draft notification from the view screen and redirects to the new draft', async ({ pages, journeys, journeyContext }) => {
    await journeys.toDeclaration();
    const originalReferenceNumber = journeyContext.notificationId;

    await journeys.toNotificationView(originalReferenceNumber);
    await pages.notificationView.btnCopyAsNew.click();

    await pages.notificationView.heading.waitFor();
    const referenceNumber = await pages.notificationView.referenceNumberCaption.textContent();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(referenceNumber));
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(referenceNumber).not.toEqual(originalReferenceNumber);

    // Field retention/reset is covered by lower-level tests; this spec validates the copy feature only.
  });

  test('copies submitted notification from the dashboard and redirects to the new draft', async ({ pages, journeys, journeyContext }) => {
    await journeys.submitNotification();
    const originalReferenceNumber = journeyContext.notificationId;

    await journeys.toNotificationDashboard();
    await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
    await pages.notificationDashboard.btnCopyAsNew(originalReferenceNumber).click();

    await pages.notificationView.heading.waitFor();
    const referenceNumber = await pages.notificationView.referenceNumberCaption.textContent();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(referenceNumber));
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(referenceNumber).not.toEqual(originalReferenceNumber);

    // Field retention/reset is covered by lower-level tests; this spec validates the copy feature only.
  });
});
