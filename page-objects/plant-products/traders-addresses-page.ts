import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class TradersAddressesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'traders-addresses', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Importer, Packer, Delivery address and Consignor' });
  }

  field(name: string): Locator {
    return this.page.locator(`#${name}`);
  }

  destinationSameAsConsignee(value: boolean): Locator {
    return this.page
      .getByRole('group', { name: "Is the delivery address the same as the importer's address?" })
      .getByRole('radio', { name: value ? 'Yes' : 'No', exact: true });
  }

  get addConsignor(): Locator {
    return this.page.locator('main').getByRole('link', { name: 'Add a consignor or exporter' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get saveAndReturnToHub(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to hub' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
