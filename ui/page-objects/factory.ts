import { Page } from '@playwright/test';
import { AccompanyingDocumentsPage } from './notification/accompanying-documents-page';
import { AddressesPage } from './notification/addresses-page';
import { AdditionalDetailsPage } from './notification/additional-details-page';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { AnimalIdentificationPage } from './notification/animal-identification-page';
import { CommodityDetailsPage } from './notification/commodity-details-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { ConsignorSelectionPage } from './notification/consignor-selection-page';
import { CphNumberPage } from './notification/cph-number-page';
import { DestinationSelectionPage } from './notification/destination-selection-page';
import { EntryPointPage } from './notification/entry-point-page';
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
    accompanyingDocuments: new AccompanyingDocumentsPage(page),
    addresses: new AddressesPage(page),
    additionalDetails: new AdditionalDetailsPage(page),
    adminDashboard: new AdminDashboardPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    animalIdentification: new AnimalIdentificationPage(page),
    commodityDetails: new CommodityDetailsPage(page),
    commoditySelection: new CommoditySelectionPage(page),
    consignorSelection: new ConsignorSelectionPage(page),
    cphNumber: new CphNumberPage(page),
    destinationSelection: new DestinationSelectionPage(page),
    entryPoint: new EntryPointPage(page),
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
