"""Snapshot CRUD endpoints."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime

from fastapi import APIRouter, HTTPException

from api.dependencies import get_contour, validate_image_slug
from api.models.assets import CreateSnapshotRequest, SnapshotResponse
from api.services.database import get_db

router = APIRouter(prefix="/api/images/{imageSlug}/snapshots", tags=["snapshots"])


def _snapshot_response(doc: dict) -> SnapshotResponse:
    return SnapshotResponse(
        snapshot_hash=doc["snapshot_hash"],
        image_slug=doc["image_slug"],
        contour_hash=doc["contour_hash"],
        contour_settings=doc["contour_settings"],
        animation_settings=doc["animation_settings"],
        created_at=doc["created_at"],
    )


@router.post("", response_model=SnapshotResponse)
async def create_snapshot(imageSlug: str, req: CreateSnapshotRequest):
    validate_image_slug(imageSlug)
    db = get_db()

    # Verify the contour exists
    await get_contour(req.contour_hash)

    # Compute deterministic snapshot hash
    hash_input = json.dumps(
        {
            "image_slug": imageSlug,
            "contour_hash": req.contour_hash,
            "contour_settings": req.contour_settings.model_dump(),
            "animation_settings": req.animation_settings.model_dump(),
        },
        sort_keys=True,
    )
    snapshot_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    now = datetime.utcnow()
    doc = {
        "snapshot_hash": snapshot_hash,
        "image_slug": imageSlug,
        "contour_hash": req.contour_hash,
        "contour_settings": req.contour_settings.model_dump(),
        "animation_settings": req.animation_settings.model_dump(),
        "created_at": now,
    }

    await db.snapshots.update_one(
        {"snapshot_hash": snapshot_hash},
        {"$setOnInsert": doc},
        upsert=True,
    )

    saved = await db.snapshots.find_one({"snapshot_hash": snapshot_hash})
    return _snapshot_response(saved)


@router.get("/{snapshotHash}", response_model=SnapshotResponse)
async def get_snapshot(imageSlug: str, snapshotHash: str):
    validate_image_slug(imageSlug)
    db = get_db()
    doc = await db.snapshots.find_one(
        {"snapshot_hash": snapshotHash, "image_slug": imageSlug}
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return _snapshot_response(doc)
