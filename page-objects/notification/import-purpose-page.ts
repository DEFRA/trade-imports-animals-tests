import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ImportPurposePage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-purpose');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Purpose in the internal market' });
  }

  purpose(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
