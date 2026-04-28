import { Page, Locator } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class NotificationDashboardPage {
  readonly expectedUrl = '/';

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
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

      // The auth stub can fail under concurrent load. If we don't land on the
      // dashboard within a short grace period, retry the whole auth flow once.
      try {
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        await this.page.goto('/');
        await signInPage.signIn();
      }
    }
  }
}
