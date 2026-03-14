"""MongoDB session document and related models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from api.models.shared import ContourSettings, AnimationSettings


class SessionCreate(BaseModel):
    pass


class SessionUpdate(BaseModel):
    parameters: ContourSettings | None = None
    animation_settings: AnimationSettings | None = None


class SessionResponse(BaseModel):
    slug: str
    created_at: datetime
    parameters: ContourSettings
    animation_settings: AnimationSettings
    has_image: bool = False
    has_results: bool = False
