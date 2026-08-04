import type { PlantProductsPageObjects } from '@page-objects';
import { bcps } from '@domain/plant-products/constants/bcps';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { meansOfTransport } from '@domain/plant-products/constants/means-of-transport';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
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

export type PlantContainerOptions = {
  containerNumber: string;
  sealNumber?: string;
  officialSeal?: boolean;
};

export type PlantTransportOptions = {
  borderControlPost: string;
  inspectionPremises?: string;
  meansOfTransport: string;
  transportIdentification: string;
  transportDocumentReference: string;
  arrivalDate: Date;
  arrivalTime: string;
  usesContainers: boolean;
  containers?: PlantContainerOptions[];
};

export type PlantGoodsMovementOptions = {
  commonTransitConvention: 'ADD_MRN_NOW' | 'ADD_MRN_LATER' | 'NO';
  movementReferenceNumber?: string;
  usingGvms: boolean;
};

export type PlantContactOptions = {
  name: string;
  email?: string;
  telephone?: string;
};

export type PlantNominatedContactOptions = PlantContactOptions & {
  isAgent?: boolean;
};

export type PlantDocumentOptions = {
  type: string;
  reference: string;
  issueDate: string;
};

export type PlantConsignorOptions = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  postcode?: string;
  telephone: string;
  country: string;
  email: string;
};

export type PlantTradersOptions = {
  destinationSameAsConsignee: boolean;
  consignor: PlantConsignorOptions;
};

export type PlantMandatorySpokesOptions = {
  purpose?: PlantPurposeOptions;
  commodities?: PlantCommoditiesOptions;
  additionalDetails?: PlantAdditionalDetailsOptions;
  transport?: PlantTransportOptions;
  goodsMovement?: PlantGoodsMovementOptions;
  contact?: PlantContactOptions;
  documents?: PlantDocumentOptions[];
  traders?: PlantTradersOptions;
};

const DEFAULT_ORIGIN: Required<PlantOriginOptions> = {
  countryOfOrigin: 'France',
  countryOfConsignment: 'France',
  internalReference: '',
};

const tomorrow = (): Date => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
};

const DEFAULT_COMMODITY = commodityCodes.otherFoliage;
const DEFAULT_SPECIES = eppoSpecies[DEFAULT_COMMODITY.value][1];

const DEFAULT_TRANSPORT: PlantTransportOptions = {
  borderControlPost: bcps.heathrowAirport.value,
  meansOfTransport: meansOfTransport.roadVehicle.value,
  transportIdentification: 'AB12 CDE',
  transportDocumentReference: 'CMR-123',
  arrivalDate: tomorrow(),
  arrivalTime: '14:50',
  usesContainers: false,
};

const DEFAULT_GOODS_MOVEMENT: PlantGoodsMovementOptions = {
  commonTransitConvention: 'NO',
  usingGvms: false,
};

const DEFAULT_CONTACT: PlantContactOptions = {
  name: 'Responsible Person',
  email: 'responsible.person@example.com',
  telephone: '+44 7700 900124',
};

