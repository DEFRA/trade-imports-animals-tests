import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  workers: 1,
  retries: 0,

  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:3000',
    headless: false,
    trace: 'on',
  },
});
