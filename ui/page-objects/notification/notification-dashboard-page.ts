import { Locator } from '@playwright/test';
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
    return this.page.getByRole('button', { name: 'Create an import notification' });
  }

  get dropdownSort(): Locator {
    return this.page.getByLabel('Sort by');
  }

  get btnUpdateSort(): Locator {
    return this.page.getByRole('button', { name: 'Update sort' });
  }

  get totalResults(): Locator {
    return this.page.getByText(/(No Results|Showing .* Results)/);
  }

  /** Parses the dashboard results label (e.g. "Showing 1 to 25 of 1199 Results"). */
  async getResultsRange(): Promise<ResultsRange | null> {
    const text = (await this.totalResults.textContent())?.trim() ?? '';
    const rangeMatch = text.match(/^Showing (\d+) to (\d+) of (\d+) Results$/);
    if (rangeMatch) {
      return {
        start: Number(rangeMatch[1]),
        end: Number(rangeMatch[2]),
        total: Number(rangeMatch[3]),
      };
    }

    const singleMatch = text.match(/^Showing (\d+) of (\d+) Results$/);
    if (singleMatch) {
      const value = Number(singleMatch[1]);
      return { start: value, end: value, total: Number(singleMatch[2]) };
    }

    return null;
  }

  /** Builds the results label text using the same rules as the frontend helper. */
  formatResultsRangeLabel({ start, end, total }: ResultsRange): string {
    if (total === 1) {
      return 'Showing 1 Results';
    }

    if (start === end) {
      return `Showing ${start} of ${total} Results`;
    }

    return `Showing ${start} to ${end} of ${total} Results`;
  }

  get pagination(): Locator {
    return this.page.locator('nav.notifications-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page' });
  }

  get linkPreviousPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous page' });
  }

  get nextPageNumberLabel(): Locator {
    return this.linkNextPage.locator('.notifications-pagination__page');
  }

  /** Parses total pages from the next-link label on page one (e.g. "2 of 5" → 5). */
  async getPaginationTotalPages(): Promise<number> {
    const text = (await this.nextPageNumberLabel.textContent())?.trim() ?? '';
    const match = text.match(/^\d+ of (\d+)$/);
    if (!match) {
      throw new Error(`Could not parse pagination total from next link label: "${text}"`);
    }

    return Number(match[1]);
  }

  async openDashboardPage(pageNumber: number): Promise<void> {
    const path = pageNumber <= 1 ? '/' : `/?page=${pageNumber}`;
    await this.navigateToFrontend(path);
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Opens the final page directly using the total shown on the next link (page one only). */
  async goToLastPage(): Promise<number> {
    const totalPages = await this.getPaginationTotalPages();
    await this.openDashboardPage(totalPages);
    return totalPages;
  }

  currentPageFromUrl(): number {
    const pageParam = new URL(this.page.url()).searchParams.get('page');
    const page = Number.parseInt(pageParam ?? '1', 10);
    return Number.isNaN(page) ? 1 : page;
  }

  get notificationCards(): Locator {
    return this.page.locator('.govuk-summary-card');
  }

  async sortBy(sortByValue: SortByValue): Promise<void> {
    await this.dropdownSort.selectOption(sortByValue);
    await this.btnUpdateSort.click();
  }

  private cardField(card: Locator, term: string): Locator {
    return card.locator('dt').filter({ hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  btnCopyAsNew(referenceNumber: string): Locator {
    return this.page.getByRole('button', { name: `Copy as new ${referenceNumber}` });
  }

  viewLink(referenceNumber: string): Locator {
    return this.page.getByRole('link', { name: `View ${referenceNumber}` });
  }

  notificationCard(index: number) {
    const card = this.notificationCards.nth(index);
    return {
      details: {
        heading: card.getByRole('heading', { level: 2 }),
        commodity: this.cardField(card, 'Commodity'),
        origin: this.cardField(card, 'Origin'),
        arrivalAtDestination: this.cardField(card, 'Arrival at destination'),
        consignee: this.cardField(card, 'Consignee'),
        consignor: this.cardField(card, 'Consignor'),
        status: this.cardField(card, 'Status'),
        dateCreated: card.getByText(/Date created:/),
      },
      actions: {
        copyAsNew: card.getByRole('button', { name: /Copy as new/ }),
        view: card.getByRole('link', { name: /View/ }),
      },
    };
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend('/');
    await this.signInWhenRequested(attemptSignIn);

    if (attemptSignIn) {
      // The auth stub can fail under concurrent load. If we don't land on the
      // dashboard within a short grace period, retry the whole auth flow once.
      try {
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        console.warn('Auth retry triggered — initial sign-in did not land on dashboard within 5s');
        await this.page.goto('/');
        await this.signInWhenRequested(true);
      }
    }
  }
}
