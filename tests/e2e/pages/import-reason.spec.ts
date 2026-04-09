import { test, expect } from '@fixtures';

test.describe('Reason for import', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toImportReason();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.importReason.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to species selection', async ({ pages }) => {
    await pages.importReason.linkBack.click();
    await expect(pages.page).toHaveURL(pages.speciesSelection.expectedUrl);
    await expect(pages.speciesSelection.headingPage).toHaveText(pages.speciesSelection.expectedHeading);
  });

  test('shows reasons and they are unchecked by default', async ({ pages }) => {
    await expect(pages.importReason.radioInternalMarket).toBeVisible();
    await expect(pages.importReason.radioInternalMarket).not.toBeChecked();
    await expect(pages.importReason.radioReEntry).toBeVisible();
    await expect(pages.importReason.radioReEntry).not.toBeChecked();
  });

  test('can select only one reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await expect(pages.importReason.radioInternalMarket).toBeChecked();
    await expect(pages.importReason.radioReEntry).not.toBeChecked();
    await pages.importReason.radioReEntry.click();
    await expect(pages.importReason.radioInternalMarket).not.toBeChecked();
    await expect(pages.importReason.radioReEntry).toBeChecked();
  });

  test('continues to commodity details after saving selected reason', async ({ pages }) => {
    await pages.importReason.radioInternalMarket.click();
    await pages.importReason.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.commodityDetails.expectedUrl);
    await expect(pages.commodityDetails.headingPage).toHaveText(pages.commodityDetails.expectedHeading);
  });
});
