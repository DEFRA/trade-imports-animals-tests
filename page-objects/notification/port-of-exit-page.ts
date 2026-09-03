import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class PortOfExitPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'port-of-exit');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Port of exit' });
  }

  get port(): Locator {
    return this.page.getByLabel('Port of exit');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
