import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

/** The type question — asked only of a trader who could not find their
 * transporter on the list, as the first step of adding one. */
export class TransporterAddPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'What type of transporter will move the animals?',
    });
  }

  transporterType(name: 'Commercial' | 'Private'): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
