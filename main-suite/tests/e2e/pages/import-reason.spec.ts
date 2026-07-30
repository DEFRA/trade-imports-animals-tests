import { test, expect } from '@main-fixtures';

test.describe('Reason for import', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('importReason');
    await apiJourney.resumeInUi(created.referenceNumber, pages.importReason);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.importReason.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to species selection', async ({ pages }) => {
    await pages.importReason.linkBack.click();
    await expect(pages.page).toHaveURL(pages.speciesSelection.expectedUrl);
    await expect(pages.speciesSelection.heading).toBeVisible();
  });

  test('shows reasons and they are unchecked by default', async ({ pages }) => {
    await expect(pages.importReason.radioInternalMarket).toBeVisible();
    await expect(pages.importReason.radioInternalMarket).not.toBeChecked();
    await expect(pages.importReason.radioReEntry).toBeVisible();
    await expect(pages.importReason.radioReEntry).not.toBeChecked();
  });

  test('can select only one reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await expect(pages.importReason.radioInternalMarket).toBeChecked();
    await expect(pages.importReason.radioReEntry).not.toBeChecked();
    await pages.importReason.radioReEntry.click();
    await expect(pages.importReason.radioInternalMarket).not.toBeChecked();
    await expect(pages.importReason.radioReEntry).toBeChecked();
  });

  test('continues to commodity details after saving selected reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await pages.importReason.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.commodityDetails.expectedUrl);
    await expect(pages.commodityDetails.heading).toBeVisible();
  });
});
