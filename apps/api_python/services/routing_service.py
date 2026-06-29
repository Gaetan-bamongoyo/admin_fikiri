"""
Service de routage dynamique — cœur algorithmique du microservice.

Injecte des pénalités géospatiales dans le graphe GraphHopper via un custom_model
afin de contourner les incidents actifs (police, embouteillages, accidents, etc.).
"""

from __future__ import annotations

import logging
import math
import os
from pathlib import Path
from typing import Any, Final, TypedDict

import requests
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.orm import Session

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

logger = logging.getLogger(__name__)

# Configuration

GRAPHHOPPER_URL: Final[str] = os.getenv(
    "GRAPHHOPPER_URL", "https://graphhopper.com/api/1/route"
)
GRAPHHOPPER_API_KEY: Final[str | None] = os.getenv("GRAPHHOPPER_API_KEY")
GRAPHHOPPER_TIMEOUT_SECONDS: Final[int] = int(
    os.getenv("GRAPHHOPPER_TIMEOUT_SECONDS", "15")
)
GRAPHHOPPER_CUSTOM_MODEL: Final[bool] = os.getenv(
    "GRAPHHOPPER_CUSTOM_MODEL", "false"
).lower() in {"1", "true", "yes"}

# Limite d'appels GraphHopper par calcul d'itinéraire (plan gratuit ≈ 5 req/min).
MAX_GRAPHHOPPER_REQUESTS_PER_ROUTE: Final[int] = int(
    os.getenv("MAX_GRAPHHOPPER_REQUESTS_PER_ROUTE", "6")
)

# Messages d'erreur GraphHopper indiquant que le custom_model n'est pas supporté (ex: plan gratuit).
_CUSTOM_MODEL_UNSUPPORTED_MARKERS: Final[tuple[str, ...]] = (
    "free packages cannot use flexible mode",
    "custom_model",
    "speed mode",
    "ch.disable",
)

_GRAPHOPPER_RATE_LIMIT_MARKERS: Final[tuple[str, ...]] = (
    "api limit",
    "limit exceeded",
    "minutely api limit",
)

# Pénalités et rayons d'évitement par type d'incident.
# multiplier : facteur appliqué au coût des arêtes dans la zone (0.02 = quasi-blocage).
# radius_meters : rayon de la boîte tampon autour du point d'incident.
INCIDENT_SEVERITY: Final[dict[str, dict[str, float | str]]] = {
    "checkpoint": {"multiplier": "0.02", "radius_meters": 150.0, "detour_factor": 3.0},
    "danger": {"multiplier": "0.10", "radius_meters": 100.0, "detour_factor": 3.0},
    "accident": {"multiplier": "0.15", "radius_meters": 100.0, "detour_factor": 3.0},
    "congestion": {"multiplier": "0.30", "radius_meters": 100.0, "detour_factor": 3.0},
    "roadwork": {"multiplier": "0.08", "radius_meters": 120.0, "detour_factor": 3.5},
}

# Types d'incidents considérés comme bloquants pour l'alerte « inévitable ».
BLOCKING_INCIDENT_TYPES: Final[frozenset[str]] = frozenset(
    {"checkpoint", "danger", "accident"}
)

# Seuil de confirmations pour activer l'évitement sur l'itinéraire.
MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE: Final[int] = 2

# Nombre maximal de tentatives de contournement (points intermédiaires).
MAX_DETOUR_ATTEMPTS: Final[int] = int(os.getenv("MAX_DETOUR_ATTEMPTS", "2"))

# Points de contournement testés par incident (réduit les appels API).
MAX_DETOUR_WAYPOINTS: Final[int] = int(os.getenv("MAX_DETOUR_WAYPOINTS", "3"))

# Échantillonnage le long des segments de polyline (GraphHopper espacé les points).
PATH_CROSSING_SAMPLE_METERS: Final[float] = 15.0

# Alias mobile / métier → types canoniques du moteur.
INCIDENT_TYPE_ALIASES: Final[dict[str, str]] = {
    "travaux": "roadwork",
    "bouchon": "congestion",
    "police": "checkpoint",
}

# Simulation de secours (tests offline uniquement).
FALLBACK_INCIDENTS: Final[list[dict[str, Any]]] = [
    {
        "id": "sim_checkpoint",
        "type": "checkpoint",
        "lon": 15.3045,
        "lat": -4.3214,
        "radius_meters": 150.0,
        "confirmation_count": 2,
    },
]


