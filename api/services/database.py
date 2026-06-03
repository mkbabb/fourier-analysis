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
    # tz_aware=True: datetimes round-trip as aware UTC so the janitor's
    # aware-cutoff comparisons (datetime.now(UTC)) never hit naive/aware TypeError.
    _client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000, tz_aware=True)
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
            logger.warning(
                "MongoDB not ready (attempt %d/%d), retrying in %ds...",
                attempt,
                _CONNECT_RETRIES,
                delay,
            )
            await asyncio.sleep(delay)

    # Images indexes
    await _db.images.create_index("image_slug", unique=True)
    await _db.images.create_index("sha256", unique=True)
    await _db.images.create_index("last_accessed_at")
    # Compound index for the janitor's indexed-predicate delete query —
    # ``{pinned: false, last_accessed_at: {$lt: cutoff}}``. See
    # ``api/services/janitor.py``; this index replaces the legacy unbounded
    # ``$nin`` scan flagged by the W4.a (Tranche A) audit.
    await _db.images.create_index([("pinned", 1), ("last_accessed_at", 1)])

    # Contours indexes
    await _db.contours.create_index("contour_hash", unique=True)
    await _db.contours.create_index("extraction_cache_key", sparse=True)
    await _db.contours.create_index("image_slug")
    await _db.contours.create_index("last_accessed_at")
    # Mirror of images.pinned compound — same rationale (W4.a janitor inversion).
    await _db.contours.create_index([("pinned", 1), ("last_accessed_at", 1)])

    # F.W2 T-β — parametric content-addressable compute cache (epicycles +
    # bases). Unique on `_id` (the SHA256 of contour_hash + canonical-JSON
    # params + COMPUTE_VERSION); auto-evict via TTL index on `created_at` after
    # 7 days. Renamed from the epicycles-only `epicycle_cache` collection.
    try:
        await _db.compute_cache.create_index(
            "created_at", expireAfterSeconds=7 * 24 * 60 * 60
        )
    except OperationFailure:
        await _db.compute_cache.drop_index("created_at_1")
        await _db.compute_cache.create_index(
            "created_at", expireAfterSeconds=7 * 24 * 60 * 60
        )

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

    # Visualizations — the converged identity collection (fourier-B.W3).
    # The union of the gallery cursor-pagination indexes plus the
    # contract-mandated owner_slug / visibility / deleted_at / slug-unique /
    # content_hash indexes (CRUD-CONTRACT §1–§8; W3.5).
    #
    # Identity + dedup:
    await _db.visualizations.create_index("slug", unique=True)
    await _db.visualizations.create_index("content_hash")
    await _db.visualizations.create_index("image_slug")
    await _db.visualizations.create_index("contour_hash")
    # Ownership + lifecycle (§3 owner, §4 visibility, §5 soft-delete grace):
    await _db.visualizations.create_index("owner_slug")
    await _db.visualizations.create_index("visibility")
    await _db.visualizations.create_index("deleted_at")
    # Idempotent re-run guard for the migration (W3.19 ``migrated_from``):
    await _db.visualizations.create_index("migrated_from._id", sparse=True)
    # Cursor pagination — public gallery view (visibility="public") sorted by
    # newest / views / likes, with the _id tie-breaker per the cursor contract:
    await _db.visualizations.create_index([("visibility", 1), ("created_at", -1), ("_id", -1)])
    await _db.visualizations.create_index([("visibility", 1), ("views", -1), ("_id", -1)])
    await _db.visualizations.create_index([("visibility", 1), ("likes", -1), ("_id", -1)])
    # Owner-scoped listing (?owner=me across all three visibility states):
    await _db.visualizations.create_index([("owner_slug", 1), ("created_at", -1)])
    # The ``pinned`` retrofit: the bounded janitor prune predicate
    # ``{pinned: false, last_accessed_at: {$lt: cutoff}}`` runs against this
    # compound index (mirrors images/contours; no unbounded $nin). The
    # ``deleted_at``-grace hard-delete pass scans the indexed ``deleted_at``.
    await _db.visualizations.create_index([("pinned", 1), ("last_accessed_at", 1)])

    # WAVE D (J.W2 / J.W1-crud-remix §2.3) — fork / version / provenance.
    # ``fork_of`` → the ``/forks`` children list (value.js findForksOf); the
    # ``{fork_count:-1, _id:-1}`` compound makes the already-wired ``most-forked``
    # cursor sort real + stable (the _id tiebreak matches the cursor contract).
    await _db.visualizations.create_index("fork_of", sparse=True)
    await _db.visualizations.create_index([("visibility", 1), ("fork_count", -1), ("_id", -1)])
    await _db.visualizations.create_index([("fork_of", 1), ("visibility", 1), ("created_at", -1), ("_id", -1)])

    # The version collection — the one genuinely-new persisted shape. ``_id`` is
    # the content-addressed compound ``f"{viz_slug}:{set_hash}"`` (default unique);
    # the ``{viz_slug, depth}`` index serves the provenance walk + the bounded
    # ``/versions`` list (≤50, no cursor).
    await _db.visualization_versions.create_index([("viz_slug", 1), ("depth", 1)])
    await _db.visualization_versions.create_index("root_hash")

    # Flags — the moderation-FK band keyed on the visualization's
    # ``content_hash`` (the renamed identity slot, fourier-D.W3 / γ; the
    # rename target is the truthful value the field always held). The
    # cutover migration ``api/scripts/migrate_flags_field.py`` runs in the
    # W3 deploy.
    await _db.flags.create_index([("content_hash", 1), ("reporter_slug", 1)], unique=True)
    await _db.flags.create_index("content_hash")
    await _db.flags.create_index("created_at")

    # Audit
    await _db.admin_audit.create_index([("timestamp", -1)])
    await _db.admin_audit.create_index([("action", 1), ("timestamp", -1)])


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
    await db[collection_name].update_one(filter_, {"$set": {"last_accessed_at": datetime.now(UTC)}})
