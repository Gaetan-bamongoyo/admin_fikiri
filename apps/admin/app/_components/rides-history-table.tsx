"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Clock, Route, Search, User } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fikiri/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@fikiri/ui/components/tabs";
import { cn } from "@fikiri/ui/lib/utils";

import type { Ride, RideStatus } from "../_lib/queries/rides";
import { formatDateTime, rideStatusMeta } from "../_lib/presentation";

const numberFormat = new Intl.NumberFormat("fr-FR");

const tabs: { value: string; label: string; status: RideStatus | null }[] = [
  { value: "tous", label: "Toutes", status: null },
  { value: "in_progress", label: "En cours", status: "in_progress" },
  { value: "completed", label: "Terminées", status: "completed" },
  { value: "cancelled", label: "Annulées", status: "cancelled" },
];

export function RidesHistoryTable({ data }: { data: Ride[] }) {
  const [activeTab, setActiveTab] = useState("tous");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const status = tabs.find((t) => t.value === activeTab)?.status ?? null;
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return (
        r.pickupAddress.toLowerCase().includes(q) ||
        r.dropoffAddress.toLowerCase().includes(q) ||
        (r.driverName?.toLowerCase().includes(q) ?? false) ||
        (r.passengerName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [activeTab, query, data]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Historique des courses
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-56 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Trajet</TableHead>
              <TableHead>Chauffeur</TableHead>
              <TableHead>Passager</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Aucune course ne correspond à votre recherche.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ride) => {
                const status = rideStatusMeta[ride.status];
                const { date, time } = formatDateTime(ride.createdAt);
                return (
                  <TableRow key={ride.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="max-w-[140px] truncate font-medium text-foreground">
                          {ride.pickupAddress}
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="max-w-[140px] truncate text-muted-foreground">
                          {ride.dropoffAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-foreground">
                        <User className="size-4 text-muted-foreground" />
                        {ride.driverName ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {ride.passengerName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Route className="size-4 text-muted-foreground" />
                        {numberFormat.format(Number(ride.distanceKm))} km
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Clock className="size-4 text-muted-foreground" />
                        {ride.durationMin} min
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {numberFormat.format(Number(ride.price))} FC
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          status.badgeClass
                        )}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="text-foreground">{date}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
