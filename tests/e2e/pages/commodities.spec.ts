import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/types/country-codes';
import { commodityCodes } from '@domain/types/commodity-codes';
import { camelCaseToTitleCase } from '@utils/string-utils';

test.describe('Select a commodity', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await pages.originOfImport.dropdownCountry.selectOption(countryCodes.eu.france);
    await pages.originOfImport.btnSaveAndContinue.click();
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

  test('continues after saving selected commodity (pending next-step implementation)', async ({ pages }) => {
    await pages.commoditySelection.dropdownCommodity.selectOption(commodityCodes.dog);
    await pages.commoditySelection.btnSaveAndContinue.click();
    // Temporary AC behavior: currently reloads this page; update when next-step navigation is implemented.
    await expect(pages.page).toHaveURL(pages.commoditySelection.expectedUrl);
    await expect(pages.commoditySelection.headingPage).toHaveText(pages.commoditySelection.expectedHeading);
  });
});
