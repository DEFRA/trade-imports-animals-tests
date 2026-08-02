import { PlantProductsApiClient } from '@adapters/http/plant-products-api-client';
import { bcps } from '@domain/plant-products/constants/bcps';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { countryCodes } from '@domain/plant-products/constants/country-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { grossVolumeUnits } from '@domain/plant-products/constants/gross-volume-units';
import { importPurposes } from '@domain/plant-products/constants/import-purposes';
import { meansOfTransport } from '@domain/plant-products/constants/means-of-transport';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';
import type {
  PlantProductsNotification,
  PlantProductsNotificationDto,
  PlantProductsOperator,
} from '@domain/plant-products/models/api/notification';
import type { PlantProductsPageObjects } from '@page-objects';

export type PlantProductsJourneyContext = {
  journeyId?: string;
  referenceNumber?: string;
};

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const operator = (role: string): PlantProductsOperator => ({
  operatorId: `${role}-operator`,
  name: `${role} plant operator`,
  telephone: '+44 7700 900123',
  email: `${role.toLowerCase()}@example.com`,
  address: {
    addressLine1: '1 Plant Street',
    addressLine2: 'Botanical Quarter',
    addressLine3: 'Glasshouse Estate',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: countryCodes.england.value,
  },
});

const fullNotification = (referenceNumber: string): PlantProductsNotificationDto => {
  const commodity = commodityCodes.otherCitrus;
  const species = eppoSpecies[commodity.value][0];
  const arrival = new Date();
  arrival.setUTCDate(arrival.getUTCDate() + 14);

  return {
    referenceNumber,
    origin: {
      countryCode: countryCodes.brazil.value,
      countryOfConsignmentCode: countryCodes.brazil.value,
      internalReference: 'PP-API-SEED',
    },
    reasonForImport: importPurposes.internalMarket.value,
    commodity: {
      name: commodity.display,
      inputMethod: 'MANUAL',
      commodityComplement: [
        {
          uniqueComplementId: 'plant-line-1',
          commodityCode: commodity.value,
          commodityDescription: commodity.display,
          numberOfPackages: 4,
          packageType: packageTypes.box.value,
          quantity: 120,
          quantityType: quantityTypes.pieces.value,
          netWeight: 80,
          controlledAtmosphereContainer: false,
          finishedOrPropagated: 'FINISHED',
          intendedForFinalUsers: true,
          testAndTrial: false,
          species: [
            {
              ...species,
              varieties: [
                {
                  variety: varieties.CIDAC[0].value,
                  varietyClass: varietyClasses.CIDAC[0].value,
                },
              ],
            },
          ],
        },
      ],
    },
    additionalDetails: {
      totalGrossWeight: 100,
      grossVolume: 250,
      grossVolumeUnit: grossVolumeUnits.litres.value,
    },
    consignor: operator('Consignor'),
    consignee: operator('Consignee'),
    importer: operator('Importer'),
    destination: operator('Destination'),
    packer: operator('Packer'),
    responsiblePerson: {
      name: 'Responsible Person',
      email: 'responsible.person@example.com',
      telephone: '+44 7700 900124',
      isAgent: false,
    },
    nominatedContacts: [
      {
        name: 'Nominated Agent',
        email: 'nominated.agent@example.com',
        telephone: '+44 7700 900125',
        isAgent: true,
      },
    ],
    transport: {
      borderControlPost: bcps.controlPoint.value,
      inspectionPremises: bcps.controlPoint.controlPoints[0].value,
      meansOfTransport: meansOfTransport.vessel.value,
      transportIdentification: 'PLANT VESSEL 1',
      transportDocumentReference: 'PP-TRANSPORT-1',
      arrivalDate: dateOnly(arrival),
      arrivalTime: '14:30',
      usesContainers: true,
      containers: [{ containerNumber: 'PP-CONT-1', sealNumber: 'PP-SEAL-1', officialSeal: true }],
    },
    goodsMovementServices: {
      commonTransitConvention: 'NO',
      movementReferenceNumber: null,
      usingGvms: false,
    },
    isCuc: false,
    billing: {
      address: {
        addressLine1: '1 Billing Street',
        addressLine2: 'Botanical Quarter',
        addressLine3: 'Glasshouse Estate',
        addressLine4: 'Greater London',
        cityOrTown: 'London',
        county: 'London',
        postalCode: 'SW1A 1AA',
      },
      email: 'billing@example.com',
      telephone: '+44 20 7946 0958',
    },
    declaration: { agreed: true, declaredAt: new Date().toISOString() },
  };
};

export class PlantProductsApiJourney {
  constructor(
    private readonly pages: PlantProductsPageObjects,
    private readonly api: PlantProductsApiClient,
    private readonly context: PlantProductsJourneyContext,
  ) {}

  private remember(created: PlantProductsNotification): PlantProductsNotification {
    this.context.journeyId = created.referenceNumber;
    this.context.referenceNumber = created.referenceNumber;
    return created;
  }

  // There is no plant equivalent of live animals' seedProjections(): plant products persists one
  // notification resource. The inverse caveat does apply—documents are a separate aggregate, so a
  // whole-notification PUT never creates them; createNotificationWithDocuments adds each explicitly.
  async createEmptyNotification(): Promise<PlantProductsNotification> {
    return this.remember(await this.api.create());
  }

  async createFullNotification(): Promise<PlantProductsNotification> {
    const created = await this.api.create();
    return this.remember(await this.api.replace(created.referenceNumber, fullNotification(created.referenceNumber)));
  }

  async createSubmittedNotification(): Promise<PlantProductsNotification> {
    const draft = await this.createFullNotification();
    return this.remember(await this.api.setStatus(draft.referenceNumber, { status: 'SUBMITTED' }));
  }

  async createNotificationWithDocuments(count: number): Promise<PlantProductsNotification> {
    const draft = await this.createFullNotification();
    for (let index = 0; index < count; index += 1) {
      await this.api.addDocument(draft.referenceNumber, {
        documentType: documentTypes.phytosanitaryCertificate.value,
        documentReference: `PP-DOC-${index + 1}`,
        issueDate: dateOnly(new Date()),
      });
    }
    return this.remember(draft);
  }
}