class RoutingIncident(TypedDict):
    id: str
    type: str
    lon: float
    lat: float
    radius_meters: float
    confirmation_count: int


class GraphHopperBudgetExhausted(Exception):
    """Quota d'appels GraphHopper atteint pour ce calcul d'itinéraire."""


class GraphHopperRateLimitError(Exception):
    """GraphHopper Cloud a refusé la requête (limite minute/jour dépassée)."""


class GraphHopperRequestBudget:
    """Compteur d'appels GraphHopper par requête de routage."""

    def __init__(self, max_requests: int) -> None:
        self.max_requests = max_requests
        self.used = 0
        self.rate_limited = False

    @property
    def remaining(self) -> int:
        return max(0, self.max_requests - self.used)

    @property
    def exhausted(self) -> bool:
        return self.used >= self.max_requests

    def consume(self) -> bool:
        if self.exhausted:
            return False
        self.used += 1
        return True


# Cache process : évite de retenter le custom_model à chaque requête (plan gratuit).
_custom_model_supported: bool | None = None


# Utilitaires géospatiaux
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en mètres entre deux coordonnées via la formule de Haversine."""
    earth_radius_m = 6_371_000.0

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return earth_radius_m * c


def meters_to_degree_buffer(radius_meters: float, latitude: float) -> float:
    """
    Convertit un rayon en mètres en degrés décimaux pour construire une boîte tampon.

    Près de l'équateur, 1° de latitude ≈ 111 320 m.
    La longitude se compresse selon cos(latitude) : 1° lon ≈ 111 320 × cos(lat) m.

    On utilise une approximation plane suffisante pour des zones urbaines de Kinshasa
    (rayons < 500 m) : on prend le maximum entre les deux composantes pour obtenir
    une boîte carrée englobante (sur-estimation conservative du buffer).
    """
    meters_per_degree_lat = 111_320.0
    meters_per_degree_lon = 111_320.0 * math.cos(math.radians(latitude))

    deg_lat = radius_meters / meters_per_degree_lat
    deg_lon = radius_meters / meters_per_degree_lon

    # Boîte carrée : on retient la plus grande composante pour couvrir les deux axes.
    return max(deg_lat, deg_lon)


def build_exclusion_polygon(
    lon: float, lat: float, radius_meters: float
) -> dict[str, Any]:
    """
    Construit un polygone rectangulaire (boîte tampon) autour d'un point d'incident.

    GraphHopper Custom Model attend des polygones GeoJSON au format :
    coordinates: [[[lon, lat], [lon, lat], ...]]  (anneau fermé).
    """
    deg_buffer = meters_to_degree_buffer(radius_meters, lat)

    return {
        "type": "Polygon",
        "coordinates": [
            [
                [lon - deg_buffer, lat - deg_buffer],
                [lon + deg_buffer, lat - deg_buffer],
                [lon + deg_buffer, lat + deg_buffer],
                [lon - deg_buffer, lat + deg_buffer],
                [lon - deg_buffer, lat - deg_buffer],  # Fermeture de l'anneau
            ]
        ],
    }

# Résolution des paramètres d'incident
def _resolve_incident_params(incident_type: str) -> tuple[str, float] | None:
    """Retourne (multiplier, radius_meters) ou None si le type est ignoré (ex: clear)."""
    normalized = INCIDENT_TYPE_ALIASES.get(
        incident_type.lower(), incident_type.lower()
    )

    if normalized == "clear":
        return None

    config = INCIDENT_SEVERITY.get(
        normalized, {"multiplier": "0.50", "radius_meters": 80.0}
    )
    return str(config["multiplier"]), float(config["radius_meters"])


def _canonical_incident_type(incident_type: str) -> str:
    lowered = incident_type.lower()
    return INCIDENT_TYPE_ALIASES.get(lowered, lowered)


def _normalize_incident(raw: dict[str, Any]) -> RoutingIncident | None:
    """Normalise un incident brut en RoutingIncident typé."""
    params = _resolve_incident_params(str(raw["type"]))
    if params is None:
        return None

    _, radius_meters = params
    if "radius_meters" in raw:
        radius_meters = float(raw["radius_meters"])

    return RoutingIncident(
        id=str(raw["id"]),
        type=_canonical_incident_type(str(raw["type"])),
        lon=float(raw["lon"]),
        lat=float(raw["lat"]),
        radius_meters=radius_meters,
        confirmation_count=int(raw.get("confirmation_count", 1)),
    )


def filter_avoidable_incidents(
    incidents: list[RoutingIncident],
) -> list[RoutingIncident]:
    """
    Seuls les incidents confirmés par la communauté (count >= 2) influencent le routage.
    Un incident fraîchement signalé (count == 1) reste visible mais n'est pas évité.
    """
    return [
        incident
        for incident in incidents
        if incident["confirmation_count"] >= MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE
    ]


def fetch_active_incidents(db_session: Session | None) -> list[RoutingIncident]:
    """
    Charge les incidents actifs depuis PostgreSQL (base partagée avec NestJS).

    Retourne une simulation locale uniquement si ``db_session`` est absent (tests offline).
    """
    if db_session is None:
        logger.warning(
            "Aucune session BDD : utilisation des incidents simulés (FALLBACK)."
        )
        return [
            inc
            for raw in FALLBACK_INCIDENTS
            if (inc := _normalize_incident(raw)) is not None
        ]

    from services.incidents import get_active_incidents

    db_rows = get_active_incidents(db_session)
    incidents: list[RoutingIncident] = []

    for db_incident in db_rows:
        normalized = _normalize_incident(
            {
                "id": str(db_incident.id),
                "type": db_incident.type.value,
                "lon": float(db_incident.longitude),
                "lat": float(db_incident.latitude),
                "confirmation_count": int(db_incident.confirmation_count),
            }
        )
        if normalized is not None:
            incidents.append(normalized)

    logger.info(
        "Incidents chargés depuis la BDD : %d total, %d évitables (confirmés >= %d).",
        len(incidents),
        len(filter_avoidable_incidents(incidents)),
        MIN_CONFIRMATION_COUNT_FOR_AVOIDANCE,
    )

    return incidents


# Custom Model GraphHopper

def build_custom_model(
    incidents: list[RoutingIncident],
    saturation: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Convertit les incidents actifs en zones de pénalité pour le Custom Model GraphHopper.

    Chaque incident devient :
    - une zone polygonale (boîte tampon) déclarée dans ``areas``
    - une règle ``priority`` avec ``multiply_by`` réduisant le coût des arêtes traversées
    """
    priority_rules: list[dict[str, str]] = []
    areas: dict[str, dict[str, Any]] = {}
    saturation = saturation or {}

    # Pénalités de saturation sur des voies OSM identifiées (extension future).
    for way_id, status in saturation.items():
        osm_id = way_id.split("_")[1] if "_" in way_id else way_id

        if status == "sature":
            priority_rules.append(
                {"if": f"osm_id == {osm_id}", "multiply_by": "0.15"}
            )
        elif status == "dense":
            priority_rules.append(
                {"if": f"osm_id == {osm_id}", "multiply_by": "0.50"}
            )

    for incident in incidents:
        params = _resolve_incident_params(incident["type"])
        if params is None:
            continue

        multiplier, _ = params
        area_id = f"zone_{incident['id']}"

        areas[area_id] = build_exclusion_polygon(
            lon=incident["lon"],
            lat=incident["lat"],
            radius_meters=incident["radius_meters"],
        )

        priority_rules.append(
            {"if": f"in_{area_id}", "multiply_by": multiplier}
        )

    return {"priority": priority_rules, "areas": areas}


