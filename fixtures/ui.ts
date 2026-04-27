import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { Journeys } from '@flows/journeys';
import { getServiceBaseUrl } from '../utils/urls';

export interface PageFixtures {
  pages: PageObjects;
  journeys: Journeys;
  adminBaseUrl: string;
}

export const test = base.extend<PageFixtures>({
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
  journeys: async ({ pages }, use) => {
    await use(new Journeys(pages));
  },
  // eslint-disable-next-line no-empty-pattern
  adminBaseUrl: async ({}, use) => {
    await use(getServiceBaseUrl('trade-imports-animals-admin', 3001));
  },
});

export { expect };
