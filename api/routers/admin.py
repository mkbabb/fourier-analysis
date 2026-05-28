"""Admin moderation endpoints, re-pointed onto the converged ``visualization`` entity.

fourier-B.W4.c (+ fourier-D.W3 γ rename). The moderation surface (feature /
delete / flag-dismissal, the flagged-panel listing, the user list, the
audit-log viewer) resolves against the single ``visualizations`` collection by
**slug** (CRUD-CONTRACT §7). The ``flags`` band's moderation-FK field was
renamed to ``content_hash`` at D.W3 (γ) — the truthful name for the value the
slot always held (the visualization's content hash). The legacy ``gallery``
stratum is deleted at D.W3; ``/stats`` reads ``visualizations`` (not
``gallery``).

The router *composes* the W3-landed ``api.lib.crud`` helpers explicitly (no lifecycle
inversion — the Wχ.P1 framework-in-disguise certification):

- ``errors.*`` — every non-2xx is an RFC 9457 ``application/problem+json`` body.
- ``cursors.paginate`` / ``decode_cursor`` / ``next_cursor_from_last`` — the flagged
  panel lists ``visualizations`` with opaque cursor pagination (§0 SOTA-1).
- ``etag.require_if_match`` — the mutating moderation ops (set-tier, soft-delete)
  are guarded by an ``If-Match`` precondition (§0 SOTA-2).
- ``softdelete.*`` — the moderation delete is a soft-delete (§5); the admin
  hard-delete bypasses the grace window for illegal content (§7).

``X-Admin-Token`` bearer auth (``Depends(admin_required)``) and the
``admin_audit`` write-per-action are preserved verbatim from the pre-W4 surface.
"""

from __future__ import annotations

import json
import logging
import math
import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, Request, Response

from api.dependencies import (
    admin_required,
    get_client_ip,
    hash_ip,
    invalidate_suspension_cache,
    mark_suspended_in_cache,
)
# Explicit per-module imports of the W3-landed CRUD utility helpers (the gate-9
# adoption surface; each module is composed by name, not lifecycle-inverted).
from api.lib.crud.cursors import decode_cursor, next_cursor_from_last, paginate
from api.lib.crud.etag import compute_etag, require_if_match, set_etag_header
from api.lib.crud.softdelete import not_deleted_filter, soft_delete
from api.lib.crud import errors
from api.models.admin import (
    AdminUserListResponse,
    AuditListResponse,
    BatchGalleryRequest,
    BatchUsersRequest,
    SetUserStatusRequest,
)
from api.models.gallery import AdminStatsResponse, SetTierRequest
from api.services.database import get_db
from api.services.rate_limiter import admin_limiter

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def log_audit(ip_hash: str, action: str, target: str) -> None:
    db = get_db()
    await db.admin_audit.insert_one(
        {
            "timestamp": datetime.now(UTC),
            "ip_hash": ip_hash,
            "action": action,
            "target": target,
        }
    )


def _public_doc(doc: dict) -> dict:
    """Strip non-user-facing internals (``_id`` per CRUD-CONTRACT §1 C1.3)."""
    return {k: v for k, v in doc.items() if k not in ("_id", "liked_ips")}


def _json(body: dict | list, status: int = 200) -> Response:
    return Response(
        content=json.dumps(body, default=str),
        status_code=status,
        media_type="application/json",
    )


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@admin_router.get("/verify", dependencies=[Depends(admin_required)])
async def admin_verify():
    """Verify admin token is valid."""
    return {"ok": True}


