import { Page, Locator, errors } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { SET_BASES } from '@page-objects/base/sets';

const SIGN_IN_FORM_PROBE_MS = 5_000;

function requireBaseUrl(envVar: 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL' | 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL'): string {
  const baseUrl = process.env[envVar];
  if (!baseUrl) {
    throw new Error(`${envVar} is not set. Ensure Playwright config applies project base URLs before running tests.`);
  }
  return baseUrl;
}

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
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToAdminPortal(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL');
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
    const transientError = this.page.getByRole('heading', {
      level: 1,
      name: 'Sorry, we are unable to sign you in.',
    });
    if (await transientError.isVisible()) {
      await this.page.getByRole('link', { name: 'try again' }).click();
      await signInPage.inputUserId.waitFor();
      await signInPage.signIn();
    }
  }
}

export class NotificationPage extends BasePage {
  constructor(
    page: Page,
    readonly slug: string,
    readonly setBase: string = SET_BASES.liveAnimals,
  ) {
    super(page);
  }

  expectedUrl(journeyId: string): string {
    const suffix = this.slug ? `/${this.slug}` : '';
    return `${this.setBase}/notifications/${journeyId}${suffix}`;
  }

  journeyIdFromUrl(): string {
    const match = new URL(this.page.url()).pathname.match(new RegExp(`^${this.setBase}/notifications/([^/]+)`));
    if (!match) {
      throw new Error(`No journey id in notification URL: ${this.page.url()}`);
    }
    return match[1];
  }

  currentJourneyUrl(slug: string = this.slug): string {
    const suffix = slug ? `/${slug}` : '';
    return `${this.setBase}/notifications/${this.journeyIdFromUrl()}${suffix}`;
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl(journeyId));
    await this.signInWhenRequested(attemptSignIn);
  }
}
