"""Asset-based image and contour storage (MongoDB documents with Binary blobs).

**Carve note (fourier-B.W3.3).** This module owns *blob storage + content
hashing* (``sha256`` dedup on images; ``contour_hash`` on contours — both
*non-identity* dedup keys per CRUD-CONTRACT §1). Slug *issuance* is lifted
out of the prior check-then-insert TOCTOU loop and through
``api.lib.crud.slugs.slug_with_retry`` (insert-then-catch ``DuplicateKeyError``
against the unique ``image_slug`` index per CRUD-CONTRACT §2).
"""

from __future__ import annotations

import hashlib
import io
import json
import logging
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, cast

from PIL import Image, ImageOps
from pymongo.errors import DuplicateKeyError

from api.config import settings
from api.lib.crud.slugs import slug_with_retry
from api.models.assets import ImageAsset
from api.services.database import get_db

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

logger = logging.getLogger(__name__)

_THUMBNAIL_MAX_DIM = 1024
_THUMBNAIL_QUALITY = 60


def _blob_dir() -> Path:
    """The filesystem backend root, created on demand (C.W5, invariant 18).

    Mirrors the migration script's ``_blob_dir`` — a single source for the
    mount-point path so a remount only changes ``settings.blob_dir``.
    """
    p = Path(settings.blob_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _resolve(uri: str) -> Path:
    """Resolve a backend-relative ``storage_uri`` to an absolute, confined path.

    ``uri`` is ``"fs:<key>"`` (e.g. ``fs:<image_slug>`` or
    ``fs:<image_slug>.thumb``); the key resolves under ``blob_dir``. The
    confinement assert is the C3 defence-in-depth layer (`challenge-P1.md §5.1`):
    the ``IMAGE_SLUG_PATTERN`` edge regex already blocks ``..``/``/``, so this is
    NOT a live hole — it is the second guard that keeps a future less-validated
    ``storage_uri`` writer from becoming an arbitrary-read.
    """
    key = uri[3:] if uri.startswith("fs:") else uri
    root = _blob_dir().resolve()
    path = (root / key).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"storage_uri escapes blob_dir: {uri!r}")
    return path


def _generate_thumbnail(content: bytes, content_type: str) -> tuple[bytes, str]:
    """Generate an AVIF thumbnail from image bytes.

    Returns (thumbnail_bytes, "image/avif").
    """
    opened = Image.open(io.BytesIO(content))
    transposed = ImageOps.exif_transpose(opened)
    img: Image.Image = (transposed or opened).convert("RGB")
    img.thumbnail((_THUMBNAIL_MAX_DIM, _THUMBNAIL_MAX_DIM), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="AVIF", quality=_THUMBNAIL_QUALITY)
    return buf.getvalue(), "image/avif"


