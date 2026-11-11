"""Wire models for bearer API tokens and the stateless /api/v1 routes."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from api.models.shared import ContourSettings
from api.services.api_tokens import DEFAULT_RATE_PER_MIN


class MintTokenRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    scopes: list[str] = Field(default_factory=lambda: ["spectrum"], min_length=1)
    rate_per_min: int = Field(default=DEFAULT_RATE_PER_MIN, ge=1, le=600)


class MintTokenResponse(BaseModel):
    id: str
    token: str


class TokenInfo(BaseModel):
    id: str
    name: str
    scopes: list[str]
    rate_per_min: int
    created_at: datetime
    last_used_at: datetime | None = None
    revoked_at: datetime | None = None


class TokenListResponse(BaseModel):
    tokens: list[TokenInfo]


class ImageSpectrumSettings(ContourSettings):
    """``ContourSettings`` for one image, bounded for a token caller."""

    n_harmonics: int = Field(default=200, ge=1, le=1000)
    n_points: int = Field(default=1024, ge=16, le=8192)


class Points(BaseModel):
    x: list[float] = Field(min_length=3, max_length=65536)
    y: list[float] = Field(min_length=3, max_length=65536)


class ContourSpectrumRequest(BaseModel):
    points: Points
    n_harmonics: int = Field(default=200, ge=1, le=1000)
    n_points: int = Field(default=1024, ge=16, le=8192)


class WireSpectrum(BaseModel):
    """The @mkbabb/fourier ``Spectrum``: ``c`` = [re0, im0, re+1, im+1, re-1, im-1, ...]."""

    c: list[float]
    n: int


class ContourSpectrumResponse(BaseModel):
    spectrum: WireSpectrum


class ImageSpectrumResponse(BaseModel):
    contour: dict[str, list[float]]
    spectrum: WireSpectrum
    image_bounds: dict[str, Any] | None = None
