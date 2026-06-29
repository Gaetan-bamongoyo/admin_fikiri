/** Données de la flotte de transport de passagers (maquette statique). */

/* ------------------------------------------------------------------ */
/* Niveaux de trafic — du plus fluide au plus bloqué                  */
/* ------------------------------------------------------------------ */

export type TrafficLevel = "fluide" | "leger" | "modere" | "dense" | "bloque";

export interface TrafficLevelMeta {
  level: TrafficLevel;
  label: string;
  /** Couleur de fond du marqueur / pastille / tracé. */
  dotClass: string;
  /** Couleur de tracé (variable CSS, pour le SVG de la carte). */
  stroke: string;
  /** Couleur du texte + bordure du badge. */
  badgeClass: string;
}

export const trafficLevels: TrafficLevelMeta[] = [
  {
    level: "fluide",
    label: "Fluide",
    dotClass: "bg-traffic-fluide",
    stroke: "var(--color-traffic-fluide)",
    badgeClass: "border-traffic-fluide/40 text-traffic-fluide",
  },
  {
    level: "leger",
    label: "Léger",
    dotClass: "bg-traffic-leger",
    stroke: "var(--color-traffic-leger)",
    badgeClass: "border-traffic-leger/40 text-traffic-leger",
  },
  {
    level: "modere",
    label: "Modéré",
    dotClass: "bg-traffic-modere",
    stroke: "var(--color-traffic-modere)",
    badgeClass: "border-traffic-modere/40 text-traffic-modere",
  },
  {
    level: "dense",
    label: "Dense",
    dotClass: "bg-traffic-dense",
    stroke: "var(--color-traffic-dense)",
    badgeClass: "border-traffic-dense/40 text-traffic-dense",
  },
  {
    level: "bloque",
    label: "Bloqué",
    dotClass: "bg-destructive",
    stroke: "var(--color-destructive)",
    badgeClass: "border-destructive/40 text-destructive",
  },
];

export const trafficLevelByKey: Record<TrafficLevel, TrafficLevelMeta> =
  Object.fromEntries(trafficLevels.map((l) => [l.level, l])) as Record<
    TrafficLevel,
    TrafficLevelMeta
  >;

/* ------------------------------------------------------------------ */
/* Flotte de transport de passagers                                   */
/* ------------------------------------------------------------------ */

export type VehicleKind = "bus" | "minibus" | "taxi";

export interface FleetVehicle {
  id: string;
  name: string;
  kind: VehicleKind;
  /** Ligne / itinéraire desservi. */
  line: string;
  /** Passagers à bord. */
  passengers: number;
  /** Capacité totale en places. */
  capacity: number;
  /** Niveau de trafic sur l'itinéraire en cours. */
  level: TrafficLevel;
  /** Distance parcourue, en km. */
  distanceKm: number;
}

/** Véhicule mis en avant dans « Ma Flotte ». */
export const featuredVehicle = {
  name: "BUS LIGNE 12 — Gombe ↔ Limete",
  kind: "bus" as VehicleKind,
  speedKmh: 42,
  traveledKm: 18,
  passengers: 48,
  capacity: 60,
  level: "modere" as TrafficLevel,
};

/** Liste « Suivi en direct ». */
export const liveTrackingVehicles: FleetVehicle[] = [
  { id: "l12", name: "Bus Ligne 12", kind: "bus", line: "Gombe ↔ Limete", passengers: 48, capacity: 60, level: "modere", distanceKm: 18 },
  { id: "l07", name: "Bus Ligne 07", kind: "bus", line: "Matete ↔ Gare", passengers: 55, capacity: 60, level: "dense", distanceKm: 24 },
  { id: "mb3", name: "Minibus 302", kind: "minibus", line: "Bandal ↔ UPN", passengers: 12, capacity: 18, level: "fluide", distanceKm: 11 },
  { id: "mb5", name: "Minibus 514", kind: "minibus", line: "Ngaba ↔ Rond-point", passengers: 18, capacity: 18, level: "bloque", distanceKm: 9 },
  { id: "tx9", name: "Taxi 0942", kind: "taxi", line: "Victoire ↔ Aéroport", passengers: 3, capacity: 4, level: "leger", distanceKm: 31 },
  { id: "l21", name: "Bus Ligne 21", kind: "bus", line: "Kintambo ↔ Centre", passengers: 33, capacity: 60, level: "leger", distanceKm: 15 },
  { id: "tx4", name: "Taxi 0418", kind: "taxi", line: "Lemba ↔ Gombe", passengers: 2, capacity: 4, level: "fluide", distanceKm: 27 },
];

