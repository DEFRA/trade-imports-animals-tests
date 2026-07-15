import { isCdpLocal } from '@utils/playwright/environment';

function getServiceBaseUrl(envVar: string): string {
  const baseUrl = process.env[envVar];
  if (!baseUrl) {
    throw new Error(`${envVar} is not set. Ensure Playwright config applies it before running tests.`);
  }
  return baseUrl;
}

/**
 * Base URL for the trade-imports-animals-backend API, reachable directly
 * (bypassing the frontend) for seeding notification state ahead of a test.
 */
export function getBackendBaseUrl(): string {
  return getServiceBaseUrl('TRADE_IMPORTS_ANIMALS_BACKEND_URL');
}

/**
 * Connection URI for MongoDB, reachable directly by specs asserting on
 * persisted state.
 */
export function getMongoDbUri(): string {
  return getServiceBaseUrl('MONGODB_URI');
}

/**
 * x-api-key for the CDP ephemeral gateway, shared by every service reached
 * through it (not just the backend). Required when CDP_LOCAL=true; unset
 * (undefined) otherwise — CI and docker-compose reach services directly and
 * don't need one.
 */
export function getDeveloperApiKey(): string | undefined {
  const apiKey = process.env.DEVELOPER_API_KEY;
  if (isCdpLocal() && !apiKey) {
    throw new Error('DEVELOPER_API_KEY is not set. Required when CDP_LOCAL=true.');
  }
  return apiKey || undefined;
}
