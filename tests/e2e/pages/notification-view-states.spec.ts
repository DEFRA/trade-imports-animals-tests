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

    test('copies the submitted notification to a new draft', async ({ pages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.journeyId;
      await pages.notificationView.btnCopyAsNew.click();

      await pages.overview.heading.waitFor();
      const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(
        /GBN-AG-\d{2}-[0-9A-Z]{6}/,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
    });

    test('still renders the recorded answers after submission', async ({ pages }) => {
      await expect(pages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(pages.notificationView.summaryCard('Cow (0102) — Bos taurus')).toBeVisible();
    });
  });

  test.describe('COPY OF SUBMITTED', () => {
    test('saves an edited answer and submits the copy end to end', async ({ journey, journeyContext, pages }) => {
      test.slow();
      await journey.submitNotification();
      const originalReferenceNumber = journeyContext.journeyId;

      await pages.notificationView.open(originalReferenceNumber);
      await pages.notificationView.btnCopyAsNew.click();
      await pages.overview.heading.waitFor();

      const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(
        /GBN-AG-\d{2}-[0-9A-Z]{6}/,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);

      await pages.overview.task('Where is this consignment coming from?').click();
      await pages.originOfImport.heading.waitFor();
      await pages.originOfImport.internalReference.fill('Imports789GB');
      await pages.originOfImport.saveAndContinue.click();
      await pages.overview.heading.waitFor();
      await expect(pages.page.getByText('Sorry, there is a problem with the service')).toHaveCount(0);

      await pages.overview.task('Check and submit').click();
      await pages.notificationView.heading.waitFor();
      await expect(pages.notificationView.journeyStrip).toContainText(copiedReferenceNumber);
      await pages.notificationView.continueButton.click();
      await pages.declaration.heading.waitFor();
      await pages.declaration.confirmation.check();
      await pages.declaration.continueButton.click();

      await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
      await expect(pages.page.getByText('Sorry, there is a problem with the service')).toHaveCount(0);

      await pages.notificationView.open(copiedReferenceNumber);
      await expect(pages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Submitted');
    });
  });
});
