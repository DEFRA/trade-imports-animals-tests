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

    // Deliberate duplicate: proves the real backend renders this status
    // correctly in a live browser, not just the mocked controller test.
    test('displays details on the first notification card', async ({ pages }) => {
      await expect(pages.notificationDashboard.notificationCards.first()).toBeVisible();
      const firstCard = pages.notificationDashboard.notificationCard(0);

      await expect(firstCard.details.heading).toBeVisible();
      await expect(firstCard.details.heading).toContainText(/GBN-AG-\d{2}-[A-Z0-9]+/);
      await expect(firstCard.details.commodity).toBeVisible();
      await expect(firstCard.details.origin).toBeVisible();
      await expect(firstCard.details.arrivalAtDestination).toContainText(/\d{1,2} \w+ \d{4}/);
      await expect(firstCard.details.status).toBeVisible();
      await expect(firstCard.details.status).toContainText(/Draft|Submitted|Amend/);
      await expect(firstCard.details.dateCreated).toBeVisible();
      await expect(firstCard.details.dateCreated).toHaveText(/Date created: \d{1,2} \w+ \d{4}/);
    });
  });

  test.describe('notification card actions by status', () => {
    // Deliberate duplicate: proves the real backend renders this status
    // correctly in a live browser, not just the mocked controller test.
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

    // Deliberate duplicate: proves the real backend renders this status
    // correctly in a live browser, not just the mocked controller test.
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

    // Deliberate duplicate: proves the real backend renders this status
    // correctly in a live browser, not just the mocked controller test.
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
