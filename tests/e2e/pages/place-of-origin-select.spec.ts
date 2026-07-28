import { test, expect } from '@fixtures';

test.describe('Place of origin selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('placeOfOriginSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.placeOfOriginSelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.placeOfOriginSelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.placeOfOriginSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.placeOfOriginSelection.expectedUrl);
    const errorItems = await pages.placeOfOriginSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select a place of origin');
  });

  test('returns to addresses after selecting a place of origin', async ({ pages }) => {
    await pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm').click();
    await pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    const cells = pages.addresses.cellsPlaceOfOrigin;
    await expect(cells.nth(0)).toHaveText('Origin Farm');
    await expect(cells.nth(2)).toHaveText('Ireland');
  });
});
