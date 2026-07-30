import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class CommodityDetailsPage extends BasePage {
  readonly expectedUrl = '/commodities/details';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity' });
  }

  get tableCommodities(): Locator {
    return this.page.getByRole('table', { name: 'Commodities' });
  }

  get rowsCommodities(): Locator {
    return this.tableCommodities.locator('tbody').getByRole('row');
  }

  cellsCommodities(rowIndex: number): Locator {
    return this.rowsCommodities.nth(rowIndex).getByRole('cell');
  }

  tableQuantities(tableName: string): Locator {
    return this.page.getByRole('table', { name: tableName });
  }

  get rowsQuantities(): Locator {
    return this.tableQuantities('Live bovine animals').locator('tbody').getByRole('row');
  }

  inputNoOfAnimals(speciesAndType: string): Locator {
    //return this.rowsQuantities.filter({ hasText: speciesAndType }).getByRole('textbox', { name: 'Number of animals' });
    return this.rowsQuantities.filter({ hasText: speciesAndType }).getByRole('spinbutton').first();
  }

  inputNoOfPackages(speciesAndType: string): Locator {
    //return this.rowsQuantities.filter({ hasText: speciesAndType }).getByRole('textbox', { name: 'Number of packages' });
    return this.rowsQuantities.filter({ hasText: speciesAndType }).getByRole('spinbutton').nth(1);
  }

  get subTotalNoOfAnimals(): Locator {
    return this.tableQuantities('Live bovine animals').locator('#subtotalNoOfAnimals');
  }

  get subTotalNoOfPackages(): Locator {
    return this.tableQuantities('Live bovine animals').locator('#subtotalNoOfPackages');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
