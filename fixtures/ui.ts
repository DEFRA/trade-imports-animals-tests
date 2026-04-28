import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journeys, type JourneyContext } from '@flows/journeys';
import { AdminJourneys } from '@flows/admin-journeys';

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  journeys: Journeys;
  adminJourneys: AdminJourneys;
}

export const test = base.extend<PageFixtures>({
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use) => {
    await use({});
  },
  journeys: async ({ pages, journeyContext }, use) => {
    await use(new Journeys(pages, journeyContext));
  },
  adminJourneys: async ({ pages }, use) => {
    await use(new AdminJourneys(pages));
  },
});

export { expect };
