import { test, expect } from '@fixtures';

test.describe('Place of origin selection', () => {
  test.beforeEach(async ({ notificationJourney, pages }) => {
    await notificationJourney.toAddresses();
    await pages.addresses.linkAddPlaceOfOrigin.click();
    await pages.placeOfOriginSelection.heading.waitFor();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.placeOfOriginSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.placeOfOriginSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows operators unchecked by default', async ({ pages }) => {
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm')).toBeVisible();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm')).not.toBeChecked();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Nordic Livestock AS')).toBeVisible();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Nordic Livestock AS')).not.toBeChecked();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Ferme des Alpes SARL')).toBeVisible();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Ferme des Alpes SARL')).not.toBeChecked();
  });

  test('can select only one place of origin at a time', async ({ pages }) => {
    await pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm').click();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm')).toBeChecked();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Nordic Livestock AS')).not.toBeChecked();
    await pages.placeOfOriginSelection.radioPlaceOfOrigin('Nordic Livestock AS').click();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm')).not.toBeChecked();
    await expect(pages.placeOfOriginSelection.radioPlaceOfOrigin('Nordic Livestock AS')).toBeChecked();
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.placeOfOriginSelection.expectedUrl);
    const errorItems = await pages.placeOfOriginSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select a place of origin');
  });

  test('returns to addresses after selecting a place of origin', async ({ pages }) => {
    await pages.placeOfOriginSelection.radioPlaceOfOrigin('Origin Farm').click();
    await pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    const cells = pages.addresses.cellsPlaceOfOrigin;
    await expect(cells.nth(0)).toHaveText('Origin Farm');
    await expect(cells.nth(2)).toHaveText('Ireland');
  });
});
