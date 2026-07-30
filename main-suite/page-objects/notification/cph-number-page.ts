import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

// County Parish Holding number (CPH) page
export class CphNumberPage extends BasePage {
  readonly expectedUrl = '/cph-number';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
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

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }

  get errorCphNumber(): Locator {
    return this.page.locator('#cphNumber-error');
  }
}
