import { test, expect } from '@fixtures';

test.describe('Addresses landing page', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAddresses();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.addresses.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to accompanying documents', async ({ pages }) => {
    await pages.addresses.linkBack.click();
    // TODO: pending accompanying documents page implementation.
  });

  test('can navigate to consignor or exporter page', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    // TODO: pending consignor or exporter page implementation.
  });

  test('can navigate to consignee page', async ({ pages }) => {
    await pages.addresses.linkAddConsignee.click();
    // TODO: pending consignee page implementation.
  });

  test('can navigate to importer page', async ({ pages }) => {
    await pages.addresses.linkAddImporter.click();
    // TODO: pending importer page implementation.
  });

  test('can navigate to place of destination page', async ({ pages }) => {
    await pages.addresses.linkAddPlaceOfDestination.click();
    // TODO: pending place of destination page implementation
  });

  test('continues to CPH number page after saving addresses', async ({ pages }) => {
    // TODO: Implement address input.
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });
});
