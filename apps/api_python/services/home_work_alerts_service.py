"""Alertes trafic avant départ vers Maison / Travail."""

from __future__ import annotations

import logging
import math
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Final
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from database.notification_models import Alert, UserPreferences
from services.notification_policy import should_send_push
from services.push_notification_service import (
    PushNotificationNotConfiguredError,
    PushNotificationService,
)
from services.routing_service import (
    calculate_dynamic_route,
    estimate_baseline_route_seconds,
    haversine_distance,
)

logger = logging.getLogger(__name__)

KINSHASA_TZ: Final = ZoneInfo("Africa/Kinshasa")

MORNING_START: Final[int] = int(os.getenv("HOME_WORK_ALERTS_MORNING_START", "5"))
MORNING_END: Final[int] = int(os.getenv("HOME_WORK_ALERTS_MORNING_END", "10"))
EVENING_START: Final[int] = int(os.getenv("HOME_WORK_ALERTS_EVENING_START", "16"))
EVENING_END: Final[int] = int(os.getenv("HOME_WORK_ALERTS_EVENING_END", "21"))
DELAY_RATIO: Final[float] = float(os.getenv("HOME_WORK_ALERTS_DELAY_RATIO", "1.35"))
COOLDOWN_MINUTES: Final[int] = int(os.getenv("HOME_WORK_ALERTS_COOLDOWN_MINUTES", "60"))
MAX_USERS_PER_CYCLE: Final[int] = int(
    os.getenv("HOME_WORK_ALERTS_MAX_USERS_PER_CYCLE", "30")
)
MAX_COMMUTE_DISTANCE_KM: Final[float] = float(
    os.getenv("HOME_WORK_ALERTS_MAX_DISTANCE_KM", "150")
)


@dataclass(frozen=True)
class RouteTrafficAssessment:
    current_seconds: float
    baseline_seconds: float
    delay_ratio: float
    inevitable_incident: bool
    penalties_applied: bool


@dataclass(frozen=True)
class CommuteLeg:
    alert_db_type: str
    push_alert_type: str
    destination_label: str
    start: list[float]
    end: list[float]
    end_latitude: float
    end_longitude: float


def _coord(value: object | None) -> float | None:
    if value is None:
        return None
    return float(value)


def in_work_commute_window(now: datetime | None = None) -> bool:
    hour = (now or datetime.now(timezone.utc)).astimezone(KINSHASA_TZ).hour
    return MORNING_START <= hour < MORNING_END


def in_home_commute_window(now: datetime | None = None) -> bool:
    hour = (now or datetime.now(timezone.utc)).astimezone(KINSHASA_TZ).hour
    return EVENING_START <= hour < EVENING_END


def is_traffic_delay_significant(assessment: RouteTrafficAssessment) -> bool:
    if assessment.inevitable_incident:
        return True

    if assessment.delay_ratio >= DELAY_RATIO:
        return True

    return assessment.penalties_applied and assessment.delay_ratio >= 1.15


def severity_for_assessment(assessment: RouteTrafficAssessment) -> str:
    if assessment.inevitable_incident or assessment.delay_ratio >= 1.6:
        return "high"
    if assessment.delay_ratio >= DELAY_RATIO:
        return "medium"
    return "low"


def format_commute_message(
    destination_label: str,
    assessment: RouteTrafficAssessment,
) -> str:
    current_min = max(1, math.ceil(assessment.current_seconds / 60))
    extra_min = max(
        0,
        math.ceil((assessment.current_seconds - assessment.baseline_seconds) / 60),
    )

    if assessment.inevitable_incident:
        return (
            f"Départ vers {destination_label} : incident sur votre trajet — "
            f"comptez environ {current_min} min."
        )

    if extra_min > 0:
        return (
            f"Départ vers {destination_label} : trafic dense — "
            f"environ {current_min} min (+{extra_min} min)."
        )

    return (
        f"Départ vers {destination_label} : conditions difficiles — "
        f"environ {current_min} min."
    )


def push_title_for_destination(destination_label: str) -> str:
    return f"Alerte trafic — {destination_label}"


def commute_distance_km(start: list[float], end: list[float]) -> float:
    """Distance à vol d'oiseau entre deux points [lon, lat]."""
    return haversine_distance(start[1], start[0], end[1], end[0]) / 1000.0


