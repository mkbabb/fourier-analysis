"""Asset-based models for images, contours, and snapshots."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Settings (moved from session.py)
# ---------------------------------------------------------------------------


class ContourSettings(BaseModel):
    strategy: str = "auto"
    resize: int = 512
    blur_sigma: float = 2.0
    n_harmonics: int = 50
    n_points: int = 1024
    n_classes: int = 3
    min_contour_length: int = 40
    min_contour_area: float = 0.01
    max_contours: int | None = 5
    smooth_contours: float = 0.1

    @field_validator("blur_sigma", mode="before")
    @classmethod
    def _clamp_blur(cls, v: float) -> float:
        return max(0.0, float(v))

    @field_validator("min_contour_area", mode="before")
    @classmethod
    def _clamp_area(cls, v: float) -> float:
        return max(0.0, float(v))

    @field_validator("smooth_contours", mode="before")
    @classmethod
    def _clamp_smooth(cls, v: float) -> float:
        return max(0.0, min(1.0, float(v)))

    @field_validator("max_contours", mode="before")
    @classmethod
    def _clamp_max_contours(cls, v: int | None) -> int | None:
        if v is None or v == 0:
            return None
        return max(1, int(v))


class AnimationSettings(BaseModel):
    fps: int = 30
    duration: float = 30.0
    max_circles: int = 80
    easing: str = "sine"
    speed: float = 1.0
    active_bases: list[str] = ["fourier-epicycles"]


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


# ---------------------------------------------------------------------------
# Contour assets
# ---------------------------------------------------------------------------


class ContourAssetResponse(BaseModel):
    contour_hash: str
    image_slug: str | None = None
    source: str
    point_count: int
    bbox: dict
    preview_path: str = ""
    created_at: datetime
    last_accessed_at: datetime
    points: dict


# ---------------------------------------------------------------------------
# Snapshots
# ---------------------------------------------------------------------------


class SnapshotResponse(BaseModel):
    snapshot_hash: str
    image_slug: str
    contour_hash: str
    contour_settings: ContourSettings
    animation_settings: AnimationSettings
    created_at: datetime


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class ExtractContourRequest(BaseModel):
    contour_settings: ContourSettings = Field(default_factory=ContourSettings)


class SaveContourRequest(BaseModel):
    image_slug: str
    points: dict  # {"x": list[float], "y": list[float]}


class CreateSnapshotRequest(BaseModel):
    contour_hash: str
    contour_settings: ContourSettings = Field(default_factory=ContourSettings)
    animation_settings: AnimationSettings = Field(default_factory=AnimationSettings)
