import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ImportReasonPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-reason');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What is the main reason for importing the animals?' });
  }

  reason(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
