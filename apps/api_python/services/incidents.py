from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from database.models import Incident, IncidentConfirmation, IncidentStatus
from schemas.incident import IncidentCreate

DEFAULT_INCIDENT_TTL_HOURS = 4


def create_incident(db: Session, reporter_id: UUID, schema: IncidentCreate) -> Incident:
    # Calcul de la date d'expiration
    expires_at = datetime.now(timezone.utc) + timedelta(hours=DEFAULT_INCIDENT_TTL_HOURS)
    
    # Créer l'incident
    new_incident = Incident(
        type=schema.type,
        status=IncidentStatus.active,
        latitude=schema.latitude,
        longitude=schema.longitude,
        location=(schema.longitude, schema.latitude), 
        description=schema.description,
        address=schema.address,
        reporter_id=reporter_id,
        confirmation_count=1,
        expires_at=expires_at
    )
    
    db.add(new_incident)
    db.flush() # Récupère l'ID généré de l'incident avant le commit final
    
    # Ajouter la confirmation automatique pour le reporter
    auto_confirmation = IncidentConfirmation(
        incident_id=new_incident.id,
        user_id=reporter_id,
        is_confirm=True
    )
    db.add(auto_confirmation)
    
    db.commit()
    db.refresh(new_incident)
    
    return new_incident


def get_active_incidents(db: Session) -> list[Incident]:
    """
    Récupère les incidents signalés aujourd'hui, actifs et non expirés.

    Critères :
    - status = active
    - expires_at > now
    - created_at >= début de la journée (UTC)
    - non supprimés (soft delete)
    """
    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    return (
        db.query(Incident)
        .filter(
            Incident.status == IncidentStatus.active,
            Incident.expires_at > now,
            Incident.created_at >= start_of_today,
            Incident.deleted_at.is_(None),
        )
        .order_by(Incident.created_at.desc())
        .all()
    )


def get_all_incidents(db: Session) -> list[Incident]:
    """Alias conservé pour le routage et les tests existants."""
    return get_active_incidents(db)