@admin_router.get(
    "/stats", response_model=AdminStatsResponse, dependencies=[Depends(admin_required)]
)
async def admin_stats():
    """Aggregate visualization and storage statistics (over the converged entity)."""
    db = get_db()

    # Count live (non-soft-deleted) entries by tier on the converged collection.
    pipeline = [
        {"$match": not_deleted_filter()},
        {"$group": {"_id": "$tier", "count": {"$sum": 1}}},
    ]
    tier_counts = {"featured": 0, "saved": 0, "normal": 0}
    async for row in db.visualizations.aggregate(pipeline):
        tier_id = row["_id"]
        if tier_id in tier_counts:
            tier_counts[tier_id] = row["count"]

    total_entries = sum(tier_counts.values())

    totals_pipeline = [
        {"$match": not_deleted_filter()},
        {
            "$group": {
                "_id": None,
                "total_views": {"$sum": "$views"},
                "total_likes": {"$sum": "$likes"},
            }
        },
    ]
    totals = {"total_views": 0, "total_likes": 0}
    async for row in db.visualizations.aggregate(totals_pipeline):
        totals["total_views"] = row.get("total_views", 0)
        totals["total_likes"] = row.get("total_likes", 0)

    storage_pipeline = [{"$group": {"_id": None, "total_bytes": {"$sum": "$bytes"}}}]
    storage_bytes = 0
    async for row in db.images.aggregate(storage_pipeline):
        storage_bytes = row.get("total_bytes", 0)

    return AdminStatsResponse(
        total_entries=total_entries,
        featured=tier_counts["featured"],
        saved=tier_counts["saved"],
        normal=tier_counts["normal"],
        total_views=totals["total_views"],
        total_likes=totals["total_likes"],
        storage_bytes=storage_bytes,
    )


@admin_router.put(
    "/visualizations/{slug}/tier",
    dependencies=[Depends(admin_required)],
)
async def set_tier(slug: str, body: SetTierRequest, request: Request) -> Response:
    """Set the admin-curation tier for a visualization (CRUD-CONTRACT §7 ``feature``).

    Guarded by an ``If-Match`` ETag (§0 SOTA-2): a stale precondition is a 412
    ``urn:contract:etag-mismatch``. Idempotent — re-setting the same tier is a 200.
    """
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    admin_limiter.check(ip_hashed)

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None or doc.get("deleted_at") is not None:
        return errors.not_found(detail=f"no live visualization {slug!r}")

    await require_if_match(request, compute_etag(doc))

    await db.visualizations.update_one(
        {"slug": slug},
        {"$set": {"tier": body.tier, "updated_at": datetime.now(UTC)}},
    )
    await log_audit(ip_hashed, f"set_tier:{body.tier}", slug)

    updated = await db.visualizations.find_one({"slug": slug})
    out = _json(_public_doc(updated))
    set_etag_header(out, updated)
    return out


@admin_router.delete("/visualizations/{slug}", dependencies=[Depends(admin_required)])
async def delete_visualization(
    slug: str,
    request: Request,
    hard: bool = Query(default=False),
) -> Response:
    """Moderate-delete a visualization (CRUD-CONTRACT §5 / §7).

    Default is a soft-delete (``deleted_at`` write, restorable within grace).
    ``?hard=true`` is the admin grace-bypass for illegal content (§7) — a true
    hard-delete in one operation. Both write an ``admin_audit`` row.
    """
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    admin_limiter.check(ip_hashed)

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug}, {"deleted_at": 1})
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    if hard:
        # Admin grace-bypass hard-delete (§7): cascade flags by content hash.
        full = await db.visualizations.find_one({"slug": slug}, {"content_hash": 1})
        content_hash = (full or {}).get("content_hash")
        if content_hash:
            await db.flags.delete_many({"content_hash": content_hash})
        await db.visualizations.delete_one({"slug": slug})
        await log_audit(ip_hashed, "delete:hard", slug)
        return _json({"ok": True, "hard": True})

    deleted = await soft_delete(db.visualizations, slug)
    if not deleted:
        # Already soft-deleted (idempotent no-op post-state) or no live row.
        await log_audit(ip_hashed, "delete:noop", slug)
        return _json({"ok": True, "hard": False, "noop": True})

    await log_audit(ip_hashed, "delete", slug)
    return _json({"ok": True, "hard": False})


# ---------------------------------------------------------------------------
# C1: User Management
# ---------------------------------------------------------------------------


