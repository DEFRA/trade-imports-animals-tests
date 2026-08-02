import type { PlantProductsPageObjects } from '@page-objects';

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
}
