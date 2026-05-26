"""Background cleanup task for expired assets.

Janitor uses a per-document ``pinned`` boolean flag on ``contours`` and
``images`` rather than constructing an in-memory pinned-id set and passing it
as a ``{"$nin": [...]}`` predicate (the prior shape, which scaled with the
pinned-id cardinality, defeated indexes, and would have eventually exceeded
the 16 MB BSON document limit — see ``docs/tranches/A/waves/W4.md`` scope
item 1 and the H3 hardening note ``docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md``).

Pin policy (unchanged from the prior implementation):

* Every snapshot pins its referenced ``contour_hash`` and ``image_slug``.
* Every gallery entry whose tier is ``"featured"`` or ``"saved"`` pins its
  ``contour_hash`` and ``image_slug``.

The recompute runs at the start of each cycle via aggregation + ``$merge``;
this both (a) backfills the ``pinned`` flag on legacy documents — the
recompute IS the migration — and (b) keeps the flag honest against any
out-of-band lifecycle event that may have skipped a per-write hook. Both
``contours.pinned`` and ``images.pinned`` are indexed (see
``api.services.database.connect_db``), so the deletion query
``{"pinned": false, "last_accessed_at": {"$lt": cutoff}}`` runs against an
indexed predicate.
"""

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

    # ------------------------------------------------------------------
    # 1. Recompute the per-doc ``pinned`` flag on contours + images.
    #    This is an idempotent server-side aggregation: reset to false,
    #    then $merge-set true from the union of (snapshots) and
    #    (gallery WHERE tier IN featured|saved).
    # ------------------------------------------------------------------

    await _recompute_pin_flags(db)

    # ------------------------------------------------------------------
    # 2. Time-based cleanup of old unpinned assets — indexed predicate
    # ------------------------------------------------------------------

    result = await db.contours.delete_many(
        {"pinned": False, "last_accessed_at": {"$lt": cutoff}}
    )
    if result.deleted_count:
        logger.info("Janitor deleted %d old contours", result.deleted_count)

    deleted_images = await _delete_images_and_cascade(
        db,
        {"pinned": False, "last_accessed_at": {"$lt": cutoff}},
    )
    if deleted_images:
        logger.info("Janitor deleted %d old images", deleted_images)

    # ------------------------------------------------------------------
    # 3. Storage budget enforcement (evicts oldest unpinned images)
    # ------------------------------------------------------------------

    budget_bytes = int(settings.storage_budget_gb * 1024 * 1024 * 1024)
    storage_pipeline = [
        {"$group": {"_id": None, "total_bytes": {"$sum": "$bytes"}}},
    ]
    total_bytes = 0
    async for row in db.images.aggregate(storage_pipeline):
        total_bytes = row.get("total_bytes", 0)

    if total_bytes > budget_bytes:
        overage = total_bytes - budget_bytes
        logger.warning(
            "Storage budget exceeded by %d bytes (%d total vs %d budget). "
            "Evicting oldest unpinned images.",
            overage,
            total_bytes,
            budget_bytes,
        )
        freed = 0
        cursor = db.images.find(
            {"pinned": False},
            {"image_slug": 1, "bytes": 1},
        ).sort("last_accessed_at", 1)

        async for img_doc in cursor:
            if freed >= overage:
                break
            slug = img_doc["image_slug"]
            img_bytes = img_doc.get("bytes", 0)
            count = await _delete_images_and_cascade(
                db, {"image_slug": slug}
            )
            if count:
                freed += img_bytes
                logger.info(
                    "Budget eviction: deleted image %s (%d bytes)", slug, img_bytes
                )

    # ------------------------------------------------------------------
    # 4. Session + user cleanup
    # ------------------------------------------------------------------

    now = datetime.now(UTC)

    # Expired sessions
    result = await db.sessions.delete_many({"expires_at": {"$lt": now}})
    if result.deleted_count:
        logger.info("Janitor deleted %d expired sessions", result.deleted_count)

    # Users unseen for user_max_age_days — cascade to gallery, flags, sessions
    user_cutoff = now - timedelta(days=settings.user_max_age_days)
    stale_slugs: list[str] = []
    async for user in db.users.find(
        {"last_seen_at": {"$lt": user_cutoff}}, {"_id": 1}
    ):
        stale_slugs.append(user["_id"])

    if stale_slugs:
        # Cascade: delete gallery entries owned by stale users
        gallery_result = await db.gallery.delete_many(
            {"user_slug": {"$in": stale_slugs}}
        )
        if gallery_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d gallery entries for stale users",
                gallery_result.deleted_count,
            )

        # Cascade: delete flags from stale users
        flags_result = await db.flags.delete_many(
            {"reporter_slug": {"$in": stale_slugs}}
        )
        if flags_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d flags for stale users",
                flags_result.deleted_count,
            )

        # Cascade: delete sessions for stale users
        sessions_result = await db.sessions.delete_many(
            {"user_slug": {"$in": stale_slugs}}
        )
        if sessions_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d sessions for stale users",
                sessions_result.deleted_count,
            )

        # Finally delete the user documents
        result = await db.users.delete_many({"_id": {"$in": stale_slugs}})
        logger.info("Janitor deleted %d stale users", result.deleted_count)

    # Audit log retention (90 days)
    audit_cutoff = now - timedelta(days=90)
    result = await db.admin_audit.delete_many({"timestamp": {"$lt": audit_cutoff}})
    if result.deleted_count:
        logger.info("Janitor: deleted %d old audit entries", result.deleted_count)


