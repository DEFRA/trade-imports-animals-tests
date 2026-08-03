import type { PlantProductsPageObjects } from '@page-objects';
import type { CommodityBulkDetails } from '@page-objects/plant-products/commodity-bulk-details-page';
import type { VarietyTarget } from '@page-objects/plant-products/variety-of-genus-and-species-page';

export type PlantProductsJourneyContext = {
  journeyId?: string;
  referenceNumber?: string;
};

export type PlantOriginOptions = {
  countryOfOrigin?: string;
  countryOfConsignment?: string;
  internalReference?: string;
};

export type PlantPurposeOptions = {
  reason?: string;
};

export type PlantVarietyOptions = {
  variety: string;
  varietyClass: 'CLASS_I' | 'CLASS_II' | 'EXTRA_CLASS';
};

export type PlantSpeciesOptions = {
  eppoCode: string;
  genusAndSpecies: string;
  varieties?: PlantVarietyOptions[];
};

export type PlantCommodityLineOptions = {
  commodityCode: string;
  commodityDescription: string;
  species: PlantSpeciesOptions[];
  details?: CommodityBulkDetails;
};

export type PlantCommoditiesOptions = {
  lines: PlantCommodityLineOptions[];
  returnAtSummary?: boolean;
};

export type PlantAdditionalDetailsOptions = {
  totalGrossWeight: string;
  grossVolume?: string;
  grossVolumeUnit?: 'LITRES' | 'METRES_CUBED';
};

const DEFAULT_ORIGIN: Required<PlantOriginOptions> = {
  countryOfOrigin: 'France',
  countryOfConsignment: 'France',
  internalReference: '',
};

export class PlantProductsJourney {
  constructor(
    private readonly pages: PlantProductsPageObjects,
    private readonly context: PlantProductsJourneyContext,
  ) {}

  async toNotificationDashboard(): Promise<void> {
    await this.pages.plantNotificationDashboard.open();
    await this.pages.plantNotificationDashboard.heading.waitFor();
  }

  async startNotification(): Promise<string> {
    await this.toNotificationDashboard();
    await this.pages.plantNotificationDashboard.createNewNotification.click();
    await this.pages.importType.heading.waitFor();
    const journeyId = this.pages.importType.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;

    await this.pages.importType.plants.check();
    await this.pages.importType.continueButton.click();
    await this.pages.countryOfOrigin.heading.waitFor();
    await this.fillCountryOfOrigin(DEFAULT_ORIGIN);
    await this.saveCountryOfOrigin();
    await this.pages.originOfImport.heading.waitFor();
    await this.fillOriginOfImport(DEFAULT_ORIGIN);
    await this.saveOriginOfImport();
    await this.pages.hub.heading.waitFor();
    return journeyId;
  }

  async fillCountryOfOrigin(options: PlantOriginOptions = {}): Promise<void> {
    await this.pages.countryOfOrigin.selectCountry(options.countryOfOrigin ?? DEFAULT_ORIGIN.countryOfOrigin);
  }

  async saveCountryOfOrigin(): Promise<void> {
    await this.pages.countryOfOrigin.saveAndContinue.click();
  }

  async fillOriginOfImport(options: PlantOriginOptions = {}): Promise<void> {
    await this.pages.originOfImport.selectCountry(options.countryOfConsignment ?? DEFAULT_ORIGIN.countryOfConsignment);
    if (options.internalReference) {
      await this.pages.originOfImport.internalReference.fill(options.internalReference);
    }
  }

  async saveOriginOfImport(): Promise<void> {
    await this.pages.originOfImport.saveAndContinue.click();
  }

  async answerOrigin(options: PlantOriginOptions = {}): Promise<void> {
    await this.pages.hub.task('Origin of the import').click();
    await this.pages.countryOfOrigin.heading.waitFor();
    await this.fillCountryOfOrigin(options);
    await this.saveCountryOfOrigin();
    await this.pages.originOfImport.heading.waitFor();
    await this.fillOriginOfImport(options);
    await this.saveOriginOfImport();
    await this.pages.hub.heading.waitFor();
  }

  async fillPurpose(options: PlantPurposeOptions = {}): Promise<void> {
    await this.pages.aboutTheConsignment.reason(options.reason ?? 'Internal market').check();
  }

  async savePurpose(): Promise<void> {
    await this.pages.aboutTheConsignment.saveAndContinue.click();
  }

  async answerPurpose(options: PlantPurposeOptions = {}): Promise<void> {
    await this.pages.hub.task('Purpose').click();
    await this.pages.aboutTheConsignment.heading.waitFor();
    await this.fillPurpose(options);
    await this.savePurpose();
    await this.pages.hub.heading.waitFor();
  }

