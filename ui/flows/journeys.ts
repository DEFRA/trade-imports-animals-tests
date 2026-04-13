import { commodityCodes, type CommodityCode } from '@domain/types/commodity-codes';
import { commoditySpecies, type CommoditySpecies } from '@domain/types/commodity-species';
import { commodityTypes, type CommodityType } from '@domain/types/commodity-types';
import { countryCodes, type CountryCode } from '@domain/types/country-codes';
import { importReasons, type ImportReason } from '@domain/types/import-reasons';
import type { PageObjects } from '@page-objects';

export type JourneyOptions = {
  countryCode?: CountryCode;
  commodityCode?: CommodityCode;
  commodityType?: CommodityType;
  species?: CommoditySpecies;
  importReason?: ImportReason;
  numberOfAnimals?: number;
  numberOfPackages?: number;
};

export const defaultJourneyOptions: Required<JourneyOptions> = {
  countryCode: countryCodes.eu.france,
  commodityCode: commodityCodes.dog,
  commodityType: commodityTypes.domestic,
  species: commoditySpecies.bisonBison,
  importReason: importReasons.internalMarket,
  numberOfAnimals: 5,
  numberOfPackages: 13,
};

export class Journeys {
  constructor(private readonly pages: PageObjects) {}

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
    const { countryCode } = { ...defaultJourneyOptions, ...options };
    await this.toOriginOfImport();
    await this.pages.originOfImport.dropdownCountry.selectOption(countryCode);
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
    await this.pages.speciesSelection.checkboxSpecies(species).check();
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
  }

  async toAdditionalDetails(options: JourneyOptions = {}): Promise<void> {
    const { numberOfAnimals, numberOfPackages } = { ...defaultJourneyOptions, ...options };
    await this.toCommodityDetails(options);
    await this.pages.commodityDetails.inputNoOfAnimals.fill(numberOfAnimals.toString());
    await this.pages.commodityDetails.inputNoOfPackages.fill(numberOfPackages.toString());
    await this.pages.commodityDetails.btnSaveAndContinue.click();
  }

  async toAdminDashboard(): Promise<void> {
    await this.pages.adminDashboard.open();
  }

  async toAdminNotifications(): Promise<void> {
    await this.toAdminDashboard();
    await this.pages.adminDashboard.btnNotifications.click();
  }
}
