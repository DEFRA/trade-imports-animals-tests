import { defineConfig, devices } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';

const FRONTEND_BASE_URL = 'http://localhost:3100';
const CROSS_BROWSER_SPECS = ['**/tests/cross-browser/**/*.spec.ts'];

process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL = FRONTEND_BASE_URL;

/**
 * Lane A — cross-browser thin happy-path smoke against the real-mode frontend target on :3100.
 *
 * Renders the promoted journey across Chromium, Firefox and WebKit to catch browser-specific rendering /
 * sign-in regressions. Deliberately thin (the deterministic journey net is the frontend canned suite);
 * BrowserStack is out of scope (the wdio.browserstack stubs are unimplemented).
 */
const crossBrowserConfig = {
  ...sharedConfig,
  projects: [
    {
      name: 'frontend-chromium',
      testMatch: CROSS_BROWSER_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: FRONTEND_BASE_URL, viewport: { width: 1280, height: 1000 } },
    },
    {
      name: 'frontend-firefox',
      testMatch: CROSS_BROWSER_SPECS,
      use: { ...devices['Desktop Firefox'], baseURL: FRONTEND_BASE_URL, viewport: { width: 1280, height: 1000 } },
    },
    {
      name: 'frontend-webkit',
      testMatch: CROSS_BROWSER_SPECS,
      use: { ...devices['Desktop Safari'], baseURL: FRONTEND_BASE_URL, viewport: { width: 1280, height: 1000 } },
    },
  ],
};

export default defineConfig(
  process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(crossBrowserConfig) : crossBrowserConfig,
);
