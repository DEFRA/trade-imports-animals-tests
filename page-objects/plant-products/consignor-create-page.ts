import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class ConsignorCreatePage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'consignor-create', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add consignor or exporter' });
  }

  field(name: string): Locator {
    return this.page.locator(`#${name}`);
  }

  get consignorName(): Locator {
    return this.field('consignorName');
  }

  get consignorAddressLine1(): Locator {
    return this.field('consignorAddressLine1');
  }

  get consignorAddressLine2(): Locator {
    return this.field('consignorAddressLine2');
  }

  get consignorAddressLine3(): Locator {
    return this.field('consignorAddressLine3');
  }

  get consignorCity(): Locator {
    return this.field('consignorCity');
  }

  get consignorPostcode(): Locator {
    return this.field('consignorPostcode');
  }

  get consignorTelephone(): Locator {
    return this.field('consignorTelephone');
  }

  get consignorCountry(): Locator {
    return this.field('consignorCountry');
  }

  get consignorEmail(): Locator {
    return this.field('consignorEmail');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
