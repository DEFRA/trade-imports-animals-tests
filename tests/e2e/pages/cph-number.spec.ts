import { test, expect } from '@fixtures';

test.describe('CPH number page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('shows an error summary when submitted empty', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();
    await pages.overview.task('Roles and addresses').click();

    const parties = [
      ['Consignor or exporter', 'Astra Rosales'],
      ['Place of destination', 'Tech Imports Ltd'],
      ['Place of origin', 'Origin Farm'],
      ['Consignee', 'British Livestock Ltd'],
      ['Importer', 'Import Co UK'],
    ] as const;
    for (const [role, name] of parties) {
      await pages.addresses.addParty(role).click();
      await pages.page.getByRole('radio', { name }).check();
      await pages.page.getByRole('button', { name: 'Save and continue' }).click();
      await pages.addresses.heading.waitFor();
    }
    await pages.addresses.continueButton.click();
    await pages.cphNumber.heading.waitFor();

    await pages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
