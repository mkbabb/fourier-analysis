"""Image upload and retrieval endpoints (asset-based)."""

from __future__ import annotations

import hashlib
import io
import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from api.config import settings
from api.dependencies import get_image_asset, get_image_meta
from api.models.assets import (
    ExtractContourRequest,
    ImageAssetResponse,
)
from api.responses import contour_response
from api.services import computation
from api.services.image_storage import (
    image_bytes,
    image_tempfile,
    store_contour_asset,
    store_image_asset,
)
from fourier_analysis.contours import resample_arc_length
from fourier_analysis.shortest_tour import build_contour_tour

import numpy as np

router = APIRouter(prefix="/api/images", tags=["images"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}

CONTENT_TYPE_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".webp": "image/webp",
}


def _image_response(doc: dict) -> ImageAssetResponse:
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
async def upload_image(file: UploadFile):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = Path(file.filename or "upload.png").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    content = await file.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail=f"File too large (max {settings.max_upload_mb}MB)"
        )

    sha = hashlib.sha256(content).hexdigest()
    content_type = CONTENT_TYPE_MAP.get(ext, "image/png")

    doc = await store_image_asset(sha, content, file.filename or "upload.png", content_type)
    return _image_response(doc)


@router.get("/{imageSlug}", response_model=ImageAssetResponse)
async def get_image_metadata(imageSlug: str):
    doc = await get_image_meta(imageSlug)
    return _image_response(doc)


@router.get("/{imageSlug}/blob")
async def get_image_blob(imageSlug: str):
    doc = await get_image_asset(imageSlug)
    data, content_type = image_bytes(doc)
    return StreamingResponse(
        io.BytesIO(data),
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.post("/{imageSlug}/extract-contour")
async def extract_contour(imageSlug: str, req: ExtractContourRequest):
    doc = await get_image_asset(imageSlug)
    tmp = image_tempfile(doc)
    try:
        cs = req.contour_settings
        result = await computation.compute_contours(
            Path(tmp.name),
            strategy=cs.strategy,
            resize=cs.resize,
            blur_sigma=cs.blur_sigma,
            n_classes=cs.n_classes,
            min_contour_length=cs.min_contour_length,
            min_contour_area=cs.min_contour_area,
            max_contours=cs.max_contours,
            smooth_contours=cs.smooth_contours,
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

    # Combine all contours, order, and resample to n_points
    complex_contours = [
        np.array(c["x"]) + 1j * np.array(c["y"]) for c in contours
    ]
    path = build_contour_tour(complex_contours).path
    path = resample_arc_length(path, cs.n_points)
    xs = path.real.tolist()
    ys = path.imag.tolist()

    contour_doc = await store_contour_asset(xs, ys, imageSlug, source="extract")
    return contour_response(contour_doc)
