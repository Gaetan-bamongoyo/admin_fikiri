"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock, TriangleAlert } from "lucide-react";

import {
  ReportSummaryCard,
  type ReportSummary,
} from "@/app/_components/report-summary-card";
import { IncidentDetailDialog } from "@/app/_components/incident-detail-dialog";
import { ReportsTable, type ReportRow } from "@/app/_components/reports-table";
import { QueryError, QueryLoading } from "@/app/_components/query-state";
import {
  useReports,
  useResolveReport,
  useVerifyReport,
  type Incident,
} from "@/app/_lib/queries/reports";
import {
  formatDateTime,
  incidentSeverity,
  incidentTypeLabel,
  toReportStatus,
} from "@/app/_lib/presentation";

function toRow(incident: Incident): ReportRow {
  const { date, time } = formatDateTime(incident.createdAt);
  return {
    id: incident.id,
    location: incident.address ?? "Localisation inconnue",
    description: incident.description ?? "—",
    type: incidentTypeLabel[incident.type],
    severity: incidentSeverity[incident.type],
    status: toReportStatus(incident),
    reporter: incident.reporterId.slice(0, 8),
    date,
    time,
  };
}

function buildSummary(rows: ReportRow[]): ReportSummary[] {
  const count = (status: ReportRow["status"]) =>
    rows.filter((r) => r.status === status).length;
  return [
    {
      key: "total",
      label: "Total Rapports",
      value: rows.length,
      icon: TriangleAlert,
      colorClass: "text-brand",
    },
    {
      key: "en-attente",
      label: "En attente",
      value: count("en-attente"),
      icon: Clock,
      colorClass: "text-traffic-modere",
    },
    {
      key: "verifie",
      label: "Vérifiés",
      value: count("verifie"),
      icon: BadgeCheck,
      colorClass: "text-traffic-leger",
    },
    {
      key: "resolu",
      label: "Résolus",
      value: count("resolu"),
      icon: CheckCircle2,
      colorClass: "text-traffic-fluide",
    },
  ];
}

export default function RapportsPage() {
  const { data, isPending, isError } = useReports({ limit: 100 });
  const verify = useVerifyReport();
  const resolve = useResolveReport();
  const [detailIncidentId, setDetailIncidentId] = useState<string | null>(null);

  const rows = useMemo(() => data?.data.map(toRow) ?? [], [data]);
  const pendingId = verify.isPending
    ? verify.variables
    : resolve.isPending
      ? resolve.variables
      : null;

  return (
    <>
      {/* En-tête de page */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Rapports de Trafic
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérer tous les rapports d&apos;incidents
        </p>
      </div>

      {isError ? (
        <QueryError className="h-64" />
      ) : isPending ? (
        <QueryLoading className="h-64" />
      ) : (
        <>
          {/* Cartes de synthèse */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buildSummary(rows).map((summary) => (
              <ReportSummaryCard key={summary.key} summary={summary} />
            ))}
          </div>

          {/* Liste des rapports */}
          <ReportsTable
            data={rows}
            onVerify={(id) => verify.mutate(id)}
            onResolve={(id) => resolve.mutate(id)}
            onView={setDetailIncidentId}
            pendingId={pendingId}
          />
        </>
      )}

      <IncidentDetailDialog
        incidentId={detailIncidentId}
        onClose={() => setDetailIncidentId(null)}
      />
    </>
  );
}
