import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@flows/journey';
import { commoditySpecies } from '@domain/constants/commodity-species';
import { commodityTypes } from '@domain/constants/commodity-types';

const BISON_DOMESTIC = `${commoditySpecies.bisonBison}, ${commodityTypes.domestic}`;
const BOS_DOMESTIC = `${commoditySpecies.bosSpp}, ${commodityTypes.domestic}`;

test.describe('Animal identification details', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAnimalIdentification();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.animalIdentification.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to commodity details', async ({ pages }) => {
    await pages.animalIdentification.linkBack.click();
    await expect(pages.page).toHaveURL(pages.commodityDetails.expectedUrl);
    await expect(pages.commodityDetails.heading).toBeVisible();
  });

  test('shows commodity details in table (for selected commodity*)', async ({ pages }) => {
    // Commodity details are hardcoded in the view, but species name, type, and animal count are carried over.
    const defaults = defaultJourneyOptions;
    await expect(pages.animalIdentification.rowsCommodities).toHaveCount(2);
    const firstCommodityDetails = await pages.animalIdentification.cellsCommodities(0).allTextContents();
    expect(firstCommodityDetails[0]).toBe('0102');
    expect(firstCommodityDetails[1]).toBe('Live bovine animals');
    expect(firstCommodityDetails[2]).toBe(BISON_DOMESTIC);
    expect(firstCommodityDetails[3]).toBe(String((defaults.noOfAnimals as number[])[0]));
    const secondCommodityDetails = await pages.animalIdentification.cellsCommodities(1).allTextContents();
    expect(secondCommodityDetails[0]).toBe('0102');
    expect(secondCommodityDetails[1]).toBe('Live bovine animals');
    expect(secondCommodityDetails[2]).toBe(BOS_DOMESTIC);
    expect(secondCommodityDetails[3]).toBe(String((defaults.noOfAnimals as number[])[1]));
  });

  test('shows empty animal identifiers for each animal by default', async ({ pages }) => {
    // Currently limited to one animal identifier per species; species name and type are carried over.
    await expect(pages.animalIdentification.rowsIdentifiers).toHaveCount(2);
    await expect(pages.animalIdentification.cellIdentifiers(0, BISON_DOMESTIC)).toBeVisible();
    await expect(pages.animalIdentification.inputEarTag(0)).toHaveValue('');
    await expect(pages.animalIdentification.inputPassport(0)).toHaveValue('');
    await expect(pages.animalIdentification.cellIdentifiers(1, BOS_DOMESTIC)).toBeVisible();
    await expect(pages.animalIdentification.inputEarTag(1)).toHaveValue('');
    await expect(pages.animalIdentification.inputPassport(1)).toHaveValue('');
  });

  test('can enter animal identifiers for each animal', async ({ pages }) => {
    const firstEarTag = 'FR123456789012?`';
    const firstPassport = 'FR-BOV-2024-001234';
    const secondEarTag = '#FR123456789013!';
    const secondPassport = 'FR-BOV-2024-001235';
    await pages.animalIdentification.inputEarTag(0).fill(firstEarTag);
    await pages.animalIdentification.inputPassport(0).fill(firstPassport);
    await pages.animalIdentification.inputEarTag(1).fill(secondEarTag);
    await pages.animalIdentification.inputPassport(1).fill(secondPassport);
    await expect(pages.animalIdentification.inputEarTag(0)).toHaveValue(firstEarTag);
    await expect(pages.animalIdentification.inputPassport(0)).toHaveValue(firstPassport);
    await expect(pages.animalIdentification.inputEarTag(1)).toHaveValue(secondEarTag);
    await expect(pages.animalIdentification.inputPassport(1)).toHaveValue(secondPassport);
  });

  test('continues to additional details after saving identification details', async ({ pages }) => {
    await pages.animalIdentification.inputEarTag(0).fill('FR123456789020');
    await pages.animalIdentification.inputPassport(0).fill('FR-BOV-2024-001240');
    await pages.animalIdentification.inputEarTag(1).fill('FR123456789021');
    await pages.animalIdentification.inputPassport(1).fill('FR-BOV-2024-001241');
    await pages.additionalDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.additionalDetails.expectedUrl);
    await expect(pages.additionalDetails.heading).toBeVisible();
  });
});
