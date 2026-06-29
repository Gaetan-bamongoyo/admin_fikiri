import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../api-client";
import type { IncidentType } from "./incidents";

export interface AnalyticsSummary {
  totalUsers: number;
  /** Total des incidents signalés. */
  totalReports: number;
  /** Total des signalements d'état du trafic. */
  totalTrafficReports: number;
  /** Part d'incidents résolus (0–1). */
  resolvedRate: number;
}

export interface MonthlyTrend {
  /** Mois au format `YYYY-MM`. */
  month: string;
  reports: number;
  trafficReports: number;
  newUsers: number;
}

export interface HourlyDensity {
  hour: number;
  count: number;
}

export interface IncidentTypeCount {
  type: IncidentType;
  count: number;
}

export interface ZoneCount {
  address: string;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  monthlyTrends: MonthlyTrend[];
  hourlyDensity: HourlyDensity[];
  incidentTypes: IncidentTypeCount[];
  topZones: ZoneCount[];
}

export const analyticsKeys = {
  all: ["analytics"] as const,
};

function fetchAnalytics() {
  return api.get<AnalyticsData>("/admin/analytics");
}

export function analyticsQueryOptions() {
  return queryOptions({
    queryKey: analyticsKeys.all,
    queryFn: fetchAnalytics,
  });
}

export function useAnalytics() {
  return useQuery(analyticsQueryOptions());
}
