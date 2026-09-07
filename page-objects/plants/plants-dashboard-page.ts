import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class PlantsDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnStartNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Start a new notification' });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToPlantsFrontend('/');
    await this.signInWhenRequested(attemptSignIn);
  }
}
