import { type CommodityCode, commodityCodes } from '@domain/constants/commodity-codes';
import { commoditySpecies, type CommoditySpecies } from '@domain/constants/commodity-species';
import { type CommodityType, commodityTypes } from '@domain/constants/commodity-types';
import { type CountryCode, countryCodes } from '@domain/constants/country-codes';
import { type ImportReason, importReasons } from '@domain/constants/import-reasons';
import { type CertificationPurpose, certificationPurposes } from '@domain/constants/certification-purposes';
import type { YesNoValue } from '@domain/constants/yes-no-values';
import { pointOfEntries, type PointOfEntry } from '@domain/constants/point-of-entries';
import type { AccompanyingDocument } from '@domain/types/accompanying-document';
import type { DateInput } from '@domain/types/date-time-input';
import type { PageObjects } from '@page-objects';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { getRelativeDateInput } from '@utils/date-utils';

export type JourneyOptions = {
  countryCode?: CountryCode;
  requiresRegionCode?: YesNoValue;
  internalReference?: string;
  commodityCode?: CommodityCode;
  commodityType?: CommodityType;
  species?: CommoditySpecies | CommoditySpecies[];
  importReason?: ImportReason;
  noOfAnimals?: number | number[];
  noOfPackages?: number | number[];
  certificationPurpose?: CertificationPurpose;
  unweanedAnimals?: YesNoValue;
  accompanyingDocuments?: AccompanyingDocument | AccompanyingDocument[];
  pointOfEntry?: PointOfEntry;
  arrivalDate?: DateInput;
};

export type JourneyContext = {
  notificationId?: string;
  declarationDate?: string;
};

export const defaultJourneyOptions: Required<JourneyOptions> = {
  countryCode: countryCodes.eu.france,
  requiresRegionCode: undefined,
  internalReference: undefined,
  commodityCode: commodityCodes.dog,
  commodityType: commodityTypes.domestic,
  species: [commoditySpecies.bisonBison, commoditySpecies.bosSpp],
  importReason: importReasons.internalMarket,
  noOfAnimals: [5, 19],
  noOfPackages: [13, 21],
  certificationPurpose: certificationPurposes.approvedBodies,
  unweanedAnimals: undefined,
  accompanyingDocuments: undefined,
  pointOfEntry: pointOfEntries.aberdeen,
  arrivalDate: getRelativeDateInput({ dayOffset: 14 }),
};

export const EAR_TAG_PREFIX = 'FR';
export const PASSPORT_PREFIX = 'FR-BOV-2024-';
export const PLACE_OF_ORIGIN_NAME = 'Origin Farm';
export const CONSIGNOR_NAME = 'Astra Rosales';
export const CONSIGNEE_NAME = 'British Livestock Ltd';
export const IMPORTER_NAME = 'Import Co UK';
export const DESTINATION_NAME = 'Tech Imports Ltd';
export const CPH_NUMBER = '123456789';
export const TRANSPORTER_NAME = 'García Livestock Transport SL';
export const CONTACT_ADDRESS_NAME = 'Animal and Plant Health Agency';

export class Journeys {
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

  async toCommoditySelection(options: JourneyOptions = {}): Promise<void> {
    const { countryCode, requiresRegionCode, internalReference } = { ...defaultJourneyOptions, ...options };
    await this.toOriginOfImport();
    await this.pages.originOfImport.dropdownCountry.selectOption(countryCode);
    if (requiresRegionCode !== undefined) {
      await this.pages.originOfImport.radioRequiresOriginCode(requiresRegionCode).click();
    }
    if (internalReference !== undefined) {
      await this.pages.originOfImport.inputInternalReferenceNumber.fill(internalReference);
    }
    await this.pages.originOfImport.btnSaveAndContinue.click();
    await this.pages.commoditySelection.heading.waitFor();
    if (this.journeyContext) {
      this.journeyContext.notificationId = await this.pages.commodityDetails.notificationId.textContent();
    }
  }

