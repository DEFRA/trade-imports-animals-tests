import { Page } from '@playwright/test';
import { AccompanyingDocumentsPage } from './notification/accompanying-documents-page';
import { AddressesPage } from './notification/addresses-page';
import { AdditionalDetailsPage } from './notification/additional-details-page';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminDlqEventsPage } from './admin/admin-dlq-events-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { AdminOutboxEventsPage } from './admin/admin-outbox-events-page';
import { AnimalIdentificationPage } from './notification/animal-identification-page';
import { CommodityDetailsPage } from './notification/commodity-details-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { ConsigneeSelectPage } from './notification/consignee-select-page';
import { ConsignorSelectionPage } from './notification/consignor-selection-page';
import { ContactAddressPage } from './notification/contact-address-page';
import { ImporterSelectPage } from './notification/importer-select-page';
import { PlaceOfOriginSelectPage } from './notification/place-of-origin-select-page';
import { CphNumberPage } from './notification/cph-number-page';
import { DeclarationPage } from './notification/declaration-page';
import { DestinationSelectionPage } from './notification/destination-selection-page';
import { EntryPointPage } from './notification/entry-point-page';
import { TransitedCountriesPage } from './notification/transited-countries-page';
import { ImportReasonPage } from './notification/import-reason-page';
import { NotificationDashboardPage } from './notification/notification-dashboard-page';
import { OriginOfImportPage } from './notification/origin-of-import-page';
import { SpeciesSelectionPage } from './notification/species-selection-page';
import { SignInPage } from './auth/sign-in-page';
import { SignOutPage } from './auth/sign-out-page';
import { TransporterPage } from './notification/transporter-page';
import { TransporterSelectionPage } from './notification/transporter-selection-page';
import { NotificationCancelAmendPage } from './notification/notification-cancel-amend-page';
import { NotificationViewPage } from './notification/notification-view-page';

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
    adminDlqEvents: new AdminDlqEventsPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    adminOutboxEvents: new AdminOutboxEventsPage(page),
    animalIdentification: new AnimalIdentificationPage(page),
    commodityDetails: new CommodityDetailsPage(page),
    commoditySelection: new CommoditySelectionPage(page),
    consigneeSelection: new ConsigneeSelectPage(page),
    consignorSelection: new ConsignorSelectionPage(page),
    contactAddress: new ContactAddressPage(page),
    importerSelection: new ImporterSelectPage(page),
    placeOfOriginSelection: new PlaceOfOriginSelectPage(page),
    cphNumber: new CphNumberPage(page),
    declaration: new DeclarationPage(page),
    destinationSelection: new DestinationSelectionPage(page),
    entryPoint: new EntryPointPage(page),
    transitedCountries: new TransitedCountriesPage(page),
    importReason: new ImportReasonPage(page),
    notificationDashboard: new NotificationDashboardPage(page),
    originOfImport: new OriginOfImportPage(page),
    speciesSelection: new SpeciesSelectionPage(page),
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
    transporter: new TransporterPage(page),
    transporterSelection: new TransporterSelectionPage(page),
    notificationCancelAmend: new NotificationCancelAmendPage(page),
    notificationView: new NotificationViewPage(page),
  };
}

/**
 * Type representing all page objects returned by createPageObjects.
 * Used for type-safe fixture definitions.
 */
export type PageObjects = ReturnType<typeof createPageObjects>;