const DEFAULT_CONSIGNOR: PlantConsignorOptions = {
  name: 'Consignor plant operator',
  addressLine1: '1 Plant Street',
  addressLine2: 'Botanical Quarter',
  addressLine3: 'Glasshouse Estate',
  city: 'London',
  postcode: 'SW1A 1AA',
  telephone: '+44 7700 900123',
  country: 'GB-ENG',
  email: 'consignor@example.com',
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

  async fillTransport(options: PlantTransportOptions = DEFAULT_TRANSPORT): Promise<void> {
    const page = this.pages.transportBeforeBip;
    await page.borderControlPost.selectOption(options.borderControlPost);
    if (options.inspectionPremises !== undefined) {
      await page.saveAndContinue.click();
      await page.inspectionPremises.selectOption(options.inspectionPremises);
    }
    await page.meansOfTransport.selectOption(options.meansOfTransport);
    await page.transportIdentification.fill(options.transportIdentification);
    await page.transportDocumentReference.fill(options.transportDocumentReference);
    await page.arrivalDateDay.fill(String(options.arrivalDate.getUTCDate()));
    await page.arrivalDateMonth.fill(String(options.arrivalDate.getUTCMonth() + 1));
    await page.arrivalDateYear.fill(String(options.arrivalDate.getUTCFullYear()));
    const [hour, minute] = options.arrivalTime.split(':');
    await page.arrivalTimeHour.fill(hour);
    await page.arrivalTimeMinute.fill(minute);
    await page.usesContainers(options.usesContainers).check();
    if (options.usesContainers) {
      for (const container of options.containers ?? []) {
        await page.containerNumber.fill(container.containerNumber);
        if (container.sealNumber) await page.sealNumber.fill(container.sealNumber);
        if (container.officialSeal) await page.officialSeal.check();
        await page.addContainer.click();
      }
    }
  }

  async saveTransport(): Promise<void> {
    await this.pages.transportBeforeBip.saveAndContinue.click();
  }

  async answerTransport(options: PlantTransportOptions = DEFAULT_TRANSPORT): Promise<void> {
    await this.pages.hub.task('Transport to the BCP').click();
    await this.pages.transportBeforeBip.heading.waitFor();
    await this.fillTransport(options);
    await this.saveTransport();
    await this.pages.hub.heading.waitFor();
  }

  async fillGoodsMovement(options: PlantGoodsMovementOptions = DEFAULT_GOODS_MOVEMENT): Promise<void> {
    const page = this.pages.goodsMovementServices;
    const label = {
      ADD_MRN_NOW: 'Yes – add MRN now',
      ADD_MRN_LATER: 'Yes – add MRN later',
      NO: 'No',
    } as const;
    await page.commonTransitConvention(label[options.commonTransitConvention]).check();
    if (options.commonTransitConvention === 'ADD_MRN_NOW') {
      await page.movementReferenceNumber.fill(options.movementReferenceNumber ?? '24GB123456789AB012');
    }
    await page.usingGvms(options.usingGvms).check();
  }

  async saveGoodsMovement(): Promise<void> {
    await this.pages.goodsMovementServices.saveAndContinue.click();
  }

  async answerGoodsMovement(options: PlantGoodsMovementOptions = DEFAULT_GOODS_MOVEMENT): Promise<void> {
    await this.pages.hub.task('Goods movement services').click();
    await this.pages.goodsMovementServices.heading.waitFor();
    await this.fillGoodsMovement(options);
    await this.saveGoodsMovement();
    await this.pages.hub.heading.waitFor();
  }

  async fillContact(options: PlantContactOptions = DEFAULT_CONTACT): Promise<void> {
    await this.pages.contactDetails.responsiblePersonName.fill(options.name);
    await this.pages.contactDetails.responsiblePersonEmail.fill(options.email ?? '');
    await this.pages.contactDetails.responsiblePersonTelephone.fill(options.telephone ?? '');
  }

  async saveContact(): Promise<void> {
    await this.pages.contactDetails.saveAndContinue.click();
  }

  async answerContact(options: PlantContactOptions = DEFAULT_CONTACT): Promise<void> {
    await this.pages.hub.task('Contact details').click();
    await this.pages.contactDetails.heading.waitFor();
    await this.fillContact(options);
    await this.saveContact();
    await this.pages.hub.heading.waitFor();
  }

  async fillNominatedContacts(contacts: PlantNominatedContactOptions[]): Promise<void> {
    for (const contact of contacts) {
      await this.pages.nominatedContact.contactName.fill(contact.name);
      await this.pages.nominatedContact.contactEmail.fill(contact.email ?? '');
      await this.pages.nominatedContact.contactTelephone.fill(contact.telephone ?? '');
      if (contact.isAgent) await this.pages.nominatedContact.contactIsAgent.check();
      await this.pages.nominatedContact.addAnother.click();
    }
  }

  async saveNominatedContacts(): Promise<void> {
    await this.pages.nominatedContact.saveAndContinue.click();
  }

  async answerNominatedContacts(contacts: PlantNominatedContactOptions[] = []): Promise<void> {
    await this.pages.hub.task('Nominated contacts').click();
    await this.pages.nominatedContact.heading.waitFor();
    await this.fillNominatedContacts(contacts);
    await this.saveNominatedContacts();
    await this.pages.hub.heading.waitFor();
  }

  async fillDocuments(documents: PlantDocumentOptions[]): Promise<void> {
    for (const document of documents) {
      await this.pages.accompanyingDocuments.documentType.selectOption(document.type);
      await this.pages.accompanyingDocuments.documentReference.fill(document.reference);
      await this.pages.accompanyingDocuments.issueDate.fill(document.issueDate);
      await this.pages.accompanyingDocuments.addDocument.click();
    }
  }

  async saveDocuments(): Promise<void> {
    await this.pages.accompanyingDocuments.saveAndContinue.click();
  }

  async answerDocuments(
    documents: PlantDocumentOptions[] = [
      { type: documentTypes.phytosanitaryCertificate.value, reference: 'PP-DOC-1', issueDate: '4/12/2025' },
    ],
  ): Promise<void> {
    await this.pages.hub.task('Accompanying documents').click();
    await this.pages.accompanyingDocuments.heading.waitFor();
    await this.fillDocuments(documents);
    await this.saveDocuments();
    await this.pages.hub.heading.waitFor();
  }

  async fillConsignor(options: PlantConsignorOptions): Promise<void> {
    const page = this.pages.consignorCreate;
    await page.consignorName.fill(options.name);
    await page.consignorAddressLine1.fill(options.addressLine1);
    await page.consignorAddressLine2.fill(options.addressLine2 ?? '');
    await page.consignorAddressLine3.fill(options.addressLine3 ?? '');
    await page.consignorCity.fill(options.city);
    await page.consignorPostcode.fill(options.postcode ?? '');
    await page.consignorTelephone.fill(options.telephone);
    await page.consignorCountry.selectOption(options.country);
    await page.consignorEmail.fill(options.email);
  }

  async saveConsignor(): Promise<void> {
    await this.pages.consignorCreate.saveAndContinue.click();
    await this.pages.consignorConfirmation.heading.waitFor();
    await this.pages.consignorConfirmation.addToNotification.click();
  }

  async fillTraders(options: PlantTradersOptions): Promise<void> {
    await this.pages.tradersAddresses.addConsignor.click();
    await this.pages.consignorCreate.heading.waitFor();
    await this.fillConsignor(options.consignor);
    await this.saveConsignor();
    await this.pages.tradersAddresses.heading.waitFor();
    await this.pages.tradersAddresses.destinationSameAsConsignee(options.destinationSameAsConsignee).check();
  }

  async saveTraders(): Promise<void> {
    await this.pages.tradersAddresses.saveAndReturnToHub.click();
  }

  async answerTraders(options: PlantTradersOptions = { destinationSameAsConsignee: true, consignor: DEFAULT_CONSIGNOR }): Promise<void> {
    await this.pages.hub.task('Traders').click();
    await this.pages.tradersAddresses.heading.waitFor();
    await this.fillTraders(options);
    await this.saveTraders();
    await this.pages.hub.heading.waitFor();
  }

  async completeMandatorySpokes(options: PlantMandatorySpokesOptions = {}): Promise<void> {
    await this.answerPurpose(options.purpose);
    await this.answerCommodities(
      options.commodities ?? {
        lines: [
          {
            commodityCode: DEFAULT_COMMODITY.value,
            commodityDescription: DEFAULT_COMMODITY.display,
            species: [DEFAULT_SPECIES],
            details: {
              numberOfPackages: '4',
              packageType: packageTypes.box.value,
              quantity: '120',
              quantityType: quantityTypes.pieces.value,
              netWeight: '80',
              controlledAtmosphereContainer: false,
              intendedForFinalUsers: true,
              testAndTrial: false,
            },
          },
        ],
      },
    );
    await this.answerAdditionalDetails(options.additionalDetails ?? { totalGrossWeight: '100' });
    await this.answerTransport(options.transport);
    await this.answerGoodsMovement(options.goodsMovement);
    await this.answerContact(options.contact);
    await this.answerDocuments(options.documents);
    await this.answerTraders(options.traders);
  }

  async reviewAndSubmit(): Promise<void> {
    await this.pages.hub.task('Review and submit').click();
    await this.pages.reviewNotification.heading.waitFor();
    await this.pages.reviewNotification.continueButton.click();
    await this.pages.declaration.heading.waitFor();
    await this.pages.declaration.declaration.check();
    await this.pages.declaration.submitNotification.click();
    await this.pages.confirmation.heading.waitFor();
  }
}
