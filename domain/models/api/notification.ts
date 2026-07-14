export const notificationStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type NotificationStatus = (typeof notificationStatuses)[keyof typeof notificationStatuses];

export type OperatorAddress = {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  country: string;
};

export type Operator = {
  name: string;
  address: OperatorAddress;
};

export type Transporter = Operator & {
  approvalNumber: string;
  type: string;
};

/**
 * Per-species counts are strings on the wire (the frontend submits raw form
 * input values) but echo back as numbers once the backend has stored them.
 */
export type SpeciesEntry = {
  value: string;
  text: string;
  noOfAnimals?: number | string;
  noOfPackages?: number | string;
  earTag?: string;
  passport?: string;
};

export type CommodityComplement = {
  typeOfCommodity: string;
  species: SpeciesEntry[];
  totalNoOfAnimals?: number;
  totalNoOfPackages?: number;
};

export type Commodity = {
  name: string;
  commodityComplement?: CommodityComplement[];
};

export type Origin = {
  countryCode?: string;
  requiresRegionCode?: string;
  internalReference?: string;
};

export type AdditionalDetails = {
  certifiedFor?: string;
  unweanedAnimals?: string;
};

export type Transport = {
  portOfEntry?: string;
  arrivalDate?: string;
  transporter?: Transporter;
};

/**
 * Wire shape of the backend /notifications API. Sections a draft has not
 * reached yet are echoed back as null by the backend, so every section is
 * nullable as well as optional.
 */
export type Notification = {
  referenceNumber?: string;
  origin?: Origin | null;
  commodity?: Commodity | null;
  reasonForImport?: string | null;
  additionalDetails?: AdditionalDetails | null;
  placeOfOrigin?: Operator | null;
  consignor?: Operator | null;
  consignee?: Operator | null;
  importer?: Operator | null;
  destination?: Operator | null;
  consignment?: Operator | null;
  cphNumber?: string | null;
  transport?: Transport | null;
  status?: NotificationStatus;
  created?: string;
  updated?: string;
};
