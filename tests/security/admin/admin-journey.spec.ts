import { test, expect } from '@fixtures';

test.describe('Security scan (admin)', { tag: '@security' }, () => {
  test('routes the admin journey through the ZAP proxy', async ({ journey, journeyContext, adminNavigation, pages }) => {
    test.slow();
    await journey.submitNotification();

    await adminNavigation.toAdminDashboard();
    await expect(pages.adminDashboard.heading).toBeVisible();

    await adminNavigation.toNotifications();
    await expect(pages.adminNotifications.heading).toBeVisible();

    await adminNavigation.toOutboxEvents(journeyContext.journeyId);
    await expect(pages.adminOutboxEvents.heading).toBeVisible();
  });
});
