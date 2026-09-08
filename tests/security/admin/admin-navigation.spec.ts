import { test, expect } from '@fixtures';

test.describe('Security scan (admin)', { tag: '@active' }, () => {
  test('routes admin navigation through the ZAP proxy', async ({ seededJourney, adminNavigation, pages }) => {
    test.slow();
    // Seeded through the frontend. The seed context carries this project's
    // proxy, so the seeding traffic reaches ZAP like everything else here.
    const referenceNumber = await seededJourney.createSubmittedNotification();

    await adminNavigation.toAdminDashboard();
    await expect(pages.adminDashboard.heading).toBeVisible();

    await adminNavigation.toNotifications();
    await expect(pages.adminNotifications.heading).toBeVisible();

    await adminNavigation.toOutboxEvents(referenceNumber);
    await expect(pages.adminOutboxEvents.heading).toBeVisible();
  });
});
