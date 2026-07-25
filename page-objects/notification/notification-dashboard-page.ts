import { type Locator } from '@playwright/test';
import type { SortByValue } from '@domain/constants/sort-by-values';
import { BasePage } from '@page-objects/base/base-page';

export type ResultsRange = {
  start: number;
  end: number;
  total: number;
};

export class NotificationDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Start a new notification' });
  }

  get dropdownSort(): Locator {
    return this.page.getByLabel('Sort by');
  }

  get btnUpdateSort(): Locator {
    return this.page.getByRole('button', { name: 'Update sort' });
  }

  get notificationCards(): Locator {
    return this.page.locator('.govuk-summary-card');
  }

  notificationCard(reference: string): Locator {
    return this.notificationCards.filter({ hasText: reference });
  }

  get totalResults(): Locator {
    return this.page.getByText(/^Showing (?:1 Result|\d+(?: to \d+)? of \d+ Results)$/);
  }

  async getResultsRange(): Promise<ResultsRange | null> {
    const text = (await this.totalResults.textContent())?.trim() ?? '';
    const match = text.match(/^Showing (\d+)(?: to (\d+))? of (\d+) Results$/);
    if (!match) return null;
    return {
      start: Number(match[1]),
      end: Number(match[2] ?? match[1]),
      total: Number(match[3]),
    };
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next', exact: true });
  }

  get linkPreviousPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous', exact: true });
  }

  async sortBy(sortByValue: SortByValue): Promise<void> {
    await this.dropdownSort.selectOption(sortByValue);
    await this.btnUpdateSort.click();
  }

  copyAsNew(reference: string): Locator {
    return this.notificationCard(reference).getByRole('button', {
      name: `Copy as new notification ${reference}`,
    });
  }

  amend(reference: string): Locator {
    return this.notificationCard(reference).getByRole('button', {
      name: `Amend notification ${reference}`,
    });
  }

  view(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `View notification ${reference}`,
    });
  }

  resume(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `Resume notification ${reference}`,
    });
  }

  delete(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `Delete notification ${reference}`,
    });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend('/');
    await this.signInWhenRequested(attemptSignIn);
  }
}
