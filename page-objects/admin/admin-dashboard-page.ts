import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Home' });
  }

  get btnNotifications(): Locator {
    return this.page.getByRole('button', { name: 'Notifications' });
  }

  get btnOutboxEvents(): Locator {
    return this.page.getByRole('button', { name: 'Outbox events' });
  }

  get btnDlqProcess(): Locator {
    return this.page.getByRole('button', { name: 'DLQ process' });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToAdminPortal(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }
}
