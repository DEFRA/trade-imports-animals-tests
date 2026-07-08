import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations on initial load', async ({ journey, runA11yScan }) => {
    await test.step('Notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Origin of import', async () => {
      await journey.toOriginOfImport();
      await runA11yScan();
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
    });

    await test.step('Commodity selection', async () => {
      await runA11yScan();
      await journey.fillCommoditySelection();
      await journey.saveCommoditySelection();
    });

    await test.step('Species selection', async () => {
      await runA11yScan();
      await journey.fillSpeciesSelection();
      await journey.saveSpeciesSelection();
    });

    await test.step('Import reason', async () => {
      await runA11yScan();
      await journey.fillImportReason();
      await journey.saveImportReason();
    });

    await test.step('Commodity details', async () => {
      await runA11yScan();
      await journey.fillCommodityDetails();
      await journey.saveCommodityDetails();
    });

    await test.step('Animal identification', async () => {
      await runA11yScan();
      await journey.fillAnimalIdentification();
      await journey.saveAnimalIdentification();
    });

    await test.step('Additional details', async () => {
      await runA11yScan();
      await journey.fillAdditionalDetails();
      await journey.saveAdditionalDetails();
    });

    await test.step('Accompanying documents', async () => {
      await runA11yScan();
      await journey.saveAccompanyingDocuments();
    });

    await test.step('Consignment addresses', async () => {
      await runA11yScan();
    });

    await test.step('Place of origin selection', async () => {
      await journey.openPlaceOfOrigin();
      await runA11yScan();
      await journey.fillPlaceOfOrigin();
      await journey.savePlaceOfOrigin();
    });

    await test.step('Consignor selection', async () => {
      await journey.openConsignor();
      await runA11yScan();
      await journey.fillConsignor();
      await journey.saveConsignor();
    });

    await test.step('Consignee selection', async () => {
      await journey.openConsignee();
      await runA11yScan();
      await journey.fillConsignee();
      await journey.saveConsignee();
    });

    await test.step('Importer selection', async () => {
      await journey.openImporter();
      await runA11yScan();
      await journey.fillImporter();
      await journey.saveImporter();
    });

    await test.step('Place of destination selection', async () => {
      await journey.openPlaceOfDestination();
      await runA11yScan();
      await journey.fillPlaceOfDestination();
      await journey.savePlaceOfDestination();
    });

    await test.step('CPH number', async () => {
      await journey.openCphNumber();
      await runA11yScan();
      await journey.fillCphNumber();
      await journey.saveCphNumber();
    });

    await test.step('Entry point', async () => {
      await journey.saveAddresses();
      await runA11yScan();
      await journey.fillEntryPoint();
      await journey.saveEntryPoint();
    });

    await test.step('Transporter', async () => {
      await runA11yScan();
    });

    await test.step('Transporter selection', async () => {
      await journey.openTransporterSelection();
      await runA11yScan();
      await journey.selectTransporter();
      await journey.saveTransporter();
    });

    await test.step('Contact address', async () => {
      await runA11yScan();
      await journey.fillContactAddress();
      await journey.saveContactAddress();
    });

    await test.step('Review notification', async () => {
      await runA11yScan();
      await journey.confirmReview();
    });

    await test.step('Declaration', async () => {
      await runA11yScan();
      await journey.fillDeclaration();
      await journey.submitDeclaration();
    });
  });
});
