import { defineConfig } from '@playwright/test';
import dockerComposeConfig from './playwright.docker-compose.config';

/**
 * Runs the maintenance tools in `utils/seeds/` — not tests, so they stay out of
 * `tests/` and out of every suite run, but driven by the Playwright runner for the
 * signed-in fixtures, the address-book globalSetup and the compose service URLs.
 */
export default defineConfig({
  ...dockerComposeConfig,
  testDir: './utils/seeds',
  testMatch: /-journey-contributions\.ts$/,
  // One retry: the check drives a full UI journey, and a flake here reads as
  // "your contributions are stale" — the most misleading false positive available.
  retries: 1,
  reporter: [['list']],
});
