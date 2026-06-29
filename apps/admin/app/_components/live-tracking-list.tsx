import { Bus, BusFront, CarTaxiFront, Users } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

import {
  trafficLevelByKey,
  type TrafficLevel,
  type VehicleKind,
} from "../_lib/fleet-data";

const kindIcon = { bus: Bus, minibus: BusFront, taxi: CarTaxiFront } as const;

export interface LiveVehicle {
  id: string;
  name: string;
  kind: VehicleKind;
  line: string;
  passengers: number;
  capacity: number;
  level: TrafficLevel;
}

/** Panneau « Suivi en direct » : liste scrollable des véhicules. */
export function LiveTrackingList({
  vehicles,
  selectedId,
}: {
  vehicles: LiveVehicle[];
  selectedId?: string;
}) {
  const liveTrackingVehicles = vehicles;
  const selectedVehicleId = selectedId;
  const onRoad = liveTrackingVehicles.length;

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Suivi en direct</h2>
        <button
          type="button"
          className="text-sm font-medium text-traffic-fluide transition-opacity hover:opacity-80"
        >
          Tout voir
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{onRoad} véhicules en route</p>

      <ul className="mt-4 space-y-1">
        {liveTrackingVehicles.map((vehicle) => {
          const Icon = kindIcon[vehicle.kind];
          const level = trafficLevelByKey[vehicle.level];
          const selected = vehicle.id === selectedVehicleId;
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                  selected ? "bg-traffic-modere/10" : "hover:bg-accent/60"
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {vehicle.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{vehicle.line}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                      level.badgeClass
                    )}
                  >
                    {level.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {vehicle.passengers}/{vehicle.capacity}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
