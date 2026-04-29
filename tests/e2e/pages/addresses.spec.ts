import { test, expect } from '@fixtures';

test.describe('Addresses landing page', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAddresses();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.addresses.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to accompanying documents', async ({ pages }) => {
    await pages.addresses.linkBack.click();
    // TODO: pending accompanying documents page implementation.
  });

  test('can navigate to consignor or exporter selection', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await expect(pages.page).toHaveURL(pages.consignorSelection.expectedUrl);
    await expect(pages.consignorSelection.heading).toBeVisible();
  });

  test('can navigate to place of destination selection', async ({ pages }) => {
    await pages.addresses.linkAddPlaceOfDestination.click();
    // TODO: pending entry point page implementation.
  });

  test('continues to cph number page after saving with no addresses selected', async ({ pages }) => {
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });

  test('continues to cph number page after saving addresses', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await pages.consignorSelection.linkSelectConsignor(0).click();
    // TODO: Pending implementation of place of destination page.
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });
});
