import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class TransporterSelectionPage extends BasePage {
  readonly expectedUrl = '/transporters/select';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search for an existing transporter' });
  }

  get tableTransporters(): Locator {
    return this.page.getByRole('table');
  }

  get rowsTransporters(): Locator {
    return this.tableTransporters.locator('tbody').getByRole('row');
  }

  linkSelectTransporter(rowIndex: number): Locator {
    return this.rowsTransporters.nth(rowIndex).getByRole('link', { name: 'Select' });
  }

  linkSelectTransporterByName(name: string): Locator {
    return this.rowsTransporters.filter({ hasText: name }).getByRole('link', { name: 'Select' });
  }
}