# Appel GraphHopper

def _graphhopper_request_params() -> dict[str, str] | None:
    if GRAPHHOPPER_API_KEY:
        return {"key": GRAPHHOPPER_API_KEY}
    return None


def _graphhopper_base_payload(points: list[list[float]]) -> dict[str, Any]:
    return {
        "points": points,
        "profile": "car",
        "locale": "fr",
        "instructions": True,
        "points_encoded": False,
    }


def _post_graphhopper(payload: dict[str, Any]) -> requests.Response:
    try:
        return requests.post(
            GRAPHHOPPER_URL,
            json=payload,
            params=_graphhopper_request_params(),
            timeout=GRAPHHOPPER_TIMEOUT_SECONDS,
        )
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail="Le service cartographique a mis trop de temps à répondre.",
        ) from exc
    except requests.exceptions.ConnectionError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Le serveur de routage GraphHopper est injoignable ({GRAPHHOPPER_URL}). "
                "Vérifiez l'URL et la clé API GraphHopper Cloud."
            ),
        ) from exc


def _custom_model_unsupported(response_text: str) -> bool:
    lowered = response_text.lower()
    return any(marker in lowered for marker in _CUSTOM_MODEL_UNSUPPORTED_MARKERS)


def _graphhopper_rate_limited(response_text: str) -> bool:
    lowered = response_text.lower()
    return any(marker in lowered for marker in _GRAPHOPPER_RATE_LIMIT_MARKERS)


