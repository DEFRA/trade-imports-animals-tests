import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class NotificationViewPage extends BasePage {
  expectedUrl(referenceNumber: string): string {
    return `/notification-view/${referenceNumber}`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notification details' });
  }

  get referenceNumberCaption(): Locator {
    return this.page.locator('.govuk-caption-xl');
  }

  get dateCreated(): Locator {
    return this.page.locator('p.govuk-body').filter({ hasText: 'Date created:' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  sectionHeading(text: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: text });
  }

  summaryValue(term: string): Locator {
    return this.page.locator('dt').filter({ hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  get commodityName(): Locator {
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: 'Your commodities' }) })
      .locator('p.govuk-body strong');
  }

  get speciesRows(): Locator {
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: 'Your commodities' }) })
      .locator('tbody tr');
  }

  speciesCell(rowIndex: number, colIndex: number): Locator {
    return this.speciesRows.nth(rowIndex).locator('td').nth(colIndex);
  }

  get documentsRows(): Locator {
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: 'Accompanying documents' }) })
      .locator('tbody tr');
  }

  get noDocumentsText(): Locator {
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: 'Accompanying documents' }) })
      .locator('p.govuk-body', { hasText: 'Not yet added' });
  }
}
