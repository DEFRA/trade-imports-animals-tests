import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class ImportReasonPage extends BasePage {
  readonly expectedUrl = '/import-reason';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What is the main reason for importing the animals?' });
  }

  get radioInternalMarket(): Locator {
    return this.page.getByRole('radio', { name: 'Internal Market' });
  }

  get radioReEntry(): Locator {
    return this.page.getByRole('radio', { name: 'Re-entry' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
