import { test, expect } from '@fixtures';
import { bcps } from '@domain/plant-products/constants/bcps';
import { meansOfTransport } from '@domain/plant-products/constants/means-of-transport';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

const futureDate = (): Date => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
};

test.describe('Plant-products transport page', { tag: '@integration' }, () => {
  test('renders the full BCP list, lazily changes premises, saves codes and resumes through the real backend', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, transport: null });
    await pages.transportBeforeBip.open(created.referenceNumber);
    await expect(pages.transportBeforeBip.heading).toBeVisible();

    await expect(pages.transportBeforeBip.borderControlPost.getByRole('option')).toHaveText([
      'Select the entry border control post',
      ...Object.values(bcps).map((bcp) => `${bcp.display} - ${bcp.value}`),
    ]);

    await journey.fillTransport({
      borderControlPost: bcps.controlPoint.value,
      inspectionPremises: bcps.controlPoint.controlPoints[0].value,
      meansOfTransport: meansOfTransport.roadVehicle.value,
      transportIdentification: 'AB12 CDE',
      transportDocumentReference: 'CMR-123',
      arrivalDate: futureDate(),
      arrivalTime: '14:50',
      usesContainers: false,
    });
    await expect(pages.transportBeforeBip.inspectionPremisesOptions()).toHaveText([
      'Select inspection premises',
      ...bcps.controlPoint.controlPoints.map(({ display }) => display),
    ]);
    await journey.saveTransport();

    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(`${url.pathname}${url.search}`));
    await expect(pages.hub.rowStatus('Transport to the BCP')).toHaveText('Completed');
    expect((await plantProductsApi.load(created.referenceNumber)).transport).toMatchObject({
      borderControlPost: bcps.controlPoint.value,
      inspectionPremises: bcps.controlPoint.controlPoints[0].value,
      meansOfTransport: meansOfTransport.roadVehicle.value,
      arrivalTime: '14:50',
      usesContainers: false,
      containers: null,
    });

    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await expect(pages.transportBeforeBip.borderControlPost).toHaveValue(bcps.controlPoint.value);
    await expect(pages.transportBeforeBip.inspectionPremises).toHaveValue(bcps.controlPoint.controlPoints[0].value);
    await pages.transportBeforeBip.inspectionPremises.selectOption('');
    await pages.transportBeforeBip.borderControlPost.selectOption(bcps.heathrowAirport.value);
    await journey.saveTransport();
    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await expect(pages.transportBeforeBip.inspectionPremises).toHaveCount(0);
    expect((await plantProductsApi.load(created.referenceNumber)).transport?.inspectionPremises).toBeNull();
  });

  test('links every built mandatory-field error and the Back link returns to the prefixed hub', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, transport: null });
    await pages.transportBeforeBip.open(created.referenceNumber);
    await pages.transportBeforeBip.saveAndContinue.click();

    expect(
      await pages.transportBeforeBip.errorSummary.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual([
      '#borderControlPost',
      '#meansOfTransport',
      '#transportIdentification',
      '#transportDocumentReference',
      '#usesContainers',
      '#arrivalDate-day',
      '#arrivalTime-hour',
    ]);
    await pages.transportBeforeBip.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
