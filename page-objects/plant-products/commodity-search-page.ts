import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class CommoditySearchPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-search', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity' });
  }

  get codeSearch(): Locator {
    return this.page.getByLabel('Enter commodity code');
  }

  get codeSearchButton(): Locator {
    return this.page.getByRole('tabpanel', { name: 'Commodity code search' }).getByRole('button', { name: 'Search' });
  }

  result(code: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(new RegExp(`^${code}(?:\\s|$)`)) });
  }

  get noResults(): Locator {
    return this.page.getByText('No results', { exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  async search(code: string): Promise<void> {
    await this.codeSearch.fill(code);
    await this.codeSearchButton.click();
  }
}
