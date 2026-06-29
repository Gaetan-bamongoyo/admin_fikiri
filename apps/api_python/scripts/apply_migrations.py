"""Applique les migrations SQL du dossier database/migrations/."""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import text

# Permet l'exécution depuis la racine api_python.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.config import engine  # noqa: E402


def apply_sql_migrations() -> None:
    migrations_dir = ROOT / "database" / "migrations"
    files = sorted(migrations_dir.glob("*.sql"))
    if not files:
        print("Aucune migration SQL trouvée.")
        return

    with engine.begin() as connection:
        for migration_file in files:
            sql = migration_file.read_text(encoding="utf-8")
            print(f"Applying {migration_file.name}…")
            connection.execute(text(sql))
            print(f"OK — {migration_file.name}")


if __name__ == "__main__":
    apply_sql_migrations()
