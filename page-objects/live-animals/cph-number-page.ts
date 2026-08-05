import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class CphNumberPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'cph-number');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'County Parish Holding (CPH)' });
  }

  get cphNumber(): Locator {
    return this.page.getByLabel('County Parish Holding (CPH)');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
