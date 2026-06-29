"""
Détection passive de congestion à partir des échantillons GPS (Phase 2).

Agrège les vitesses récentes en cellules géographiques et produit des zones
synthétiques « congestion » injectées dans le moteur de routage.
"""

from __future__ import annotations

import logging
import math
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Final

from sqlalchemy import text
from sqlalchemy.orm import Session

from services.routing_service import (
    MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE,
    RoutingIncident,
)

logger = logging.getLogger(__name__)

TRAFFIC_SAMPLE_WINDOW_MINUTES: Final[int] = int(
    os.getenv("TRAFFIC_SAMPLE_WINDOW_MINUTES", "45")
)
TRAFFIC_GRID_CELL_METERS: Final[float] = float(
    os.getenv("TRAFFIC_GRID_CELL_METERS", "150")
)
TRAFFIC_MIN_SAMPLES_PER_CELL: Final[int] = int(
    os.getenv("TRAFFIC_MIN_SAMPLES_PER_CELL", "3")
)
TRAFFIC_SLOW_SPEED_MS: Final[float] = float(
    os.getenv("TRAFFIC_SLOW_SPEED_MS", "4.0")
)
TRAFFIC_VERY_SLOW_SPEED_MS: Final[float] = float(
    os.getenv("TRAFFIC_VERY_SLOW_SPEED_MS", "2.0")
)
# Vitesse de référence « fluide » servant à normaliser l'intensité heatmap
# (0 = fluide, 1 = congestionné).
TRAFFIC_FREEFLOW_SPEED_MS: Final[float] = float(
    os.getenv("TRAFFIC_FREEFLOW_SPEED_MS", "8.0")
)
# Fenêtre temporelle (minutes) pour l'agrégation heatmap web — plus large que
# le routage pour lisser l'affichage.
TRAFFIC_HEATMAP_WINDOW_MINUTES: Final[int] = int(
    os.getenv("TRAFFIC_HEATMAP_WINDOW_MINUTES", "60")
)
TRAFFIC_CONGESTION_RADIUS_METERS: Final[float] = float(
    os.getenv("TRAFFIC_CONGESTION_RADIUS_METERS", "200")
)
TRAFFIC_CORRIDOR_BUFFER_KM: Final[float] = float(
    os.getenv("TRAFFIC_CORRIDOR_BUFFER_KM", "3.0")
)


def _grid_step_degrees(latitude: float) -> tuple[float, float]:
    meters_per_degree_lat = 111_320.0
    meters_per_degree_lon = 111_320.0 * math.cos(math.radians(latitude))
    return (
        TRAFFIC_GRID_CELL_METERS / meters_per_degree_lat,
        TRAFFIC_GRID_CELL_METERS / meters_per_degree_lon,
    )


def _grid_key(lat: float, lon: float) -> tuple[int, int]:
    lat_step, lon_step = _grid_step_degrees(lat)
    return (int(math.floor(lat / lat_step)), int(math.floor(lon / lon_step)))


def _grid_center(key: tuple[int, int], reference_lat: float) -> tuple[float, float]:
    lat_step, lon_step = _grid_step_degrees(reference_lat)
    lat_index, lon_index = key
    return (
        (lat_index + 0.5) * lat_step,
        (lon_index + 0.5) * lon_step,
    )


def _corridor_bounds(
    start: list[float],
    end: list[float],
    buffer_km: float,
) -> tuple[float, float, float, float]:
    """Retourne min_lon, min_lat, max_lon, max_lat avec marge."""
    lon1, lat1 = start[0], start[1]
    lon2, lat2 = end[0], end[1]
    mid_lat = (lat1 + lat2) / 2.0

    buffer_deg_lat = (buffer_km * 1000) / 111_320.0
    buffer_deg_lon = (buffer_km * 1000) / (
        111_320.0 * math.cos(math.radians(mid_lat))
    )

    return (
        min(lon1, lon2) - buffer_deg_lon,
        min(lat1, lat2) - buffer_deg_lat,
        max(lon1, lon2) + buffer_deg_lon,
        max(lat1, lat2) + buffer_deg_lat,
    )


