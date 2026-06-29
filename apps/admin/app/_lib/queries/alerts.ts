import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";

export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: string;
  userId: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: string;
}

export const alertsKeys = {
  all: ["alerts"] as const,
};

export function alertsQueryOptions() {
  return queryOptions({
    queryKey: alertsKeys.all,
    queryFn: () => api.get<Alert[]>("/alerts/me"),
  });
}

export function useAlerts() {
  return useQuery(alertsQueryOptions());
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ success: boolean }>(`/alerts/${id}/read`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Alert[]>(alertsKeys.all, (current) =>
        current?.map((alert) =>
          alert.id === id ? { ...alert, isRead: true } : alert
        )
      );
    },
  });
}
