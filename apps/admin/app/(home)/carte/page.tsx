"use client";

import { useMemo } from "react";
import { ChevronDown, Layers, Navigation } from "lucide-react";

import { FleetLiveMap } from "@/app/_components/fleet-live-map";
import {
  FleetSummaryCard,
  type FleetFeatured,
} from "@/app/_components/fleet-summary-card";
import {
  LiveTrackingList,
  type LiveVehicle,
} from "@/app/_components/live-tracking-list";
import { LastTripList } from "@/app/_components/last-trip-list";
import { ExpensesGrid } from "@/app/_components/expenses-grid";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import { useFleetSummary, useVehicles, type Vehicle } from "@/app/_lib/queries/vehicles";
import type { TrafficLevel } from "@/app/_lib/fleet-data";
import type { TrafficCondition } from "@/app/_lib/queries/types";

/** Conditions API → niveaux d'affichage de la flotte. */
const conditionToLevel: Record<TrafficCondition, TrafficLevel> = {
  fluid: "fluide",
  moderate: "leger",
  heavy: "modere",
  blocked: "bloque",
};

function toLiveVehicle(vehicle: Vehicle): LiveVehicle {
  return {
    id: vehicle.id,
    name: vehicle.name,
    kind: vehicle.kind,
    line: vehicle.line ?? "—",
    passengers: vehicle.passengers,
    capacity: vehicle.capacity,
    level: conditionToLevel[vehicle.trafficCondition],
  };
}

function toFeatured(vehicle: Vehicle, fleetSize: number): FleetFeatured {
  return {
    name: vehicle.name,
    level: conditionToLevel[vehicle.trafficCondition],
    distanceKm: Math.round(Number(vehicle.distanceKm) || 0),
    passengers: vehicle.passengers,
    capacity: vehicle.capacity,
    fleetSize,
  };
}

export default function CartePage() {
  const summary = useFleetSummary();
  const list = useVehicles({ limit: 100 });

  const vehicles = useMemo(() => list.data?.data ?? [], [list.data]);
  const liveVehicles = useMemo(() => vehicles.map(toLiveVehicle), [vehicles]);

  const isPending = summary.isPending || list.isPending;
  const isError = summary.isError || list.isError;

  const featured =
    vehicles.length > 0
      ? toFeatured(vehicles[0], summary.data?.total ?? vehicles.length)
      : null;

  return (
    <>
      {/* En-tête de page */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Carte en Temps Réel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi de la flotte à Kinshasa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Couches de la carte"
            className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Layers className="size-5" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Tous
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            aria-label="Me localiser"
            className="flex size-10 items-center justify-center rounded-lg bg-brand text-white shadow-sm transition-colors hover:bg-brand/90"
          >
            <Navigation className="size-5" />
          </button>
        </div>
      </div>

      {/* Disposition principale : zone carte/trajets à gauche, flotte à droite */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <FleetLiveMap vehicles={vehicles} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LastTripList />
            <ExpensesGrid />
          </div>
        </div>

        <div className="space-y-6">
          {isError ? (
            <QueryError />
          ) : isPending ? (
            <QueryLoading />
          ) : (
            <>
              {featured ? (
                <FleetSummaryCard featuredVehicle={featured} />
              ) : null}
              <LiveTrackingList
                vehicles={liveVehicles}
                selectedId={vehicles[0]?.id}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
