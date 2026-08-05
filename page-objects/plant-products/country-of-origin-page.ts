import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class CountryOfOriginPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'country-of-origin', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the plants, plant product or other objects' });
  }

  get countryOfOrigin(): Locator {
    return this.page.getByLabel('Country of origin', { exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }

  get countryOfOriginError(): Locator {
    return this.page.locator('#countryOfOrigin-error');
  }

  async selectCountry(label: string): Promise<void> {
    await this.countryOfOrigin.selectOption({ label });
  }
}
