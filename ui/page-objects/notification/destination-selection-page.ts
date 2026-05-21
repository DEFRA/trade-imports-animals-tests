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

  get tableDestinations(): Locator {
    return this.page.getByRole('table');
  }

  get rowsDestinations(): Locator {
    return this.tableDestinations.locator('tbody').getByRole('row');
  }

  linkSelectDestination(rowIndex: number): Locator {
    return this.rowsDestinations.nth(rowIndex).getByRole('link', { name: 'Select' });
  }

  linkSelectDestinationByName(name: string): Locator {
    return this.rowsDestinations.filter({ hasText: name }).getByRole('link', { name: 'Select' });
  }
}
