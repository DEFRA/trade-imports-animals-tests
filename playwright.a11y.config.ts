import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  /* A11y test timeout adjusted to 2m. */
  timeout: 2 * 60 * 1000,
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'retain-on-failure',
  },
});
