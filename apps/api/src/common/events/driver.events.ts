/** Position d'un chauffeur diffusée en temps réel (EventEmitter2 → gateway). */
export const DRIVER_EVENTS = {
  POSITION: 'driver.position',
} as const;

export interface DriverPositionPayload {
  driverId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  at: string;
}
