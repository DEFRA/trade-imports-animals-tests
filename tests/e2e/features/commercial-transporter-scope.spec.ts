import { test, expect } from '@fixtures';

const COMMERCIAL_TRANSPORTER = 'García Livestock Transport SL';

test.describe('Commercial transporter scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const openTransporters = () => journey.reachTransporterFromHub();

    // The type question sits behind "Add a transporter" now, so every branch is
    // reached through the add route rather than off the list itself.
    const chooseType = async (type: 'Commercial' | 'Private') => {
      await pages.transporter.addTransporter.click();
      await pages.transporterAdd.heading.waitFor();
      await pages.transporterAdd.transporterType(type).check();
      await pages.transporterAdd.saveAndContinue.click();
    };

    // Commercial transporter: the select page opens; choosing a transporter
    // copies its name, address and approval number into the answer.
    await openTransporters();
    await chooseType('Commercial');
    await expect(pages.transporterSelection.heading).toBeVisible();
    await pages.transporterSelection.transporter(COMMERCIAL_TRANSPORTER).check();
    await pages.transporterSelection.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    // The copy persists: walking back in re-derives the checked option from the
    // copied name, on the list and on the register alike.
    await openTransporters();
    await expect(pages.transporter.transporter(COMMERCIAL_TRANSPORTER)).toBeChecked();
    await chooseType('Commercial');
    await expect(pages.transporterSelection.heading).toBeVisible();
    await expect(pages.transporterSelection.transporter(COMMERCIAL_TRANSPORTER)).toBeChecked();
    await pages.transporterSelection.saveAndContinue.click();

    // Private transporter: the select page is no longer owed — choosing the
    // private type walks on to the private details page; a blank save there
    // returns to the hub.
    await openTransporters();
    await chooseType('Private');
    await expect(pages.privateTransporter.heading).toBeVisible();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.overview.heading).toBeVisible();

    // Back to commercial: leaving scope wiped the saved transporter — no radio
    // is pre-selected on the select page.
    await openTransporters();
    await chooseType('Commercial');
    await expect(pages.transporterSelection.heading).toBeVisible();
    await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);
  });
});
