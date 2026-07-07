import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { NotificationJourney, type JourneyContext } from '@flows/notification-journey';

test.describe('Notification delete', () => {
  test.describe('delete button and dialog', () => {
    let referenceNumber: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const pages = createPageObjects(page);
      const journeyContext: JourneyContext = {};
      const notificationJourney = new NotificationJourney(pages, journeyContext);
      await notificationJourney.submitNotification();
      referenceNumber = journeyContext.notificationId;
      await context.close();
    });

    test.beforeEach(async ({ notificationActions }) => {
      await notificationActions.toNotificationView(referenceNumber);
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

  test(
    'deletes the notification and removes it from the dashboard',
    { tag: ['@integration'] },
    async ({ pages, notificationJourney, journeyContext, notificationActions }) => {
      await notificationJourney.submitNotification();
      const referenceNumber = journeyContext.notificationId;

      await notificationActions.toNotificationView(referenceNumber);

      await pages.notificationView.btnDelete.click();
      await pages.notificationView.btnConfirmDelete.click();

      await expect(pages.notificationView.successBanner).toBeVisible();

      // The JS redirects to / after 3 seconds
      await pages.notificationDashboard.heading.waitFor({ timeout: 10000 });
      await expect(pages.notificationDashboard.viewLink(referenceNumber)).not.toBeVisible();
    },
  );
});
