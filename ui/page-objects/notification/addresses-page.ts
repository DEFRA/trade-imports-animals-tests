import { Page, Locator } from '@playwright/test';

export class AddressesPage {
  readonly expectedUrl = '/addresses';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Addresses' });
  }

  get linkAddConsignorOrExporter(): Locator {
    return this.page.getByRole('link', { name: 'Add a consignor or exporter' });
  }

  get linkAddConsignee(): Locator {
    return this.page.getByRole('link', { name: 'Add a consignee' });
  }

  get linkAddImporter(): Locator {
    return this.page.getByRole('link', { name: 'Add an importer' });
  }

  get linkAddPlaceOfDestination(): Locator {
    return this.page.getByRole('link', { name: 'Add a place of destination' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
