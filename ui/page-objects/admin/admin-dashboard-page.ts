import { Page, Locator } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class AdminDashboardPage {
  readonly expectedUrl = '/';

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Home' });
  }

  get btnSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Sign out' });
  }

  get btnNotifications(): Locator {
    return this.page.getByRole('button', { name: 'Notifications' });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto(this.expectedUrl);

    if (attemptSignIn) {
      const signInPage = new SignInPage(this.page);
      await signInPage.signIn();
    }
  }
}
