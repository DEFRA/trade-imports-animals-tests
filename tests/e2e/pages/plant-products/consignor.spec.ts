import { test, expect } from '@fixtures';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

test.describe('Plant-products consignor create and confirmation pages', { tag: '@integration' }, () => {
  test('uses addressLine3, links all built required errors and persists the confirmed operator', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    await pages.consignorCreate.open(created.referenceNumber);
    await expect(pages.consignorCreate.heading).toBeVisible();
    await expect(pages.consignorCreate.consignorAddressLine3).toBeVisible();
    await expect(pages.page.getByLabel('County')).toHaveCount(0);
    for (const name of [
      'consignorName',
      'consignorAddressLine1',
      'consignorAddressLine2',
      'consignorAddressLine3',
      'consignorCity',
      'consignorPostcode',
      'consignorTelephone',
      'consignorEmail',
    ]) {
      await pages.consignorCreate.field(name).fill('');
    }
    await pages.consignorCreate.consignorCountry.selectOption('');
    await pages.consignorCreate.saveAndContinue.click();
    await expect
      .poll(() =>
        pages.consignorCreate.errorSummary.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
      )
      .toEqual([
        '#consignorName',
        '#consignorAddressLine1',
        '#consignorCity',
        '#consignorTelephone',
        '#consignorCountry',
        '#consignorEmail',
      ]);

    await journey.fillConsignor({
      name: 'Consignor plant operator',
      addressLine1: '1 Plant Street',
      addressLine2: 'Botanical Quarter',
      addressLine3: 'Glasshouse Estate',
      city: 'London',
      postcode: 'SW1A 1AA',
      telephone: '+44 7700 900123',
      country: 'GB-ENG',
      email: 'consignor@example.com',
    });
    await pages.consignorCreate.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'consignor-confirmation').test(url.pathname));
    await expect(pages.consignorConfirmation.heading).toBeVisible();
    await pages.consignorConfirmation.addToNotification.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'traders-addresses').test(url.pathname));
    expect((await plantProductsApi.load(created.referenceNumber)).consignor).toMatchObject({
      name: 'Consignor plant operator',
      telephone: '+44 7700 900123',
      email: 'consignor@example.com',
      address: {
        addressLine1: '1 Plant Street',
        addressLine2: 'Botanical Quarter',
        addressLine3: 'Glasshouse Estate',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB-ENG',
      },
    });

    await pages.consignorCreate.open(created.referenceNumber, false);
    await expect(pages.consignorCreate.consignorAddressLine3).toHaveValue('Glasshouse Estate');
    await pages.consignorCreate.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
