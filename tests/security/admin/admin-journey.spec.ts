import { test, expect } from '@fixtures';

test.describe('Security scan (admin)', { tag: '@security' }, () => {
  test('routes the admin journey through the ZAP proxy', async ({ apiJourney, adminNavigation, pages }) => {
    test.slow();
    // Seeded via API, bypassing the ZAP proxy on purpose — the frontend
    // submission journey is already scanned elsewhere.
    const notification = await apiJourney.createSubmittedNotification();

    await adminNavigation.toAdminDashboard();
    await expect(pages.adminDashboard.heading).toBeVisible();

    await adminNavigation.toNotifications();
    await expect(pages.adminNotifications.heading).toBeVisible();

    await adminNavigation.toOutboxEvents(notification.referenceNumber);
    await expect(pages.adminOutboxEvents.heading).toBeVisible();
  });
});