/** Véhicule actuellement sélectionné dans la liste. */
export const selectedVehicleId = "l12";

/* ------------------------------------------------------------------ */
/* Trajets et dépenses                                                */
/* ------------------------------------------------------------------ */

export interface Trip {
  id: string;
  startTime: string;
  startAddress: string;
  endTime: string;
  endAddress: string;
  line: string;
  passengers: number;
}

/** Liste « Dernier trajet ». */
export const lastTrips: Trip[] = [
  {
    id: "trip-1",
    startTime: "10:24",
    startAddress: "Terminus Gombe, Bd du 30 Juin",
    endTime: "11:34",
    endAddress: "Terminus Limete, 7e Rue",
    line: "Ligne 12",
    passengers: 48,
  },
  {
    id: "trip-2",
    startTime: "08:10",
    startAddress: "Terminus Matete",
    endTime: "09:05",
    endAddress: "Gare Centrale",
    line: "Ligne 07",
    passengers: 55,
  },
  {
    id: "trip-3",
    startTime: "07:15",
    startAddress: "Rond-point Ngaba",
    endTime: "07:58",
    endAddress: "UPN, Av. de la Science",
    line: "Minibus 302",
    passengers: 18,
  },
];

export type ExpenseKind = "carburant" | "entretien" | "lavage" | "peage";

export interface Expense {
  id: ExpenseKind;
  label: string;
  amount: number;
  /** Couleur de l'icône (texte) et de son fond. */
  iconClass: string;
  bgClass: string;
}

/** Cartes « Toutes les dépenses ». */
export const expenses: Expense[] = [
  { id: "carburant", label: "Carburant", amount: 500, iconClass: "text-sky-500", bgClass: "bg-sky-500/10" },
  { id: "entretien", label: "Entretien", amount: 250, iconClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
  { id: "lavage", label: "Lavage", amount: 400, iconClass: "text-violet-500", bgClass: "bg-violet-500/10" },
  { id: "peage", label: "Péage", amount: 300, iconClass: "text-amber-500", bgClass: "bg-amber-500/10" },
];

/* ------------------------------------------------------------------ */
/* Carte                                                              */
/* ------------------------------------------------------------------ */

/** Marqueur sur la carte (position en %, 0–100). */
export interface MapMarker {
  id: string;
  kind: VehicleKind;
  x: number;
  y: number;
  /** Épingle de point de congestion (niveau de trafic). */
  pinLevel?: TrafficLevel;
}

export const mapMarkers: MapMarker[] = [
  { id: "m1", kind: "taxi", x: 8, y: 16 },
  { id: "m2", kind: "taxi", x: 6, y: 50 },
  { id: "m3", kind: "minibus", x: 7, y: 58 },
  { id: "m4", kind: "bus", x: 43, y: 47 },
  { id: "m5", kind: "minibus", x: 34, y: 66 },
  { id: "m6", kind: "bus", x: 33, y: 90 },
  { id: "p1", kind: "bus", x: 36, y: 22, pinLevel: "dense" },
  { id: "p2", kind: "bus", x: 50, y: 38, pinLevel: "bloque" },
];

/** Segments du parcours, colorés selon le niveau de trafic. */
export interface RouteSegment {
  level: TrafficLevel;
  points: { x: number; y: number }[];
}

export const routeSegments: RouteSegment[] = [
  {
    level: "fluide",
    points: [
      { x: 8, y: 16 },
      { x: 28, y: 11 },
      { x: 36, y: 22 },
    ],
  },
  {
    level: "modere",
    points: [
      { x: 36, y: 22 },
      { x: 27, y: 36 },
      { x: 18, y: 44 },
      { x: 6, y: 50 },
    ],
  },
  {
    level: "dense",
    points: [
      { x: 6, y: 50 },
      { x: 30, y: 50 },
      { x: 30, y: 64 },
      { x: 33, y: 90 },
    ],
  },
  {
    level: "bloque",
    points: [
      { x: 33, y: 90 },
      { x: 50, y: 70 },
      { x: 50, y: 38 },
    ],
  },
];
