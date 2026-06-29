from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from database.config import get_db
from database.models import Incident
from services.auth import get_current_user_id
from services.incidents import create_incident as service_create_incident
from services.incidents import get_active_incidents
from schemas.incident import IncidentCreate, IncidentResponse

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


@router.get(
    "",
    response_model=List[IncidentResponse],
    summary="Lister les incidents actifs (base de données)",
)
@router.get(
    "/",
    response_model=List[IncidentResponse],
    include_in_schema=False,
)
async def list_incidents(db: Session = Depends(get_db)) -> list[Incident]:
    """
    Retourne les incidents signalés aujourd'hui (actifs, non expirés) depuis PostgreSQL.
    """
    return get_active_incidents(db)


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Signaler un nouvel incident routier"
)
@router.post(
    "/",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def report_incident(
    schema: IncidentCreate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Enregistre un nouvel incident de trafic routier.
    Nécessite d'être authentifié avec un token JWT valide émis par l'application NestJS.
    
    L'incident est automatiquement géolocalisé et une confirmation est créée pour le déclarant.
    """
    incident = service_create_incident(db, current_user_id, schema)
    return incident
