import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journey, type JourneyContext } from '@flows/journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';
import { ApiJourney } from '@flows/api-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { ensureE2eAddressBook } from '@domain/fixtures/e2e-address-book';

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

type WorkerFixtures = {
  /** Ensures the shared E2E address-book fixtures exist once per worker (API, not Mongo). */
  e2eAddressBook: void;
};

export const test = base.extend<PageFixtures, WorkerFixtures>({
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
  e2eAddressBook: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext();
      try {
        await ensureE2eAddressBook(new AddressBookApiClient(request));
      } finally {
        await request.dispose();
      }
      await use();
    },
    { scope: 'worker', auto: true },
  ],
});

export { expect };
