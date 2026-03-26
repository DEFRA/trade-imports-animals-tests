import { Page, Locator } from '@playwright/test';

export class SpeciesSelectionPage {
  readonly expectedUrl = '/commodities/select';
  readonly expectedHeading = 'Commodity';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get headingPage(): Locator {
    return this.page.locator('.govuk-heading-xl');
  }
}
