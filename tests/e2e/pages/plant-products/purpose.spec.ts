import { test, expect } from '@fixtures';
import { importPurposes } from '@domain/plant-products/constants/import-purposes';
import { SET_BASES } from '@page-objects/base/sets';

test.describe('Plant-products purpose page', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await pages.hub.task('Purpose').click();
    await pages.aboutTheConsignment.heading.waitFor();
  });

  test('renders all normalised purpose choices', async ({ plantProductsPages: pages }) => {
    await expect(pages.aboutTheConsignment.heading).toBeVisible();
    for (const purpose of Object.values(importPurposes)) {
      await expect(pages.aboutTheConsignment.reason(purpose.display)).toBeVisible();
    }
  });

  test('an empty submission shows linked summary and field errors', async ({ plantProductsPages: pages }) => {
    await pages.aboutTheConsignment.saveAndContinue.click();

    await expect(pages.aboutTheConsignment.errorSummary).toBeVisible();
    await expect(pages.aboutTheConsignment.errorSummary.getByRole('link')).toHaveAttribute('href', '#reasonForImport');
    await expect(pages.aboutTheConsignment.reasonError).toContainText('Select the main reason for importing the consignment');
  });

  test('saves the normalised enum and resumes the selected reason', async ({ plantProductsApi, plantProductsPages: pages }) => {
    const journeyId = pages.aboutTheConsignment.journeyIdFromUrl();
    await pages.aboutTheConsignment.reason(importPurposes.reConformityCheck.display).check();
    await pages.aboutTheConsignment.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}$`).test(url.pathname));
    await expect(pages.hub.rowStatus('Purpose')).toHaveText('Completed');
    const persisted = await plantProductsApi.load(journeyId);
    expect(persisted.reasonForImport).toBe(importPurposes.reConformityCheck.value);

    await pages.hub.task('Purpose').click();
    await expect(pages.aboutTheConsignment.reason(importPurposes.reConformityCheck.display)).toBeChecked();
  });

  test('the back link returns to the prefixed hub', async ({ plantProductsPages: pages }) => {
    const journeyId = pages.aboutTheConsignment.journeyIdFromUrl();
    await pages.aboutTheConsignment.backLink.click();

    await expect(pages.page).toHaveURL((url) => new RegExp(`^${SET_BASES.plantProducts}/notifications/${journeyId}$`).test(url.pathname));
    await expect(pages.hub.heading).toBeVisible();
  });
});
