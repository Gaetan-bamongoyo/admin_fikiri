from __future__ import annotations

import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.config import get_db
from database.notification_models import Alert, UserPreferences
from schemas.notifications import (
    AlertResponse,
    DeviceTokenDeleteRequest,
    DeviceTokenRegisterRequest,
    DeviceTokenResponse,
    NotificationPreferencesSnapshot,
    PushDispatchRequest,
    PushSendResult,
    PushTestRequest,
    SuccessResponse,
)
from services.auth import get_current_user_id
from services.device_token_service import (
    delete_device_tokens,
    list_tokens_for_user,
    register_device_token,
)
from services.internal_auth import verify_notifications_internal_secret
from services.notification_policy import get_user_preferences
from services.push_notification_service import (
    PushNotificationNotConfiguredError,
    PushNotificationService,
)

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)

_TEST_ENABLED = os.getenv("NOTIFICATIONS_TEST_ENABLED", "false").lower() in {
    "1",
    "true",
    "yes",
}


@router.post(
    "/device-token",
    response_model=DeviceTokenResponse,
    summary="Enregistrer ou mettre à jour un token FCM",
)
async def upsert_device_token(
    payload: DeviceTokenRegisterRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> DeviceTokenResponse:
    token = register_device_token(
        db,
        user_id=user_id,
        fcm_token=payload.fcm_token.strip(),
        platform=payload.platform.value,
    )
    return DeviceTokenResponse.model_validate(token)


@router.delete(
    "/device-token",
    response_model=SuccessResponse,
    summary="Supprimer un token FCM (ou tous les tokens de l'utilisateur)",
)
async def remove_device_token(
    payload: DeviceTokenDeleteRequest | None = None,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    fcm_token = payload.fcm_token.strip() if payload and payload.fcm_token else None
    removed = delete_device_tokens(db, user_id=user_id, fcm_token=fcm_token)
    return SuccessResponse(
        success=True,
        detail=f"{removed} token(s) supprimé(s).",
        data={"removed": removed},
    )


@router.get(
    "/device-token",
    response_model=list[DeviceTokenResponse],
    summary="Lister les tokens FCM de l'utilisateur connecté",
)
async def get_device_tokens(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[DeviceTokenResponse]:
    tokens = list_tokens_for_user(db, user_id)
    return [DeviceTokenResponse.model_validate(token) for token in tokens]


@router.get(
    "/preferences",
    response_model=NotificationPreferencesSnapshot,
    summary="Lire les préférences de notification (miroir NestJS)",
)
async def get_notification_preferences(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> NotificationPreferencesSnapshot:
    preferences = get_user_preferences(db, user_id)
    if preferences is None:
        return NotificationPreferencesSnapshot(
            notifications_enabled=True,
            traffic_region_alerts_enabled=True,
            route_incident_alerts_enabled=True,
            anticipatory_alerts_enabled=True,
            departure_reminder_minutes=0,
            home_traffic_alerts_enabled=False,
            work_traffic_alerts_enabled=False,
        )

    return NotificationPreferencesSnapshot(
        notifications_enabled=preferences.notifications_enabled,
        traffic_region_alerts_enabled=preferences.traffic_region_alerts_enabled,
        route_incident_alerts_enabled=preferences.route_incident_alerts_enabled,
        anticipatory_alerts_enabled=preferences.anticipatory_alerts_enabled,
        departure_reminder_minutes=preferences.departure_reminder_minutes,
        home_traffic_alerts_enabled=preferences.home_traffic_alerts_enabled,
        work_traffic_alerts_enabled=preferences.work_traffic_alerts_enabled,
    )


@router.get(
    "/alerts/me",
    response_model=list[AlertResponse],
    summary="Historique des alertes de l'utilisateur",
)
async def list_my_alerts(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[AlertResponse]:
    try:
        alerts = (
            db.query(Alert)
            .filter(Alert.user_id == user_id, Alert.deleted_at.is_(None))
            .order_by(Alert.created_at.desc())
            .limit(50)
            .all()
        )
    except Exception as exc:  # noqa: BLE001 — table alerts peut être absente
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Table alerts indisponible : {exc}",
        ) from exc

    return [AlertResponse.model_validate(alert) for alert in alerts]


@router.post(
    "/dispatch",
    response_model=PushSendResult,
    summary="Envoyer une push pour une alerte (appel interne NestJS)",
)
async def dispatch_alert_push(
    payload: PushDispatchRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_notifications_internal_secret),
) -> PushSendResult:
    try:
        result = PushNotificationService.send_to_user(
            db,
            user_id=payload.user_id,
            title=payload.title,
            body=payload.body,
            data=payload.data,
            alert_type=payload.alert_type,
            respect_preferences=True,
        )
    except PushNotificationNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return PushSendResult(
        success_count=result.success_count,
        failure_count=result.failure_count,
        invalid_tokens_removed=result.invalid_tokens_removed,
    )


@router.post(
    "/test",
    response_model=PushSendResult,
    summary="Envoyer une notification de test (dev / staging)",
)
async def send_test_notification(
    payload: PushTestRequest | None = None,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> PushSendResult:
    if not _TEST_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint de test désactivé. Définissez NOTIFICATIONS_TEST_ENABLED=true.",
        )

    body = payload or PushTestRequest()

    try:
        result = PushNotificationService.send_to_user(
            db,
            user_id=user_id,
            title=body.title,
            body=body.body,
            data={"type": "test"},
            alert_type="generic",
            respect_preferences=False,
        )
    except PushNotificationNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if result.success_count == 0 and result.failure_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun token FCM enregistré pour cet utilisateur.",
        )

    return PushSendResult(
        success_count=result.success_count,
        failure_count=result.failure_count,
        invalid_tokens_removed=result.invalid_tokens_removed,
    )