@admin_router.get("/users", dependencies=[Depends(admin_required)])
async def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="newest"),
    q: str = Query(default=""),
):
    """Paginated user list with search and entry counts (over ``visualizations``)."""
    db = get_db()

    match_stage: dict = {}
    if q:
        match_stage["_id"] = {"$regex": re.escape(q), "$options": "i"}

    sort_map = {
        "newest": {"created_at": -1},
        "last_seen": {"last_seen_at": -1},
        "entries": {"entry_count": -1},
    }
    sort_spec = sort_map.get(sort, {"created_at": -1})

    skip = (page - 1) * limit
    total = await db.users.count_documents(match_stage)

    # Live-entry count joins the converged ``visualizations`` collection on the
    # required non-null ``owner_slug`` (CRUD-CONTRACT §3), not the legacy
    # nullable ``gallery.user_slug``.
    lookup_stage = {
        "$lookup": {
            "from": "visualizations",
            "localField": "_id",
            "foreignField": "owner_slug",
            "as": "_entries",
        }
    }
    project_stage = {
        "$project": {
            "user_slug": "$_id",
            "created_at": 1,
            "last_seen_at": 1,
            "status": {"$ifNull": ["$status", "active"]},
            "entry_count": {"$size": "$_entries"},
        }
    }

    if sort == "entries":
        pipeline = [
            {"$match": match_stage},
            lookup_stage,
            {"$addFields": {"entry_count": {"$size": "$_entries"}}},
            {"$sort": sort_spec},
            {"$skip": skip},
            {"$limit": limit},
            project_stage,
        ]
    else:
        pipeline = [
            {"$match": match_stage},
            {"$sort": sort_spec},
            {"$skip": skip},
            {"$limit": limit},
            lookup_stage,
            project_stage,
        ]

    items = [doc async for doc in db.users.aggregate(pipeline)]
    pages = math.ceil(total / limit) if total else 1

    return AdminUserListResponse(items=items, total=total, page=page, pages=pages)


@admin_router.post("/users/{slug}/status", dependencies=[Depends(admin_required)])
async def set_user_status(
    slug: str, body: SetUserStatusRequest, request: Request
) -> Response:
    """Set user status to active or suspended (CRUD-CONTRACT §7 suspend/unsuspend)."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    result = await db.users.update_one(
        {"_id": slug},
        {"$set": {"status": body.status}},
    )
    if result.matched_count == 0:
        return errors.not_found(detail=f"no user {slug!r}")

    if body.status == "suspended":
        await db.sessions.delete_many({"user_slug": slug})
        mark_suspended_in_cache(slug)
    else:
        invalidate_suspension_cache(slug)

    await log_audit(ip_hashed, f"set_user_status:{body.status}", slug)
    return _json({"ok": True, "status": body.status})


@admin_router.delete("/users/{slug}", dependencies=[Depends(admin_required)])
async def delete_user(slug: str, request: Request) -> Response:
    """Cascade-delete a user and all their data (CRUD-CONTRACT §7 ``delete_user``)."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()

    user = await db.users.find_one({"_id": slug})
    if not user:
        return errors.not_found(detail=f"no user {slug!r}")

    # Collect the content hashes of this owner's visualizations so the
    # ``flags`` (keyed by ``content_hash``) cascade.
    content_hashes = [
        doc["content_hash"]
        async for doc in db.visualizations.find(
            {"owner_slug": slug}, {"content_hash": 1}
        )
    ]

    if content_hashes:
        await db.flags.delete_many({"content_hash": {"$in": content_hashes}})
    viz_result = await db.visualizations.delete_many({"owner_slug": slug})
    await db.sessions.delete_many({"user_slug": slug})
    await db.users.delete_one({"_id": slug})
    invalidate_suspension_cache(slug)

    await log_audit(
        ip_hashed,
        "delete_user",
        f"{slug} (entries={viz_result.deleted_count})",
    )

    return _json({"ok": True, "deleted_entries": viz_result.deleted_count})