def _raise_for_graphhopper_failure(response: requests.Response) -> None:
    if _graphhopper_rate_limited(response.text):
        raise GraphHopperRateLimitError(response.text)

    raise HTTPException(
        status_code=502,
        detail=f"Le moteur de routage GraphHopper a échoué : {response.text}",
    )


def _call_graphhopper(
    points: list[list[float]],
    custom_model: dict[str, Any],
    *,
    budget: GraphHopperRequestBudget | None = None,
    apply_custom_model: bool = True,
) -> tuple[dict[str, Any], bool]:
    """
    Envoie la requête POST au moteur GraphHopper (local ou Cloud).

    Retourne ``(réponse_json, penalites_appliquees)``.
    Sur GraphHopper Cloud gratuit, retombe automatiquement sur un routage standard
    si le ``custom_model`` n'est pas autorisé.
    """
    global _custom_model_supported

    if budget is not None and not budget.consume():
        raise GraphHopperBudgetExhausted()

    base_payload = _graphhopper_base_payload(points)
    has_penalties = bool(custom_model.get("priority") or custom_model.get("areas"))
    use_custom_model = (
        apply_custom_model
        and GRAPHHOPPER_CUSTOM_MODEL
        and has_penalties
        and _custom_model_supported is not False
    )

    if use_custom_model:
        payload_with_penalties: dict[str, Any] = {
            **base_payload,
            "custom_model": custom_model,
            "ch.disable": True,
        }
        response = _post_graphhopper(payload_with_penalties)

        if response.status_code == 200:
            _custom_model_supported = True
            return response.json(), True

        if _graphhopper_rate_limited(response.text):
            if budget is not None:
                budget.rate_limited = True
            raise GraphHopperRateLimitError(response.text)

        if _custom_model_unsupported(response.text):
            _custom_model_supported = False
            logger.info(
                "GraphHopper custom_model non supporté — repli sur routage standard."
            )
            if budget is not None and not budget.consume():
                raise GraphHopperBudgetExhausted()
            response = _post_graphhopper(base_payload)
            if response.status_code == 200:
                return response.json(), False
            _raise_for_graphhopper_failure(response)

        _raise_for_graphhopper_failure(response)

    response = _post_graphhopper(base_payload)

    if response.status_code == 200:
        return response.json(), False

    if _graphhopper_rate_limited(response.text):
        if budget is not None:
            budget.rate_limited = True
        raise GraphHopperRateLimitError(response.text)

    _raise_for_graphhopper_failure(response)


def _sample_segment_points(
    lon1: float,
    lat1: float,
    lon2: float,
    lat2: float,
    sample_meters: float = PATH_CROSSING_SAMPLE_METERS,
) -> list[tuple[float, float]]:
    """Échantillonne des points le long d'un segment pour détecter les traversées."""
    segment_length = haversine_distance(lat1, lon1, lat2, lon2)
    if segment_length <= sample_meters:
        return [(lon1, lat1), (lon2, lat2)]

    samples: list[tuple[float, float]] = []
    steps = max(1, int(math.ceil(segment_length / sample_meters)))

    for step in range(steps + 1):
        fraction = step / steps
        samples.append(
            (
                lon1 + (lon2 - lon1) * fraction,
                lat1 + (lat2 - lat1) * fraction,
            )
        )

    return samples


