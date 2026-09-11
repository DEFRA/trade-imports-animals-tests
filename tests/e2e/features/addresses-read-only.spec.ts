import { test, expect } from '@fixtures';

/**
 * The notification journey reads the address book and never writes to it directly.
 * Adding records is delegated to the INS frontend; these specs prove the journey
 * does not serve its own create page and links out with the handshake query.
 */
test.describe('Addresses are read-only in the journey', { tag: ['@integration'] }, () => {
  test('the party picker links to INS to add an address', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    await pages.addresses.addParty('Consignor or exporter').click();

    await expect(pages.consignorSelection.saveAndContinue).toBeVisible();
    await expect(pages.page.getByRole('button', { name: /add.*address/i })).toHaveCount(0);
    await expect(pages.consignorSelection.addNewAddress).toBeVisible();
    await expect(pages.consignorSelection.addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
  });

  test('the create-address page is no longer served', async ({ journey, journeyContext, pages }) => {
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    const response = await pages.page.goto(`/notifications/${journeyId}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
