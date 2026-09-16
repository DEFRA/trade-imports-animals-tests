import { test, expect } from '@fixtures';
import { skipIfComposeEnvironment, skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * The notification journey reads the address book and never writes to it directly.
 * Adding records is delegated to the INS frontend; these specs prove the journey
 * does not serve its own create page and links out with the handshake query.
 */
test.describe('Addresses are read-only in the journey', { tag: ['@integration'] }, () => {
  test.describe('party picker add link', () => {
    test.beforeEach(async ({ journey, pages }) => {
      await journey.startNotification();
      await journey.unlockSections();

      await pages.overview.task('Roles and addresses').click();
      await pages.addresses.addParty('Consignor or exporter').click();
    });

    test('offers no INS add link in stub mode', async ({ pages }) => {
      skipIfComposeEnvironment('the INS add link is shown when animals-frontend runs against the full stack');
      await expect(pages.consignorSelection.saveAndContinue).toBeVisible();
      await expect(pages.consignorSelection.addNewAddress).toHaveCount(0);
    });

    test('links to INS to add an address when the full stack is running', async ({ pages }) => {
      skipUnlessComposeEnvironment('the handshake link is only rendered outside stub mode, which the compose stack uses');
      await expect(pages.consignorSelection.saveAndContinue).toBeVisible();
      await expect(pages.page.getByRole('button', { name: /add.*address/i })).toHaveCount(0);
      await expect(pages.consignorSelection.addNewAddress).toBeVisible();
      await expect(pages.consignorSelection.addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
    });
  });

  test('the create-address page is no longer served', async ({ journey, journeyContext, pages }) => {
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    const response = await pages.page.goto(`/notifications/${journeyId}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
