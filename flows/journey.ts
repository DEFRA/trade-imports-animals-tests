import type { PageObjects } from '@page-objects';
import {
  ARRIVAL_DATE,
  CONSIGNEE_NAME,
  CONSIGNOR_NAME,
  CONTACT_ADDRESS_NAME,
  DESTINATION_NAME,
  IMPORTER_NAME,
  PLACE_OF_ORIGIN_NAME,
  TRANSPORT_DOCUMENT_REFERENCE,
  TRANSPORT_IDENTIFICATION,
  type JourneyOptions,
} from '@domain/constants/journey-options';

export type JourneyContext = {
  journeyId?: string;
  referenceNumber?: string;
  declarationDate?: string;
};

const COUNTRY = 'France';
const PORT = 'Aberdeen Harbour (GB ABD)';
export class Journey {
  constructor(
    private readonly pages: PageObjects,
    private readonly context: JourneyContext,
  ) {}

  async toSignIn(open: (attemptSignIn: boolean) => Promise<void>): Promise<void> {
    await open(false);
  }

  async toNotificationDashboard(): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.heading.waitFor();
  }

  private async createNotificationAtOrigin(): Promise<string> {
    await this.toNotificationDashboard();
    await this.pages.notificationDashboard.btnCreateNewNotification.click();
    await this.pages.originOfImport.heading.waitFor();
    const journeyId = this.pages.originOfImport.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }

  // Origin answered — most other tasks are gated behind it, so callers that
  // want a usable task list reach the overview this way, not via startNotificationAtOrigin().
  async startNotification(): Promise<string> {
    const journeyId = await this.createNotificationAtOrigin();
    await this.fillOriginOfImport();
    await this.saveOriginOfImport();
    // Wait for the save to land before navigating away. Opening the overview
    // regardless hides a failed save — the run then dies several steps later on
    // a task stuck at "Cannot start yet", pointing at the wrong page entirely.
    await this.pages.originOfImport.heading.waitFor({ state: 'hidden' });
    await this.pages.overview.open(journeyId);
    await this.pages.overview.heading.waitFor();
    return journeyId;
  }

  // Origin unanswered — the entry guard is satisfied by the opening-run
  // marker set at creation, not by answering origin itself.
  async startNotificationAtOrigin(): Promise<string> {
    const journeyId = await this.createNotificationAtOrigin();
    await this.pages.overview.open(journeyId);
    await this.pages.overview.heading.waitFor();
    return journeyId;
  }

  // Origin unanswered, as a brand-new notification first shows it.
  async toOriginOfImport(): Promise<void> {
    await this.createNotificationAtOrigin();
  }

  async fillOriginOfImport(options: JourneyOptions = {}): Promise<void> {
    await this.pages.originOfImport.selectCountry(COUNTRY);
    const requiresRegionCode = options.requiresRegionCode ?? 'No';
    await this.pages.originOfImport.radioRequiresOriginCode(requiresRegionCode).check();
    if (requiresRegionCode === 'Yes') {
      await this.pages.originOfImport.regionCode.fill('75');
    }
    if (options.internalReference) {
      await this.pages.originOfImport.internalReference.fill(options.internalReference);
    }
  }

  async saveOriginOfImport(): Promise<void> {
    await this.pages.originOfImport.saveAndContinue.click();
  }

  async answerOrigin(options: JourneyOptions = {}): Promise<void> {
    await this.pages.overview.task('Where is this consignment coming from?').click();
    await this.fillOriginOfImport(options);
    await this.saveOriginOfImport();
    await this.pages.overview.heading.waitFor();
  }

  // Split at the page boundaries the journey saves at, so the contribution
  // recorder can capture each one. The section helpers below compose them.
  async answerCommoditySelection(): Promise<void> {
    await this.pages.overview.task('What are you importing?').click();
    await this.pages.commoditySelection.selectSpecies(['Bos taurus']);
    await this.pages.commoditySelection.saveAndContinue.click();
    await this.pages.consignmentDetails.heading.waitFor();
  }

  async answerConsignmentDetails(): Promise<void> {
    await this.pages.consignmentDetails.numberOfAnimals.fill('1');
    await this.pages.consignmentDetails.numberOfPackages.fill('5');
    await this.pages.consignmentDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerCommodity(): Promise<void> {
    await this.answerCommoditySelection();
    await this.answerConsignmentDetails();
  }

  async answerAnimalIdentification(): Promise<void> {
    await this.pages.overview.task('Animal identification details').click();
    await this.pages.animalIdentification.earTag.fill('UK123456789012');
    await this.pages.animalIdentification.saveAndFinish.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerImportReason(): Promise<void> {
    await this.pages.overview.task('Main reason for importing').click();
    await this.pages.importReason.reason('Internal market').check();
    await this.pages.importReason.saveAndContinue.click();
    await this.pages.importPurpose.heading.waitFor();
  }

  async answerImportPurpose(): Promise<void> {
    await this.pages.importPurpose.purpose('Breeding').check();
    await this.pages.importPurpose.saveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor();
  }

  async answerAdditionalDetails(): Promise<void> {
    await this.pages.additionalDetails.certifiedFor('Slaughter').check();
    await this.pages.additionalDetails.containsUnweanedAnimals('No').check();
    await this.pages.additionalDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerReasonAndAdditionalDetails(): Promise<void> {
    await this.answerImportReason();
    await this.answerImportPurpose();
    await this.answerAdditionalDetails();
  }

  async unlockSections(): Promise<void> {
    await this.answerCommodity();
  }

  async toAccompanyingDocuments(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Uploaded documents').click();
    await this.pages.accompanyingDocuments.heading.waitFor();
  }

  async fillAddressesToCph(): Promise<void> {
    await this.pages.overview.task('Roles and addresses').click();
    const parties = [
      ['Consignor or exporter', CONSIGNOR_NAME, 'consignorSelection'],
      ['Place of destination', DESTINATION_NAME, 'destinationSelection'],
      ['Place of origin', PLACE_OF_ORIGIN_NAME, 'placeOfOriginSelection'],
      ['Consignee', CONSIGNEE_NAME, 'consigneeSelection'],
      ['Importer', IMPORTER_NAME, 'importerSelection'],
    ] as const;
    for (const [role, name, picker] of parties) {
      await this.pages.addresses.addParty(role).click();
      await this.pages[picker].select(name);
      await this.pages[picker].saveAndContinue.click();
      await this.pages.addresses.heading.waitFor();
    }
    await this.pages.addresses.continueButton.click();
    await this.pages.cphNumber.heading.waitFor();
  }

  async answerCphNumber(): Promise<void> {
    await this.pages.cphNumber.cphNumber.fill('12/345/6789');
    await this.pages.cphNumber.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerAddresses(): Promise<void> {
    await this.fillAddressesToCph();
    await this.answerCphNumber();
  }

  async fillArrivalDetails(means: string = 'Road Vehicle'): Promise<void> {
    await this.pages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await this.pages.arrivalDetails.selectPort(PORT);
    await this.pages.page.getByRole('radio', { name: means, exact: true }).check();
    await this.pages.arrivalDetails.transportIdentification.fill(TRANSPORT_IDENTIFICATION);
    await this.pages.arrivalDetails.transportDocumentReference.fill(TRANSPORT_DOCUMENT_REFERENCE);
  }

  // Re-navigate from the hub to the transporter-type page within an already
  // unlocked journey. The page itself saves through unfilled; it is filled
  // because a road vehicle keeps transited countries in scope, which is
  // answered on the way.
  async reachTransporterFromHub(): Promise<void> {
    await this.pages.overview.task('Arrival details').click();
    await this.pages.arrivalDetails.heading.waitFor();
    await this.fillArrivalDetails();
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor();
    await this.pages.transitedCountries.selectCountry('France');
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor();
  }

  async answerArrivalDetails(): Promise<void> {
    await this.pages.overview.task('Arrival details').click();
    await this.fillArrivalDetails();
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor();
  }

  async answerTransitedCountries(): Promise<void> {
    await this.pages.transitedCountries.selectCountry('France');
    await this.pages.transitedCountries.selectCountry('Belgium');
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor();
  }

  async answerTransporterType(): Promise<void> {
    await this.pages.transporter.transporterType('Commercial').check();
    await this.pages.transporter.saveAndContinue.click();
    await this.pages.transporterSelection.heading.waitFor();
  }

  async answerTransporterSelection(): Promise<void> {
    await this.pages.transporterSelection.transporter('García Livestock Transport SL').check();
    await this.pages.transporterSelection.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerTransporter(): Promise<void> {
    await this.answerTransporterType();
    await this.answerTransporterSelection();
  }

  async answerTransport(): Promise<void> {
    await this.answerArrivalDetails();
    await this.answerTransitedCountries();
    await this.answerTransporter();
  }

  async answerContact(): Promise<void> {
    await this.pages.overview.task('Contact address').click();
    await this.pages.contactAddress.address(CONTACT_ADDRESS_NAME).check();
    await this.pages.contactAddress.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async completeAnswerSections(): Promise<void> {
    await this.answerOrigin({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
    await this.answerCommodity();
    await this.answerAnimalIdentification();
    await this.answerReasonAndAdditionalDetails();
    await this.answerAddresses();
    await this.answerTransport();
    await this.answerContact();
  }

  async toArrivalDetails(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Arrival details').click();
    await this.pages.arrivalDetails.heading.waitFor();
  }

  async toReview(): Promise<void> {
    if (!this.context.journeyId) await this.startNotification();
    await this.completeAnswerSections();
    await this.pages.overview.task('Check and submit').click();
    await this.pages.notificationView.heading.waitFor();
  }

  async toDeclaration(): Promise<void> {
    await this.startNotification();
    await this.completeAnswerSections();
    await this.pages.overview.task('Check and submit').click();
    await this.pages.notificationView.heading.waitFor();
    await this.pages.notificationView.continueButton.click();
    await this.pages.declaration.heading.waitFor();
  }

  async submitNotification(): Promise<void> {
    await this.toDeclaration();
    await this.pages.declaration.confirmation.check();
    await this.pages.declaration.continueButton.click();
    await this.pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
  }
}
