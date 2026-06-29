import logging
import os
from pathlib import Path
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=True)

# Configuration du JWT partagée avec NestJS
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Schéma de sécurité FastAPI pour récupérer le token Bearer
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UUID:
    """
    Dépendance FastAPI pour valider le jeton JWT et extraire l'ID de l'utilisateur.
    Attend un en-tête HTTP 'Authorization: Bearer <token>'.
    
    Retourne l'UUID de l'utilisateur si le jeton est valide.
    Lève une exception HTTP 401 si le jeton est invalide ou expiré.
    """
    token = credentials.credentials
    try:
        # Décoder et valider la signature et l'expiration du jeton
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # 'sub' contient l'ID utilisateur (UUID) dans le jeton généré par NestJS
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Jeton invalide : ID utilisateur (sub) absent du payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return UUID(user_id_str)
        
    except JWTError as exc:
        if os.getenv("DEBUG", "").lower() in {"1", "true", "yes"}:
            logger.warning("JWT rejeté : %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton de connexion invalide, expiré ou corrompu.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format de l'ID utilisateur invalide.",
            headers={"WWW-Authenticate": "Bearer"},
        )
