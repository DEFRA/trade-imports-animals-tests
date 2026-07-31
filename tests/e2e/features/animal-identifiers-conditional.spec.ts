import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('a unit form shows only the identifier types the commodity requires, plus the permanent address for cats and dogs', async ({
    journey,
    pages,
  }) => {
    await journey.startNotification();
    await journey.answerOrigin();

    // Batch-create a Cats commodity line — the counts are submit-enforced, so
    // the consignment details page can be left blank.
    await pages.overview.task('What are you importing?').click();
    await pages.commoditySelection.selectSpecies(['Felis catus']);
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.consignmentDetails.heading).toBeVisible();

    await pages.consignmentDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await pages.overview.task('Animal identification details').click();
    await expect(pages.animalIdentification.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Felis catus' })).toBeVisible();

    // Cats gate passport + tattoo + permanent address on; ear tag + horse name
    // are hidden (they belong to other commodities), and the free-text fallbacks
    // are hidden too — a typed commodity is in the notInUnionOf union.
    await expect(pages.animalIdentification.passportNumber).toBeVisible();
    await expect(pages.page.getByLabel('Tattoo')).toBeVisible();
    await expect(pages.animalIdentification.earTag).toBeHidden();
    await expect(pages.page.getByLabel('Horse name')).toBeHidden();
    await expect(pages.page.getByLabel('Identification details')).toBeHidden();
    await expect(pages.page.getByLabel('Animal description')).toBeHidden();
    await expect(pages.page.getByLabel('Name or organisation name')).toBeVisible();

    // A partial permanent address blocks the add — the fieldGroup mandates apply
    // once any part of the record is provided.
    await pages.animalIdentification.passportNumber.fill('UK123456789');
    await pages.page.getByLabel('Name or organisation name').fill('Pet Owner');
    await pages.animalIdentification.saveAndAddAnother.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

    // Completing the mandatory address fields commits the unit with its
    // { name, address } permanent address and keeps the surface open.
    await pages.page.getByLabel('Address line 1').fill('1 Farm Lane');
    await pages.page.getByLabel('Town or city').fill('Skipton');
    await pages.page.getByLabel('Postal or zip code').fill('BD23 1UD');
    await pages.page.getByLabel('Country').selectOption('United Kingdom');
    await pages.page.getByLabel('Telephone number').fill('+44 1756 555 0192');
    await pages.page.getByLabel('Email address').fill('owner@example.co.uk');
    await pages.animalIdentification.saveAndAddAnother.click();

    await expect(pages.animalIdentification.heading).toBeVisible();
    const unitRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Animal 1' });
    await expect(unitRow).toContainText('Passport: UK123456789');
    await expect(unitRow).toContainText('Permanent address: Pet Owner');
  });

  test('a commodity with no typed identifier shows only the free-text fallbacks, and one satisfies the group', async ({
    journey,
    pages,
  }) => {
    await journey.startNotification();
    await journey.answerOrigin();

    // Fish is in no typed-identifier list, so the notInUnionOf gate turns the
    // free-text fallbacks ON and every typed input OFF.
    await pages.overview.task('What are you importing?').click();
    await pages.commoditySelection.selectSpecies(['Salmo salar']);
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.consignmentDetails.heading).toBeVisible();

    await pages.consignmentDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await pages.overview.task('Animal identification details').click();
    await expect(pages.animalIdentification.heading).toBeVisible();

    await expect(pages.page.getByLabel('Identification details')).toBeVisible();
    await expect(pages.page.getByLabel('Animal description')).toBeVisible();
    await expect(pages.animalIdentification.passportNumber).toBeHidden();
    await expect(pages.page.getByLabel('Tattoo')).toBeHidden();
    await expect(pages.animalIdentification.earTag).toBeHidden();
    await expect(pages.page.getByLabel('Horse name')).toBeHidden();

    // A fallback alone satisfies the at-least-one identifier group.
    await pages.page.getByLabel('Identification details').fill('Tank mark TM-77');
    await pages.animalIdentification.saveAndAddAnother.click();
    await expect(pages.animalIdentification.heading).toBeVisible();
    await expect(pages.page.locator('.govuk-summary-list__row', { hasText: 'Animal 1' })).toContainText(
      'Identification details: Tank mark TM-77',
    );
  });
});
