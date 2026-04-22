import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class NotificationDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create an import notification' });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto('/');
    await this.signInWhenRequested(attemptSignIn);
  }
}
