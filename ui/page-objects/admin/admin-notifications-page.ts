import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminNotificationsPage extends BasePage {
  readonly expectedUrl = '/notifications';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notifications' });
  }

  get inputReferenceNumber(): Locator {
    return this.page.getByRole('textbox', { name: 'Reference number' });
  }

  get btnDeleteByReferenceNumber(): Locator {
    return this.page.getByRole('button', { name: 'Delete notification by' });
  }

  get checkBoxSelectAll(): Locator {
    return this.page.getByRole('checkbox', { name: 'Select all notifications', exact: true });
  }

  get tableRows(): Locator {
    return this.page.getByRole('table').getByRole('row');
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get alertSuccess(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  get alertImportant(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Important' }) });
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination' });
  }

  get resultsCount(): Locator {
    return this.page.getByTestId('results-count');
  }

  // Returns the reference numbers currently rendered in the table (i.e. the
  // current page). Reads them from the per-row checkbox `value` attributes so
  // the answer matches exactly what the bulk-delete handler will submit.
  async currentPageReferences(): Promise<string[]> {
    return this.page.locator('.notification-checkbox').evaluateAll((elements) => (elements as HTMLInputElement[]).map((el) => el.value));
  }

  // Reads the dataset-wide `totalElements` rendered next to the table
  // (e.g. "42 notifications"). Returns 0 when the element is absent, which
  // matches the template guard `{% if totalElements %}`.
  async getTotalElements(): Promise<number> {
    if ((await this.resultsCount.count()) === 0) {
      return 0;
    }
    const text = (await this.resultsCount.textContent()) ?? '';
    const match = text.match(/(\d+)/);
    if (!match) {
      throw new Error(`Could not parse totalElements from results-count text: "${text}"`);
    }
    return Number(match[1]);
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }

  tableRowByReference(referenceNumber: string): Locator {
    return this.page.getByRole('table').getByRole('row', { name: referenceNumber });
  }

  checkboxNotificationByReference(referenceNumber: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select notification ${referenceNumber}` });
  }

  // Walks the GDS pagination control forward until the row carrying
  // `referenceNumber` is rendered, or throws once there are no more pages.
  // Resets to page 1 first so callers don't have to track current pagination
  // state between lookups.
  async findRowByReference(referenceNumber: string, maxPages: number = 10): Promise<void> {
    await this.page.goto(this.expectedUrl);

    const checkbox = this.checkboxNotificationByReference(referenceNumber);
    const nextLink = this.pagination.getByRole('link', { name: 'Next page' });

    for (let visited = 0; visited < maxPages; visited++) {
      if (await checkbox.isVisible()) {
        return;
      }
      if (!(await nextLink.isVisible())) {
        throw new Error(`Notification ${referenceNumber} not found; no more pages.`);
      }
      await nextLink.click();
    }

    throw new Error(`Notification ${referenceNumber} not found within ${maxPages} pages.`);
  }
}
