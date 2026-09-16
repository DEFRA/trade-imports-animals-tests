import { Page, Locator } from '@playwright/test';
import { defaultUser } from '@config/users';
import { pageLoadWait } from '@config/timeouts';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { OrganisationPickerPage } from '@page-objects/auth/organisation-picker-page';

const SIGN_IN_ERROR_HEADING = 'Sorry, we are unable to sign you in.';

function requireBaseUrl(
  envVar:
    | 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL'
    | 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL'
    | 'TRADE_IMPORTS_INS_FRONTEND_BASE_URL'
    | 'TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL',
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

  /** The three frontends sign out from their service navigation, where the
   * item reads "Log out" and points at /auth/sign-out. `exact` keeps the
   * match off any other link whose name merely contains "log out". */
  get linkSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Log out', exact: true });
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

  async navigateToPlantsFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL');
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
    if (await this.landedOnSignInError(signInPage)) {
      await Promise.all([
        this.page.waitForEvent('framenavigated', { predicate: (frame) => frame === this.page.mainFrame(), ...pageLoadWait }),
        this.page.getByRole('link', { name: 'try again' }).click(),
      ]);
      if (await this.landedOnSignInForm(signInPage)) {
        await signInPage.signIn({ userId: options?.userId });
      }
      if (await this.landedOnSignInError(signInPage)) {
        throw new Error(`Sign-in failed twice: "${SIGN_IN_ERROR_HEADING}" was shown again after trying again.`);
      }
    }
    await this.selectOrganisationIfPrompted(options?.organisationSbi);
  }

  private async landedOnSignInError(signInPage: SignInPage): Promise<boolean> {
    const signInError = this.page.getByRole('heading', { level: 1, name: SIGN_IN_ERROR_HEADING });
    const landingHeading = this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: signInPage.headingName });
    await signInError.or(landingHeading).first().waitFor(pageLoadWait);
    return signInError.isVisible();
  }

  private async landedOnSignInForm(signInPage: SignInPage): Promise<boolean> {
    const signInError = this.page.getByRole('heading', { level: 1, name: SIGN_IN_ERROR_HEADING });
    const landingHeading = this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: signInPage.headingName });
    await signInPage.heading.or(signInError).or(landingHeading).first().waitFor(pageLoadWait);
    return signInPage.heading.isVisible();
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
    await organisationPicker.heading.waitFor({ ...pageLoadWait, state: 'visible' });
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

  /**
   * The service this notification's pages live on. Overridden by a subclass whose
   * journey runs against another frontend, so the journey-URL helpers above and
   * `open` below are reused rather than copied per service.
   */
  protected async navigateToService(path: string): Promise<void> {
    await this.navigateToFrontend(path);
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToService(this.expectedUrl(journeyId));
    await this.signInWhenRequested(attemptSignIn);
  }
}