def path_crosses_incident(
    path_coordinates: list[list[float]],
    incident: RoutingIncident,
) -> bool:
    """
    Vérifie si le tracé traverse le rayon d'un incident.

    GraphHopper renvoie des sommets espacés : on échantillonne aussi chaque segment
    pour ne pas rater une zone (ex. travaux) traversée entre deux points.
    """
    if len(path_coordinates) < 2:
        for point in path_coordinates:
            lon_p, lat_p = point[0], point[1]
            distance = haversine_distance(
                lat_p, lon_p, incident["lat"], incident["lon"]
            )
            if distance <= incident["radius_meters"]:
                return True
        return False

    for index in range(len(path_coordinates) - 1):
        lon1, lat1 = path_coordinates[index][0], path_coordinates[index][1]
        lon2, lat2 = path_coordinates[index + 1][0], path_coordinates[index + 1][1]

        for lon_p, lat_p in _sample_segment_points(lon1, lat1, lon2, lat2):
            distance = haversine_distance(
                lat_p, lon_p, incident["lat"], incident["lon"]
            )
            if distance <= incident["radius_meters"]:
                return True

    return False


def find_crossed_incidents(
    path_coordinates: list[list[float]],
    incidents: list[RoutingIncident],
) -> list[RoutingIncident]:
    """Retourne les incidents dont la zone est traversée par le tracé."""
    return [
        incident
        for incident in incidents
        if path_crosses_incident(path_coordinates, incident)
    ]


def _detour_offset_meters(incident: RoutingIncident) -> float:
    config = INCIDENT_SEVERITY.get(incident["type"], {})
    factor = float(config.get("detour_factor", 3.0))
    return incident["radius_meters"] * factor


def build_detour_waypoints(incident: RoutingIncident) -> list[list[float]]:
    """
    Génère des points de contournement autour d'un incident.

    Utilisé lorsque GraphHopper Cloud ne supporte pas le custom_model (plan gratuit)
    ou lorsque les pénalités ne suffisent pas à dévier le tracé.
    """
    offset = meters_to_degree_buffer(
        _detour_offset_meters(incident), incident["lat"]
    )
    lon, lat = incident["lon"], incident["lat"]

    return [
        [lon + offset, lat],
        [lon - offset, lat],
        [lon, lat + offset],
        [lon, lat - offset],
        [lon + offset, lat + offset],
        [lon - offset, lat - offset],
    ][:MAX_DETOUR_WAYPOINTS]


def _select_detour_path(
    start: list[float],
    end: list[float],
    incident: RoutingIncident,
    avoidable_incidents: list[RoutingIncident],
    custom_model: dict[str, Any],
    budget: GraphHopperRequestBudget,
) -> dict[str, Any] | None:
    """Tente un itinéraire start → via → end contournant l'incident ciblé."""
    best_path: dict[str, Any] | None = None
    best_distance = float("inf")

    for via in build_detour_waypoints(incident):
        if budget.exhausted:
            break

        try:
            gh_data, _ = _call_graphhopper(
                [start, via, end],
                custom_model,
                budget=budget,
                apply_custom_model=False,
            )
        except GraphHopperRateLimitError:
            budget.rate_limited = True
            break
        except GraphHopperBudgetExhausted:
            break

        if not gh_data.get("paths"):
            continue

        candidate = gh_data["paths"][0]
        coordinates: list[list[float]] = candidate["points"]["coordinates"]

        if path_crosses_incident(coordinates, incident):
            continue

        distance = float(candidate["distance"])
        if budget.remaining <= 1:
            return candidate

        if distance < best_distance:
            best_distance = distance
            best_path = candidate

    return best_path


def apply_detour_avoidance(
    start: list[float],
    end: list[float],
    path: dict[str, Any],
    avoidable_incidents: list[RoutingIncident],
    custom_model: dict[str, Any],
    budget: GraphHopperRequestBudget,
) -> tuple[dict[str, Any], bool]:
    """
    Ré-itère des contournements tant que le tracé traverse des incidents évitables.

    Retourne ``(path, detour_applied)``.
    """
    current_path = path
    detour_applied = False

    for _ in range(MAX_DETOUR_ATTEMPTS):
        if budget.exhausted or budget.rate_limited:
            break

        coordinates: list[list[float]] = current_path["points"]["coordinates"]
        crossed = find_crossed_incidents(coordinates, avoidable_incidents)
        if not crossed:
            break

        detour_path = _select_detour_path(
            start,
            end,
            crossed[0],
            avoidable_incidents,
            custom_model,
            budget,
        )
        if detour_path is None:
            if budget.rate_limited:
                logger.warning(
                    "Limite GraphHopper atteinte — itinéraire retourné sans contournement complet."
                )
            else:
                logger.warning(
                    "Contournement impossible pour l'incident %s (%s).",
                    crossed[0]["id"],
                    crossed[0]["type"],
                )
            break

        current_path = detour_path
        detour_applied = True

    return current_path, detour_applied


