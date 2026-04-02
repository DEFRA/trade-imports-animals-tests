import { Page, Locator } from '@playwright/test';

export class ImportReasonPage {
  readonly expectedUrl = '/import-reason';
  readonly expectedHeading = 'What is the main reason for importing the animals?';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
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
