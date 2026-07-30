import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { fileUploadPaths } from '@resources/file-upload/paths';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input
// (radios.mjs), which axe's aria-allowed-attr rule rejects — an upstream
// disagreement, not a service defect. Exclude just that input from origin scans.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.startNotification();
  });

  test('each notification journey page has no accessibility violations after user input', async ({ journey, pages, runA11yScan }) => {
    await test.step('Origin of import', async () => {
      await pages.overview.task('Where is this consignment coming from?').click();
      await journey.fillOriginOfImport({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
      await runA11yScan({ exclude: conditionalRadioInput });
      await journey.saveOriginOfImport();
      await pages.overview.heading.waitFor();
    });

    await test.step('Commodity selection', async () => {
      await pages.overview.task('What are you importing?').click();
      await pages.commoditySelection.searchAndSelect('Cow', ['Bos taurus']);
      await runA11yScan();
      await pages.commoditySelection.saveAndContinue.click();
    });

    await test.step('Consignment details', async () => {
      await pages.consignmentDetails.heading.waitFor();
      await pages.consignmentDetails.numberOfAnimals.fill('1');
      await pages.consignmentDetails.numberOfPackages.fill('5');
      await runA11yScan();
      await pages.consignmentDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await pages.overview.task('Animal identification details').click();
      await pages.animalIdentification.earTag.fill('UK123456789012');
      await runA11yScan();
      await pages.animalIdentification.saveAndFinish.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await pages.overview.task('Main reason for importing').click();
      await pages.importReason.reason('Internal market').check();
      await runA11yScan();
      await pages.importReason.saveAndContinue.click();
    });

    await test.step('Import purpose', async () => {
      await pages.importPurpose.heading.waitFor();
      await pages.importPurpose.purpose('Breeding').check();
      await runA11yScan();
      await pages.importPurpose.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await pages.additionalDetails.heading.waitFor();
      await pages.additionalDetails.certifiedFor('Slaughter').check();
      await pages.additionalDetails.containsUnweanedAnimals('No').check();
      await runA11yScan();
      await pages.additionalDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await pages.overview.task('Uploaded documents').click();
      await pages.accompanyingDocuments.heading.waitFor();
      await pages.accompanyingDocuments.fillDocument(
        'InternalReference123',
        { day: '3', month: '1', year: '2026' },
        fileUploadPaths.safeFile1kbPdf,
      );
      await runA11yScan();
      await pages.overview.open(pages.accompanyingDocuments.journeyIdFromUrl());
      await pages.overview.heading.waitFor();
    });

    await test.step('Consignor or exporter selection', async () => {
      await pages.overview.task('Roles and addresses').click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Consignor or exporter').click();
      await pages.consignorSelection.party('Astra Rosales').check();
      await runA11yScan();
      await pages.consignorSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses', async () => {
      await pages.addresses.addParty('Place of destination').click();
      await pages.destinationSelection.party('Tech Imports Ltd').check();
      await pages.destinationSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Place of origin').click();
      await pages.placeOfOriginSelection.party('Origin Farm').check();
      await pages.placeOfOriginSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Consignee').click();
      await pages.consigneeSelection.party('British Livestock Ltd').check();
      await pages.consigneeSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Importer').click();
      await pages.importerSelection.party('Import Co UK').check();
      await pages.importerSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
    });

    await test.step('Consignment addresses with all parties added', async () => {
      await runA11yScan();
      await pages.addresses.continueButton.click();
    });

    await test.step('CPH number', async () => {
      await pages.cphNumber.heading.waitFor();
      await pages.cphNumber.cphNumber.fill('12/345/6789');
      await runA11yScan();
      await pages.cphNumber.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await pages.overview.task('Arrival details').click();
      await pages.arrivalDetails.heading.waitFor();
      await journey.fillArrivalDetails();
      await runA11yScan();
      await pages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with a country added', async () => {
      await pages.transitedCountries.heading.waitFor();
      await pages.transitedCountries.selectCountry('France');
      await runA11yScan();
      await pages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Transporter', async () => {
      await pages.transporter.heading.waitFor();
      await pages.transporter.transporterType('Commercial').check();
      await runA11yScan();
      await pages.transporter.saveAndContinue.click();
    });

    await test.step('Transporter selection', async () => {
      await pages.transporterSelection.heading.waitFor();
      await pages.transporterSelection.transporter('García Livestock Transport SL').check();
      await runA11yScan();
      await pages.transporterSelection.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Contact address', async () => {
      await pages.overview.task('Contact address').click();
      await pages.contactAddress.heading.waitFor();
      await pages.contactAddress.address('Animal and Plant Health Agency').check();
      await runA11yScan();
      await pages.contactAddress.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Check your answers', async () => {
      await pages.overview.task('Check and submit').click();
      await pages.notificationView.heading.waitFor();
      await runA11yScan();
      await pages.notificationView.continueButton.click();
    });

    await test.step('Declaration', async () => {
      await pages.declaration.heading.waitFor();
      await pages.declaration.confirmation.check();
      await runA11yScan();
      await pages.declaration.continueButton.click();
    });

    await test.step('Notification submitted', async () => {
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
      await runA11yScan();
    });
  });
});
