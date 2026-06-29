"""Tâche planifiée — alertes trafic Maison / Travail."""

from __future__ import annotations

import asyncio
import logging
import os

from database.config import SessionLocal
from services.home_work_alerts_service import run_home_work_alerts_cycle

logger = logging.getLogger(__name__)

_INTERVAL_MINUTES = int(os.getenv("HOME_WORK_ALERTS_INTERVAL_MINUTES", "15"))
_INITIAL_DELAY_MINUTES = int(
    os.getenv("HOME_WORK_ALERTS_INITIAL_DELAY_MINUTES", "0")
)
_ENABLED = os.getenv("HOME_WORK_ALERTS_CRON_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
}


def _run_cycle_sync() -> None:
    db = SessionLocal()
    try:
        stats = run_home_work_alerts_cycle(db)
        if stats["alerts_sent"] or stats["users_checked"]:
            logger.info(
                "Cycle Maison/Travail terminé — users=%s alertes=%s ignorés=%s",
                stats["users_checked"],
                stats["alerts_sent"],
                stats["legs_skipped"],
            )
    finally:
        db.close()


async def home_work_alerts_loop() -> None:
    if not _ENABLED:
        logger.info("Cron Maison/Travail désactivé (HOME_WORK_ALERTS_CRON_ENABLED).")
        return

    interval_seconds = max(60, _INTERVAL_MINUTES * 60)
    logger.info(
        "Cron Maison/Travail démarré — 1er cycle dans %s min, puis toutes les %s min.",
        _INITIAL_DELAY_MINUTES or _INTERVAL_MINUTES,
        _INTERVAL_MINUTES,
    )

    if _INITIAL_DELAY_MINUTES > 0:
        await asyncio.sleep(_INITIAL_DELAY_MINUTES * 60)

    while True:
        try:
            await asyncio.to_thread(_run_cycle_sync)
        except Exception:
            logger.exception("Erreur cycle cron Maison/Travail")

        await asyncio.sleep(interval_seconds)
