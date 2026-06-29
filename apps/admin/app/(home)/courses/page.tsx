"use client";

import {
  CheckCircle2,
  Clock,
  Coins,
  Navigation,
  Radio,
  Route,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@fikiri/ui/components/card";

import { RidesMap } from "@/app/_components/rides-map";
import { ActiveRidesPanel } from "@/app/_components/active-rides-panel";
import { RidesHistoryTable } from "@/app/_components/rides-history-table";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import { useActiveRides, useRides, useRidesStats } from "@/app/_lib/queries/rides";
import { useTracking } from "@/app/_lib/use-tracking";

const numberFormat = new Intl.NumberFormat("fr-FR");

interface StatCard {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
}

export default function CoursesPage() {
  const { connected, drivers } = useTracking();
  const stats = useRidesStats();
  const active = useActiveRides();
  const history = useRides({ limit: 100 });

  const activeRides = active.data ?? [];

  const cards: StatCard[] = stats.data
    ? [
        {
          key: "total",
          label: "Total courses",
          value: numberFormat.format(stats.data.totalRides),
          icon: Navigation,
          colorClass: "text-brand",
        },
        {
          key: "active",
          label: "En cours",
          value: numberFormat.format(stats.data.activeRides),
          icon: Radio,
          colorClass: "text-traffic-modere",
        },
        {
          key: "completed",
          label: "Terminées",
          value: numberFormat.format(stats.data.completedRides),
          icon: CheckCircle2,
          colorClass: "text-traffic-fluide",
        },
        {
          key: "distance",
          label: "Distance totale",
          value: `${numberFormat.format(stats.data.totalDistanceKm)} km`,
          icon: Route,
          colorClass: "text-traffic-leger",
        },
        {
          key: "avg",
          label: "Durée moyenne",
          value: `${stats.data.avgDurationMin} min`,
          icon: Clock,
          colorClass: "text-brand",
        },
        {
          key: "revenue",
          label: "Revenus",
          value: `${numberFormat.format(stats.data.totalRevenue)} FC`,
          icon: Coins,
          colorClass: "text-traffic-fluide",
        },
      ]
    : [];

  return (
    <>
      {/* En-tête de page */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des courses et des chauffeurs en temps réel
          </p>
        </div>
        <span
          className={
            connected
              ? "inline-flex items-center gap-2 rounded-lg bg-traffic-fluide/10 px-3 py-2 text-sm font-medium text-traffic-fluide"
              : "inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"
          }
        >
          <Radio className="size-4" />
          {connected ? "Temps réel actif" : "Connexion temps réel…"}
        </span>
      </div>

      {/* Cartes de statistiques (chargement/erreur indépendants de la carte) */}
      {stats.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map(({ key, label, value, icon: Icon, colorClass }) => (
            <Card key={key} className="p-4">
              <Icon className={`size-5 ${colorClass}`} />
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      ) : stats.isError ? (
        <QueryError
          className="h-20"
          message="Statistiques indisponibles (API non authentifiée ?)."
        />
      ) : (
        <QueryLoading className="h-20" />
      )}

      {/* Carte live + courses en direct — toujours affichées (temps réel WebSocket) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <RidesMap drivers={drivers} rides={activeRides} />
        <ActiveRidesPanel rides={activeRides} connected={connected} />
      </div>

      {/* Historique */}
      {history.isError ? (
        <QueryError message="Historique indisponible (API non authentifiée ?)." />
      ) : history.isPending ? (
        <QueryLoading />
      ) : (
        <RidesHistoryTable data={history.data?.data ?? []} />
      )}
    </>
  );
}
