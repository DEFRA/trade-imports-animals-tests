import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journey, type JourneyContext } from '@flows/journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';
import { ApiJourney } from '@flows/api-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { createWorkerAuthState } from '@fixtures/auth-state';
import { sessionReuseEnabled } from '@utils/playwright/session-reuse';

export interface AuthWorkerFixtures {
  workerAuthState: string | undefined;
}

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  journey: Journey;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  apiJourney: ApiJourney;
}

export const test = base.extend<PageFixtures, AuthWorkerFixtures>({
  workerAuthState: [
    async ({ browser }, use, workerInfo) => {
      if (!sessionReuseEnabled()) {
        await use(undefined);
        return;
      }
      await use(await createWorkerAuthState(browser, workerInfo));
    },
    // Its own timeout, so a slow mint is reported as a mint failure instead of
    // eating the first test's budget.
    { scope: 'worker', timeout: 120_000 },
  ],
  storageState: async ({ workerAuthState }, use) => {
    await use(workerAuthState);
  },
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use) => {
    await use({});
  },
  journey: async ({ pages, journeyContext }, use) => {
    await use(new Journey(pages, journeyContext));
  },
  adminNavigation: async ({ pages }, use) => {
    await use(new AdminNavigation(pages));
  },
  notificationActions: async ({ pages }, use) => {
    await use(new NotificationActions(pages));
  },
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  addressBookApi: async ({ request }, use) => {
    await use(new AddressBookApiClient(request));
  },
  apiJourney: async ({ pages, notificationApi, addressBookApi, journeyContext }, use) => {
    await use(new ApiJourney(pages, notificationApi, addressBookApi, journeyContext));
  },
});

export { expect };
