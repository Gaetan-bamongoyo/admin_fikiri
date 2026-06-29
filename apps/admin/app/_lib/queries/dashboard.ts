import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../api-client";
import type { TrafficCondition } from "./types";

export interface DashboardStats {
  activeUsers: number;
  reportsToday: number;
  monitoredRoads: number;
  totalIncidents: number;
}

export interface TrafficShare {
  condition: TrafficCondition;
  count: number;
}

export interface HourlyTraffic {
  hour: number;
  conditions: Record<TrafficCondition, number>;
}

export interface MonthlyCount {
  /** Mois au format `YYYY-MM`. */
  month: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  trafficShare: TrafficShare[];
  hourlyTraffic: HourlyTraffic[];
  monthlyReports: MonthlyCount[];
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

function fetchDashboard() {
  return api.get<DashboardData>("/admin/dashboard");
}

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
  });
}

export function useDashboard() {
  return useQuery(dashboardQueryOptions());
}
