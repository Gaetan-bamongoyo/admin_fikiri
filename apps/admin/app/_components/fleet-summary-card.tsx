import { Bus, ChevronLeft, ChevronRight, Layers, Route, Users } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

import { trafficLevelByKey, type TrafficLevel } from "../_lib/fleet-data";

export interface FleetFeatured {
  name: string;
  level: TrafficLevel;
  distanceKm: number;
  passengers: number;
  capacity: number;
  /** Nombre total de véhicules de la flotte. */
  fleetSize: number;
}

/** Carte « Ma Flotte » : véhicule mis en avant + statistiques clés. */
export function FleetSummaryCard({
  featuredVehicle,
}: {
  featuredVehicle: FleetFeatured;
}) {
  const level = trafficLevelByKey[featuredVehicle.level];

  const stats = [
    {
      icon: Route,
      label: "Parcouru",
      value: `${featuredVehicle.distanceKm} KM`,
    },
    {
      icon: Users,
      label: "Passagers",
      value: `${featuredVehicle.passengers}/${featuredVehicle.capacity}`,
    },
    {
      icon: Layers,
      label: "Flotte",
      value: `${featuredVehicle.fleetSize} véhicules`,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Ma Flotte</h2>
        <button
          type="button"
          className="text-sm font-medium text-traffic-fluide transition-opacity hover:opacity-80"
        >
          Tout voir
        </button>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <button
          type="button"
          aria-label="Véhicule précédent"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight tracking-tight text-traffic-modere">
            {featuredVehicle.name}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
              level.badgeClass
            )}
          >
            Trafic {level.label}
          </span>

          <dl className="mt-4 space-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <stat.icon className="size-4" />
                </span>
                <div>
                  <dd className="text-base font-bold text-foreground">{stat.value}</dd>
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex size-28 shrink-0 items-center justify-center self-center rounded-xl bg-muted/60 text-muted-foreground sm:size-32">
          <Bus className="size-16" strokeWidth={1.25} />
        </div>

        <button
          type="button"
          aria-label="Véhicule suivant"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}
