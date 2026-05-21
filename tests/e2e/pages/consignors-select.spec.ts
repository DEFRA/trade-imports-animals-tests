import { test, expect } from '@fixtures';

test.describe('Consignor selection', () => {
  test.beforeEach(async ({ journeys, pages }) => {
    await journeys.toAddresses();
    await pages.addresses.linkAddConsignorOrExporter.click();
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

  test('shows matching consignor details when selecting the first consignor', async ({ pages }) => {
    await pages.consignorSelection.linkSelectConsignor(0).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText('Astra Rosales');
    await expect(cells.nth(1)).toHaveText('43 East Hague Extension, Delectus sitodio p. Laborum Odio tempor, Quasoccaecat ut ear, 30055');
    await expect(cells.nth(2)).toHaveText('Switzerland');
  });

  test('shows matching consignor details when selecting a different consignor', async ({ pages }) => {
    const consignorName = 'Laiterie du Nord SARL';
    await pages.consignorSelection.linkSelectConsignorByName(consignorName).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsConsignorOrExporter;
    await expect(cells.nth(0)).toHaveText(consignorName);
    await expect(cells.nth(1)).toHaveText('12 Rue de la Gare, 59000 Lille');
    await expect(cells.nth(2)).toHaveText('	France');
  });
});
