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
    if (!attemptSignIn) return;
    const signInPage = new SignInPage(this.page);
    // Under concurrent load the auth stub can be slow; the caller may retry
    // after a goto that landed directly on a post-auth page. Only sign in if
    // the sign-in form is actually present.
    try {
      await signInPage.inputUserId.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      return;
    }
    await signInPage.signIn();
  }
}
