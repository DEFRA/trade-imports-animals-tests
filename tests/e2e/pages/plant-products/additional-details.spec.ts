import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { grossVolumeUnits } from '@domain/plant-products/constants/gross-volume-units';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import type { PlantCommodityLineOptions } from '@flows/plant-products/journey';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

const commodity = commodityCodes.otherFoliage;
const species = eppoSpecies[commodity.value][1];
const line: PlantCommodityLineOptions = {
  commodityCode: commodity.value,
  commodityDescription: commodity.display,
  species: [species],
  details: {
    numberOfPackages: '2',
    packageType: packageTypes.box.value,
    quantity: '4',
    quantityType: quantityTypes.pieces.value,
    netWeight: '10',
    controlledAtmosphereContainer: false,
    intendedForFinalUsers: true,
    testAndTrial: false,
  },
};

test.describe('Plant-products additional details page', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await journey.answerCommodities({ lines: [line] });
    await pages.hub.task('Additional details').click();
    await pages.commodityAdditionalDetails.heading.waitFor();
  });

  test('renders all built controls and requires only total gross weight when volume and unit are blank', async ({
    plantProductsPages: pages,
  }) => {
    await expect(pages.commodityAdditionalDetails.totalGrossWeight).toBeVisible();
    await expect(pages.commodityAdditionalDetails.grossVolume).toBeVisible();
    await expect(pages.commodityAdditionalDetails.grossVolumeUnit).toBeVisible();

    await pages.commodityAdditionalDetails.saveAndContinue.click();
    await expect(pages.commodityAdditionalDetails.errorSummary).toContainText('Enter the total gross weight');
    await expect(pages.commodityAdditionalDetails.errorSummary).not.toContainText('Enter the total gross volume');
    await expect(pages.commodityAdditionalDetails.errorSummary).not.toContainText('Select a unit type');
  });

  test('grossVolumeUnit is required iff grossVolume is present in both directions', async ({ plantProductsPages: pages }) => {
    await pages.commodityAdditionalDetails.totalGrossWeight.fill('20');
    await pages.commodityAdditionalDetails.grossVolume.fill('5');
    await pages.commodityAdditionalDetails.saveAndContinue.click();
    await expect(pages.commodityAdditionalDetails.errorSummary).toContainText('Select a unit type');

    await pages.commodityAdditionalDetails.grossVolume.fill('');
    await pages.commodityAdditionalDetails.grossVolumeUnit.selectOption(grossVolumeUnits.litres.value);
    await pages.commodityAdditionalDetails.saveAndContinue.click();
    await expect(pages.commodityAdditionalDetails.errorSummary).toContainText('Enter the total gross volume');
  });

  test('validates both numeric inputs', async ({ plantProductsPages: pages }) => {
    await pages.commodityAdditionalDetails.totalGrossWeight.fill('not-a-number');
    await pages.commodityAdditionalDetails.grossVolume.fill('also-not-a-number');
    await pages.commodityAdditionalDetails.grossVolumeUnit.selectOption(grossVolumeUnits.litres.value);
    await pages.commodityAdditionalDetails.saveAndContinue.click();

    await expect(pages.commodityAdditionalDetails.errorSummary).toContainText('Total gross weight must be a number');
    await expect(pages.commodityAdditionalDetails.errorSummary).toContainText('Total gross volume must be a number');
  });

  test('persists numbers, resumes them, and clearing volume purges its stored unit', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.commodityAdditionalDetails.journeyIdFromUrl();
    await pages.commodityAdditionalDetails.totalGrossWeight.fill('20.5');
    await pages.commodityAdditionalDetails.grossVolume.fill('5.25');
    await pages.commodityAdditionalDetails.grossVolumeUnit.selectOption(grossVolumeUnits.litres.value);
    await pages.commodityAdditionalDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference).test(`${url.pathname}${url.search}`));
    expect((await plantProductsApi.load(reference)).additionalDetails).toMatchObject({
      totalGrossWeight: 20.5,
      grossVolume: 5.25,
      grossVolumeUnit: grossVolumeUnits.litres.value,
    });

    await pages.hub.task('Additional details').click();
    await expect(pages.commodityAdditionalDetails.totalGrossWeight).toHaveValue('20.5');
    await expect(pages.commodityAdditionalDetails.grossVolume).toHaveValue('5.25');
    await expect(pages.commodityAdditionalDetails.grossVolumeUnit).toHaveValue(grossVolumeUnits.litres.value);
    await pages.commodityAdditionalDetails.grossVolume.fill('');
    await pages.commodityAdditionalDetails.grossVolumeUnit.selectOption('');
    await pages.commodityAdditionalDetails.saveAndContinue.click();

    const cleared = (await plantProductsApi.load(reference)).additionalDetails;
    expect(cleared?.grossVolume).toBeNull();
    expect(cleared?.grossVolumeUnit).toBeNull();
  });
});
