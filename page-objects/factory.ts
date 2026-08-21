import { type Page } from '@playwright/test';
import { AccompanyingDocumentsPage } from './notification/accompanying-documents-page';
import { AdditionalDetailsPage } from './notification/additional-details-page';
import { AddressesPage } from './notification/addresses-page';
import { AnimalIdentificationPage } from './notification/animal-identification-page';
import { ArrivalDetailsPage } from './notification/arrival-details-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { ConsignmentDetailsPage } from './notification/consignment-details-page';
import { ContactAddressPage } from './notification/contact-address-page';
import { CphNumberPage } from './notification/cph-number-page';
import { DeclarationPage } from './notification/declaration-page';
import { ImportPurposePage } from './notification/import-purpose-page';
import { ImportReasonPage } from './notification/import-reason-page';
import { NotificationCancelAmendPage } from './notification/notification-cancel-amend-page';
import { NotificationDashboardPage } from './notification/notification-dashboard-page';
import { NotificationViewPage } from './notification/notification-view-page';
import { OriginOfImportPage } from './notification/origin-of-import-page';
import { OverviewPage } from './notification/overview-page';
import { PartyPickerPage } from './notification/party-picker-page';
import { TransitedCountriesPage } from './notification/transited-countries-page';
import { TransporterPage } from './notification/transporter-page';
import { TransporterSelectionPage } from './notification/transporter-selection-page';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminDlqEventsPage } from './admin/admin-dlq-events-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { AdminOutboxEventsPage } from './admin/admin-outbox-events-page';
import { SignInPage } from './auth/sign-in-page';
import { SignOutPage } from './auth/sign-out-page';
import { OrganisationPickerPage } from './auth/organisation-picker-page';
import { InsAddressBookListPage } from './ins/ins-address-book-list-page';
import { InsAddressBookAddPage } from './ins/ins-address-book-add-page';
import { InsAddressBookViewPage } from './ins/ins-address-book-view-page';
import { InsAddressBookEditPage } from './ins/ins-address-book-edit-page';
import { InsAddressBookDeletePage } from './ins/ins-address-book-delete-page';

export function createPageObjects(page: Page) {
  return {
    page,
    notificationDashboard: new NotificationDashboardPage(page),
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
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
    organisationPicker: new OrganisationPickerPage(page),
    adminDashboard: new AdminDashboardPage(page),
    adminDlqEvents: new AdminDlqEventsPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    adminOutboxEvents: new AdminOutboxEventsPage(page),
    insAddressBookList: new InsAddressBookListPage(page),
    insAddressBookAdd: new InsAddressBookAddPage(page),
    insAddressBookView: new InsAddressBookViewPage(page),
    insAddressBookEdit: new InsAddressBookEditPage(page),
    insAddressBookDelete: new InsAddressBookDeletePage(page),
  };
}

export type PageObjects = ReturnType<typeof createPageObjects>;
