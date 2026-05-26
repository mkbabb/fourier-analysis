"""Admin moderation endpoints for gallery management."""

from __future__ import annotations

import logging
import math
import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from api.dependencies import (
    admin_required,
    get_client_ip,
    hash_ip,
    invalidate_suspension_cache,
    mark_suspended_in_cache,
)
from api.models.admin import (
    AdminUserListResponse,
    AuditListResponse,
    BatchGalleryRequest,
    BatchUsersRequest,
    FlaggedListResponse,
    SetUserStatusRequest,
)
from api.models.gallery import (
    AdminStatsResponse,
    GalleryEntryResponse,
    GalleryTier,
    SetTierRequest,
)
from api.routers.gallery import _entry_from_doc
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


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@admin_router.get("/verify", dependencies=[Depends(admin_required)])
async def admin_verify():
    """Verify admin token is valid."""
    return {"ok": True}


@admin_router.get("/stats", response_model=AdminStatsResponse, dependencies=[Depends(admin_required)])
async def admin_stats():
    """Aggregate gallery and storage statistics."""
    db = get_db()

    # Count entries by tier
    pipeline = [
        {"$group": {"_id": "$tier", "count": {"$sum": 1}}},
    ]
    tier_counts = {"featured": 0, "saved": 0, "normal": 0}
    async for row in db.gallery.aggregate(pipeline):
        tier_id = row["_id"]
        if tier_id in tier_counts:
            tier_counts[tier_id] = row["count"]

    total_entries = sum(tier_counts.values())

    # Sum views and likes
    totals_pipeline = [
        {
            "$group": {
                "_id": None,
                "total_views": {"$sum": "$views"},
                "total_likes": {"$sum": "$likes"},
            }
        }
    ]
    totals = {"total_views": 0, "total_likes": 0}
    async for row in db.gallery.aggregate(totals_pipeline):
        totals["total_views"] = row.get("total_views", 0)
        totals["total_likes"] = row.get("total_likes", 0)

    # Storage from images collection
    storage_pipeline = [
        {"$group": {"_id": None, "total_bytes": {"$sum": "$bytes"}}},
    ]
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
    "/gallery/{hash}/tier",
    response_model=GalleryEntryResponse,
    dependencies=[Depends(admin_required)],
)
async def set_tier(hash: str, body: SetTierRequest, request: Request):
    """Set the tier for a gallery entry."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    admin_limiter.check(ip_hashed)

    db = get_db()
    result = await db.gallery.update_one(
        {"snapshot_hash": hash},
        {"$set": {"tier": body.tier, "updated_at": datetime.now(UTC)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    await log_audit(ip_hashed, "set_tier", hash)

    doc = await db.gallery.find_one({"snapshot_hash": hash})
    return _entry_from_doc(doc)


@admin_router.delete("/gallery/{hash}", dependencies=[Depends(admin_required)])
async def delete_gallery_entry(hash: str, request: Request):
    """Delete a gallery entry."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    admin_limiter.check(ip_hashed)

    db = get_db()
    result = await db.gallery.delete_one({"snapshot_hash": hash})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    await log_audit(ip_hashed, "delete", hash)

    return {"ok": True}


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
    """Paginated user list with search and entry counts."""
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

    # Count total matching users
    total = await db.users.count_documents(match_stage)

    # If sorting by entries we need to $lookup before $sort
    if sort == "entries":
        pipeline = [
            {"$match": match_stage},
            {
                "$lookup": {
                    "from": "gallery",
                    "localField": "_id",
                    "foreignField": "user_slug",
                    "as": "_gallery",
                }
            },
            {
                "$addFields": {
                    "entry_count": {"$size": "$_gallery"},
                }
            },
            {"$sort": sort_spec},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$project": {
                    "user_slug": "$_id",
                    "created_at": 1,
                    "last_seen_at": 1,
                    "status": {"$ifNull": ["$status", "active"]},
                    "entry_count": 1,
                }
            },
        ]
    else:
        pipeline = [
            {"$match": match_stage},
            {"$sort": sort_spec},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "gallery",
                    "localField": "_id",
                    "foreignField": "user_slug",
                    "as": "_gallery",
                }
            },
            {
                "$project": {
                    "user_slug": "$_id",
                    "created_at": 1,
                    "last_seen_at": 1,
                    "status": {"$ifNull": ["$status", "active"]},
                    "entry_count": {"$size": "$_gallery"},
                }
            },
        ]

    items = [doc async for doc in db.users.aggregate(pipeline)]
    pages = math.ceil(total / limit) if total else 1

    return AdminUserListResponse(items=items, total=total, page=page, pages=pages)


@admin_router.post("/users/{slug}/status", dependencies=[Depends(admin_required)])
async def set_user_status(slug: str, body: SetUserStatusRequest, request: Request):
    """Set user status to active or suspended."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    result = await db.users.update_one(
        {"_id": slug},
        {"$set": {"status": body.status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    if body.status == "suspended":
        await db.sessions.delete_many({"user_slug": slug})
        mark_suspended_in_cache(slug)
    else:
        invalidate_suspension_cache(slug)

    await log_audit(ip_hashed, f"set_user_status:{body.status}", slug)

    return {"ok": True, "status": body.status}


@admin_router.delete("/users/{slug}", dependencies=[Depends(admin_required)])
async def delete_user(slug: str, request: Request):
    """Cascade-delete a user and all their data."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()

    # Verify user exists
    user = await db.users.find_one({"_id": slug})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Collect snapshot hashes for this user's gallery entries
    entry_hashes = [
        doc["snapshot_hash"]
        async for doc in db.gallery.find({"user_slug": slug}, {"snapshot_hash": 1})
    ]

    # Cascade deletes
    if entry_hashes:
        await db.flags.delete_many({"snapshot_hash": {"$in": entry_hashes}})
    gallery_result = await db.gallery.delete_many({"user_slug": slug})
    await db.sessions.delete_many({"user_slug": slug})
    await db.users.delete_one({"_id": slug})
    invalidate_suspension_cache(slug)

    await log_audit(
        ip_hashed,
        "delete_user",
        f"{slug} (entries={gallery_result.deleted_count})",
    )

    return {
        "ok": True,
        "deleted_entries": gallery_result.deleted_count,
    }


