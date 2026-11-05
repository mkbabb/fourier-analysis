"""Contour asset and compute endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.dependencies import get_contour, get_image_asset
from api.models.assets import SaveContourRequest
from api.models.computation import (
    ComputeBasesRequest,
    ComputeEpicyclesRequest,
    ComputeResult,
)
from api.responses import contour_points, contour_response
from api.services import computation, compute_cache
from api.models.shared import ContourSettings
from api.services.database import get_db
from api.services.image_storage import BlobNotFound, default_image_bounds, store_contour_asset

router = APIRouter(prefix="/api/contours", tags=["contours"])


@router.post("")
async def save_contour(req: SaveContourRequest):
    xs = req.points.get("x", [])
    ys = req.points.get("y", [])
    # X·F F-D7 (FW6-G14): the editor's bounds are written with it, on the POST
    # (a GET never backfills them): the edited contour's, else the image's at
    # the default extraction resize.
    if req.from_contour is not None:
        src = await get_db().contours.find_one({"contour_hash": req.from_contour}, {"image_bounds": 1})
        if src is None:
            raise HTTPException(status_code=404, detail="Source contour not found")
        image_bounds = src.get("image_bounds")
    else:
        image_bounds = None
    if image_bounds is None:
        try:
            image_bounds = default_image_bounds(await get_image_asset(req.image_slug), ContourSettings().resize)
        except BlobNotFound as exc:
            raise HTTPException(status_code=404, detail="Image blob not found") from exc
    doc = await store_contour_asset(xs, ys, req.image_slug, source="editor", image_bounds=image_bounds)
    return contour_response(doc)


@router.get("/{contourHash}")
async def get_contour_endpoint(contourHash: str):
    doc = await get_contour(contourHash)
    return contour_response(doc)


@router.post("/{contourHash}/compute/epicycles", response_model=ComputeResult)
async def compute_epicycles(contourHash: str, req: ComputeEpicyclesRequest):
    # F.W2 T-β — content-addressable compute cache. Hit returns immediately
    # without the FFT chain. Fail-open: cache errors fall through to compute.
    params = {"n_harmonics": req.n_harmonics, "n_points": req.n_points}
    cached = await compute_cache.lookup(
        contourHash, params, label="compute_epicycles"
    )
    if cached is not None:
        return ComputeResult(data=cached)
    doc = await get_contour(contourHash)
    xs, ys = contour_points(doc)
    data = await computation.compute_epicycles(
        xs, ys,
        n_harmonics=req.n_harmonics,
        n_points=req.n_points,
    )
    wire = await compute_cache.store(contourHash, params, data, label="compute_epicycles")
    return ComputeResult(data=wire)


@router.post("/{contourHash}/compute/bases", response_model=ComputeResult)
async def compute_bases(contourHash: str, req: ComputeBasesRequest):
    # F.W2 T-β — same content-addressable cache as epicycles (was unwired).
    params = {
        "max_degree": req.max_degree,
        "n_points": req.n_points,
        "levels": req.levels,
        "n_eval": req.n_eval,
    }
    cached = await compute_cache.lookup(contourHash, params, label="compute_bases")
    if cached is not None:
        return ComputeResult(data=cached)
    doc = await get_contour(contourHash)
    xs, ys = contour_points(doc)
    data = await computation.compute_bases(
        xs, ys,
        max_degree=req.max_degree,
        n_points=req.n_points,
        levels=req.levels,
        n_eval=req.n_eval,
    )
    wire = await compute_cache.store(contourHash, params, data, label="compute_bases")
    return ComputeResult(data=wire)
