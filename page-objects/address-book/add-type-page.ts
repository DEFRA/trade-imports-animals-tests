import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AddOperatorTypePage extends BasePage {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add a new operator' });
  }

  get radios(): Locator {
    return this.page.locator('.govuk-radios');
  }

  get radioItems(): Locator {
    return this.radios.locator('.govuk-radios__item');
  }

  /** Radio items and the visual divider, in document order (never filter the divider out). */
  get radioAndDividerNodes(): Locator {
    return this.radios.locator('.govuk-radios__item, .govuk-radios__divider');
  }

  get divider(): Locator {
    return this.radios.locator('.govuk-radios__divider');
  }

  radioByLabel(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  radioByValue(value: string): Locator {
    return this.page.locator(`input[name="operatorType"][value="${value}"]`);
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel' });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  errorSummaryLink(text: string): Locator {
    return this.errorSummary.getByRole('link', { name: text });
  }
}
