import { Page } from '@playwright/test';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { NotificationDashboardPage } from './notification/notification-dashboard-page';
import { OriginOfImportPage } from './notification/origin-of-import-page';

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
    adminDashboard: new AdminDashboardPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    commoditySelection: new CommoditySelectionPage(page),
    notificationDashboard: new NotificationDashboardPage(page),
    originOfImport: new OriginOfImportPage(page),
  };
}

/**
 * Type representing all page objects returned by createPageObjects.
 * Used for type-safe fixture definitions.
 */
export type PageObjects = ReturnType<typeof createPageObjects>;
