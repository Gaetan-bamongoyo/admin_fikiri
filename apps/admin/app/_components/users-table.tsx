"use client";

import { useMemo, useState } from "react";
import { Eye, Loader2, Power, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@fikiri/ui/components/avatar";
import {
  NativeSelect,
  NativeSelectOption,
} from "@fikiri/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fikiri/ui/components/table";
import { cn } from "@fikiri/ui/lib/utils";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "utilisateur" | "admin";
  active: boolean;
  points: number;
  joinedAt: string;
  avatarUrl?: string | null;
}

const roleMeta: Record<UserRow["role"], { label: string; badgeClass: string }> =
  {
    utilisateur: {
      label: "Utilisateur",
      // Style « contour » comme la maquette pour les rôles standard.
      badgeClass: "border border-border text-foreground",
    },
    admin: {
      label: "Admin",
      // Style « plein » pour le rôle privilégié.
      badgeClass: "bg-brand text-white",
    },
  };

/** Palette d'avatars colorés, sélectionnée de façon déterministe par utilisateur. */
const avatarPalette = [
  "bg-blue-500 text-white",
  "bg-rose-500 text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-cyan-500 text-white",
  "bg-indigo-500 text-white",
  "bg-pink-500 text-white",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length]!;
}

type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | UserRow["role"];

interface UsersTableProps {
  data: UserRow[];
  /** Bascule actif/inactif d'un utilisateur. */
  onToggleStatus?: (id: string, isActive: boolean) => void;
  /** Ouvre la fiche détaillée d'un utilisateur. */
  onView?: (id: string) => void;
  pendingId?: string | null;
}

export function UsersTable({
  data,
  onToggleStatus,
  onView,
  pendingId,
}: UsersTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((u) => {
      if (status === "active" && !u.active) return false;
      if (status === "inactive" && u.active) return false;
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    });
  }, [query, status, role, data]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* En-tête du panneau */}
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold text-foreground">Utilisateurs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comptes, rôles et statuts d&apos;accès.
        </p>
      </div>

      {/* Barre d'outils : recherche + filtres */}
      <div className="flex flex-wrap items-center gap-3 p-5">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filtrer par statut"
          className="h-9 [&>select]:h-9"
        >
          <NativeSelectOption value="all">Tous les statuts</NativeSelectOption>
          <NativeSelectOption value="active">Actifs</NativeSelectOption>
          <NativeSelectOption value="inactive">Inactifs</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
          aria-label="Filtrer par rôle"
          className="h-9 [&>select]:h-9"
        >
          <NativeSelectOption value="all">Tous les rôles</NativeSelectOption>
          <NativeSelectOption value="utilisateur">Utilisateur</NativeSelectOption>
          <NativeSelectOption value="admin">Admin</NativeSelectOption>
        </NativeSelect>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto px-5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Aucun utilisateur ne correspond à votre recherche.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const roleInfo = roleMeta[user.role];
                const isPending = pendingId === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-medium",
                              avatarColor(user.id)
                            )}
                          >
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Créé le {user.joinedAt}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          roleInfo.badgeClass
                        )}
                      >
                        {roleInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            user.active
                              ? "bg-traffic-fluide"
                              : "bg-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            user.active
                              ? "text-traffic-fluide"
                              : "text-muted-foreground"
                          )}
                        >
                          {user.active ? "Actif" : "Inactif"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {user.points}
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {onView ? (
                            <button
                              type="button"
                              onClick={() => onView(user.id)}
                              title="Voir les détails"
                              aria-label="Voir les détails"
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <Eye className="size-4" />
                            </button>
                          ) : null}
                          {onToggleStatus ? (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleStatus(user.id, !user.active)
                              }
                              title={user.active ? "Désactiver" : "Activer"}
                              aria-label={user.active ? "Désactiver" : "Activer"}
                              className={cn(
                                "inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-accent",
                                user.active
                                  ? "text-traffic-fluide"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Power className="size-4" />
                            </button>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pied : compteur */}
      <div className="p-5 text-sm text-muted-foreground">
        {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {data.length}.
      </div>
    </div>
  );
}
