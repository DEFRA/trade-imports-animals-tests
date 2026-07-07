export const meansOfTransport = {
  airplane: 'AIRPLANE',
  railway: 'RAILWAY',
  roadVehicle: 'ROAD_VEHICLE',
  vessel: 'VESSEL',
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];

// Visible option labels, keyed by stored value — for asserting dropdown text.
export const meansOfTransportLabels: Record<MeansOfTransport, string> = {
  AIRPLANE: 'Airplane',
  RAILWAY: 'Railway',
  ROAD_VEHICLE: 'Road vehicle',
  VESSEL: 'Vessel',
};
