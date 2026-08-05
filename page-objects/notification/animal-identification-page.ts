import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class AnimalIdentificationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities/identification');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Animal identification details' });
  }

  get earTag(): Locator {
    return this.page.getByLabel('Ear tag number');
  }

  get passportNumber(): Locator {
    return this.page.getByLabel('Passport number');
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get saveAndFinish(): Locator {
    return this.page.getByRole('button', { name: 'Save and finish' });
  }
}
