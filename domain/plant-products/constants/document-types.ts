export const documentTypes = {
  airWaybill: { value: 'AIR_WAYBILL', display: 'Air waybill' },
  commercialInvoice: { value: 'COMMERCIAL_INVOICE', display: 'Commercial invoice' },
  cargoManifest: { value: 'CARGO_MANIFEST', display: 'Cargo manifest' },
  inspectionCertificate: { value: 'INSPECTION_CERTIFICATE', display: 'Inspection certificate' },
  phytosanitaryCertificate: { value: 'PHYTOSANITARY_CERTIFICATE', display: 'Phytosanitary certificate' },
  importPermit: { value: 'IMPORT_PERMIT', display: 'Import permit' },
  originCertificate: { value: 'ORIGIN_CERTIFICATE', display: 'Origin certificate' },
  letterOfAuthority: { value: 'LETTER_OF_AUTHORITY', display: 'Letter of authority (Directive 2008/61/EC)' },
  heatTreatmentCertificate: { value: 'HEAT_TREATMENT_CERTIFICATE', display: 'Heat treatment certificate' },
  containerManifest: { value: 'CONTAINER_MANIFEST', display: 'Container manifest' },
  seaWaybill: { value: 'SEA_WAYBILL', display: 'Sea waybill' },
  railWaybill: { value: 'RAIL_WAYBILL', display: 'Rail waybill' },
  customsDeclaration: { value: 'CUSTOMS_DECLARATION', display: 'Customs declaration' },
  billOfLading: { value: 'BILL_OF_LADING', display: 'Bill of lading' },
  conformityCertificate: { value: 'CONFORMITY_CERTIFICATE', display: 'Conformity certificate' },
  other: { value: 'OTHER', display: 'Other' },
} as const;

export type DocumentType = (typeof documentTypes)[keyof typeof documentTypes];
