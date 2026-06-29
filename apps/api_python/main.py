import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.config import get_db
from routes.incidents import router as incidents_router
from routes.notifications import router as notifications_router
from routes.routing import router as routing_router

# Enregistre les modèles notification (FK vers users).
import database.notification_models  # noqa: F401

# Origines autorisées pour l'app Flutter (émulateur, appareil physique, web).
# Utiliser CORS_ORIGINS="*" (défaut) ou une liste séparée par des virgules.
_cors_raw = os.getenv("CORS_ORIGINS", "*")
_cors_origins = (
    ["*"]
    if _cors_raw.strip() == "*"
    else [origin.strip() for origin in _cors_raw.split(",")]
)

_cron_enabled = os.getenv("HOME_WORK_ALERTS_CRON_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    cron_task: asyncio.Task | None = None
    if _cron_enabled:
        from jobs.home_work_alerts_job import home_work_alerts_loop

        cron_task = asyncio.create_task(home_work_alerts_loop())

    yield

    if cron_task is not None:
        cron_task.cancel()
        try:
            await cron_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Fikiri Traffic API Python",
    description="Microservice de routage dynamique et traitement intelligent du trafic",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routing_router)
app.include_router(incidents_router)
app.include_router(notifications_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Fikiri Traffic API Python is running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "API and Database connection are working properly",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(exc)}",
        ) from exc
