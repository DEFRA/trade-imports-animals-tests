import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/base/base-page';

test.describe('Address book navigation between services', { tag: ['@compose', '@integration'] }, () => {
  test('follows the Address book item from the animals journey to the INS address book and back', async ({ pages }) => {
    test.slow();

    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const animalsOrigin = new URL(animalsBaseUrl).origin;
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

    // Given — a signed-in trader on the animals notification dashboard
    await pages.notificationDashboard.open();

    // When — they follow the Address book item in the service navigation
    await Promise.all([pages.page.waitForURL((url) => url.origin !== animalsOrigin), pages.notificationDashboard.linkAddressBook.click()]);
    // Each service signs a trader in separately, so the link lands on INS's sign-in first.
    await pages.insAddressBookList.completeSignInIfRequested();

    // Then — they are on the INS address book, in the INS service
    await expect(pages.page).toHaveURL((url) => url.origin === insOrigin && url.pathname === '/address-book');
    await expect(pages.insAddressBookList.heading).toBeVisible();

    // And — the way back to the journey frontend works, via the INS dashboard
    await pages.insAddressBookList.linkDashboard.click();
    await expect(pages.insDashboard.heading).toBeVisible();
    await pages.page.locator(`a[href^="${animalsBaseUrl}"]`).first().click();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin);
  });
});
