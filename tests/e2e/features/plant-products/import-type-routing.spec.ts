import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

test.describe('Plant-products import type routing', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.toNotificationDashboard();
    await pages.plantNotificationDashboard.createNewNotification.click();
    await pages.importType.heading.waitFor();
  });

  test('creation lands on the prefixed filter and the inherited journey-id parser resolves the reference', async ({
    plantProductsPages: pages,
  }) => {
    const journeyId = pages.importType.journeyIdFromUrl();

    expect(journeyId).toMatch(/^GBN-PP-/);
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}/import-type$`).test(url.pathname),
    );
  });

  test('an empty submission shows the filter validation error', async ({ plantProductsPages: pages }) => {
    await pages.importType.continueButton.click();

    await expect(pages.importType.errorSummary).toBeVisible();
    await expect(pages.importType.errorSummary.getByRole('link', { name: 'Select the type of import' })).toBeVisible();
  });

  test('CHED-PP opens the country page and importType remains absent from the persisted notification', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const journeyId = pages.importType.journeyIdFromUrl();
    await pages.importType.plants.check();
    await pages.importType.continueButton.click();

    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}/country-of-origin$`).test(url.pathname),
    );
    await expect(pages.countryOfOrigin.heading).toBeVisible();
    const persisted = await plantProductsApi.load(journeyId);
    expect(persisted).not.toHaveProperty('importType');
  });

  test('Purpose cannot start until country of origin is saved', async ({ plantProductsPages: pages }) => {
    await pages.importType.plants.check();
    await pages.importType.continueButton.click();
    await pages.countryOfOrigin.backLink.click();

    await expect(pages.hub.heading).toBeVisible();
    await expect(pages.hub.rowStatus('Purpose')).toHaveText('Cannot start yet');
    await expect(pages.hub.task('Purpose')).toHaveCount(0);

    await pages.hub.task('Origin of the import').click();
    await pages.countryOfOrigin.selectCountry('France');
    await pages.countryOfOrigin.saveAndContinue.click();
    await pages.originOfImport.backLink.click();

    await expect(pages.hub.task('Purpose')).toBeVisible();
    await expect(pages.hub.rowStatus('Purpose')).toHaveText('Not yet started');
  });
});
