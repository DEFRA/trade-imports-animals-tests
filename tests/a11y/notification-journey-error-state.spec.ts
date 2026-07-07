import { test } from '@fixtures/a11y';

// Only pages with server-side validation are scanned in the error state; the
// invalid inputs mirror the @validation tests in tests/e2e/pages/. The other
// pages are walked through with valid input to reach the next validation page.
test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ notificationJourney }) => {
    await notificationJourney.toNotificationDashboard();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    notificationJourney,
    pages,
    runA11yScan,
  }) => {
    await test.step('Origin of import with validation errors', async () => {
      await notificationJourney.toOriginOfImport();
      await pages.originOfImport.inputInternalReferenceNumber.fill('!');
      await pages.originOfImport.btnSaveAndContinue.click();
      await pages.originOfImport.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await notificationJourney.fillOriginOfImport({ internalReference: 'InternalReference123' });
      await notificationJourney.saveOriginOfImport();
    });

    await test.step('Continue to accompanying documents', async () => {
      await notificationJourney.fillCommoditySelection();
      await notificationJourney.saveCommoditySelection();
      await notificationJourney.fillSpeciesSelection();
      await notificationJourney.saveSpeciesSelection();
      await notificationJourney.fillImportReason();
      await notificationJourney.saveImportReason();
      await notificationJourney.fillCommodityDetails();
      await notificationJourney.saveCommodityDetails();
      await notificationJourney.fillAnimalIdentification();
      await notificationJourney.saveAnimalIdentification();
      await notificationJourney.fillAdditionalDetails();
      await notificationJourney.saveAdditionalDetails();
    });

    await test.step('Accompanying documents with validation errors', async () => {
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await pages.accompanyingDocuments.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await notificationJourney.saveAccompanyingDocuments();
    });

    await test.step('Continue to CPH number', async () => {
      await notificationJourney.openPlaceOfOrigin();
      await notificationJourney.fillPlaceOfOrigin();
      await notificationJourney.savePlaceOfOrigin();
      await notificationJourney.openConsignor();
      await notificationJourney.fillConsignor();
      await notificationJourney.saveConsignor();
      await notificationJourney.openConsignee();
      await notificationJourney.fillConsignee();
      await notificationJourney.saveConsignee();
      await notificationJourney.openImporter();
      await notificationJourney.fillImporter();
      await notificationJourney.saveImporter();
      await notificationJourney.openPlaceOfDestination();
      await notificationJourney.fillPlaceOfDestination();
      await notificationJourney.savePlaceOfDestination();
      await notificationJourney.openCphNumber();
    });

    await test.step('CPH number with validation errors', async () => {
      await pages.cphNumber.inputCphNumber.fill('12345678');
      await pages.cphNumber.btnSaveAndContinue.click();
      await pages.cphNumber.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await notificationJourney.fillCphNumber();
      await notificationJourney.saveCphNumber();
    });

    await test.step('Entry point with validation errors', async () => {
      await notificationJourney.saveAddresses();
      await notificationJourney.fillEntryPoint();
      await pages.entryPoint.fillArrivalDate({ day: '32', month: '1', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await pages.entryPoint.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await notificationJourney.fillEntryPoint();
      await notificationJourney.saveEntryPoint();
    });

    await test.step('Continue to declaration', async () => {
      await notificationJourney.openTransporterSelection();
      await notificationJourney.selectTransporter();
      await notificationJourney.saveTransporter();
      await notificationJourney.fillContactAddress();
      await notificationJourney.saveContactAddress();
      await notificationJourney.confirmReview();
    });

    await test.step('Declaration with validation errors', async () => {
      await pages.declaration.btnSubmitNotification.click();
      await pages.declaration.errorSummaryItems.first().waitFor();
      await runA11yScan();
      await notificationJourney.fillDeclaration();
      await notificationJourney.submitDeclaration();
    });
  });
});
