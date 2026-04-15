import { Page, Locator } from '@playwright/test';

export class AnimalIdentificationPage {
  readonly expectedUrl = '/commodities/identification';
  readonly expectedHeading = 'Enter animal identification details';

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

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
