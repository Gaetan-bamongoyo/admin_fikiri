"""Modèles ORM liés aux notifications (tables partagées + device_tokens)."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from database.config import Base


class BaseEntityMixin:
    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()"),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class DevicePlatform(str, enum.Enum):
    android = "android"
    ios = "ios"


class User(Base):
    """Table users (NestJS) — stub minimal pour les FK SQLAlchemy."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True)


class DeviceToken(Base, BaseEntityMixin):
    __tablename__ = "device_tokens"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fcm_token: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)


class UserPreferences(Base, BaseEntityMixin):
    """Lecture des préférences créées par NestJS (pas de migration côté Python)."""

    __tablename__ = "user_preferences"

    user_id: Mapped[UUID] = mapped_column(nullable=False, unique=True)
    home_latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    home_longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    work_latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    work_longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    anticipatory_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    anonymize_position_data: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    search_metro: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    traffic_region_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    route_incident_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    departure_reminder_minutes: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    home_traffic_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    work_traffic_alerts_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )


class Alert(Base, BaseEntityMixin):
    """Historique des alertes (table NestJS si présente)."""

    __tablename__ = "alerts"

    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
