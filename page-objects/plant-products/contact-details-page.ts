import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class ContactDetailsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'contact-details', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact details' });
  }

  get responsiblePersonName(): Locator {
    return this.page.getByLabel('Name', { exact: true });
  }

  get responsiblePersonEmail(): Locator {
    return this.page.getByLabel('Email address', { exact: true });
  }

  get responsiblePersonTelephone(): Locator {
    return this.page.getByLabel('Mobile number', { exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
