import {
  Clock,
  MapPin,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Données de la page Analytiques (maquette statique). */

export interface AnalyticsSummary {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
}

export const analyticsSummary: AnalyticsSummary[] = [
  {
    key: "growth",
    label: "Croissance Utilisateurs",
    value: "+24.5%",
    icon: TrendingUp,
    colorClass: "text-traffic-fluide",
  },
  {
    key: "avg-time",
    label: "Temps Moyen",
    value: "42 min",
    icon: Clock,
    colorClass: "text-brand",
  },
  {
    key: "active-zones",
    label: "Zones Actives",
    value: "156",
    icon: MapPin,
    colorClass: "text-traffic-modere",
  },
  {
    key: "resolution-rate",
    label: "Taux Résolution",
    value: "87.3%",
    icon: TrendingUp,
    colorClass: "text-traffic-leger",
  },
];

/** Tendances mensuelles — 3 séries. */
export interface MonthlyTrend {
  month: string;
  rapports: number;
  utilisateurs: number;
  incidents: number;
}

export const monthlyTrends: MonthlyTrend[] = [
  { month: "Jan", rapports: 2400, utilisateurs: 1200, incidents: 400 },
  { month: "Fév", rapports: 2750, utilisateurs: 1450, incidents: 480 },
  { month: "Mar", rapports: 3200, utilisateurs: 1650, incidents: 550 },
  { month: "Avr", rapports: 2900, utilisateurs: 1550, incidents: 420 },
  { month: "Mai", rapports: 3500, utilisateurs: 1850, incidents: 600 },
  { month: "Juin", rapports: 4100, utilisateurs: 2150, incidents: 650 },
];

/** Densité horaire du trafic — niveau 0–100. */
export interface HourlyDensity {
  hour: string;
  niveau: number;
}

export const hourlyDensity: HourlyDensity[] = [
  { hour: "00h", niveau: 15 },
  { hour: "02h", niveau: 8 },
  { hour: "04h", niveau: 9 },
  { hour: "06h", niveau: 30 },
  { hour: "07h", niveau: 60 },
  { hour: "08h", niveau: 85 },
  { hour: "10h", niveau: 65 },
  { hour: "12h", niveau: 72 },
  { hour: "14h", niveau: 66 },
  { hour: "16h", niveau: 80 },
  { hour: "18h", niveau: 95 },
  { hour: "20h", niveau: 70 },
  { hour: "22h", niveau: 42 },
  { hour: "23h", niveau: 30 },
];

/** Heures de pointe — part embouteillages (rouge) vs fluide (vert) par créneau. */
export interface PeakHour {
  slot: string;
  embouteillages: number;
  fluide: number;
}

export const peakHours: PeakHour[] = [
  { slot: "07h-09h", embouteillages: 85, fluide: 15 },
  { slot: "09h-11h", embouteillages: 45, fluide: 55 },
  { slot: "11h-13h", embouteillages: 60, fluide: 40 },
  { slot: "13h-15h", embouteillages: 40, fluide: 60 },
  { slot: "15h-17h", embouteillages: 75, fluide: 25 },
  { slot: "17h-19h", embouteillages: 90, fluide: 25 },
];

/** Zones les plus signalées + statistiques détaillées. */
export interface ZoneStat {
  rank: number;
  name: string;
  reports: number;
  perDay: number;
}

export const zoneStats: ZoneStat[] = [
  { rank: 1, name: "Boulevard du 30 Juin", reports: 450, perDay: 15 },
  { rank: 2, name: "Avenue de la Libération", reports: 380, perDay: 13 },
  { rank: 3, name: "Avenue Kasa-Vubu", reports: 320, perDay: 11 },
  { rank: 4, name: "Boulevard Lumumba", reports: 280, perDay: 9 },
  { rank: 5, name: "Avenue Kabinda", reports: 250, perDay: 8 },
];

/** Répartition des types d'incidents (radar, 0–100). */
export interface IncidentType {
  type: string;
  value: number;
}

export const incidentTypes: IncidentType[] = [
  { type: "Embouteillage", value: 60 },
  { type: "Accident", value: 45 },
  { type: "Travaux", value: 25 },
  { type: "Manifestation", value: 15 },
  { type: "Panne", value: 20 },
  { type: "Météo", value: 30 },
];
