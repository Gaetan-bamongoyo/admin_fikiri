"""Authentification service-à-service (NestJS → api_python)."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException, status

_INTERNAL_SECRET = os.getenv("NOTIFICATIONS_INTERNAL_SECRET", "").strip()


def verify_notifications_internal_secret(
    x_notifications_internal_secret: str = Header(
        ...,
        alias="X-Notifications-Internal-Secret",
    ),
) -> None:
    if not _INTERNAL_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NOTIFICATIONS_INTERNAL_SECRET non configuré sur api_python.",
        )

    if x_notifications_internal_secret != _INTERNAL_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Secret interne invalide.",
        )
