import { test, expect } from '@fixtures';

test.describe('Security scan (ins)', { tag: '@active' }, () => {
  test('routes address book navigation through the ZAP proxy', async ({ pages }) => {
    await pages.insAddressBookList.open();

    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.heading).toBeVisible();
  });
});
