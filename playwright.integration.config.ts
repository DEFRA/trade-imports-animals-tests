import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';
import { withProjectBaseUrls } from './utils/playwright/with-project-base-urls';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';

const projectBaseUrls: Record<string, string> = {
  'frontend-live-animals-chromium': 'http://localhost:3000',
  'frontend-plant-products-chromium': 'http://localhost:3000',
  'admin-chromium': 'http://localhost:3001',
};

const integrationConfig = withServiceBaseUrls(withProjectBaseUrls(sharedConfig, projectBaseUrls, 'integration'), {
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  TRADE_IMPORTS_ANIMALS_BACKEND_URL: process.env.TRADE_IMPORTS_ANIMALS_BACKEND_URL ?? 'http://localhost:8085',
  AWS_SQS_ENDPOINT: process.env.AWS_SQS_ENDPOINT ?? 'http://localhost:4566',
  NOTIFICATION_SQS_DLQ_URL:
    process.env.NOTIFICATION_SQS_DLQ_URL ??
    'http://localhost:4566/000000000000/trade_imports_animals_eu_notifications_gateway-deadletter.fifo',
});

/**
 * Integration lane — @integration seams against the workspace stack's frontend on :3000
 * (LIVE_ANIMALS_MODE=real). Same service base URLs as the docker-compose lane.
 */
export default defineConfig(process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(integrationConfig) : integrationConfig);
