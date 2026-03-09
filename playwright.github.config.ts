import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  use: {
    ...baseConfig.use,
    baseURL: 'http://trade-imports-animals-frontend:3000',
  },
});
