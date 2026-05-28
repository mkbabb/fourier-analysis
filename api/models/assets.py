"""Asset-based models for images and contours.

The dead ``SnapshotResponse`` model (zero live consumers post-B.W3) was
deleted at fourier-D.W3 γ along with the dead ``snapshots`` boot indexes and
the dead ``gallery`` stratum.

The ``ImageAsset`` Pydantic model lifts the image-asset shape out of an
untyped ``dict``: the load-bearing fields ``image_storage.image_bytes`` /
``image_storage.image_tempfile`` / ``dependencies._backfill_image_bounds`` and
``routers/images.py`` read are declared + typed here. The class of bug C9
(``existing["blob"]`` ``KeyError`` swallowed by a broad ``except``) and C10
(the inclusion-mode projection starving the shim) is structurally foreclosed:
a projection that omits a required field becomes a Pydantic ``ValidationError``
at construction time, not a ``KeyError`` swallowed deeper in the call chain.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from api.models.shared import ContourSettings, AnimationSettings


# ---------------------------------------------------------------------------
# Image assets
# ---------------------------------------------------------------------------


class ImageAssetResponse(BaseModel):
    image_slug: str
    sha256: str
    original_name: str
    content_type: str
    bytes: int
    created_at: datetime
    last_accessed_at: datetime


class ImageAsset(BaseModel):
    """The image-asset document shape (the C.W5 post-cutover form).

    Every field a live consumer reads is declared + typed here. The class
    of bug C9 (existing["blob"] KeyError on a migrated doc, swallowed by a
    broad except) and C10 (the {"blob": 1} inclusion-mode projection
    starving the shim) is structurally foreclosed by the typed contract:
    a projection that omits a required field becomes a Pydantic validation
    error at construction time, not a KeyError swallowed deeper in the call
    chain.

    ``extra="ignore"`` — Mongo ``_id`` and other surplus fields pass through
    harmlessly; the validator binds only the fields the asset code reads,
    not the document's full shape.
    """

    model_config = ConfigDict(extra="ignore")

    image_slug: str
    sha256: str
    original_name: str = ""
    content_type: str
    bytes: int = 0
    storage_uri: str
    thumbnail_uri: str | None = None
    thumbnail_content_type: str | None = None
    created_at: datetime | None = None
    last_accessed_at: datetime | None = None
    pinned: bool = False


# ---------------------------------------------------------------------------
# Contour assets
# ---------------------------------------------------------------------------


class ContourAssetResponse(BaseModel):
    contour_hash: str
    image_slug: str | None = None
    source: str
    point_count: int
    bbox: dict[str, Any]
    image_bounds: dict[str, Any] | None = None
    preview_path: str = ""
    created_at: datetime
    last_accessed_at: datetime
    points: dict[str, Any]


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class ExtractContourRequest(BaseModel):
    contour_settings: ContourSettings = Field(default_factory=ContourSettings)


class SaveContourRequest(BaseModel):
    image_slug: str
    points: dict[str, Any]  # {"x": list[float], "y": list[float]}


class CreateSnapshotRequest(BaseModel):
    contour_hash: str
    contour_settings: ContourSettings = Field(default_factory=ContourSettings)
    animation_settings: AnimationSettings = Field(default_factory=AnimationSettings)
