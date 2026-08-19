import { test, expect } from '@fixtures';

test.describe('Addresses are linked, not copied', { tag: ['@integration'] }, () => {
  test('editing a linked address in the address book changes what the draft notification shows', async ({
    journey,
    pages,
    addressBookApi,
  }) => {
    // Its own address rather than a shared fixture: this spec edits the record,
    // and the E2E fixtures are shared with every other spec running alongside it.
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

    // The landing row only shows the name. Check-your-answers renders the full
    // resolved block (party-row.js), so that is where AC4's "latest details"
    // for town/postcode are visible. Direct open — the hub's Check and submit
    // link stays gated until every section is answered.
    const journeyId = pages.addresses.journeyIdFromUrl();
    await pages.notificationView.open(journeyId);
    const rolesAndAddresses = pages.notificationView.summaryCard('Roles and addresses');
    const consignorValue = rolesAndAddresses
      .locator('.govuk-summary-list__row', { has: pages.page.getByText('Consignor', { exact: true }) })
      .locator('.govuk-summary-list__value');
    await expect(consignorValue).toContainText(renamed);
    await expect(consignorValue).toContainText('Penrith');
    await expect(consignorValue).toContainText('CA11 7AA');
    await expect(consignorValue).not.toContainText('Carlisle');
    await expect(consignorValue).not.toContainText('CA1 1AA');
  });

  test('deleting a linked address treats it as never entered and hides it from the picker', async ({ journey, pages, addressBookApi }) => {
    // Own record so parallel specs do not race on a shared fixture when this one
    // soft-deletes behind the journey's back.
    const stamp = Date.now();
    const name = `Doomed Farm ${stamp}`;
    const address = await addressBookApi.createAddress({
      name,
      addressLine1: '7 Gone Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 2BB',
      countryCode: 'United Kingdom',
      phone: '01228 555 0103',
      email: 'doomed@example.co.uk',
    });

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();
    await pages.consignorSelection.search.fill(name);
    await pages.consignorSelection.searchButton.click();
    await pages.consignorSelection.party(name).check();
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(name);

    // Soft-delete behind the journey's back. List/search omit tombstones; get
    // by id still returns deleted:true so the deletion is detectable.
    await addressBookApi.deleteAddress(address.id);
    const tombstone = await addressBookApi.getAddress(address.id);
    expect(tombstone.deleted).toBe(true);

    // UCD: a deleted linked address renders as if never entered — "Not added
    // yet" and an Add action (resolve-parties.js returns undefined).
    await pages.page.reload();
    await expect(consignorRow).toContainText('Not added yet');
    await expect(consignorRow).not.toContainText(name);
    await expect(pages.addresses.addParty('Consignor or exporter')).toBeVisible();

    // AC2: the picker no longer offers the deleted record.
    await pages.addresses.addParty('Consignor or exporter').click();
    await pages.consignorSelection.search.fill(name);
    await pages.consignorSelection.searchButton.click();
    await expect(pages.consignorSelection.party(name)).toHaveCount(0);
  });
});