async def _recompute_pin_flags(db) -> None:
    """Recompute ``contours.pinned`` and ``images.pinned`` from the policy.

    Policy: a contour is pinned iff it is referenced by any snapshot or by any
    gallery entry with tier ``"featured"`` or ``"saved"``. Same for images
    (keyed by ``image_slug``).

    The mechanism is two server-side ``$merge`` aggregations per asset
    collection: the pipelines read the policy sources (snapshots + gallery
    rows with the right tier) and emit one ``{_pin_key, pinned: true}``
    document per referenced asset; ``$merge`` then merges those onto the
    target collection's documents keyed on ``contour_hash`` / ``image_slug``.
    Before merging, ``update_many({}, {pinned: false})`` resets the slate, so
    the recompute is fully idempotent — invoking it twice yields the same end
    state, and it also backfills the ``pinned`` flag on legacy documents that
    pre-date this field (no separate migration script is required).

    Because all id-set construction happens server-side inside the aggregation
    pipeline, this implementation never builds an in-memory list bounded by
    the pinned-id cardinality — invariant 12 (scale without contrivance) is
    held, and the prior 16 MB BSON-limit hazard is gone.
    """
    # ------------------------------------------------------------------
    # 1. Reset every doc to pinned=false. This covers both:
    #    - legacy docs without the ``pinned`` field, and
    #    - any prior pin that policy no longer justifies (drift correction).
    # ------------------------------------------------------------------
    await db.contours.update_many({}, {"$set": {"pinned": False}})
    await db.images.update_many({}, {"$set": {"pinned": False}})

    # ------------------------------------------------------------------
    # 2. Pin contours: union of snapshots.contour_hash and
    #    gallery.contour_hash (where tier is featured or saved). The
    #    $unionWith stage performs the union server-side; $merge writes the
    #    pinned=true flag onto matching contours documents.
    # ------------------------------------------------------------------
    contour_pin_pipeline: list[dict] = [
        {"$group": {"_id": "$contour_hash"}},
        {"$match": {"_id": {"$ne": None}}},
        {
            "$unionWith": {
                "coll": "gallery",
                "pipeline": [
                    {"$match": {"tier": {"$in": ["featured", "saved"]}}},
                    {"$group": {"_id": "$contour_hash"}},
                    {"$match": {"_id": {"$ne": None}}},
                ],
            }
        },
        {"$group": {"_id": "$_id"}},
        {"$project": {"_id": 0, "contour_hash": "$_id", "pinned": {"$literal": True}}},
        {
            "$merge": {
                "into": "contours",
                "on": "contour_hash",
                "whenMatched": "merge",
                "whenNotMatched": "discard",
            }
        },
    ]
    # Drain the aggregation cursor — $merge is a terminal stage with no
    # client-visible output, but motor still expects iteration.
    async for _ in db.snapshots.aggregate(contour_pin_pipeline):
        pass

    # ------------------------------------------------------------------
    # 3. Pin images: union of snapshots.image_slug and gallery.image_slug
    #    (where tier is featured or saved). Same shape as the contour
    #    pipeline above, keyed on image_slug.
    # ------------------------------------------------------------------
    image_pin_pipeline: list[dict] = [
        {"$group": {"_id": "$image_slug"}},
        {"$match": {"_id": {"$ne": None}}},
        {
            "$unionWith": {
                "coll": "gallery",
                "pipeline": [
                    {"$match": {"tier": {"$in": ["featured", "saved"]}}},
                    {"$group": {"_id": "$image_slug"}},
                    {"$match": {"_id": {"$ne": None}}},
                ],
            }
        },
        {"$group": {"_id": "$_id"}},
        {"$project": {"_id": 0, "image_slug": "$_id", "pinned": {"$literal": True}}},
        {
            "$merge": {
                "into": "images",
                "on": "image_slug",
                "whenMatched": "merge",
                "whenNotMatched": "discard",
            }
        },
    ]
    async for _ in db.snapshots.aggregate(image_pin_pipeline):
        pass


async def _delete_images_and_cascade(db, filter_: dict) -> int:
    """Delete images matching *filter_* and cascade-delete referencing gallery entries.

    Returns the number of deleted images.
    """
    # Collect slugs of images about to be deleted
    slugs_to_delete: list[str] = []
    async for img in db.images.find(filter_, {"image_slug": 1}):
        slugs_to_delete.append(img["image_slug"])

    if not slugs_to_delete:
        return 0

    # Cascade: delete gallery entries that reference these images
    cascade_result = await db.gallery.delete_many(
        {"image_slug": {"$in": slugs_to_delete}}
    )
    if cascade_result.deleted_count:
        logger.info(
            "Janitor cascade-deleted %d gallery entries for deleted images",
            cascade_result.deleted_count,
        )

    # Delete the images themselves
    result = await db.images.delete_many(filter_)
    return result.deleted_count
