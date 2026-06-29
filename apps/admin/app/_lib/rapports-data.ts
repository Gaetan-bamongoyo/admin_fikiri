import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/** Données des rapports de trafic (maquette statique). */

export type ReportStatus = "en-attente" | "verifie" | "resolu";
export type ReportSeverity = "faible" | "moyen" | "eleve" | "critique";

export interface ReportStatusMeta {
  status: ReportStatus;
  label: string;
  /** Pastille colorée (badge doux). */
  badgeClass: string;
}

export const reportStatuses: ReportStatusMeta[] = [
  {
    status: "en-attente",
    label: "En attente",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  {
    status: "verifie",
    label: "Vérifié",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
  },
  {
    status: "resolu",
    label: "Résolu",
    badgeClass: "bg-traffic-fluide/15 text-traffic-fluide",
  },
];

export const reportStatusByKey: Record<ReportStatus, ReportStatusMeta> =
  Object.fromEntries(reportStatuses.map((s) => [s.status, s])) as Record<
    ReportStatus,
    ReportStatusMeta
  >;

export interface ReportSeverityMeta {
  severity: ReportSeverity;
  label: string;
  badgeClass: string;
}

export const reportSeverities: Record<ReportSeverity, ReportSeverityMeta> = {
  faible: {
    severity: "faible",
    label: "Faible",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
  },
  moyen: {
    severity: "moyen",
    label: "Moyen",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  eleve: {
    severity: "eleve",
    label: "Élevé",
    badgeClass: "bg-traffic-dense/15 text-traffic-dense",
  },
  critique: {
    severity: "critique",
    label: "Critique",
    badgeClass: "bg-destructive/15 text-destructive",
  },
};

export interface Report {
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

export const reports: Report[] = [
  {
    id: "rep-1",
    location: "Boulevard du 30 Juin, Gombe",
    description: "Trafic très dense sur toute la longueur du boulevard",
    type: "Embouteillage",
    severity: "eleve",
    status: "en-attente",
    reporter: "Jean Mukendi",
    date: "01/06/2024",
    time: "08:30",
  },
  {
    id: "rep-2",
    location: "Avenue de la Libération, Kinshasa",
    description: "Collision entre deux véhicules bloquant la circulation",
    type: "Accident",
    severity: "critique",
    status: "verifie",
    reporter: "Marie Kalala",
    date: "01/06/2024",
    time: "07:45",
  },
  {
    id: "rep-3",
    location: "Avenue Kasa-Vubu, Kalamu",
    description: "Réfection de la chaussée, une voie fermée",
    type: "Travaux",
    severity: "moyen",
    status: "verifie",
    reporter: "Pierre Kabamba",
    date: "01/06/2024",
    time: "06:15",
  },
  {
    id: "rep-4",
    location: "Boulevard Lumumba, Limete",
    description: "Trafic léger, circulation fluide maintenant",
    type: "Embouteillage",
    severity: "faible",
    status: "resolu",
    reporter: "Sophie Mbuyi",
    date: "01/06/2024",
    time: "05:00",
  },
  {
    id: "rep-5",
    location: "Avenue Kabinda, Ngaliema",
    description: "Rassemblement bloquant partiellement la voie",
    type: "Manifestation",
    severity: "eleve",
    status: "en-attente",
    reporter: "André Tshimanga",
    date: "01/06/2024",
    time: "09:00",
  },
];

/** Onglets de filtrage (status null = tous). */
export interface ReportTab {
  value: string;
  label: string;
  status: ReportStatus | null;
}

export const reportTabs: ReportTab[] = [
  { value: "tous", label: "Tous", status: null },
  { value: "en-attente", label: "En attente", status: "en-attente" },
  { value: "verifie", label: "Vérifiés", status: "verifie" },
  { value: "resolu", label: "Résolus", status: "resolu" },
];

export interface ReportSummary {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  /** Couleur du chiffre + icône. */
  colorClass: string;
}

export const reportSummary: ReportSummary[] = [
  {
    key: "total",
    label: "Total Rapports",
    value: reports.length,
    icon: TriangleAlert,
    colorClass: "text-brand",
  },
  {
    key: "en-attente",
    label: "En attente",
    value: reports.filter((r) => r.status === "en-attente").length,
    icon: Clock,
    colorClass: "text-traffic-modere",
  },
  {
    key: "verifie",
    label: "Vérifiés",
    value: reports.filter((r) => r.status === "verifie").length,
    icon: BadgeCheck,
    colorClass: "text-traffic-leger",
  },
  {
    key: "resolu",
    label: "Résolus",
    value: reports.filter((r) => r.status === "resolu").length,
    icon: CheckCircle2,
    colorClass: "text-traffic-fluide",
  },
];
