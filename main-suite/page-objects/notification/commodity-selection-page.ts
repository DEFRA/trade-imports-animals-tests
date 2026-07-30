import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class CommoditySelectionPage extends BasePage {
  readonly expectedUrl = '/commodities';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Select a commodity', exact: true });
  }

  get dropdownCommodity(): Locator {
    return this.page.getByRole('combobox', { name: 'Select a commodity' });
  }

  get dropdownCommodityOptions(): Locator {
    return this.dropdownCommodity.locator('option');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
