import type { AddressBookRecord } from '@adapters/http/address-book-api-client';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';
import type { PlantsJourney } from '@flows/plants-journey';

const CONTACT = 'Contact address for consignment';
const addressNamed = (name: string) => ({
  name,
  addressLine1: '4 Nursery Lane',
  townOrCity: 'Perth',
  postcode: 'PH1 5EX',
  countryCode: 'GB',
  phone: '01738 555 0143',
  email: 'contact@example.co.uk',
});

async function openContact(pages: PageObjects, journey: PlantsJourney): Promise<string> {
  const reference = await journey.startNotification();
  await journey.chooseCommodityType('Potatoes (seed or ware)');
  await journey.addCommodityLine('Seed potatoes', { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' });
  await journey.toOrigin();
  await journey.toArrivalDetails('France');
  await pages.plantsOverview.open(reference);
  await pages.plantsOverview.taskRow(CONTACT).getByRole('link', { name: CONTACT, exact: true }).click();
  return reference;
}

test.describe('High-risk plants contact', { tag: '@integration' }, () => {
  test('lists address records beyond one picker page with name and address hints and persists a selection', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = randomUUID();
    const records: AddressBookRecord[] = [];
    for (let index = 0; index < 6; index++) {
      records.push(await addressBookApi.createAddress(addressNamed(`Contact ${token} ${index}`)));
    }
    const reference = await openContact(pages, plantsJourney);
    const contact = pages.plantsConsignmentContactSelect;
    await expect(pages.page).toHaveURL(contact.expectedUrl(reference));
    await expect(contact.heading).toBeVisible();
    for (const record of records) {
      await expect(contact.address(record.name)).toBeVisible();
      await expect(contact.address(record.name)).toHaveAccessibleDescription('4 Nursery Lane, Perth, PH1 5EX, United Kingdom');
    }
    await contact.address(records[0].name).check();
    await contact.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.taskRow(CONTACT)).toContainText('Completed');
    // Contact ends its own section; review is entered from Overview once every task is complete.
    const review = pages.page.getByRole('listitem').filter({ hasText: 'Check and submit' });
    await expect(review).toContainText('Cannot start yet');
    await expect(review.getByRole('link')).toHaveCount(0);
    await contact.open(reference);
    await pages.page.reload();
    await expect(contact.address(records[0].name)).toBeChecked();
  });

  for (const action of ['continue', 'return'] as const) {
    test(`blank contact permits save and ${action} and leaves the row incomplete`, async ({ pages, plantsJourney }) => {
      const reference = await openContact(pages, plantsJourney);
      const contact = pages.plantsConsignmentContactSelect;
      const button = action === 'continue' ? contact.btnSaveAndContinue : contact.btnSaveAndReturn;
      await button.click();
      await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
      // The inherited status model has no visited-page state: a blank save remains Not yet started.
      await expect(pages.plantsOverview.taskRow(CONTACT)).toContainText('Not yet started');
      await contact.open(reference);
      await expect(contact.addresses.and(pages.page.locator(':checked'))).toHaveCount(0);
    });
  }
});
