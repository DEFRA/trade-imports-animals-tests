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
import { PlantProductsApiClient } from '@adapters/http/plant-products-api-client';
import { PlantProductsApiJourney } from '@flows/plant-products/api-journey';
import { PlantProductsJourney } from '@flows/plant-products/journey';
import { PlantProductsNotificationActions } from '@flows/plant-products/notification-actions';
import { createWorkerAuthState, supportsSessionReuse } from '@fixtures/auth-state';

export interface AuthWorkerFixtures {
  /** Path to this worker's saved signed-in state, or undefined when the lane signs in per test. */
  workerAuthState: string | undefined;
}

export interface PageFixtures {
  liveAnimalsPages: LiveAnimalsPageObjects;
  plantProductsPages: PlantProductsPageObjects;
  adminPages: AdminPageObjects;
  journeyContext: JourneyContext;
  liveAnimalsJourney: Journey;
  plantProductsJourney: PlantProductsJourney;
  plantProductsNotificationActions: PlantProductsNotificationActions;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
  notificationApi: NotificationApiClient;
  liveAnimalsApiJourney: ApiJourney;
  plantProductsApi: PlantProductsApiClient;
  plantProductsApiJourney: PlantProductsApiJourney;
}

export const test = base.extend<PageFixtures, AuthWorkerFixtures>({
  // One sign-in per worker rather than one per test. The state is minted in the worker's
  // own browser, so browser-specific sign-in regressions are still exercised, and a spec
  // that must start cold overrides storageState with an explicit empty state.
  workerAuthState: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL;
      if (!supportsSessionReuse(baseURL)) {
        await use(undefined);
        return;
      }
      await use(await createWorkerAuthState(browser, baseURL, workerInfo.workerIndex));
    },
    { scope: 'worker' },
  ],
  storageState: async ({ workerAuthState }, use) => {
    await use(workerAuthState);
  },
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
  plantProductsJourney: async ({ plantProductsPages, journeyContext }, use) => {
    await use(new PlantProductsJourney(plantProductsPages, journeyContext));
  },
  plantProductsNotificationActions: async ({ plantProductsPages }, use) => {
    await use(new PlantProductsNotificationActions(plantProductsPages));
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
  plantProductsApi: async ({ request }, use) => {
    await use(new PlantProductsApiClient(request));
  },
  plantProductsApiJourney: async ({ plantProductsPages, plantProductsApi, journeyContext }, use) => {
    await use(new PlantProductsApiJourney(plantProductsPages, plantProductsApi, journeyContext));
  },
});

export { expect };
