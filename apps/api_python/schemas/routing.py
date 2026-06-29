from typing import List

from pydantic import BaseModel, Field, field_validator


class RouteRequest(BaseModel):
    """
    Requête de calcul d'itinéraire envoyée par l'application mobile.

    Les coordonnées sont exprimées au format [Longitude, Latitude] (EPSG:4326),
    conformément à la convention GeoJSON et à l'API GraphHopper.
    """

    start: List[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Point de départ [longitude, latitude]",
        examples=[[15.3100, -4.3200]],
    )
    end: List[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Point d'arrivée [longitude, latitude]",
        examples=[[15.3180, -4.3250]],
    )

    @field_validator("start", "end")
    @classmethod
    def validate_coordinates(cls, coords: List[float]) -> List[float]:
        longitude, latitude = coords[0], coords[1]

        if not -180.0 <= longitude <= 180.0:
            raise ValueError(
                f"Longitude invalide ({longitude}). Valeur attendue entre -180 et 180."
            )
        if not -90.0 <= latitude <= 90.0:
            raise ValueError(
                f"Latitude invalide ({latitude}). Valeur attendue entre -90 et 90."
            )

        return coords


class RouteResponse(BaseModel):
    """Réponse structurée renvoyée à l'application mobile."""

    distance_metres: float = Field(..., description="Distance totale du trajet en mètres")
    temps_secondes: float = Field(..., description="Durée estimée du trajet en secondes")
    trajet_coordonnees: List[List[float]] = Field(
        ...,
        description="Liste de points [longitude, latitude] décrivant le tracé GPS",
    )
    instructions: List[str] = Field(
        default_factory=list,
        description="Instructions de navigation en langage naturel",
    )
    alerte_incident_inevitable: bool = Field(
        ...,
        description=(
            "True si le trajet traverse malgré tout une zone d'incident bloquante "
            "(aucun contournement viable trouvé)"
        ),
    )
    penalites_incidents_appliquees: bool = Field(
        default=False,
        description=(
            "True si GraphHopper a appliqué le custom_model de pénalités. "
            "False si repli sur un itinéraire standard (ex: plan Cloud gratuit)."
        ),
    )
