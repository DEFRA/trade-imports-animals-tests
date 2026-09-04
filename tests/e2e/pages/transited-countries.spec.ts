import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const { referenceNumber } = await apiJourney.createUpToPage('arrivalDetails');
    await apiJourney.resumeInUi(referenceNumber, pages.transitedCountries);
  });

  test('renders one 31-country checkbox group', async ({ pages }) => {
    await expect(pages.transitedCountries.heading).toBeVisible();
    await expect(
      pages.page.getByRole('group', {
        name: 'Select all countries the consignment will travel through',
      }),
    ).toBeVisible();
    await expect(pages.transitedCountries.countries).toHaveCount(31);
    await expect(pages.transitedCountries.country('France')).toBeVisible();
    await expect(pages.transitedCountries.saveAndContinue).toBeVisible();
  });

  test('accepts and persists multiple transited countries', async ({ pages }) => {
    const journeyId = pages.transitedCountries.journeyIdFromUrl();
    await pages.transitedCountries.selectCountry('France');
    await pages.transitedCountries.selectCountry('Belgium');
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await pages.transitedCountries.open(journeyId);
    await expect(pages.transitedCountries.country('France')).toBeChecked();
    await expect(pages.transitedCountries.country('Belgium')).toBeChecked();
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
