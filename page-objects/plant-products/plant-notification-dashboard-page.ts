import { type Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantNotificationDashboardPage extends BasePage {
  readonly expectedUrl = SET_BASES.plantProducts;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Your import notifications' });
  }

  get createNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create a new notification' });
  }

  get resultsTable(): Locator {
    return this.page.getByRole('table');
  }

  get resultRows(): Locator {
    return this.resultsTable.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  row(reference: string): Locator {
    return this.resultRows.filter({ hasText: reference });
  }

  get emptyState(): Locator {
    return this.page.getByText('You have no import notifications.');
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(SET_BASES.plantProducts);
    await this.signInWhenRequested(attemptSignIn);
    await this.heading.waitFor();
  }
}
