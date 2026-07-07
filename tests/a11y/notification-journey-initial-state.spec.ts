import { test } from '@fixtures/a11y';

test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ notificationJourney }) => {
    await notificationJourney.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations on initial load', async ({ notificationJourney, runA11yScan }) => {
    await test.step('Notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Origin of import', async () => {
      await notificationJourney.toOriginOfImport();
      await runA11yScan();
      await notificationJourney.fillOriginOfImport();
      await notificationJourney.saveOriginOfImport();
    });

    await test.step('Commodity selection', async () => {
      await runA11yScan();
      await notificationJourney.fillCommoditySelection();
      await notificationJourney.saveCommoditySelection();
    });

    await test.step('Species selection', async () => {
      await runA11yScan();
      await notificationJourney.fillSpeciesSelection();
      await notificationJourney.saveSpeciesSelection();
    });

    await test.step('Import reason', async () => {
      await runA11yScan();
      await notificationJourney.fillImportReason();
      await notificationJourney.saveImportReason();
    });

    await test.step('Commodity details', async () => {
      await runA11yScan();
      await notificationJourney.fillCommodityDetails();
      await notificationJourney.saveCommodityDetails();
    });

    await test.step('Animal identification', async () => {
      await runA11yScan();
      await notificationJourney.fillAnimalIdentification();
      await notificationJourney.saveAnimalIdentification();
    });

    await test.step('Additional details', async () => {
      await runA11yScan();
      await notificationJourney.fillAdditionalDetails();
      await notificationJourney.saveAdditionalDetails();
    });

    await test.step('Accompanying documents', async () => {
      await runA11yScan();
      await notificationJourney.saveAccompanyingDocuments();
    });

    await test.step('Consignment addresses', async () => {
      await runA11yScan();
    });

    await test.step('Place of origin selection', async () => {
      await notificationJourney.openPlaceOfOrigin();
      await runA11yScan();
      await notificationJourney.fillPlaceOfOrigin();
      await notificationJourney.savePlaceOfOrigin();
    });

    await test.step('Consignor selection', async () => {
      await notificationJourney.openConsignor();
      await runA11yScan();
      await notificationJourney.fillConsignor();
      await notificationJourney.saveConsignor();
    });

    await test.step('Consignee selection', async () => {
      await notificationJourney.openConsignee();
      await runA11yScan();
      await notificationJourney.fillConsignee();
      await notificationJourney.saveConsignee();
    });

    await test.step('Importer selection', async () => {
      await notificationJourney.openImporter();
      await runA11yScan();
      await notificationJourney.fillImporter();
      await notificationJourney.saveImporter();
    });

    await test.step('Place of destination selection', async () => {
      await notificationJourney.openPlaceOfDestination();
      await runA11yScan();
      await notificationJourney.fillPlaceOfDestination();
      await notificationJourney.savePlaceOfDestination();
    });

    await test.step('CPH number', async () => {
      await notificationJourney.openCphNumber();
      await runA11yScan();
      await notificationJourney.fillCphNumber();
      await notificationJourney.saveCphNumber();
    });

    await test.step('Entry point', async () => {
      await notificationJourney.saveAddresses();
      await runA11yScan();
      await notificationJourney.fillEntryPoint();
      await notificationJourney.saveEntryPoint();
    });

    await test.step('Transporter', async () => {
      await runA11yScan();
    });

    await test.step('Transporter selection', async () => {
      await notificationJourney.openTransporterSelection();
      await runA11yScan();
      await notificationJourney.selectTransporter();
      await notificationJourney.saveTransporter();
    });

    await test.step('Contact address', async () => {
      await runA11yScan();
      await notificationJourney.fillContactAddress();
      await notificationJourney.saveContactAddress();
    });

    await test.step('Review notification', async () => {
      await runA11yScan();
      await notificationJourney.confirmReview();
    });

    await test.step('Declaration', async () => {
      await runA11yScan();
      await notificationJourney.fillDeclaration();
      await notificationJourney.submitDeclaration();
    });
  });
});
