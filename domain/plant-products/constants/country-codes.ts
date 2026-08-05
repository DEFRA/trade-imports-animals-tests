export const countryCodes = {
  brazil: { value: 'BR', display: 'Brazil' },
  france: { value: 'FR', display: 'France' },
  republicOfIreland: { value: 'IE', display: 'Republic of Ireland' },
  england: { value: 'GB-ENG', display: 'England' },
  scotland: { value: 'GB-SCT', display: 'Scotland' },
  wales: { value: 'GB-WLS', display: 'Wales' },
  northernIreland: { value: 'GB-NIR', display: 'Northern Ireland' },
} as const;

export type CountryCode = (typeof countryCodes)[keyof typeof countryCodes];
