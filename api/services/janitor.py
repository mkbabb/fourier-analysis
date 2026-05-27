"""Background cleanup task for expired assets.

Janitor uses a per-document ``pinned`` boolean flag on ``contours`` and
``images`` rather than constructing an in-memory pinned-id set and passing it
as a ``{"$nin": [...]}`` predicate (the prior shape, which scaled with the
pinned-id cardinality, defeated indexes, and would have eventually exceeded
the 16 MB BSON document limit — see ``docs/tranches/A/waves/W4.md`` scope
item 1 and the H3 hardening note ``docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md``).
The ``$nin`` retirement landed in tranche A; B.W3 does NOT re-implement it.

Pin policy (re-rooted onto the converged ``visualizations`` collection at
fourier-B.W3 / H-W3-6):

* Every live (``deleted_at == null``) visualization pins its referenced
  ``contour_hash`` and ``image_slug``.

The recompute runs at the start of each cycle via aggregation + ``$merge``;
this both (a) backfills the ``pinned`` flag on legacy documents — the
recompute IS the migration — and (b) keeps the flag honest against any
out-of-band lifecycle event that may have skipped a per-write hook. Both
``contours.pinned`` and ``images.pinned`` are indexed (see
``api.services.database.connect_db``), so the deletion query
``{"pinned": false, "last_accessed_at": {"$lt": cutoff}}`` runs against an
indexed predicate via ``api.lib.crud.pinned_cron.cron_prune``.

B.W3 changes (H-W3-4/5/6):

* The inline-blob storage-budget eviction band-aid (the prior config setting)
  is **retired** — the principled storage bound is the recency prune (above)
  plus the ``deleted_at``-grace hard-delete pass. The per-doc ``bytes`` field
  survives for observability only. Image-blob redesign is deferred to
  tranche C.
* A **net-new** ``deleted_at``-grace pass hard-deletes ``visualizations``
  whose soft-delete window has elapsed and frees the blobs they pinned.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from api.config import get_settings
from api.lib.crud import pinned_cron
from api.services.database import get_db

logger = logging.getLogger(__name__)

# The janitor is an autonomous sweep, not an IP-bearing actor, yet
# ``AuditEntry`` (``api/models/admin.py``) requires a string ``ip_hash``. A
# sentinel constant keeps the ``admin_audit`` collection homogeneous (so the
# ``/api/admin/audit`` viewer renders a mixed admin+janitor trail) without
# loosening the admin-action contract to ``str | None``. It is self-documenting
# in the viewer and trivially filterable.
_JANITOR_ACTOR = "system:janitor"


async def _log_janitor_audit(
    db,
    action: str,
    *,
    count: int,
    cutoff: datetime | None = None,
    **extra: object,
) -> None:
    """Write one ``admin_audit`` row for a destructive janitor sweep.

    A peer writer into the same collection ``admin.py:log_audit`` writes, the
    janitor mirrors the canonical four-field shape exactly (no new columns):
    the sweep identity is the ``janitor:<sweep>`` ``action`` namespace, the
    ``count``/``cutoff``/``extra`` payload is folded into the opaque ``target``
    string (matching the admin convention), ``ip_hash`` is the sentinel actor,
    and ``timestamp`` is tz-aware UTC.

    Emission is gated on ``count >= 1`` — a zero-effect sweep writes no row
    (no audit noise; the gate makes re-run idempotence trivial: a re-run after
    a partial crash deletes only the residual matches and records only that
    residual count, so two crash-straddling rows sum to the true total and
    neither is spurious). The insert is ``O(1)`` and is issued immediately
    after its ``delete_many`` returns, so a death between the delete and the
    record loses at most one row — fail-safe under-counting, never a double or
    false count. No two-phase/outbox pattern is warranted (invariant 12).
    """
    if count < 1:
        return
    payload = f"count={count}"
    if cutoff is not None:
        payload += f", cutoff={cutoff.isoformat()}"
    for key, value in extra.items():
        payload += f", {key}={value}"
    await db.admin_audit.insert_one(
        {
            "timestamp": datetime.now(UTC),
            "ip_hash": _JANITOR_ACTOR,
            "action": action,
            "target": payload,
        }
    )


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
    # 1. Soft-deleted visualizations past the grace window — hard-delete.
    #    Net-new at B.W3 (H-W3-4). Runs BEFORE the pin recompute so the
    #    freed rows no longer pin their blobs, and BEFORE the recency prune
    #    so the unreferenced blobs reap in the same cycle.
    # ------------------------------------------------------------------

    grace_cutoff = datetime.now(UTC) - timedelta(days=settings.soft_delete_grace_days)
    hard_deleted = await db.visualizations.delete_many({"deleted_at": {"$lt": grace_cutoff}})
    if hard_deleted.deleted_count:
        logger.info(
            "Janitor hard-deleted %d visualizations past the soft-delete grace window",
            hard_deleted.deleted_count,
        )
    await _log_janitor_audit(
        db,
        "janitor:hard_delete_visualizations",
        count=hard_deleted.deleted_count,
        cutoff=grace_cutoff,
    )

    # ------------------------------------------------------------------
    # 2. Recompute the per-doc ``pinned`` flag on contours + images.
    #    Idempotent server-side aggregation: reset to false, then $merge-set
    #    true from the live (deleted_at == null) ``visualizations`` rows
    #    (re-rooted off snapshots/gallery at B.W3 / H-W3-6).
    # ------------------------------------------------------------------

    await _recompute_pin_flags(db)

    # ------------------------------------------------------------------
    # 3. Time-based recency prune of old unpinned assets — the principled
    #    storage bound (CRUD-CONTRACT §8). Delegates to the bounded
    #    ``pinned_cron.cron_prune`` helper (indexed predicate, no $nin).
    # ------------------------------------------------------------------

    deleted_contours = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
    if deleted_contours:
        logger.info("Janitor pruned %d old unpinned contours", deleted_contours)
    # Row 2: the contour prune delegates to the generic, side-effect-free
    # ``pinned_cron.cron_prune`` helper; the audit row is emitted here in the
    # orchestrator from its returned count (W3 §A.2 row 2).
    await _log_janitor_audit(
        db,
        "janitor:prune_contours",
        count=deleted_contours,
        cutoff=cutoff,
    )

    deleted_images, cascaded_gallery_for_images = await _delete_images_and_cascade(
        db,
        {"pinned": False, "last_accessed_at": {"$lt": cutoff}},
    )
    if deleted_images:
        logger.info("Janitor pruned %d old unpinned images", deleted_images)
    # Rows 3 + 4: the image cascade's gallery delete and image delete both live
    # inside the side-effect-free ``_delete_images_and_cascade`` helper, which
    # carries both counts back so the orchestrator emits both rows. The number
    # of images deleted equals the number of slugs the cascade collected, so it
    # doubles as the ``images=`` facet on the gallery-cascade row.
    await _log_janitor_audit(
        db,
        "janitor:cascade_delete_gallery_for_images",
        count=cascaded_gallery_for_images,
        images=deleted_images,
    )
    await _log_janitor_audit(
        db,
        "janitor:prune_images",
        count=deleted_images,
        cutoff=cutoff,
    )

    # ------------------------------------------------------------------
    # 4. Session + user cleanup
    # ------------------------------------------------------------------

    now = datetime.now(UTC)

    # Expired sessions
    result = await db.sessions.delete_many({"expires_at": {"$lt": now}})
    if result.deleted_count:
        logger.info("Janitor deleted %d expired sessions", result.deleted_count)
    # Row 5: the ``expires_at < now`` boundary IS this sweep's cutoff.
    await _log_janitor_audit(
        db,
        "janitor:delete_expired_sessions",
        count=result.deleted_count,
        cutoff=now,
    )

    # Users unseen for user_max_age_days — cascade to gallery, flags, sessions
    user_cutoff = now - timedelta(days=settings.user_max_age_days)
    stale_slugs: list[str] = []
    async for user in db.users.find({"last_seen_at": {"$lt": user_cutoff}}, {"_id": 1}):
        stale_slugs.append(user["_id"])

    if stale_slugs:
        # Cascade: soft-delete the stale users' visualizations (the converged
        # collection; CRUD-CONTRACT §8 category 3). The next-cycle grace pass
        # (category 1) hard-deletes them once their window lapses.
        viz_cascade = await db.visualizations.update_many(
            {"owner_slug": {"$in": stale_slugs}, "deleted_at": None},
            {"$set": {"deleted_at": now}},
        )
        if viz_cascade.modified_count:
            logger.info(
                "Janitor cascade-soft-deleted %d visualizations for stale users",
                viz_cascade.modified_count,
            )
        # Row 6: the cascade soft-delete (an ``update_many``) is the one
        # non-``delete_many`` destructive op; it gates on ``modified_count``.
        await _log_janitor_audit(
            db,
            "janitor:cascade_soft_delete_visualizations",
            count=viz_cascade.modified_count,
            cutoff=user_cutoff,
            users=len(stale_slugs),
        )

        # Cascade: delete gallery entries owned by stale users (legacy
        # collection, retained until the W5 close ceremony)
        gallery_result = await db.gallery.delete_many({"user_slug": {"$in": stale_slugs}})
        if gallery_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d gallery entries for stale users",
                gallery_result.deleted_count,
            )
        # Row 7: stale-user gallery cascade — bounded by the re-derived
        # ``stale_slugs`` set, not a cutoff; record the cohort size.
        await _log_janitor_audit(
            db,
            "janitor:cascade_delete_gallery",
            count=gallery_result.deleted_count,
            users=len(stale_slugs),
        )

        # Cascade: delete flags from stale users
        flags_result = await db.flags.delete_many({"reporter_slug": {"$in": stale_slugs}})
        if flags_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d flags for stale users",
                flags_result.deleted_count,
            )
        # Row 8: stale-user flags cascade.
        await _log_janitor_audit(
            db,
            "janitor:cascade_delete_flags",
            count=flags_result.deleted_count,
            users=len(stale_slugs),
        )

        # Cascade: delete sessions for stale users
        sessions_result = await db.sessions.delete_many({"user_slug": {"$in": stale_slugs}})
        if sessions_result.deleted_count:
            logger.info(
                "Janitor cascade-deleted %d sessions for stale users",
                sessions_result.deleted_count,
            )
        # Row 9: stale-user sessions cascade.
        await _log_janitor_audit(
            db,
            "janitor:cascade_delete_sessions",
            count=sessions_result.deleted_count,
            users=len(stale_slugs),
        )

        # Finally delete the user documents
        result = await db.users.delete_many({"_id": {"$in": stale_slugs}})
        logger.info("Janitor deleted %d stale users", result.deleted_count)
        # Row 10: the stale users themselves, bounded by ``user_cutoff``.
        await _log_janitor_audit(
            db,
            "janitor:delete_stale_users",
            count=result.deleted_count,
            cutoff=user_cutoff,
        )

    # Audit log retention (90 days)
    audit_cutoff = now - timedelta(days=90)
    result = await db.admin_audit.delete_many({"timestamp": {"$lt": audit_cutoff}})
    if result.deleted_count:
        logger.info("Janitor: deleted %d old audit entries", result.deleted_count)
    # Row 11: the audit-row retention prune (90 days). This deletes only the
    # *admin_audit* rows older than the cutoff; the janitor rows it just wrote
    # this cycle carry a fresh ``timestamp`` and are never reaped by their own
    # sweep, so there is no self-cannibalisation.
    await _log_janitor_audit(
        db,
        "janitor:prune_audit",
        count=result.deleted_count,
        cutoff=audit_cutoff,
    )


async def _recompute_pin_flags(db) -> None:
    """Recompute ``contours.pinned`` and ``images.pinned`` from the policy.

    Policy (re-rooted onto the converged collection at B.W3 / H-W3-6): a
    contour is pinned iff it is referenced by any **live** visualization
    (``deleted_at == null``). Same for images (keyed by ``image_slug``).
    A soft-deleted visualization no longer pins its blobs, so the recency
    prune (and, once the grace window lapses, the hard-delete pass) can reap
    them.

    The mechanism is one server-side ``$merge`` aggregation per asset
    collection: the pipeline reads the policy source (live ``visualizations``)
    and emits one ``{_pin_key, pinned: true}`` document per referenced asset;
    ``$merge`` then merges those onto the target collection's documents keyed
    on ``contour_hash`` / ``image_slug``. Before merging,
    ``update_many({}, {pinned: false})`` resets the slate, so the recompute is
    fully idempotent — invoking it twice yields the same end state, and it
    also backfills the ``pinned`` flag on legacy documents that pre-date this
    field (no separate migration script is required).

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
    # 2. Pin contours referenced by any live visualization. $merge writes
    #    the pinned=true flag onto matching contours documents.
    # ------------------------------------------------------------------
    contour_pin_pipeline: list[dict] = [
        {"$match": {"deleted_at": None}},
        {"$group": {"_id": "$contour_hash"}},
        {"$match": {"_id": {"$ne": None}}},
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
    async for _ in db.visualizations.aggregate(contour_pin_pipeline):
        pass

    # ------------------------------------------------------------------
    # 3. Pin images referenced by any live visualization. Same shape as the
    #    contour pipeline above, keyed on image_slug.
    # ------------------------------------------------------------------
    image_pin_pipeline: list[dict] = [
        {"$match": {"deleted_at": None}},
        {"$group": {"_id": "$image_slug"}},
        {"$match": {"_id": {"$ne": None}}},
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
    async for _ in db.visualizations.aggregate(image_pin_pipeline):
        pass


async def _delete_images_and_cascade(db, filter_: dict) -> tuple[int, int]:
    """Delete images matching *filter_* and cascade-delete referencing gallery entries.

    Returns ``(deleted_images, cascaded_gallery)``. The helper stays
    side-effect-free with respect to the audit trail — it carries both counts
    back so ``_cleanup_cycle`` (the orchestrator) emits the two audit rows
    (W3 §A.2 rows 3 + 4); the audit policy is not smeared across helpers.
    """
    # Collect slugs of images about to be deleted
    slugs_to_delete: list[str] = []
    async for img in db.images.find(filter_, {"image_slug": 1}):
        slugs_to_delete.append(img["image_slug"])

    if not slugs_to_delete:
        return 0, 0

    # Cascade: delete gallery entries that reference these images
    cascade_result = await db.gallery.delete_many({"image_slug": {"$in": slugs_to_delete}})
    if cascade_result.deleted_count:
        logger.info(
            "Janitor cascade-deleted %d gallery entries for deleted images",
            cascade_result.deleted_count,
        )

    # Delete the images themselves
    result = await db.images.delete_many(filter_)
    return result.deleted_count, cascade_result.deleted_count
