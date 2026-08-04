import { type Page } from '@playwright/test';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminDlqEventsPage } from './admin/admin-dlq-events-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { AdminOutboxEventsPage } from './admin/admin-outbox-events-page';
import { SignInPage } from './auth/sign-in-page';
import { SignOutPage } from './auth/sign-out-page';
import { AboutTheConsignmentPage } from './plant-products/about-the-consignment-page';
import { PlantAccompanyingDocumentsPage } from './plant-products/accompanying-documents-page';
import { PlantConfirmationPage } from './plant-products/confirmation-page';
import { ConsignorConfirmationPage } from './plant-products/consignor-confirmation-page';
import { ConsignorCreatePage } from './plant-products/consignor-create-page';
import { ContactDetailsPage } from './plant-products/contact-details-page';
import { CountryOfOriginPage } from './plant-products/country-of-origin-page';
import { CommodityAdditionalDetailsPage } from './plant-products/commodity-additional-details-page';
import { CommodityBasicDescriptionPage } from './plant-products/commodity-basic-description-page';
import { CommodityBulkDetailsPage } from './plant-products/commodity-bulk-details-page';
import { CommodityInputMethodPage } from './plant-products/commodity-input-method-page';
import { CommoditySearchPage } from './plant-products/commodity-search-page';
import { CommoditySummaryPage } from './plant-products/commodity-summary-page';
import { PlantDeclarationPage } from './plant-products/declaration-page';
import { GoodsMovementServicesPage } from './plant-products/goods-movement-services-page';
import { PlantHubPage } from './plant-products/hub-page';
import { PlantImportTypePage } from './plant-products/import-type-page';
import { PlantOriginOfImportPage } from './plant-products/origin-of-import-page';
import { PlantNotificationDashboardPage } from './plant-products/plant-notification-dashboard-page';
import { NominatedContactPage } from './plant-products/nominated-contact-page';
import { ReviewNotificationPage } from './plant-products/review-notification-page';
import { TradersAddressesPage } from './plant-products/traders-addresses-page';
import { TransportBeforeBipPage } from './plant-products/transport-before-bip-page';
import { VarietyOfGenusAndSpeciesPage } from './plant-products/variety-of-genus-and-species-page';
import { AccompanyingDocumentsPage } from './live-animals/accompanying-documents-page';
import { AdditionalDetailsPage } from './live-animals/additional-details-page';
import { AddressesPage } from './live-animals/addresses-page';
import { AnimalIdentificationPage } from './live-animals/animal-identification-page';
import { ArrivalDetailsPage } from './live-animals/arrival-details-page';
import { CommoditySelectionPage } from './live-animals/commodity-selection-page';
import { ConsignmentDetailsPage } from './live-animals/consignment-details-page';
import { ContactAddressPage } from './live-animals/contact-address-page';
import { CphNumberPage } from './live-animals/cph-number-page';
import { DeclarationPage } from './live-animals/declaration-page';
import { ImportPurposePage } from './live-animals/import-purpose-page';
import { ImportReasonPage } from './live-animals/import-reason-page';
import { ImportTypePage } from './live-animals/import-type-page';
import { NotificationCancelAmendPage } from './live-animals/notification-cancel-amend-page';
import { NotificationDashboardPage } from './live-animals/notification-dashboard-page';
import { NotificationViewPage } from './live-animals/notification-view-page';
import { OriginOfImportPage } from './live-animals/origin-of-import-page';
import { OverviewPage } from './live-animals/overview-page';
import { PartyPickerPage } from './live-animals/party-picker-page';
import { TransitedCountriesPage } from './live-animals/transited-countries-page';
import { TransporterPage } from './live-animals/transporter-page';
import { TransporterSelectionPage } from './live-animals/transporter-selection-page';

export function createSharedPageObjects(page: Page) {
  return {
    page,
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
  };
}

