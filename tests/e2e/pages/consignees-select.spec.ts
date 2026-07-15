import { test, expect } from '@fixtures';

test.describe('Consignee selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('consigneeSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.consigneeSelection);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.consigneeSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.consigneeSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows operators unchecked by default', async ({ pages }) => {
    await expect(pages.consigneeSelection.radioConsignee('British Livestock Ltd')).toBeVisible();
    await expect(pages.consigneeSelection.radioConsignee('British Livestock Ltd')).not.toBeChecked();
    await expect(pages.consigneeSelection.radioConsignee('Northern Farms Co')).toBeVisible();
    await expect(pages.consigneeSelection.radioConsignee('Northern Farms Co')).not.toBeChecked();
    await expect(pages.consigneeSelection.radioConsignee('Agri Imports PLC')).toBeVisible();
    await expect(pages.consigneeSelection.radioConsignee('Agri Imports PLC')).not.toBeChecked();
  });

  test('can select only one consignee at a time', async ({ pages }) => {
    await pages.consigneeSelection.radioConsignee('British Livestock Ltd').click();
    await expect(pages.consigneeSelection.radioConsignee('British Livestock Ltd')).toBeChecked();
    await expect(pages.consigneeSelection.radioConsignee('Northern Farms Co')).not.toBeChecked();
    await pages.consigneeSelection.radioConsignee('Northern Farms Co').click();
    await expect(pages.consigneeSelection.radioConsignee('British Livestock Ltd')).not.toBeChecked();
    await expect(pages.consigneeSelection.radioConsignee('Northern Farms Co')).toBeChecked();
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.consigneeSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.consigneeSelection.expectedUrl);
    const errorItems = await pages.consigneeSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select a consignee');
  });

  test('returns to addresses after selecting a consignee', async ({ pages }) => {
    await pages.consigneeSelection.radioConsignee('British Livestock Ltd').click();
    await pages.consigneeSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    const cells = pages.addresses.cellsConsignee;
    await expect(cells.nth(0)).toHaveText('British Livestock Ltd');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });
});
