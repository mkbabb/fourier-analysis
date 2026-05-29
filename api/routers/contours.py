"""Contour asset and compute endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.dependencies import get_contour
from api.models.assets import SaveContourRequest
from api.models.computation import (
    ComputeBasesRequest,
    ComputeEpicyclesRequest,
    ComputeResult,
)
from api.responses import contour_points, contour_response
from api.services import computation, compute_cache
from api.services.image_storage import store_contour_asset
from api.services.rate_limiter import require_compute_limit

router = APIRouter(prefix="/api/contours", tags=["contours"])


@router.post("")
async def save_contour(req: SaveContourRequest):
    xs = req.points.get("x", [])
    ys = req.points.get("y", [])
    doc = await store_contour_asset(xs, ys, req.image_slug, source="editor")
    return contour_response(doc)


@router.get("/{contourHash}")
async def get_contour_endpoint(contourHash: str):
    doc = await get_contour(contourHash)
    return contour_response(doc)


@router.post("/{contourHash}/compute/epicycles", response_model=ComputeResult, dependencies=[Depends(require_compute_limit)])
async def compute_epicycles(contourHash: str, req: ComputeEpicyclesRequest):
    # E.W7 T-P3 — content-addressable compute cache. Hit returns immediately
    # without the FFT chain. Fail-open: cache errors fall through to compute.
    cached = await compute_cache.lookup(
        contourHash, req.n_harmonics, req.n_points
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
    await compute_cache.store(contourHash, req.n_harmonics, req.n_points, data)
    return ComputeResult(data=data)


@router.post("/{contourHash}/compute/bases", response_model=ComputeResult, dependencies=[Depends(require_compute_limit)])
async def compute_bases(contourHash: str, req: ComputeBasesRequest):
    doc = await get_contour(contourHash)
    xs, ys = contour_points(doc)
    data = await computation.compute_bases(
        xs, ys,
        max_degree=req.max_degree,
        n_points=req.n_points,
        levels=req.levels,
        n_eval=req.n_eval,
    )
    return ComputeResult(data=data)
