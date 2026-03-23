import { Page, Locator } from '@playwright/test';

export class AdminDashboardPage {
  readonly expectedUrl = '/';
  readonly expectedHeading = 'Home';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get btnNotifications(): Locator {
    return this.page.getByRole('button', { name: 'Notifications' });
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }
}
