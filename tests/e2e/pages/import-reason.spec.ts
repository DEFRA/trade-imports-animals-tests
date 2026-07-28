import { test, expect } from '@fixtures';

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

  test('continues to commodity details after saving selected reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await pages.importReason.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.commodityDetails.expectedUrl);
    await expect(pages.commodityDetails.heading).toBeVisible();
  });
});
