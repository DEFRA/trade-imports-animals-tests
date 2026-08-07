import { test, expect } from '@fixtures';

test.describe('Addresses are linked, not copied', { tag: ['@integration'] }, () => {
  test('editing a linked address in the address book changes what the draft notification shows', async ({
    journey,
    pages,
    addressBookApi,
  }) => {
    // Its own address rather than a seeded one: this spec edits the record, and
    // the seeded fixtures are shared with every other spec running alongside it.
    const originalName = `Linked Farm ${Date.now()}`;
    const renamed = `${originalName} (renamed)`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '3 Link Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'linked@example.co.uk',
    });

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();

    // Newly created, so it is at the back of the book — search rather than page.
    await pages.consignorSelection.search.fill(originalName);
    await pages.consignorSelection.searchButton.click();
    await pages.consignorSelection.party(originalName).check();
    await pages.consignorSelection.saveAndContinue.click();

    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(originalName);
    await expect(consignorRow).toContainText('Carlisle');

    // Edit the record in the address book, with the journey none the wiser. If
    // the notification held a copy, the row would still read the old details.
    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '3 Link Lane',
      townOrCity: 'Penrith',
      postcode: 'CA11 7AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'linked@example.co.uk',
    });

    await pages.page.reload();
    await expect(consignorRow).toContainText(renamed);
    await expect(consignorRow).toContainText('Penrith');
    await expect(consignorRow).not.toContainText('Carlisle');
  });
});
