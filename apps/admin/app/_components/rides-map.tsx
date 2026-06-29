"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Bike, Car, Flag, User, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  GeoJSONSource,
  Map as MlMap,
  Marker,
  StyleSpecification,
} from "maplibre-gl";

import type { Ride } from "../_lib/queries/rides";
import type { DriverPosition } from "../_lib/use-tracking";

/** Centre par défaut : Gombe, Kinshasa. */
const KINSHASA: [number, number] = [15.3125, -4.3217];

/** Source/couche GeoJSON des tracés départ → destination. */
const ROUTE_SOURCE_ID = "rides-routes";
const ROUTE_LAYER_ID = "rides-routes-line";

/**
 * URLs des tuiles raster. Par défaut CARTO (sans clé, CORS activé) ; OSM est
 * évité (blocages MapLibre + usage en app proscrit). Surchargeable via
 * NEXT_PUBLIC_MAP_TILES_URL pour pointer vers un serveur joignable/auto-hébergé.
 */
const TILE_URLS = (
  process.env.NEXT_PUBLIC_MAP_TILES_URL ??
  [
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  ].join(",")
).split(",");

const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: TILE_URLS,
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "basemap", type: "raster", source: "basemap" }],
};

/** Tracés SVG (lucide) des icônes d'acteurs, dessinés en blanc dans le badge. */
const ICONS = {
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  moto: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  client:
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  destination:
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
} as const;

type IconKey = keyof typeof ICONS;

/**
 * Marqueur professionnel : badge rond coloré avec icône SVG blanche centrée,
 * bordure blanche et ombre portée (style app de VTC).
 */
function iconMarker(icon: IconKey, color: string, size = 34): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;`;
  const inner = Math.round(size * 0.56);
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg>`;
  return el;
}

type LngLat = [number, number];

/**
 * Service de routing OSRM. Démo publique par défaut, surchargeable via
 * NEXT_PUBLIC_OSRM_URL (serveur auto-hébergé ou proxy backend).
 */
const OSRM_URL =
  process.env.NEXT_PUBLIC_OSRM_URL ??
  "https://router.project-osrm.org/route/v1/driving";

/** Délai max avant repli en ligne droite (réseau lent / service injoignable). */
const ROUTE_TIMEOUT_MS = 4000;

/**
 * Récupère la géométrie routière (suivant les rues) entre deux points via OSRM.
 * Abandonne après ROUTE_TIMEOUT_MS et lève une erreur (→ repli ligne droite).
 */
async function fetchRoadRoute(
  pickup: LngLat,
  dropoff: LngLat
): Promise<LngLat[]> {
  const coords = `${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OSRM_URL}/${coords}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: LngLat[] } }[];
    };
    const line = data.routes?.[0]?.geometry?.coordinates;
    if (!line || line.length === 0) throw new Error("OSRM: itinéraire vide");
    return line;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Géométrie d'un trajet, mise en cache par couple départ/destination.
 * Replie sur une ligne droite si le routing échoue.
 */
async function routeGeometry(
  pickup: LngLat,
  dropoff: LngLat,
  cache: Map<string, LngLat[]>
): Promise<LngLat[]> {
  const key = `${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const line = await fetchRoadRoute(pickup, dropoff);
    cache.set(key, line);
    return line;
  } catch {
    const straight: LngLat[] = [pickup, dropoff];
    cache.set(key, straight);
    return straight;
  }
}

/** Ligne de légende : badge rond coloré + icône blanche + libellé. */
function LegendItem({
  icon: Icon,
  color,
  label,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
}) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <span
        className="flex size-4 items-center justify-center rounded-full border border-white shadow"
        style={{ backgroundColor: color }}
      >
        <Icon className="size-2.5 text-white" strokeWidth={2.5} />
      </span>
      {label}
    </p>
  );
}

