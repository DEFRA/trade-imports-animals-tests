import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Browser, type Locator, type Page } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { SET_BASES } from '@page-objects/base/sets';
import { AdminDashboardPage } from '@page-objects/admin/admin-dashboard-page';
import { NotificationDashboardPage } from '@page-objects/live-animals/notification-dashboard-page';

const AUTH_STATE_DIR = resolve(process.cwd(), 'playwright/.auth');

// Cookies are not port-scoped, so on a local stack the frontend (:3000) and
// admin (:3001) share the `localhost` cookie domain while keeping separate Redis key
// prefixes — a session minted against one is a cache miss against the other. Keying
// saved state by role and base URL is what stops the lanes overwriting each other.
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

const LANDING_TIMEOUT_MS = 20_000;
const SIGN_IN_ATTEMPTS = 2;

type AuthTarget = {
  role: 'frontend' | 'admin';
  landingPath: string;
  landingHeading: (page: Page) => Locator;
};

const FRONTEND_TARGET: AuthTarget = {
  role: 'frontend',
  landingPath: SET_BASES.liveAnimals,
  landingHeading: (page) => new NotificationDashboardPage(page).heading,
};

const ADMIN_TARGET: AuthTarget = {
  role: 'admin',
  landingPath: '/',
  landingHeading: (page) => new AdminDashboardPage(page).heading,
};

/**
 * Session reuse is a local-stack affordance: it depends on the shared `localhost`
 * cookie domain and on base URLs that identify a single service instance. CDP has
 * per-service hostnames and load-balanced replicas, and none of that was measured
 * here, so deployed lanes keep signing in per test.
 */
export function supportsSessionReuse(baseUrl: string | undefined): baseUrl is string {
  if (!baseUrl) return false;
  try {
    return LOCAL_HOSTNAMES.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

const targetFor = (baseUrl: string): AuthTarget =>
  baseUrl === process.env.TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL ? ADMIN_TARGET : FRONTEND_TARGET;

const slug = (baseUrl: string): string => baseUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');

/** Per role, per base URL and per worker — the three axes along which a session is not interchangeable. */
export function authStatePath(role: string, baseUrl: string, workerIndex: number): string {
  mkdirSync(AUTH_STATE_DIR, { recursive: true });
  return resolve(AUTH_STATE_DIR, `${role}-${slug(baseUrl)}-w${workerIndex}.json`);
}

/**
 * Signs in once for a worker and saves the resulting cookies, so the worker's tests
 * restore a session instead of driving the identity provider each time. Every sign-in
 * makes three cross-container calls that can time out, so fewer of them is the point.
 *
 * Retries once in-process: the worker fixture is a single point of failure for every
 * test the worker runs, and a bare failure there looks nothing like an auth problem.
 */
export async function createWorkerAuthState(browser: Browser, baseURL: string, workerIndex: number): Promise<string> {
  const target = targetFor(baseURL);
  const path = authStatePath(target.role, baseURL, workerIndex);
  let lastError: unknown;

  for (let attempt = 1; attempt <= SIGN_IN_ATTEMPTS; attempt++) {
    const context = await browser.newContext({ baseURL });
    try {
      const page = await context.newPage();
      await page.goto(target.landingPath);
      await new SignInPage(page).signIn();
      // The landing page's own heading, never a bare level-1: the sign-in failure page
      // has one of those too, so a generic assertion would save an unauthenticated state
      // file and leave every test signing in for real behind a green suite.
      await expect(target.landingHeading(page)).toBeVisible({ timeout: LANDING_TIMEOUT_MS });
      await context.storageState({ path });
      return path;
    } catch (error) {
      lastError = error;
    } finally {
      await context.close();
    }
  }

  throw new Error(`Worker ${workerIndex} could not sign in to ${baseURL} in ${SIGN_IN_ATTEMPTS} attempts`, { cause: lastError });
}