  async toSpeciesSelection(options: JourneyOptions = {}): Promise<void> {
    const { commodityCode } = { ...defaultJourneyOptions, ...options };
    await this.toCommoditySelection(options);
    await this.pages.commoditySelection.dropdownCommodity.selectOption(commodityCode);
    await this.pages.commoditySelection.btnSaveAndContinue.click();
    await this.pages.speciesSelection.heading.waitFor();
  }

  async toImportReason(options: JourneyOptions = {}): Promise<void> {
    const { commodityType, species } = { ...defaultJourneyOptions, ...options };
    await this.toSpeciesSelection(options);
    await this.pages.speciesSelection.dropdownCommodityType.selectOption(commodityType);
    const selectedSpecies = Array.isArray(species) ? species : [species];
    for (const speciesOption of selectedSpecies) {
      await this.pages.speciesSelection.checkboxSpecies(speciesOption).check();
    }
    await this.pages.speciesSelection.btnSaveAndContinue.click();
    await this.pages.importReason.heading.waitFor();
  }

  async toCommodityDetails(options: JourneyOptions = {}): Promise<void> {
    const { importReason } = { ...defaultJourneyOptions, ...options };
    await this.toImportReason(options);
    if (importReason === importReasons.internalMarket) {
      await this.pages.importReason.radioInternalMarket.click();
    } else if (importReason === importReasons.reEntry) {
      await this.pages.importReason.radioReEntry.click();
    }
    await this.pages.importReason.btnSaveAndContinue.click();
    await this.pages.commodityDetails.heading.waitFor();
  }

  async toAnimalIdentification(options: JourneyOptions = {}): Promise<void> {
    const { commodityType, species, noOfAnimals, noOfPackages } = { ...defaultJourneyOptions, ...options };
    await this.toCommodityDetails(options);
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
    await this.pages.commodityDetails.btnSaveAndContinue.click();
    await this.pages.animalIdentification.heading.waitFor();
  }

  async toAdditionalDetails(options: JourneyOptions = {}): Promise<void> {
    const { species } = { ...defaultJourneyOptions, ...options };
    await this.toAnimalIdentification(options);
    const speciesList = Array.isArray(species) ? species : [species];

    // Currently limited to one animal identifier per species
    for (let i = 0; i < speciesList.length; i += 1) {
      const digits = String(i + 1).padStart(12, '0');
      await this.pages.animalIdentification.inputEarTag(i).fill(`${EAR_TAG_PREFIX}${digits}`);
      await this.pages.animalIdentification.inputPassport(i).fill(`${PASSPORT_PREFIX}${digits.slice(-6)}`);
    }
    await this.pages.animalIdentification.btnSaveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor();
  }

  async toAccompanyingDocuments(options: JourneyOptions = {}): Promise<void> {
    const { certificationPurpose, unweanedAnimals } = { ...defaultJourneyOptions, ...options };
    await this.toAdditionalDetails(options);
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
    await this.pages.additionalDetails.btnSaveAndContinue.click();
    await this.pages.accompanyingDocuments.heading.waitFor();
  }

  async toAddresses(options: JourneyOptions = {}): Promise<void> {
    const { accompanyingDocuments } = { ...defaultJourneyOptions, ...options };
    await this.toAccompanyingDocuments(options);

    const documents = accompanyingDocuments ? (Array.isArray(accompanyingDocuments) ? accompanyingDocuments : [accompanyingDocuments]) : [];

    if (documents.length === 0) {
      await this.pages.accompanyingDocuments.btnContinueWithoutDocuments.click();
      await this.pages.addresses.heading.waitFor();
      return;
    }

    for (const document of documents) {
      await this.pages.accompanyingDocuments.fillTextFields({
        documentType: document.documentType,
        documentReference: document.documentReference,
        issueDate: document.issueDate,
      });
      await this.pages.accompanyingDocuments.inputFileUpload.setInputFiles(document.filePath);
      await this.pages.accompanyingDocuments.btnAddAttachment.click();
    }

    await this.pages.accompanyingDocuments.btnSaveAndContinue.click({ timeout: fileUploadTimeouts.virusScanComplete });
    await this.pages.addresses.heading.waitFor();
  }

