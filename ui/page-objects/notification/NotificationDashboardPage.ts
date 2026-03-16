import { Page, Locator } from '@playwright/test';

export class NotificationDashboardPage {
  readonly expectedUrl = '/';
  readonly expectedHeading = 'Import notification service';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create an import notification' });
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }
}
