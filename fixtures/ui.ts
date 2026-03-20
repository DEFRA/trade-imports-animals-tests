import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';

export interface PageFixtures {
  pages: PageObjects;
}

export const test = base.extend<PageFixtures>({
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
});

export { expect };
