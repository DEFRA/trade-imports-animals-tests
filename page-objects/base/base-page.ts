import { Page, Locator } from '@playwright/test';
import { defaultUser } from '@config/users';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { OrganisationPickerPage } from '@page-objects/auth/organisation-picker-page';

function requireBaseUrl(
  envVar: 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL' | 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL' | 'TRADE_IMPORTS_INS_FRONTEND_BASE_URL',
): string {
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

  user(email: string = defaultUser.email): Locator {
    return this.page.getByText(email);
  }

  get linkSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Sign out' });
  }

  /**
   * `exact` is load-bearing, not decoration. Playwright matches an accessible
   * name as a case-insensitive SUBSTRING unless you opt out, and the service's
   * alpha phase banner links "give your feedback by email" on every page —
   * "feed(back)". Without `exact` this resolves to two links and every click
   * fails on strict mode. Reach for this getter rather than rolling the locator
   * per spec, so the guard cannot be forgotten again.
   */
  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  async navigateToFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToAdminPortal(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToInsFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  /**
   * organisationSbi is only needed for identities with more than one
   * organisation — defra-id-stub shows its "Choose your organisation" picker
   * after sign-in exclusively for those, so single-org identities never hit it.
   */
  protected async signInWhenRequested(attemptSignIn: boolean, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    if (!attemptSignIn) return;
    const signInPage = new SignInPage(this.page);
    // The OIDC chain is pure server 302s, so the caller's goto has already
    // resolved: anywhere but the stub's sign-in form means this context is
    // already authenticated — usually the worker's reused session.
    if (!signInPage.expectedUrl.test(this.page.url())) {
      this.requireDefaultIdentity(options);
      return;
    }
    await signInPage.signIn({ userId: options?.userId });
    const transientError = this.page.getByRole('heading', {
      level: 1,
      name: 'Sorry, we are unable to sign you in.',
    });
    if (await transientError.isVisible()) {
      await this.page.getByRole('link', { name: 'try again' }).click();
      await signInPage.inputUserId.waitFor();
      await signInPage.signIn({ userId: options?.userId });
    }
    await this.selectOrganisationIfPrompted(options?.organisationSbi);
  }

  private requireDefaultIdentity(options?: { userId?: string; organisationSbi?: string }): void {
    if (options?.userId && options.userId !== defaultUser.crn) {
      throw new Error(
        `Already signed in as the default user, so cannot sign in as ${options.userId}. ` +
          'Start cold instead: browser.newContext({ storageState: COLD_START }) for one context, or test.use({ storageState: COLD_START }) for the spec.',
      );
    }
    if (options?.organisationSbi) {
      throw new Error(
        `Already signed in with the default organisation, so cannot select SBI ${options.organisationSbi}. ` +
          'Start cold instead: browser.newContext({ storageState: COLD_START }) for one context, or test.use({ storageState: COLD_START }) for the spec.',
      );
    }
  }

  private async selectOrganisationIfPrompted(organisationSbi?: string): Promise<void> {
    const organisationPicker = new OrganisationPickerPage(this.page);
    if (!organisationSbi) {
      if (await organisationPicker.heading.isVisible()) {
        throw new Error('Signed-in identity has more than one organisation but no organisationSbi was provided to select one.');
      }
      return;
    }
    await organisationPicker.heading.waitFor({ state: 'visible' });
    await organisationPicker.select(organisationSbi);
  }
}

export class NotificationPage extends BasePage {
  constructor(
    page: Page,
    readonly slug: string,
  ) {
    super(page);
  }

  expectedUrl(journeyId: string): string {
    const suffix = this.slug ? `/${this.slug}` : '';
    return `/notifications/${journeyId}${suffix}`;
  }

  journeyIdFromUrl(): string {
    const match = new URL(this.page.url()).pathname.match(/^\/notifications\/([^/]+)/);
    if (!match) {
      throw new Error(`No journey id in notification URL: ${this.page.url()}`);
    }
    return match[1];
  }

  currentJourneyUrl(slug: string = this.slug): string {
    const suffix = slug ? `/${slug}` : '';
    return `/notifications/${this.journeyIdFromUrl()}${suffix}`;
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl(journeyId));
    await this.signInWhenRequested(attemptSignIn);
  }
}
