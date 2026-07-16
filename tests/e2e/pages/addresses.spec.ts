import { test, expect } from '@fixtures';
import { CONSIGNOR_NAME, DESTINATION_NAME } from '@domain/constants/journey-options';

test.describe('Addresses landing page', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('placeOfOriginSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.addresses);
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

  test('can navigate to place of origin selection', async ({ pages }) => {
    await pages.addresses.linkAddPlaceOfOrigin.click();
    await expect(pages.page).toHaveURL(pages.placeOfOriginSelection.expectedUrl);
    await expect(pages.placeOfOriginSelection.heading).toBeVisible();
  });

  test('can navigate to consignor or exporter selection', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await expect(pages.page).toHaveURL(pages.consignorSelection.expectedUrl);
    await expect(pages.consignorSelection.heading).toBeVisible();
  });

  test('can navigate to consignee selection', async ({ pages }) => {
    await pages.addresses.linkAddConsignee.click();
    await expect(pages.page).toHaveURL(pages.consigneeSelection.expectedUrl);
    await expect(pages.consigneeSelection.heading).toBeVisible();
  });

  test('can navigate to importer selection', async ({ pages }) => {
    await pages.addresses.linkAddImporter.click();
    await expect(pages.page).toHaveURL(pages.importerSelection.expectedUrl);
    await expect(pages.importerSelection.heading).toBeVisible();
  });

  test('can navigate to place of destination selection', async ({ pages }) => {
    await pages.addresses.linkAddPlaceOfDestination.click();
    await expect(pages.page).toHaveURL(pages.destinationSelection.expectedUrl);
    await expect(pages.destinationSelection.heading).toBeVisible();
  });

  test('continues to port of entry page after saving with no addresses selected', async ({ pages }) => {
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
  });

  test('continues to port of entry page after saving addresses', async ({ pages }) => {
    await pages.addresses.linkAddConsignorOrExporter.click();
    await pages.consignorSelection.radioConsignorOrExporter(CONSIGNOR_NAME).click();
    await pages.consignorSelection.btnSaveAndContinue.click();
    await pages.addresses.linkAddPlaceOfDestination.click();
    await pages.destinationSelection.radioPlaceOfDestination(DESTINATION_NAME).click();
    await pages.destinationSelection.btnSaveAndContinue.click();
    await pages.addresses.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
  });
});