def is_plausible_commute(start: list[float], end: list[float]) -> bool:
    distance_km = commute_distance_km(start, end)
    if distance_km <= MAX_COMMUTE_DISTANCE_KM:
        return True

    logger.warning(
        "Trajet ignoré : %.0f km entre départ et arrivée "
        "(max %.0f km — vérifiez les coords Maison/Travail dans l'app).",
        distance_km,
        MAX_COMMUTE_DISTANCE_KM,
    )
    return False


def evaluate_route_traffic(
    db: Session,
    start: list[float],
    end: list[float],
) -> RouteTrafficAssessment | None:
    try:
        dynamic = calculate_dynamic_route(start, end, db_session=db)
    except HTTPException as exc:
        logger.warning("Routage dynamique indisponible : %s", exc.detail)
        return None

    baseline = estimate_baseline_route_seconds(start, end)
    if baseline is None or baseline <= 0:
        return None

    current = float(dynamic["temps_secondes"])
    return RouteTrafficAssessment(
        current_seconds=current,
        baseline_seconds=baseline,
        delay_ratio=current / baseline,
        inevitable_incident=bool(dynamic.get("alerte_incident_inevitable")),
        penalties_applied=bool(dynamic.get("penalites_incidents_appliquees")),
    )


def list_commute_preferences(db: Session) -> list[UserPreferences]:
    return (
        db.query(UserPreferences)
        .filter(
            UserPreferences.deleted_at.is_(None),
            UserPreferences.notifications_enabled.is_(True),
            (
                UserPreferences.home_traffic_alerts_enabled.is_(True)
                | UserPreferences.work_traffic_alerts_enabled.is_(True)
            ),
        )
        .limit(MAX_USERS_PER_CYCLE)
        .all()
    )


def _last_user_location(db: Session, user_id: UUID) -> tuple[float, float] | None:
    row = db.execute(
        text(
            """
            SELECT latitude, longitude
            FROM traffic_reports
            WHERE user_id = :user_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {"user_id": str(user_id)},
    ).fetchone()

    if row is None:
        return None

    return float(row.latitude), float(row.longitude)


def _minutes_since_last_alert(db: Session, user_id: UUID, alert_type: str) -> float | None:
    try:
        row = db.execute(
            text(
                """
                SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 60.0 AS minutes
                FROM alerts
                WHERE user_id = :user_id
                  AND type = :alert_type
                  AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"user_id": str(user_id), "alert_type": alert_type},
        ).fetchone()
    except ProgrammingError:
        db.rollback()
        logger.warning(
            "Table alerts absente — exécutez database/migrations/002_create_alerts.sql"
        )
        return None

    if row is None or row.minutes is None:
        return None

    return float(row.minutes)


def _resolve_start_point(
    db: Session,
    user_id: UUID,
    primary: tuple[float, float] | None,
    fallback: tuple[float, float] | None,
) -> list[float] | None:
    if primary is not None:
        lat, lon = primary
        return [lon, lat]

    if fallback is not None:
        lat, lon = fallback
        return [lon, lat]

    last = _last_user_location(db, user_id)
    if last is None:
        return None

    lat, lon = last
    return [lon, lat]


def build_commute_legs(
    db: Session,
    preferences: UserPreferences,
    *,
    now: datetime | None = None,
) -> list[CommuteLeg]:
    home = (
        _coord(preferences.home_latitude),
        _coord(preferences.home_longitude),
    )
    work = (
        _coord(preferences.work_latitude),
        _coord(preferences.work_longitude),
    )
    has_home = home[0] is not None and home[1] is not None
    has_work = work[0] is not None and work[1] is not None

    legs: list[CommuteLeg] = []

    if preferences.work_traffic_alerts_enabled and in_work_commute_window(now):
        if has_work:
            start = _resolve_start_point(
                db,
                preferences.user_id,
                (home[0], home[1]) if has_home else None,
                None,
            )
            if start is not None:
                end = [work[1], work[0]]
                legs.append(
                    CommuteLeg(
                        alert_db_type="WORK_TRAFFIC",
                        push_alert_type="work",
                        destination_label="Travail",
                        start=start,
                        end=end,
                        end_latitude=work[0],
                        end_longitude=work[1],
                    )
                )

    if preferences.home_traffic_alerts_enabled and in_home_commute_window(now):
        if has_home:
            start = _resolve_start_point(
                db,
                preferences.user_id,
                (work[0], work[1]) if has_work else None,
                None,
            )
            if start is not None:
                end = [home[1], home[0]]
                legs.append(
                    CommuteLeg(
                        alert_db_type="HOME_TRAFFIC",
                        push_alert_type="home",
                        destination_label="Maison",
                        start=start,
                        end=end,
                        end_latitude=home[0],
                        end_longitude=home[1],
                    )
                )

    return legs


