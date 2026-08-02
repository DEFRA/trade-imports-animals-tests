import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantImportTypePage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-type', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  get plants(): Locator {
    return this.page.getByRole('radio', { name: 'Plants, plant products and other objects' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }
}
