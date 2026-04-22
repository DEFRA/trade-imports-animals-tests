import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AddressesPage extends BasePage {
  readonly expectedUrl = '/addresses';

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

  get linkAddPlaceOfDestination(): Locator {
    return this.page.getByRole('link', { name: 'Add a place of destination' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
