import {
  Users,
  TriangleAlert,
  MapPin,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type Trend = "up" | "down";

export interface Stat {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  icon: LucideIcon;
}

export const stats: Stat[] = [
  {
    key: "active-users",
    label: "Utilisateurs Actifs",
    value: "12,458",
    delta: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    key: "reports-today",
    label: "Rapports Aujourd'hui",
    value: "342",
    delta: "+8.2%",
    trend: "up",
    icon: TriangleAlert,
  },
  {
    key: "monitored-roads",
    label: "Routes Surveillées",
    value: "156",
    delta: "+3",
    trend: "up",
    icon: MapPin,
  },
  {
    key: "avg-time",
    label: "Temps Moyen",
    value: "42 min",
    delta: "-5.3%",
    trend: "down",
    icon: Clock,
  },
];

/** Trafic par heure — part relative (%) de chaque niveau, empilée à 100. */
export interface HourlyTraffic {
  hour: string;
  fluide: number;
  leger: number;
  modere: number;
  dense: number;
}

export const hourlyTraffic: HourlyTraffic[] = [
  { hour: "00:00", fluide: 80, leger: 12, modere: 5, dense: 3 },
  { hour: "04:00", fluide: 78, leger: 12, modere: 6, dense: 4 },
  { hour: "08:00", fluide: 20, leger: 30, modere: 30, dense: 20 },
  { hour: "12:00", fluide: 35, leger: 25, modere: 25, dense: 15 },
  { hour: "16:00", fluide: 15, leger: 25, modere: 40, dense: 20 },
  { hour: "20:00", fluide: 40, leger: 30, modere: 18, dense: 12 },
];

/** Répartition globale du trafic. */
export interface TrafficShare {
  level: string;
  label: string;
  value: number;
}

export const trafficShare: TrafficShare[] = [
  { level: "fluide", label: "Fluide", value: 45 },
  { level: "leger", label: "Léger", value: 28 },
  { level: "modere", label: "Modéré", value: 18 },
  { level: "dense", label: "Dense", value: 9 },
];

/** Évolution mensuelle du nombre de rapports. */
export interface MonthlyReports {
  month: string;
  rapports: number;
}

export const monthlyReports: MonthlyReports[] = [
  { month: "Jan", rapports: 2400 },
  { month: "Fév", rapports: 2800 },
  { month: "Mar", rapports: 3200 },
  { month: "Avr", rapports: 2900 },
  { month: "Mai", rapports: 3400 },
  { month: "Jun", rapports: 4100 },
];
