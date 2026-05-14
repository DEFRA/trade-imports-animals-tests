import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(baseConfig, projectBaseUrls, 'local'),
  retries: 0,

  use: {
    ...baseConfig.use,
    trace: 'on',
  },
});
