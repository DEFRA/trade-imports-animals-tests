import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantConfirmationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'confirmation', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification sent' });
  }

  get referenceNumber(): Locator {
    return this.page.getByText(/^GBN-PP-/).first();
  }

  get returnToDashboard(): Locator {
    return this.page.locator('main').getByRole('link', { name: 'Return to your dashboard' });
  }
}
