import type { RideResponseDto } from './dto/ride-response.dto';

/** Noms d'événements internes (EventEmitter2) relayés par le gateway temps réel. */
export const RIDE_EVENTS = {
  CREATED: 'ride.created',
  UPDATED: 'ride.updated',
} as const;

export interface RideEventPayload {
  ride: RideResponseDto;
}
