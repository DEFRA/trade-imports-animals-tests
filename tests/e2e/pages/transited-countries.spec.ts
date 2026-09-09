import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toTransitedCountries();
  });

  test('renders the country search and an empty list', async ({ pages }) => {
    await expect(pages.transitedCountries.heading).toBeVisible();
    await expect(pages.transitedCountries.countryField).toBeVisible();
    await expect(pages.transitedCountries.addCountryButton).toBeVisible();
    await expect(pages.transitedCountries.saveAndContinue).toBeVisible();
  });

  test('accepts and persists multiple transited countries', async ({ pages }) => {
    const journeyId = pages.transitedCountries.journeyIdFromUrl();
    await pages.transitedCountries.addCountry('France');
    await pages.transitedCountries.addCountry('Belgium');
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await pages.transitedCountries.open(journeyId);
    await expect(pages.transitedCountries.row('France')).toBeVisible();
    await expect(pages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('removes a country from the list, leaving the others', async ({ pages }) => {
    await pages.transitedCountries.addCountry('France');
    await pages.transitedCountries.addCountry('Belgium');
    await pages.transitedCountries.removeCountry('France').click();

    await expect(pages.transitedCountries.row('France')).toHaveCount(0);
    await expect(pages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
