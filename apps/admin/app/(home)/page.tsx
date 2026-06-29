"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock,
  Gauge,
  MapPin,
  TriangleAlert,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fikiri/ui/components/card";

import { StatCard, type Stat } from "@/app/_components/stat-card";
import { useAuth } from "@/app/_lib/auth";
import { RecentReportsList } from "@/app/_components/recent-reports-list";
import {
  TrafficAreaChart,
  type HourlyTrafficPoint,
} from "@/app/_components/traffic-area-chart";
import {
  TrafficDonutChart,
  type TrafficDonutPoint,
} from "@/app/_components/traffic-donut-chart";
import {
  ReportsBarChart,
  type MonthlyReportsPoint,
} from "@/app/_components/reports-bar-chart";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import { useDashboard, type DashboardData } from "@/app/_lib/queries/dashboard";
import {
  formatMonthShort,
  formatHourLabel,
  trafficConditionMeta,
} from "@/app/_lib/presentation";
import type { TrafficCondition } from "@/app/_lib/queries/types";

const numberFormat = new Intl.NumberFormat("fr-FR");

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const CONDITIONS: TrafficCondition[] = ["fluid", "moderate", "heavy", "blocked"];

function buildStats(stats: DashboardData["stats"]): Stat[] {
  return [
    {
      key: "active-users",
      label: "Utilisateurs Actifs",
      value: numberFormat.format(stats.activeUsers),
      icon: Users,
    },
    {
      key: "reports-today",
      label: "Rapports Aujourd'hui",
      value: numberFormat.format(stats.reportsToday),
      icon: TriangleAlert,
    },
    {
      key: "monitored-roads",
      label: "Routes Surveillées",
      value: numberFormat.format(stats.monitoredRoads),
      icon: MapPin,
    },
    {
      key: "total-incidents",
      label: "Total Incidents",
      value: numberFormat.format(stats.totalIncidents),
      icon: Clock,
    },
  ];
}

/** Répartit les conditions d'une heure en pourcentages empilés à 100. */
function toHourlyTraffic(
  hourly: DashboardData["hourlyTraffic"]
): HourlyTrafficPoint[] {
  return hourly.map((point) => {
    const total =
      CONDITIONS.reduce((sum, c) => sum + (point.conditions[c] ?? 0), 0) || 1;
    const pct = (c: TrafficCondition) =>
      Math.round(((point.conditions[c] ?? 0) / total) * 100);
    return {
      hour: formatHourLabel(point.hour),
      fluide: pct("fluid"),
      leger: pct("moderate"),
      modere: pct("heavy"),
      dense: pct("blocked"),
    };
  });
}

function toTrafficDonut(
  share: DashboardData["trafficShare"]
): TrafficDonutPoint[] {
  return share.map((s) => {
    const meta = trafficConditionMeta[s.condition];
    return { level: meta.level, label: meta.label, count: s.count };
  });
}

function toMonthlyReports(
  monthly: DashboardData["monthlyReports"]
): MonthlyReportsPoint[] {
  return monthly.map((m) => ({
    month: formatMonthShort(m.month),
    rapports: m.count,
  }));
}

/** Part de trafic fluide + léger sur l'ensemble des signalements (0–100). */
function fluidityIndex(share: DashboardData["trafficShare"]): number {
  const total = share.reduce((sum, s) => sum + s.count, 0) || 1;
  const smooth = share
    .filter((s) => s.condition === "fluid" || s.condition === "moderate")
    .reduce((sum, s) => sum + s.count, 0);
  return Math.round((smooth / total) * 100);
}

export default function DashboardPage() {
  const { data, isPending, isError } = useDashboard();
  const { user } = useAuth();

  const firstName =
    user?.firstName?.trim() ||
    user?.lastName?.trim() ||
    user?.email?.split("@")[0] ||
    "Admin";
  const today = dateFormat.format(new Date());

  return (
    <>
      {/* En-tête de page — accueil personnalisé */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bonjour, <span className="capitalize">{firstName}</span>
            <span aria-hidden className="text-2xl sm:text-3xl">
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {today} · Vue d&apos;ensemble du trafic à Kinshasa
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
        >
          <Activity className="size-4" />
          Rapport en direct
        </button>
      </div>

      {isError ? (
        <QueryError className="h-64" />
      ) : isPending ? (
        <QueryLoading className="h-64" />
      ) : (
        <>
          {/* Bandeau principal : indice de fluidité + appel à l'action */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Réseau routier · Kinshasa
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      Indice de fluidité
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Conditions actuelles
                    </p>
                    <p className="text-4xl font-bold tracking-tight text-foreground">
                      {fluidityIndex(data.trafficShare)}
                      <span className="ml-1 text-2xl text-muted-foreground">
                        %
                      </span>
                    </p>
                  </div>
                </div>

                {/* Jauge de fluidité */}
                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-traffic-fluide transition-all"
                      style={{ width: `${fluidityIndex(data.trafficShare)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Trafic dense</span>
                    <span>Trafic fluide</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/carte"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
                  >
                    <MapPin className="size-4" />
                    Voir la carte
                  </Link>
                  <Link
                    href="/signalements"
                    className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
                  >
                    <TriangleAlert className="size-4" />
                    Signalements
                  </Link>
                </div>
              </div>
            </Card>

            {/* Carte d'action mise en avant */}
            <Card
              className="relative overflow-hidden border-0 p-6 text-white ring-0"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--brand), oklch(0.38 0.15 280))",
              }}
            >
              <div
                aria-hidden
                className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10"
              />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex size-11 items-center justify-center rounded-full bg-white/15">
                    <Gauge className="size-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">
                    Analyses détaillées
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    Explorez les tendances par zone, heure de pointe et type
                    d&apos;incident pour anticiper la congestion.
                  </p>
                </div>
                <Link
                  href="/analytiques"
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-brand shadow-sm transition-colors hover:bg-white/90"
                >
                  Ouvrir les analytiques
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buildStats(data.stats).map((stat) => (
              <StatCard key={stat.key} stat={stat} />
            ))}
          </div>

          {/* Activité récente + répartition */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Derniers signalements</CardTitle>
                <Link
                  href="/signalements"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand/80"
                >
                  Voir tout
                  <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardContent>
                <RecentReportsList />
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader>
                <CardTitle>Répartition du Trafic</CardTitle>
              </CardHeader>
              <CardContent>
                <TrafficDonutChart data={toTrafficDonut(data.trafficShare)} />
              </CardContent>
            </Card>
          </div>

          {/* Trafic par heure */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle>Trafic par Heure</CardTitle>
            </CardHeader>
            <CardContent>
              <TrafficAreaChart data={toHourlyTraffic(data.hourlyTraffic)} />
            </CardContent>
          </Card>

          {/* Évolution mensuelle */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle>Évolution des Rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsBarChart data={toMonthlyReports(data.monthlyReports)} />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
