import { test } from '@fixtures/a11y';
import { defaultJourneyOptions } from '@flows/journeys';

test.describe('Accessibility WCAG 2.2 AA', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationDashboard();
  });

  test.describe('Initial state (no user input)', () => {
    test('each visited page has no accessibility violations on initial load', async ({ pages, runA11yScan }) => {
      await test.step('Notification dashboard', async () => {
        await runA11yScan();
        await pages.notificationDashboard.btnCreateNewNotification.click();
      });

      await test.step('Origin of import', async () => {
        await runA11yScan();
        await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
        await pages.originOfImport.btnSaveAndContinue.click();
      });

      await test.step('Commodity selection', async () => {
        await runA11yScan();
      });

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });

  test.describe('Completed state (valid user input)', () => {
    test('each visited page has no accessibility violations after user input', async ({ pages, runA11yScan }) => {
      await test.step('Notification dashboard', async () => {
        await pages.notificationDashboard.btnCreateNewNotification.click();
      });

      await test.step('Origin of import', async () => {
        await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
        await pages.originOfImport.inputInternalReferenceNumber.fill('InternalReference123');
        await runA11yScan();
        await pages.originOfImport.btnSaveAndContinue.click();
      });

      await test.step('Commodity selection', async () => {
        await pages.commoditySelection.dropdownCommodity.selectOption(defaultJourneyOptions.commodityCode);
        await runA11yScan();
      });

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });

  test.describe('Error state (validation failures)', () => {
    test('each visited page has no accessibility violations when validation errors are shown', async ({ pages, runA11yScan }) => {
      await test.step('Notification dashboard', async () => {
        await pages.notificationDashboard.btnCreateNewNotification.click();
      });

      await test.step('Origin of import', async () => {
        await pages.originOfImport.inputInternalReferenceNumber.fill('!');
        await pages.originOfImport.btnSaveAndContinue.click();
        await runA11yScan();
        await pages.originOfImport.dropdownCountry.selectOption(defaultJourneyOptions.countryCode);
        await pages.originOfImport.inputInternalReferenceNumber.fill('InternalReference123');
        await pages.originOfImport.btnSaveAndContinue.click();
      });

      // TODO: extend scans along the journey; dedupe navigation via journey helpers if possible.
    });
  });
});
