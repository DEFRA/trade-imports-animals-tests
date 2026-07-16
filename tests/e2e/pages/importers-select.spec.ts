import { test, expect } from '@fixtures';

test.describe('Importer selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('importerSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.importerSelection);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.importerSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.importerSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows operators unchecked by default', async ({ pages }) => {
    await expect(pages.importerSelection.radioImporter('Glen Valley Farms 3')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('Glen Valley Farms 3')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('Highland Livestock Ltd 10')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('Highland Livestock Ltd 10')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('Border Beef Partners 17')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('Border Beef Partners 17')).not.toBeChecked();
  });

  test('can select only one importer at a time', async ({ pages }) => {
    await pages.importerSelection.radioImporter('Glen Valley Farms 3').click();
    await expect(pages.importerSelection.radioImporter('Glen Valley Farms 3')).toBeChecked();
    await expect(pages.importerSelection.radioImporter('Highland Livestock Ltd 10')).not.toBeChecked();
    await pages.importerSelection.radioImporter('Highland Livestock Ltd 10').click();
    await expect(pages.importerSelection.radioImporter('Glen Valley Farms 3')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('Highland Livestock Ltd 10')).toBeChecked();
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.importerSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.importerSelection.expectedUrl);
    const errorItems = await pages.importerSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select an importer');
  });

  test('returns to addresses after selecting an importer', async ({ pages }) => {
    await pages.importerSelection.radioImporter('Glen Valley Farms 3').click();
    await pages.importerSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    const cells = pages.addresses.cellsImporter;
    await expect(cells.nth(0)).toHaveText('Glen Valley Farms 3');
    await expect(cells.nth(2)).toHaveText('Germany');
  });
});