export function createAdminPageObjects(page: Page) {
  return {
    ...createSharedPageObjects(page),
    adminDashboard: new AdminDashboardPage(page),
    adminDlqEvents: new AdminDlqEventsPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    adminOutboxEvents: new AdminOutboxEventsPage(page),
  };
}

export function createLiveAnimalsPageObjects(page: Page) {
  return {
    ...createSharedPageObjects(page),
    notificationDashboard: new NotificationDashboardPage(page),
    importType: new ImportTypePage(page),
    overview: new OverviewPage(page),
    originOfImport: new OriginOfImportPage(page),
    commoditySelection: new CommoditySelectionPage(page),
    consignmentDetails: new ConsignmentDetailsPage(page),
    animalIdentification: new AnimalIdentificationPage(page),
    importReason: new ImportReasonPage(page),
    importPurpose: new ImportPurposePage(page),
    additionalDetails: new AdditionalDetailsPage(page),
    accompanyingDocuments: new AccompanyingDocumentsPage(page),
    addresses: new AddressesPage(page),
    consignorSelection: new PartyPickerPage(page, 'consignors/select', 'Consignor or exporter'),
    destinationSelection: new PartyPickerPage(page, 'destinations/select', 'Place of destination'),
    placeOfOriginSelection: new PartyPickerPage(page, 'place-of-origin/select', 'Place of origin'),
    consigneeSelection: new PartyPickerPage(page, 'consignees/select', 'Consignee'),
    importerSelection: new PartyPickerPage(page, 'importers/select', 'Importer'),
    cphNumber: new CphNumberPage(page),
    arrivalDetails: new ArrivalDetailsPage(page),
    transitedCountries: new TransitedCountriesPage(page),
    transporter: new TransporterPage(page),
    transporterSelection: new TransporterSelectionPage(page),
    contactAddress: new ContactAddressPage(page),
    notificationView: new NotificationViewPage(page),
    declaration: new DeclarationPage(page),
    notificationCancelAmend: new NotificationCancelAmendPage(page),
  };
}

export function createPlantProductsPageObjects(page: Page) {
  return {
    ...createSharedPageObjects(page),
    plantNotificationDashboard: new PlantNotificationDashboardPage(page),
    importType: new PlantImportTypePage(page),
    hub: new PlantHubPage(page),
    countryOfOrigin: new CountryOfOriginPage(page),
    originOfImport: new PlantOriginOfImportPage(page),
    aboutTheConsignment: new AboutTheConsignmentPage(page),
    commodityInputMethod: new CommodityInputMethodPage(page),
    commoditySearch: new CommoditySearchPage(page),
    commodityBasicDescription: new CommodityBasicDescriptionPage(page),
    varietyOfGenusAndSpecies: new VarietyOfGenusAndSpeciesPage(page),
    commoditySummary: new CommoditySummaryPage(page),
    commodityBulkDetails: new CommodityBulkDetailsPage(page),
    commodityAdditionalDetails: new CommodityAdditionalDetailsPage(page),
    transportBeforeBip: new TransportBeforeBipPage(page),
    goodsMovementServices: new GoodsMovementServicesPage(page),
    contactDetails: new ContactDetailsPage(page),
    nominatedContact: new NominatedContactPage(page),
    accompanyingDocuments: new PlantAccompanyingDocumentsPage(page),
    tradersAddresses: new TradersAddressesPage(page),
    consignorCreate: new ConsignorCreatePage(page),
    consignorConfirmation: new ConsignorConfirmationPage(page),
    reviewNotification: new ReviewNotificationPage(page),
    declaration: new PlantDeclarationPage(page),
    confirmation: new PlantConfirmationPage(page),
  };
}

export type SharedPageObjects = ReturnType<typeof createSharedPageObjects>;
export type AdminPageObjects = ReturnType<typeof createAdminPageObjects>;
export type LiveAnimalsPageObjects = ReturnType<typeof createLiveAnimalsPageObjects>;
export type PlantProductsPageObjects = ReturnType<typeof createPlantProductsPageObjects>;
