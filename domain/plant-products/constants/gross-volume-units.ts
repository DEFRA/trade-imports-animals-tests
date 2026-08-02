export const grossVolumeUnits = {
  litres: { value: 'LITRES', display: 'litres' },
  metresCubed: { value: 'METRES_CUBED', display: 'metres cubed' },
} as const;

export type GrossVolumeUnit = (typeof grossVolumeUnits)[keyof typeof grossVolumeUnits];
