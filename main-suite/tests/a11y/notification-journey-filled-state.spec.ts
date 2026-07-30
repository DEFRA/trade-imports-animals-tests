import { test, WCAG_STANDARD } from '@main-fixtures/a11y';
import { countryCodes } from '@main-domain/constants/country-codes';
import { documentTypes } from '@main-domain/constants/document-types';
import { meansOfTransport } from '@main-domain/constants/means-of-transport';
import { fileUploadPaths } from '@main-resources/file-upload/paths';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations after user input', async ({ journey, runA11yScan }) => {
    await test.step('Origin of import', async () => {
      await journey.toOriginOfImport();
      await journey.fillOriginOfImport({ internalReference: 'InternalReference123' });
      await runA11yScan();
      await journey.saveOriginOfImport();
    });

    await test.step('Commodity selection', async () => {
      await journey.fillCommoditySelection();
      await runA11yScan();
      await journey.saveCommoditySelection();
    });

    await test.step('Species selection', async () => {
      await journey.fillSpeciesSelection();
      await runA11yScan();
      await journey.saveSpeciesSelection();
    });

    await test.step('Import reason', async () => {
      await journey.fillImportReason();
      await runA11yScan();
      await journey.saveImportReason();
    });

    await test.step('Commodity details', async () => {
      await journey.fillCommodityDetails();
      await runA11yScan();
      await journey.saveCommodityDetails();
    });

    await test.step('Animal identification', async () => {
      await journey.fillAnimalIdentification();
      await runA11yScan();
      await journey.saveAnimalIdentification();
    });

    await test.step('Additional details', async () => {
      await journey.fillAdditionalDetails();
      await runA11yScan();
      await journey.saveAdditionalDetails();
    });

    await test.step('Accompanying documents', async () => {
      const accompanyingDocuments = {
        filePath: fileUploadPaths.safeFile250bPng,
        documentType: documentTypes.veterinaryHealthCertificate,
        documentReference: 'InternalReference123',
        issueDate: { day: '02', month: '12', year: '2025' },
      };
      await journey.fillAccompanyingDocuments({ accompanyingDocuments });
      await runA11yScan();
      await journey.saveAccompanyingDocuments({ accompanyingDocuments });
    });

    await test.step('Place of origin selection', async () => {
      await journey.openPlaceOfOrigin();
      await journey.fillPlaceOfOrigin();
      await runA11yScan();
      await journey.savePlaceOfOrigin();
    });

    await test.step('Consignor selection', async () => {
      await journey.openConsignor();
      await journey.fillConsignor();
      await runA11yScan();
      await journey.saveConsignor();
    });

    await test.step('Consignee selection', async () => {
      await journey.openConsignee();
      await journey.fillConsignee();
      await runA11yScan();
      await journey.saveConsignee();
    });

    await test.step('Importer selection', async () => {
      await journey.openImporter();
      await journey.fillImporter();
      await runA11yScan();
      await journey.saveImporter();
    });

    await test.step('Place of destination selection', async () => {
      await journey.openPlaceOfDestination();
      await journey.fillPlaceOfDestination();
      await runA11yScan();
      await journey.savePlaceOfDestination();
    });

    await test.step('CPH number', async () => {
      await journey.openCphNumber();
      await journey.fillCphNumber();
      await runA11yScan();
      await journey.saveCphNumber();
    });

    await test.step('Consignment addresses with all addresses added', async () => {
      await runA11yScan();
      await journey.saveAddresses();
    });

    await test.step('Entry point', async () => {
      await journey.fillEntryPoint({ meansOfTransport: meansOfTransport.roadVehicle });
      await runA11yScan();
      await journey.saveEntryPoint();
    });

    await test.step('Transited countries with a country added', async () => {
      await journey.addTransitedCountry(countryCodes.eu.germany.display);
      await runA11yScan();
      await journey.saveTransitedCountries();
    });

    await test.step('Transporter with transporter added', async () => {
      await journey.openTransporterSelection();
      await journey.selectTransporter();
      await runA11yScan();
      await journey.saveTransporter();
    });

    await test.step('Contact address', async () => {
      await journey.fillContactAddress();
      await runA11yScan();
      await journey.saveContactAddress();
    });

    await test.step('Review notification', async () => {
      await runA11yScan();
      await journey.confirmReview();
    });

    await test.step('Declaration', async () => {
      await journey.fillDeclaration();
      await runA11yScan();
      await journey.submitDeclaration();
    });
  });
});
