"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import type { Vehicle } from "../_lib/queries/vehicles";
import type { TrafficCondition } from "../_lib/queries/types";
import type { TrafficLevel } from "../_lib/fleet-data";
import type { MapMarkerPoint } from "./map";

/**
 * Carte temps réel de la flotte : enveloppe la carte Leaflet (`./map`) dans un
 * chargement dynamique `ssr: false` — Leaflet accède à `window` et ne peut pas
 * être rendu côté serveur — et convertit les véhicules en marqueurs.
 */
const LeafletMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

/** Conditions de trafic de l'API → niveaux d'affichage de la charte. */
const conditionToLevel: Record<TrafficCondition, TrafficLevel> = {
  fluid: "fluide",
  moderate: "leger",
  heavy: "modere",
  blocked: "bloque",
};

/** Véhicule → marqueur, en ignorant ceux sans position GPS exploitable. */
function toMarker(vehicle: Vehicle): MapMarkerPoint | null {
  if (vehicle.latitude == null || vehicle.longitude == null) return null;
  const lat = Number(vehicle.latitude);
  const lng = Number(vehicle.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    id: vehicle.id,
    name: vehicle.name,
    lat,
    lng,
    level: conditionToLevel[vehicle.trafficCondition],
  };
}

export function FleetLiveMap({ vehicles }: { vehicles: Vehicle[] }) {
  const markers = useMemo(
    () =>
      vehicles
        .map(toMarker)
        .filter((marker): marker is MapMarkerPoint => marker !== null),
    [vehicles],
  );

  return (
    <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-muted/40 lg:h-[520px]">
      <LeafletMap markers={markers} />
    </div>
  );
}
