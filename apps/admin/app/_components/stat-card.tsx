import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

import { Card } from "@fikiri/ui/components/card";
import { cn } from "@fikiri/ui/lib/utils";

export interface Stat {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  /** Variation optionnelle (ex. « +12.5% »). */
  delta?: string;
  trend?: "up" | "down";
  /** Légende sous la variation (ex. « vs mois dernier »). */
  deltaCaption?: string;
}

export function StatCard({ stat }: { stat: Stat }) {
  const { label, value, delta, trend, deltaCaption, icon: Icon } = stat;
  const TrendIcon = trend === "up" ? ArrowUp : ArrowDown;

  return (
    <Card className="group p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
          <Icon className="size-5" />
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>

      {delta && trend ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              trend === "up"
                ? "bg-traffic-fluide/10 text-traffic-fluide"
                : "bg-traffic-dense/10 text-traffic-dense"
            )}
          >
            <TrendIcon className="size-3" />
            {delta}
          </span>
          {deltaCaption ? (
            <span className="text-muted-foreground">{deltaCaption}</span>
          ) : null}
        </p>
      ) : null}
    </Card>
  );
}