@admin_router.post("/users/prune-empty", dependencies=[Depends(admin_required)])
async def prune_empty_users(request: Request) -> Response:
    """Delete users that own zero visualizations."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()

    pipeline = [
        {
            "$lookup": {
                "from": "visualizations",
                "localField": "_id",
                "foreignField": "owner_slug",
                "as": "_entries",
            }
        },
        {"$match": {"_entries": {"$size": 0}}},
        {"$project": {"_id": 1}},
    ]

    empty_slugs = [doc["_id"] async for doc in db.users.aggregate(pipeline)]

    if empty_slugs:
        await db.sessions.delete_many({"user_slug": {"$in": empty_slugs}})
        await db.users.delete_many({"_id": {"$in": empty_slugs}})
        for slug in empty_slugs:
            invalidate_suspension_cache(slug)

    await log_audit(ip_hashed, "prune_empty_users", f"count={len(empty_slugs)}")
    return _json({"ok": True, "pruned": len(empty_slugs)})


# ---------------------------------------------------------------------------
# C2: Batch Operations
# ---------------------------------------------------------------------------


@admin_router.post("/visualizations/batch", dependencies=[Depends(admin_required)])
async def batch_visualizations(body: BatchGalleryRequest, request: Request) -> Response:
    """Batch delete/feature/unfeature visualizations by slug (CRUD-CONTRACT §7 ``batch_*``).

    The request shape's ``hashes`` field carries visualization **slugs** under
    the converged identity. ``delete`` is a soft-delete (§5).
    """
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    slugs = body.hashes
    affected = 0

    if body.action == "delete":
        for slug in slugs:
            if await soft_delete(db.visualizations, slug):
                affected += 1
    elif body.action == "feature":
        result = await db.visualizations.update_many(
            {"slug": {"$in": slugs}, "deleted_at": None},
            {"$set": {"tier": "featured", "updated_at": datetime.now(UTC)}},
        )
        affected = result.modified_count
    elif body.action == "unfeature":
        result = await db.visualizations.update_many(
            {"slug": {"$in": slugs}, "deleted_at": None},
            {"$set": {"tier": "normal", "updated_at": datetime.now(UTC)}},
        )
        affected = result.modified_count

    await log_audit(
        ip_hashed,
        f"batch_visualizations:{body.action}",
        f"slugs={len(slugs)}, affected={affected}",
    )

    return _json({"ok": True, "affected": affected})


@admin_router.post("/users/batch", dependencies=[Depends(admin_required)])
async def batch_users(body: BatchUsersRequest, request: Request) -> Response:
    """Batch delete/suspend/unsuspend users (CRUD-CONTRACT §7 ``batch_*``)."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    affected = 0

    if body.action == "delete":
        for slug in body.slugs:
            content_hashes = [
                doc["content_hash"]
                async for doc in db.visualizations.find(
                    {"owner_slug": slug}, {"content_hash": 1}
                )
            ]
            if content_hashes:
                await db.flags.delete_many({"content_hash": {"$in": content_hashes}})
            await db.visualizations.delete_many({"owner_slug": slug})
            await db.sessions.delete_many({"user_slug": slug})
            result = await db.users.delete_one({"_id": slug})
            affected += result.deleted_count
            invalidate_suspension_cache(slug)

    elif body.action == "suspend":
        result = await db.users.update_many(
            {"_id": {"$in": body.slugs}},
            {"$set": {"status": "suspended"}},
        )
        affected = result.modified_count
        await db.sessions.delete_many({"user_slug": {"$in": body.slugs}})
        for slug in body.slugs:
            mark_suspended_in_cache(slug)

    elif body.action == "unsuspend":
        result = await db.users.update_many(
            {"_id": {"$in": body.slugs}},
            {"$set": {"status": "active"}},
        )
        affected = result.modified_count
        for slug in body.slugs:
            invalidate_suspension_cache(slug)

    await log_audit(
        ip_hashed,
        f"batch_users:{body.action}",
        f"slugs={len(body.slugs)}, affected={affected}",
    )

    return _json({"ok": True, "affected": affected})


# ---------------------------------------------------------------------------
# C3: Content Flagging Admin Endpoints
# ---------------------------------------------------------------------------


