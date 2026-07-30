import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class AnimalIdentificationPage extends BasePage {
  readonly expectedUrl = '/commodities/identification';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Enter animal identification details' });
  }

  get tableCommodities(): Locator {
    // No accessible name for the table, so use filter to get by the first column header.
    return this.page.getByRole('table').filter({ has: this.page.locator('thead th', { hasText: /^Commodity code$/ }) });
  }

  get rowsCommodities(): Locator {
    return this.tableCommodities.locator('tbody').getByRole('row');
  }

  cellsCommodities(rowIndex: number): Locator {
    return this.rowsCommodities.nth(rowIndex).getByRole('cell');
  }

  get tablesIdentifiers(): Locator {
    // No accessible name for the table(s), so use filter to get by the first column header.
    return this.page.getByRole('table').filter({ has: this.page.locator('thead th', { hasText: /^Animal$/ }) });
  }

  get rowsIdentifiers(): Locator {
    return this.tablesIdentifiers.locator('tbody').getByRole('row');
  }

  cellIdentifiers(rowIndex: number, cellName: string): Locator {
    return this.rowsIdentifiers.nth(rowIndex).getByRole('cell', { name: cellName });
  }

  inputEarTag(rowIndex: number): Locator {
    // No accesible name for the input, so use locator directly.
    return this.rowsIdentifiers.nth(rowIndex).locator('input[name*="earTag"]');
  }

  inputPassport(rowIndex: number): Locator {
    // No accesible name for the input, so use locator directly.
    return this.rowsIdentifiers.nth(rowIndex).locator('input[name*="passport"]');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
