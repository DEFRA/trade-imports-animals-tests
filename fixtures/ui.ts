import { test as base, expect } from '@playwright/test';
import { createPageObjects, type PageObjects } from '@page-objects';
import { NotificationJourney, type JourneyContext } from '@flows/notification-journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';

export interface PageFixtures {
  pages: PageObjects;
  journeyContext: JourneyContext;
  notificationJourney: NotificationJourney;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
}

export const test = base.extend<PageFixtures>({
  pages: async ({ page }, use) => {
    await use(createPageObjects(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use) => {
    await use({});
  },
  notificationJourney: async ({ pages, journeyContext }, use) => {
    await use(new NotificationJourney(pages, journeyContext));
  },
  adminNavigation: async ({ pages }, use) => {
    await use(new AdminNavigation(pages));
  },
  notificationActions: async ({ pages }, use) => {
    await use(new NotificationActions(pages));
  },
});

export { expect };
