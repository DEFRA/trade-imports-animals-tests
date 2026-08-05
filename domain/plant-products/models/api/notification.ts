export const plantProductsNotificationStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type PlantProductsNotificationStatus = (typeof plantProductsNotificationStatuses)[keyof typeof plantProductsNotificationStatuses];

export type SpeciesVariety = {
  variety?: string | null;
  varietyClass?: 'CLASS_I' | 'CLASS_II' | 'EXTRA_CLASS' | null;
};

export type PlantSpecies = {
  eppoCode?: string | null;
  genusAndSpecies?: string | null;
  speciesId?: string | null;
  varieties?: SpeciesVariety[] | null;
};

export type CommodityLine = {
  uniqueComplementId?: string | null;
  commodityCode?: string | null;
  commodityDescription?: string | null;
  numberOfPackages?: number | null;
  packageType?: string | null;
  quantity?: number | null;
  quantityType?: string | null;
  netWeight?: number | null;
  controlledAtmosphereContainer?: boolean | null;
  finishedOrPropagated?: 'FINISHED' | 'PROPAGATED' | null;
  intendedForFinalUsers?: boolean | null;
  testAndTrial?: boolean | null;
  species?: PlantSpecies[] | null;
};

export type PlantProductsOperator = {
  operatorId?: string | null;
  name?: string | null;
  telephone?: string | null;
  email?: string | null;
  address?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressLine3?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
  } | null;
};

export type PlantProductsContact = {
  name?: string | null;
  email?: string | null;
  telephone?: string | null;
  isAgent?: boolean | null;
};

export type PlantProductsNotificationDto = {
  referenceNumber?: string | null;
  chedType?: 'CHEDPP' | null;
  status?: PlantProductsNotificationStatus | null;
  ownership?: {
    assignedOrganisationId?: string | null;
    assignedOrganisationName?: string | null;
  } | null;
  origin?: {
    countryCode?: string | null;
    countryOfConsignmentCode?: string | null;
    internalReference?: string | null;
  } | null;
  reasonForImport?: 'INTERNAL_MARKET' | 'RE_ENTRY' | 'RE_CONFORMITY_CHECK' | null;
  commodity?: {
    name?: string | null;
    inputMethod?: 'MANUAL' | 'CSV' | null;
    commodityComplement?: CommodityLine[] | null;
  } | null;
  additionalDetails?: {
    totalGrossWeight?: number | null;
    grossVolume?: number | null;
    grossVolumeUnit?: 'LITRES' | 'METRES_CUBED' | null;
  } | null;
  consignor?: PlantProductsOperator | null;
  consignee?: PlantProductsOperator | null;
  importer?: PlantProductsOperator | null;
  destination?: PlantProductsOperator | null;
  packer?: PlantProductsOperator | null;
  responsiblePerson?: PlantProductsContact | null;
  nominatedContacts?: PlantProductsContact[] | null;
  transport?: {
    borderControlPost?: string | null;
    inspectionPremises?: string | null;
    meansOfTransport?: 'AIRPLANE' | 'RAILWAY' | 'ROAD_VEHICLE' | 'VESSEL' | null;
    transportIdentification?: string | null;
    transportDocumentReference?: string | null;
    arrivalDate?: string | null;
    arrivalTime?: string | null;
    usesContainers?: boolean | null;
    containers?: Array<{
      containerNumber?: string | null;
      sealNumber?: string | null;
      officialSeal?: boolean | null;
    }> | null;
  } | null;
  goodsMovementServices?: {
    commonTransitConvention?: 'ADD_MRN_NOW' | 'ADD_MRN_LATER' | 'NO' | null;
    movementReferenceNumber?: string | null;
    usingGvms?: boolean | null;
  } | null;
  isCuc?: boolean | null;
  billing?: {
    address?: {
      addressLine1?: string | null;
      addressLine2?: string | null;
      addressLine3?: string | null;
      addressLine4?: string | null;
      cityOrTown?: string | null;
      county?: string | null;
      postalCode?: string | null;
    } | null;
    email?: string | null;
    telephone?: string | null;
  } | null;
  declaration?: {
    agreed?: boolean | null;
    declaredAt?: string | null;
  } | null;
  created?: string | null;
  updated?: string | null;
};

export type PlantProductsNotification = PlantProductsNotificationDto & {
  id?: string | null;
  referenceNumber: string;
  chedType: 'CHEDPP';
  status: PlantProductsNotificationStatus;
};

export type PlantProductsDocumentFile = {
  fileId?: string | null;
  filename?: string | null;
};

export type PlantProductsAccompanyingDocumentDto = {
  id?: string | null;
  documentType?: string | null;
  documentReference?: string | null;
  issueDate?: string | null;
  files?: PlantProductsDocumentFile[] | null;
};

export type PlantProductsNotificationResponse = PlantProductsNotification & {
  accompanyingDocuments: PlantProductsAccompanyingDocumentDto[];
};

export type PlantProductsNotificationPageResponse = {
  content: PlantProductsNotificationDto[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

export type PlantProductsAccompanyingDocumentListResponse = {
  documents: PlantProductsAccompanyingDocumentDto[];
};

export type PlantProductsStatusChangeRequest = {
  status: Exclude<PlantProductsNotificationStatus, 'DRAFT'>;
  discardChanges?: boolean;
};
