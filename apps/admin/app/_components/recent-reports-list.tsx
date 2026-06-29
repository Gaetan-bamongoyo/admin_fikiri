"use client";

import { MapPin } from "lucide-react";

import { Badge } from "@fikiri/ui/components/badge";

import { useTrafficReports } from "@/app/_lib/queries/traffic-reports";
import { formatDateTime, trafficConditionMeta } from "@/app/_lib/presentation";
import { QueryError, QueryLoading } from "./query-state";

/** Liste des derniers signalements de trafic, à la manière d'un fil d'activité. */
export function RecentReportsList() {
  const { data, isPending, isError } = useTrafficReports({ limit: 7 });

  if (isError) return <QueryError className="h-64" />;
  if (isPending) return <QueryLoading className="h-64" />;

  const reports = data.data;

  if (reports.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucun signalement récent.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-foreground/5">
      {reports.map((report) => {
        const meta = trafficConditionMeta[report.condition];
        const { date, time } = formatDateTime(report.createdAt);
        return (
          <li
            key={report.id}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklch, var(--color-traffic-${meta.level}) 15%, transparent)`,
                color: `var(--color-traffic-${meta.level})`,
              }}
            >
              <MapPin className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                Signalement · {meta.label}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {Number(report.latitude).toFixed(4)},{" "}
                {Number(report.longitude).toFixed(4)}
              </p>
            </div>

            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <p>{date}</p>
              <p>{time}</p>
            </div>

            <Badge
              variant="outline"
              className="shrink-0 gap-1.5"
              style={{
                color: `var(--color-traffic-${meta.level})`,
                borderColor: `color-mix(in oklch, var(--color-traffic-${meta.level}) 35%, transparent)`,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: `var(--color-traffic-${meta.level})` }}
              />
              {meta.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
