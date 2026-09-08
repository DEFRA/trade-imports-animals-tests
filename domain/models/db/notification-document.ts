import type { ObjectId } from 'mongodb';

type StoredAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/**
 * Held either as an `addressId` reference resolved on read, or with the details
 * inline and no `addressId`, so every field is optional.
 */
type StoredParty = {
  addressId?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: StoredAddress;
};

type NotificationContent = {
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
    certifiedFor?: string;
    unweanedAnimals: string;
  };
  placeOfOrigin?: StoredParty;
  consignor?: StoredParty;
  consignee?: StoredParty;
  importer?: StoredParty;
  destination?: StoredParty;
  cphNumber?: string;
  transport: {
    portOfEntry?: string;
    arrivalDate?: Date;
    meansOfTransport: string;
    transportIdentification?: string;
    transportDocumentReference?: string;
    transitedCountries?: string[];
    transporter?: {
      name: string;
      address: Partial<StoredAddress>;
      approvalNumber: string;
      type: string;
    };
  };
  consignment?: StoredParty;
};

export type NotificationDocument = {
  _id: ObjectId;
  referenceNumber: string | null;
  notification: NotificationContent;
  fulfilments?: unknown[];
  status: string;
  created: Date;
  updated: Date;
  _class: string;
};
