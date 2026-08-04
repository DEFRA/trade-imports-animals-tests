import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

const otherFoliage = commodityCodes.otherFoliage;
const lens = eppoSpecies[otherFoliage.value][1];

test.describe('Plant-products commodity pages', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await pages.hub.task('Commodity').click();
    await pages.commodityInputMethod.heading.waitFor();
  });

  test('input method renders only manual entry and validates an empty submission', async ({ plantProductsPages: pages }) => {
    await expect(pages.commodityInputMethod.method('Manual entry')).toBeVisible();
    await expect(pages.commodityInputMethod.method('Upload from a CSV file')).toHaveCount(0);

    await pages.commodityInputMethod.saveAndContinue.click();
    await expect(pages.commodityInputMethod.errorSummary).toContainText('Select how you want to add your commodity details');
  });

  test('manual input method persists on the document and resumes, unlike flow-only importType', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.commodityInputMethod.journeyIdFromUrl();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-search').test(`${url.pathname}${url.search}`));
    const persisted = await plantProductsApi.load(reference);
    expect(persisted.commodity?.inputMethod).toBe('MANUAL');
    expect(persisted).not.toHaveProperty('importType');

    await pages.commoditySearch.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference).test(`${url.pathname}${url.search}`));
    await pages.hub.task('Commodity').click();
    await expect(pages.commodityInputMethod.method('Manual entry')).toBeChecked();
  });

  test('search shows no results without inventing a code, then persists the selected code and derived description', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.commodityInputMethod.journeyIdFromUrl();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();

    await pages.commoditySearch.search('99999999');
    await expect(pages.commoditySearch.noResults).toBeVisible();
    await pages.commoditySearch.search(otherFoliage.value);
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-basic-description').test(`${url.pathname}${url.search}`));
    const line = (await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0];
    expect(line).toMatchObject({
      commodityCode: otherFoliage.value,
      commodityDescription: otherFoliage.display,
    });
  });

  test('basic description validates species, then persists fixture-derived join fields in order', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.commodityInputMethod.journeyIdFromUrl();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(otherFoliage.value);

    await pages.commodityBasicDescription.saveAndContinue.click();
    await expect(pages.commodityBasicDescription.errorSummary).toContainText('Select at least one Genus (and Species)');
    for (const species of eppoSpecies[otherFoliage.value]) {
      await pages.commodityBasicDescription.addSpecies(otherFoliage.value, species.genusAndSpecies).click();
    }
    await pages.commodityBasicDescription.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));
    expect((await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]?.species).toEqual(
      eppoSpecies[otherFoliage.value].map((species) => ({ ...species, varieties: [] })),
    );
  });

  test('bulk details exposes every built line control, validates required fields and persists numeric values', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.commodityInputMethod.journeyIdFromUrl();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(otherFoliage.value);
    await pages.commodityBasicDescription.addSpecies(otherFoliage.value, lens.genusAndSpecies).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    await pages.commoditySummary.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-bulk-details').test(`${url.pathname}${url.search}`));
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'Number of packages')).toBeVisible();
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'Type of package')).toBeVisible();
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'Quantity')).toBeVisible();
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'Quantity type')).toBeVisible();
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'Net weight (kg)')).toBeVisible();
    await expect(
      pages.commodityBulkDetails.option(otherFoliage.value, otherFoliage.display, 'Controlled atmosphere container', 'No'),
    ).toBeVisible();
    await expect(
      pages.commodityBulkDetails.option(otherFoliage.value, otherFoliage.display, 'Is the commodity intended for final users?', 'Yes'),
    ).toBeVisible();
    await expect(pages.commodityBulkDetails.field(otherFoliage.value, otherFoliage.display, 'For test and trial')).toBeVisible();

    await pages.commodityBulkDetails.saveAndContinue.click();
    await expect(pages.commodityBulkDetails.errorSummary).toContainText('Enter the number of packages');
    await expect(pages.commodityBulkDetails.errorSummary).toContainText('Select the type of package');
    await expect(pages.commodityBulkDetails.errorSummary).toContainText('Enter the quantity');
    await expect(pages.commodityBulkDetails.errorSummary).toContainText('Select the quantity type');
    await expect(pages.commodityBulkDetails.errorSummary).toContainText('Enter the net weight in kilograms');

    await pages.commodityBulkDetails.fill(otherFoliage.value, otherFoliage.display, {
      numberOfPackages: '11',
      packageType: packageTypes.box.value,
      quantity: '21.5',
      quantityType: quantityTypes.pieces.value,
      netWeight: '31.25',
      controlledAtmosphereContainer: false,
      intendedForFinalUsers: true,
      testAndTrial: false,
    });
    await pages.commodityBulkDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference).test(`${url.pathname}${url.search}`));
    expect((await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]).toMatchObject({
      numberOfPackages: 11,
      packageType: packageTypes.box.value,
      quantity: 21.5,
      quantityType: quantityTypes.pieces.value,
      netWeight: 31.25,
      controlledAtmosphereContainer: false,
      finishedOrPropagated: null,
      intendedForFinalUsers: true,
      testAndTrial: false,
    });
  });
});
