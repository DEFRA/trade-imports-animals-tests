export const varieties = {
  CIDAC: [{ value: 'NONE', display: 'None' }],
  MABSD: [
    { value: '03107EFA-9BCD-1089-565E-B28F73994DEC', display: 'McIntosh Red' },
    { value: '035ECF9F-7B6C-078D-60D5-D2947C23A366', display: 'Spartan' },
  ],
} as const;

export const varietyClasses = {
  CIDAC: [
    { value: 'CLASS_I', display: 'Class I' },
    { value: 'CLASS_II', display: 'Class II' },
    { value: 'EXTRA_CLASS', display: 'Extra Class' },
  ],
} as const;
