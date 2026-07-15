import { importReasons } from '@domain/constants/import-reasons';
import { certificationPurposes } from '@domain/constants/certification-purposes';
import { requiresTransitedCountries, type MeansOfTransport } from '@domain/constants/means-of-transport';
import type { AccompanyingDocument } from '@domain/types/accompanying-document';
import type { PageObjects } from '@page-objects';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import {
  CONSIGNEE_NAME,
  CONSIGNOR_NAME,
  CONTACT_ADDRESS_NAME,
  CPH_NUMBER,
  DESTINATION_NAME,
  EAR_TAG_PREFIX,
  IMPORTER_NAME,
  PASSPORT_PREFIX,
  PLACE_OF_ORIGIN_NAME,
  TRANSIT_COUNTRY_NAME,
  TRANSPORTER_NAME,
  defaultJourneyOptions,
  type JourneyOptions,
} from '@domain/constants/journey-options';

export type JourneyContext = {
  notificationId?: string;
  declarationDate?: string;
  meansOfTransport?: MeansOfTransport;
};

/**
 * Walks the notification wizard, one method group per page in journey order:
 *
 * - to<Page>()   — navigate from the dashboard to that page, unfilled. Each call
 *                  starts a fresh notification, so call at most one per test.
 * - fill<Page>() — that page's form interactions only, without saving.
 * - save<Page>() — click the page's Save/continue control and wait for the next
 *                  page's heading.
 * - open<SubPage>() — hub sub-pages only (addresses, transporter): open the
 *                  sub-page from its hub; its save returns to the hub.
 *
 * The to* helpers compose fill + save down the chain. Tests that need to act on
 * a page before it is saved (e.g. accessibility scans) call fill/save directly.
 */
export class Journey {
  constructor(
    private readonly pages: PageObjects,
    private readonly journeyContext?: JourneyContext,
  ) {}

  async toSignIn(open: (attemptSignIn: boolean) => Promise<void>): Promise<void> {
    await open(false);
  }

  async toNotificationDashboard(): Promise<void> {
    await this.pages.notificationDashboard.open();
  }

  async toOriginOfImport(): Promise<void> {
    await this.toNotificationDashboard();
    await this.pages.notificationDashboard.btnCreateNewNotification.click();
    await this.pages.originOfImport.heading.waitFor();
  }

  async fillOriginOfImport(options: JourneyOptions = {}): Promise<void> {
    const { countryCode, requiresRegionCode, internalReference } = { ...defaultJourneyOptions, ...options };
    await this.pages.originOfImport.dropdownCountry.selectOption(countryCode);
    if (requiresRegionCode !== undefined) {
      await this.pages.originOfImport.radioRequiresOriginCode(requiresRegionCode).click();
    }
    if (internalReference !== undefined) {
      await this.pages.originOfImport.inputInternalReferenceNumber.fill(internalReference);
    }
  }

  async saveOriginOfImport(): Promise<void> {
    await this.pages.originOfImport.btnSaveAndContinue.click();
    await this.pages.commoditySelection.heading.waitFor();
    if (this.journeyContext) {
      this.journeyContext.notificationId = await this.pages.commodityDetails.notificationId.textContent();
    }
  }

  async toCommoditySelection(options: JourneyOptions = {}): Promise<void> {
    await this.toOriginOfImport();
    await this.fillOriginOfImport(options);
    await this.saveOriginOfImport();
  }

  async fillCommoditySelection(options: JourneyOptions = {}): Promise<void> {
    const { commodityCode } = { ...defaultJourneyOptions, ...options };
    await this.pages.commoditySelection.dropdownCommodity.selectOption(commodityCode);
  }

  async saveCommoditySelection(): Promise<void> {
    await this.pages.commoditySelection.btnSaveAndContinue.click();
    await this.pages.speciesSelection.heading.waitFor();
  }

