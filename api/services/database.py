"""MongoDB client lifecycle and dependency injection."""

from __future__ import annotations

from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from api.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongo_uri)
    _db = _client.get_default_database()

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
        filter_, {"$set": {"last_accessed_at": datetime.utcnow()}}
    )
