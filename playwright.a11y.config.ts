import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  /* A11y test timeout adjusted to 3m. */
  timeout: 3 * 60 * 1000,
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'retain-on-failure',
  },
});