  async toSpeciesSelection(options: JourneyOptions = {}): Promise<void> {
    await this.toCommoditySelection(options);
    await this.fillCommoditySelection(options);
    await this.saveCommoditySelection();
  }

  async fillSpeciesSelection(options: JourneyOptions = {}): Promise<void> {
    const { commodityType, species } = { ...defaultJourneyOptions, ...options };
    await this.pages.speciesSelection.dropdownCommodityType.selectOption(commodityType);
    const selectedSpecies = Array.isArray(species) ? species : [species];
    for (const speciesOption of selectedSpecies) {
      await this.pages.speciesSelection.checkboxSpecies(speciesOption).check();
    }
  }

  async saveSpeciesSelection(): Promise<void> {
    await this.pages.speciesSelection.btnSaveAndContinue.click();
    await this.pages.importReason.heading.waitFor();
  }

  async toImportReason(options: JourneyOptions = {}): Promise<void> {
    await this.toSpeciesSelection(options);
    await this.fillSpeciesSelection(options);
    await this.saveSpeciesSelection();
  }

  async fillImportReason(options: JourneyOptions = {}): Promise<void> {
    const { importReason } = { ...defaultJourneyOptions, ...options };
    if (importReason === importReasons.internalMarket) {
      await this.pages.importReason.radioInternalMarket.click();
    } else if (importReason === importReasons.reEntry) {
      await this.pages.importReason.radioReEntry.click();
    }
  }

  async saveImportReason(): Promise<void> {
    await this.pages.importReason.btnSaveAndContinue.click();
    await this.pages.commodityDetails.heading.waitFor();
  }

  async toCommodityDetails(options: JourneyOptions = {}): Promise<void> {
    await this.toImportReason(options);
    await this.fillImportReason(options);
    await this.saveImportReason();
  }

  async fillCommodityDetails(options: JourneyOptions = {}): Promise<void> {
    const { commodityType, species, noOfAnimals, noOfPackages } = { ...defaultJourneyOptions, ...options };
    const speciesList = Array.isArray(species) ? species : [species];
    const animalList = Array.isArray(noOfAnimals) ? noOfAnimals : [noOfAnimals];
    const packageList = Array.isArray(noOfPackages) ? noOfPackages : [noOfPackages];

    if (animalList.length !== speciesList.length || packageList.length !== speciesList.length) {
      throw new Error(
        `Mismatched quantities: species=${speciesList.length}, noOfAnimals=${animalList.length}, noOfPackages=${packageList.length}`,
      );
    }

    for (let i = 0; i < speciesList.length; i += 1) {
      const label = `${speciesList[i]}, ${commodityType}`;
      await this.pages.commodityDetails.inputNoOfAnimals(label).fill(animalList[i].toString());
      await this.pages.commodityDetails.inputNoOfPackages(label).fill(packageList[i].toString());
    }
  }

  async saveCommodityDetails(): Promise<void> {
    await this.pages.commodityDetails.btnSaveAndContinue.click();
    await this.pages.animalIdentification.heading.waitFor();
  }

  async toAnimalIdentification(options: JourneyOptions = {}): Promise<void> {
    await this.toCommodityDetails(options);
    await this.fillCommodityDetails(options);
    await this.saveCommodityDetails();
  }

  async fillAnimalIdentification(options: JourneyOptions = {}): Promise<void> {
    const { species } = { ...defaultJourneyOptions, ...options };
    const speciesList = Array.isArray(species) ? species : [species];

    // Currently limited to one animal identifier per species
    for (let i = 0; i < speciesList.length; i += 1) {
      const digits = String(i + 1).padStart(12, '0');
      await this.pages.animalIdentification.inputEarTag(i).fill(`${EAR_TAG_PREFIX}${digits}`);
      await this.pages.animalIdentification.inputPassport(i).fill(`${PASSPORT_PREFIX}${digits.slice(-6)}`);
    }
  }

