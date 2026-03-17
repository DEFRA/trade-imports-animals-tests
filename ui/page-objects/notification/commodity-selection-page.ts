import { Page, Locator } from '@playwright/test';

export class CommoditySelectionPage {
  readonly expectedUrl = '/commodities';
  readonly expectedHeading = 'Select a Commodity';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByTestId('app-heading-title');
  }

  get dropdownCommodity(): Locator {
    return this.page.getByRole('combobox', { name: 'Select a Commodity' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }
}
