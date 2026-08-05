import { type Locator } from '@playwright/test';
import type { SortByValue } from '@domain/shared/constants/sort-by-values';
import { BasePage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantNotificationDashboardPage extends BasePage {
  readonly expectedUrl = SET_BASES.plantProducts;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Your import notifications' });
  }

  get createNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create a new notification' });
  }

  get resultsTable(): Locator {
    return this.page.getByRole('table');
  }

  get filterHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Filter notifications' });
  }

  get keywordsOrReference(): Locator {
    return this.page.getByLabel('Keywords or reference');
  }

  get status(): Locator {
    return this.page.getByLabel('Status');
  }

  get countryOfOrigin(): Locator {
    return this.page.getByLabel('Country of origin');
  }

  get startDate(): Locator {
    return this.page.getByRole('group', { name: 'Start date range' });
  }

  get endDate(): Locator {
    return this.page.getByRole('group', { name: 'End date range' });
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get clearFilters(): Locator {
    return this.page.getByRole('link', { name: 'Clear', exact: true });
  }

  get resultsLabel(): Locator {
    return this.page.getByText(/^(?:0 results|1 result|Showing \d+ to \d+ of \d+ results)$/);
  }

  get sort(): Locator {
    return this.page.getByLabel('Sort by');
  }

  get applySort(): Locator {
    return this.page.getByRole('button', { name: 'Apply', exact: true });
  }

  get resultRows(): Locator {
    return this.resultsTable.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  get referenceRowHeaders(): Locator {
    return this.resultsTable.getByRole('rowheader');
  }

  row(reference: string): Locator {
    return this.resultRows.filter({ has: this.page.getByRole('rowheader', { name: reference, exact: true }) });
  }

  continue(reference: string): Locator {
    return this.row(reference).getByRole('link', { name: `Continue notification ${reference}`, exact: true });
  }

  view(reference: string): Locator {
    return this.row(reference).getByRole('link', { name: `View notification ${reference}`, exact: true });
  }

  amend(reference: string): Locator {
    return this.row(reference).getByRole('button', { name: `Amend notification ${reference}`, exact: true });
  }

  resume(reference: string): Locator {
    return this.row(reference).getByRole('link', { name: `Resume notification ${reference}`, exact: true });
  }

  copy(reference: string): Locator {
    return this.row(reference).getByRole('button', { name: `Copy as new notification ${reference}`, exact: true });
  }

  cancelAmend(reference: string): Locator {
    return this.row(reference).getByRole('link', { name: `Cancel amendment notification ${reference}`, exact: true });
  }

  delete(reference: string): Locator {
    return this.row(reference).getByRole('link', { name: `Delete notification ${reference}`, exact: true });
  }

  actionForm(action: Locator): Locator {
    return action.locator('..');
  }

  idempotencyKey(reference: string): Locator {
    return this.actionForm(this.copy(reference)).locator('input[name="idempotencyKey"]');
  }

  copyOrigin(reference: string): Locator {
    return this.actionForm(this.copy(reference)).locator('input[name="copyOrigin"]');
  }

  get noNotificationsFound(): Locator {
    return this.page.getByText('No notifications found', { exact: true });
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination' });
  }

  get nextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next', exact: true });
  }

  get previousPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous', exact: true });
  }

  async searchForReference(referenceNumber: string): Promise<void> {
    await this.keywordsOrReference.fill(referenceNumber);
    await this.searchButton.click();
  }

  async sortBy(sortByValue: SortByValue): Promise<void> {
    await this.sort.selectOption({ label: sortByValue });
    await this.applySort.click();
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(SET_BASES.plantProducts);
    await this.signInWhenRequested(attemptSignIn);
    await this.heading.waitFor();
    await this.resultsLabel.waitFor();
  }
}
