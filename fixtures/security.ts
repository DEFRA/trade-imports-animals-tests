import { request } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import { ApiJourney } from '@flows/api-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { zapPort } from '@config/zap';

export interface SecurityFixtures {
  proxiedNotificationApi: NotificationApiClient;
  proxiedApiJourney: ApiJourney;
}

export const test = base.extend<SecurityFixtures>({
  // eslint-disable-next-line no-empty-pattern
  proxiedNotificationApi: async ({}, use) => {
    const context = await request.newContext({ proxy: { server: `http://localhost:${zapPort}` } });
    await use(new NotificationApiClient(context));
    await context.dispose();
  },
  // Only the notification API is proxied — the address-book reads are seeding
  // lookups, not part of what this suite scans.
  proxiedApiJourney: async ({ pages, proxiedNotificationApi, addressBookApi, journeyContext }, use) => {
    await use(new ApiJourney(pages, proxiedNotificationApi, addressBookApi, journeyContext));
  },
});

export { expect };
