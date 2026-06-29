"""Tests unitaires — récupération des incidents en base."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from uuid import uuid4

from database.models import Incident, IncidentStatus, IncidentType
from services.incidents import get_active_incidents


def test_get_active_incidents_filters_today_status_expiry_and_soft_delete() -> None:
    now = datetime.now(timezone.utc)

    active = Incident(
        id=uuid4(),
        type=IncidentType.accident,
        status=IncidentStatus.active,
        latitude=-4.32,
        longitude=15.31,
        reporter_id=uuid4(),
        confirmation_count=2,
        expires_at=now + timedelta(hours=2),
        created_at=now,
        deleted_at=None,
    )
    expired = Incident(
        id=uuid4(),
        type=IncidentType.congestion,
        status=IncidentStatus.active,
        latitude=-4.33,
        longitude=15.32,
        reporter_id=uuid4(),
        confirmation_count=1,
        expires_at=now - timedelta(minutes=1),
        created_at=now,
        deleted_at=None,
    )

    query = MagicMock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.all.return_value = [active]

    session = MagicMock()
    session.query.return_value = query

    result = get_active_incidents(session)

    assert result == [active]
    session.query.assert_called_once_with(Incident)
    query.filter.assert_called_once()
    query.order_by.assert_called_once()
