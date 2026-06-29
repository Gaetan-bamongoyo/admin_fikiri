import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api-client";
import type { PaginatedResponse } from "./types";

export type ApiUserRole = "user" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: ApiUserRole;
  isActive: boolean;
  loyaltyPoints: number;
  createdAt: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}

export interface UserPreferences {
  homeLatitude?: string | null;
  homeLongitude?: string | null;
  workLatitude?: string | null;
  workLongitude?: string | null;
  notificationsEnabled: boolean;
  anticipatoryAlertsEnabled: boolean;
  anonymizePositionData: boolean;
  searchMetro: string;
  trafficRegionAlertsEnabled: boolean;
  routeIncidentAlertsEnabled: boolean;
  departureReminderMinutes: number;
  homeTrafficAlertsEnabled: boolean;
  workTrafficAlertsEnabled: boolean;
}

export interface UserDetail {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: ApiUserRole;
  loyaltyPoints: number;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: ApiUserRole;
}

// `type` (et non `interface`) pour la signature d'index requise par les params du client API.
export type UsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: ApiUserRole;
  isActive?: boolean;
};

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UsersQuery) => [...userKeys.lists(), filters] as const,
  stats: () => [...userKeys.all, "stats"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

function fetchUsers(query: UsersQuery = {}) {
  return api.get<PaginatedResponse<AdminUser>>("/users", { params: query });
}

function fetchUserStats() {
  return api.get<UserStats>("/users/stats");
}

export function usersQueryOptions(query: UsersQuery = {}) {
  return queryOptions({
    queryKey: userKeys.list(query),
    queryFn: () => fetchUsers(query),
  });
}

export function userStatsQueryOptions() {
  return queryOptions({
    queryKey: userKeys.stats(),
    queryFn: fetchUserStats,
  });
}

export function useUsers(query: UsersQuery = {}) {
  return useQuery(usersQueryOptions(query));
}

export function useUserStats() {
  return useQuery(userStatsQueryOptions());
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? "none"),
    queryFn: () => api.get<UserDetail>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post<AdminUser>("/users", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: ApiUserRole }) =>
      api.patch<AdminUser>(`/users/${id}/role`, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<AdminUser>(`/users/${id}/status`, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
