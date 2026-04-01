import { Page, Locator } from '@playwright/test';

export class ImportReasonPage {
  readonly expectedUrl = '/import-reason';
  readonly expectedHeading = 'What is the main reason for importing the animals?';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get headingPage(): Locator {
    return this.page.locator('.govuk-heading-xl');
  }
}
