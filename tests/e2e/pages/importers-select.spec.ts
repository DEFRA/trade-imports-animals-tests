import { test, expect } from '@fixtures';

test.describe('Importer selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('importerSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.importerSelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.importerSelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.importerSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('returns to addresses after selecting an importer', async ({ pages }) => {
    await pages.importerSelection.radioImporter('Import Co UK').click();
    await pages.importerSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    const cells = pages.addresses.cellsImporter;
    await expect(cells.nth(0)).toHaveText('Import Co UK');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });
});
