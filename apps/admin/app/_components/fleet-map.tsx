import { Bus, BusFront, CarTaxiFront, MapPin, Minus, Plus } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

import {
  mapMarkers,
  routeSegments,
  trafficLevelByKey,
  trafficLevels,
} from "../_lib/fleet-data";

const kindIcon = { bus: Bus, minibus: BusFront, taxi: CarTaxiFront } as const;

/** Carte stylisée (maquette) : parcours coloré par niveau de trafic. */
export function FleetMap() {
  return (
    <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-muted/40 lg:h-[520px]">
      {/* Quadrillage de fond évoquant une carte */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--color-border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--color-border)_60%,transparent)_1px,transparent_1px)] bg-size-[64px_64px]"
      />

      {/* Tracé du parcours, coloré par niveau de trafic */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {routeSegments.map((segment, i) => (
          <polyline
            key={i}
            points={segment.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={trafficLevelByKey[segment.level].stroke}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Contrôles de zoom */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {[Plus, Minus].map((Icon, i) => (
          <button
            key={i}
            type="button"
            aria-label={i === 0 ? "Zoomer" : "Dézoomer"}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Étiquette du véhicule suivi */}
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
        <span className="size-3 rounded-full border-2 border-traffic-fluide" />
        Bus L12
      </div>

      {/* Marqueurs */}
      {mapMarkers.map((marker) => {
        const Icon = kindIcon[marker.kind];
        return (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            {marker.pinLevel ? (
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-white shadow-md ring-4 ring-white/60",
                  trafficLevelByKey[marker.pinLevel].dotClass
                )}
              >
                <MapPin className="size-5" />
              </span>
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-card text-foreground shadow-md ring-1 ring-border">
                <Icon className="size-4" />
              </span>
            )}
          </div>
        );
      })}

      {/* Légende des niveaux de trafic */}
      <div className="absolute bottom-4 left-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
        <p className="mb-2 text-sm font-semibold text-foreground">Niveaux de trafic</p>
        <ul className="space-y-1.5">
          {trafficLevels.map((level) => (
            <li
              key={level.level}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span className={cn("size-3 rounded-full", level.dotClass)} />
              {level.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
