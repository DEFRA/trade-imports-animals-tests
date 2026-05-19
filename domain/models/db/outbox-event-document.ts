export type OutboxEventDocument = {
  _id: string;
  aggregateId: string;
  aggregateType: string;
  subType: string;
  aggregateVersion: number;
  eventType: string;
  timestamp: Date;
  data: NotificationSubmittedData;
  metadata: {
    correlationId: string;
    schemaVersion: string;
  };
  _class?: string;
};

export type NotificationSubmittedData = {
  referenceNumber: string;
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
  cphNumber: string;
  transport: {
    portOfEntry: string;
    arrivalDate: Date;
    transporter?: {
      name: string;
      address: {
        addressLine1: string;
        addressLine2: string;
        addressLine3?: string;
        country: string;
      };
      approvalNumber: string;
      type: string;
    };
  };
  consignor: {
    name: string;
    address: {
      addressLine1: string;
      addressLine2: string;
      addressLine3?: string;
      country: string;
    };
  };
  destination: {
    name: string;
    address: {
      addressLine1: string;
      addressLine2: string;
      addressLine3?: string;
      country: string;
    };
  };
};