def _create_alert_record(
    db: Session,
    *,
    user_id: UUID,
    alert_type: str,
    message: str,
    severity: str,
    latitude: float,
    longitude: float,
) -> Alert | None:
    alert = Alert(
        user_id=user_id,
        type=alert_type,
        message=message,
        severity=severity,
        is_read=False,
        latitude=latitude,
        longitude=longitude,
    )
    try:
        db.add(alert)
        db.flush()
        return alert
    except ProgrammingError:
        db.rollback()
        logger.warning(
            "Impossible d'enregistrer l'alerte (table alerts absente) — push seule."
        )
        return None


def process_commute_leg(
    db: Session,
    preferences: UserPreferences,
    leg: CommuteLeg,
) -> bool:
    minutes_since = _minutes_since_last_alert(
        db,
        preferences.user_id,
        leg.alert_db_type,
    )
    if minutes_since is not None and minutes_since < COOLDOWN_MINUTES:
        return False

    if not should_send_push(preferences, alert_type=leg.push_alert_type):
        return False

    if not is_plausible_commute(leg.start, leg.end):
        return False

    assessment = evaluate_route_traffic(db, leg.start, leg.end)
    if assessment is None or not is_traffic_delay_significant(assessment):
        return False

    message = format_commute_message(leg.destination_label, assessment)
    severity = severity_for_assessment(assessment)
    alert = _create_alert_record(
        db,
        user_id=preferences.user_id,
        alert_type=leg.alert_db_type,
        message=message,
        severity=severity,
        latitude=leg.end_latitude,
        longitude=leg.end_longitude,
    )
    alert_id = str(alert.id) if alert is not None else str(uuid4())

    if not PushNotificationService.is_configured():
        db.commit()
        logger.warning(
            "Alerte %s créée sans push (Firebase non configuré).",
            leg.alert_db_type,
        )
        return True

    try:
        PushNotificationService.send_to_user(
            db,
            user_id=preferences.user_id,
            title=push_title_for_destination(leg.destination_label),
            body=message,
            data={
                "alert_id": alert_id,
                "type": leg.alert_db_type,
                "severity": severity,
            },
            alert_type=leg.push_alert_type,
            respect_preferences=True,
        )
    except PushNotificationNotConfiguredError:
        logger.warning("Firebase non configuré — alerte enregistrée sans push.")

    db.commit()
    logger.info(
        "Alerte %s envoyée user=%s ratio=%.2f",
        leg.alert_db_type,
        preferences.user_id,
        assessment.delay_ratio,
    )
    return True


def run_home_work_alerts_cycle(db: Session) -> dict[str, int]:
    """Parcourt les utilisateurs éligibles et envoie les alertes trafic Maison/Travail."""
    now = datetime.now(timezone.utc)
    stats = {"users_checked": 0, "alerts_sent": 0, "legs_skipped": 0}

    if not in_work_commute_window(now) and not in_home_commute_window(now):
        logger.debug("Hors plage horaire Maison/Travail — cycle ignoré.")
        return stats

    preferences_rows = list_commute_preferences(db)
    stats["users_checked"] = len(preferences_rows)

    for preferences in preferences_rows:
        legs = build_commute_legs(db, preferences, now=now)
        for leg in legs:
            try:
                sent = process_commute_leg(db, preferences, leg)
                if sent:
                    stats["alerts_sent"] += 1
                else:
                    stats["legs_skipped"] += 1
            except Exception:
                db.rollback()
                logger.exception(
                    "Erreur alerte %s pour user=%s",
                    leg.alert_db_type,
                    preferences.user_id,
                )

    return stats