@admin_router.post("/users/prune-empty", dependencies=[Depends(admin_required)])
async def prune_empty_users(request: Request):
    """Delete users with zero gallery entries."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()

    # Find users with 0 gallery entries
    pipeline = [
        {
            "$lookup": {
                "from": "gallery",
                "localField": "_id",
                "foreignField": "user_slug",
                "as": "_gallery",
            }
        },
        {"$match": {"_gallery": {"$size": 0}}},
        {"$project": {"_id": 1}},
    ]

    empty_slugs = [doc["_id"] async for doc in db.users.aggregate(pipeline)]

    if empty_slugs:
        await db.sessions.delete_many({"user_slug": {"$in": empty_slugs}})
        await db.users.delete_many({"_id": {"$in": empty_slugs}})
        for slug in empty_slugs:
            invalidate_suspension_cache(slug)

    await log_audit(ip_hashed, "prune_empty_users", f"count={len(empty_slugs)}")

    return {"ok": True, "pruned": len(empty_slugs)}


# ---------------------------------------------------------------------------
# C2: Batch Operations
# ---------------------------------------------------------------------------


@admin_router.post("/gallery/batch", dependencies=[Depends(admin_required)])
async def batch_gallery(body: BatchGalleryRequest, request: Request):
    """Batch delete/feature/unfeature gallery entries."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    affected = 0

    if body.action == "delete":
        # Cascade-delete flags for these entries
        await db.flags.delete_many({"snapshot_hash": {"$in": body.hashes}})
        result = await db.gallery.delete_many(
            {"snapshot_hash": {"$in": body.hashes}}
        )
        affected = result.deleted_count
    elif body.action == "feature":
        result = await db.gallery.update_many(
            {"snapshot_hash": {"$in": body.hashes}},
            {"$set": {"tier": "featured", "updated_at": datetime.now(UTC)}},
        )
        affected = result.modified_count
    elif body.action == "unfeature":
        result = await db.gallery.update_many(
            {"snapshot_hash": {"$in": body.hashes}},
            {"$set": {"tier": "normal", "updated_at": datetime.now(UTC)}},
        )
        affected = result.modified_count

    await log_audit(
        ip_hashed,
        f"batch_gallery:{body.action}",
        f"hashes={len(body.hashes)}, affected={affected}",
    )

    return {"ok": True, "affected": affected}


@admin_router.post("/users/batch", dependencies=[Depends(admin_required)])
async def batch_users(body: BatchUsersRequest, request: Request):
    """Batch delete/suspend/unsuspend users."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    affected = 0

    if body.action == "delete":
        for slug in body.slugs:
            # Collect entry hashes
            entry_hashes = [
                doc["snapshot_hash"]
                async for doc in db.gallery.find(
                    {"user_slug": slug}, {"snapshot_hash": 1}
                )
            ]
            if entry_hashes:
                await db.flags.delete_many({"snapshot_hash": {"$in": entry_hashes}})
            await db.gallery.delete_many({"user_slug": slug})
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

    return {"ok": True, "affected": affected}


# ---------------------------------------------------------------------------
# C3: Content Flagging Admin Endpoints
# ---------------------------------------------------------------------------


@admin_router.get("/flagged", dependencies=[Depends(admin_required)])
async def list_flagged(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """List flagged gallery entries grouped by snapshot_hash."""
    db = get_db()

    skip = (page - 1) * limit

    # Count distinct flagged entries
    count_pipeline = [
        {"$group": {"_id": "$snapshot_hash"}},
        {"$count": "total"},
    ]
    count_result = [doc async for doc in db.flags.aggregate(count_pipeline)]
    total = count_result[0]["total"] if count_result else 0

    # Get flagged entries with details
    pipeline = [
        {
            "$group": {
                "_id": "$snapshot_hash",
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
        },
        {"$sort": {"flag_count": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "gallery",
                "localField": "_id",
                "foreignField": "snapshot_hash",
                "as": "_entry",
            }
        },
        {
            "$project": {
                "snapshot_hash": "$_id",
                "flag_count": 1,
                "flags": 1,
                "image_slug": {"$arrayElemAt": ["$_entry.image_slug", 0]},
                "user_slug": {"$arrayElemAt": ["$_entry.user_slug", 0]},
                "tier": {"$arrayElemAt": ["$_entry.tier", 0]},
                "created_at": {"$arrayElemAt": ["$_entry.created_at", 0]},
            }
        },
    ]

    items = [doc async for doc in db.flags.aggregate(pipeline)]
    pages = math.ceil(total / limit) if total else 1

    return FlaggedListResponse(items=items, total=total, page=page, pages=pages)


@admin_router.delete("/flags/{hash}", dependencies=[Depends(admin_required)])
async def dismiss_flags(hash: str, request: Request):
    """Dismiss all flags for a gallery entry."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)

    db = get_db()
    result = await db.flags.delete_many({"snapshot_hash": hash})

    await log_audit(ip_hashed, "dismiss_flags", hash)

    return {"dismissed": result.deleted_count}


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
        db.admin_audit.find(filter_doc)
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    items = [doc async for doc in cursor]
    pages = math.ceil(total / limit) if total else 1

    return AuditListResponse(items=items, total=total, page=page, pages=pages)
