import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ExitDatePage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'exit-date');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Exit date' });
  }

  get exitDate(): Locator {
    return this.page.getByLabel('Exit date');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
