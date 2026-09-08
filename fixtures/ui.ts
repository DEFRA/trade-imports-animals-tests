import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journey, type JourneyContext } from '@flows/journey';
import { PlantsJourney } from '@flows/plants-journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';
import { ApiJourney } from '@flows/api-journey';
import { SeededJourney } from '@flows/seeded-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { createWorkerAuthState } from '@fixtures/auth-state';
import { createFrontendSeedContext } from '@fixtures/seed-context';
import { sessionReuseEnabled } from '@utils/playwright/session-reuse';

export interface AuthWorkerFixtures {
  workerAuthState: string | undefined;
  frontendSeedContext: APIRequestContext;
}

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  journey: Journey;
  plantsJourney: PlantsJourney;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  apiJourney: ApiJourney;
  frontendForms: FrontendFormClient;
  seededJourney: SeededJourney;
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
  frontendSeedContext: [
    async ({ browser, workerAuthState }, use, workerInfo) => {
      const context = await createFrontendSeedContext(browser, workerInfo, workerAuthState);
      await use(context);
      await context.dispose();
    },
    // Shares workerAuthState's budget: on a non-e2e project this mints a second
    // session, and a slow mint should read as a mint failure, not a test timeout.
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
  plantsJourney: async ({ pages, journeyContext }, use) => {
    await use(new PlantsJourney(pages, journeyContext));
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
  frontendForms: async ({ frontendSeedContext }, use) => {
    await use(new FrontendFormClient(frontendSeedContext));
  },
  seededJourney: async ({ frontendForms, addressBookApi, journeyContext }, use) => {
    await use(new SeededJourney(frontendForms, addressBookApi, journeyContext));
  },
});

export { expect };
