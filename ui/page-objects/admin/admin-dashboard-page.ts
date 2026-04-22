import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class AdminDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Home' });
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
