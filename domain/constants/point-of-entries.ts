export const pointOfEntries = {
  aberdeen: { code: 'GBABE', display: 'Aberdeen (GBABE)' },
  eastMidlandsAirport: { code: 'GBEMA', display: 'East Midlands Airport (GBEMA)' },
  edinburgh: { code: 'GBEDI', display: 'Edinburgh (GBEDI)' },
} as const;

export type PointOfEntry = (typeof pointOfEntries)[keyof typeof pointOfEntries];
