import { test, expect } from '@fixtures';

test.describe('Import notification service', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationDashboard();
  });

  test('lands on the notification dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
    await expect(pages.notificationDashboard.headingPage).toHaveText(pages.notificationDashboard.expectedHeading);
  });

  test('allows creating a new notification', async ({ pages }) => {
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
    await expect(pages.originOfImport.headingPage).toHaveText(pages.originOfImport.expectedHeading);
  });
});
