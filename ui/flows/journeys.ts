import { commodityCodes, type CommodityCode } from '@domain/types/commodity-codes';
import { commoditySpecies, type CommoditySpecies } from '@domain/types/commodity-species';
import { commodityTypes, type CommodityType } from '@domain/types/commodity-types';
import { countryCodes, type CountryCode } from '@domain/types/country-codes';
import { importReasons, type ImportReason } from '@domain/types/import-reasons';
import { certificationPurposes, type CertificationPurpose } from '@domain/types/certification-purposes';
import type { YesNoValue } from '@domain/types/yes-no-values';
import type { PageObjects } from '@page-objects';

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
};

export type JourneyContext = {
  notificationId?: string;
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
};

export const EAR_TAG_PREFIX = 'FR';
export const PASSPORT_PREFIX = 'FR-BOV-2024-';
export const CPH_NUMBER = '123456789';

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
  }

  async toSpeciesSelection(options: JourneyOptions = {}): Promise<void> {
    const { commodityCode } = { ...defaultJourneyOptions, ...options };
    await this.toCommoditySelection(options);
    await this.pages.commoditySelection.dropdownCommodity.selectOption(commodityCode);
    await this.pages.commoditySelection.btnSaveAndContinue.click();
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
    if (this.journeyContext) {
      this.journeyContext.notificationId = await this.pages.commodityDetails.notificationId.textContent();
    }
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
  }

  async toAddresses(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toAccompanyingDocuments(options);
    // TODO: pending accompanying documents page implementation.
  }

  async toCphNumber(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toAddresses(options);
    await this.pages.addresses.linkAddConsignorOrExporter.click();
    await this.pages.consignorSelection.linkSelectConsignor(0).click();
    // TODO: Pending implementation of place of destination page.
    await this.pages.addresses.btnSaveAndContinue.click();
  }

  async toEntryPoint(options: JourneyOptions = {}): Promise<void> {
    options = { ...defaultJourneyOptions, ...options };
    await this.toCphNumber(options);
    await this.pages.cphNumber.inputCphNumber.fill(CPH_NUMBER);
    await this.pages.cphNumber.btnSaveAndContinue.click();
  }

  async toAdminDashboard(): Promise<void> {
    await this.pages.adminDashboard.open();
  }

  async toAdminNotifications(): Promise<void> {
    await this.toAdminDashboard();
    await this.pages.adminDashboard.btnNotifications.click();
  }
}
