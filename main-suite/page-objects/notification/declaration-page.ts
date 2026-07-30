import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class DeclarationPage extends BasePage {
  readonly expectedUrl = '/declaration';

  get referenceNumber(): Locator {
    return this.page.getByTestId('app-reference-number-caption');
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Declaration' });
  }

  get responsibilityConfirmation(): Locator {
    return this.page.getByText('I confirm I am responsible for this notification.');
  }

  get checkboxDeclaration(): Locator {
    return this.page.locator('#declaration');
  }

  get dateOfDeclaration(): Locator {
    return this.page.getByText(/^Date of declaration:/);
  }

  get btnSubmitNotification(): Locator {
    return this.page.getByRole('button', { name: 'Submit notification' });
  }

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }

  get errorDeclaration(): Locator {
    return this.page.locator('#declaration-error');
  }
}