# Détection d'incident inévitable
def detect_inevitable_incidents(
    path_coordinates: list[list[float]],
    incidents: list[RoutingIncident],
) -> bool:
    """
    Vérifie si le tracé final traverse une zone d'incident bloquante confirmée.

    Si GraphHopper renvoie un itinéraire passant dans le rayon d'un checkpoint,
    danger ou accident malgré les pénalités / contournements, aucun détour viable
    n'existe : on lève le drapeau ``alerte_incident_inevitable``.
    """
    blocking_incidents = [
        inc
        for inc in incidents
        if inc["type"] in BLOCKING_INCIDENT_TYPES
    ]

    return bool(find_crossed_incidents(path_coordinates, blocking_incidents))


# Point d'entrée du service
def calculate_dynamic_route(
    start: list[float],
    end: list[float],
    db_session: Session | None = None,
    saturation: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Calcule un itinéraire dynamique entre deux points [longitude, latitude].

    Étapes :
    1. Charger les incidents actifs (BDD ou simulation)
    2. Ne pénaliser que ceux avec confirmation_count >= 2
    3. Construire le custom_model de pénalités géospatiales
    4. Interroger GraphHopper
    5. Contourner via points intermédiaires si le tracé traverse encore un incident
    6. Détecter les incidents inévitables sur le tracé retourné
    7. Formater la réponse pour Flutter
    """
    all_incidents = fetch_active_incidents(db_session)
    avoidable_incidents = filter_avoidable_incidents(all_incidents)

    from services.traffic_saturation import fetch_traffic_congestion_zones

    traffic_zones = fetch_traffic_congestion_zones(db_session, start, end)
    avoidable_incidents = avoidable_incidents + traffic_zones

    custom_model = build_custom_model(avoidable_incidents, saturation)
    budget = GraphHopperRequestBudget(MAX_GRAPHHOPPER_REQUESTS_PER_ROUTE)

    try:
        gh_data, penalites_appliquees = _call_graphhopper(
            [start, end], custom_model, budget=budget
        )
    except GraphHopperRateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail=(
                "Limite d'appels GraphHopper atteinte. Réessayez dans une minute "
                "ou vérifiez votre quota sur graphhopper.com/pricing."
            ),
        ) from exc
    except GraphHopperBudgetExhausted as exc:
        raise HTTPException(
            status_code=429,
            detail="Quota GraphHopper interne dépassé pour ce calcul.",
        ) from exc

    if not gh_data.get("paths"):
        raise HTTPException(
            status_code=404,
            detail="Aucun itinéraire trouvé entre ces deux points.",
        )

    path = gh_data["paths"][0]
    path, detour_applied = apply_detour_avoidance(
        start,
        end,
        path,
        avoidable_incidents,
        custom_model,
        budget,
    )
    penalites_appliquees = penalites_appliquees or detour_applied

    path_coordinates: list[list[float]] = path["points"]["coordinates"]

    alerte_incident_inevitable = detect_inevitable_incidents(
        path_coordinates, avoidable_incidents
    )

    return {
        "distance_metres": float(path["distance"]),
        "temps_secondes": float(path["time"]) / 1000.0,
        "trajet_coordonnees": path_coordinates,
        "instructions": [
            instruction["text"]
            for instruction in path.get("instructions", [])
            if instruction.get("text")
        ],
        "alerte_incident_inevitable": alerte_incident_inevitable,
        "penalites_incidents_appliquees": penalites_appliquees,
    }


def estimate_baseline_route_seconds(
    start: list[float],
    end: list[float],
) -> float | None:
    """Durée optimiste sans pénalités incidents (un appel GraphHopper standard)."""
    empty_model: dict[str, Any] = {"priority": [], "areas": {}}

    try:
        gh_data, _ = _call_graphhopper(
            [start, end],
            empty_model,
            apply_custom_model=False,
        )
    except (HTTPException, GraphHopperRateLimitError, GraphHopperBudgetExhausted):
        logger.warning("Impossible d'estimer la durée de référence GraphHopper.")
        return None

    paths = gh_data.get("paths") or []
    if not paths:
        return None

    return float(paths[0]["time"]) / 1000.0
