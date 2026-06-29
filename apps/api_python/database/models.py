import enum
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Enum as SQLEnum,
    UniqueConstraint,
    text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UserDefinedType
from database.config import Base

# --- Énumérations ---

class IncidentStatus(str, enum.Enum):
    active = "active"
    resolved = "resolved"
    expired = "expired"
    disputed = "disputed"

class IncidentType(str, enum.Enum):
    congestion = "congestion"
    accident = "accident"
    roadwork = "roadwork"
    checkpoint = "checkpoint"
    danger = "danger"
    clear = "clear"

# --- Type Personnalisé pour la Géographie PostGIS ---

class GeographyPoint(UserDefinedType):
    """Représente un type GEOGRAPHY(Point, 4326) de PostGIS."""
    def get_col_spec(self, **kw):
        return "GEOGRAPHY(Point, 4326)"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            # Support des tuples (longitude, latitude) ou dicts {"type": "Point", "coordinates": [lon, lat]}
            if isinstance(value, dict) and value.get("type") == "Point":
                coords = value.get("coordinates")
                return f"SRID=4326;POINT({coords[0]} {coords[1]})"
            elif isinstance(value, (list, tuple)):
                return f"SRID=4326;POINT({value[0]} {value[1]})"
            return value
        return process

# --- Modèle de base abstrait (BaseEntity) ---

class BaseEntity(Base):
    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()"),
        nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

# --- Modèles ORM ---

class Incident(BaseEntity):
    __tablename__ = "incidents"

    type: Mapped[IncidentType] = mapped_column(
        SQLEnum(IncidentType, native_enum=True),
        nullable=False
    )
    status: Mapped[IncidentStatus] = mapped_column(
        SQLEnum(IncidentStatus, native_enum=True),
        default=IncidentStatus.active,
        nullable=False
    )
    latitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    location: Mapped[Optional[GeographyPoint]] = mapped_column(GeographyPoint, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reporter_id: Mapped[UUID] = mapped_column(
        nullable=False
    )
    confirmation_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relations
    confirmations: Mapped[List["IncidentConfirmation"]] = relationship(
        "IncidentConfirmation",
        back_populates="incident",
        cascade="all, delete-orphan"
    )

class IncidentConfirmation(BaseEntity):
    __tablename__ = "incident_confirmations"
    __table_args__ = (
        UniqueConstraint("incident_id", "user_id", name="uq_incident_user_confirmation"),
    )

    incident_id: Mapped[UUID] = mapped_column(
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        nullable=False
    )
    is_confirm: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Relations
    incident: Mapped["Incident"] = relationship("Incident", back_populates="confirmations")
