import { Users } from "lucide-react";

import { lastTrips } from "../_lib/fleet-data";

/** Panneau « Dernier trajet » : timeline départ → arrivée. */
export function LastTripList() {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Dernier trajet</h2>
        <button
          type="button"
          className="text-sm font-medium text-traffic-fluide transition-opacity hover:opacity-80"
        >
          Tout voir
        </button>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {lastTrips.map((trip) => (
          <li key={trip.id} className="py-3 first:pt-0">
            <div className="flex items-start gap-3">
              {/* Timeline départ → arrivée */}
              <div className="mt-1 flex flex-col items-center gap-1">
                <span className="size-2.5 rounded-full bg-traffic-modere" />
                <span className="h-6 w-px bg-border" />
                <span className="size-2.5 rounded-full border-2 border-traffic-modere" />
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{trip.startTime}</span>{" "}
                    <span className="text-muted-foreground">{trip.startAddress}</span>
                  </p>
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {trip.line}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{trip.endTime}</span>{" "}
                    <span className="text-muted-foreground">{trip.endAddress}</span>
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                    <Users className="size-3.5 text-muted-foreground" />
                    {trip.passengers}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