  async saveAnimalIdentification(): Promise<void> {
    await this.pages.animalIdentification.btnSaveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor();
  }

  async toAdditionalDetails(options: JourneyOptions = {}): Promise<void> {
    await this.toAnimalIdentification(options);
    await this.fillAnimalIdentification(options);
    await this.saveAnimalIdentification();
  }

  async fillAdditionalDetails(options: JourneyOptions = {}): Promise<void> {
    const { certificationPurpose, unweanedAnimals } = { ...defaultJourneyOptions, ...options };
    if (certificationPurpose === certificationPurposes.approvedBodies) {
      await this.pages.additionalDetails.radioApprovedBodies.click();
    } else if (certificationPurpose === certificationPurposes.breedingAndOrProduction) {
      await this.pages.additionalDetails.radioBreedingAndOrProduction.click();
    } else if (certificationPurpose === certificationPurposes.slaughter) {
      await this.pages.additionalDetails.radioSlaughter.click();
    }

    if (unweanedAnimals !== undefined) {
      await this.pages.additionalDetails.radioContainsUnweanedAnimals(unweanedAnimals).click();
    }
  }

  async saveAdditionalDetails(): Promise<void> {
    await this.pages.additionalDetails.btnSaveAndContinue.click();
    await this.pages.accompanyingDocuments.heading.waitFor();
  }

  async toAccompanyingDocuments(options: JourneyOptions = {}): Promise<void> {
    await this.toAdditionalDetails(options);
    await this.fillAdditionalDetails(options);
    await this.saveAdditionalDetails();
  }

  async fillAccompanyingDocuments(options: JourneyOptions = {}): Promise<void> {
    const { accompanyingDocuments } = { ...defaultJourneyOptions, ...options };
    for (const document of this.toDocumentList(accompanyingDocuments)) {
      await this.pages.accompanyingDocuments.fillTextFields({
        documentType: document.documentType,
        documentReference: document.documentReference,
        issueDate: document.issueDate,
      });
      await this.pages.accompanyingDocuments.inputFileUpload.setInputFiles(document.filePath);
      await this.pages.accompanyingDocuments.btnAddAttachment.click();
    }
  }

  async saveAccompanyingDocuments(options: JourneyOptions = {}): Promise<void> {
    const { accompanyingDocuments } = { ...defaultJourneyOptions, ...options };
    if (this.toDocumentList(accompanyingDocuments).length === 0) {
      await this.pages.accompanyingDocuments.btnContinueWithoutDocuments.click();
    } else {
      await this.pages.accompanyingDocuments.btnSaveAndContinue.click({ timeout: fileUploadTimeouts.virusScanComplete });
    }
    await this.pages.addresses.heading.waitFor();
  }

  private toDocumentList(accompanyingDocuments: Required<JourneyOptions>['accompanyingDocuments']): AccompanyingDocument[] {
    if (!accompanyingDocuments) return [];
    return Array.isArray(accompanyingDocuments) ? accompanyingDocuments : [accompanyingDocuments];
  }

  async toAddresses(options: JourneyOptions = {}): Promise<void> {
    await this.toAccompanyingDocuments(options);
    await this.fillAccompanyingDocuments(options);
    await this.saveAccompanyingDocuments(options);
  }

  async openPlaceOfOrigin(): Promise<void> {
    await this.pages.addresses.linkAddPlaceOfOrigin.click();
    await this.pages.placeOfOriginSelection.heading.waitFor();
  }

  async fillPlaceOfOrigin(): Promise<void> {
    await this.pages.placeOfOriginSelection.radioPlaceOfOrigin(PLACE_OF_ORIGIN_NAME).click();
  }

