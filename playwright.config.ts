import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { getServiceBaseUrl } from './utils/urls';

// Read environment variables from file
dotenv.config({ quiet: true });

const rawEnvironment = process.env.ENVIRONMENT ?? process.env.PLAYWRIGHT_ENVIRONMENT;
if (rawEnvironment?.toLowerCase() === 'prod') {
  throw new Error('Refusing to run Playwright tests against prod environment. Set ENVIRONMENT/PLAYWRIGHT_ENVIRONMENT to a non-prod value.');
}

const frontendBaseUrl = getServiceBaseUrl('trade-imports-animals-frontend', 3000);
const adminBaseUrl = getServiceBaseUrl('trade-imports-animals-admin', 3001);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* CI: 50% workers for stability. Local: undefined uses Playwright default CPU-based auto-scaling. */
  workers: process.env.CI ? '50%' : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright'], ['./utils/playwright/failed-suite-reporter.ts']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take a screenshot of the page when a test fails. */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'frontend-chromium',
      testIgnore: ['**/tests/e2e/features/admin/**/*.spec.ts', '**/tests/e2e/pages/admin/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: frontendBaseUrl,
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'admin-chromium',
      testMatch: ['**/tests/e2e/features/admin/**/*.spec.ts', '**/tests/e2e/pages/admin/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: adminBaseUrl,
        viewport: { width: 1280, height: 1000 },
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
