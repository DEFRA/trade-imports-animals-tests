import { test, expect } from '@fixtures';
import { EAR_TAG_PREFIX, PASSPORT_PREFIX } from '@flows/journey';
import { yesNoValues } from '@domain/constants/yes-no-values';

test.describe('Additional details', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAdditionalDetails();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.additionalDetails.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to animal identification', async ({ pages }) => {
    await pages.commodityDetails.linkBack.click();
    await expect(pages.page).toHaveURL(pages.animalIdentification.expectedUrl);
    await expect(pages.animalIdentification.heading).toBeVisible();

    await test.step('previously entered animal identifiers are retained', async () => {
      await expect(pages.animalIdentification.inputEarTag(0)).toHaveValue(new RegExp(`^${EAR_TAG_PREFIX}`));
      await expect(pages.animalIdentification.inputPassport(0)).toHaveValue(new RegExp(`^${PASSPORT_PREFIX}`));
      await expect(pages.animalIdentification.inputEarTag(1)).toHaveValue(new RegExp(`^${EAR_TAG_PREFIX}`));
      await expect(pages.animalIdentification.inputPassport(1)).toHaveValue(new RegExp(`^${PASSPORT_PREFIX}`));
    });
  });

  test('shows default values on first load', async ({ pages }) => {
    await expect(pages.additionalDetails.radioApprovedBodies).not.toBeChecked();
    await expect(pages.additionalDetails.radioBreedingAndOrProduction).not.toBeChecked();
    await expect(pages.additionalDetails.radioSlaughter).not.toBeChecked();
    await expect(pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.yes)).not.toBeChecked();
    await expect(pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.no)).toBeChecked();
  });

  test('can select only one animals certified for option', async ({ pages }) => {
    await pages.additionalDetails.radioApprovedBodies.click();
    await expect(pages.additionalDetails.radioApprovedBodies).toBeChecked();
    await expect(pages.additionalDetails.radioBreedingAndOrProduction).not.toBeChecked();
    await expect(pages.additionalDetails.radioSlaughter).not.toBeChecked();
    await pages.additionalDetails.radioBreedingAndOrProduction.click();
    await expect(pages.additionalDetails.radioApprovedBodies).not.toBeChecked();
    await expect(pages.additionalDetails.radioBreedingAndOrProduction).toBeChecked();
    await expect(pages.additionalDetails.radioSlaughter).not.toBeChecked();
    await pages.additionalDetails.radioSlaughter.click();
    await expect(pages.additionalDetails.radioApprovedBodies).not.toBeChecked();
    await expect(pages.additionalDetails.radioBreedingAndOrProduction).not.toBeChecked();
    await expect(pages.additionalDetails.radioSlaughter).toBeChecked();
  });

  test('allows changing contains unweaned animals from "No" to "Yes"', async ({ pages }) => {
    await pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.yes).click();
    await expect(pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.yes)).toBeChecked();
    await expect(pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.no)).not.toBeChecked();
  });

  test('continues to accompanying documents after saving additional details', async ({ pages }) => {
    await pages.additionalDetails.radioApprovedBodies.click();
    await pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.yes).click();
    await pages.additionalDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.heading).toBeVisible();
  });
});
