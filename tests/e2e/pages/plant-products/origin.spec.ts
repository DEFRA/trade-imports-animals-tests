import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

test.describe('Plant-products origin pages', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await pages.hub.task('Origin of the import').click();
    await pages.countryOfOrigin.heading.waitFor();
  });

  test('renders both origin pages with the plant-specific fields', async ({ plantProductsPages: pages }) => {
    await expect(pages.countryOfOrigin.heading).toBeVisible();
    await expect(pages.countryOfOrigin.countryOfOrigin).toBeVisible();
    await expect(pages.countryOfOrigin.backLink).toBeVisible();

    await pages.countryOfOrigin.saveAndContinue.click();

    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.originOfImport.countryOfConsignment).toBeVisible();
    await expect(pages.originOfImport.internalReference).toBeVisible();
  });

  test('missing country of origin links the summary to the field error', async ({ plantProductsPages: pages }) => {
    await pages.countryOfOrigin.countryOfOrigin.selectOption('');
    await pages.countryOfOrigin.saveAndContinue.click();

    await expect(pages.countryOfOrigin.errorSummary).toBeVisible();
    await expect(pages.countryOfOrigin.errorSummary.getByRole('link')).toHaveAttribute('href', '#countryOfOrigin');
    await expect(pages.countryOfOrigin.countryOfOriginError).toContainText(
      'Select the country of origin of plants, plant product or other objects',
    );
  });

  test('missing country of consignment links the summary to the field error', async ({ plantProductsPages: pages }) => {
    await pages.countryOfOrigin.saveAndContinue.click();
    await pages.originOfImport.countryOfConsignment.selectOption('');
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.originOfImport.errorSummary).toBeVisible();
    await expect(pages.originOfImport.errorSummary.getByRole('link')).toHaveAttribute('href', '#countryOfConsignment');
    await expect(pages.originOfImport.countryOfConsignmentError).toContainText('Select the country from where consigned');
  });

  test('saves country codes and the reference through the real backend and resumes them', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const journeyId = pages.countryOfOrigin.journeyIdFromUrl();
    await pages.countryOfOrigin.selectCountry('Brazil');
    await pages.countryOfOrigin.saveAndContinue.click();
    await pages.originOfImport.selectCountry('Republic of Ireland');
    await pages.originOfImport.internalReference.fill('PP-ORIGIN-REF');
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}$`).test(url.pathname));
    await expect(pages.hub.rowStatus('Origin of the import')).toHaveText('Completed');
    const persisted = await plantProductsApi.load(journeyId);
    expect(persisted.origin).toMatchObject({
      countryCode: 'BR',
      countryOfConsignmentCode: 'IE',
      internalReference: 'PP-ORIGIN-REF',
    });

    await pages.hub.task('Origin of the import').click();
    await expect(pages.countryOfOrigin.countryOfOrigin).toHaveValue('BR');
    await pages.countryOfOrigin.saveAndContinue.click();
    await expect(pages.originOfImport.countryOfConsignment).toHaveValue('IE');
    await expect(pages.originOfImport.internalReference).toHaveValue('PP-ORIGIN-REF');
  });

  test('back links return to the prefixed hub', async ({ plantProductsPages: pages }) => {
    const journeyId = pages.countryOfOrigin.journeyIdFromUrl();
    await pages.countryOfOrigin.backLink.click();

    await expect(pages.page).toHaveURL((url) => new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}$`).test(url.pathname));
    await expect(pages.hub.heading).toBeVisible();
  });
});
