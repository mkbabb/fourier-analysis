"""Asset-based image and contour storage (MongoDB documents with Binary blobs)."""

from __future__ import annotations

import hashlib
import json
import tempfile
from datetime import datetime
from pathlib import Path

from bson import Binary

from api.services.database import get_db
from api.slugs import generate_slug


async def store_image_asset(
    sha256: str,
    content: bytes,
    original_name: str,
    content_type: str,
) -> dict:
    """Store an image blob in MongoDB, deduplicating by sha256.

    Returns the full document (including blob).
    """
    db = get_db()

    existing = await db.images.find_one({"sha256": sha256})
    if existing is not None:
        return existing

    slug = generate_slug()
    # Ensure slug uniqueness
    while await db.images.find_one({"image_slug": slug}):
        slug = generate_slug()

    now = datetime.utcnow()
    doc = {
        "image_slug": slug,
        "sha256": sha256,
        "original_name": original_name,
        "content_type": content_type,
        "bytes": len(content),
        "blob": Binary(content),
        "created_at": now,
        "last_accessed_at": now,
    }
    await db.images.insert_one(doc)
    return doc


def image_bytes(asset: dict) -> tuple[bytes, str]:
    """Extract raw bytes and content_type from an image document."""
    blob = asset["blob"]
    data = bytes(blob) if isinstance(blob, Binary) else blob
    return data, asset.get("content_type", "image/png")


def image_tempfile(asset: dict) -> tempfile.NamedTemporaryFile:
    """Write image blob to a temporary file for compute.

    Returns the open NamedTemporaryFile (caller should close/delete when done).
    """
    data, content_type = image_bytes(asset)
    ext_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
        "image/webp": ".webp",
    }
    ext = ext_map.get(content_type, ".png")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(data)
    tmp.flush()
    return tmp


async def store_contour_asset(
    xs: list[float],
    ys: list[float],
    image_slug: str,
    source: str,
) -> dict:
    """Store contour points in MongoDB, deduplicating by contour_hash.

    Returns the full document.
    """
    db = get_db()

    # Compute deterministic hash from sorted points
    points_payload = json.dumps({"x": sorted(xs), "y": sorted(ys)}, sort_keys=True)
    contour_hash = hashlib.sha256(points_payload.encode()).hexdigest()

    bbox = {
        "minX": min(xs) if xs else 0.0,
        "maxX": max(xs) if xs else 0.0,
        "minY": min(ys) if ys else 0.0,
        "maxY": max(ys) if ys else 0.0,
    }

    now = datetime.utcnow()
    doc = {
        "contour_hash": contour_hash,
        "image_slug": image_slug,
        "source": source,
        "point_count": len(xs),
        "bbox": bbox,
        "preview_path": "",
        "points": {"x": xs, "y": ys},
        "created_at": now,
        "last_accessed_at": now,
    }

    # Upsert: if the hash already exists, just touch last_accessed_at
    set_on_insert = {k: v for k, v in doc.items() if k != "last_accessed_at"}
    result = await db.contours.update_one(
        {"contour_hash": contour_hash},
        {"$setOnInsert": set_on_insert, "$set": {"last_accessed_at": now}},
        upsert=True,
    )

    # Return the document
    return await db.contours.find_one({"contour_hash": contour_hash})
