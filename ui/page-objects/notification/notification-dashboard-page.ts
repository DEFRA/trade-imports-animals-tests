import { Page, Locator } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class NotificationDashboardPage {
  readonly expectedUrl = '/';
  readonly expectedHeading = 'Import notification service';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get btnSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Sign out' });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create an import notification' });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto('/');

    if (attemptSignIn) {
      const signInPage = new SignInPage(this.page);
      await signInPage.signIn();
    }
  }
}
