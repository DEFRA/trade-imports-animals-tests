import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class ConsignorPickerPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'consignor-select', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Consignor or exporter',
      exact: true,
    });
  }

  consignor(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get addConsignor(): Locator {
    return this.page.getByRole('button', { name: 'Add a consignor or exporter' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
