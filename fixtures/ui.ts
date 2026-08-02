import { test as base, expect } from '@playwright/test';
import {
  createAdminPageObjects,
  createLiveAnimalsPageObjects,
  createPlantProductsPageObjects,
  type AdminPageObjects,
  type LiveAnimalsPageObjects,
  type PlantProductsPageObjects,
} from '@page-objects';
import { Journey, type JourneyContext } from '@flows/live-animals/journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/live-animals/notification-actions';
import { ApiJourney } from '@flows/live-animals/api-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';

export interface PageFixtures {
  liveAnimalsPages: LiveAnimalsPageObjects;
  plantProductsPages: PlantProductsPageObjects;
  adminPages: AdminPageObjects;
  journeyContext: JourneyContext;
  liveAnimalsJourney: Journey;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
  notificationApi: NotificationApiClient;
  liveAnimalsApiJourney: ApiJourney;
}

export const test = base.extend<PageFixtures>({
  liveAnimalsPages: async ({ page }, use) => {
    await use(createLiveAnimalsPageObjects(page));
  },
  plantProductsPages: async ({ page }, use) => {
    await use(createPlantProductsPageObjects(page));
  },
  adminPages: async ({ page }, use) => {
    await use(createAdminPageObjects(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use) => {
    await use({});
  },
  liveAnimalsJourney: async ({ liveAnimalsPages, journeyContext }, use) => {
    await use(new Journey(liveAnimalsPages, journeyContext));
  },
  adminNavigation: async ({ adminPages }, use) => {
    await use(new AdminNavigation(adminPages));
  },
  notificationActions: async ({ liveAnimalsPages }, use) => {
    await use(new NotificationActions(liveAnimalsPages));
  },
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  liveAnimalsApiJourney: async ({ liveAnimalsPages, notificationApi, journeyContext }, use) => {
    await use(new ApiJourney(liveAnimalsPages, notificationApi, journeyContext));
  },
});

export { expect };
