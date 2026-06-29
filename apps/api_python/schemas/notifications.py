from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DevicePlatformSchema(str, Enum):
    android = "android"
    ios = "ios"


class DeviceTokenRegisterRequest(BaseModel):
    fcm_token: str = Field(..., min_length=10, max_length=512)
    platform: DevicePlatformSchema


class DeviceTokenResponse(BaseModel):
    id: UUID
    user_id: UUID
    fcm_token: str
    platform: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeviceTokenDeleteRequest(BaseModel):
    fcm_token: Optional[str] = Field(
        default=None,
        description="Token à supprimer. Si absent, tous les tokens de l'utilisateur sont supprimés.",
    )


class PushTestRequest(BaseModel):
    title: str = Field(default="Test Fikiri Traffic", max_length=120)
    body: str = Field(
        default="Les notifications push fonctionnent correctement.",
        max_length=500,
    )


class PushDispatchRequest(BaseModel):
    """Appel service-à-service depuis le cron NestJS après création d'une alerte."""

    user_id: UUID
    title: str = Field(default="Fikiri Traffic", max_length=120)
    body: str = Field(..., min_length=1, max_length=500)
    alert_type: str = Field(
        default="generic",
        max_length=50,
        description="Catégorie pour notification_policy (anticipatory, region, …).",
    )
    data: dict[str, str] | None = None


class PushSendResult(BaseModel):
    success_count: int
    failure_count: int
    invalid_tokens_removed: int = 0


class AlertResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    message: str
    severity: str
    is_read: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferencesSnapshot(BaseModel):
    notifications_enabled: bool
    traffic_region_alerts_enabled: bool
    route_incident_alerts_enabled: bool
    anticipatory_alerts_enabled: bool
    departure_reminder_minutes: int
    home_traffic_alerts_enabled: bool
    work_traffic_alerts_enabled: bool


class SuccessResponse(BaseModel):
    success: bool = True
    detail: Optional[str] = None
    data: Optional[Any] = None
