import { test, expect } from '@fixtures';

test.describe('Destination selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('destinationSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.destinationSelection);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.destinationSelection.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.destinationSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows matching destination details when selecting Tech Imports Ltd', async ({ pages }) => {
    await pages.destinationSelection.radioPlaceOfDestination('Tech Imports Ltd').click();
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText('Tech Imports Ltd');
    await expect(cells.nth(1)).toHaveText('643 Main Street, Birmingham G1 3AZ');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });

  test('shows matching destination details when selecting a different destination', async ({ pages }) => {
    const destinationName = 'Global Trading Co';
    await pages.destinationSelection.radioPlaceOfDestination(destinationName).click();
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText(destinationName);
    await expect(cells.nth(1)).toHaveText('945 Main Street, London LS1 5AB');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });

  test('shows validation error when no destination is selected', async ({ pages }) => {
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.destinationSelection.errorSummaryItems.first()).toContainText('Select a place of destination');
  });
});
