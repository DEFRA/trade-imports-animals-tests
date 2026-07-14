import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

process.env.TRADE_IMPORTS_ANIMALS_BACKEND_BASE_URL ??= 'http://localhost:8085';
process.env.TRADE_IMPORTS_REFERENCE_DATA_BASE_URL ??= 'http://localhost:8086';

/** e2e against the workspace docker-compose stack (local dev and CI). */
export default defineConfig(withProjectBaseUrls(sharedConfig, projectBaseUrls, 'docker-compose'));
