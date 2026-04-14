export type NotificationDocument = {
  referenceNumber: string | null;
  origin: {
    countryCode: string;
    requiresRegionCode: string;
  };
  commodity: {
    name: string;
    commodityComplement: Array<{
      typeOfCommodity: string;
      species: Array<{
        text: string;
        noOfAnimals: number;
        noOfPackages: number;
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
};
