import type { PageObjects } from '@page-objects';
import type { JourneyOptions } from '@domain/constants/journey-options';

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

  async startNotification(): Promise<string> {
    await this.toNotificationDashboard();
    await this.pages.notificationDashboard.btnCreateNewNotification.click();
    await this.pages.importType.heading.waitFor();
    const journeyId = this.pages.importType.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    await this.pages.importType.liveAnimals.check();
    await this.pages.importType.continueButton.click();
    await this.pages.originOfImport.heading.waitFor();
    await this.pages.overview.open(journeyId);
    await this.pages.overview.heading.waitFor();
    return journeyId;
  }

  async toOriginOfImport(): Promise<void> {
    const journeyId = await this.startNotification();
    await this.pages.originOfImport.open(journeyId);
    await this.pages.originOfImport.heading.waitFor();
  }

  async fillOriginOfImport(options: JourneyOptions = {}): Promise<void> {
    await this.pages.originOfImport.selectCountry(COUNTRY);
    const requiresRegionCode = options.requiresRegionCode ?? 'No';
    await this.pages.originOfImport.radioRequiresOriginCode(requiresRegionCode).check();
    if (requiresRegionCode === 'Yes') {
      await this.pages.originOfImport.regionCode.fill('FR-75');
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

  async answerCommodity(): Promise<void> {
    await this.pages.overview.task('What are you importing?').click();
    await this.pages.commoditySelection.searchAndSelect('Cow', ['Bos taurus']);
    await this.pages.commoditySelection.saveAndContinue.click();
    await this.pages.consignmentDetails.heading.waitFor();
    await this.pages.consignmentDetails.numberOfAnimals.fill('1');
    await this.pages.consignmentDetails.numberOfPackages.fill('5');
    await this.pages.consignmentDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerAnimalIdentification(): Promise<void> {
    await this.pages.overview.task('Animal identification details').click();
    await this.pages.animalIdentification.earTag.fill('UK123456789012');
    await this.pages.animalIdentification.saveAndFinish.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerReasonAndAdditionalDetails(): Promise<void> {
    await this.pages.overview.task('Main reason for importing').click();
    await this.pages.importReason.reason('Internal market').check();
    await this.pages.importReason.saveAndContinue.click();
    await this.pages.importPurpose.heading.waitFor();
    await this.pages.importPurpose.purpose('Breeding').check();
    await this.pages.importPurpose.saveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor();
    await this.pages.additionalDetails.certifiedFor('Slaughter').check();
    await this.pages.additionalDetails.containsUnweanedAnimals('No').check();
    await this.pages.additionalDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async unlockSections(): Promise<void> {
    await this.answerOrigin();
    await this.answerCommodity();
  }

  async toAccompanyingDocuments(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Uploaded documents').click();
    await this.pages.accompanyingDocuments.heading.waitFor();
  }

  async answerAddresses(): Promise<void> {
    await this.pages.overview.task('Roles and addresses').click();
    const parties = [
      ['Consignor or exporter', 'Astra Rosales'],
      ['Place of destination', 'Tech Imports Ltd'],
      ['Place of origin', 'Origin Farm'],
      ['Consignee', 'British Livestock Ltd'],
      ['Importer', 'Import Co UK'],
    ] as const;
    for (const [role, name] of parties) {
      await this.pages.addresses.addParty(role).click();
      await this.pages.page.getByRole('radio', { name }).check();
      await this.pages.page.getByRole('button', { name: 'Save and continue' }).click();
      await this.pages.addresses.heading.waitFor();
    }
    await this.pages.addresses.continueButton.click();
    await this.pages.cphNumber.heading.waitFor();
    await this.pages.cphNumber.cphNumber.fill('12/345/6789');
    await this.pages.cphNumber.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerTransport(): Promise<void> {
    await this.pages.overview.task('Arrival details').click();
    await this.pages.arrivalDetails.fillArrivalDate({ day: '12', month: '12', year: '2026' });
    await this.pages.arrivalDetails.portOfEntry.fill('Aberdeen');
    await this.pages.page.getByRole('option', { name: PORT, exact: true }).click();
    await this.pages.page.getByRole('radio', { name: 'Road Vehicle', exact: true }).check();
    await this.pages.arrivalDetails.transportIdentification.fill('FR-892-LK');
    await this.pages.arrivalDetails.transportDocumentReference.fill('CMR-2026-884721');
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor();
    await this.pages.transitedCountries.selectCountry('France');
    await this.pages.transitedCountries.addAnotherCountry.click();
    await this.pages.transitedCountries.selectCountry('Belgium', 1);
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor();
    await this.pages.transporter.transporterType('Commercial').check();
    await this.pages.transporter.saveAndContinue.click();
    await this.pages.transporterSelection.heading.waitFor();
    await this.pages.transporterSelection.transporter('García Livestock Transport SL').check();
    await this.pages.transporterSelection.saveAndContinue.click();
    await this.pages.overview.heading.waitFor();
  }

  async answerContact(): Promise<void> {
    await this.pages.overview.task('Contact address').click();
    await this.pages.contactAddress.address('Animal and Plant Health Agency').check();
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
