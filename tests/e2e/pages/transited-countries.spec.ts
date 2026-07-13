import { test, expect } from '@fixtures';
import { meansOfTransport } from '@domain/constants/means-of-transport';
import { pointOfEntries } from '@domain/constants/point-of-entries';

test.describe('Transited countries', () => {
  test('routes road transport to transited countries after arrival details', async ({ pages, journey }) => {
    await journey.toEntryPoint();
    await journey.fillEntryPoint({
      pointOfEntry: pointOfEntries.aberdeen,
      meansOfTransport: meansOfTransport.roadVehicle,
    });
    await journey.saveEntryPoint({ meansOfTransport: meansOfTransport.roadVehicle });

    await expect(pages.page).toHaveURL(pages.transitedCountries.expectedUrl);
    await expect(pages.transitedCountries.heading).toBeVisible();
  });

  test('routes air transport directly to transporter after arrival details', async ({ pages, journey }) => {
    await journey.toEntryPoint();
    await journey.fillEntryPoint({ meansOfTransport: meansOfTransport.airplane });
    await journey.saveEntryPoint({ meansOfTransport: meansOfTransport.airplane });

    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
  });

  test('can search, add, remove and save transited countries', async ({ pages, journey }) => {
    await journey.toTransitedCountries();

    await expect(pages.transitedCountries.checkboxForCountry('France')).toBeVisible();

    await pages.transitedCountries.searchForCountry('ger');
    await expect(pages.page).toHaveURL(/[?&]q=ger(?:&|$)/);
    await expect(pages.transitedCountries.checkboxForCountry('Germany')).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry('France')).toHaveCount(0);

    // Clear search so all countries are available for add
    await pages.transitedCountries.searchForCountry('');
    await expect(pages.transitedCountries.checkboxForCountry('France')).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry('Germany')).toBeVisible();

    await journey.addTransitedCountry('Germany');
    await journey.addTransitedCountry('France');

    await expect(pages.transitedCountries.selectedCountry('France')).toBeVisible();
    await expect(pages.transitedCountries.selectedCountry('Germany')).toBeVisible();

    await pages.transitedCountries.removeButtonForCountry('France').click();
    await expect(pages.transitedCountries.selectedCountry('France')).toHaveCount(0);
    await expect(pages.transitedCountries.selectedCountry('Germany')).toBeVisible();

    await journey.saveTransitedCountries();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
  });
});
