import { test, expect } from '@fixtures';
import { commodityTypes } from '@domain/types/commodity-types';
import { commoditySpecies } from '@domain/types/commodity-species';
import { camelCaseToTitleCase } from '@utils/string-utils';

test.describe('Select species of commodity', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toSpeciesSelection();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.speciesSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to commodity selection', async ({ pages }) => {
    await pages.speciesSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.commoditySelection.expectedUrl);
    await expect(pages.commoditySelection.headingPage).toHaveText(pages.commoditySelection.expectedHeading);
  });

  test('shows commodity details in table (for selected commodity*)', async ({ pages }) => {
    // Commodity details are currently hardcoded in the view.
    await expect(pages.speciesSelection.tableBodyRowsCommodities).toHaveCount(1);
    const commodityDetails = await pages.speciesSelection.tableBodyRowCellsCommodities(0).allTextContents();
    expect(commodityDetails[0]).toBe('0102');
    expect(commodityDetails[1]).toBe('Cow');
    expect(commodityDetails[2]).toBe('Live bovine animals');
  });

  test('shows expected types in commodity type dropdown', async ({ pages }) => {
    const commodityTypeOptions = await pages.speciesSelection.dropdownCommodityTypeOptions.allTextContents();
    const keys = Object.keys(commodityTypes);
    const expectedOptions = keys.map(camelCaseToTitleCase);
    expect(commodityTypeOptions[0]).toBe('Select type of commodity');
    expect(commodityTypeOptions[1]).toMatch(/^─+$/);
    expect(commodityTypeOptions.slice(2)).toHaveLength(expectedOptions.length);
    expect(commodityTypeOptions.slice(2)).toEqual(expect.arrayContaining(expectedOptions));
  });

  test('defaults type to "Select type of commodity"', async ({ pages }) => {
    // Default "Select type of commodity" option has an empty value.
    await expect(pages.speciesSelection.dropdownCommodityType.locator('option:checked')).toHaveText('Select type of commodity');
    await expect(pages.speciesSelection.dropdownCommodityType).toHaveValue('');
  });

  test('shows expected species (for selected type*) with each species option unchecked by default', async ({ pages }) => {
    // Species are not currently filtered by commodity type.
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison)).toBeVisible();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp)).toBeVisible();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus)).toBeVisible();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis)).toBeVisible();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis)).not.toBeChecked();
  });

  test('can select one or more species options and deselect one', async ({ pages }) => {
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison).check();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis)).not.toBeChecked();

    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp).check();
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus).check();
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis).check();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis)).toBeChecked();

    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison).uncheck();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison)).not.toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosSpp)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bosTaurus)).toBeChecked();
    await expect(pages.speciesSelection.checkboxSpecies(commoditySpecies.bubalusBubalis)).toBeChecked();
  });

  test('continues to reason for import after saving selected species', async ({ pages }) => {
    await pages.speciesSelection.dropdownCommodityType.selectOption(commodityTypes.domestic);
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison).check();
    await pages.speciesSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.importReason.expectedUrl);
    await expect(pages.importReason.headingPage).toHaveText(pages.importReason.expectedHeading);
  });
});
