import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class AddressesPage extends BasePage {
  readonly expectedUrl = '/addresses';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignment addresses' });
  }

  get groupPlaceOfOrigin(): Locator {
    return this.page.getByRole('group', { name: 'Place of origin' });
  }

  get tablePlaceOfOrigin(): Locator {
    return this.groupPlaceOfOrigin.getByRole('table');
  }

  get cellsPlaceOfOrigin(): Locator {
    return this.tablePlaceOfOrigin.locator('tbody').getByRole('row').first().getByRole('cell');
  }

  get linkAddPlaceOfOrigin(): Locator {
    return this.page.getByRole('link', { name: 'Add a place of origin' });
  }

  get groupConsignorOrExporter(): Locator {
    return this.page.getByRole('group', { name: 'Consignor or exporter' });
  }

  get tableConsignorOrExporter(): Locator {
    return this.groupConsignorOrExporter.getByRole('table');
  }

  get rowsConsignorOrExporter(): Locator {
    return this.tableConsignorOrExporter.locator('tbody').getByRole('row');
  }

  get cellsConsignorOrExporter(): Locator {
    return this.rowsConsignorOrExporter.first().getByRole('cell');
  }

  get linkAddConsignorOrExporter(): Locator {
    return this.page.getByRole('link', { name: 'Add a consignor or exporter' });
  }

  get groupPlaceOfDestination(): Locator {
    return this.page.getByRole('group', { name: 'Place of destination' });
  }

  get tablePlaceOfDestination(): Locator {
    return this.groupPlaceOfDestination.getByRole('table');
  }

  get rowsPlaceOfDestination(): Locator {
    return this.tablePlaceOfDestination.locator('tbody').getByRole('row');
  }

  get cellsPlaceOfDestination(): Locator {
    return this.rowsPlaceOfDestination.first().getByRole('cell');
  }

  get linkAddPlaceOfDestination(): Locator {
    return this.page.getByRole('link', { name: 'Add a place of destination' });
  }

  get groupConsignee(): Locator {
    return this.page.getByRole('group', { name: 'Consignee' });
  }

  get tableConsignee(): Locator {
    return this.groupConsignee.getByRole('table');
  }

  get cellsConsignee(): Locator {
    return this.tableConsignee.locator('tbody').getByRole('row').first().getByRole('cell');
  }

  get linkAddConsignee(): Locator {
    return this.page.getByRole('link', { name: 'Add a consignee' });
  }

  get groupImporter(): Locator {
    return this.page.getByRole('group', { name: 'Importer' });
  }

  get tableImporter(): Locator {
    return this.groupImporter.getByRole('table');
  }

  get cellsImporter(): Locator {
    return this.tableImporter.locator('tbody').getByRole('row').first().getByRole('cell');
  }

  get linkAddImporter(): Locator {
    return this.page.getByRole('link', { name: 'Add an importer' });
  }

  get groupCphNumber(): Locator {
    return this.page.getByRole('group', { name: 'County Parish Holding number (CPH)' });
  }

  get cphNumber(): Locator {
    return this.groupCphNumber.locator('p.govuk-body').first();
  }

  get linkAddCphNumber(): Locator {
    return this.page.getByRole('link', { name: 'Add a CPH number' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
