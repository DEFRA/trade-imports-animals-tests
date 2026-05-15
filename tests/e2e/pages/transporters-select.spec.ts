import { test, expect } from '@fixtures';

test.describe('Transporter selection', () => {
  test.beforeEach(async ({ journeys, pages }) => {
    await journeys.toTransporter();
    await pages.transporter.linkAddTransporter.click();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.transporterSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
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
    await expect(cells.nth(0)).toContainText('García Livestock Transport SL');
    await expect(cells.nth(0)).toContainText(
      '43 East Hague Extension, Delectus sitodio p. Laborum Odio tempor, Quasoccaecat ut ear, 30055',
    );
    await expect(cells.nth(0)).toContainText('Switzerland');
    await expect(cells.nth(1)).toHaveText('ES-T2-45001294');
    await expect(cells.nth(2)).toHaveText('Commercial');
  });

  test('shows matching transporter details when selecting a different transporter', async ({ pages }) => {
    const transporterName = 'J & G Campbell LTD';
    await pages.transporterSelection.linkSelectTransporterByName(transporterName).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.transporter.expectedUrl));
    await expect(pages.transporter.heading).toBeVisible();

    const cells = pages.transporter.cellsTransporter;
    await expect(cells.nth(0)).toContainText(transporterName);
    await expect(cells.nth(0)).toContainText('Rue de la Loi 200, 1040 Brussels');
    await expect(cells.nth(0)).toContainText('Belgium');
    await expect(cells.nth(1)).toHaveText('UK/BURY/T2/00104115');
    await expect(cells.nth(2)).toHaveText('Commercial');
  });
});
