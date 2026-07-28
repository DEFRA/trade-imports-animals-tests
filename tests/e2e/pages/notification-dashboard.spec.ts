import { test, expect } from '@fixtures';
import { seedNotifications } from '@flows/api-journey';

test.describe('Import notification service', () => {
  test.beforeAll(async () => {
    await seedNotifications(1);
  });

  test.describe('dashboard basics', () => {
    test.beforeEach(async ({ journey }) => {
      await journey.toNotificationDashboard();
    });

    test('lands on the notification dashboard', { tag: '@smoke' }, async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
      await expect(pages.notificationDashboard.heading).toBeVisible();
    });

    test('allows creating a new notification', async ({ pages }) => {
      await pages.notificationDashboard.btnCreateNewNotification.click();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      await expect(pages.originOfImport.heading).toBeVisible();
    });

    test('displays the notification list on the home page', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
      await expect(pages.notificationDashboard.heading).toBeVisible();
      await expect(pages.notificationDashboard.totalResults).toBeVisible();
      await expect(pages.notificationDashboard.totalResults).toHaveText(/\d+ Results/);
    });
  });

  test.describe('notification card actions by status', () => {
    test('shows view and copy as new for a draft notification', async ({ pages, journey, apiJourney }) => {
      const created = await apiJourney.createFullNotification();
      const referenceNumber = created.referenceNumber;

      await journey.toNotificationDashboard();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
      await expect(pages.notificationDashboard.notificationCard(0).details.status).toContainText('Draft');

      await expect(pages.notificationDashboard.viewLink(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.btnCopyAsNew(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.btnAmend(referenceNumber)).not.toBeVisible();
    });

    test('shows view, copy as new and amend for a submitted notification', async ({ pages, journey, apiJourney }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.referenceNumber;

      await journey.toNotificationDashboard();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
      await expect(pages.notificationDashboard.notificationCard(0).details.status).toContainText('Submitted');

      await expect(pages.notificationDashboard.viewLink(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.btnCopyAsNew(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.btnAmend(referenceNumber)).toBeVisible();
    });

    test('shows only view for an amend notification', async ({ pages, journey, apiJourney }) => {
      const created = await apiJourney.createAmendNotification();
      const referenceNumber = created.referenceNumber;

      await journey.toNotificationDashboard();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
      await expect(pages.notificationDashboard.notificationCard(0).details.status).toContainText('Amend');

      await expect(pages.notificationDashboard.viewLink(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.btnCopyAsNew(referenceNumber)).not.toBeVisible();
      await expect(pages.notificationDashboard.btnAmend(referenceNumber)).not.toBeVisible();
    });
  });
});
