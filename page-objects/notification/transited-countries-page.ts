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

  country(row: number = 0): Locator {
    const id = row === 0 ? 'transitedCountries' : `transitedCountries-${row + 1}`;
    return this.page.locator(`input#${id}`);
  }

  async selectCountry(name: string, row: number = 0): Promise<void> {
    await this.country(row).fill(name);
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  get addAnotherCountry(): Locator {
    return this.page.getByRole('button', { name: 'Add another country' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
