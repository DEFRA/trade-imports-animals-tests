import { test, WCAG_STANDARD } from '@fixtures/a11y';

// Only pages with server-side validation are scanned in the error state; the
// invalid inputs mirror the @validation tests in tests/e2e/pages/. The other
// pages are walked through with valid input to reach the next validation page.
test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    journey,
    pages,
    runA11yScan,
  }) => {
    await test.step('Origin of import with validation errors', async () => {
      await journey.toOriginOfImport();
      await pages.originOfImport.inputInternalReferenceNumber.fill('!');
      await pages.originOfImport.btnSaveAndContinue.click();
      await pages.originOfImport.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await journey.fillOriginOfImport({ internalReference: 'InternalReference123' });
      await journey.saveOriginOfImport();
    });

    await test.step('Continue to accompanying documents', async () => {
      await journey.fillCommoditySelection();
      await journey.saveCommoditySelection();
      await journey.fillSpeciesSelection();
      await journey.saveSpeciesSelection();
      await journey.fillImportReason();
      await journey.saveImportReason();
      await journey.fillCommodityDetails();
      await journey.saveCommodityDetails();
      await journey.fillAnimalIdentification();
      await journey.saveAnimalIdentification();
      await journey.fillAdditionalDetails();
      await journey.saveAdditionalDetails();
    });

    await test.step('Accompanying documents with validation errors', async () => {
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await pages.accompanyingDocuments.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await journey.saveAccompanyingDocuments();
    });

    await test.step('Continue to CPH number', async () => {
      await journey.openPlaceOfOrigin();
      await journey.fillPlaceOfOrigin();
      await journey.savePlaceOfOrigin();
      await journey.openConsignor();
      await journey.fillConsignor();
      await journey.saveConsignor();
      await journey.openConsignee();
      await journey.fillConsignee();
      await journey.saveConsignee();
      await journey.openImporter();
      await journey.fillImporter();
      await journey.saveImporter();
      await journey.openPlaceOfDestination();
      await journey.fillPlaceOfDestination();
      await journey.savePlaceOfDestination();
      await journey.openCphNumber();
    });

    await test.step('CPH number with validation errors', async () => {
      await pages.cphNumber.inputCphNumber.fill('12345678');
      await pages.cphNumber.btnSaveAndContinue.click();
      await pages.cphNumber.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await journey.fillCphNumber();
      await journey.saveCphNumber();
    });

    await test.step('Entry point with validation errors', async () => {
      await journey.saveAddresses();
      await journey.fillEntryPoint();
      await pages.entryPoint.fillArrivalDate({ day: '32', month: '1', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await pages.entryPoint.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await journey.fillEntryPoint();
      await journey.saveEntryPoint();
    });

    await test.step('Continue to declaration', async () => {
      await journey.openTransporterSelection();
      await journey.selectTransporter();
      await journey.saveTransporter();
      await journey.fillContactAddress();
      await journey.saveContactAddress();
      await journey.confirmReview();
    });

    await test.step('Declaration with validation errors', async () => {
      await pages.declaration.btnSubmitNotification.click();
      await pages.declaration.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await journey.fillDeclaration();
      await journey.submitDeclaration();
    });
  });
});
