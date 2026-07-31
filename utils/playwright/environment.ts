import { test } from '@playwright/test';

const PROD_ENVIRONMENT = 'prod';

export function getEnvironment(): string | undefined {
  return process.env.ENVIRONMENT ?? process.env.PLAYWRIGHT_ENVIRONMENT;
}

/**
 * True when Playwright is running locally (not CI, not from inside CDP)
 * against a CDP environment. Backend services aren't reachable from outside
 * CDP's network via their direct URL, so this switches to the protected
 * ephemeral gateway instead — see cdpServiceUrl().
 */
export function isCdpLocal(): boolean {
  return process.env.CDP_LOCAL === 'true';
}

export function throwIfProdEnvironment(environment = getEnvironment()): void {
  if (environment?.toLowerCase() === PROD_ENVIRONMENT) {
    throw new Error(
      'Refusing to run Playwright tests against prod environment. Set ENVIRONMENT/PLAYWRIGHT_ENVIRONMENT to a non-prod value.',
    );
  }
}

/**
 * Skip a test when running against CDP hosted environments.
 */
export function skipIfCdpEnvironment(reason: string): void {
  const baseUrl = String(test.info().project.use.baseURL ?? '');
  test.skip(baseUrl.toLowerCase().includes('.cdp-int.defra.cloud'), reason);
}

/**
 * True when running against the Docker Compose stack (local or GitHub) — the only environment
 * with direct Mongo access, so persistence assertions gate on this rather than a tag.
 */
export function isComposeEnvironment(): boolean {
  const baseUrl = String(test.info().project.use.baseURL ?? '').toLowerCase();
  return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('cdp-docker.test');
}

/**
 * Skip a test when running against the Docker Compose stack (local or GitHub).
 */
export function skipIfComposeEnvironment(reason: string): void {
  test.skip(isComposeEnvironment(), reason);
}
