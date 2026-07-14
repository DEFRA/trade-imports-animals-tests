import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { getEnvironment } from './utils/playwright/environment';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const environment = getEnvironment();

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': `https://trade-imports-animals-frontend.${environment}.cdp-int.defra.cloud`,
  'admin-chromium': `https://trade-imports-animals-admin.${environment}.cdp-int.defra.cloud`,
};

process.env.TRADE_IMPORTS_ANIMALS_BACKEND_BASE_URL ??= `https://trade-imports-animals-backend.${environment}.cdp-int.defra.cloud`;
process.env.TRADE_IMPORTS_REFERENCE_DATA_BASE_URL ??= `https://trade-imports-reference-data.${environment}.cdp-int.defra.cloud`;

/**
 * Base config: e2e against the deployed CDP environment.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(withProjectBaseUrls(sharedConfig, projectBaseUrls, 'cdp'));
