import { request, type APIRequestContext, type Browser, type WorkerInfo } from '@playwright/test';
import { createAuthState } from '@fixtures/auth-state';
import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';

/** The frontend's own AUTH_TARGETS entry — the dashboard is what proves the session. */
const FRONTEND_TARGET = 'e2e';

/**
 * An APIRequestContext signed in to the animals frontend, whatever project the
 * spec runs under.
 *
 * Seeding cannot ride on `page.request`: auth state is minted per project, so
 * an admin-project test's context holds an `sid` for admin on :3001 and would
 * resolve relative URLs against the admin origin. The frontend base URL is
 * therefore resolved explicitly, and the session minted against it.
 *
 * On the e2e project the running project's session already is a frontend
 * session, so it is reused rather than minted twice. Everywhere else — and on
 * any lane with session reuse off — this is one extra sign-in per worker.
 */
export async function createFrontendSeedContext(
  browser: Browser,
  workerInfo: WorkerInfo,
  projectAuthState: string | undefined,
): Promise<APIRequestContext> {
  const baseURL = getAnimalsFrontendBaseUrl();
  // Carried through or the security profile bypasses ZAP and CDP fails TLS.
  const { proxy, ignoreHTTPSErrors, baseURL: projectBaseUrl } = workerInfo.project.use;

  const alreadyOnTheFrontend = projectAuthState !== undefined && projectBaseUrl === baseURL;
  const storageState = alreadyOnTheFrontend
    ? projectAuthState
    : await createAuthState(browser, {
        targetName: FRONTEND_TARGET,
        baseURL,
        workerIndex: workerInfo.workerIndex,
        proxy,
        ignoreHTTPSErrors,
      });

  return request.newContext({ baseURL, storageState, proxy, ignoreHTTPSErrors });
}
