import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

/**
 * Accessibility config targeting the local Docker Compose stack.
 * Mirrors playwright.a11y.config.ts (5m timeout, no retries, trace on failure)
 * but points at localhost rather than the CDP hosted environment.
 */
export default defineConfig({
  ...withProjectBaseUrls(sharedConfig, projectBaseUrls, 'local'),
  /* A11y test timeout adjusted to 5m. */
  timeout: 5 * 60 * 1000,
  retries: 0,
  use: {
    ...sharedConfig.use,
    trace: 'retain-on-failure',
  },
});
