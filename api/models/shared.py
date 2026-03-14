"""Shared settings models used by both session and asset documents."""

from __future__ import annotations

from pydantic import BaseModel, field_validator


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
        return max(0.0, min(1.0, float(v)))

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
