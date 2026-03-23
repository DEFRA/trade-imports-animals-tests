import { test, expect } from '@fixtures';

test.describe('Admin dashboard', () => {
  test('lands on the admin dashboard', async ({ pages }) => {
    await pages.adminDashboard.open();
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.headingPage).toHaveText(pages.adminDashboard.expectedHeading);
  });

  test('allows navigating to notifications area', async ({ pages }) => {
    await pages.adminDashboard.open();
    await pages.adminDashboard.btnNotifications.click();
    await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
    await expect(pages.adminNotifications.headingPage).toHaveText(pages.adminNotifications.expectedHeading);
  });
});
