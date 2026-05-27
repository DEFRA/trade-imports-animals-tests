import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(sharedConfig, projectBaseUrls, 'local'),
  workers: 1,
  retries: 0,

  use: {
    ...sharedConfig.use,
    headless: false,
    trace: 'on-first-retry',
  },
});
