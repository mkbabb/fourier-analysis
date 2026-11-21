"""Image upload and retrieval endpoints (asset-based)."""

from __future__ import annotations

import hashlib
import io
from datetime import UTC, datetime
import logging
import os
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

logger = logging.getLogger(__name__)

from api.config import settings
from api.dependencies import get_image_asset, resolve_session, validate_image_slug
from api.lib.crud import errors
from api.models.assets import (
    ExtractContourRequest,
    ImageAssetResponse,
    ImageJobRequest,
)
from api.models.shared import ContourSettings
from api.routers.contours import series_work
from api.routers.jobs import JobCreated, created, job_error
from api.responses import contour_response
from api.services import computation, jobs
from api.services import read_gate
from api.services.database import get_db, touch_document
from api.services.image_storage import (
    BlobNotFound,
    extraction_cache_key,
    image_bytes,
    image_tempfile,
    resolve_blob,
    store_contour_asset,
    store_image_asset,
)

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


@contextmanager
def _blob_not_found_as_404() -> Iterator[None]:
    """Answer the storage layer's typed ``BlobNotFound`` as HTTP 404.

    A row whose blob file is gone (F.W14U.b, COHESION §0cv) is a not-found
    resource, not a server fault; re-uploading the same bytes re-stores it.
    """
    try:
        yield
    except BlobNotFound as exc:
        raise HTTPException(status_code=404, detail="Image blob not found") from exc


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


async def _readable(request: Request, image_slug: str) -> bool:
    """The one read gate (X·F F-D5); raises 404 when the viewer may not read the
    image, else answers whether shared caches may keep it."""
    validate_image_slug(image_slug)
    gate = await read_gate.readable_image(
        get_db(), image_slug, await resolve_session(request), projection={"blob": 0}
    )
    if gate is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return gate[1]


@router.post("", response_model=ImageAssetResponse)
async def upload_image(file: UploadFile, request: Request) -> ImageAssetResponse:
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

    uploader = await resolve_session(request)
    doc = await store_image_asset(
        sha, content, file.filename or "upload.png", content_type, uploader=uploader
    )
    return _image_response(doc)


@router.get("/by-hash/{sha256}", response_model=ImageAssetResponse)
async def get_image_by_hash(sha256: str, request: Request) -> ImageAssetResponse:
    db = get_db()
    doc = await db.images.find_one({"sha256": sha256, "deleted_at": None}, {"image_slug": 1})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    await _readable(request, doc["image_slug"])
    full = await db.images.find_one({"sha256": sha256}, {"blob": 0})
    return _image_response(full)


@router.get("/{imageSlug}", response_model=ImageAssetResponse)
async def get_image_metadata(imageSlug: str, request: Request, response: Response) -> ImageAssetResponse:
    public = await _readable(request, imageSlug)
    response.headers["Cache-Control"] = read_gate.image_cache_control(public)
    doc = await get_db().images.find_one({"image_slug": imageSlug}, {"blob": 0})
    return _image_response(doc)


@router.delete("/{imageSlug}", status_code=204)
async def delete_image(imageSlug: str, request: Request) -> Response:
    """The uploader's delete (X·F F-D5 · FW6-G11). Refused with 409 while any
    live visualization references the image; otherwise a soft-delete, and the
    janitor's grace hard-delete removes the blob, the thumbnail and the cached
    contours. An image the caller did not upload reads 404 (never confirmed)."""
    validate_image_slug(imageSlug)
    viewer = await resolve_session(request)
    if not viewer:
        return errors.owner_required(detail="A session is required to delete an image.")
    db = get_db()
    doc = await db.images.find_one(
        {"image_slug": imageSlug, "deleted_at": None}, {"owner_slug": 1}
    )
    if doc is None or doc.get("owner_slug") != viewer:
        return errors.not_found(detail=f"no image {imageSlug!r}")
    if await db.visualizations.find_one({"image_slug": imageSlug, "deleted_at": None}, {"_id": 1}):
        return errors.problem(
            "urn:contract:image-referenced", 409, "Image in use",
            detail="a live visualization references this image; delete it first",
        )
    deleted = await _softdelete_image(db, imageSlug, viewer)
    if not deleted:
        return errors.not_found(detail=f"no image {imageSlug!r}")
    return Response(status_code=204)


async def _softdelete_image(db: Any, image_slug: str, owner_slug: str) -> bool:
    result = await db.images.update_one(
        {"image_slug": image_slug, "owner_slug": owner_slug, "deleted_at": None},
        {"$set": {"deleted_at": datetime.now(UTC)}},
    )
    return result.modified_count > 0


@router.get("/{imageSlug}/blob")
async def get_image_blob(imageSlug: str, request: Request) -> FileResponse:
    # C.W5: serve the relocated file via ``FileResponse`` — streams from disk
    # with ``Content-Length`` + conditional-request support, strictly better
    # than the in-memory ``BytesIO`` for large blobs. Route, auth (the
    # ``get_image_asset`` 404 / 410 + ``last_accessed_at`` touch), and
    # ``Cache-Control`` are unchanged. D.W3 γ: the asset is the typed
    # ``ImageAsset`` model — field access is type-checked, not raw subscript.
    public = await _readable(request, imageSlug)
    asset = await get_image_asset(imageSlug)
    with _blob_not_found_as_404():
        path = resolve_blob(asset.storage_uri)
    return FileResponse(
        path,
        media_type=asset.content_type,
        headers={"Cache-Control": read_gate.image_cache_control(public)},
    )


