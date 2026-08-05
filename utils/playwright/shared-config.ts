import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { throwIfProdEnvironment } from './environment';

dotenv.config({ quiet: true });
throwIfProdEnvironment();

/**
 * Shared Playwright settings without per-environment baseURLs.
 * Apply project baseURLs via withProjectBaseUrls in environment-specific config files.
 * Import-only — not a runnable Playwright config (avoids VS Code extension discovery).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? '50%' : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright'], ['./utils/playwright/failed-suite-reporter.ts']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'frontend-live-animals-chromium',
      // Set-neutral specs exercise both mounts and live at features/*.spec.ts.
      testMatch: [
        '**/tests/e2e/features/live-animals/**/*.spec.ts',
        '**/tests/e2e/features/*.spec.ts',
        '**/tests/e2e/pages/live-animals/**/*.spec.ts',
        '**/tests/e2e/journeys/live-animals/**/*.spec.ts',
        '**/tests/e2e/visual/live-animals/**/*.spec.ts',
        '**/tests/a11y/live-animals/**/*.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'frontend-plant-products-chromium',
      testMatch: [
        '**/tests/e2e/features/plant-products/**/*.spec.ts',
        '**/tests/e2e/pages/plant-products/**/*.spec.ts',
        '**/tests/e2e/journeys/plant-products/**/*.spec.ts',
        '**/tests/e2e/visual/plant-products/**/*.spec.ts',
        '**/tests/a11y/plant-products/**/*.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'admin-chromium',
      testMatch: ['**/tests/e2e/features/admin/**/*.spec.ts', '**/tests/e2e/pages/admin/**/*.spec.ts', '**/tests/a11y/admin/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
  ],
});
