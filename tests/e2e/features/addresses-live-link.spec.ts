import { test, expect } from '@fixtures';

test.describe('Addresses are linked, not copied', { tag: ['@integration'] }, () => {
  test('editing a linked address in the address book changes what the draft notification shows', async ({
    journey,
    pages,
    addressBookApi,
  }) => {
    // Its own address rather than a seeded one: this spec edits the record, and
    // the seeded fixtures are shared with every other spec running alongside it.
    // Distinct names, not one derived from the other, so "the old name is gone"
    // is a real assertion rather than one substring matching another.
    const stamp = Date.now();
    const originalName = `Linked Farm ${stamp}`;
    const renamed = `Renamed Holding ${stamp}`;
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

    // The landing row renders the party's name — that name is read back from
    // the address book on every render, so it is what shows the link is live.
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(originalName);

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

    // A copy taken at selection would still read the old name here.
    await pages.page.reload();
    await expect(consignorRow).toContainText(renamed);
    await expect(consignorRow).not.toContainText(originalName);
  });
});
