import { test, expect } from '@fixtures';

test.describe('Origin of the import page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toOriginOfImport();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.originOfImport.countryOfOrigin).toBeVisible();
    await expect(pages.originOfImport.radioRequiresOriginCode('No')).toBeVisible();
    await expect(pages.originOfImport.saveAndContinue).toBeVisible();
  });

  test('shows the country selector on load', async ({ pages }) => {
    await expect(pages.originOfImport.countryOfOrigin).toBeVisible();
  });

  test('accepts valid origin details', async ({ pages }) => {
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted without a country', async ({ pages }) => {
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
