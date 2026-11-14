"""Contour asset and compute endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from api.dependencies import get_contour, get_image_asset
from api.lib.crud import errors
from api.models.assets import SaveContourRequest, SeriesJobRequest
from api.models.computation import (
    ComputeBasesRequest,
    ComputeEpicyclesRequest,
    ComputeResult,
)
from api.responses import contour_points, contour_response
from api.routers.jobs import JobCreated, created, job_error
from api.services import computation, compute_cache, jobs
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


async def epicycles_data(contourHash: str, req: ComputeEpicyclesRequest) -> dict:
    """compute/epicycles' ``data`` (wire form), from the cache or computed."""
    # F.W2 T-β — content-addressable compute cache. Hit returns immediately
    # without the FFT chain. Fail-open: cache errors fall through to compute.
    params = {"n_harmonics": req.n_harmonics, "n_points": req.n_points}
    cached = await compute_cache.lookup(
        contourHash, params, label="compute_epicycles"
    )
    if cached is not None:
        return cached
    doc = await get_contour(contourHash)
    xs, ys = contour_points(doc)
    data = await computation.compute_epicycles(
        xs, ys,
        n_harmonics=req.n_harmonics,
        n_points=req.n_points,
    )
    return await compute_cache.store(contourHash, params, data, label="compute_epicycles")


async def bases_data(contourHash: str, req: ComputeBasesRequest) -> dict:
    """compute/bases' ``data`` (wire form), from the cache or computed."""
    # F.W2 T-β — same content-addressable cache as epicycles (was unwired).
    params = {
        "max_degree": req.max_degree,
        "n_points": req.n_points,
        "levels": req.levels,
        "n_eval": req.n_eval,
    }
    cached = await compute_cache.lookup(contourHash, params, label="compute_bases")
    if cached is not None:
        return cached
    doc = await get_contour(contourHash)
    xs, ys = contour_points(doc)
    data = await computation.compute_bases(
        xs, ys,
        max_degree=req.max_degree,
        n_points=req.n_points,
        levels=req.levels,
        n_eval=req.n_eval,
    )
    return await compute_cache.store(contourHash, params, data, label="compute_bases")


@router.post("/{contourHash}/compute/epicycles", response_model=ComputeResult)
async def compute_epicycles(contourHash: str, req: ComputeEpicyclesRequest):
    return ComputeResult(data=await epicycles_data(contourHash, req))


@router.post("/{contourHash}/compute/bases", response_model=ComputeResult)
async def compute_bases(contourHash: str, req: ComputeBasesRequest):
    return ComputeResult(data=await bases_data(contourHash, req))


async def series_work(
    contourHash: str,
    epicycles: ComputeEpicyclesRequest,
    bases: ComputeBasesRequest,
    progress: jobs.Progress,
) -> dict:
    """The series half of a contour or image job: an ``epicycles`` partial (the
    whole spectrum, which a client draws at a growing term count), then the
    bases, whose levels report as ``bases`` stages."""
    progress.stage("epicycles", 0.0)
    ep = await epicycles_data(contourHash, epicycles)
    progress.stage("epicycles", 1.0)
    progress.partial("epicycles", ep)
    progress.stage("bases", 0.0)
    bs = await bases_data(contourHash, bases)
    return {"epicycles": ep, "bases": bs}


# Weighted by measured cost (see images.IMAGE_JOB_STAGES).
CONTOUR_JOB_STAGES: dict[str, tuple[float, float]] = {
    "epicycles": (0.0, 0.05),
    "bases": (0.05, 1.0),
}


@router.post("/{contourHash}/jobs", status_code=202, response_model=JobCreated)
async def start_contour_job(contourHash: str, req: SeriesJobRequest) -> Any:
    """compute/epicycles and compute/bases as one job (an edited contour's
    recompute): ``result`` is ``{epicycles, bases}``, each compute's ``data``."""
    await get_contour(contourHash)

    async def work(progress: jobs.Progress) -> dict:
        return await series_work(contourHash, req.epicycles, req.bases, progress)

    try:
        job = jobs.registry.start("contour", CONTOUR_JOB_STAGES, work, job_error)
    except jobs.TooManyJobs:
        return errors.rate_limited(5, detail="too many computations in progress")
    return created(job)
