import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/types/country-codes';
import { commodityCodes } from '@domain/types/commodity-codes';
import { commodityTypes } from '@domain/types/commodity-types';
import { commoditySpecies } from '@domain/types/commodity-species';

test.describe('Reason for import', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await pages.originOfImport.dropdownCountry.selectOption(countryCodes.eu.france);
    await pages.originOfImport.btnSaveAndContinue.click();
    await pages.commoditySelection.dropdownCommodity.selectOption(commodityCodes.dog);
    await pages.commoditySelection.btnSaveAndContinue.click();
    await pages.speciesSelection.dropdownCommodityType.selectOption(commodityTypes.domestic);
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison).check();
    await pages.speciesSelection.btnSaveAndContinue.click();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.importReason.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to species selection', async ({ pages }) => {
    await pages.importReason.linkBack.click();
    await expect(pages.page).toHaveURL(pages.speciesSelection.expectedUrl);
    await expect(pages.speciesSelection.headingPage).toHaveText(pages.speciesSelection.expectedHeading);
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

  test('continues (to next page*) after saving selected reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await pages.importReason.btnSaveAndContinue.click();
    // Temporary behaviour: currently reloads this page; update when next-step navigation is implemented.
    await expect(pages.page).toHaveURL(pages.importReason.expectedUrl);
    await expect(pages.importReason.headingPage).toHaveText(pages.importReason.expectedHeading);
  });
});
