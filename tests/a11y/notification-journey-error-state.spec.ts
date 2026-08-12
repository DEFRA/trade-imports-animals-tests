import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input
// (radios.mjs), which axe's aria-allowed-attr rule rejects — an upstream
// disagreement, not a service defect. Exclude just that input from origin scans.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

// Only pages with server-side validation are scanned in the error state; the
// invalid submits mirror the error-summary tests in tests/e2e/pages/. The
// other sections are answered with valid input to unlock the next one.
test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.startNotification();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    journey,
    pages,
    runA11yScan,
  }) => {
    const errorSummaryHeading = pages.page.getByRole('heading', { name: 'There is a problem' });

    await test.step('Origin of import with validation errors', async () => {
      await pages.overview.task('Where is this consignment coming from?').click();
      await pages.originOfImport.heading.waitFor();
      await pages.originOfImport.countryOfOrigin.selectOption({ label: 'Select a country' });
      await pages.originOfImport.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan({ exclude: conditionalRadioInput });
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
      await pages.overview.heading.waitFor();
    });

    await test.step('Continue to CPH number', async () => {
      await journey.answerCommodity();
      await journey.fillAddressesToCph();
    });

    await test.step('CPH number with validation errors', async () => {
      await pages.cphNumber.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await pages.cphNumber.cphNumber.fill('12/345/6789');
      await pages.cphNumber.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Arrival details with validation errors', async () => {
      await pages.overview.task('Arrival details').click();
      await pages.arrivalDetails.heading.waitFor();
      await pages.arrivalDetails.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await journey.fillArrivalDetails();
      await pages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with validation errors', async () => {
      await pages.transitedCountries.heading.waitFor();
      await pages.transitedCountries.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await pages.transitedCountries.selectCountry('France');
      await pages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Continue to declaration', async () => {
      await pages.transporter.heading.waitFor();
      await pages.transporter.transporterType('Commercial').check();
      await pages.transporter.saveAndContinue.click();
      await pages.transporterSelection.heading.waitFor();
      await pages.transporterSelection.transporter('García Livestock Transport SL').check();
      await pages.transporterSelection.saveAndContinue.click();
      await pages.overview.heading.waitFor();
      await journey.answerAnimalIdentification();
      await journey.answerReasonAndAdditionalDetails();
      await journey.answerContact();
      await pages.overview.task('Check and submit').click();
      await pages.notificationView.heading.waitFor();
      await pages.notificationView.continueButton.click();
      await pages.declaration.heading.waitFor();
    });

    await test.step('Declaration with validation errors', async () => {
      await pages.declaration.continueButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
    });
  });
});
