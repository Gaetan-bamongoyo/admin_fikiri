import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("La variable d'environnement DATABASE_URL n'est pas configurée.")

# Création de l'engine SQLAlchemy pour PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True  # Vérifie la connexion avant d'exécuter des requêtes
)

# Session locale pour interagir avec la base de données
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe de base pour les modèles ORM SQLAlchemy (style SQLAlchemy 2.0)
class Base(DeclarativeBase):
    pass

# Dépendance pour obtenir la session de base de données à utiliser dans les routes FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
