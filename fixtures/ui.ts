import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journeys, type JourneyContext } from '@flows/journeys';
import { AdminJourneys } from '@flows/admin-journeys';
import { TestDataHelper } from '@utils/test-data/test-data-helper';

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  journeys: Journeys;
  adminJourneys: AdminJourneys;
  testData: typeof TestDataHelper;
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
  // eslint-disable-next-line no-empty-pattern
  testData: async ({}, use) => {
    await use(TestDataHelper);
  },
});

export { expect };
