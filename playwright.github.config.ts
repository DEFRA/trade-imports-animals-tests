import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://frontend.cdp-docker.test:3000',
  'admin-chromium': 'http://admin.cdp-docker.test:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(sharedConfig, projectBaseUrls, 'github'),
});
