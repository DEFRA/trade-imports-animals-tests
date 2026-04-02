import { commodityCodes, type CommodityCode } from '@domain/types/commodity-codes';
import { commoditySpecies, type CommoditySpecies } from '@domain/types/commodity-species';
import { commodityTypes, type CommodityType } from '@domain/types/commodity-types';
import { countryCodes, type CountryCode } from '@domain/types/country-codes';
import type { PageObjects } from '@page-objects';

type JourneyOptions = {
  countryCode?: CountryCode;
  commodityCode?: CommodityCode;
  commodityType?: CommodityType;
  species?: CommoditySpecies;
};

const defaults: Required<JourneyOptions> = {
  countryCode: countryCodes.eu.france,
  commodityCode: commodityCodes.dog,
  commodityType: commodityTypes.domestic,
  species: commoditySpecies.bisonBison,
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
    const { countryCode } = { ...defaults, ...options };
    await this.toOriginOfImport();
    await this.pages.originOfImport.dropdownCountry.selectOption(countryCode);
    await this.pages.originOfImport.btnSaveAndContinue.click();
  }

  async toSpeciesSelection(options: JourneyOptions = {}): Promise<void> {
    const { commodityCode } = { ...defaults, ...options };
    await this.toCommoditySelection(options);
    await this.pages.commoditySelection.dropdownCommodity.selectOption(commodityCode);
    await this.pages.commoditySelection.btnSaveAndContinue.click();
  }

  async toImportReason(options: JourneyOptions = {}): Promise<void> {
    const { commodityType, species } = { ...defaults, ...options };
    await this.toSpeciesSelection(options);
    await this.pages.speciesSelection.dropdownCommodityType.selectOption(commodityType);
    await this.pages.speciesSelection.checkboxSpecies(species).check();
    await this.pages.speciesSelection.btnSaveAndContinue.click();
  }

  async toAdminDashboard(): Promise<void> {
    await this.pages.adminDashboard.open();
  }

  async toAdminNotifications(): Promise<void> {
    await this.toAdminDashboard();
    await this.pages.adminDashboard.btnNotifications.click();
  }
}
