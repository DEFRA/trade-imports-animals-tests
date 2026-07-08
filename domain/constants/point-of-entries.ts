export const pointOfEntries = {
  aberdeen: { code: 'GB DYC', display: 'Aberdeen Airport (GB DYC)' },
  eastMidlandsAirport: { code: 'GB EMA', display: 'East Midlands Airport (GB EMA)' },
  edinburgh: { code: 'GB EDI', display: 'Edinburgh Airport (GB EDI)' },
} as const;

export type PointOfEntry = (typeof pointOfEntries)[keyof typeof pointOfEntries];
