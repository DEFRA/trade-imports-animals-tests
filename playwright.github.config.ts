import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://trade-imports-animals-frontend:3000',
  'admin-chromium': 'http://trade-imports-animals-admin:3001',
};

export default defineConfig({
  ...withProjectBaseUrls(baseConfig, projectBaseUrls, 'github'),
});
