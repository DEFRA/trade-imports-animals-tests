import { Page, Locator } from '@playwright/test';

export class CommoditySelectionPage {
  readonly expectedUrl = '/commodities';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Select a Commodity', exact: true });
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
