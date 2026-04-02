import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/types/country-codes';
import { commodityCodes } from '@domain/types/commodity-codes';
import { camelCaseToTitleCase } from '@utils/string-utils';

test.describe('Commodities', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toCommoditySelection({ countryCode: countryCodes.eu.france });
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.commoditySelection.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
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
    await expect(pages.speciesSelection.headingPage).toHaveText(pages.speciesSelection.expectedHeading);
  });
});