/** Libellés FR des statuts de course. */
const STATUS_LABELS: Record<string, string> = {
  searching: "Recherche chauffeur",
  assigned: "Chauffeur assigné",
  en_route: "En route",
  in_progress: "Course en cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** Échappe le texte injecté dans le HTML des popups. */
function esc(value: string | null | undefined): string {
  return (value ?? "").replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );
}

function money(value: string): string {
  return `${Number(value).toLocaleString("fr-FR")} FC`;
}

/** Lignes « label : valeur » d'une fiche popup. */
function infoRows(rows: [string, string][]): string {
  return rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">${esc(
          k
        )}</span><span style="font-weight:500;text-align:right;">${esc(
          v
        )}</span></div>`
    )
    .join("");
}

function popupShell(title: string, subtitle: string, rows: string): string {
  return `<div style="min-width:210px;font-size:12px;line-height:1.55;color:#0f172a;">
    <div style="font-weight:600;font-size:13px;">${esc(title)}</div>
    ${subtitle ? `<div style="margin:2px 0 6px;color:#475569;">${esc(subtitle)}</div>` : ""}
    <div style="display:flex;flex-direction:column;gap:2px;">${rows}</div>
  </div>`;
}

/** Fiche d'une course, vue depuis le point de départ ou la destination. */
function ridePopupHTML(ride: Ride, role: "pickup" | "dropoff"): string {
  const title = role === "pickup" ? "Départ — Client" : "Destination";
  const subtitle = role === "pickup" ? ride.pickupAddress : ride.dropoffAddress;
  return popupShell(
    title,
    subtitle,
    infoRows([
      ["Client", ride.passengerName ?? "—"],
      ["Chauffeur", ride.driverName ?? "Non assigné"],
      ["Statut", statusLabel(ride.status)],
      ["Distance", `${ride.distanceKm} km`],
      ["Durée", `${ride.durationMin} min`],
      ["Prix", money(ride.price)],
    ])
  );
}

/** Fiche d'un chauffeur, avec la course en cours s'il y en a une. */
function driverPopupHTML(driver: DriverPosition, ride: Ride | null): string {
  const vehicle = driver.kind === "moto" ? "Moto" : "Voiture";
  const rows: [string, string][] = [
    ["Véhicule", vehicle],
    ["Statut", statusLabel(driver.status)],
  ];
  if (ride) {
    rows.push(
      ["Client", ride.passengerName ?? "—"],
      ["Course", `${ride.pickupAddress} → ${ride.dropoffAddress}`],
      ["Prix", money(ride.price)]
    );
  }
  return popupShell(
    driver.name,
    ride ? "Course en cours" : "Aucune course active",
    infoRows(rows)
  );
}

export function RidesMap({
  drivers,
  rides,
}: {
  drivers: DriverPosition[];
  rides: Ride[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const driverMarkers = useRef<Map<string, Marker>>(new Map());
  const rideMarkers = useRef<Marker[]>([]);
  const routeCache = useRef<Map<string, LngLat[]>>(new Map());
  const [ready, setReady] = useState(false);

  // Initialisation de la carte (client uniquement).
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      maplibreRef.current = maplibre;
      map = new maplibre.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: KINSHASA,
        zoom: 12,
        attributionControl: false,
      });
      map.addControl(new maplibre.NavigationControl(), "top-right");
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Marqueurs des chauffeurs (mise à jour en direct).
  useEffect(() => {
    const maplibre = maplibreRef.current;
    const map = mapRef.current;
    if (!ready || !maplibre || !map) return;

    const seen = new Set<string>();
    for (const driver of drivers) {
      seen.add(driver.driverId);
      const ride =
        rides.find((r) => r.driverId === driver.driverId) ?? null;
      const html = driverPopupHTML(driver, ride);
      const existing = driverMarkers.current.get(driver.driverId);
      if (existing) {
        existing.setLngLat([driver.longitude, driver.latitude]);
        existing.getPopup()?.setHTML(html);
      } else {
        const marker = new maplibre.Marker({
          element: iconMarker(
            driver.kind === "moto" ? "moto" : "car",
            "#2563eb",
            34
          ),
        })
          .setLngLat([driver.longitude, driver.latitude])
          .setPopup(new maplibre.Popup({ offset: 16 }).setHTML(html))
          .addTo(map);
        driverMarkers.current.set(driver.driverId, marker);
      }
    }

    for (const [id, marker] of driverMarkers.current) {
      if (!seen.has(id)) {
        marker.remove();
        driverMarkers.current.delete(id);
      }
    }
  }, [drivers, rides, ready]);

  // Marqueurs (départ + destination) et tracés des courses actives.
  useEffect(() => {
    const maplibre = maplibreRef.current;
    const map = mapRef.current;
    if (!ready || !maplibre || !map) return;

    // Marqueurs : départ (orange) + destination (rouge).
    for (const marker of rideMarkers.current) marker.remove();
    rideMarkers.current = [];

    for (const ride of rides) {
      const pickup: LngLat = [Number(ride.pickupLng), Number(ride.pickupLat)];
      const dropoff: LngLat = [
        Number(ride.dropoffLng),
        Number(ride.dropoffLat),
      ];

      const pickupMarker = new maplibre.Marker({
        element: iconMarker("client", "#f59e0b", 30),
      })
        .setLngLat(pickup)
        .setPopup(
          new maplibre.Popup({ offset: 14 }).setHTML(
            ridePopupHTML(ride, "pickup")
          )
        )
        .addTo(map);

      const dropoffMarker = new maplibre.Marker({
        element: iconMarker("destination", "#ef4444", 30),
      })
        .setLngLat(dropoff)
        .setPopup(
          new maplibre.Popup({ offset: 14 }).setHTML(
            ridePopupHTML(ride, "dropoff")
          )
        )
        .addTo(map);

      rideMarkers.current.push(pickupMarker, dropoffMarker);
    }

    // Tracés routiers départ → destination (OSRM), colorés selon le statut.
    let cancelled = false;

    void (async () => {
      const features = await Promise.all(
        rides.map(async (ride) => {
          const pickup: LngLat = [
            Number(ride.pickupLng),
            Number(ride.pickupLat),
          ];
          const dropoff: LngLat = [
            Number(ride.dropoffLng),
            Number(ride.dropoffLat),
          ];
          const coordinates = await routeGeometry(
            pickup,
            dropoff,
            routeCache.current
          );
          return {
            type: "Feature" as const,
            properties: { status: ride.status },
            geometry: { type: "LineString" as const, coordinates },
          };
        })
      );

      if (cancelled) return;
      const liveMap = mapRef.current;
      if (!liveMap) return;

      const routes: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: "FeatureCollection",
        features,
      };

      const source = liveMap.getSource(ROUTE_SOURCE_ID) as
        | GeoJSONSource
        | undefined;
      if (source) {
        source.setData(routes);
      } else {
        liveMap.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: routes });
        liveMap.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 4,
            "line-opacity": 0.85,
            "line-color": [
              "match",
              ["get", "status"],
              "in_progress",
              "#22c55e",
              "en_route",
              "#3b82f6",
              "assigned",
              "#f59e0b",
              "searching",
              "#a855f7",
              /* défaut */ "#94a3b8",
            ],
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rides, ready]);

  return (
    <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border lg:h-[560px]">
      <div ref={containerRef} className="size-full" />
      <div className="pointer-events-none absolute bottom-4 left-4 space-y-1.5 rounded-xl border border-border bg-card/95 p-3 text-xs shadow-sm backdrop-blur">
        <p className="mb-1.5 font-semibold text-foreground">Légende</p>
        <LegendItem icon={Car} color="#2563eb" label="Chauffeur (voiture)" />
        <LegendItem icon={Bike} color="#2563eb" label="Chauffeur (moto)" />
        <LegendItem icon={User} color="#f59e0b" label="Départ / client" />
        <LegendItem icon={Flag} color="#ef4444" label="Destination" />
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-4 rounded bg-slate-400" />
          Trajet
        </p>
      </div>
    </div>
  );
}
