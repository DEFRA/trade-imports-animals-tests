import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class DestinationCountryPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'destination-country');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Destination country' });
  }

  get country(): Locator {
    return this.page.getByLabel('Destination country');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
