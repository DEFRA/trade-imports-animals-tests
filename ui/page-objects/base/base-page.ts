import { Page, Locator } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class BasePage {
  constructor(protected readonly page: Page) {}

  get linkHome(): Locator {
    return this.page.getByRole('link', { name: 'Home' });
  }

  get linkAbout(): Locator {
    return this.page.getByRole('link', { name: 'About' });
  }

  user(email: string = 'test.user11@defra.gov.uk'): Locator {
    return this.page.getByText(email);
  }

  get linkSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Sign out' });
  }

  protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
    if (attemptSignIn) {
      const signInPage = new SignInPage(this.page);
      await signInPage.signIn();
    }
  }
}
