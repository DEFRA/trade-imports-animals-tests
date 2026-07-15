import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

const dockerComposeConfig = withServiceBaseUrls(withProjectBaseUrls(sharedConfig, projectBaseUrls, 'docker-compose'), {
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  TRADE_IMPORTS_ANIMALS_BACKEND_URL: process.env.TRADE_IMPORTS_ANIMALS_BACKEND_URL ?? 'http://localhost:8085',
});

/**
 * e2e against the workspace docker-compose stack (local dev, CI, and containerised runs).
 * In-container runs (PLAYWRIGHT_IN_CONTAINER=1) add a Chromium host-resolver rule for OIDC localhost redirects.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(dockerComposeConfig) : dockerComposeConfig,
);
