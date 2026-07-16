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

  async open(referenceNumber: string): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl(referenceNumber));
    await this.signInWhenRequested(true);
    await this.heading.waitFor();
    await this.page.waitForLoadState('load');
  }

  get btnConfirmAndSubmit(): Locator {
    return this.page.getByRole('button', { name: 'Confirm and submit' });
  }

  changeLink(sectionHeading: string): Locator {
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: sectionHeading }) })
      .getByRole('link', { name: /^Change/ });
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend this notification' });
  }

  get amendStatusTag(): Locator {
    return this.page.locator('.govuk-tag', { hasText: 'Amend' });
  }

  get btnCancelAmend(): Locator {
    return this.page.getByRole('button', { name: 'Cancel amendment' });
  }

  get amendCancelledBanner(): Locator {
    return this.page.locator('#amend-cancelled-banner');
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get deleteDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Delete this notification?' });
  }

  get btnConfirmDelete(): Locator {
    return this.deleteDialog.getByRole('button', { name: 'Yes, delete' });
  }

  get btnCancelDelete(): Locator {
    return this.deleteDialog.getByRole('button', { name: 'Cancel' });
  }

  get successBanner(): Locator {
    return this.page.locator('#success-banner');
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  errorSummaryLink(text: string | RegExp): Locator {
    return this.errorSummary.getByRole('link', { name: text });
  }
}
