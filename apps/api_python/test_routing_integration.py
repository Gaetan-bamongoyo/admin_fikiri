"""
Test d'intégration bout-en-bout : PostgreSQL + GraphHopper Cloud.

Prérequis :
  - PostgreSQL accessible via DATABASE_URL (.env)
  - Au moins un utilisateur dans la table ``users``
  - GRAPHHOPPER_URL + GRAPHHOPPER_API_KEY configurés (.env)

Exécution :
  python test_routing_integration.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import text

from database.config import SessionLocal
from database.models import Incident, IncidentConfirmation, IncidentStatus, IncidentType
from main import app

client = TestClient(app)

# Coordonnées Kinshasa — format [longitude, latitude]
START = [15.3100, -4.3200]
END = [15.3180, -4.3250]
OBSTACLE = [15.3140, -4.3225]


def main() -> None:
    print("Démarrage du test d'intégration du routage dynamique...")

    with SessionLocal() as session:
        user_row = session.execute(text("SELECT id FROM users LIMIT 1;")).fetchone()
        if not user_row:
            print("Erreur : aucun utilisateur trouvé dans 'users'.")
            sys.exit(1)
        user_id = user_row[0]
        print(f"Utilisateur sélectionné : {user_id}")

    incident_id = None
    try:
        with SessionLocal() as session:
            test_incident = Incident(
                type=IncidentType.checkpoint,
                status=IncidentStatus.active,
                latitude=OBSTACLE[1],
                longitude=OBSTACLE[0],
                location=(OBSTACLE[0], OBSTACLE[1]),
                description="Checkpoint temporaire — test d'intégration",
                address="Avenue de test, Kinshasa",
                reporter_id=user_id,
                confirmation_count=2,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=4),
                created_at=datetime.now(timezone.utc),
            )
            session.add(test_incident)
            session.flush()
            incident_id = test_incident.id

            session.add(
                IncidentConfirmation(
                    incident_id=incident_id,
                    user_id=user_id,
                    is_confirm=True,
                )
            )
            session.commit()
            print(f"Incident de test inséré : {incident_id}")

        payload = {"start": START, "end": END}
        print(f"POST /api/v1/routing/compute — payload : {payload}")
        response = client.post("/api/v1/routing/compute", json=payload)

        print(f"Statut : {response.status_code}")
        print(f"Corps : {response.json()}")

        assert response.status_code == 200, response.text
        data = response.json()

        for field in (
            "distance_metres",
            "temps_secondes",
            "trajet_coordonnees",
            "instructions",
            "alerte_incident_inevitable",
            "penalites_incidents_appliquees",
        ):
            assert field in data, f"Champ manquant : {field}"

        print(f"Distance : {data['distance_metres']} m")
        print(f"Durée : {data['temps_secondes']} s")
        print(f"Pénalités appliquées : {data['penalites_incidents_appliquees']}")
        print(f"Alerte inévitable : {data['alerte_incident_inevitable']}")
        print("Test d'intégration validé avec succès.")

    except AssertionError as exc:
        print(f"Assertion échouée : {exc}")
        sys.exit(1)
    except Exception as exc:
        print(f"Erreur : {exc}")
        if "UnicodeDecodeError" in type(exc).__name__ or "connection" in str(exc).lower():
            print(
                "Astuce : vérifiez que PostgreSQL est démarré sur localhost:5432 "
                "et que DATABASE_URL dans .env est correct."
            )
        sys.exit(1)
    finally:
        if incident_id:
            print("Nettoyage des données de test...")
            with SessionLocal() as session:
                session.execute(
                    text(
                        "DELETE FROM incident_confirmations WHERE incident_id = :id"
                    ),
                    {"id": incident_id},
                )
                session.execute(
                    text("DELETE FROM incidents WHERE id = :id"),
                    {"id": incident_id},
                )
                session.commit()
            print("Nettoyage terminé.")


if __name__ == "__main__":
    main()
