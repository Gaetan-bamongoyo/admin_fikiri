import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../api-client";
import type { PaginatedResponse, TrafficCondition } from "./types";

export interface TrafficReport {
  id: string;
  latitude: number;
  longitude: number;
  condition: TrafficCondition;
  userId?: string | null;
  createdAt: string;
}

// `type` (et non `interface`) pour la signature d'index requise par les params du client API.
export type TrafficReportsQuery = {
  page?: number;
  limit?: number;
  condition?: TrafficCondition;
  from?: string;
  to?: string;
};

export const trafficReportKeys = {
  all: ["traffic-reports"] as const,
  lists: () => [...trafficReportKeys.all, "list"] as const,
  list: (filters: TrafficReportsQuery) =>
    [...trafficReportKeys.lists(), filters] as const,
};

function fetchTrafficReports(query: TrafficReportsQuery = {}) {
  return api.get<PaginatedResponse<TrafficReport>>("/traffic/admin/reports", {
    params: query,
  });
}

export function trafficReportsQueryOptions(query: TrafficReportsQuery = {}) {
  return queryOptions({
    queryKey: trafficReportKeys.list(query),
    queryFn: () => fetchTrafficReports(query),
  });
}

export function useTrafficReports(query: TrafficReportsQuery = {}) {
  return useQuery(trafficReportsQueryOptions(query));
}
