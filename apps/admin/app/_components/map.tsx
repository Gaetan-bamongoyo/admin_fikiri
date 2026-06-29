"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MarkerLayer, Marker } from "react-leaflet-marker";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { trafficLevelByKey, type TrafficLevel } from "../_lib/fleet-data";

export interface MapMarkerPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Niveau de trafic → couleur du marqueur (charte Fikiri). */
  level: TrafficLevel;
}

interface MapProps {
  markers: MapMarkerPoint[];
  /** Centre initial ; à défaut, le premier marqueur, sinon Kinshasa. */
  center?: { lat: number; lng: number };
}

/** Centre par défaut : Kinshasa. */
const KINSHASA = { lat: -4.325, lng: 15.322 } as const;

/** Recentre la carte quand la cible change (sans la recréer). */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);
  return null;
}

/**
 * Carte Leaflet/OpenStreetMap de la flotte. Composant client uniquement
 * (Leaflet accède à `window`) : à charger via `next/dynamic` avec `ssr: false`.
 * Découplé des données : reçoit ses marqueurs en props.
 */
export default function Map({ markers, center }: MapProps) {
  const focus = center ?? markers[0] ?? KINSHASA;

  return (
    <MapContainer
      scrollWheelZoom
      center={[focus.lat, focus.lng]}
      zoom={12}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={focus.lat} lng={focus.lng} />

      {markers.map((marker) => (
        <MarkerLayer key={marker.id}>
          <Marker position={[marker.lat, marker.lng]}>
            <MapPin
              className="size-8 drop-shadow"
              style={{ color: trafficLevelByKey[marker.level].stroke }}
              aria-label={marker.name}
            />
          </Marker>
        </MarkerLayer>
      ))}
    </MapContainer>
  );
}
