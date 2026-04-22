import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journeys, type JourneyContext } from '@flows/journeys';

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  journeys: Journeys;
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
});

export { expect };
