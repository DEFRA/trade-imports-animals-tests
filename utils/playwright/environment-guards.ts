import { test } from '@fixtures';

/**
 * Skip a test when running against CDP hosted environments.
 */
export function skipIfCdpEnvironment(reason: string): void {
  const baseUrl = String(test.info().project.use.baseURL ?? '');
  test.skip(baseUrl.toLowerCase().includes('.cdp-int.defra.cloud'), reason);
}
