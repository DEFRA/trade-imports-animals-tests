import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://host.docker.internal:3000',
  'admin-chromium': 'http://host.docker.internal:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(baseConfig, projectBaseUrls, 'local'),
  workers: 1,
  retries: 0,

  use: {
    ...baseConfig.use,
    headless: false,
    trace: 'on',
  },
});