  private varietyTarget(lineIndex: number, speciesIndex: number, species: PlantSpeciesOptions): VarietyTarget {
    return {
      lineIndex,
      speciesIndex,
      eppoCode: species.eppoCode,
      genusAndSpecies: species.genusAndSpecies,
    };
  }

  private async addVarieties(lineIndex: number, line: PlantCommodityLineOptions): Promise<void> {
    const varieties = line.species.flatMap((species, speciesIndex) =>
      (species.varieties ?? []).map((variety) => ({
        target: this.varietyTarget(lineIndex, speciesIndex, species),
        variety,
      })),
    );
    if (varieties.length === 0) return;

    await this.pages.varietyOfGenusAndSpecies.heading.waitFor();
    for (const { target, variety } of varieties) {
      await this.pages.varietyOfGenusAndSpecies.variety(target).selectOption(variety.variety);
      await this.pages.varietyOfGenusAndSpecies.varietyClass(target).selectOption(variety.varietyClass);
      await this.pages.varietyOfGenusAndSpecies.addAnother(target).click();
    }
    await this.pages.varietyOfGenusAndSpecies.saveAndContinue.click();
  }

  private async addCommodityLine(lineIndex: number, line: PlantCommodityLineOptions): Promise<void> {
    if (lineIndex > 0) {
      await this.pages.commoditySummary.addAnotherCommodity.click();
    }
    await this.pages.commoditySearch.heading.waitFor();
    await this.pages.commoditySearch.search(line.commodityCode);
    await this.pages.commodityBasicDescription.heading.waitFor();
    for (const species of line.species) {
      await this.pages.commodityBasicDescription.addSpecies(line.commodityCode, species.genusAndSpecies).click();
    }
    await this.pages.commodityBasicDescription.saveAndContinue.click();
    await this.addVarieties(lineIndex, line);
    await this.pages.commoditySummary.heading.waitFor();
  }

  async answerCommodities(options: PlantCommoditiesOptions): Promise<void> {
    if (options.lines.length === 0) throw new Error('answerCommodities requires at least one commodity line');

    await this.pages.hub.task('Commodity').click();
    await this.pages.commodityInputMethod.heading.waitFor();
    await this.pages.commodityInputMethod.method('Manual entry').check();
    await this.pages.commodityInputMethod.saveAndContinue.click();

    for (const [lineIndex, line] of options.lines.entries()) {
      await this.addCommodityLine(lineIndex, line);
    }
    if (options.returnAtSummary) return;

    await this.pages.commoditySummary.saveAndContinue.click();
    await this.pages.commodityBulkDetails.heading.waitFor();
    for (const line of options.lines) {
      if (!line.details) throw new Error(`Commodity ${line.commodityCode} is missing bulk details`);
      await this.pages.commodityBulkDetails.fill(line.commodityCode, line.commodityDescription, line.details);
    }
    await this.pages.commodityBulkDetails.saveAndContinue.click();
    await this.pages.hub.heading.waitFor();
  }

  async removeSpecies(lineIndex: number, speciesIndex: number, genusAndSpecies: string, commodityCode: string): Promise<void> {
    await this.pages.commoditySummary.removeSpecies(lineIndex, speciesIndex, genusAndSpecies, commodityCode).click();
    await this.pages.commoditySummary.heading.waitFor();
  }

  async removeVariety(
    lineIndex: number,
    speciesIndex: number,
    species: PlantSpeciesOptions,
    varietyLabel: string,
    classLabel: string,
  ): Promise<void> {
    await this.pages.commoditySummary.addSpeciesTo(lineIndex).click();
    await this.pages.commodityBasicDescription.heading.waitFor();
    await this.pages.commodityBasicDescription.saveAndContinue.click();
    const target = this.varietyTarget(lineIndex, speciesIndex, species);
    await this.pages.varietyOfGenusAndSpecies.heading.waitFor();
    await this.pages.varietyOfGenusAndSpecies.remove(target, varietyLabel, classLabel).click();
    await this.pages.varietyOfGenusAndSpecies.saveAndContinue.click();
    await this.pages.commoditySummary.heading.waitFor();
  }

  async answerAdditionalDetails(options: PlantAdditionalDetailsOptions): Promise<void> {
    await this.pages.hub.task('Additional details').click();
    await this.pages.commodityAdditionalDetails.heading.waitFor();
    await this.pages.commodityAdditionalDetails.totalGrossWeight.fill(options.totalGrossWeight);
    if (options.grossVolume !== undefined) {
      await this.pages.commodityAdditionalDetails.grossVolume.fill(options.grossVolume);
    }
    if (options.grossVolumeUnit !== undefined) {
      await this.pages.commodityAdditionalDetails.grossVolumeUnit.selectOption(options.grossVolumeUnit);
    }
    await this.pages.commodityAdditionalDetails.saveAndContinue.click();
    await this.pages.hub.heading.waitFor();
  }
}
