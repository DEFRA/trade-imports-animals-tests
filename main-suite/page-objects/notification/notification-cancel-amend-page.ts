import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class NotificationCancelAmendPage extends BasePage {
  expectedUrl(referenceNumber: string): string {
    return `/notification-cancel-amend/${referenceNumber}`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Cancel amendment' });
  }

  get confirmationQuestion(): Locator {
    return this.page.getByText('Are you sure you want to cancel this amendment?');
  }

  get btnYesCancelAmendment(): Locator {
    return this.page.getByRole('button', { name: 'Yes, cancel amendment' });
  }

  get btnNoReturnToNotification(): Locator {
    return this.page.getByRole('button', { name: 'No, return to notification' });
  }

  async open(referenceNumber: string): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl(referenceNumber));
    await this.signInWhenRequested(true);
    await this.heading.waitFor();
    await this.page.waitForLoadState('load');
  }
}
