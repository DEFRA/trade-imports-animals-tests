import { defineConfig, devices } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';

/**
 * Dual-frontend parity harness (EUDPA-288 Stream C).
 *
 * Two frontends run at once in the workspace against the one backend:
 *   - `reworked` — the promoted journey, local-dev frontend on :3100, runs the
 *     reworked E2E suite under tests/e2e.
 *   - `main`     — the pre-rework journey, :latest sibling frontend on :3200,
 *     runs the retained main E2E suite frozen under main-suite/tests/e2e.
 *
 * The journeys DIFFER in UI, so parity is not the same spec on both: it is
 * main-suite-on-main-FE plus reworked-suite-on-reworked-FE, both green. Admin is
 * a single shared service (:3001), covered once by the reworked side's admin specs.
 */
const reworkedUrl = process.env.REWORKED_FRONTEND_URL ?? 'http://localhost:3100';
const mainUrl = process.env.MAIN_FRONTEND_URL ?? 'http://localhost:3200';
const adminUrl = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:3001';

const viewport = { width: 1280, height: 1000 };

const parityConfig = withServiceBaseUrls(
  {
    ...sharedConfig,
    // Both parity suites share one workspace stack; unbounded local workers
    // overwhelm the defra-id auth stub and tip the heaviest reaches into
    // 30s timeouts. Four workers is the empirically clean ceiling.
    workers: process.env.CI ? '50%' : 4,
    projects: [
      {
        name: 'reworked',
        testDir: './tests/e2e',
        testIgnore: ['**/admin/**'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: reworkedUrl },
      },
      {
        name: 'main',
        testDir: './main-suite/tests/e2e',
        testIgnore: ['**/admin/**'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: mainUrl },
      },
      {
        name: 'admin',
        testDir: './tests/e2e',
        testMatch: ['**/admin/**/*.spec.ts'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: adminUrl },
      },
    ],
  },
  {
    MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
    TRADE_IMPORTS_ANIMALS_BACKEND_URL: process.env.TRADE_IMPORTS_ANIMALS_BACKEND_URL ?? 'http://localhost:8085',
    AWS_SQS_ENDPOINT: process.env.AWS_SQS_ENDPOINT ?? 'http://localhost:4566',
    NOTIFICATION_SQS_DLQ_URL:
      process.env.NOTIFICATION_SQS_DLQ_URL ??
      'http://localhost:4566/000000000000/trade_imports_animals_eu_notifications_gateway-deadletter.fifo',
  },
);

export default defineConfig(process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(parityConfig) : parityConfig);
