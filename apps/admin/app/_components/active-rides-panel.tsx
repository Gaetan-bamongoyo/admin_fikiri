import { ArrowRight, Radio } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

import type { Ride } from "../_lib/queries/rides";
import { rideStatusMeta } from "../_lib/presentation";

const numberFormat = new Intl.NumberFormat("fr-FR");

export function ActiveRidesPanel({
  rides,
  connected,
}: {
  rides: Ride[];
  connected: boolean;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Courses en direct
        </h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            connected ? "text-traffic-fluide" : "text-muted-foreground"
          )}
        >
          <Radio className="size-3.5" />
          {connected ? "En direct" : "Hors ligne"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {rides.length} course{rides.length > 1 ? "s" : ""} en cours
      </p>

      <ul className="mt-4 space-y-2">
        {rides.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Aucune course en cours.
          </li>
        ) : (
          rides.map((ride) => {
            const status = rideStatusMeta[ride.status];
            return (
              <li
                key={ride.id}
                className="rounded-xl border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                      status.badgeClass
                    )}
                  >
                    <span className={cn("size-2 rounded-full", status.dotClass)} />
                    {status.label}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {numberFormat.format(Number(ride.price))} FC
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="max-w-[120px] truncate font-medium text-foreground">
                    {ride.pickupAddress}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="max-w-[120px] truncate text-muted-foreground">
                    {ride.dropoffAddress}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {ride.driverName ?? "Chauffeur en attente"} ·{" "}
                  {numberFormat.format(Number(ride.distanceKm))} km ·{" "}
                  {ride.durationMin} min
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
