import { test, expect } from '@fixtures';

test.describe('Admin service', () => {
  test.beforeEach(async ({ adminJourneys }) => {
    await adminJourneys.toAdminDashboard();
  });

  test('lands on the admin dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.heading).toBeVisible();
  });

  test('allows navigating to notifications area', async ({ pages }) => {
    await pages.adminDashboard.btnNotifications.click();
    await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
    await expect(pages.adminNotifications.heading).toBeVisible();
  });

  test(
    'shows pagination on the notifications page when there are more than one page of results',
    { tag: '@compose' },
    async ({ pages }) => {
      await pages.adminDashboard.btnNotifications.click();
      await expect(pages.adminNotifications.pagination).toBeVisible();
    },
  );
});
