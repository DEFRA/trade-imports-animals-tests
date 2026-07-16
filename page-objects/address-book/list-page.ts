import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export type AddressBookListParams = {
  q?: string;
  operatorType?: string;
  page?: number;
};

export class AddressBookListPage extends BasePage {
  readonly expectedUrl = '/address-book';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Address book' });
  }

  get navDashboard(): Locator {
    return this.page.getByRole('link', { name: 'Dashboard', exact: true });
  }

  get navAddressBook(): Locator {
    return this.page.getByRole('link', { name: 'Address book', exact: true });
  }

  get intro(): Locator {
    return this.page.getByText('Manage your operators for use across import notifications.');
  }

  get btnAddNewOperator(): Locator {
    return this.page.getByRole('button', { name: 'Add a new operator' });
  }

  get inputSearch(): Locator {
    return this.page.getByLabel('Search by name, address or country');
  }

  get dropdownType(): Locator {
    return this.page.getByLabel('Filter by operator type');
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search' });
  }

  get banner(): Locator {
    return this.page.locator('.govuk-notification-banner__content');
  }

  get resultsLabel(): Locator {
    return this.page.getByText(/^Showing/);
  }

  get emptyMessage(): Locator {
    return this.page.getByText('No operators found.');
  }

  get table(): Locator {
    return this.page.locator('table.govuk-table');
  }

  get rows(): Locator {
    return this.table.locator('tbody').getByRole('row');
  }

  row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  viewLink(name: string): Locator {
    return this.row(name).getByRole('link', { name: `View ${name}` });
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next' });
  }

  get linkPreviousPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous' });
  }

  /** Parses the results label ("Showing 1-25 of 30") into its three numbers. */
  async parseResultsLabel(): Promise<{ start: number; end: number; total: number }> {
    const text = (await this.resultsLabel.textContent())?.trim() ?? '';
    const match = text.match(/^Showing (\d+)-(\d+) of (\d+)$/);
    if (!match) {
      throw new Error(`Could not parse address book results label: "${text}"`);
    }
    return { start: Number(match[1]), end: Number(match[2]), total: Number(match[3]) };
  }

  private buildPath({ q, operatorType, page }: AddressBookListParams = {}): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (operatorType) params.set('operator_type', operatorType);
    if (page && page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `${this.expectedUrl}?${query}` : this.expectedUrl;
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }

  /** Server-side search / type filter / pagination all drive off URL params (c-012). */
  async openWithParams(params: AddressBookListParams, attemptSignIn: boolean = false): Promise<void> {
    await this.navigateToFrontend(this.buildPath(params));
    await this.signInWhenRequested(attemptSignIn);
  }
}
