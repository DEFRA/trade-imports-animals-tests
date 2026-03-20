import { test, expect } from '@fixtures';

test.describe('Import notification dashboard', () => {
  test('lands on the notification dashboard', async ({ pages }) => {
    await pages.notificationDashboard.open();
    await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
    await expect(pages.notificationDashboard.headingPage).toHaveText(pages.notificationDashboard.expectedHeading);
  });

  test('allows creating a new notification', async ({ pages }) => {
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
    await expect(pages.originOfImport.headingPage).toHaveText(pages.originOfImport.expectedHeading);
  });
});
