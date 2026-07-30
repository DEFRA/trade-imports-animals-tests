import { test, expect } from '@main-fixtures';
import { meansOfTransport } from '@main-domain/constants/means-of-transport';
import { pointOfEntries } from '@main-domain/constants/point-of-entries';
import { countryCodes } from '@main-domain/constants/country-codes';

const germany = countryCodes.eu.germany;
const france = countryCodes.eu.france;

test.describe('Transited countries', () => {
  const transitMeansOfTransport = [meansOfTransport.roadVehicle, meansOfTransport.railway] as const;
  const skipTransitMeansOfTransport = [meansOfTransport.airplane, meansOfTransport.vessel] as const;

  for (const transport of transitMeansOfTransport) {
    test(`routes ${transport.display.toLowerCase()} transport to transited countries after arrival details`, async ({
      pages,
      journey,
      apiJourney,
    }) => {
      const created = await apiJourney.createUpToPage('entryPoint');
      await apiJourney.resumeInUi(created.referenceNumber, pages.entryPoint);
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
      apiJourney,
    }) => {
      const created = await apiJourney.createUpToPage('entryPoint');
      await apiJourney.resumeInUi(created.referenceNumber, pages.entryPoint);
      await journey.fillEntryPoint({ meansOfTransport: transport });
      await journey.saveEntryPoint();

      await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
      await expect(pages.transporter.heading).toBeVisible();
    });
  }

  test('can search, add, remove and save transited countries', async ({ pages, journey, apiJourney }) => {
    const created = await apiJourney.createUpToPage('transitedCountries', { meansOfTransport: meansOfTransport.railway });
    await apiJourney.resumeInUi(created.referenceNumber, pages.transitedCountries);

    await expect(pages.transitedCountries.checkboxForCountry(france.display)).toBeVisible();

    await pages.transitedCountries.searchForCountry('ger');
    await expect(pages.page).toHaveURL(/[?&]q=ger(?:&|$)/);
    await expect(pages.transitedCountries.checkboxForCountry(germany.display)).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry(france.display)).toHaveCount(0);

    // Clear search so all countries are available for add
    await pages.transitedCountries.searchForCountry('');
    await expect(pages.transitedCountries.checkboxForCountry(france.display)).toBeVisible();
    await expect(pages.transitedCountries.checkboxForCountry(germany.display)).toBeVisible();

    await journey.addTransitedCountry(germany.display);
    await journey.addTransitedCountry(france.display);

    await expect(pages.transitedCountries.selectedCountry(france.display)).toBeVisible();
    await expect(pages.transitedCountries.selectedCountry(germany.display)).toBeVisible();

    await pages.transitedCountries.removeButtonForCountry(france.display).click();
    await expect(pages.transitedCountries.selectedCountry(france.display)).toHaveCount(0);
    await expect(pages.transitedCountries.selectedCountry(germany.display)).toBeVisible();

    await journey.saveTransitedCountries();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
  });

  test('clears selected transited countries when means of transport no longer requires transit', async ({ pages, journey, apiJourney }) => {
    const created = await apiJourney.createUpToPage('transitedCountries', { meansOfTransport: meansOfTransport.roadVehicle });
    await apiJourney.resumeInUi(created.referenceNumber, pages.transitedCountries);
    await journey.addTransitedCountry(germany.display);
    await expect(pages.transitedCountries.selectedCountry(germany.display)).toBeVisible();

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
    await expect(pages.transitedCountries.selectedCountry(germany.display)).toHaveCount(0);
  });
});
