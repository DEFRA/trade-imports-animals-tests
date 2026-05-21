import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class ConsignorSelectionPage extends BasePage {
  readonly expectedUrl = '/consignors/select';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search for an existing consignor or exporter' });
  }

  get tableConsignors(): Locator {
    return this.page.getByRole('table');
  }

  get rowsConsignors(): Locator {
    return this.tableConsignors.locator('tbody').getByRole('row');
  }

  linkSelectConsignor(rowIndex: number): Locator {
    return this.rowsConsignors.nth(rowIndex).getByRole('link', { name: 'Select' });
  }

  linkSelectConsignorByName(name: string): Locator {
    return this.rowsConsignors.filter({ hasText: name }).getByRole('link', { name: 'Select' });
  }
}