  async toCphNumber(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toAddresses(options);
    await this.pages.addresses.linkAddCphNumber.click();
    await this.pages.cphNumber.heading.waitFor();
  }

  async toEntryPoint(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toAddresses(options);
    await this.pages.addresses.linkAddPlaceOfOrigin.click();
    await this.pages.placeOfOriginSelection.radioPlaceOfOrigin(PLACE_OF_ORIGIN_NAME).click();
    await this.pages.placeOfOriginSelection.btnSaveAndContinue.click();
    await this.pages.addresses.linkAddConsignorOrExporter.click();
    await this.pages.consignorSelection.linkSelectConsignorByName(CONSIGNOR_NAME).click();
    await this.pages.addresses.linkAddConsignee.click();
    await this.pages.consigneeSelection.radioConsignee(CONSIGNEE_NAME).click();
    await this.pages.consigneeSelection.btnSaveAndContinue.click();
    await this.pages.addresses.linkAddImporter.click();
    await this.pages.importerSelection.radioImporter(IMPORTER_NAME).click();
    await this.pages.importerSelection.btnSaveAndContinue.click();
    await this.pages.addresses.linkAddPlaceOfDestination.click();
    await this.pages.destinationSelection.linkSelectDestinationByName(DESTINATION_NAME).click();
    await this.pages.addresses.linkAddCphNumber.click();
    await this.pages.cphNumber.inputCphNumber.fill(CPH_NUMBER);
    await this.pages.cphNumber.btnSaveAndContinue.click();
    await this.pages.addresses.heading.waitFor();
    await this.pages.addresses.btnSaveAndContinue.click();
    await this.pages.entryPoint.heading.waitFor();
  }

  async toTransporter(options: JourneyOptions = {}): Promise<void> {
    const { pointOfEntry, arrivalDate } = { ...defaultJourneyOptions, ...options };
    await this.toEntryPoint(options);
    await this.pages.entryPoint.dropdownPortOfEntry.selectOption(pointOfEntry);
    await this.pages.entryPoint.fillArrivalDate(arrivalDate);
    await this.pages.entryPoint.btnSaveAndContinue.click();
    await this.pages.transporter.heading.waitFor();
  }

  async toContactAddress(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toTransporter(options);
    await this.pages.transporter.linkAddTransporter.click();
    await this.pages.transporterSelection.linkSelectTransporterByName(TRANSPORTER_NAME).click();
    await this.pages.transporter.btnSaveAndContinue.click();
    await this.pages.contactAddress.heading.waitFor();
  }

  async toReview(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toContactAddress(options);
    await this.pages.contactAddress.radioAddress(CONTACT_ADDRESS_NAME).click();
    await this.pages.contactAddress.btnSaveAndContinue.click();
    await this.pages.notificationView.heading.waitFor();
  }

  async toDeclaration(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toReview(options);
    await this.pages.notificationView.btnConfirmAndSubmit.click();
    await this.pages.declaration.heading.waitFor();
  }

  async toNotificationView(referenceNumber: string): Promise<void> {
    await this.pages.notificationView.open(referenceNumber);
  }

  async submitNotification(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toDeclaration(options);
    if (this.journeyContext) {
      const declarationDate = await this.pages.declaration.dateOfDeclaration.textContent();
      this.journeyContext.declarationDate = declarationDate?.replace('Date of declaration: ', '');
    }
    await this.pages.declaration.checkboxDeclaration.click();
    // TODO: replace with submissionConfirmation.heading.waitFor() once confirmation page exists
    await Promise.all([this.pages.page.waitForNavigation({ waitUntil: 'commit' }), this.pages.declaration.btnSubmitNotification.click()]);
  }
}
