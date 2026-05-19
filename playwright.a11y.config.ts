import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  /* A11y test timeout adjusted to 5m. */
  timeout: 5 * 60 * 1000,
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'retain-on-failure',
  },
});
