import { test, expect } from '@fixtures';

test.describe('Consignor selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('consignorSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.consignorSelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.consignorSelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.consignorSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows matching consignor details when selecting Astra Rosales', async ({ pages }) => {
    await pages.consignorSelection.radioConsignorOrExporter('Astra Rosales').click();
    await pages.consignorSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText('Astra Rosales');
    await expect(cells.nth(1)).toHaveText('43 East Hague Extension, Delectus sitodio p. Laborum Odio tempor, Quasoccaecat ut ear, 30055');
    await expect(cells.nth(2)).toHaveText('Switzerland');
  });

  test('shows matching consignor details when selecting a different consignor', async ({ pages }) => {
    const consignorName = 'Laiterie du Nord SARL';
    await pages.consignorSelection.radioConsignorOrExporter(consignorName).click();
    await pages.consignorSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText(consignorName);
    await expect(cells.nth(1)).toHaveText('12 Rue de la Gare, 59000 Lille');
    await expect(cells.nth(2)).toHaveText('	France');
  });
});
