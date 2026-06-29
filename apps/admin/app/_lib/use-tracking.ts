"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

import { ACTIVE_RIDE_STATUSES, rideKeys, type Ride } from "./queries/rides";
import { getApiOrigin } from "./api-base-url";

export interface DriverPosition {
  driverId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  at: string;
  /** Type de véhicule, si fourni par le backend (sinon « car » par défaut). */
  kind?: "car" | "moto";
}

/** Déduit l'origine du serveur Socket.IO à partir de l'URL de l'API REST. */
function socketBaseUrl(): string {
  return getApiOrigin();
}

/**
 * Se connecte au namespace `/tracking` et expose les positions des chauffeurs
 * en temps réel. Les mises à jour de courses synchronisent le cache react-query
 * (courses actives, stats, historique).
 */
export function useTracking() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [drivers, setDrivers] = useState<Record<string, DriverPosition>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${socketBaseUrl()}/tracking`, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("driver:position", (position: DriverPosition) => {
      setDrivers((prev) => ({ ...prev, [position.driverId]: position }));
    });

    const syncRide = (ride: Ride) => {
      queryClient.setQueryData<Ride[]>(rideKeys.active(), (prev) => {
        const rest = prev ? prev.filter((r) => r.id !== ride.id) : [];
        return ACTIVE_RIDE_STATUSES.includes(ride.status)
          ? [ride, ...rest]
          : rest;
      });
      void queryClient.invalidateQueries({ queryKey: rideKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
    };

    socket.on("ride:created", syncRide);
    socket.on("ride:updated", syncRide);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return { connected, drivers: Object.values(drivers) };
}
