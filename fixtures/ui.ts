import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journeys } from '@flows/journeys';

export interface PageFixtures {
  pages: PageObjects;
  journeys: Journeys;
}

export const test = base.extend<PageFixtures>({
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
  journeys: async ({ pages }, use) => {
    await use(new Journeys(pages));
  },
});

export { expect };
