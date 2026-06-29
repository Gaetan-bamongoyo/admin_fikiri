export enum RideStatus {
  /** Recherche d'un chauffeur. */
  SEARCHING = 'searching',
  /** Chauffeur assigné, pas encore parti. */
  ASSIGNED = 'assigned',
  /** Chauffeur en route vers le passager. */
  EN_ROUTE = 'en_route',
  /** Course en cours (passager à bord). */
  IN_PROGRESS = 'in_progress',
  /** Course terminée. */
  COMPLETED = 'completed',
  /** Course annulée. */
  CANCELLED = 'cancelled',
}

/** Statuts considérés comme « courses en cours » pour le suivi temps réel. */
export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  RideStatus.SEARCHING,
  RideStatus.ASSIGNED,
  RideStatus.EN_ROUTE,
  RideStatus.IN_PROGRESS,
];
