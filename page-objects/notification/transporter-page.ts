import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

/** The transporter list — every transporter the trader can use, commercial and
 * private together. Adding one that is not listed is a route off this page. */
export class TransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transporter details' });
  }

  transporter(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  /** The govuk button macro renders the href as role=button. */
  get addTransporter(): Locator {
    return this.page.getByRole('button', { name: 'Add a transporter' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
