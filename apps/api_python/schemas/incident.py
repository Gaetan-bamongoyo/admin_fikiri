from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from database.models import IncidentType, IncidentStatus

class IncidentCreate(BaseModel):
    type: IncidentType
    latitude: float = Field(..., description="Latitude de l'incident (Kinshasa env. -4.3)", ge=-90.0, le=90.0)
    longitude: float = Field(..., description="Longitude de l'incident (Kinshasa env. 15.3)", ge=-180.0, le=180.0)
    description: Optional[str] = Field(None, max_length=500, description="Description facultative de l'incident")
    address: Optional[str] = Field(None, max_length=255, description="Adresse textuelle ou point d'intérêt facultatif")

class IncidentResponse(BaseModel):
    id: UUID
    type: IncidentType
    status: IncidentStatus
    latitude: float
    longitude: float
    description: Optional[str]
    address: Optional[str]
    reporter_id: UUID
    confirmation_count: int
    expires_at: datetime
    resolved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

    # Pydantic v2 convertira les objets Decimal (Numeric en SQLAlchemy) en float automatiquement,
    # mais au cas où, on s'assure qu'ils sont formatés correctement.
    @field_validator("latitude", "longitude", mode="before")
    @classmethod
    def convert_numeric_to_float(cls, v):
        if v is not None:
            return float(v)
        return v
