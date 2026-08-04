import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class ReviewNotificationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'review-notification', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  card(name: string): Locator {
    return this.page
      .locator('main')
      .locator('section')
      .filter({ has: this.page.getByRole('heading', { level: 2, name, exact: true }) });
  }

  row(cardName: string, rowName: string): Locator {
    return this.card(cardName)
      .locator('.govuk-summary-list__row')
      .filter({
        has: this.page.locator('.govuk-summary-list__key').getByText(rowName, { exact: true }),
      });
  }

  value(cardName: string, rowName: string): Locator {
    return this.row(cardName, rowName).locator('.govuk-summary-list__value');
  }

  changeLink(cardName: string, rowName: string): Locator {
    return this.row(cardName, rowName).getByRole('link', { name: /^Change/ });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }
}
