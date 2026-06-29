import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";

export type IncidentType =
  | "congestion"
  | "accident"
  | "roadwork"
  | "checkpoint"
  | "danger"
  | "clear";

export type IncidentStatus = "active" | "resolved" | "expired" | "disputed";

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  latitude: string;
  longitude: string;
  description?: string | null;
  address?: string | null;
  reporterId: string;
  confirmationCount: number;
  expiresAt: string;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface IncidentConfirmation {
  id: string;
  userId: string;
  isConfirm: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// `type` (et non `interface`) pour bénéficier de la signature d'index
// implicite, requise par le `Record` des params du client API.
export type IncidentsQuery = {
  page?: number;
  limit?: number;
  type?: IncidentType;
  status?: IncidentStatus;
};

export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (filters: IncidentsQuery) =>
    [...incidentKeys.lists(), filters] as const,
  details: () => [...incidentKeys.all, "detail"] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
};

function fetchIncidents(query: IncidentsQuery = {}) {
  return api.get<PaginatedResponse<Incident>>("/incidents", { params: query });
}

function fetchIncident(id: string) {
  return api.get<Incident>(`/incidents/${id}`);
}

export function incidentsQueryOptions(query: IncidentsQuery = {}) {
  return queryOptions({
    queryKey: incidentKeys.list(query),
    queryFn: () => fetchIncidents(query),
  });
}

export function incidentQueryOptions(id: string) {
  return queryOptions({
    queryKey: incidentKeys.detail(id),
    queryFn: () => fetchIncident(id),
  });
}

export function useIncidents(query: IncidentsQuery = {}) {
  return useQuery(incidentsQueryOptions(query));
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: incidentKeys.detail(id ?? "none"),
    queryFn: () => fetchIncident(id as string),
    enabled: Boolean(id),
  });
}

export function useIncidentConfirmations(id: string | null) {
  return useQuery({
    queryKey: [...incidentKeys.detail(id ?? "none"), "confirmations"] as const,
    queryFn: () =>
      api.get<IncidentConfirmation[]>(`/incidents/${id}/confirmations`),
    enabled: Boolean(id),
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch<Incident>(`/incidents/${id}/resolve`),
    onSuccess: (incident) => {
      queryClient.setQueryData(incidentKeys.detail(incident.id), incident);
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}
