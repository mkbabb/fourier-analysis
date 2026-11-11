"""``/api/v1``: two stateless spectrum routes for bearer API-token callers.

Nothing is stored: no image blob, no contour document, no session, no cache
row. The image is written to a temporary file for the contour pipeline and
unlinked when the job ends. The routes are for server and build-time callers
(a token in a browser bundle is a published token); CORS stays the env
allow-list. The response's ``spectrum`` is the @mkbabb/fourier ``Spectrum``.
"""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import APIRouter, Depends, Form, Request, UploadFile
from pydantic import ValidationError

from api.config import settings
from api.dependencies import token_required
from api.lib.crud import errors
from api.models.tokens import (
    ContourSpectrumRequest,
    ContourSpectrumResponse,
    ImageSpectrumResponse,
    ImageSpectrumSettings,
)
from api.routers.images import _valid_image_magic
from api.services import computation

router = APIRouter(prefix="/api/v1", tags=["v1"])
spectrum_scope = Depends(token_required("spectrum"))


@router.post("/spectrum/contour", response_model=ContourSpectrumResponse)
async def spectrum_of_contour(req: ContourSpectrumRequest, _token: str = spectrum_scope) -> Any:
    xs, ys = req.points.x, req.points.y
    if len(xs) != len(ys):
        return errors.validation_failed(detail="points.x and points.y differ in length")

    def _run() -> dict[str, Any]:
        path, chain = computation.spectrum_of_contours(
            [np.array(xs) + 1j * np.array(ys)], req.n_points, req.n_harmonics
        )
        return {"spectrum": computation.wire_spectrum(chain, req.n_harmonics, path)}

    return await computation.submit_compute_job("v1-contour", _run)


@router.post("/spectrum/image", response_model=ImageSpectrumResponse)
async def spectrum_of_image(
    request: Request,
    image: UploadFile,
    settings_json: str = Form("{}", alias="settings"),
    _token: str = spectrum_scope,
) -> Any:
    try:
        cs = ImageSpectrumSettings.model_validate(json.loads(settings_json or "{}"))
    except (ValueError, ValidationError) as exc:
        return errors.validation_failed(detail=str(exc)[:500], instance=request.url.path)

    content = await image.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        return errors.payload_too_large(detail=f"max {settings.max_upload_mb}MB")
    if not _valid_image_magic(content):
        return errors.problem(
            "urn:contract:image-invalid", 400, "Not a supported image", instance=request.url.path
        )

    tmp = tempfile.NamedTemporaryFile(delete=False)
    try:
        tmp.write(content)
        tmp.close()
        result = await computation.compute_contours(Path(tmp.name), cs.to_contour_config())
    finally:
        os.unlink(tmp.name)

    contours = result.get("contours", [])
    if not contours:
        return errors.problem(
            "urn:contract:no-contours", 422, "No contours extracted",
            detail="try a lower min_contour_area or another strategy", instance=request.url.path,
        )

    def _run() -> dict[str, Any]:
        path, chain = computation.spectrum_of_contours(
            [np.array(c["x"]) + 1j * np.array(c["y"]) for c in contours], cs.n_points, cs.n_harmonics
        )
        return {
            "contour": {"x": path.real.tolist(), "y": path.imag.tolist()},
            "spectrum": computation.wire_spectrum(chain, cs.n_harmonics, path),
            "image_bounds": result.get("image_bounds"),
        }

    return await computation.submit_compute_job("v1-image", _run)
