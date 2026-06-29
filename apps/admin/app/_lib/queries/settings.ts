import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";

export interface AppSettings {
  id: string;
  appName: string;
  appDescription?: string | null;
  language: string;
  timezone: string;
  maintenanceMode: boolean;
  publicSignupEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateSettingsInput = Partial<
  Pick<
    AppSettings,
    | "appName"
    | "appDescription"
    | "language"
    | "timezone"
    | "maintenanceMode"
    | "publicSignupEnabled"
  >
>;

export const settingsKeys = {
  all: ["settings"] as const,
};

export function settingsQueryOptions() {
  return queryOptions({
    queryKey: settingsKeys.all,
    queryFn: () => api.get<AppSettings>("/settings"),
  });
}

export function useSettings() {
  return useQuery(settingsQueryOptions());
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) =>
      api.patch<AppSettings>("/settings", input),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.all, settings);
    },
  });
}
