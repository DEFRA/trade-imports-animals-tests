import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the CPH page and addresses-hub row show only when a CPH-triggering commodity line exists', async ({ journey, pages }) => {
    const journeyId = await journey.startNotification();
    // Commodities is gated on origin (RULE 1); answering it also unlocks the
    // addresses section each added line opens.
    await journey.answerOrigin();

    const page = pages.page;
    const cphRow = page.locator('.govuk-summary-list__row', {
      has: page.getByText('County Parish Holding number (CPH)', { exact: true }),
    });

    // Add one commodity line for the given species, taking the fewest steps: the
    // counts are submit-enforced, so the details page saves blank straight back
    // to the hub.
    const addCommodity = async (species: string): Promise<void> => {
      await pages.overview.open(journeyId);
      await pages.overview.task('What are you importing?').click();
      await pages.commoditySelection.selectSpecies([species]);
      await pages.commoditySelection.saveAndContinue.click();
      await expect(pages.consignmentDetails.heading).toBeVisible();
      await pages.consignmentDetails.saveAndContinue.click();
      await expect(pages.overview.heading).toBeVisible();
    };

    const openAddresses = async (): Promise<void> => {
      await pages.overview.open(journeyId);
      await pages.overview.task('Roles and addresses').click();
      await expect(pages.addresses.heading).toBeVisible();
    };

    // A non-triggering commodity (cats): CPH is out of scope, so the addresses
    // hub shows no CPH row and Continue returns straight to the hub — no CPH
    // page (the derived gate).
    await addCommodity('Felis catus');
    await openAddresses();
    await expect(cphRow).toBeHidden();
    await pages.addresses.continueButton.click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(pages.cphNumber.heading).toBeHidden();

    // Adding a triggering commodity (cattle) brings CPH into scope across the
    // commodity lines (frame:"anyItem") — the row appears in its empty state.
    await addCommodity('Bos taurus');
    await openAddresses();
    await expect(cphRow).toBeVisible();
    await expect(cphRow).toContainText('Not added yet');

    // Hub-row add flow: the Add link opens the CPH page and saving returns to
    // the addresses hub (not the sequential exit), the row showing the stored
    // slash-stripped value.
    await cphRow.getByRole('link', { name: 'Add' }).click();
    await expect(pages.cphNumber.heading).toBeVisible();
    await pages.cphNumber.cphNumber.fill('12/345/6789');
    await pages.cphNumber.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(cphRow).toContainText('123456789');

    // Filled state: the row's action reads Change, the page shows the stored
    // value, and the back link returns to the addresses hub.
    await cphRow.getByRole('link', { name: 'Change' }).click();
    await expect(pages.cphNumber.cphNumber).toHaveValue('123456789');
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(pages.addresses.heading).toBeVisible();

    // The sequential fallback stays: Continue from the addresses landing still
    // walks to the CPH tail page.
    await pages.addresses.continueButton.click();
    await expect(pages.cphNumber.heading).toBeVisible();
  });
});
