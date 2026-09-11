import { test, expect } from '@fixtures';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { type NewAddressDetails } from '@page-objects/ins/ins-address-book-add-page';

test.describe('Add an address from the journey via INS', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the handshake crosses animals-frontend and ins-frontend, which only the compose stack runs together');
  });

  test('saving a new address in INS returns to the picker with it selected and committed', async ({ journey, pages }) => {
    const stamp = Date.now();
    const farmName = `Handshake Farm ${stamp}`;
    const details: NewAddressDetails = {
      name: farmName,
      addressLine1: '9 Handshake Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA2 7AA',
      country: 'United Kingdom',
      phone: '01228 555 0199',
      email: `handshake-${stamp}@example.co.uk`,
    };

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    await pages.addresses.addParty('Consignor or exporter').click();

    await pages.consignorSelection.addNewAddress.click();
    await expect(pages.page).toHaveURL(/localhost:3002\/address-book\/add\?/);
    await expect(pages.insAddressBookAdd.heading).toBeVisible();

    await pages.insAddressBookAdd.fill(details);
    await pages.insAddressBookAdd.save();

    await expect(pages.consignorSelection.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/consignors\/select/);
    await pages.consignorSelection.search.fill(farmName);
    await pages.consignorSelection.searchButton.click();
    await expect(pages.consignorSelection.party(farmName)).toBeChecked();

    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(pages.addresses.partyRow('Consignor or exporter')).toContainText(farmName);
  });

  test('cancelling INS add returns to the picker without saving an address', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    await pages.addresses.addParty('Consignor or exporter').click();

    await pages.consignorSelection.addNewAddress.click();
    await expect(pages.insAddressBookAdd.heading).toBeVisible();

    await pages.insAddressBookAdd.btnCancelFromJourney.click();

    await expect(pages.consignorSelection.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/consignors\/select/);

    await pages.page.getByRole('link', { name: 'Back' }).click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(pages.addresses.partyRow('Consignor or exporter')).toContainText('Not added yet');
  });
});
