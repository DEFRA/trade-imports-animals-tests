import { test, expect } from '@fixtures';

test.describe('Destination selection', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('destinationSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.destinationSelection);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.destinationSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.destinationSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows matching destination details when selecting Coastal Poultry Ltd 4', async ({ pages }) => {
    await pages.destinationSelection.radioPlaceOfDestination('Coastal Poultry Ltd 4').click();
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText('Coastal Poultry Ltd 4');
    await expect(cells.nth(1)).toHaveText("4 Drover's Way, Unit 4");
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });

  test('shows matching destination details when selecting a different destination', async ({ pages }) => {
    const destinationName = 'Lowland Cattle Co 11';
    await pages.destinationSelection.radioPlaceOfDestination(destinationName).click();
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText(destinationName);
    await expect(cells.nth(1)).toHaveText("11 Drover's Way, Unit 11");
    await expect(cells.nth(2)).toHaveText('Germany');
  });

  test('shows validation error when no destination is selected', async ({ pages }) => {
    await pages.destinationSelection.btnSaveAndContinue.click();
    await expect(pages.destinationSelection.errorSummaryItems.first()).toContainText('Select a place of destination');
  });
});
