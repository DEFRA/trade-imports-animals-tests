import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input,
// which axe's aria-allowed-attr rule rejects. This is an upstream disagreement,
// so exclude only the named input rather than disabling the rule suite-wide.
const transportContainerConditionalRadio = '#usesContainers';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.startNotification();
  });

  test('plant journey validation pages have no accessibility violations when representative errors are shown', async ({
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    const reference = pages.hub.journeyIdFromUrl();

    await test.step('Country select with validation errors', async () => {
      await pages.countryOfOrigin.open(reference, false);
      await pages.countryOfOrigin.countryOfOrigin.selectOption('');
      await pages.countryOfOrigin.saveAndContinue.click();
      await expect(pages.countryOfOrigin.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Purpose radios with validation errors', async () => {
      await pages.aboutTheConsignment.open(reference, false);
      await pages.aboutTheConsignment.saveAndContinue.click();
      await expect(pages.aboutTheConsignment.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Commodity input method radios with validation errors', async () => {
      await pages.commodityInputMethod.open(reference, false);
      await pages.commodityInputMethod.saveAndContinue.click();
      await expect(pages.commodityInputMethod.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Commodity search with validation errors', async () => {
      await pages.commodityInputMethod.method('Manual entry').check();
      await pages.commodityInputMethod.saveAndContinue.click();
      await pages.commoditySearch.heading.waitFor();
      await pages.commoditySearch.codeSearchButton.click();
      await expect(pages.commoditySearch.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Additional-details numeric input with validation errors', async () => {
      await pages.commodityAdditionalDetails.open(reference, false);
      await pages.commodityAdditionalDetails.saveAndContinue.click();
      await expect(pages.commodityAdditionalDetails.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Transport date, selects, numeric fields and radios with validation errors', async () => {
      await pages.transportBeforeBip.open(reference, false);
      await pages.transportBeforeBip.saveAndContinue.click();
      await expect(pages.transportBeforeBip.errorSummary).toBeVisible();
      await runA11yScan({ exclude: transportContainerConditionalRadio });
    });

    await test.step('Nominated-contact repeating group with validation errors', async () => {
      await pages.nominatedContact.open(reference, false);
      await pages.nominatedContact.addAnother.click();
      await expect(pages.nominatedContact.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Accompanying-document repeating group with validation errors', async () => {
      await pages.accompanyingDocuments.open(reference, false);
      await pages.accompanyingDocuments.addDocument.click();
      await expect(pages.accompanyingDocuments.errorSummary).toBeVisible();
      await runA11yScan();
    });
  });
});
