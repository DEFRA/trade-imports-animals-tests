import { request, type APIRequestContext } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import { ApiJourney } from '@flows/api-journey';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { zapPort } from '@config/zap';

export interface SecurityFixtures {
  proxiedRequest: APIRequestContext;
  proxiedNotificationApi: NotificationApiClient;
  proxiedAddressBookApi: AddressBookApiClient;
  proxiedApiJourney: ApiJourney;
}

export const test = base.extend<SecurityFixtures>({
  // Shared by every proxied client, so seeding a notification puts its
  // address-book reads through ZAP alongside its notification writes.
  // eslint-disable-next-line no-empty-pattern
  proxiedRequest: async ({}, use) => {
    const context = await request.newContext({ proxy: { server: `http://localhost:${zapPort}` } });
    await use(context);
    await context.dispose();
  },
  proxiedNotificationApi: async ({ proxiedRequest }, use) => {
    await use(new NotificationApiClient(proxiedRequest));
  },
  proxiedAddressBookApi: async ({ proxiedRequest }, use) => {
    await use(new AddressBookApiClient(proxiedRequest));
  },
  proxiedApiJourney: async ({ proxiedNotificationApi, proxiedAddressBookApi, journeyContext }, use) => {
    await use(new ApiJourney(proxiedNotificationApi, proxiedAddressBookApi, journeyContext));
  },
});

export { expect };
