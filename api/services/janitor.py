"""Background cleanup task for expired assets."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from api.config import get_settings
from api.services.database import get_db

logger = logging.getLogger(__name__)


async def run_janitor() -> None:
    """Delete unpinned assets older than max_age_days. Run on startup + every 6 hours."""
    while True:
        try:
            await _cleanup_cycle()
        except Exception:
            logger.exception("Janitor cycle failed")
        await asyncio.sleep(6 * 3600)


async def _cleanup_cycle() -> None:
    settings = get_settings()
    db = get_db()
    cutoff = datetime.now(UTC) - timedelta(days=settings.asset_max_age_days)

    # Get pinned contour hashes and image slugs from snapshots
    pinned_contours: set[str] = set()
    pinned_images: set[str] = set()
    async for snap in db.snapshots.find({}, {"contour_hash": 1, "image_slug": 1}):
        pinned_contours.add(snap["contour_hash"])
        if snap.get("image_slug"):
            pinned_images.add(snap["image_slug"])

    # Delete old unpinned contours
    result = await db.contours.delete_many(
        {
            "last_accessed_at": {"$lt": cutoff},
            "contour_hash": {"$nin": list(pinned_contours)},
        }
    )
    if result.deleted_count:
        logger.info("Janitor deleted %d old contours", result.deleted_count)

    # Delete old unpinned images
    result = await db.images.delete_many(
        {
            "last_accessed_at": {"$lt": cutoff},
            "image_slug": {"$nin": list(pinned_images)},
        }
    )
    if result.deleted_count:
        logger.info("Janitor deleted %d old images", result.deleted_count)
