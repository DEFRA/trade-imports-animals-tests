import { test, expect } from '@fixtures';

const COMMERCIAL_TRANSPORTER = 'García Livestock Transport SL';

test.describe('Commercial transporter scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const openTransporters = () => journey.reachTransporterFromHub();

    // Commercial transporter: the select page opens; choosing a transporter
    // copies its name, address and approval number into the answer.
    await openTransporters();
    await pages.transporter.transporterType('Commercial').check();
    await pages.transporter.saveAndContinue.click();
    await expect(pages.transporterSelection.heading).toBeVisible();
    await pages.transporterSelection.transporter(COMMERCIAL_TRANSPORTER).check();
    await pages.transporterSelection.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    // The copy persists: walking back in re-derives the checked option from the
    // copied name.
    await openTransporters();
    await pages.transporter.saveAndContinue.click();
    await expect(pages.transporterSelection.heading).toBeVisible();
    await expect(pages.transporterSelection.transporter(COMMERCIAL_TRANSPORTER)).toBeChecked();
    await pages.transporterSelection.saveAndContinue.click();

    // Private transporter: the select page is no longer owed — saving the type
    // skips it and walks on to the private details page; a blank save there
    // returns to the hub.
    await openTransporters();
    await pages.transporter.transporterType('Private').check();
    await pages.transporter.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'Private transporter details' })).toBeVisible();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.overview.heading).toBeVisible();

    // Back to commercial: leaving scope wiped the saved transporter — no radio
    // is pre-selected on the select page.
    await openTransporters();
    await pages.transporter.transporterType('Commercial').check();
    await pages.transporter.saveAndContinue.click();
    await expect(pages.transporterSelection.heading).toBeVisible();
    await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);
  });
});
