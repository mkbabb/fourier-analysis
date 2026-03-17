"""MongoDB client lifecycle and dependency injection."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError

from api.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None

_CONNECT_RETRIES = 5
_CONNECT_BACKOFF = 2  # seconds, doubles each retry


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
    _db = _client.get_default_database()

    # Wait for MongoDB to become reachable
    for attempt in range(1, _CONNECT_RETRIES + 1):
        try:
            await _client.admin.command("ping")
            break
        except (ConnectionFailure, ServerSelectionTimeoutError):
            if attempt == _CONNECT_RETRIES:
                raise
            delay = _CONNECT_BACKOFF * attempt
            logger.warning("MongoDB not ready (attempt %d/%d), retrying in %ds...", attempt, _CONNECT_RETRIES, delay)
            await asyncio.sleep(delay)

    # Images indexes
    await _db.images.create_index("image_slug", unique=True)
    await _db.images.create_index("sha256", unique=True)
    await _db.images.create_index("last_accessed_at")

    # Contours indexes
    await _db.contours.create_index("contour_hash", unique=True)
    await _db.contours.create_index("image_slug")
    await _db.contours.create_index("last_accessed_at")

    # Snapshots indexes
    await _db.snapshots.create_index("snapshot_hash", unique=True)
    await _db.snapshots.create_index([("image_slug", 1), ("snapshot_hash", 1)], unique=True)

    # Users + Sessions
    await _db.users.create_index("last_seen_at")
    await _db.sessions.create_index("user_slug")
    try:
        await _db.sessions.create_index("expires_at")
    except OperationFailure:
        # Drop conflicting TTL index and recreate as plain index
        await _db.sessions.drop_index("expires_at_1")
        await _db.sessions.create_index("expires_at")
        logger.info("Recreated sessions.expires_at index (dropped conflicting TTL index)")

    # Gallery
    await _db.gallery.create_index("snapshot_hash", unique=True)
    await _db.gallery.create_index([("tier", 1), ("created_at", -1)])
    await _db.gallery.create_index("image_slug")
    await _db.gallery.create_index("views")
    await _db.gallery.create_index("likes")
    await _db.gallery.create_index("user_slug")

    # Audit
    await _db.admin_audit.create_index([("timestamp", -1)])


async def close_db() -> None:
    global _client, _db
    if _client:
        _client.close()
    _client = None
    _db = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not connected")
    return _db


async def touch_document(collection_name: str, filter_: dict) -> None:
    db = get_db()
    await db[collection_name].update_one(
        filter_, {"$set": {"last_accessed_at": datetime.now(UTC)}}
    )
