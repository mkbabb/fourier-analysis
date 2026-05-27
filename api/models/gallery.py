"""Gallery and audit Pydantic models.

**Carve note (fourier-B.W3.4).** The gallery's identity-bearing scheme is
retired in favour of the converged ``visualization`` entity
(``api/models/visualization.py``). The user-facing handle is now the
``visualization.slug``, not the 64-char ``snapshot_hash``; the required
non-null owner is ``visualization.owner_slug``, not the nullable
``user_slug`` orphan path. What survives here is the *admin-curation* tier
vocabulary (``GalleryTier`` / ``SetTierRequest`` — §7, orthogonal to the
user-controlled ``visibility``) and the presentational response/stats
shapes the legacy gallery + admin routers still render while the
``visualizations`` collection is the rollback substrate's destination
(legacy collections survive until the W5 close ceremony). New writes go
through ``POST /visualizations``; ``snapshot_hash`` / nullable ``user_slug``
below are read-side legacy fields, not identity.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Type aliases — admin-curation tier vocabulary (CRUD-CONTRACT §7), NOT the
# user-controlled ``visibility`` enum (which lives on ``Visualization``).
# ---------------------------------------------------------------------------

GalleryTier = Literal["featured", "saved", "normal"]

# ---------------------------------------------------------------------------
# Response models (presentational; legacy read-side)
# ---------------------------------------------------------------------------


class GalleryEntryResponse(BaseModel):
    # Legacy read-side fields. ``snapshot_hash`` is a retired user-facing
    # identity (carved per W3.4); ``user_slug`` is the nullable orphan owner
    # the converged entity forbids (``owner_slug`` is required non-null).
    snapshot_hash: str
    image_slug: str
    contour_hash: str
    user_slug: str | None = None
    tier: GalleryTier = "normal"
    views: int = 0
    likes: int = 0
    active_bases: list[str] = Field(default_factory=list)
    n_harmonics: int = 0
    created_at: datetime
    updated_at: datetime


class AdminStatsResponse(BaseModel):
    total_entries: int
    featured: int
    saved: int
    normal: int
    total_views: int
    total_likes: int
    storage_bytes: int


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class PublishRequest(BaseModel):
    snapshot_hash: str
    image_slug: str


class SetTierRequest(BaseModel):
    tier: GalleryTier


class UpdateEntryRequest(BaseModel):
    image_slug: str | None = None
