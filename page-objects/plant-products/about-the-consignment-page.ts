import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class AboutTheConsignmentPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'about-the-consignment', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What is the main reason for importing the consignment?' });
  }

  reason(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
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

  get reasonError(): Locator {
    return this.page.locator('#reasonForImport-error');
  }
}
