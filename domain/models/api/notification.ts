export const notificationStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type NotificationStatus = (typeof notificationStatuses)[keyof typeof notificationStatuses];

/**
 * A Standard Address Block on the wire. Field names follow the address book
 * (EUDPA-294 replaced an older shape carrying `addressLine3`, `city` and a
 * free-text `country`).
 */
export type PartyAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/**
 * A party on a notification — linked via `addressId` and/or held inline.
 * Backend `NotificationResponse` returns `ConsignmentParty` with this shape
 * (resolved from the address book on read when `addressId` is set).
 */
export type ConsignmentParty = {
  addressId?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: PartyAddress;
};

/**
 * Transporter stays inline: approval number and type are not address-book
 * fields, so it never carries an `addressId`.
 */
export type Transporter = {
  name: string;
  address: PartyAddress;
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
  meansOfTransport?: string;
  transportIdentification?: string;
  transportDocumentReference?: string;
  transitedCountries?: string[];
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
  placeOfOrigin?: ConsignmentParty | null;
  consignor?: ConsignmentParty | null;
  consignee?: ConsignmentParty | null;
  importer?: ConsignmentParty | null;
  destination?: ConsignmentParty | null;
  consignment?: ConsignmentParty | null;
  cphNumber?: string | null;
  transport?: Transport | null;
  status?: NotificationStatus;
  created?: string;
  updated?: string;
};
