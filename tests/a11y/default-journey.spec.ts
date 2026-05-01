import { test } from '@fixtures/a11y';
import { defaultJourneyOptions } from '@flows/journeys';

test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.describe('Initial state (no user input)', () => {
    test('each visited page has no accessibility violations on initial load', async ({ journeys, pages, runA11yScan }) => {
      // Scan notification dashboard
      await journeys.toNotificationDashboard();
      await runA11yScan();
      await pages.notificationDashboard.btnCreateNewNotification.click();

      // Scan origin of import page
      await runA11yScan();
      await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
      await pages.originOfImport.btnSaveAndContinue.click();

      // Scan commodity selection page
      await runA11yScan();

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });

  test.describe('Completed state (valid user input)', () => {
    test('each visited page has no accessibility violations after user input', async ({ journeys, pages, runA11yScan }) => {
      await journeys.toNotificationDashboard();
      await pages.notificationDashboard.btnCreateNewNotification.click();

      // Scan origin of import page
      await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
      await pages.originOfImport.inputInternalReferenceNumber.fill('InternalReference123');
      await runA11yScan();
      await pages.originOfImport.btnSaveAndContinue.click();

      // Scan commodity selection page
      await pages.commoditySelection.dropdownCommodity.selectOption(defaultJourneyOptions.commodityCode);
      await runA11yScan();

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });

  test.describe('Error state (validation failures)', () => {
    test('each visited page has no accessibility violations when validation errors are shown', async ({ journeys, pages, runA11yScan }) => {
      await journeys.toNotificationDashboard();
      await pages.notificationDashboard.btnCreateNewNotification.click();

      // Scan origin of import page
      await pages.originOfImport.inputInternalReferenceNumber.fill('!');
      await pages.originOfImport.btnSaveAndContinue.click();
      await runA11yScan();
      await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
      await pages.originOfImport.inputInternalReferenceNumber.fill('InternalReference123');
      await pages.originOfImport.btnSaveAndContinue.click();

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });
});
