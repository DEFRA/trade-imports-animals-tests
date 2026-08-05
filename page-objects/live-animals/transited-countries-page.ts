import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class TransitedCountriesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transit-countries');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Which countries will the consignment travel through?',
    });
  }

  country(name: string): Locator {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  async selectCountry(name: string): Promise<void> {
    await this.country(name).check();
  }

  get countries(): Locator {
    return this.page.locator('input[name="transitedCountries"]');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
