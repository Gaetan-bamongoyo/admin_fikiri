from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from services.device_token_service import list_tokens_for_user, remove_tokens_by_value
from services.notification_policy import get_user_preferences, should_send_push

logger = logging.getLogger(__name__)


class PushNotificationNotConfiguredError(RuntimeError):
    """Firebase Admin n'est pas configuré sur ce serveur."""


@dataclass
class PushDeliveryResult:
    success_count: int = 0
    failure_count: int = 0
    invalid_tokens_removed: int = 0


class PushNotificationService:
    _initialized = False

    @classmethod
    def is_configured(cls) -> bool:
        return bool(
            os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
            or os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        )

    @classmethod
    def _ensure_initialized(cls) -> None:
        if cls._initialized:
            return

        if not cls.is_configured():
            raise PushNotificationNotConfiguredError(
                "Définissez FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON."
            )

        import firebase_admin
        from firebase_admin import credentials

        path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        json_payload = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

        if path:
            resolved = Path(path)
            if not resolved.is_absolute():
                resolved = Path(__file__).resolve().parent.parent / path
            cred = credentials.Certificate(str(resolved))
        else:
            cred = credentials.Certificate(json.loads(json_payload or "{}"))

        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)

        cls._initialized = True

    @classmethod
    def send_to_tokens(
        cls,
        *,
        tokens: list[str],
        title: str,
        body: str,
        data: dict[str, str] | None = None,
    ) -> tuple[PushDeliveryResult, list[str]]:
        if not tokens:
            return PushDeliveryResult(), []

        cls._ensure_initialized()

        from firebase_admin import messaging

        payload_data = {key: str(value) for key, value in (data or {}).items()}
        result = PushDeliveryResult()
        invalid_tokens: list[str] = []

        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=payload_data,
                token=token,
            )
            try:
                messaging.send(message)
                result.success_count += 1
            except Exception as exc:  # noqa: BLE001
                result.failure_count += 1
                logger.warning("Échec envoi FCM token=%s… : %s", token[:12], exc)
                if cls._is_invalid_token_error(exc):
                    invalid_tokens.append(token)

        if invalid_tokens:
            result.invalid_tokens_removed = len(invalid_tokens)

        return result, invalid_tokens

    @staticmethod
    def _is_invalid_token_error(exc: Exception) -> bool:
        code = str(getattr(exc, "code", "")).lower()
        message = str(exc).lower()
        return (
            "registration-token-not-registered" in code
            or "registration-token-not-registered" in message
            or "notregistered" in message
        )

    @classmethod
    def send_to_user(
        cls,
        db: Session,
        *,
        user_id: UUID,
        title: str,
        body: str,
        data: dict[str, str] | None = None,
        alert_type: str = "generic",
        respect_preferences: bool = True,
    ) -> PushDeliveryResult:
        if respect_preferences:
            preferences = get_user_preferences(db, user_id)
            if not should_send_push(preferences, alert_type=alert_type):
                logger.info(
                    "Push ignorée pour user=%s (type=%s, préférences)",
                    user_id,
                    alert_type,
                )
                return PushDeliveryResult()

        device_tokens = list_tokens_for_user(db, user_id)
        token_values = [row.fcm_token for row in device_tokens]
        delivery, invalid = cls.send_to_tokens(
            tokens=token_values,
            title=title,
            body=body,
            data=data,
        )

        if invalid:
            delivery.invalid_tokens_removed = remove_tokens_by_value(db, invalid)

        return delivery
