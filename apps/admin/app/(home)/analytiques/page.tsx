"use client";

import {
  Calendar,
  ChevronDown,
  Download,
  MapPin,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fikiri/ui/components/card";
import { cn } from "@fikiri/ui/lib/utils";

import {
  MonthlyTrendsChart,
  type MonthlyTrendPoint,
} from "@/app/_components/monthly-trends-chart";
import {
  HourlyDensityChart,
  type HourlyDensityPoint,
} from "@/app/_components/hourly-density-chart";
import {
  PeakHoursChart,
  type PeakHourPoint,
} from "@/app/_components/peak-hours-chart";
import {
  TopLocationsChart,
  type TopLocationPoint,
} from "@/app/_components/top-locations-chart";
import {
  IncidentTypesChart,
  type IncidentTypePoint,
} from "@/app/_components/incident-types-chart";
import { ZoneStatsList, type ZoneStat } from "@/app/_components/zone-stats-list";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import { useAnalytics, type AnalyticsData } from "@/app/_lib/queries/analytics";
import {
  formatHourLabel,
  formatMonthShort,
  incidentTypeLabel,
} from "@/app/_lib/presentation";

const numberFormat = new Intl.NumberFormat("fr-FR");
const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

interface SummaryCard {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
}

function buildSummary(summary: AnalyticsData["summary"]): SummaryCard[] {
  return [
    {
      key: "users",
      label: "Total Utilisateurs",
      value: numberFormat.format(summary.totalUsers),
      icon: Users,
      colorClass: "text-traffic-fluide",
    },
    {
      key: "reports",
      label: "Total Rapports",
      value: numberFormat.format(summary.totalReports),
      icon: TrendingUp,
      colorClass: "text-brand",
    },
    {
      key: "traffic-reports",
      label: "Signalements Trafic",
      value: numberFormat.format(summary.totalTrafficReports),
      icon: MapPin,
      colorClass: "text-traffic-modere",
    },
    {
      key: "resolved-rate",
      label: "Taux Résolution",
      value: percentFormat.format(summary.resolvedRate),
      icon: TrendingUp,
      colorClass: "text-traffic-leger",
    },
  ];
}

function toMonthlyTrends(
  trends: AnalyticsData["monthlyTrends"]
): MonthlyTrendPoint[] {
  return trends.map((t) => ({
    month: formatMonthShort(t.month),
    reports: t.reports,
    trafficReports: t.trafficReports,
    newUsers: t.newUsers,
  }));
}

function toHourlyDensity(
  density: AnalyticsData["hourlyDensity"]
): HourlyDensityPoint[] {
  return [...density]
    .sort((a, b) => a.hour - b.hour)
    .map((d) => ({ hour: formatHourLabel(d.hour), niveau: d.count }));
}

/** Six heures les plus chargées, déduites de la densité horaire. */
function toPeakHours(density: AnalyticsData["hourlyDensity"]): PeakHourPoint[] {
  return [...density]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .sort((a, b) => a.hour - b.hour)
    .map((d) => ({ slot: formatHourLabel(d.hour), count: d.count }));
}

function toTopLocations(zones: AnalyticsData["topZones"]): TopLocationPoint[] {
  return zones.map((z) => ({ name: z.address, reports: z.count }));
}

function toIncidentTypes(
  types: AnalyticsData["incidentTypes"]
): IncidentTypePoint[] {
  const max = Math.max(1, ...types.map((t) => t.count));
  return types.map((t) => ({
    type: incidentTypeLabel[t.type],
    value: Math.round((t.count / max) * 100),
  }));
}

function toZoneStats(zones: AnalyticsData["topZones"]): ZoneStat[] {
  return zones.map((z, i) => ({
    rank: i + 1,
    name: z.address,
    reports: z.count,
    perDay: Math.round(z.count / 30),
  }));
}

export default function AnalytiquesPage() {
  const { data, isPending, isError } = useAnalytics();

  return (
    <>
      {/* En-tête de page */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Analytiques
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Statistiques détaillées et insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Calendar className="size-4 text-muted-foreground" />
            30 derniers
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
          >
            <Download className="size-4" />
            Exporter
          </button>
        </div>
      </div>

      {isError ? (
        <QueryError className="h-64" />
      ) : isPending ? (
        <QueryLoading className="h-64" />
      ) : (
        <>
          {/* Cartes de synthèse */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buildSummary(data.summary).map(
              ({ key, label, value, icon: Icon, colorClass }) => (
                <Card key={key} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {value}
                      </p>
                    </div>
                    <Icon className={cn("size-6 shrink-0", colorClass)} />
                  </div>
                </Card>
              )
            )}
          </div>

          {/* Tendances mensuelles */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle>Tendances Mensuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyTrendsChart data={toMonthlyTrends(data.monthlyTrends)} />
            </CardContent>
          </Card>

          {/* Densité horaire + heures de pointe */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-2">
              <CardHeader>
                <CardTitle>Densité Horaire</CardTitle>
              </CardHeader>
              <CardContent>
                <HourlyDensityChart data={toHourlyDensity(data.hourlyDensity)} />
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader>
                <CardTitle>Heures de Pointe</CardTitle>
              </CardHeader>
              <CardContent>
                <PeakHoursChart data={toPeakHours(data.hourlyDensity)} />
              </CardContent>
            </Card>
          </div>

          {/* Top localisations + types d'incidents */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-2">
              <CardHeader>
                <CardTitle>Top 5 Localisations</CardTitle>
              </CardHeader>
              <CardContent>
                <TopLocationsChart data={toTopLocations(data.topZones)} />
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader>
                <CardTitle>Types d&apos;Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <IncidentTypesChart data={toIncidentTypes(data.incidentTypes)} />
              </CardContent>
            </Card>
          </div>

          {/* Statistiques détaillées par zone */}
          <Card className="p-2">
            <CardHeader>
              <CardTitle>Statistiques Détaillées par Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneStatsList data={toZoneStats(data.topZones)} />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
