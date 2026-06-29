"""Tests pour la détection passive de congestion (Phase 2)."""

from __future__ import annotations

import pytest

from services.traffic_saturation import (
    TRAFFIC_MIN_SAMPLES_PER_CELL,
    TRAFFIC_SLOW_SPEED_MS,
    _aggregate_slow_cells,
    _grid_key,
    fetch_traffic_congestion_zones,
)
from services.routing_service import path_crosses_incident


def test_grid_key_groups_nearby_points() -> None:
    key_a = _grid_key(-4.3225, 15.3140)
    key_b = _grid_key(-4.3226, 15.3141)
    assert key_a == key_b


def test_aggregate_slow_cells_requires_min_samples() -> None:
    lat, lon = -4.3225, 15.3140
    samples = [
        (lat, lon, TRAFFIC_SLOW_SPEED_MS - 1.0),
        (lat, lon, TRAFFIC_SLOW_SPEED_MS - 0.5),
    ]
    assert _aggregate_slow_cells(samples) == []

    samples.append((lat, lon, TRAFFIC_SLOW_SPEED_MS - 0.8))
    assert len(_aggregate_slow_cells(samples)) == 1


def test_aggregate_slow_cells_ignores_fast_traffic() -> None:
    lat, lon = -4.3225, 15.3140
    samples = [(lat, lon, 12.0)] * TRAFFIC_MIN_SAMPLES_PER_CELL
    assert _aggregate_slow_cells(samples) == []


def test_fetch_traffic_congestion_zones_without_db() -> None:
    assert fetch_traffic_congestion_zones(None, [15.31, -4.32], [15.32, -4.33]) == []


def test_traffic_zone_is_detected_on_route() -> None:
    from services.routing_service import RoutingIncident

    zone = RoutingIncident(
        id="traffic-auto-0",
        type="congestion",
        lon=15.3140,
        lat=-4.3225,
        radius_meters=200.0,
        confirmation_count=2,
    )
    path = [
        [15.3130, -4.3220],
        [15.3150, -4.3230],
    ]
    assert path_crosses_incident(path, zone) is True
