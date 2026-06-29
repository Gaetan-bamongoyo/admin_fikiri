"""Configuration partagée des tests — override de la dépendance DB."""

from __future__ import annotations

from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from database.config import get_db
from main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Client HTTP avec session DB mockée (aucune connexion PostgreSQL requise)."""

    def override_get_db() -> Generator[MagicMock, None, None]:
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