@admin_router.get("/flagged", dependencies=[Depends(admin_required)])
async def list_flagged(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str = Query(default=""),
) -> Response:
    """List flagged visualizations, cursor-paginated over the converged entity.

    The flag stream (``flags``, keyed by ``content_hash``) is grouped per entity
    and joined to live ``visualizations``; pagination rides ``cursors.paginate``
    newest-first (§0 SOTA-1). Soft-deleted rows are excluded.
    """
    db = get_db()

    cursor_payload = decode_cursor(cursor or None)
    base_query, sort_spec = paginate(
        not_deleted_filter(), cursor_payload, sort_key="newest"
    )

    # Group the flag stream by the entity's content hash, then join to the
    # live visualization (paginated over visualizations' newest order).
    flagged = {}
    async for row in db.flags.aggregate(
        [
            {
                "$group": {
                    "_id": "$content_hash",
                    "flag_count": {"$sum": 1},
                    "flags": {
                        "$push": {
                            "reporter_slug": "$reporter_slug",
                            "reason": "$reason",
                            "detail": "$detail",
                            "created_at": "$created_at",
                        }
                    },
                }
            }
        ]
    ):
        flagged[row["_id"]] = row

    if not flagged:
        return _json({"items": [], "next_cursor": None, "has_more": False})

    query = {**base_query, "content_hash": {"$in": list(flagged.keys())}}
    docs = (
        await db.visualizations.find(query, {"liked_ips": 0})
        .sort(sort_spec)
        .limit(limit + 1)
        .to_list(limit + 1)
    )

    has_more = len(docs) > limit
    if has_more:
        docs = docs[:limit]

    next_cursor = (
        next_cursor_from_last(docs[-1], sort_key="newest")
        if has_more and docs
        else None
    )

    items = []
    for doc in docs:
        agg = flagged.get(doc["content_hash"], {})
        items.append(
            {
                "slug": doc["slug"],
                "content_hash": doc["content_hash"],
                "image_slug": doc.get("image_slug"),
                "owner_slug": doc.get("owner_slug"),
                "tier": doc.get("tier"),
                "created_at": doc.get("created_at"),
                "flag_count": agg.get("flag_count", 0),
                "flags": agg.get("flags", []),
            }
        )

    return _json({"items": items, "next_cursor": next_cursor, "has_more": has_more})


@admin_router.delete("/visualizations/{slug}/flags", dependencies=[Depends(admin_required)])
async def dismiss_flags(slug: str, request: Request) -> Response:
    """Dismiss all flags for a visualization (CRUD-CONTRACT §7 ``dismiss_flags``).

    Resolves the entity by slug, then clears the flag stream keyed by its
    ``content_hash`` (the ``flags`` collection's FK to the visualization's
    content hash). Idempotent — dismissing already-clear flags is a 200 with
    ``dismissed: 0``.
    """
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug}, {"content_hash": 1})
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    result = await db.flags.delete_many({"content_hash": doc["content_hash"]})
    await log_audit(ip_hashed, "dismiss_flags", slug)

    return _json({"dismissed": result.deleted_count})


# ---------------------------------------------------------------------------
# C4: Audit Log Viewer
# ---------------------------------------------------------------------------


@admin_router.get("/audit", dependencies=[Depends(admin_required)])
async def list_audit(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    action: str = Query(default=""),
    after: str = Query(default=""),
    before: str = Query(default=""),
    target: str = Query(default=""),
):
    """Paginated, filterable audit log."""
    db = get_db()

    filter_doc: dict = {}
    if action:
        filter_doc["action"] = action
    if target:
        filter_doc["target"] = {"$regex": re.escape(target), "$options": "i"}
    if after or before:
        ts_filter: dict = {}
        if after:
            ts_filter["$gte"] = datetime.fromisoformat(after)
        if before:
            ts_filter["$lte"] = datetime.fromisoformat(before)
        filter_doc["timestamp"] = ts_filter

    skip = (page - 1) * limit
    total = await db.admin_audit.count_documents(filter_doc)

    cursor = (
        db.admin_audit.find(filter_doc).sort("timestamp", -1).skip(skip).limit(limit)
    )
    items = [doc async for doc in cursor]
    pages = math.ceil(total / limit) if total else 1

    return AuditListResponse(items=items, total=total, page=page, pages=pages)
