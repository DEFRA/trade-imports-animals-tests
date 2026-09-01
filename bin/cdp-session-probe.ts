import { chromium, type Browser } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { AUTH_COOKIE_NAME, AUTH_TARGETS, LANDING_TIMEOUT_MS, stripToAuthCookie, type AuthTarget } from '@fixtures/auth-state';
import { getEnvironment, throwIfProdEnvironment } from '@utils/playwright/environment';

/**
 * Evidence gatherer for session reuse on CDP (`npm run probe:cdp-session-reuse`
 * with ENVIRONMENT set, or E2E_PROBE_BASE_URL for a single-URL sanity run):
 * per service, it signs in once, saves the auth cookie, then repeats
 * authenticated navigations in fresh contexts and fails if any is bounced back
 * to the sign-in form — establishing that load-balanced replicas honour a
 * session minted against another, instead of presuming it from the shared
 * Redis session store. A failing environment keeps E2E_SESSION_REUSE off.
 */

const NAVIGATIONS = 20;

const CDP_SERVICES: Record<string, string> = {
  e2e: 'trade-imports-animals-frontend',
  admin: 'trade-imports-animals-admin',
  ins: 'trade-imports-ins-frontend',
};

function probeBaseUrls(): Record<string, string> {
  const override = process.env.E2E_PROBE_BASE_URL;
  if (override) return { e2e: override };
  const environment = getEnvironment();
  if (!environment) {
    throw new Error('Set ENVIRONMENT (or PLAYWRIGHT_ENVIRONMENT), or E2E_PROBE_BASE_URL, to pick a probe target.');
  }
  return Object.fromEntries(
    Object.entries(CDP_SERVICES).map(([project, service]) => [project, `https://${service}.${environment}.cdp-int.defra.cloud`]),
  );
}

async function probeService(browser: Browser, baseURL: string, target: AuthTarget): Promise<void> {
  console.log(`Minting one session against ${baseURL} ...`);
  const mintContext = await browser.newContext({ baseURL });
  const mintPage = await mintContext.newPage();
  await mintPage.goto(target.landingPath);
  await new SignInPage(mintPage).signIn();
  await target.landingHeading(mintPage).waitFor({ state: 'visible', timeout: LANDING_TIMEOUT_MS });
  const storageState = stripToAuthCookie(await mintContext.storageState(), baseURL);
  await mintContext.close();

  console.log(`Reusing it across ${NAVIGATIONS} navigations in fresh contexts ...`);
  for (let navigation = 1; navigation <= NAVIGATIONS; navigation++) {
    const context = await browser.newContext({ baseURL, storageState });
    try {
      const page = await context.newPage();
      await page.goto(target.landingPath);
      if (new SignInPage(page).expectedUrl.test(page.url())) {
        throw new Error(`Navigation ${navigation} of ${NAVIGATIONS} was bounced to the sign-in form — the session was not honoured.`);
      }
      await target.landingHeading(page).waitFor({ state: 'visible', timeout: LANDING_TIMEOUT_MS });
      console.log(`  navigation ${navigation}/${NAVIGATIONS}: honoured`);
    } finally {
      await context.close();
    }
  }
}

async function main(): Promise<void> {
  throwIfProdEnvironment();
  const baseUrls = probeBaseUrls();
  const browser = await chromium.launch();

  try {
    for (const [project, baseURL] of Object.entries(baseUrls)) {
      await probeService(browser, baseURL, AUTH_TARGETS[project]);
      console.log(
        `PASS: one minted "${AUTH_COOKIE_NAME}" session was honoured across ${NAVIGATIONS} fresh-context navigations against ${baseURL}.`,
      );
    }
    console.log('Scope: sequential navigations only — this does not exercise concurrent access to one session or its TTL over a full run.');
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
