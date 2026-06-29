"""
Tests unitaires et d'intégration HTTP pour le module de routage dynamique.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from services.routing_service import (
    BLOCKING_INCIDENT_TYPES,
    MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE,
    build_custom_model,
    build_detour_waypoints,
    calculate_dynamic_route,
    detect_inevitable_incidents,
    fetch_active_incidents,
    filter_avoidable_incidents,
    haversine_distance,
    meters_to_degree_buffer,
    path_crosses_incident,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def kinshasa_incidents() -> list[dict]:
    return [
        {
            "id": "inc-1",
            "type": "checkpoint",
            "lon": 15.3140,
            "lat": -4.3225,
            "radius_meters": 150.0,
            "confirmation_count": 2,
        },
        {
            "id": "inc-2",
            "type": "congestion",
            "lon": 15.3120,
            "lat": -4.3350,
            "radius_meters": 100.0,
            "confirmation_count": 1,
        },
    ]


@pytest.fixture
def graphhopper_success_response() -> dict:
    return {
        "paths": [
            {
                "distance": 2500.0,
                "time": 300_000,
                "points": {
                    "coordinates": [
                        [15.3100, -4.3200],
                        [15.3150, -4.3220],
                        [15.3180, -4.3250],
                    ]
                },
                "instructions": [
                    {"text": "Tournez à droite sur l'avenue Kasa-Vubu"},
                    {"text": "Continuez tout droit"},
                ],
            }
        ]
    }


# ---------------------------------------------------------------------------
# Tests unitaires — géospatial
# ---------------------------------------------------------------------------


def test_haversine_distance_zero_for_same_point() -> None:
    distance = haversine_distance(-4.32, 15.31, -4.32, 15.31)
    assert distance == pytest.approx(0.0, abs=1.0)


def test_meters_to_degree_buffer_kinshasa() -> None:
    # À Kinshasa (~ -4.3°), 100 m devrait donner un buffer < 0.001°
    buffer = meters_to_degree_buffer(100.0, latitude=-4.32)
    assert 0.0005 < buffer < 0.002


def test_build_custom_model_creates_zones_and_rules(
    kinshasa_incidents: list[dict],
) -> None:
    from services.routing_service import _normalize_incident

    incidents = [
        inc
        for raw in kinshasa_incidents
        if (inc := _normalize_incident(raw)) is not None
    ]
    avoidable = filter_avoidable_incidents(incidents)
    model = build_custom_model(avoidable)

    assert "priority" in model
    assert "areas" in model
    assert len(model["areas"]) == 1
    assert len(model["priority"]) == 1

    checkpoint_rule = next(
        rule for rule in model["priority"] if rule["multiply_by"] == "0.02"
    )
    assert checkpoint_rule["if"] == "in_zone_inc-1"

    polygon = model["areas"]["zone_inc-1"]
    assert polygon["type"] == "Polygon"
    assert len(polygon["coordinates"][0]) == 5  # Anneau fermé


def test_build_custom_model_uses_only_confirmed_incidents(
    kinshasa_incidents: list[dict],
) -> None:
    from services.routing_service import RoutingIncident, _normalize_incident

    incidents: list[RoutingIncident] = [
        inc
        for raw in kinshasa_incidents
        if (inc := _normalize_incident(raw)) is not None
    ]
    avoidable = filter_avoidable_incidents(incidents)

    assert len(avoidable) == 1
    assert avoidable[0]["id"] == "inc-1"
    assert MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE == 2


def test_build_custom_model_ignores_clear_incidents() -> None:
    from services.routing_service import _normalize_incident

    incidents = [
        inc
        for raw in [{"id": "x", "type": "clear", "lon": 15.0, "lat": -4.0}]
        if (inc := _normalize_incident(raw)) is not None
    ]
    model = build_custom_model(incidents)
    assert model["areas"] == {}
    assert model["priority"] == []


def test_detect_inevitable_incidents_when_path_crosses_checkpoint(
    kinshasa_incidents: list[dict],
) -> None:
    from services.routing_service import RoutingIncident, _normalize_incident

    incidents: list[RoutingIncident] = filter_avoidable_incidents(
        [
            inc
            for raw in kinshasa_incidents
            if (inc := _normalize_incident(raw)) is not None
        ]
    )
    path_through_checkpoint = [
        [15.3140, -4.3225],
        [15.3180, -4.3250],
    ]

    assert detect_inevitable_incidents(path_through_checkpoint, incidents) is True


def test_detect_inevitable_incidents_false_when_path_avoids(
    kinshasa_incidents: list[dict],
) -> None:
    from services.routing_service import RoutingIncident, _normalize_incident

    incidents: list[RoutingIncident] = [
        inc
        for raw in kinshasa_incidents
        if (inc := _normalize_incident(raw)) is not None
    ]
    safe_path = [
        [15.2900, -4.3400],
        [15.3300, -4.3500],
    ]

    assert detect_inevitable_incidents(safe_path, incidents) is False


def test_fetch_active_incidents_fallback_without_db() -> None:
    incidents = fetch_active_incidents(db_session=None)
    assert len(incidents) >= 1
    assert all("lon" in inc and "lat" in inc for inc in incidents)


def test_blocking_incident_types_contains_checkpoint() -> None:
    assert "checkpoint" in BLOCKING_INCIDENT_TYPES


def test_path_crosses_incident_detects_segment_through_zone() -> None:
    from services.routing_service import RoutingIncident, _normalize_incident

    incident = _normalize_incident(
        {
            "id": "rw-1",
            "type": "roadwork",
            "lon": 15.3140,
            "lat": -4.3225,
            "radius_meters": 120.0,
            "confirmation_count": 2,
        }
    )
    assert incident is not None

    # Sommets hors zone, mais le segment passe par le centre de l'incident.
    inc_lon, inc_lat = incident["lon"], incident["lat"]
    path = [
        [inc_lon, inc_lat + 0.002],
        [inc_lon, inc_lat - 0.002],
    ]

    assert path_crosses_incident(path, incident) is True


def test_path_crosses_incident_false_when_segment_avoids_zone() -> None:
    from services.routing_service import _normalize_incident

    incident = _normalize_incident(
        {
            "id": "rw-2",
            "type": "roadwork",
            "lon": 15.3140,
            "lat": -4.3225,
            "radius_meters": 80.0,
            "confirmation_count": 2,
        }
    )
    assert incident is not None

    path = [
        [15.3000, -4.3100],
        [15.3200, -4.3300],
    ]

    assert path_crosses_incident(path, incident) is False


def test_normalize_incident_maps_travaux_alias_to_roadwork() -> None:
    from services.routing_service import _normalize_incident

    incident = _normalize_incident(
        {
            "id": "rw-3",
            "type": "travaux",
            "lon": 15.31,
            "lat": -4.32,
            "confirmation_count": 2,
        }
    )
    assert incident is not None
    assert incident["type"] == "roadwork"
    assert incident["radius_meters"] == pytest.approx(120.0)


def test_build_detour_waypoints_uses_larger_offset_for_roadwork() -> None:
    from services.routing_service import RoutingIncident, _normalize_incident

    roadwork = _normalize_incident(
        {
            "id": "rw-4",
            "type": "roadwork",
            "lon": 15.31,
            "lat": -4.32,
            "confirmation_count": 2,
        }
    )
    congestion = _normalize_incident(
        {
            "id": "cg-1",
            "type": "congestion",
            "lon": 15.31,
            "lat": -4.32,
            "confirmation_count": 2,
        }
    )
    assert roadwork is not None and congestion is not None

    rw_offset = abs(build_detour_waypoints(roadwork)[0][0] - roadwork["lon"])
    cg_offset = abs(build_detour_waypoints(congestion)[0][0] - congestion["lon"])

    assert rw_offset > cg_offset


# ---------------------------------------------------------------------------
# Tests service — mock GraphHopper
# ---------------------------------------------------------------------------


@patch("services.routing_service.apply_detour_avoidance")
@patch("services.routing_service._call_graphhopper")
@patch("services.routing_service.fetch_active_incidents")
def test_calculate_dynamic_route_returns_structured_response(
    mock_fetch: MagicMock,
    mock_graphhopper: MagicMock,
    mock_detour: MagicMock,
    kinshasa_incidents: list[dict],
    graphhopper_success_response: dict,
) -> None:
    from services.routing_service import _normalize_incident

    mock_fetch.return_value = [
        inc
        for raw in kinshasa_incidents
        if (inc := _normalize_incident(raw)) is not None
    ]
    mock_graphhopper.return_value = (graphhopper_success_response, True)
    mock_detour.return_value = (graphhopper_success_response["paths"][0], False)

    result = calculate_dynamic_route(
        start=[15.3100, -4.3200],
        end=[15.3180, -4.3250],
        db_session=None,
    )

    assert result["distance_metres"] == 2500.0
    assert result["temps_secondes"] == 300.0
    assert len(result["trajet_coordonnees"]) == 3
    assert len(result["instructions"]) == 2
    assert isinstance(result["alerte_incident_inevitable"], bool)


# ---------------------------------------------------------------------------
# Tests HTTP — endpoint FastAPI
# ---------------------------------------------------------------------------


@patch("routes.routing.calculate_dynamic_route")
def test_compute_route_endpoint_success(
    mock_calculate: MagicMock,
    client: TestClient,
) -> None:
    mock_calculate.return_value = {
        "distance_metres": 1800.0,
        "temps_secondes": 240.0,
        "trajet_coordonnees": [[15.31, -4.32], [15.318, -4.325]],
        "instructions": ["Continuez tout droit"],
        "alerte_incident_inevitable": False,
        "penalites_incidents_appliquees": True,
    }

    response = client.post(
        "/api/v1/routing/compute",
        json={
            "start": [15.3100, -4.3200],
            "end": [15.3180, -4.3250],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["distance_metres"] == 1800.0
    assert body["alerte_incident_inevitable"] is False
    mock_calculate.assert_called_once()


def test_compute_route_rejects_invalid_longitude(client: TestClient) -> None:
    response = client.post(
        "/api/v1/routing/compute",
        json={
            "start": [200.0, -4.3200],
            "end": [15.3180, -4.3250],
        },
    )
    assert response.status_code == 422


@patch("services.routing_service._call_graphhopper")
@patch("services.routing_service.fetch_active_incidents")
def test_compute_route_graphhopper_unreachable(
    mock_fetch: MagicMock,
    mock_graphhopper: MagicMock,
    client: TestClient,
    kinshasa_incidents: list[dict],
) -> None:
    from fastapi import HTTPException
    from services.routing_service import _normalize_incident

    mock_fetch.return_value = [
        inc
        for raw in kinshasa_incidents
        if (inc := _normalize_incident(raw)) is not None
    ]
    mock_graphhopper.side_effect = HTTPException(
        status_code=503,
        detail="Le serveur de routage GraphHopper est injoignable.",
    )

    response = client.post(
        "/api/v1/routing/compute",
        json={
            "start": [15.3100, -4.3200],
            "end": [15.3180, -4.3250],
        },
    )

    assert response.status_code == 503
