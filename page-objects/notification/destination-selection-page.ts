import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class DestinationSelectionPage extends BasePage {
  readonly expectedUrl = '/destinations/select';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search for a place of destination' });
  }

  get groupSelectPlaceOfDestination(): Locator {
    return this.page.getByRole('group', { name: 'Select a place of destination' });
  }

  radioPlaceOfDestination(name: string): Locator {
    return this.groupSelectPlaceOfDestination.getByRole('radio', { name: new RegExp(name) });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }
}