  async savePlaceOfOrigin(): Promise<void> {
    await this.pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async openConsignor(): Promise<void> {
    await this.pages.addresses.linkAddConsignorOrExporter.click();
    await this.pages.consignorSelection.heading.waitFor();
  }

  async fillConsignor(): Promise<void> {
    await this.pages.consignorSelection.radioConsignorOrExporter(CONSIGNOR_NAME).click();
  }

  async saveConsignor(): Promise<void> {
    await this.pages.consignorSelection.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async openConsignee(): Promise<void> {
    await this.pages.addresses.linkAddConsignee.click();
    await this.pages.consigneeSelection.heading.waitFor();
  }

  async fillConsignee(): Promise<void> {
    await this.pages.consigneeSelection.radioConsignee(CONSIGNEE_NAME).click();
  }

  async saveConsignee(): Promise<void> {
    await this.pages.consigneeSelection.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async openImporter(): Promise<void> {
    await this.pages.addresses.linkAddImporter.click();
    await this.pages.importerSelection.heading.waitFor();
  }

  async fillImporter(): Promise<void> {
    await this.pages.importerSelection.radioImporter(IMPORTER_NAME).click();
  }

  async saveImporter(): Promise<void> {
    await this.pages.importerSelection.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async openPlaceOfDestination(): Promise<void> {
    await this.pages.addresses.linkAddPlaceOfDestination.click();
    await this.pages.destinationSelection.heading.waitFor();
  }

  async fillPlaceOfDestination(): Promise<void> {
    await this.pages.destinationSelection.radioPlaceOfDestination(DESTINATION_NAME).click();
  }

  async savePlaceOfDestination(): Promise<void> {
    await this.pages.destinationSelection.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async toCphNumber(options: JourneyOptions = {}): Promise<void> {
    await this.toAddresses(options);
    await this.openCphNumber();
  }

  async openCphNumber(): Promise<void> {
    await this.pages.addresses.linkAddCphNumber.click();
    await this.pages.cphNumber.heading.waitFor();
  }

  async fillCphNumber(): Promise<void> {
    await this.pages.cphNumber.inputCphNumber.fill(CPH_NUMBER);
  }

  async saveCphNumber(): Promise<void> {
    await this.pages.cphNumber.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
  }

  async saveAddresses(): Promise<void> {
    await this.pages.addresses.btnSaveAndContinue.click();
    await this.pages.entryPoint.heading.waitFor();
  }

  async toEntryPoint(options: JourneyOptions = {}): Promise<void> {
    await this.toAddresses(options);
    await this.openPlaceOfOrigin();
    await this.fillPlaceOfOrigin();
    await this.savePlaceOfOrigin();
    await this.openConsignor();
    await this.fillConsignor();
    await this.saveConsignor();
    await this.openConsignee();
    await this.fillConsignee();
    await this.saveConsignee();
    await this.openImporter();
    await this.fillImporter();
    await this.saveImporter();
    await this.openPlaceOfDestination();
    await this.fillPlaceOfDestination();
    await this.savePlaceOfDestination();
    await this.openCphNumber();
    await this.fillCphNumber();
    await this.saveCphNumber();
    await this.saveAddresses();
  }

  async fillEntryPoint(options: JourneyOptions = {}): Promise<void> {
    const { pointOfEntry, arrivalDate, meansOfTransport, transportIdentification, transportDocumentReference } = {
      ...defaultJourneyOptions,
      ...options,
    };
    await this.pages.entryPoint.dropdownPortOfEntry.selectOption(pointOfEntry.code);
    await this.pages.entryPoint.fillArrivalDate(arrivalDate);
    await this.pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.code);
    if (transportIdentification !== undefined) {
      await this.pages.entryPoint.inputTransportIdentification.fill(transportIdentification);
    }
    if (transportDocumentReference !== undefined) {
      await this.pages.entryPoint.inputTransportDocumentReference.fill(transportDocumentReference);
    }
    if (this.journeyContext) {
      this.journeyContext.meansOfTransport = meansOfTransport;
    }
  }

  async saveEntryPoint(): Promise<void> {
    const selectedMeansOfTransport = this.journeyContext?.meansOfTransport ?? defaultJourneyOptions.meansOfTransport;
    await this.pages.entryPoint.btnSaveAndContinue.click();
    if (requiresTransitedCountries(selectedMeansOfTransport)) {
      await this.pages.transitedCountries.heading.waitFor();
    } else {
      await this.pages.transporter.heading.waitFor();
    }
  }

  async toTransitedCountries(options: JourneyOptions = {}): Promise<void> {
    const mergedOptions = { ...defaultJourneyOptions, ...options };
    await this.toEntryPoint(mergedOptions);
    await this.fillEntryPoint(mergedOptions);
    await this.saveEntryPoint();
  }

  async addTransitedCountry(countryName: string): Promise<void> {
    await this.pages.transitedCountries.checkboxForCountry(countryName).check();
    await this.pages.transitedCountries.btnAddSelectedCountries.click();
    await this.pages.transitedCountries.selectedCountry(countryName).waitFor();
  }

  async saveTransitedCountries(): Promise<void> {
    await this.pages.transitedCountries.btnSaveAndContinue.click();
    await this.pages.transporter.heading.waitFor();
  }

  async toTransporter(options: JourneyOptions = {}): Promise<void> {
    const mergedOptions = { ...defaultJourneyOptions, ...options };
    await this.toTransitedCountries(mergedOptions);
    if (requiresTransitedCountries(mergedOptions.meansOfTransport)) {
      await this.addTransitedCountry(TRANSIT_COUNTRY_NAME);
      await this.saveTransitedCountries();
    }
  }

  async openTransporterSelection(): Promise<void> {
    await this.pages.transporter.linkAddTransporter.click();
    await this.pages.transporterSelection.heading.waitFor();
  }

  async selectTransporter(): Promise<void> {
    await this.pages.transporterSelection.linkSelectTransporterByName(TRANSPORTER_NAME).click();
    await this.pages.transporter.heading.waitFor();
  }

  async saveTransporter(): Promise<void> {
    await this.pages.transporter.btnSaveAndContinue.click();
    await this.pages.contactAddress.heading.waitFor();
  }

  async toContactAddress(options: JourneyOptions = {}): Promise<void> {
    await this.toTransporter(options);
    await this.openTransporterSelection();
    await this.selectTransporter();
    await this.saveTransporter();
  }

  async fillContactAddress(): Promise<void> {
    await this.pages.contactAddress.radioAddress(CONTACT_ADDRESS_NAME).click();
  }

  async saveContactAddress(): Promise<void> {
    await this.pages.contactAddress.btnSaveAndContinue.click();
    await this.pages.notificationView.heading.waitFor();
  }

  async toReview(options: JourneyOptions = {}): Promise<void> {
    await this.toContactAddress(options);
    await this.fillContactAddress();
    await this.saveContactAddress();
  }

  async confirmReview(): Promise<void> {
    await this.pages.notificationView.btnConfirmAndSubmit.click();
    await this.pages.declaration.heading.waitFor();
  }

  async toDeclaration(options: JourneyOptions = {}): Promise<void> {
    await this.toReview(options);
    await this.confirmReview();
  }

  async fillDeclaration(): Promise<void> {
    if (this.journeyContext) {
      const declarationDate = await this.pages.declaration.dateOfDeclaration.textContent();
      this.journeyContext.declarationDate = declarationDate?.replace('Date of declaration: ', '');
    }
    await this.pages.declaration.checkboxDeclaration.click();
  }

  async submitDeclaration(): Promise<void> {
    // TODO: replace with submissionConfirmation.heading.waitFor() once confirmation page exists
    await Promise.all([this.pages.page.waitForNavigation({ waitUntil: 'commit' }), this.pages.declaration.btnSubmitNotification.click()]);
  }

  async submitNotification(options: JourneyOptions = {}): Promise<void> {
    await this.toDeclaration(options);
    await this.fillDeclaration();
    await this.submitDeclaration();
  }
}
