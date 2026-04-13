import { Page, Locator } from '@playwright/test';

export class AdditionalDetailsPage {
  readonly expectedUrl = '/additional-details';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }
}
