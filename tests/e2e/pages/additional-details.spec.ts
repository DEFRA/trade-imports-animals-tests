import { test, expect } from '@fixtures';
import { yesNoValues } from '@domain/types/yes-no-values';

test.describe('Additional details', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAdditionalDetails();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.additionalDetails.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });

  test('can navigate back to animal identification', async ({ pages }) => {
    await pages.commodityDetails.linkBack.click();
    await expect(pages.page).toHaveURL(pages.animalIdentification.expectedUrl);
    await expect(pages.animalIdentification.headingPage).toHaveText(pages.animalIdentification.expectedHeading);
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

  test('continues (to next page*) after saving additional details', async ({ pages }) => {
    await pages.additionalDetails.radioApprovedBodies.click();
    await pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.yes).click();
    await pages.additionalDetails.btnSaveAndContinue.click();
    // TODO: pending next page implementation (accompanying documents)
  });
});
