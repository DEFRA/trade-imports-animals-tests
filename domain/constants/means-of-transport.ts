export const meansOfTransport = {
  airplane: { code: 'AIRPLANE', display: 'Airplane' },
  railway: { code: 'RAILWAY', display: 'Railway' },
  roadVehicle: { code: 'ROAD_VEHICLE', display: 'Road vehicle' },
  vessel: { code: 'VESSEL', display: 'Vessel' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];

export function requiresTransitedCountries(meansOfTransport: MeansOfTransport): boolean {
  return meansOfTransport.code === 'RAILWAY' || meansOfTransport.code === 'ROAD_VEHICLE';
}
