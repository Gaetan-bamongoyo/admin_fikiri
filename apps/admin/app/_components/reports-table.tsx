"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Eye,
  ListFilter,
  Loader2,
  MapPin,
  Search,
  User,
} from "lucide-react";

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

import {
  reportStatusMeta,
  severityMeta,
  type ReportSeverity,
  type ReportStatus,
} from "../_lib/presentation";

export interface ReportRow {
  id: string;
  location: string;
  description: string;
  type: string;
  severity: ReportSeverity;
  status: ReportStatus;
  reporter: string;
  date: string;
  time: string;
}

const tabs: { value: string; label: string; status: ReportStatus | null }[] = [
  { value: "tous", label: "Tous", status: null },
  { value: "en-attente", label: "En attente", status: "en-attente" },
  { value: "verifie", label: "Vérifiés", status: "verifie" },
  { value: "resolu", label: "Résolus", status: "resolu" },
];

interface ReportsTableProps {
  data: ReportRow[];
  onVerify?: (id: string) => void;
  onResolve?: (id: string) => void;
  /** Ouvre la fiche détaillée d'un incident. */
  onView?: (id: string) => void;
  /** Id de la ligne dont une action est en cours. */
  pendingId?: string | null;
}

export function ReportsTable({
  data,
  onVerify,
  onResolve,
  onView,
  pendingId,
}: ReportsTableProps) {
  const [activeTab, setActiveTab] = useState("tous");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const status = tabs.find((t) => t.value === activeTab)?.status ?? null;
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return (
        r.location.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q)
      );
    });
  }, [activeTab, query, data]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* En-tête : titre + recherche + filtre type */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Liste des Rapports
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="h-9 w-56 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ListFilter className="size-4 text-muted-foreground" />
            Tous les types
          </button>
        </div>
      </div>

      {/* Onglets de statut */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tableau */}
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Localisation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Rapporteur</TableHead>
              <TableHead>Date/Heure</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Aucun rapport ne correspond à votre recherche.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((report) => {
                const severity = severityMeta[report.severity];
                const status = reportStatusMeta[report.status];
                const isPending = pendingId === report.id;
                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {report.location}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                        {report.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          severity.badgeClass
                        )}
                      >
                        {severity.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          status.badgeClass
                        )}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-foreground">
                        <User className="size-4 text-muted-foreground" />
                        {report.reporter}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="leading-tight">
                          <p className="text-foreground">{report.date}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.time}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPending ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {report.status === "en-attente" && onVerify ? (
                              <button
                                type="button"
                                onClick={() => onVerify(report.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-traffic-leger transition-colors hover:bg-accent"
                              >
                                <BadgeCheck className="size-4" />
                                Vérifier
                              </button>
                            ) : null}
                            {report.status !== "resolu" && onResolve ? (
                              <button
                                type="button"
                                onClick={() => onResolve(report.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-traffic-fluide transition-colors hover:bg-accent"
                              >
                                <CheckCircle2 className="size-4" />
                                Résoudre
                              </button>
                            ) : null}
                            {onView ? (
                              <button
                                type="button"
                                onClick={() => onView(report.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-accent"
                              >
                                <Eye className="size-4" />
                                Détails
                              </button>
                            ) : null}
                          </>
                        )}
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
  );
}
