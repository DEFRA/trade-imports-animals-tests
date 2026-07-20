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

  test('shows operators unchecked by default', async ({ pages }) => {
    await expect(pages.importerSelection.radioImporter('Import Co UK')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('Import Co UK')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('GB Animal Imports')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('GB Animal Imports')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('Highland Import Services')).toBeVisible();
    await expect(pages.importerSelection.radioImporter('Highland Import Services')).not.toBeChecked();
  });

  test('can select only one importer at a time', async ({ pages }) => {
    await pages.importerSelection.radioImporter('Import Co UK').click();
    await expect(pages.importerSelection.radioImporter('Import Co UK')).toBeChecked();
    await expect(pages.importerSelection.radioImporter('GB Animal Imports')).not.toBeChecked();
    await pages.importerSelection.radioImporter('GB Animal Imports').click();
    await expect(pages.importerSelection.radioImporter('Import Co UK')).not.toBeChecked();
    await expect(pages.importerSelection.radioImporter('GB Animal Imports')).toBeChecked();
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.importerSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.importerSelection.expectedUrl);
    const errorItems = await pages.importerSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select an importer');
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
