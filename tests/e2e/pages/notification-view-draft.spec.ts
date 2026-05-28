import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { Journeys, JourneyContext } from '@flows/journeys';

test.describe('Notification view (DRAFT)', () => {
  let referenceNumber: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pages = createPageObjects(page);
    const journeyContext: JourneyContext = {};
    const journeys = new Journeys(pages, journeyContext);
    await journeys.toReview();
    referenceNumber = journeyContext.notificationId;
    await context.close();
  });

  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationView(referenceNumber);
  });

  test('shows Change links for all sections', async ({ pages }) => {
    await expect(pages.notificationView.changeLink('Where is this consignment coming from?')).toBeVisible();
    await expect(pages.notificationView.changeLink('Your commodities')).toBeVisible();
    await expect(pages.notificationView.changeLink('Additional information details')).toBeVisible();
    await expect(pages.notificationView.changeLink('Reason for importing the animals')).toBeVisible();
    await expect(pages.notificationView.changeLink('Addresses')).toBeVisible();
    await expect(pages.notificationView.changeLink('County Parish Holding number (CPH)')).toBeVisible();
    await expect(pages.notificationView.changeLink('Transport details')).toBeVisible();
    await expect(pages.notificationView.changeLink('Accompanying documents')).toBeVisible();
  });

  test('shows Confirm and submit button', async ({ pages }) => {
    await expect(pages.notificationView.btnConfirmAndSubmit).toBeVisible();
  });

  test('Confirm and submit navigates to declaration', async ({ pages }) => {
    await pages.notificationView.btnConfirmAndSubmit.click();
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
    await expect(pages.declaration.heading).toBeVisible();
  });

  test('Change link for origin navigates to origin page', async ({ pages }) => {
    await pages.notificationView.changeLink('Where is this consignment coming from?').click();
    await expect(pages.originOfImport.heading).toBeVisible();
  });

  test('Change link for commodities navigates to commodities page', async ({ pages }) => {
    await pages.notificationView.changeLink('Your commodities').click();
    await expect(pages.commoditySelection.heading).toBeVisible();
  });

  test('Change link for additional details navigates to additional details page', async ({ pages }) => {
    await pages.notificationView.changeLink('Additional information details').click();
    await expect(pages.additionalDetails.heading).toBeVisible();
  });

  test('Change link for import reason navigates to import reason page', async ({ pages }) => {
    await pages.notificationView.changeLink('Reason for importing the animals').click();
    await expect(pages.importReason.heading).toBeVisible();
  });

  test('Change link for addresses navigates to addresses page', async ({ pages }) => {
    await pages.notificationView.changeLink('Addresses').click();
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('Change link for CPH navigates to CPH number page', async ({ pages }) => {
    await pages.notificationView.changeLink('County Parish Holding number (CPH)').click();
    await expect(pages.cphNumber.heading).toBeVisible();
  });

  test('Change link for transport navigates to transporter page', async ({ pages }) => {
    await pages.notificationView.changeLink('Transport details').click();
    await expect(pages.transporter.heading).toBeVisible();
  });

  test('Change link for accompanying documents navigates to accompanying documents page', async ({ pages }) => {
    await pages.notificationView.changeLink('Accompanying documents').click();
    await expect(pages.accompanyingDocuments.heading).toBeVisible();
  });
});
