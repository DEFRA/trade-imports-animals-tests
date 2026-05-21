import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/constants/commodity-codes';
import { camelCaseToTitleCase } from '@utils/string-utils';

test.describe('Commodities', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toCommoditySelection();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.commoditySelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
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
