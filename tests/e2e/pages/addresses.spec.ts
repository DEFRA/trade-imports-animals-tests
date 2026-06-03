import { test, expect } from '@fixtures';

test.describe('Addresses landing page', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAddresses();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.addresses.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to accompanying documents', async ({ pages }) => {
    await pages.addresses.linkBack.click();
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.heading).toBeVisible();
  });

  test('can navigate to consignor or exporter selection', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await expect(pages.page).toHaveURL(pages.consignorSelection.expectedUrl);
    await expect(pages.consignorSelection.heading).toBeVisible();
  });

  test('can navigate to place of destination selection', async ({ pages }) => {
    await pages.addresses.linkAddPlaceOfDestination.click();
    await expect(pages.page).toHaveURL(pages.destinationSelection.expectedUrl);
    await expect(pages.destinationSelection.heading).toBeVisible();
  });

  test('continues to cph number page after saving with no addresses selected', async ({ pages }) => {
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });

  test('continues to cph number page after saving addresses', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await pages.consignorSelection.linkSelectConsignor(0).click();
    await pages.addresses.linkAddPlaceOfDestination.click();
    await pages.destinationSelection.linkSelectDestination(0).click();
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });
});
