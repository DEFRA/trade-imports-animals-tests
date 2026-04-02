import { Page } from '@playwright/test';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { ImportReasonPage } from './notification/import-reason-page';
import { NotificationDashboardPage } from './notification/notification-dashboard-page';
import { OriginOfImportPage } from './notification/origin-of-import-page';
import { SpeciesSelectionPage } from './notification/species-selection-page';
import { SignInPage } from './auth/sign-in-page';
import { SignOutPage } from './auth/sign-out-page';

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
    importReason: new ImportReasonPage(page),
    notificationDashboard: new NotificationDashboardPage(page),
    originOfImport: new OriginOfImportPage(page),
    speciesSelection: new SpeciesSelectionPage(page),
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
  };
}

/**
 * Type representing all page objects returned by createPageObjects.
 * Used for type-safe fixture definitions.
 */
export type PageObjects = ReturnType<typeof createPageObjects>;
