import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";
import type { PaginatedResponse, TrafficCondition } from "./types";

export type VehicleKind = "bus" | "minibus" | "taxi";
export type VehicleStatus = "active" | "idle" | "offline";

export interface Vehicle {
  id: string;
  name: string;
  kind: VehicleKind;
  line?: string | null;
  plate?: string | null;
  driverName?: string | null;
  capacity: number;
  passengers: number;
  status: VehicleStatus;
  trafficCondition: TrafficCondition;
  latitude?: string | null;
  longitude?: string | null;
  distanceKm: string;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface FleetSummary {
  total: number;
  byStatus: Record<VehicleStatus, number>;
  byKind: Record<VehicleKind, number>;
  totalPassengers: number;
}

// `type` (et non `interface`) pour la signature d'index requise par les params du client API.
export type VehiclesQuery = {
  page?: number;
  limit?: number;
  kind?: VehicleKind;
  status?: VehicleStatus;
};

export interface CreateVehicleInput {
  name: string;
  kind: VehicleKind;
  line?: string;
  plate?: string;
  driverName?: string;
  capacity?: number;
  status?: VehicleStatus;
  trafficCondition?: TrafficCondition;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface UpdateVehiclePositionInput {
  latitude: number;
  longitude: number;
  passengers?: number;
  trafficCondition?: TrafficCondition;
  distanceKm?: number;
}

export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (filters: VehiclesQuery) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  summary: () => [...vehicleKeys.all, "summary"] as const,
};

function fetchVehicles(query: VehiclesQuery = {}) {
  return api.get<PaginatedResponse<Vehicle>>("/fleet/vehicles", {
    params: query,
  });
}

function fetchVehicle(id: string) {
  return api.get<Vehicle>(`/fleet/vehicles/${id}`);
}

function fetchFleetSummary() {
  return api.get<FleetSummary>("/fleet/summary");
}

export function vehiclesQueryOptions(query: VehiclesQuery = {}) {
  return queryOptions({
    queryKey: vehicleKeys.list(query),
    queryFn: () => fetchVehicles(query),
  });
}

export function vehicleQueryOptions(id: string) {
  return queryOptions({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => fetchVehicle(id),
  });
}

export function fleetSummaryQueryOptions() {
  return queryOptions({
    queryKey: vehicleKeys.summary(),
    queryFn: fetchFleetSummary,
  });
}

export function useVehicles(query: VehiclesQuery = {}) {
  return useQuery(vehiclesQueryOptions(query));
}

export function useVehicle(id: string) {
  return useQuery(vehicleQueryOptions(id));
}

export function useFleetSummary() {
  return useQuery(fleetSummaryQueryOptions());
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVehicleInput) =>
      api.post<Vehicle>("/fleet/vehicles", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      api.patch<Vehicle>(`/fleet/vehicles/${id}`, input),
    onSuccess: (vehicle) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicle.id), vehicle);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useUpdateVehiclePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateVehiclePositionInput;
    }) => api.patch<Vehicle>(`/fleet/vehicles/${id}/position`, input),
    onSuccess: (vehicle) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicle.id), vehicle);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/fleet/vehicles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}
