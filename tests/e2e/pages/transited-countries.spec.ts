import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toTransitedCountries();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.transitedCountries.heading).toBeVisible();
    await expect(pages.transitedCountries.country()).toBeVisible();
    await expect(pages.transitedCountries.addAnotherCountry).toBeVisible();
    await expect(pages.transitedCountries.saveAndContinue).toBeVisible();
  });

  test('shows an empty country selector on load', async ({ pages }) => {
    await expect(pages.transitedCountries.country()).toBeVisible();
  });

  test('accepts a valid transited country', async ({ pages }) => {
    await pages.transitedCountries.selectCountry('France');
    await pages.transitedCountries.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.transitedCountries.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
