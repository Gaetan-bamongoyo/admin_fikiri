from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.config import get_db
from schemas.routing import RouteRequest, RouteResponse
from services.routing_service import calculate_dynamic_route

router = APIRouter(
    prefix="/api/v1/routing",
    tags=["Routing"],
)


@router.post(
    "/compute",
    response_model=RouteResponse,
    summary="Calculer un itinéraire dynamique",
    response_description="Itinéraire optimisé en contournant les incidents actifs",
)
async def compute_route(
    payload: RouteRequest,
    db: Session = Depends(get_db),
) -> RouteResponse:
    """
    Calcule un itinéraire entre deux points GPS en appliquant des pénalités
    géospatiales sur le graphe routier GraphHopper.

    Les coordonnées d'entrée sont au format **[longitude, latitude]**.
    Les ``HTTPException`` levées par le service (503, 502, 404, 504) sont
    propagées telles quelles par FastAPI — aucun re-wrapping en 500.
    """
    result = calculate_dynamic_route(
        start=payload.start,
        end=payload.end,
        db_session=db,
    )
    return RouteResponse(**result)
