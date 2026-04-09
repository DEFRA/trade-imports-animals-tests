import { Page, Locator } from '@playwright/test';

export class CommodityDetailsPage {
  readonly expectedUrl = '/commodities/details';
  readonly expectedHeading = 'Commodity';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }
}
