import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class ViewOperatorPage extends BasePage {
  /** URL is /address-book/{operatorId}; the id is a runtime value. */
  readonly expectedUrl = /\/address-book\/[^/]+$/;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  rowValue(key: string): Locator {
    return this.page
      .locator('dt.govuk-summary-list__key')
      .filter({ hasText: new RegExp(`^\\s*${key}\\s*$`) })
      .locator('xpath=following-sibling::dd[1]');
  }

  get btnEdit(): Locator {
    return this.page.getByRole('button', { name: 'Edit' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }
}
