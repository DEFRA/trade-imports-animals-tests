import { test, expect } from '@fixtures';
import { commodityTypes } from '@domain/constants/commodity-types';
import { commoditySpecies } from '@domain/constants/commodity-species';

test.describe('Select species of commodity', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('speciesSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.speciesSelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.speciesSelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to commodity selection', async ({ pages }) => {
    await pages.speciesSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.commoditySelection.expectedUrl);
    await expect(pages.commoditySelection.heading).toBeVisible();
  });

  // TODO: no coverage elsewhere — the hardcoded commodity-details table
  // content (select/index.njk) isn't asserted by any controller test.
  // Remove once closed.
  test('shows commodity details in table (for selected commodity*)', async ({ pages }) => {
    await expect(pages.speciesSelection.rowsCommodities).toHaveCount(1);
    const commodityDetails = await pages.speciesSelection.cellsCommodities(0).allTextContents();
    // Cells are hardcoded: 'Cow' is literal in commodities/select/index.njk; code/description come from select/mock-commodity-details.json. Update when that view is parameterised on the session commodity.
    expect(commodityDetails[0]).toBe('0102');
    expect(commodityDetails[1]).toBe('Cow');
    expect(commodityDetails[2]).toBe('Live bovine animals');
  });

  // TODO: no coverage elsewhere — the GET controller test only covers a
  // session with typeOfCommodity already set; no empty-session default
  // test exists. Remove once closed.
  test('defaults type to "Select type of commodity"', async ({ pages }) => {
    // Default "Select type of commodity" option has an empty value.
    await expect(pages.speciesSelection.dropdownCommodityType.locator('option:checked')).toHaveText('Select type of commodity');
    await expect(pages.speciesSelection.dropdownCommodityType).toHaveValue('');
  });

  // TODO: only Partial coverage elsewhere (controller.test.js) — the GET
  // test asserts checked-flags only for a session with one species
  // pre-selected, not the fully-unselected default. Remove once closed.
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

  test('continues to reason for import after saving selected species', async ({ pages }) => {
    await pages.speciesSelection.dropdownCommodityType.selectOption(commodityTypes.domestic);
    await pages.speciesSelection.checkboxSpecies(commoditySpecies.bisonBison).check();
    await pages.speciesSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.importReason.expectedUrl);
    await expect(pages.importReason.heading).toBeVisible();
  });
});
