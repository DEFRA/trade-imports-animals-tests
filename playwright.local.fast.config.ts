import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(sharedConfig, projectBaseUrls, 'local'),
  // One retry absorbs the sporadic OIDC sign-in ETIMEDOUT under parallel load.
  retries: 1,

  use: {
    ...sharedConfig.use,
  },
});
