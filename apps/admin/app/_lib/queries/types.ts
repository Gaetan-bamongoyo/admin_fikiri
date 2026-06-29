/** Types partagés par la couche de requête de l'admin. */

/** Réponse paginée renvoyée par l'API (`PaginatedResponseDto`). */
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Condition de trafic côté API (à mapper vers les niveaux d'affichage). */
export type TrafficCondition = "fluid" | "moderate" | "heavy" | "blocked";
