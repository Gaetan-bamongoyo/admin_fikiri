from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from database.notification_models import DeviceToken


def list_tokens_for_user(db: Session, user_id: UUID) -> list[DeviceToken]:
    return (
        db.query(DeviceToken)
        .filter(DeviceToken.user_id == user_id, DeviceToken.deleted_at.is_(None))
        .all()
    )


def register_device_token(
    db: Session,
    *,
    user_id: UUID,
    fcm_token: str,
    platform: str,
) -> DeviceToken:
    # UNIQUE(fcm_token) s'applique aussi aux lignes soft-deleted.
    existing = (
        db.query(DeviceToken)
        .filter(DeviceToken.fcm_token == fcm_token)
        .one_or_none()
    )

    now = datetime.now(timezone.utc)

    if existing is not None:
        existing.user_id = user_id
        existing.platform = platform
        existing.deleted_at = None
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing

    token = DeviceToken(
        user_id=user_id,
        fcm_token=fcm_token,
        platform=platform,
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def delete_device_tokens(
    db: Session,
    *,
    user_id: UUID,
    fcm_token: str | None = None,
) -> int:
    query = db.query(DeviceToken).filter(
        DeviceToken.user_id == user_id,
        DeviceToken.deleted_at.is_(None),
    )
    if fcm_token is not None:
        query = query.filter(DeviceToken.fcm_token == fcm_token)

    tokens = query.all()
    now = datetime.now(timezone.utc)
    for token in tokens:
        token.deleted_at = now
        token.updated_at = now

    if tokens:
        db.commit()

    return len(tokens)


def remove_tokens_by_value(db: Session, tokens: list[str]) -> int:
    if not tokens:
        return 0

    rows = (
        db.query(DeviceToken)
        .filter(DeviceToken.fcm_token.in_(tokens), DeviceToken.deleted_at.is_(None))
        .all()
    )
    now = datetime.now(timezone.utc)
    for row in rows:
        row.deleted_at = now
        row.updated_at = now

    if rows:
        db.commit()

    return len(rows)
