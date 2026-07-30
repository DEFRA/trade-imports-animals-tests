import { test, expect } from '@fixtures';

test.describe('Notification view states', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ apiJourney, notificationActions, journeyContext }) => {
      await apiJourney.createFullNotification();
      await notificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages }) => {
      await expect(pages.notificationView.heading).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Movement' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Addresses' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Documents' })).toHaveCount(0);
      await expect(pages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(pages.notificationView.summaryCard('Cow (0102) — Bos taurus')).toContainText('Number of animals');
    });

    test('shows the Draft strip with the notification reference', async ({ pages, journeyContext }) => {
      await expect(pages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Draft');
      await expect(pages.notificationView.journeyStrip).toContainText(journeyContext.journeyId);
    });

    test('shows Change links for the recorded answers', async ({ pages }) => {
      await expect(pages.notificationView.changeLink('Change country of origin')).toBeVisible();
      await expect(pages.notificationView.changeLink('Change commodity 1')).toBeVisible();
    });

    test('offers submission and none of the post-submit actions', async ({ pages }) => {
      await expect(pages.page.getByRole('heading', { name: 'Now submit your notification' })).toBeVisible();
      await expect(pages.notificationView.continueButton).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toHaveCount(0);
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
      await expect(pages.notificationView.cancelAmendment).toHaveCount(0);
    });

    test('Continue moves on to the declaration', async ({ pages }) => {
      await pages.notificationView.continueButton.click();
      await expect(pages.page).toHaveURL(/\/declaration$/);
      await expect(pages.declaration.heading).toBeVisible();
    });
  });

  test.describe('SUBMITTED', () => {
    test.beforeEach(async ({ apiJourney, notificationActions, journeyContext }) => {
      await apiJourney.createSubmittedNotification();
      await notificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('lands on the view page with the Submitted strip and reference', async ({ pages, journeyContext }) => {
      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationView.expectedUrl(journeyContext.journeyId)}$`));
      await expect(pages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Submitted');
      await expect(pages.notificationView.journeyStrip).toContainText(journeyContext.journeyId);
    });

    test('offers Copy as new and Delete on the read-only view', async ({ pages }) => {
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toBeVisible();
      await expect(pages.notificationView.cancelAmendment).toHaveCount(0);
    });

    test('still renders the recorded answers after submission', async ({ pages }) => {
      await expect(pages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(pages.notificationView.summaryCard('Cow (0102) — Bos taurus')).toBeVisible();
    });
  });
});
