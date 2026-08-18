import { test, expect } from '@fixtures';

/**
 * The notification journey reads the address book and never writes to it.
 * Adding, changing and removing records belongs to the INS frontend, so these
 * specs prove the animals frontend offers no way in — by control and by URL.
 */
test.describe('Addresses are read-only in the journey', { tag: ['@integration'] }, () => {
  test('the party picker offers no way to add an address', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    await pages.addresses.addParty('Consignor or exporter').click();

    await expect(pages.consignorSelection.saveAndContinue).toBeVisible();
    await expect(pages.page.getByRole('button', { name: /add.*address/i })).toHaveCount(0);
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveCount(0);
  });

  test('the create-address page is no longer served', async ({ journey, journeyContext, pages }) => {
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    const response = await pages.page.goto(`/notifications/${journeyId}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
