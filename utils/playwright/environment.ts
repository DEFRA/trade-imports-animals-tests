import { test } from '@playwright/test';

const PROD_ENVIRONMENT = 'prod';

export function getEnvironment(): string | undefined {
  return process.env.ENVIRONMENT ?? process.env.PLAYWRIGHT_ENVIRONMENT;
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
