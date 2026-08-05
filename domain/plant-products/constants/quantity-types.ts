export const quantityTypes = {
  stems: { value: 'STEMS', display: 'Stems' },
  bulbs: { value: 'BULBS', display: 'Bulbs' },
  cormsAndRhizomes: { value: 'CORMS_AND_RHIZOMES', display: 'Corms and rhizomes' },
  plantsInTissueCulture: { value: 'PLANTS_IN_TISSUE_CULTURE', display: 'Plants in tissue culture' },
  seeds: { value: 'SEEDS', display: 'Seeds' },
  kilograms: { value: 'KILOGRAMS', display: 'Kilograms' },
  pieces: { value: 'PIECES', display: 'Pieces' },
} as const;

export type QuantityType = (typeof quantityTypes)[keyof typeof quantityTypes];
