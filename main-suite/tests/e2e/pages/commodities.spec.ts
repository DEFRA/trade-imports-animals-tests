import { test, expect } from '@main-fixtures';
import { commodityCodes } from '@main-domain/constants/commodity-codes';
import { camelCaseToTitleCase } from '@main-utils/string-utils';

test.describe('Commodities', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('commoditySelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.commoditySelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.commoditySelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('shows expected commodities in commodity dropdown', async ({ pages }) => {
    const commodityOptions = await pages.commoditySelection.dropdownCommodityOptions.allTextContents();
    const keys = Object.keys(commodityCodes);
    const expectedOptions = keys.map(camelCaseToTitleCase);
    expect(commodityOptions[0]).toBe('Select a commodity');
    expect(commodityOptions[1]).toMatch(/^─+$/);
    // Dropdown commodities must match the expected list (same items and count; order ignored).
    expect(commodityOptions.slice(2)).toHaveLength(expectedOptions.length);
    expect(commodityOptions.slice(2)).toEqual(expect.arrayContaining(expectedOptions));
  });

  test('defaults commodity to "Select a commodity"', async ({ pages }) => {
    // Default "Select a commodity" option has an empty value.
    await expect(pages.commoditySelection.dropdownCommodity.locator('option:checked')).toHaveText('Select a commodity');
    await expect(pages.commoditySelection.dropdownCommodity).toHaveValue('');
  });

  test('continues to species selection after saving selected commodity', async ({ pages }) => {
    await pages.commoditySelection.dropdownCommodity.selectOption(commodityCodes.dog);
    await pages.commoditySelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.speciesSelection.expectedUrl);
    await expect(pages.speciesSelection.heading).toBeVisible();
  });
});
