import { test, expect } from '@fixtures';

test.describe('Add a new address', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('adding a new address from the consignor spoke copies it into the consignor and the spoke then offers it', async ({
    liveAnimalsJourney: journey,
    liveAnimalsPages: pages,
  }) => {
    // The book is a persistent server store, so a fresh unique name each run keeps
    // the created record unambiguous when it is searched back out.
    const createdName = `Created Farm ${Date.now()}`;

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    await expect(pages.addresses.heading).toBeVisible();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();

    // The spoke offers a way out of the canned book: the create-address form.
    await pages.page.getByRole('button', { name: 'Add a new address' }).click();
    await expect(pages.page.getByRole('heading', { name: 'Add a new address' })).toBeVisible();

    // A blank save is rejected with the mandatory Standard Address Block set.
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();

    await pages.page.getByLabel('Name or organisation name').fill(createdName);
    await pages.page.getByLabel('Address line 1').fill('99 New Lane');
    await pages.page.getByLabel('Town or city').fill('Carlisle');
    await pages.page.getByLabel('Postal or zip code').fill('CA1 1AA');
    await pages.page.getByLabel('Country').selectOption('United Kingdom');
    await pages.page.getByLabel('Telephone number').fill('01228 555 0101');
    await pages.page.getByLabel('Email address').fill('farm@example.co.uk');
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();

    // Saved by copy into the launching party, back on the landing page.
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(createdName);

    // The created address joined the book but is minted at the end, so it is not
    // on the picker's first page — yet it IS the committed consignor, so the
    // picker carries it as the selection and searching surfaces its row checked.
    await consignorRow.getByRole('link', { name: 'Change' }).click();
    await expect(pages.page.getByText(`Selected address: ${createdName}`)).toBeVisible();
    await pages.consignorSelection.search.fill(createdName);
    await pages.consignorSelection.searchButton.click();
    await expect(pages.consignorSelection.party(createdName)).toBeChecked();
  });
});
