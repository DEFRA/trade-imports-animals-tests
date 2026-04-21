import { Page, Locator } from '@playwright/test';

// County Parish Holding number (CPH) page
export class CphNumberPage {
  readonly expectedUrl = '/cph-number';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add the County Parish Holding number (CPH)' });
  }

  get inputCphNumber(): Locator {
    return this.page.getByRole('textbox', { name: 'CPH number' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
