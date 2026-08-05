import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/plant-products/constants/country-codes';

const plantUrl = (reference: string) => new RegExp(`^/plant-products/notifications/${reference}(?:\\?.*)?$`);

const destination = {
  destinationName: 'Paris Produce Market',
  destinationAddressLine1: '10 Rue des Plantes',
  destinationAddressLine2: 'Building 2',
  destinationAddressLine3: 'Wholesale Quarter',
  destinationCity: 'Paris',
  destinationPostcode: '75001',
  destinationCountry: countryCodes.france.value,
};

const requiredDestinationFields = [
  { name: 'destinationName', href: '#destinationName' },
  { name: 'destinationAddressLine1', href: '#destinationAddressLine1' },
  { name: 'destinationCity', href: '#destinationCity' },
  { name: 'destinationPostcode', href: '#destinationPostcode' },
  { name: 'destinationCountry', href: '#destinationCountry' },
] as const;

test.describe('Plant-products traders page', { tag: '@integration' }, () => {
  test('renders importer, optional packer and conditional destination, then persists and resumes country codes', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, destination: null });
    await pages.tradersAddresses.open(created.referenceNumber);
    await expect(pages.tradersAddresses.heading).toBeVisible();
    await expect(pages.page.locator('main').getByRole('heading', { level: 2 })).toHaveText([
      'Importer',
      'Packer (optional)',
      'Delivery address',
      'Consignor or exporter',
    ]);
    await pages.tradersAddresses.saveAndContinue.click();
    await expect(pages.tradersAddresses.errorSummary.getByRole('link')).toHaveAttribute('href', '#destinationSameAsConsignee');

    await pages.tradersAddresses.destinationSameAsConsignee(false).check();
    for (const [name, value] of Object.entries(destination)) {
      const field = pages.tradersAddresses.field(name);
      if (name.endsWith('Country')) await field.selectOption(value);
      else await field.fill(value);
    }
    await pages.tradersAddresses.saveAndReturnToHub.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
    await expect(pages.hub.rowStatus('Traders')).toHaveText('Completed');
    expect((await plantProductsApi.load(created.referenceNumber)).destination).toMatchObject({
      name: destination.destinationName,
      address: { country: destination.destinationCountry },
    });

    await pages.tradersAddresses.open(created.referenceNumber, false);
    await expect(pages.tradersAddresses.destinationSameAsConsignee(false)).toBeChecked();
    await expect(pages.tradersAddresses.field('destinationCountry')).toHaveValue(countryCodes.france.value);
    await pages.tradersAddresses.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });

  for (const missingField of requiredDestinationFields) {
    test(`links the ${missingField.name} error when the required destination field is missing`, async ({
      plantProductsApiJourney: apiJourney,
      plantProductsPages: pages,
    }) => {
      const created = await apiJourney.createFullNotification();
      await pages.tradersAddresses.open(created.referenceNumber);
      await pages.tradersAddresses.destinationSameAsConsignee(false).check();
      for (const [name, value] of Object.entries(destination)) {
        const field = pages.tradersAddresses.field(name);
        if (name.endsWith('Country')) await field.selectOption(value);
        else await field.fill(value);
      }
      const field = pages.tradersAddresses.field(missingField.name);
      if (missingField.name.endsWith('Country')) await field.selectOption('');
      else await field.fill('');
      await pages.tradersAddresses.saveAndContinue.click();
      await expect(pages.tradersAddresses.errorSummary.getByRole('link')).toHaveAttribute('href', missingField.href);
    });
  }
});
