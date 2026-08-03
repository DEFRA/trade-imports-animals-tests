export const varieties = {
  '08059000': {
    CIDAC: [{ value: 'C5E27C5A-D13B-E9F5-B4B0-7234A7941208', display: 'None' }],
  },
  '0808108090': {
    MABSD: [
      { value: '03107EFA-9BCD-1089-565E-B28F73994DEC', display: 'McIntosh Red' },
      { value: '035ECF9F-7B6C-078D-60D5-D2947C23A366', display: 'Spartan' },
      { value: '0C245190-A316-5B88-F38E-360FBBFB208F', display: 'Royal Gala' },
    ],
  },
} as const;

export const varietyClasses = {
  '0808108090': [
    { value: 'CLASS_I', display: 'Class I' },
    { value: 'CLASS_II', display: 'Class II' },
    { value: 'EXTRA_CLASS', display: 'Extra Class' },
  ],
} as const;
