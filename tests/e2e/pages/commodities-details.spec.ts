import { test, expect } from '@fixtures';
import { commoditySpecies } from '@domain/constants/commodity-species';
import { commodityTypes } from '@domain/constants/commodity-types';

const BISON_DOMESTIC = `${commoditySpecies.bisonBison}, ${commodityTypes.domestic}`;
const BOS_DOMESTIC = `${commoditySpecies.bosSpp}, ${commodityTypes.domestic}`;

test.describe('Commodity details', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toCommodityDetails();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.commodityDetails.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to species selection', async ({ pages }) => {
    await pages.commodityDetails.linkBack.click();
    await expect(pages.page).toHaveURL(pages.importReason.expectedUrl);
    await expect(pages.importReason.heading).toBeVisible();
  });

  test('shows commodity details in table (for selected commodity*)', async ({ pages }) => {
    // Commodity details are currently hardcoded in the view.
    await expect(pages.commodityDetails.rowsCommodities).toHaveCount(1);
    const commodityDetails = await pages.commodityDetails.cellsCommodities(0).allTextContents();
    expect(commodityDetails[0]).toBe('0102');
    expect(commodityDetails[1]).toBe('Live bovine animals');
  });

  test('shows species and type in table (for selected commodity*)', async ({ pages }) => {
    // Species and type are currently hardcoded in the view.
    await expect(pages.commodityDetails.rowsQuantities).toHaveCount(3);
    const speciesAndType = await pages.commodityDetails.rowsQuantities.allTextContents();
    expect(speciesAndType[0]).toContain(BISON_DOMESTIC);
    expect(speciesAndType[1]).toContain(BOS_DOMESTIC);
    expect(speciesAndType[2]).toContain('Subtotal');
  });

  test('shows empty quantity inputs and zero subtotals by default', async ({ pages }) => {
    await expect(pages.commodityDetails.inputNoOfAnimals(BISON_DOMESTIC)).toHaveAttribute('type', 'number');
    await expect(pages.commodityDetails.inputNoOfAnimals(BISON_DOMESTIC)).toHaveText('');
    await expect(pages.commodityDetails.inputNoOfPackages(BOS_DOMESTIC)).toHaveAttribute('type', 'number');
    await expect(pages.commodityDetails.inputNoOfPackages(BOS_DOMESTIC)).toHaveText('');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('0');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('0');
  });

  test('allows entering quantities and updates subtotals', async ({ pages }) => {
    await pages.commodityDetails.inputNoOfAnimals(BISON_DOMESTIC).fill('1');
    await pages.commodityDetails.inputNoOfPackages(BISON_DOMESTIC).fill('99');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('1');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('99');
    await pages.commodityDetails.inputNoOfAnimals(BOS_DOMESTIC).fill('19');
    await pages.commodityDetails.inputNoOfPackages(BOS_DOMESTIC).fill('102');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('20');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('201');
    await pages.commodityDetails.inputNoOfAnimals(BISON_DOMESTIC).fill('256');
    await pages.commodityDetails.inputNoOfPackages(BISON_DOMESTIC).fill('2147483000');
    await pages.commodityDetails.inputNoOfAnimals(BOS_DOMESTIC).fill('256');
    await pages.commodityDetails.inputNoOfPackages(BOS_DOMESTIC).fill('647');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('512');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('2147483647');
  });

  test('continues to animal identification after saving quantities', async ({ pages }) => {
    await pages.commodityDetails.inputNoOfAnimals(BISON_DOMESTIC).fill('1');
    await pages.commodityDetails.inputNoOfPackages(BISON_DOMESTIC).fill('99');
    await pages.commodityDetails.inputNoOfAnimals(BOS_DOMESTIC).fill('99');
    await pages.commodityDetails.inputNoOfPackages(BOS_DOMESTIC).fill('101');
    await pages.commodityDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.animalIdentification.expectedUrl);
    await expect(pages.animalIdentification.heading).toBeVisible();
  });
});
