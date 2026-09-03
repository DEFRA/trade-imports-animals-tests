import { test, expect } from '@fixtures';

const address = {
  addressLine1: '9 Proxy Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 9ZZ',
  country: 'United Kingdom',
  phone: '01228 555 0199',
  email: 'security-scan@example.co.uk',
};

test.describe('Security scan (ins)', { tag: '@active' }, () => {
  test('routes the address book through the ZAP proxy', async ({ pages, addressBookApi }) => {
    test.slow();
    await pages.insAddressBookList.open();

    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.heading).toBeVisible();

    // The whole record lifecycle, not just the list: add, edit and delete are
    // the write surface, and each is an /address-book/{addressId} route — the
    // addressId dataDrivenNode has nothing to fold without them.
    const name = `Security Scan Farm ${Date.now()}`;
    await pages.insAddressBookAdd.open();
    await pages.insAddressBookAdd.fill({ name, ...address });
    await pages.insAddressBookAdd.save();
    await expect(pages.insAddressBookList.row(name)).toBeVisible();

    const { id } = await addressBookApi.findByName(name);

    await pages.insAddressBookView.open(id);
    await expect(pages.insAddressBookView.heading(name)).toBeVisible();

    await pages.insAddressBookEdit.open(id);
    await pages.insAddressBookEdit.fill({ name, ...address, townOrCity: 'Penrith' });
    await pages.insAddressBookEdit.save();
    await expect(pages.insAddressBookList.row(name)).toBeVisible();

    await pages.insAddressBookDelete.open(id);
    await pages.insAddressBookDelete.confirm();
    await expect(pages.insAddressBookList.row(name)).toHaveCount(0);

    // The service's two static routes. A GET each, folded in here rather than
    // given a spec of their own — nothing else in the suite reaches them.
    await pages.page.goto('/about');
    await pages.page.goto('/');
  });
});
