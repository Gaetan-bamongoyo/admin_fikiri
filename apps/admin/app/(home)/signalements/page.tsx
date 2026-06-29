"use client";

import { useMemo, useState } from "react";
import { Activity, Calendar, MapPin, Search, User } from "lucide-react";

import { Card } from "@fikiri/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fikiri/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@fikiri/ui/components/tabs";
import { cn } from "@fikiri/ui/lib/utils";

import { QueryError, QueryLoading } from "@/app/_components/query-state";
import { formatDateTime, trafficConditionMeta } from "@/app/_lib/presentation";
import {
  useTrafficReports,
  type TrafficReport,
} from "@/app/_lib/queries/traffic-reports";
import type { TrafficCondition } from "@/app/_lib/queries/types";

const CONDITIONS: { value: TrafficCondition | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "fluid", label: "Fluide" },
  { value: "moderate", label: "Léger" },
  { value: "heavy", label: "Modéré" },
  { value: "blocked", label: "Dense" },
];

function conditionBadgeClass(condition: TrafficCondition): string {
  const level = trafficConditionMeta[condition].level;
  return `bg-traffic-${level}/15 text-traffic-${level}`;
}

export default function SignalementsPage() {
  const { data, isPending, isError } = useTrafficReports({ limit: 100 });
  const [activeTab, setActiveTab] = useState<TrafficCondition | "all">("all");
  const [query, setQuery] = useState("");

  const reports = useMemo(() => data?.data ?? [], [data]);

  const summary = useMemo(() => {
    const count = (c: TrafficCondition) =>
      reports.filter((r) => r.condition === c).length;
    return [
      {
        key: "total",
        label: "Total signalements",
        value: reports.length,
        colorClass: "text-brand",
      },
      {
        key: "fluid",
        label: "Fluide",
        value: count("fluid"),
        colorClass: "text-traffic-fluide",
      },
      {
        key: "heavy",
        label: "Modéré",
        value: count("heavy"),
        colorClass: "text-traffic-modere",
      },
      {
        key: "blocked",
        label: "Dense / bloqué",
        value: count("blocked"),
        colorClass: "text-traffic-dense",
      },
    ];
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (activeTab !== "all" && r.condition !== activeTab) return false;
      if (!q) return true;
      return (
        (r.userId ?? "").toLowerCase().includes(q) ||
        `${r.latitude},${r.longitude}`.includes(q)
      );
    });
  }, [reports, activeTab, query]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Signalements de Trafic
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signalements de condition de circulation remontés par les usagers
        </p>
      </div>

      {isError ? (
        <QueryError className="h-64" />
      ) : isPending ? (
        <QueryLoading className="h-64" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((s) => (
              <Card key={s.key} className="p-5">
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight",
                    s.colorClass
                  )}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Liste des signalements
              </h2>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher (auteur, coordonnées)..."
                  className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TrafficCondition | "all")}
              className="mt-4"
            >
              <TabsList>
                {CONDITIONS.map((c) => (
                  <TabsTrigger key={c.value} value={c.value}>
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Condition</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Date/Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Aucun signalement ne correspond.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((report: TrafficReport) => {
                      const { date, time } = formatDateTime(report.createdAt);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                                conditionBadgeClass(report.condition)
                              )}
                            >
                              <Activity className="size-3.5" />
                              {trafficConditionMeta[report.condition].label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-foreground">
                              <MapPin className="size-4 text-muted-foreground" />
                              {Number(report.latitude).toFixed(5)},{" "}
                              {Number(report.longitude).toFixed(5)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-foreground">
                              <User className="size-4 text-muted-foreground" />
                              {report.userId
                                ? report.userId.slice(0, 8)
                                : "Anonyme"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              <div className="leading-tight">
                                <p className="text-foreground">{date}</p>
                                <p className="text-xs text-muted-foreground">
                                  {time}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
