import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'retain-on-failure',
  },
});
