import { test, WCAG_STANDARD } from '@fixtures/a11y';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input
// (radios.mjs), which axe's aria-allowed-attr rule rejects — an upstream
// disagreement, not a service defect. Exclude just that input from origin scans.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations on initial load', async ({ journey, pages, runA11yScan }) => {
    await test.step('Notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Origin of import', async () => {
      await pages.notificationDashboard.btnCreateNewNotification.click();
      await pages.originOfImport.heading.waitFor();
      await runA11yScan({ exclude: conditionalRadioInput });
    });

    // The entry guard holds the journey on origin until it is answered, so the
    // overview is only reachable once origin has been saved.
    await test.step('Overview', async () => {
      const journeyId = pages.originOfImport.journeyIdFromUrl();
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
      await pages.overview.open(journeyId);
      await pages.overview.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Commodity selection', async () => {
      await pages.overview.task('What are you importing?').click();
      await pages.commoditySelection.heading.waitFor();
      await runA11yScan();
      await pages.commoditySelection.selectSpecies(['Bos taurus']);
      await pages.commoditySelection.saveAndContinue.click();
    });

    await test.step('Consignment details', async () => {
      await pages.consignmentDetails.heading.waitFor();
      await runA11yScan();
      await pages.consignmentDetails.numberOfAnimals.fill('1');
      await pages.consignmentDetails.numberOfPackages.fill('5');
      await pages.consignmentDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await pages.overview.task('Animal identification details').click();
      await pages.animalIdentification.heading.waitFor();
      await runA11yScan();
      await pages.animalIdentification.earTag.fill('UK123456789012');
      await pages.animalIdentification.saveAndFinish.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await pages.overview.task('Main reason for importing').click();
      await pages.importReason.heading.waitFor();
      await runA11yScan();
      await pages.importReason.reason('Internal market').check();
      await pages.importReason.saveAndContinue.click();
    });

    await test.step('Import purpose', async () => {
      await pages.importPurpose.heading.waitFor();
      await runA11yScan();
      await pages.importPurpose.purpose('Breeding').check();
      await pages.importPurpose.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await pages.additionalDetails.heading.waitFor();
      await runA11yScan();
      await pages.additionalDetails.certifiedFor('Slaughter').check();
      await pages.additionalDetails.containsUnweanedAnimals('No').check();
      await pages.additionalDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await pages.overview.task('Uploaded documents').click();
      await pages.accompanyingDocuments.heading.waitFor();
      await runA11yScan();
      await pages.overview.open(pages.accompanyingDocuments.journeyIdFromUrl());
      await pages.overview.heading.waitFor();
    });

    await test.step('Consignment addresses', async () => {
      await pages.overview.task('Roles and addresses').click();
      await pages.addresses.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Consignor or exporter selection', async () => {
      await pages.addresses.addParty('Consignor or exporter').click();
      await pages.consignorSelection.heading.waitFor();
      await runA11yScan();
      await pages.consignorSelection.select('Astra Rosales');
      await pages.consignorSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses and CPH number', async () => {
      await pages.addresses.addParty('Place of destination').click();
      await pages.destinationSelection.select('Tech Imports Ltd');
      await pages.destinationSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Place of origin').click();
      await pages.placeOfOriginSelection.select('Origin Farm');
      await pages.placeOfOriginSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Consignee').click();
      await pages.consigneeSelection.select('British Livestock Ltd');
      await pages.consigneeSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Importer').click();
      await pages.importerSelection.select('Import Co UK');
      await pages.importerSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.continueButton.click();
    });

    await test.step('CPH number', async () => {
      await pages.cphNumber.heading.waitFor();
      await runA11yScan();
      await pages.cphNumber.cphNumber.fill('12/345/6789');
      await pages.cphNumber.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await pages.overview.task('Arrival details').click();
      await pages.arrivalDetails.heading.waitFor();
      await runA11yScan();
      await journey.fillArrivalDetails();
      await pages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries', async () => {
      await pages.transitedCountries.heading.waitFor();
      await runA11yScan();
      await pages.transitedCountries.selectCountry('France');
      await pages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Transporter', async () => {
      await pages.transporter.heading.waitFor();
      await runA11yScan();
      await pages.transporter.transporterType('Commercial').check();
      await pages.transporter.saveAndContinue.click();
    });

    await test.step('Transporter selection', async () => {
      await pages.transporterSelection.heading.waitFor();
      await runA11yScan();
      await pages.transporterSelection.transporter('García Livestock Transport SL').check();
      await pages.transporterSelection.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Contact address', async () => {
      await pages.overview.task('Contact address').click();
      await pages.contactAddress.heading.waitFor();
      await runA11yScan();
      await pages.contactAddress.address('Animal and Plant Health Agency').check();
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
      await runA11yScan();
    });
  });
});
