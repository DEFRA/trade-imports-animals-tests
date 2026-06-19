import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AddressesPage extends BasePage {
  readonly expectedUrl = '/addresses';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Addresses' });
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

  get linkAddCphNumber(): Locator {
    return this.page.getByRole('link', { name: 'Add a CPH number' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
