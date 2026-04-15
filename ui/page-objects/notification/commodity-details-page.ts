import { Page, Locator } from '@playwright/test';

export class CommodityDetailsPage {
  readonly expectedUrl = '/commodities/details';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
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

  get tableBodyRowsCommodities(): Locator {
    return this.tableCommodities.locator('tbody').getByRole('row');
  }

  tableBodyRowCellsCommodities(index: number): Locator {
    return this.tableBodyRowsCommodities.nth(index).getByRole('cell');
  }

  tableQuantities(name: string): Locator {
    return this.page.getByRole('table', { name: name });
  }

  get tableBodyRowsQuantities(): Locator {
    return this.tableQuantities('Live bovine animals').locator('tbody').getByRole('row');
  }

  tableBodyRowCellsQuantities(index: number): Locator {
    return this.tableBodyRowsQuantities.nth(index).getByRole('cell');
  }

  inputNoOfAnimals(speciesAndType: string): Locator {
    // return this.tableQuantities('Live bovine animals').getByRole('row', { name: speciesAndType }).getByRole('textbox', { name: 'Number of animals' });
    return this.tableQuantities('Live bovine animals').getByRole('row', { name: speciesAndType }).getByRole('spinbutton').first();
  }

  inputNoOfPackages(speciesAndType: string): Locator {
    //return this.tableQuantities('Live bovine animals').getByRole('row', { name: speciesAndType }).getByRole('textbox', { name: 'Number of packages' });
    return this.tableQuantities('Live bovine animals').getByRole('row', { name: speciesAndType }).getByRole('spinbutton').nth(1);
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
