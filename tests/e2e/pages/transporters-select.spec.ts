import { test, expect } from '@fixtures';

test.describe('Transporter selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('transporter');
    await apiJourney.resumeInUi(created.referenceNumber, pages.transporterSelection);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.transporterSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to transporter', async ({ pages }) => {
    await pages.transporterSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
  });

  test('shows matching transporter details when selecting the first transporter', async ({ pages }) => {
    await pages.transporterSelection.linkSelectTransporter(0).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.transporter.expectedUrl));
    await expect(pages.transporter.heading).toBeVisible();

    const cells = pages.transporter.cellsTransporter;
    await expect(cells.nth(0)).toContainText('Lowland Cattle Co 26');
    await expect(cells.nth(0)).toContainText("26 Drover's Way, Unit 26, Perth, Perthshire, PH1 5AA");
    await expect(cells.nth(0)).toContainText('France');
    await expect(cells.nth(1)).toHaveText('APR-0026');
    await expect(cells.nth(2)).toHaveText('Commercial');
  });

  test('shows matching transporter details when selecting a different transporter', async ({ pages }) => {
    const transporterName = 'Highland Livestock Ltd 5';
    await pages.transporterSelection.linkSelectTransporterByName(transporterName).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.transporter.expectedUrl));
    await expect(pages.transporter.heading).toBeVisible();

    const cells = pages.transporter.cellsTransporter;
    await expect(cells.nth(0)).toContainText(transporterName);
    await expect(cells.nth(0)).toContainText("5 Drover's Way, Unit 5, Inverness, Highland, IV2 3JH");
    await expect(cells.nth(0)).toContainText('Ireland');
    await expect(cells.nth(1)).toHaveText('APR-0005');
    await expect(cells.nth(2)).toHaveText('Private');
  });
});
