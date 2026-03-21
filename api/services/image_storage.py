"""Asset-based image and contour storage (MongoDB documents with Binary blobs)."""

from __future__ import annotations

import hashlib
import io
import json
import logging
import tempfile
from datetime import UTC, datetime

from bson import Binary
from PIL import Image, ImageOps
from pymongo.errors import DuplicateKeyError

from api.services.database import get_db
from api.slugs import generate_slug

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

logger = logging.getLogger(__name__)

_THUMBNAIL_MAX_DIM = 1024
_THUMBNAIL_QUALITY = 60


def _generate_thumbnail(content: bytes, content_type: str) -> tuple[bytes, str]:
    """Generate an AVIF thumbnail from image bytes.

    Returns (thumbnail_bytes, "image/avif").
    """
    img = Image.open(io.BytesIO(content))
    img = ImageOps.exif_transpose(img)
    img = img.convert("RGB")
    img.thumbnail((_THUMBNAIL_MAX_DIM, _THUMBNAIL_MAX_DIM), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="AVIF", quality=_THUMBNAIL_QUALITY)
    return buf.getvalue(), "image/avif"


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
        try:
            thumb_bytes, thumb_ct = _generate_thumbnail(
                bytes(existing["blob"]) if isinstance(existing["blob"], Binary) else existing["blob"],
                existing.get("content_type", "image/png"),
            )
            await db.images.update_one(
                {"_id": existing["_id"]},
                {"$set": {"thumbnail": Binary(thumb_bytes), "thumbnail_content_type": thumb_ct}},
            )
            existing["thumbnail"] = Binary(thumb_bytes)
            existing["thumbnail_content_type"] = thumb_ct
        except Exception:
            logger.warning("Thumbnail regeneration failed for %s", existing.get("image_slug"), exc_info=True)
        return existing

    slug = generate_slug()
    # Ensure slug uniqueness
    while await db.images.find_one({"image_slug": slug}):
        slug = generate_slug()

    # Generate thumbnail
    thumbnail_fields: dict = {}
    try:
        thumb_bytes, thumb_ct = _generate_thumbnail(content, content_type)
        thumbnail_fields = {
            "thumbnail": Binary(thumb_bytes),
            "thumbnail_content_type": thumb_ct,
        }
    except Exception:
        logger.warning("Thumbnail generation failed for %s", original_name, exc_info=True)

    now = datetime.now(UTC)
    doc = {
        "image_slug": slug,
        "sha256": sha256,
        "original_name": original_name,
        "content_type": content_type,
        "bytes": len(content),
        "blob": Binary(content),
        **thumbnail_fields,
        "created_at": now,
        "last_accessed_at": now,
    }
    try:
        await db.images.insert_one(doc)
    except DuplicateKeyError:
        # Race: another request inserted the same sha256 between our check and insert
        existing = await db.images.find_one({"sha256": sha256})
        if existing is not None:
            return existing
        raise
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
        "image/gif": ".gif",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/avif": ".avif",
    }
    ext = ext_map.get(content_type, ".png")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(data)
    tmp.flush()
    return tmp


def extraction_cache_key(image_sha256: str, settings) -> str:
    """Deterministic key from image identity + extraction parameters."""
    payload = json.dumps(
        {
            "_v": 3,
            "image_sha256": image_sha256,
            "strategy": settings.strategy,
            "resize": settings.resize,
            "blur_sigma": settings.blur_sigma,
            "n_classes": settings.n_classes,
            "min_contour_length": settings.min_contour_length,
            "min_contour_area": settings.min_contour_area,
            "max_contours": settings.max_contours,
            "smooth_contours": settings.smooth_contours,
            "n_points": settings.n_points,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


async def store_contour_asset(
    xs: list[float],
    ys: list[float],
    image_slug: str,
    source: str,
    image_bounds: dict | None = None,
    extraction_cache_key_value: str | None = None,
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

    now = datetime.now(UTC)
    doc = {
        "contour_hash": contour_hash,
        "image_slug": image_slug,
        "source": source,
        "point_count": len(xs),
        "bbox": bbox,
        "image_bounds": image_bounds,
        "preview_path": "",
        "points": {"x": xs, "y": ys},
        "created_at": now,
        "last_accessed_at": now,
    }
    if extraction_cache_key_value:
        doc["extraction_cache_key"] = extraction_cache_key_value

    # Upsert: if the hash already exists, just touch last_accessed_at
    set_on_insert = {k: v for k, v in doc.items() if k != "last_accessed_at"}
    result = await db.contours.update_one(
        {"contour_hash": contour_hash},
        {"$setOnInsert": set_on_insert, "$set": {"last_accessed_at": now}},
        upsert=True,
    )

    # Return the document
    return await db.contours.find_one({"contour_hash": contour_hash})
