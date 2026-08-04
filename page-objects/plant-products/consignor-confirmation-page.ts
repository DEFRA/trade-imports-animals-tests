import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class ConsignorConfirmationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'consignor-confirmation', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'The consignor or exporter has been created' });
  }

  get addToNotification(): Locator {
    return this.page.getByRole('button', { name: 'Add to notification' });
  }
}
