import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { getEnvironment } from './utils/playwright/environment';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';
import { cdpServiceUrl } from './utils/playwright/cdp-service-url';
import { withZapProxy } from './utils/playwright/with-zap-proxy';

const environment = getEnvironment();

// Session reuse stays off on CDP until `npm run probe:cdp-session-reuse` has
// passed against the target environment's replicas (EUDPA-361); a lane with
// that evidence opts in by setting E2E_SESSION_REUSE=on.
process.env.E2E_SESSION_REUSE ??= 'off';

const projectBaseUrls: Record<string, string> = {
  e2e: `https://trade-imports-animals-frontend.${environment}.cdp-int.defra.cloud`,
  admin: `https://trade-imports-animals-admin.${environment}.cdp-int.defra.cloud`,
  ins: `https://trade-imports-ins-frontend.${environment}.cdp-int.defra.cloud`,
};

const cdpConfig = withServiceBaseUrls(withProjectBaseUrls(sharedConfig, projectBaseUrls, 'cdp'), {
  TRADE_IMPORTS_ANIMALS_BACKEND_URL: cdpServiceUrl('trade-imports-animals-backend', environment),
  TRADE_IMPORTS_ADDRESS_BOOK_URL: cdpServiceUrl('trade-imports-address-book', environment),
});

/**
 * Base config: e2e against the deployed CDP environment.
 * PROFILE=security or security:active routes traffic through ZAP's proxy.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(withZapProxy(cdpConfig));
