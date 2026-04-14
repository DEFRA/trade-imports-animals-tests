import { test, expect } from '@fixtures';

test.describe('Commodity details', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toCommodityDetails();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.commodityDetails.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to species selection', async ({ pages }) => {
    await pages.commodityDetails.linkBack.click();
    await expect(pages.page).toHaveURL(pages.importReason.expectedUrl);
    await expect(pages.importReason.headingPage).toHaveText(pages.importReason.expectedHeading);
  });

  test('shows commodity details in table (for selected commodity*)', async ({ pages }) => {
    // Commodity details are currently hardcoded in the view.
    await expect(pages.commodityDetails.tableBodyRowsCommodities).toHaveCount(1);
    const commodityDetails = await pages.commodityDetails.tableBodyRowCellsCommodities(0).allTextContents();
    expect(commodityDetails[0]).toBe('0102');
    expect(commodityDetails[1]).toBe('Live bovine animals');
  });

  test('shows species and type in table (for selected commodity*)', async ({ pages }) => {
    // Species and type are currently hardcoded in the view.
    await expect(pages.commodityDetails.tableBodyRowsQuantities).toHaveCount(2);
    const speciesAndType = await pages.commodityDetails.tableBodyRowCellsQuantities(0).allTextContents();
    expect(speciesAndType[0]).toContain('Bison bison, Domestic');
  });

  test('shows empty quantity inputs and zero subtotals by default', async ({ pages }) => {
    await expect(pages.commodityDetails.inputNoOfAnimals).toHaveAttribute('type', 'number');
    await expect(pages.commodityDetails.inputNoOfAnimals).toHaveText('');
    await expect(pages.commodityDetails.inputNoOfPackages).toHaveAttribute('type', 'number');
    await expect(pages.commodityDetails.inputNoOfPackages).toHaveText('');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('0');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('0');
  });

  test('allows entering quantities and updates subtotals', async ({ pages }) => {
    await pages.commodityDetails.inputNoOfAnimals.fill('1');
    await pages.commodityDetails.inputNoOfPackages.fill('99');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('1');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('99');
    await pages.commodityDetails.inputNoOfAnimals.fill('256');
    await pages.commodityDetails.inputNoOfPackages.fill('2147483647');
    await expect(pages.commodityDetails.subTotalNoOfAnimals).toHaveText('256');
    await expect(pages.commodityDetails.subTotalNoOfPackages).toHaveText('2147483647');
  });

  test('continues to additional details after saving quantities', async ({ pages }) => {
    await pages.commodityDetails.inputNoOfAnimals.fill('1');
    await pages.commodityDetails.inputNoOfPackages.fill('99');
    await pages.commodityDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.additionalDetails.expectedUrl);
    await expect(pages.additionalDetails.headingPage).toHaveText(pages.additionalDetails.expectedHeading);
  });
});
