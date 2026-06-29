"use client";

import { useMemo, useState } from "react";

import { Card } from "@fikiri/ui/components/card";
import { cn } from "@fikiri/ui/lib/utils";

import { CreateUserDialog } from "@/app/_components/create-user-dialog";
import { UserDetailDialog } from "@/app/_components/user-detail-dialog";
import { UsersTable, type UserRow } from "@/app/_components/users-table";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import {
  useUpdateUserStatus,
  useUserStats,
  useUsers,
  type AdminUser,
  type UserStats,
} from "@/app/_lib/queries/users";
import { formatDateTime } from "@/app/_lib/presentation";

const numberFormat = new Intl.NumberFormat("fr-FR");

function fullName(user: AdminUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

function toRow(user: AdminUser): UserRow {
  return {
    id: user.id,
    name: fullName(user),
    email: user.email,
    phone: user.phone ?? "—",
    role: user.role === "admin" ? "admin" : "utilisateur",
    active: user.isActive,
    points: user.loyaltyPoints,
    joinedAt: formatDateTime(user.createdAt).date,
  };
}

interface SummaryCard {
  key: string;
  label: string;
  value: string;
  colorClass: string;
}

function buildSummary(stats: UserStats): SummaryCard[] {
  return [
    {
      key: "total",
      label: "Total Utilisateurs",
      value: numberFormat.format(stats.total),
      colorClass: "text-foreground",
    },
    {
      key: "actifs",
      label: "Actifs",
      value: numberFormat.format(stats.active),
      colorClass: "text-traffic-fluide",
    },
    {
      key: "inactifs",
      label: "Inactifs",
      value: numberFormat.format(stats.inactive),
      colorClass: "text-traffic-modere",
    },
    {
      key: "admins",
      label: "Admins",
      value: numberFormat.format(stats.admins),
      colorClass: "text-brand",
    },
  ];
}

export default function UtilisateursPage() {
  const stats = useUserStats();
  const list = useUsers({ limit: 100 });
  const updateStatus = useUpdateUserStatus();
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const rows = useMemo(() => list.data?.data.map(toRow) ?? [], [list.data]);

  const isPending = stats.isPending || list.isPending;
  const isError = stats.isError || list.isError;

  return (
    <>
      {/* En-tête de page */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Gestion des Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérer tous les utilisateurs de la plateforme
          </p>
        </div>
        <CreateUserDialog />
      </div>

      {isError ? (
        <QueryError className="h-64" />
      ) : isPending ? (
        <QueryLoading className="h-64" />
      ) : (
        <>
          {/* Cartes de synthèse */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buildSummary(stats.data).map((summary) => (
              <Card key={summary.key} className="p-5">
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight",
                    summary.colorClass
                  )}
                >
                  {summary.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.label}
                </p>
              </Card>
            ))}
          </div>

          {/* Liste des utilisateurs */}
          <UsersTable
            data={rows}
            onView={setDetailUserId}
            onToggleStatus={(id, isActive) =>
              updateStatus.mutate({ id, isActive })
            }
            pendingId={
              updateStatus.isPending ? updateStatus.variables?.id : null
            }
          />
        </>
      )}

      <UserDetailDialog
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </>
  );
}
