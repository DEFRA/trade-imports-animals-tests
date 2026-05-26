import { Page, Locator, errors } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

const SIGN_IN_FORM_PROBE_MS = 5_000;

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

  async navigateToFrontend(path: string = '/'): Promise<void> {
    const baseUrl = process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL ?? 'http://localhost:3000';
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToAdminPortal(path: string = '/'): Promise<void> {
    const baseUrl = process.env.TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL ?? 'http://localhost:3001';
    await this.page.goto(`${baseUrl}${path}`);
  }

  protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
    if (!attemptSignIn) return;
    const signInPage = new SignInPage(this.page);
    // Under concurrent load the auth stub can be slow; the caller may retry
    // after a goto that landed directly on a post-auth page. Only sign in if
    // the sign-in form is actually present.
    try {
      await signInPage.inputUserId.waitFor({
        state: 'visible',
        timeout: SIGN_IN_FORM_PROBE_MS,
      });
    } catch (error) {
      if (error instanceof errors.TimeoutError) return;
      throw error;
    }
    await signInPage.signIn();
  }
}
