"""Image upload and retrieval endpoints (asset-based)."""

from __future__ import annotations

import hashlib
import io
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

logger = logging.getLogger(__name__)

from api.config import settings
from api.dependencies import get_image_asset, get_image_meta, validate_image_slug
from api.models.assets import (
    ExtractContourRequest,
    ImageAssetResponse,
)
from api.responses import contour_response
from api.services import computation
from api.services.database import get_db
from api.services.image_storage import (
    _resolve,
    extraction_cache_key,
    image_bytes,
    image_tempfile,
    store_contour_asset,
    store_image_asset,
)
from fourier_analysis.contours import resample_arc_length
from fourier_analysis.shortest_tour import build_contour_tour

import numpy as np

router = APIRouter(prefix="/api/images", tags=["images"])

_IMAGE_MAGIC = [
    (b"\x89PNG", "png"),
    (b"\xff\xd8\xff", "jpeg"),
    (b"BM", "bmp"),
    (b"GIF8", "gif"),
    (b"RIFF", "webp"),
    (b"II\x2a\x00", "tiff"),
    (b"MM\x00\x2a", "tiff"),
]


def _valid_image_magic(data: bytes) -> bool:
    for magic, _ in _IMAGE_MAGIC:
        if data[: len(magic)] == magic:
            return True
    # AVIF/HEIF/HEIC: ftyp box at offset 4
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return True
    return False

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp",
    ".gif", ".heic", ".heif", ".avif",
}

CONTENT_TYPE_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".avif": "image/avif",
}


def _image_response(doc: dict[str, Any]) -> ImageAssetResponse:
    return ImageAssetResponse(
        image_slug=doc["image_slug"],
        sha256=doc["sha256"],
        original_name=doc["original_name"],
        content_type=doc["content_type"],
        bytes=doc["bytes"],
        created_at=doc["created_at"],
        last_accessed_at=doc["last_accessed_at"],
    )


@router.post("", response_model=ImageAssetResponse)
async def upload_image(file: UploadFile) -> ImageAssetResponse:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = Path(file.filename or "upload.png").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    content = await file.read()
    if not _valid_image_magic(content):
        raise HTTPException(status_code=400, detail="File content does not match a supported image format")
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail=f"File too large (max {settings.max_upload_mb}MB)"
        )

    sha = hashlib.sha256(content).hexdigest()
    content_type = CONTENT_TYPE_MAP.get(ext, "image/png")

    doc = await store_image_asset(sha, content, file.filename or "upload.png", content_type)
    return _image_response(doc)


@router.get("/by-hash/{sha256}", response_model=ImageAssetResponse)
async def get_image_by_hash(sha256: str) -> ImageAssetResponse:
    db = get_db()
    doc = await db.images.find_one({"sha256": sha256}, {"blob": 0})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return _image_response(doc)


@router.get("/{imageSlug}", response_model=ImageAssetResponse)
async def get_image_metadata(imageSlug: str) -> ImageAssetResponse:
    doc = await get_image_meta(imageSlug)
    return _image_response(doc)


@router.get("/{imageSlug}/blob")
async def get_image_blob(imageSlug: str) -> FileResponse:
    # C.W5: serve the relocated file via ``FileResponse`` — streams from disk
    # with ``Content-Length`` + conditional-request support, strictly better
    # than the in-memory ``BytesIO`` for large blobs. Route, auth (the
    # ``get_image_asset`` 404 / 410 + ``last_accessed_at`` touch), and
    # ``Cache-Control`` are unchanged. D.W3 γ: the asset is the typed
    # ``ImageAsset`` model — field access is type-checked, not raw subscript.
    asset = await get_image_asset(imageSlug)
    path = _resolve(asset.storage_uri)
    return FileResponse(
        path,
        media_type=asset.content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{imageSlug}/thumbnail")
async def get_image_thumbnail(imageSlug: str) -> FileResponse:
    asset = await get_image_asset(imageSlug)
    # Serve the thumbnail file if one exists, otherwise fall back to the primary
    # storage uri (the ``thumbnail_uri is None`` no-thumbnail case — invariant
    # 18; preserves the prior fallback). D.W3 γ: typed field access.
    if asset.thumbnail_uri is not None:
        path = _resolve(asset.thumbnail_uri)
        content_type = asset.thumbnail_content_type or "image/avif"
    else:
        path = _resolve(asset.storage_uri)
        content_type = asset.content_type
    return FileResponse(
        path,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{imageSlug}/overlay")
async def get_image_overlay(imageSlug: str, resize: int = 1024) -> StreamingResponse:
    """Serve the image resized to match contour extraction dimensions.

    The returned image is in the same pixel space that contour coordinates
    were extracted from, enabling pixel-perfect overlay alignment.
    """
    from PIL import Image as PILImage

    asset = await get_image_asset(imageSlug)
    data, _ = image_bytes(asset)

    def _resize() -> tuple[bytes, str, tuple[int, int]]:
        from PIL import ImageOps
        opened = PILImage.open(io.BytesIO(data))
        transposed = ImageOps.exif_transpose(opened)
        img: PILImage.Image = (transposed or opened).convert("RGB")
        if resize:
            ratio = resize / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, PILImage.Resampling.LANCZOS)
        buf = io.BytesIO()
        try:
            img.save(buf, format="AVIF", quality=70)
            ct = "image/avif"
        except Exception:
            img.save(buf, format="WEBP", quality=80)
            ct = "image/webp"
        return buf.getvalue(), ct, img.size

    import asyncio
    overlay_bytes, content_type, (w, h) = await asyncio.to_thread(_resize)

    return StreamingResponse(
        io.BytesIO(overlay_bytes),
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "X-Image-Width": str(w),
            "X-Image-Height": str(h),
        },
    )


@router.post("/{imageSlug}/extract-contour")
async def extract_contour(imageSlug: str, req: ExtractContourRequest) -> Any:
    asset = await get_image_asset(imageSlug)
    cs = req.contour_settings
    db = get_db()

    # Check extraction cache before running the expensive pipeline
    cache_key = extraction_cache_key(asset.sha256, cs)
    existing = await db.contours.find_one({"extraction_cache_key": cache_key})
    if existing:
        from api.services.database import touch_document

        await touch_document("contours", {"_id": existing["_id"]})
        logger.info("extraction cache hit for %s (key=%s…)", imageSlug, cache_key[:12])
        return contour_response(existing)

    tmp = image_tempfile(asset)
    try:
        result = await computation.compute_contours(
            Path(tmp.name),
            cs.to_contour_config(),  # type: ignore[no-untyped-call]
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("extract-contour failed for %s", imageSlug)
        raise
    finally:
        tmp.close()
        os.unlink(tmp.name)

    contours = result.get("contours", [])
    if not contours:
        raise HTTPException(
            status_code=422,
            detail="No contours extracted — try lowering min area or changing strategy",
        )

    image_bounds = result.get("image_bounds")

    # Combine all contours, order, and resample to n_points
    complex_contours = [
        np.array(c["x"]) + 1j * np.array(c["y"]) for c in contours
    ]
    path = build_contour_tour(complex_contours).path
    path = resample_arc_length(path, cs.n_points)
    xs = path.real.tolist()
    ys = path.imag.tolist()

    contour_doc = await store_contour_asset(
        xs, ys, imageSlug, source="extract", image_bounds=image_bounds,
        extraction_cache_key_value=cache_key,
    )
    return contour_response(contour_doc)
