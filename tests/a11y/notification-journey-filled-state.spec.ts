import { test } from '@fixtures/a11y';

test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ notificationJourney }) => {
    await notificationJourney.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations after user input', async ({ notificationJourney, runA11yScan }) => {
    await test.step('Origin of import', async () => {
      await notificationJourney.toOriginOfImport();
      await notificationJourney.fillOriginOfImport({ internalReference: 'InternalReference123' });
      await runA11yScan();
      await notificationJourney.saveOriginOfImport();
    });

    await test.step('Commodity selection', async () => {
      await notificationJourney.fillCommoditySelection();
      await runA11yScan();
      await notificationJourney.saveCommoditySelection();
    });

    await test.step('Species selection', async () => {
      await notificationJourney.fillSpeciesSelection();
      await runA11yScan();
      await notificationJourney.saveSpeciesSelection();
    });

    await test.step('Import reason', async () => {
      await notificationJourney.fillImportReason();
      await runA11yScan();
      await notificationJourney.saveImportReason();
    });

    await test.step('Commodity details', async () => {
      await notificationJourney.fillCommodityDetails();
      await runA11yScan();
      await notificationJourney.saveCommodityDetails();
    });

    await test.step('Animal identification', async () => {
      await notificationJourney.fillAnimalIdentification();
      await runA11yScan();
      await notificationJourney.saveAnimalIdentification();
    });

    await test.step('Additional details', async () => {
      await notificationJourney.fillAdditionalDetails();
      await runA11yScan();
      await notificationJourney.saveAdditionalDetails();
    });

    await test.step('Accompanying documents', async () => {
      await notificationJourney.saveAccompanyingDocuments();
    });

    await test.step('Place of origin selection', async () => {
      await notificationJourney.openPlaceOfOrigin();
      await notificationJourney.fillPlaceOfOrigin();
      await runA11yScan();
      await notificationJourney.savePlaceOfOrigin();
    });

    await test.step('Consignor selection', async () => {
      await notificationJourney.openConsignor();
      await notificationJourney.fillConsignor();
      await runA11yScan();
      await notificationJourney.saveConsignor();
    });

    await test.step('Consignee selection', async () => {
      await notificationJourney.openConsignee();
      await notificationJourney.fillConsignee();
      await runA11yScan();
      await notificationJourney.saveConsignee();
    });

    await test.step('Importer selection', async () => {
      await notificationJourney.openImporter();
      await notificationJourney.fillImporter();
      await runA11yScan();
      await notificationJourney.saveImporter();
    });

    await test.step('Place of destination selection', async () => {
      await notificationJourney.openPlaceOfDestination();
      await notificationJourney.fillPlaceOfDestination();
      await runA11yScan();
      await notificationJourney.savePlaceOfDestination();
    });

    await test.step('CPH number', async () => {
      await notificationJourney.openCphNumber();
      await notificationJourney.fillCphNumber();
      await runA11yScan();
      await notificationJourney.saveCphNumber();
    });

    await test.step('Consignment addresses with all addresses added', async () => {
      await runA11yScan();
      await notificationJourney.saveAddresses();
    });

    await test.step('Entry point', async () => {
      await notificationJourney.fillEntryPoint();
      await runA11yScan();
      await notificationJourney.saveEntryPoint();
    });

    await test.step('Transporter with transporter added', async () => {
      await notificationJourney.openTransporterSelection();
      await notificationJourney.selectTransporter();
      await runA11yScan();
      await notificationJourney.saveTransporter();
    });

    await test.step('Contact address', async () => {
      await notificationJourney.fillContactAddress();
      await runA11yScan();
      await notificationJourney.saveContactAddress();
    });

    await test.step('Review notification', async () => {
      await runA11yScan();
      await notificationJourney.confirmReview();
    });

    await test.step('Declaration', async () => {
      await notificationJourney.fillDeclaration();
      await runA11yScan();
      await notificationJourney.submitDeclaration();
    });
  });
});
