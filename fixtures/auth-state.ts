import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  expect,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  type Page,
  type WorkerInfo,
} from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { NotificationDashboardPage } from '@page-objects/notification/notification-dashboard-page';
import { AdminDashboardPage } from '@page-objects/admin/admin-dashboard-page';
import { InsAddressBookListPage } from '@page-objects/ins/ins-address-book-list-page';
import { PlantsDashboardPage } from '@page-objects/plants/plants-dashboard-page';

const AUTH_STATE_DIR = resolve(process.cwd(), 'playwright/.auth');

/** All four services use @hapi/cookie's default name; the cookie carries only a sessionId resolved against each service's own session store. */
export const AUTH_COOKIE_NAME = 'sid';

export const LANDING_TIMEOUT_MS = 20_000;
const SIGN_IN_ATTEMPTS = 2;

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

/** Opt-out token: `test.use({ storageState: COLD_START })` starts every test in a spec unauthenticated. */
const coldStartState: StorageState = { cookies: [], origins: [] };
Object.freeze(coldStartState.cookies);
Object.freeze(coldStartState.origins);
export const COLD_START: StorageState = Object.freeze(coldStartState);

export type AuthTarget = {
  landingPath: string;
  landingHeading: (page: Page) => Locator;
};

// Each target asserts the landing page's OWN heading, never a bare level-1:
// the sign-in failure page has an h1 too, and a generic assertion could save
// an unauthenticated state file.
export const AUTH_TARGETS: Record<string, AuthTarget> = {
  e2e: { landingPath: '/', landingHeading: (page) => new NotificationDashboardPage(page).heading },
  admin: { landingPath: '/', landingHeading: (page) => new AdminDashboardPage(page).heading },
  ins: { landingPath: '/address-book', landingHeading: (page) => new InsAddressBookListPage(page).heading },
  plants: { landingPath: '/', landingHeading: (page) => new PlantsDashboardPage(page).heading },
};

const slug = (baseUrl: string): string => baseUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');

// The services share the `localhost` cookie domain but keep separate session-store
// key prefixes, so a session minted against one is a cache miss against the others.
function authStatePath(targetName: string, baseUrl: string, workerIndex: number): string {
  return resolve(AUTH_STATE_DIR, `${targetName}-${slug(baseUrl)}-w${workerIndex}.json`);
}

/**
 * What to sign in to, named explicitly instead of read off the running project.
 * A spec's project decides which service its browser points at; it does not
 * decide which service a fixture needs a session for, and seeding needs the
 * frontend whatever project it runs under.
 */
export type AuthMint = {
  /** Key into AUTH_TARGETS — which service's landing page proves the session. */
  targetName: string;
  baseURL: string;
  workerIndex: number;
  /** Both carried from the project's context options: without them a
   * security-profile mint bypasses ZAP and a CDP mint fails TLS. */
  proxy?: BrowserContextOptions['proxy'];
  ignoreHTTPSErrors?: boolean;
};

/** Temp-then-rename, so a failed or unverified mint never leaves a state file behind. */
export async function createAuthState(browser: Browser, mint: AuthMint): Promise<string> {
  const { targetName, baseURL, workerIndex, proxy, ignoreHTTPSErrors } = mint;
  const target = AUTH_TARGETS[targetName];
  if (!target) {
    throw new Error(`No auth target named "${targetName}" — add one to AUTH_TARGETS in fixtures/auth-state.ts.`);
  }

  // browser.newContext() does not inherit project-level context options, and
  // without proxy/ignoreHTTPSErrors a security-profile mint would bypass ZAP.
  const contextOptions: BrowserContextOptions = { baseURL, proxy, ignoreHTTPSErrors };

  mkdirSync(AUTH_STATE_DIR, { recursive: true });
  const statePath = authStatePath(targetName, baseURL, workerIndex);
  const mintingPath = `${statePath}.minting`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= SIGN_IN_ATTEMPTS; attempt++) {
    const context = await browser.newContext(contextOptions);
    try {
      const page = await context.newPage();
      await page.goto(target.landingPath);
      await new SignInPage(page).signIn();
      await expect(target.landingHeading(page)).toBeVisible({ timeout: LANDING_TIMEOUT_MS });

      writeFileSync(mintingPath, JSON.stringify(stripToAuthCookie(await context.storageState(), baseURL), null, 2));
      await verifySavedState(browser, contextOptions, target, mintingPath);
      renameSync(mintingPath, statePath);
      return statePath;
    } catch (error) {
      lastError = error;
    } finally {
      rmSync(mintingPath, { force: true });
      await context.close();
    }
  }

  throw new Error(`Worker ${workerIndex} could not sign in to ${baseURL} in ${SIGN_IN_ATTEMPTS} attempts`, {
    cause: lastError,
  });
}

/** The per-project mint: the running project names both the target and the base URL. */
export async function createWorkerAuthState(browser: Browser, workerInfo: WorkerInfo): Promise<string> {
  const { name } = workerInfo.project;
  const { baseURL, proxy, ignoreHTTPSErrors } = workerInfo.project.use;
  if (!baseURL) {
    throw new Error(`Project "${name}" has no baseURL, so no session can be minted for it.`);
  }

  return createAuthState(browser, {
    targetName: name,
    baseURL,
    workerIndex: workerInfo.workerIndex,
    proxy,
    ignoreHTTPSErrors,
  });
}

/**
 * The yar `session` cookie carries per-user journey working state that must not bleed
 * across a worker's tests, and the identity stub's own cookies belong to the mint.
 */
export function stripToAuthCookie(state: StorageState, baseUrl: string): StorageState {
  const cookies = state.cookies.filter((cookie) => cookie.name === AUTH_COOKIE_NAME);
  if (cookies.length === 0) {
    throw new Error(`Sign-in to ${baseUrl} produced no "${AUTH_COOKIE_NAME}" session cookie to save.`);
  }
  return { cookies, origins: [] };
}

// Over-stripping or a renamed session cookie fails the mint loudly, not every test that restores it.
async function verifySavedState(
  browser: Browser,
  contextOptions: BrowserContextOptions,
  target: AuthTarget,
  statePath: string,
): Promise<void> {
  const context = await browser.newContext({ ...contextOptions, storageState: statePath });
  try {
    const page = await context.newPage();
    await page.goto(target.landingPath);
    await expect(target.landingHeading(page)).toBeVisible({ timeout: LANDING_TIMEOUT_MS });
  } finally {
    await context.close();
  }
}
