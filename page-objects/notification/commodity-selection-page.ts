import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export const COMMODITY_SEARCH_LABEL = 'Search for a common name, commodity code or scientific name';

export class CommoditySelectionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  get searchInput(): Locator {
    return this.page.getByLabel(COMMODITY_SEARCH_LABEL);
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  species(name: string): Locator {
    return this.page.getByRole('checkbox', { name });
  }

  async searchAndSelect(query: string, names: string[]): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    for (const name of names) {
      await this.species(name).check();
    }
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
