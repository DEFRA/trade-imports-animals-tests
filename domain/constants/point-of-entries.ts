export const pointOfEntries = {
  // aka port of entries
  aberdeen: 'ABERDEEN',
  eastMidlandsAirport: 'EAST MIDLANDS AIRPORT',
  edinburgh: 'EDINBURGH',
} as const;

export type PointOfEntry = (typeof pointOfEntries)[keyof typeof pointOfEntries];