@router.get("/{imageSlug}/thumbnail")
async def get_image_thumbnail(imageSlug: str, request: Request) -> FileResponse:
    public = await _readable(request, imageSlug)
    asset = await get_image_asset(imageSlug)
    # Serve the thumbnail file if one exists, otherwise fall back to the primary
    # storage uri (the ``thumbnail_uri is None`` no-thumbnail case — invariant
    # 18; preserves the prior fallback). D.W3 γ: typed field access.
    with _blob_not_found_as_404():
        if asset.thumbnail_uri is not None:
            path = resolve_blob(asset.thumbnail_uri)
            content_type = asset.thumbnail_content_type or "image/avif"
        else:
            path = resolve_blob(asset.storage_uri)
            content_type = asset.content_type
    return FileResponse(
        path,
        media_type=content_type,
        headers={"Cache-Control": read_gate.image_cache_control(public)},
    )


@router.get("/{imageSlug}/overlay")
async def get_image_overlay(imageSlug: str, request: Request, resize: int = 1024) -> StreamingResponse:
    """Serve the image resized to match contour extraction dimensions.

    The returned image is in the same pixel space that contour coordinates
    were extracted from, enabling pixel-perfect overlay alignment.
    """
    from PIL import Image as PILImage

    public = await _readable(request, imageSlug)
    asset = await get_image_asset(imageSlug)
    with _blob_not_found_as_404():
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
            "Cache-Control": read_gate.image_cache_control(public),
            "X-Image-Width": str(w),
            "X-Image-Height": str(h),
        },
    )


@router.post("/{imageSlug}/extract-contour")
async def extract_contour(imageSlug: str, req: ExtractContourRequest, request: Request) -> Any:
    await _readable(request, imageSlug)
    return contour_response(await extract_contour_doc(imageSlug, req.contour_settings))


async def extract_contour_doc(imageSlug: str, cs: ContourSettings) -> dict:
    """The image's contour document for ``cs``: the cached one, else extracted
    and stored (the caller has checked the image is readable)."""
    asset = await get_image_asset(imageSlug)
    db = get_db()
    # Recency rides the write verbs (X·F F-D5): extraction is a use of the image.
    await touch_document("images", {"image_slug": imageSlug})

    # Check extraction cache before running the expensive pipeline
    cache_key = extraction_cache_key(asset.sha256, cs)
    existing = await db.contours.find_one({"extraction_cache_key": cache_key})
    if existing:
        await touch_document("contours", {"_id": existing["_id"]})
        logger.info("extraction cache hit for %s (key=%s…)", imageSlug, cache_key[:12])
        return existing

    with _blob_not_found_as_404():
        tmp = image_tempfile(asset)
    try:
        # Inside an image job the drawing's four checkpoints move its bar
        # (``jobs.report`` is a no-op on the synchronous route).
        result = await computation.compute_contours(
            Path(tmp.name),
            cs.to_contour_config(),  # type: ignore[no-untyped-call]
            on_stage=lambda fraction: jobs.report("extract", fraction),
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
    path = computation.contour_path(complex_contours, cs.n_points)
    xs = path.real.tolist()
    ys = path.imag.tolist()

    return await store_contour_asset(
        xs, ys, imageSlug, source="extract", image_bounds=image_bounds,
        extraction_cache_key_value=cache_key,
    )


# The image job's bar, weighted by measured cost (giraffe.webp at the web's
# defaults, 2026-11-14: extract 5.0-5.6 s, epicycles 0.02 s, bases 0.6-0.7 s).
# Extraction reports its start, the drawing's four checkpoints and its end;
# the bases report per level.
IMAGE_JOB_STAGES: dict[str, tuple[float, float]] = {
    "extract": (0.0, 0.85),
    "epicycles": (0.85, 0.88),
    "bases": (0.88, 1.0),
}


@router.post("/{imageSlug}/jobs", status_code=202, response_model=JobCreated)
async def start_image_job(imageSlug: str, req: ImageJobRequest, request: Request) -> Any:
    """extract-contour, compute/epicycles and compute/bases as one job
    (TRIAGE-16 row 50): the stream carries a ``contour`` partial (the outline,
    drawable before any series), an ``epicycles`` partial, per-level ``bases``
    stages, and a ``result`` of ``{contour, epicycles, bases}``, each the shape
    its synchronous route returns."""
    await _readable(request, imageSlug)

    async def work(progress: jobs.Progress) -> dict:
        progress.stage("extract", 0.0)
        doc = await extract_contour_doc(imageSlug, req.contour_settings)
        contour = contour_response(doc).model_dump(mode="json")
        progress.stage("extract", 1.0)
        progress.partial("contour", contour)
        series = await series_work(doc["contour_hash"], req.epicycles, req.bases, progress)
        return {"contour": contour, **series}

    try:
        job = jobs.registry.start("image", IMAGE_JOB_STAGES, work, job_error)
    except jobs.TooManyJobs:
        return errors.rate_limited(5, detail="too many computations in progress")
    return created(job)
