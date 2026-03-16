import { Page } from '@playwright/test';
import { NotificationDashboardPage } from './notification/NotificationDashboardPage';
import { OriginOfImportPage } from './notification/OriginOfImportPage';

/**
 * Factory function to create all page object instances.
 * Centralizes page object instantiation for better maintainability and scalability.
 *
 * @param page - Playwright Page instance from test context
 * @returns Object containing all page object instances
 */
export function createPageObjects(page: Page) {
  return {
    page,
    notificationDashboard: new NotificationDashboardPage(page),
    originOfImport: new OriginOfImportPage(page),
  };
}

/**
 * Type representing all page objects returned by createPageObjects.
 * Used for type-safe fixture definitions.
 */
export type PageObjects = ReturnType<typeof createPageObjects>;
