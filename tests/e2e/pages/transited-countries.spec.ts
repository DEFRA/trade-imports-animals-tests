import { test, expect } from '@fixtures';
import { meansOfTransport } from '@domain/constants/means-of-transport';
import { pointOfEntries } from '@domain/constants/point-of-entries';
import { TRANSIT_COUNTRY_NAME } from '@flows/journey';

test.describe('Transited countries', () => {
  const transitMeansOfTransport = [meansOfTransport.roadVehicle, meansOfTransport.railway] as const;
  const skipTransitMeansOfTransport = [meansOfTransport.airplane, meansOfTransport.vessel] as const;

  for (const transport of transitMeansOfTransport) {
    test(`routes ${transport.display.toLowerCase()} transport to transited countries after arrival details`, async ({ pages, journey }) => {
      await journey.toEntryPoint();
      await journey.fillEntryPoint({
        pointOfEntry: pointOfEntries.aberdeen,
        meansOfTransport: transport,
      });
      await journey.saveEntryPoint();

      await expect(pages.page).toHaveURL(pages.transitedCountries.expectedUrl);
      await expect(pages.transitedCountries.heading).toBeVisible();
    });
  }

  for (const transport of skipTransitMeansOfTransport) {
    test(`routes ${transport.display.toLowerCase()} transport directly to transporter after arrival details`, async ({
      pages,
      journey,
    }) => {
      await journey.toEntryPoint();
      await journey.fillEntryPoint({ meansOfTransport: transport });
      await journey.saveEntryPoint();

      await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
      await expect(pages.transporter.heading).toBeVisible();
    });
  }

  test('can search, add, remove and save transited countries', async ({ pages, journey }) => {
    await journey.toTransitedCountries({ meansOfTransport: meansOfTransport.railway });

    await expect(pages.transitedCountries.checkboxForCountry('France')).toBeVisible();

    await pages.transitedCountries.searchForCountry('ger');
    await expect(pages.page).toHaveURL(/[?&]q=ger(?:&|$)/);
    await expect(pages.transitedCountries.checkboxForCountry(TRANSIT_COUNTRY_NAME)).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry('France')).toHaveCount(0);

    // Clear search so all countries are available for add
    await pages.transitedCountries.searchForCountry('');
    await expect(pages.transitedCountries.checkboxForCountry('France')).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry(TRANSIT_COUNTRY_NAME)).toBeVisible();

    await journey.addTransitedCountry(TRANSIT_COUNTRY_NAME);
    await journey.addTransitedCountry('France');

    await expect(pages.transitedCountries.selectedCountry('France')).toBeVisible();
    await expect(pages.transitedCountries.selectedCountry(TRANSIT_COUNTRY_NAME)).toBeVisible();

    await pages.transitedCountries.removeButtonForCountry('France').click();
    await expect(pages.transitedCountries.selectedCountry('France')).toHaveCount(0);
    await expect(pages.transitedCountries.selectedCountry(TRANSIT_COUNTRY_NAME)).toBeVisible();

    await journey.saveTransitedCountries();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
  });

  test('clears selected transited countries when means of transport no longer requires transit', async ({ pages, journey }) => {
    await journey.toTransitedCountries({ meansOfTransport: meansOfTransport.roadVehicle });
    await journey.addTransitedCountry(TRANSIT_COUNTRY_NAME);
    await expect(pages.transitedCountries.selectedCountry(TRANSIT_COUNTRY_NAME)).toBeVisible();

    // Revisit arrival details (session-scoped URL) and switch to a means that skips transit
    await pages.page.goto(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
    await journey.fillEntryPoint({ meansOfTransport: meansOfTransport.airplane });
    await journey.saveEntryPoint();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);

    // Switch back to a transit-requiring means — previously selected countries should be cleared
    await pages.page.goto(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
    await journey.fillEntryPoint({ meansOfTransport: meansOfTransport.roadVehicle });
    await journey.saveEntryPoint();
    await expect(pages.page).toHaveURL(pages.transitedCountries.expectedUrl);
    await expect(pages.transitedCountries.selectedCountry(TRANSIT_COUNTRY_NAME)).toHaveCount(0);
  });
});
