import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journey, type JourneyContext } from '@flows/journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';
import { ApiJourney } from '@flows/api-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { createWorkerAuthState, sessionReuseEnabled } from '@fixtures/auth-state';

export interface AuthWorkerFixtures {
  /** Path to this worker's saved signed-in state, or undefined when the run signs in per test. */
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
  // One lazy sign-in per worker per project, restored per test through
  // Playwright's storageState option. A spec that must start unauthenticated
  // overrides that option with COLD_START (see fixtures/auth-state.ts).
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
  apiJourney: async ({ pages, notificationApi, journeyContext }, use) => {
    await use(new ApiJourney(pages, notificationApi, journeyContext));
  },
});

export { expect };
