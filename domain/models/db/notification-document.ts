import type { ObjectId } from 'mongodb';

export type NotificationDocument = {
  _id: ObjectId;
  referenceNumber: string | null;
  origin: {
    countryCode: string;
    requiresRegionCode: string;
    internalReference?: string;
  };
  commodity: {
    name: string;
    commodityComplement: Array<{
      typeOfCommodity: string;
      species: Array<{
        value: string;
        text: string;
        noOfAnimals: number;
        noOfPackages: number;
        earTag: string;
        passport: string;
      }>;
      totalNoOfAnimals: number;
      totalNoOfPackages: number;
    }>;
  };
  reasonForImport: string;
  additionalDetails: {
    certifiedFor: string;
    unweanedAnimals: string;
  };
  created: Date;
  updated: Date;
  _class: string;
};
