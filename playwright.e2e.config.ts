import { defineConfig, devices } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';

/** Workspace E2E configuration for the frontend and admin services. */
const frontendUrl = process.env.REWORKED_FRONTEND_URL ?? 'http://localhost:3000';
const adminUrl = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:3001';

const viewport = { width: 1280, height: 1000 };

const e2eConfig = withServiceBaseUrls(
  {
    ...sharedConfig,
    outputDir: 'test-results/e2e',
    reporter: [
      ['list'],
      ['html', { open: 'never', outputFolder: 'playwright-report/e2e' }],
      ['allure-playwright'],
      ['./utils/playwright/failed-suite-reporter.ts'],
    ],
    // Unbounded local workers overwhelm the defra-id auth stub and tip the
    // heaviest reaches into 30s timeouts. Four workers is the empirically clean ceiling.
    workers: process.env.CI ? '50%' : 4,
    projects: [
      {
        name: 'e2e-live-animals',
        testDir: './tests/e2e',
        testMatch: ['**/live-animals/**/*.spec.ts', '**/tests/e2e/features/*.spec.ts'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: frontendUrl },
      },
      {
        name: 'e2e-plant-products',
        testDir: './tests/e2e',
        testMatch: ['**/plant-products/**/*.spec.ts'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: frontendUrl },
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

export default defineConfig(process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(e2eConfig) : e2eConfig);
