import { test, expect } from '@fixtures';
import { bcps } from '@domain/plant-products/constants/bcps';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { meansOfTransport } from '@domain/plant-products/constants/means-of-transport';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';

// From the frontend's plant-products flow/fixtures/happy-path.json, with coded
// values selected through the test-repo constants that mirror the UI options.
const apples = commodityCodes.otherApples;
const uiCreatedCommodity = {
  lines: [
    {
      commodityCode: apples.value,
      commodityDescription: apples.display,
      species: [
        {
          ...eppoSpecies[apples.value][0],
          varieties: [
            {
              variety: varieties[apples.value].MABSD[0].value,
              varietyClass: varietyClasses[apples.value][0].value,
            },
          ],
        },
      ],
      details: {
        numberOfPackages: '3',
        packageType: packageTypes.box.value,
        quantity: '22',
        quantityType: quantityTypes.pieces.value,
        netWeight: '4',
        controlledAtmosphereContainer: false,
        intendedForFinalUsers: true,
        testAndTrial: true,
      },
    },
  ],
};
const uiCreatedTransport = {
  borderControlPost: bcps.controlPoint.value,
  inspectionPremises: bcps.controlPoint.controlPoints[1].value,
  meansOfTransport: meansOfTransport.roadVehicle.value,
  transportIdentification: 'TRUCK-041',
  transportDocumentReference: 'CMR-041',
  arrivalDate: new Date('2026-08-20T00:00:00.000Z'),
  arrivalTime: '14:05',
  usesContainers: true,
  containers: [{ containerNumber: 'CONT-041', sealNumber: 'SEAL-041', officialSeal: true }],
};

test(
  'containers retain ordered survivors and the true-to-false gate wipes the stored collection',
  { tag: '@integration' },
  async ({ plantProductsApiJourney: apiJourney, plantProductsApi, plantProductsPages: pages }) => {
    const created = await apiJourney.createFullNotification();
    await pages.transportBeforeBip.open(created.referenceNumber);
    await expect(pages.transportBeforeBip.usesContainers(true)).toBeChecked();
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(2);

    for (const [containerNumber, sealNumber] of [
      ['PP-CONT-2', 'PP-SEAL-2'],
      ['PP-CONT-3', 'PP-SEAL-3'],
    ]) {
      await pages.transportBeforeBip.containerNumber.fill(containerNumber);
      await pages.transportBeforeBip.sealNumber.fill(sealNumber);
      await pages.transportBeforeBip.addContainer.click();
    }
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(4);
    await pages.transportBeforeBip.removeContainer('PP-CONT-2').click();
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(3);
    await pages.transportBeforeBip.saveAndContinue.click();
    expect((await plantProductsApi.load(created.referenceNumber)).transport?.containers).toEqual([
      { containerNumber: 'PP-CONT-1', sealNumber: 'PP-SEAL-1', officialSeal: true },
      { containerNumber: 'PP-CONT-3', sealNumber: 'PP-SEAL-3', officialSeal: false },
    ]);

    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await pages.transportBeforeBip.usesContainers(false).check();
    await expect(pages.transportBeforeBip.containerNumber).toBeHidden();
    await pages.transportBeforeBip.saveAndContinue.click();
    const persisted = (await plantProductsApi.load(created.referenceNumber)).transport;
    expect(persisted?.usesContainers).toBe(false);
    expect(persisted?.containers).toBeNull();

    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(0);
  },
);

test(
  'the first container added to a UI-created journey persists and survives a dashboard resume',
  { tag: '@integration' },
  async ({ plantProductsJourney: journey, plantProductsApi, plantProductsPages: pages }) => {
    const reference = await journey.startNotification();
    await journey.answerCommodities(uiCreatedCommodity);
    expect((await plantProductsApi.load(reference)).transport?.containers ?? null).toBeNull();

    await pages.hub.task('Transport to the BCP').click();
    await expect(pages.transportBeforeBip.heading).toBeVisible();
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(0);
    await journey.fillTransport(uiCreatedTransport);

    const firstContainerRow = pages.transportBeforeBip.containerRows.filter({
      has: pages.page.getByRole('cell', { name: uiCreatedTransport.containers[0].containerNumber, exact: true }),
    });
    await expect(firstContainerRow).toContainText(uiCreatedTransport.containers[0].sealNumber);
    await expect(firstContainerRow).toContainText('Yes');
    await journey.saveTransport();
    await expect(pages.hub.heading).toBeVisible();
    expect((await plantProductsApi.load(reference)).transport?.containers).toEqual(uiCreatedTransport.containers);

    await journey.toNotificationDashboard();
    await pages.plantNotificationDashboard.searchForReference(reference);
    await expect(pages.plantNotificationDashboard.row(reference)).toBeVisible();
    await pages.plantNotificationDashboard.continue(reference).click();
    await expect(pages.hub.heading).toBeVisible();
    await pages.hub.task('Transport to the BCP').click();
    await expect(firstContainerRow).toContainText(uiCreatedTransport.containers[0].sealNumber);
    await expect(firstContainerRow).toContainText('Yes');
  },
);
