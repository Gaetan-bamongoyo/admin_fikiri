"""Règles métier : faut-il envoyer une notification à cet utilisateur ?"""

from __future__ import annotations

from sqlalchemy.orm import Session

from database.notification_models import UserPreferences


def get_user_preferences(db: Session, user_id) -> UserPreferences | None:
    return (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == user_id, UserPreferences.deleted_at.is_(None))
        .one_or_none()
    )


def should_send_push(
    preferences: UserPreferences | None,
    *,
    alert_type: str,
) -> bool:
    if preferences is None:
        return True

    if not preferences.notifications_enabled:
        return False

    if alert_type == "region":
        return preferences.traffic_region_alerts_enabled

    if alert_type == "route_incident":
        return preferences.route_incident_alerts_enabled

    if alert_type == "home":
        return preferences.home_traffic_alerts_enabled

    if alert_type == "work":
        return preferences.work_traffic_alerts_enabled

    if alert_type == "anticipatory":
        return preferences.anticipatory_alerts_enabled

    return True