async def store_image_asset(
    sha256: str,
    content: bytes,
    original_name: str,
    content_type: str,
) -> dict[str, Any]:
    """Store an image blob in MongoDB, deduplicating by sha256.

    Returns the full Mongo document. The typed-shim transposition lives at the
    *consumer* boundary (``image_bytes`` / ``image_tempfile`` /
    ``get_image_asset``) — the write-path return stays a raw dict so the rest
    of the codebase, including the C.W5 regression tests, can continue to use
    subscript access against the freshly-inserted doc. The dedup-hit branch
    DOES validate through ``ImageAsset.model_validate`` before calling
    ``image_bytes`` so the typed contract is exercised on the path that
    produced bug C9.
    """
    db = get_db()

    existing = await db.images.find_one({"sha256": sha256})
    if existing is not None:
        # C9 (the real dedup-hit bug): the prior code read ``existing["blob"]``
        # as a subscript, which KeyErrors on a migrated (``blob``-less) doc and
        # was swallowed by this broad ``except`` — a silent missing-thumbnail
        # regression on every dedup upload post-migration. Read the primary bytes
        # through the typed shim (the relocated file) and write the regenerated
        # thumbnail back as a FILE + ``thumbnail_uri`` — NEVER an inline
        # ``Binary`` (that re-violated invariant 18 on the converged collection).
        # The ``ImageAsset.model_validate`` boundary turns a missing
        # ``storage_uri`` into a Pydantic ``ValidationError`` rather than a
        # ``KeyError`` swallowed by a broad ``except`` (D.W3 γ transposition).
        try:
            existing_asset = ImageAsset.model_validate(existing)
            primary_bytes, primary_ct = image_bytes(existing_asset)
            regen_thumb_bytes, thumb_ct = _generate_thumbnail(primary_bytes, primary_ct)
            slug = existing_asset.image_slug
            (_blob_dir() / f"{slug}.thumb").write_bytes(regen_thumb_bytes)
            thumbnail_uri = f"fs:{slug}.thumb"
            await db.images.update_one(
                {"_id": existing["_id"]},
                {"$set": {"thumbnail_uri": thumbnail_uri, "thumbnail_content_type": thumb_ct}},
            )
            existing["thumbnail_uri"] = thumbnail_uri
            existing["thumbnail_content_type"] = thumb_ct
        except Exception:
            logger.warning(
                "Thumbnail regeneration failed for %s",
                existing.get("image_slug"),
                exc_info=True,
            )
        return cast("dict[str, Any]", existing)

    # Generate the thumbnail bytes (the second blob — invariant 18). Both the
    # primary and the thumbnail are relocated onto the filesystem backend; the
    # document carries only the ``storage_uri``/``thumbnail_uri`` keys, never an
    # inline ``Binary`` (the C.W5 deletion proof — the prior ``blob``/
    # ``thumbnail`` Binary writes are gone).
    primary_thumb_bytes: bytes | None = None
    thumbnail_fields: dict[str, Any] = {"thumbnail_uri": None}
    try:
        primary_thumb_bytes, thumb_ct = _generate_thumbnail(content, content_type)
        thumbnail_fields = {"thumbnail_content_type": thumb_ct}
    except Exception:
        logger.warning("Thumbnail generation failed for %s", original_name, exc_info=True)

    now = datetime.now(UTC)
    record: dict[str, Any] = {
        "sha256": sha256,
        "original_name": original_name,
        "content_type": content_type,
        "bytes": len(content),
        **thumbnail_fields,
        "created_at": now,
        "last_accessed_at": now,
    }

    # Slug issuance lifted through the utility's insert-then-catch loop
    # (CRUD-CONTRACT §2) — retires the prior check-then-insert TOCTOU race.
    # ``slug_with_retry`` catches ``DuplicateKeyError`` and retries with a
    # fresh slug, so a *slug*-index collision is handled transparently. A
    # ``sha256``-index collision (another request inserted the byte-identical
    # blob between our dedup check and this insert) is NOT a slug problem, so
    # we resolve it inside the closure and surface the winning document
    # rather than burning retries on it.
    race_winner: dict[str, Any] | None = None
    blob_dir = _blob_dir()

    async def _insert(candidate: str) -> None:
        nonlocal race_winner
        # The ``storage_uri`` / ``thumbnail_uri`` are slug-keyed, so they are
        # finalised once the candidate slug is known. The files are written
        # AFTER a successful insert so a slug-collision retry never leaves a
        # file under an abandoned slug; the insert owning the unique
        # ``image_slug`` index is what makes the slug ours to write under.
        record.update(
            {
                "image_slug": candidate,
                "storage_uri": f"fs:{candidate}",
            }
        )
        if primary_thumb_bytes is not None:
            record["thumbnail_uri"] = f"fs:{candidate}.thumb"
        try:
            await db.images.insert_one(record)
        except DuplicateKeyError as exc:
            existing = await db.images.find_one({"sha256": sha256})
            if existing is not None:
                # sha256 race — terminal; not a slug collision.
                race_winner = existing
                return
            # No sha256 winner ⇒ this was a slug collision; re-raise so
            # slug_with_retry mints a fresh candidate.
            raise exc
        # Insert won the unique index — relocate the bytes onto the backend.
        (blob_dir / candidate).write_bytes(content)
        if primary_thumb_bytes is not None:
            (blob_dir / f"{candidate}.thumb").write_bytes(primary_thumb_bytes)

    await slug_with_retry(_insert)
    return race_winner if race_winner is not None else record


def image_bytes(asset: ImageAsset) -> tuple[bytes, str]:
    """Extract raw bytes and content_type from a typed image asset.

    Resolves by ``storage_uri``-presence (C.W5, `R-storage-spec §2.1`): the
    relocated blob lives on the filesystem backend. The pre-cutover
    ``blob``-reading branch is DELETED — the atomic per-doc flip (`§4`) means no
    document carries an inline ``blob`` post-migration, so a surviving ``blob``
    read would be the dual-read legacy layer invariant 3 forbids.

    The parameter is the typed ``ImageAsset`` model (D.W3 γ transposition):
    field presence is a Pydantic construction-time contract, not a runtime
    ``KeyError`` waiting in a broad ``except``.
    """
    return _resolve(asset.storage_uri).read_bytes(), asset.content_type


def image_tempfile(asset: ImageAsset) -> "tempfile._TemporaryFileWrapper[bytes]":
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


def extraction_cache_key(image_sha256: str, settings: Any) -> str:
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


def compute_contour_hash(xs: list[float], ys: list[float]) -> str:
    """Hash ordered coordinate pairs of a contour curve.

    The hash discriminates two curves with identical coordinate multisets but
    distinct vertex orderings — e.g. the positive diagonal ``(0,0)→(1,1)`` and
    the negative diagonal ``(0,1)→(1,0)`` share ``sorted(xs)`` and ``sorted(ys)``
    yet describe different curves. Hashing on the ordered ``(x, y)`` pair list
    preserves order; hashing on the sorted axes independently does not.
    """
    points_payload = json.dumps(
        {"pairs": [[x, y] for x, y in zip(xs, ys)]},
        sort_keys=True,
    )
    return hashlib.sha256(points_payload.encode()).hexdigest()


async def store_contour_asset(
    xs: list[float],
    ys: list[float],
    image_slug: str,
    source: str,
    image_bounds: dict[str, Any] | None = None,
    extraction_cache_key_value: str | None = None,
) -> dict[str, Any]:
    """Store contour points in MongoDB, deduplicating by contour_hash.

    Returns the full document.
    """
    db = get_db()

    # Hash on the ordered coordinate pairs — independently sorting xs and ys
    # collapses distinct curves with identical multisets onto the same key.
    contour_hash = compute_contour_hash(xs, ys)

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
    await db.contours.update_one(
        {"contour_hash": contour_hash},
        {"$setOnInsert": set_on_insert, "$set": {"last_accessed_at": now}},
        upsert=True,
    )

    # Return the document
    return cast("dict[str, Any]", await db.contours.find_one({"contour_hash": contour_hash}))
