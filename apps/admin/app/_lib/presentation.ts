/**
 * Helpers de présentation : formatage et mappages entre les valeurs
 * renvoyées par l'API et les libellés/couleurs utilisés à l'écran.
 */
import type { Incident, IncidentType } from "./queries/incidents";
import type { RideStatus } from "./queries/rides";
import type { TrafficCondition } from "./queries/types";

/** Libellés courts des mois en français, indexés par numéro (0–11). */
const MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

/** `"2024-06"` → `"Juin"`. Renvoie l'entrée brute si le format est inattendu. */
export function formatMonthShort(month: string): string {
  const monthIndex = Number(month.slice(5, 7)) - 1;
  return MONTHS_SHORT[monthIndex] ?? month;
}

/** `8` → `"08h"`. */
export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`;
}

/** `"2024-06-01T08:30:00Z"` → `{ date: "01/06/2024", time: "08:30" }`. */
export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: d.toLocaleDateString("fr-FR"),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/* ------------------------------------------------------------------ */
/* Conditions de trafic                                               */
/* ------------------------------------------------------------------ */

/** Niveau d'affichage (correspond aux variables `--color-traffic-*`). */
export type TrafficLevel = "fluide" | "leger" | "modere" | "dense";

export const trafficConditionMeta: Record<
  TrafficCondition,
  { level: TrafficLevel; label: string }
> = {
  fluid: { level: "fluide", label: "Fluide" },
  moderate: { level: "leger", label: "Léger" },
  heavy: { level: "modere", label: "Modéré" },
  blocked: { level: "dense", label: "Dense" },
};

/* ------------------------------------------------------------------ */
/* Types d'incidents                                                  */
/* ------------------------------------------------------------------ */

export const incidentTypeLabel: Record<IncidentType, string> = {
  congestion: "Embouteillage",
  accident: "Accident",
  roadwork: "Travaux",
  checkpoint: "Contrôle",
  danger: "Danger",
  clear: "Voie libre",
};

export type ReportSeverity = "faible" | "moyen" | "eleve" | "critique";

/** Sévérité approchée déduite du type d'incident (l'API ne la fournit pas). */
export const incidentSeverity: Record<IncidentType, ReportSeverity> = {
  congestion: "moyen",
  accident: "critique",
  roadwork: "moyen",
  checkpoint: "faible",
  danger: "eleve",
  clear: "faible",
};

export const severityMeta: Record<
  ReportSeverity,
  { label: string; badgeClass: string }
> = {
  faible: {
    label: "Faible",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
  },
  moyen: {
    label: "Moyen",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  eleve: {
    label: "Élevé",
    badgeClass: "bg-traffic-dense/15 text-traffic-dense",
  },
  critique: {
    label: "Critique",
    badgeClass: "bg-destructive/15 text-destructive",
  },
};

/* ------------------------------------------------------------------ */
/* Statut « rapport » côté admin                                      */
/* ------------------------------------------------------------------ */

/** Seuil de confirmations à partir duquel un incident est « vérifié ». */
export const CONFIRMATION_THRESHOLD = 3;

export type ReportStatus = "en-attente" | "verifie" | "resolu";

export const reportStatusMeta: Record<
  ReportStatus,
  { label: string; badgeClass: string }
> = {
  "en-attente": {
    label: "En attente",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  verifie: {
    label: "Vérifié",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
  },
  resolu: {
    label: "Résolu",
    badgeClass: "bg-traffic-fluide/15 text-traffic-fluide",
  },
};

/** Projette le statut technique d'un incident sur le statut admin affiché. */
export function toReportStatus(incident: Incident): ReportStatus {
  if (incident.status === "resolved" || incident.status === "expired") {
    return "resolu";
  }
  return incident.confirmationCount >= CONFIRMATION_THRESHOLD
    ? "verifie"
    : "en-attente";
}

/* ------------------------------------------------------------------ */
/* Statut des courses taxi                                            */
/* ------------------------------------------------------------------ */

export const rideStatusMeta: Record<
  RideStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  searching: {
    label: "Recherche chauffeur",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
    dotClass: "bg-traffic-modere",
  },
  assigned: {
    label: "Chauffeur assigné",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
    dotClass: "bg-traffic-leger",
  },
  en_route: {
    label: "En route",
    badgeClass: "bg-brand/15 text-brand",
    dotClass: "bg-brand",
  },
  in_progress: {
    label: "Course en cours",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
    dotClass: "bg-traffic-leger",
  },
  completed: {
    label: "Terminée",
    badgeClass: "bg-traffic-fluide/15 text-traffic-fluide",
    dotClass: "bg-traffic-fluide",
  },
  cancelled: {
    label: "Annulée",
    badgeClass: "bg-destructive/15 text-destructive",
    dotClass: "bg-destructive",
  },
};
