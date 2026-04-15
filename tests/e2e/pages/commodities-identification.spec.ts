import { test, expect } from '@fixtures';

test.describe('Animal identification details', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAnimalIdentification();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.animalIdentification.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to commodity details', async ({ pages }) => {
    await pages.animalIdentification.linkBack.click();
    await expect(pages.page).toHaveURL(pages.commodityDetails.expectedUrl);
    await expect(pages.commodityDetails.heading).toBeVisible();
  });

  test('continues to additional details after saving identification details', async ({ pages }) => {
    // TODO: inputs
    await pages.additionalDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.additionalDetails.expectedUrl);
    await expect(pages.additionalDetails.heading).toBeVisible();
  });
});
