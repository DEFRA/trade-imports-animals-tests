import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

test.describe('Notification delete', () => {
  test.describe('delete button and dialog', () => {
    test.beforeEach(async ({ apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      await notificationActions.toNotificationView(created.referenceNumber);
    });

    test('shows the delete button for a submitted notification', async ({ pages }) => {
      await expect(pages.notificationView.btnDelete).toBeVisible();
    });

    test('opens the confirmation dialog when delete is clicked', async ({ pages }) => {
      await pages.notificationView.btnDelete.click();
      await expect(pages.notificationView.deleteDialog).toBeVisible();
    });

    test('closes the dialog without deleting when cancel is clicked', async ({ pages }) => {
      await pages.notificationView.btnDelete.click();
      await pages.notificationView.btnCancelDelete.click();
      await expect(pages.notificationView.deleteDialog).not.toBeVisible();
      await expect(pages.notificationView.heading).toBeVisible();
    });
  });

  test('deletes the notification and removes it from the dashboard', async ({ pages, apiJourney, journeyContext, notificationActions }) => {
    const created = await apiJourney.createSubmittedNotification();
    const referenceNumber = created.referenceNumber ?? journeyContext.referenceNumber;

    await notificationActions.toNotificationView(referenceNumber);

    await pages.notificationView.btnDelete.click();
    await pages.notificationView.btnConfirmDelete.click();

    await expect(pages.notificationView.successBanner).toBeVisible();

    // The JS redirects to / after 3 seconds
    await pages.notificationDashboard.heading.waitFor({ timeout: timeouts.medium });
    await expect(pages.notificationDashboard.viewLink(referenceNumber)).not.toBeVisible();
  });
});
