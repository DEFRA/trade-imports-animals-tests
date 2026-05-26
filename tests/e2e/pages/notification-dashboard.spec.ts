import { test, expect } from '@fixtures';

test.describe('Import notification service', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationDashboard();
  });

  test('lands on the notification dashboard', async ({ pages }) => {
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

  test('displays details on the first notification card', async ({ pages }) => {
    const firstCard = pages.notificationDashboard.notificationCard(0);

    await expect(firstCard.heading).toBeVisible();
    await expect(firstCard.heading).toContainText(/GBN-AG-\d{2}-[A-Z0-9]+/);
    await expect(firstCard.commodity).toBeVisible();
    await expect(firstCard.origin).toBeVisible();
    await expect(firstCard.arrivalAtDestination).toContainText(/\d{1,2} \w+ \d{4}/);
    await expect(firstCard.status).toBeVisible();
    await expect(firstCard.status).toContainText(/Draft|Submitted/);
    await expect(firstCard.dateCreated).toBeVisible();
    await expect(firstCard.dateCreated).toHaveText(/Date created: \d{1,2} \w+ \d{4}/);
  });
});
