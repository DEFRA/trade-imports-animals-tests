import { test, expect } from '@fixtures';

test.describe('Consignor selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('consignorSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.consignorSelection);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.consignorSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.consignorSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows matching consignor details when selecting Lowland Cattle Co 1', async ({ pages }) => {
    await pages.consignorSelection.radioConsignorOrExporter('Lowland Cattle Co 1').click();
    await pages.consignorSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText('Lowland Cattle Co 1');
    await expect(cells.nth(1)).toHaveText("1 Drover's Way, Unit 1");
    await expect(cells.nth(2)).toHaveText('Ireland');
  });

  test('shows matching consignor details when selecting a different consignor', async ({ pages }) => {
    const consignorName = 'Glen Valley Farms 8';
    await pages.consignorSelection.radioConsignorOrExporter(consignorName).click();
    await pages.consignorSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText(consignorName);
    await expect(cells.nth(1)).toHaveText("8 Drover's Way, Unit 8");
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });

  test('shows validation error when no consignor is selected', async ({ pages }) => {
    await pages.consignorSelection.btnSaveAndContinue.click();
    await expect(pages.consignorSelection.errorSummaryItems.first()).toContainText('Select a consignor or exporter');
  });
});
