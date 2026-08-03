import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export type CommodityInputMethod = 'MANUAL' | 'CSV';

export class CommodityInputMethodPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-input-method', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'How do you want to add your commodity details?' });
  }

  method(name: 'Manual entry' | 'Upload from a CSV file'): Locator {
    return this.page.getByRole('radio', { name });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }
}