def _fetch_speed_samples(
    db_session: Session,
    bounds: tuple[float, float, float, float],
    since: datetime,
) -> list[tuple[float, float, float | None]]:
    min_lon, min_lat, max_lon, max_lat = bounds

    rows = db_session.execute(
        text(
            """
            SELECT latitude, longitude, speed_mps
            FROM traffic_speed_samples
            WHERE deleted_at IS NULL
              AND recorded_at >= :since
              AND longitude BETWEEN :min_lon AND :max_lon
              AND latitude BETWEEN :min_lat AND :max_lat
            """
        ),
        {
            "since": since,
            "min_lon": min_lon,
            "max_lon": max_lon,
            "min_lat": min_lat,
            "max_lat": max_lat,
        },
    ).fetchall()

    samples: list[tuple[float, float, float | None]] = []
    for row in rows:
        speed = float(row.speed_mps) if row.speed_mps is not None else None
        if speed is not None and speed < 0:
            continue
        samples.append((float(row.latitude), float(row.longitude), speed))

    return samples


def _aggregate_slow_cells(
    samples: list[tuple[float, float, float | None]],
) -> list[tuple[float, float, float]]:
    """Retourne (lat, lon, radius_m) pour chaque cellule congestionnée."""
    cells: dict[tuple[int, int], list[float]] = defaultdict(list)

    for lat, lon, speed_mps in samples:
        if speed_mps is None:
            continue
        cells[_grid_key(lat, lon)].append(speed_mps)

    congested: list[tuple[float, float, float]] = []

    for key, speeds in cells.items():
        if len(speeds) < TRAFFIC_MIN_SAMPLES_PER_CELL:
            continue

        avg_speed = sum(speeds) / len(speeds)
        if avg_speed > TRAFFIC_SLOW_SPEED_MS:
            continue

        lat, lon = _grid_center(key, reference_lat=sum(s[0] for s in samples) / len(samples))
        radius = TRAFFIC_CONGESTION_RADIUS_METERS
        if avg_speed <= TRAFFIC_VERY_SLOW_SPEED_MS:
            radius = TRAFFIC_CONGESTION_RADIUS_METERS * 1.25

        congested.append((lat, lon, radius))

    return congested


def fetch_traffic_congestion_zones(
    db_session: Session | None,
    start: list[float],
    end: list[float],
) -> list[RoutingIncident]:
    """
    Détecte des zones de congestion à partir des GPS passifs récents.

    Retourne des pseudo-incidents ``congestion`` toujours évitables (count >= 2).
    """
    if db_session is None:
        return []

    since = datetime.now(timezone.utc) - timedelta(
        minutes=TRAFFIC_SAMPLE_WINDOW_MINUTES
    )
    bounds = _corridor_bounds(start, end, TRAFFIC_CORRIDOR_BUFFER_KM)

    try:
        samples = _fetch_speed_samples(db_session, bounds, since)
    except Exception:
        logger.exception("Impossible de lire traffic_speed_samples (migration appliquée ?)")
        return []

    if not samples:
        logger.debug("Aucun échantillon GPS récent dans le corridor.")
        return []

    slow_cells = _aggregate_slow_cells(samples)
    zones: list[RoutingIncident] = []

    for index, (lat, lon, radius) in enumerate(slow_cells):
        zones.append(
            RoutingIncident(
                id=f"traffic-auto-{index}-{lat:.4f}-{lon:.4f}",
                type="congestion",
                lon=lon,
                lat=lat,
                radius_meters=radius,
                confirmation_count=MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE,
            )
        )

    logger.info(
        "Trafic passif : %d échantillons, %d zones congestion détectées.",
        len(samples),
        len(zones),
    )

    return zones
