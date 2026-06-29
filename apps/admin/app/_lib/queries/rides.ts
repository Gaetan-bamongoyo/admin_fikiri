import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";
import type { PaginatedResponse } from "./types";

export type RideStatus =
  | "searching"
  | "assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Statuts considérés comme « courses en cours ». */
export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  "searching",
  "assigned",
  "en_route",
  "in_progress",
];

export interface Ride {
  id: string;
  pickupAddress: string;
  pickupLat: string;
  pickupLng: string;
  dropoffAddress: string;
  dropoffLat: string;
  dropoffLng: string;
  distanceKm: string;
  durationMin: number;
  price: string;
  status: RideStatus;
  driverId?: string | null;
  driverName?: string | null;
  passengerId?: string | null;
  passengerName?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface RidesStats {
  totalRides: number;
  completedRides: number;
  activeRides: number;
  cancelledRides: number;
  totalDistanceKm: number;
  avgDurationMin: number;
  totalRevenue: number;
  byStatus: Record<RideStatus, number>;
}

// `type` (et non `interface`) pour la signature d'index requise par les params du client API.
export type RidesQuery = {
  page?: number;
  limit?: number;
  status?: RideStatus;
  driverId?: string;
  from?: string;
  to?: string;
};

export const rideKeys = {
  all: ["rides"] as const,
  lists: () => [...rideKeys.all, "list"] as const,
  list: (filters: RidesQuery) => [...rideKeys.lists(), filters] as const,
  active: () => [...rideKeys.all, "active"] as const,
  stats: () => [...rideKeys.all, "stats"] as const,
  details: () => [...rideKeys.all, "detail"] as const,
  detail: (id: string) => [...rideKeys.details(), id] as const,
};

function fetchRides(query: RidesQuery = {}) {
  return api.get<PaginatedResponse<Ride>>("/admin/rides", { params: query });
}

function fetchActiveRides() {
  return api.get<Ride[]>("/admin/rides/active");
}

function fetchRidesStats() {
  return api.get<RidesStats>("/admin/rides/stats");
}

export function ridesQueryOptions(query: RidesQuery = {}) {
  return queryOptions({
    queryKey: rideKeys.list(query),
    queryFn: () => fetchRides(query),
  });
}

export function activeRidesQueryOptions() {
  return queryOptions({
    queryKey: rideKeys.active(),
    queryFn: fetchActiveRides,
  });
}

export function ridesStatsQueryOptions() {
  return queryOptions({
    queryKey: rideKeys.stats(),
    queryFn: fetchRidesStats,
  });
}

export function useRides(query: RidesQuery = {}) {
  return useQuery(ridesQueryOptions(query));
}

export function useActiveRides() {
  return useQuery(activeRidesQueryOptions());
}

export function useRidesStats() {
  return useQuery(ridesStatsQueryOptions());
}

export function useUpdateRideStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RideStatus }) =>
      api.patch<Ride>(`/admin/rides/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rideKeys.all });
    },
  });
}
