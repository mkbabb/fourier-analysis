"""Gallery — surviving admin-curation vocabulary + response/stats shapes.

**Carve note (fourier-B.W3.4, hardened at fourier-D.W3 γ).** The identity-bearing
gallery scheme was retired in favour of the converged ``visualization`` entity
(``api/models/visualization.py``). What survives here is the admin-curation
*tier* vocabulary (``GalleryTier`` / ``SetTierRequest`` — CRUD-CONTRACT §7,
orthogonal to the user-controlled ``visibility``) and the presentational
``AdminStatsResponse`` shape. The dead response model and the dead publish
request (both carrying retired identity fields and zero live consumers) were
deleted at D.W3 along with the dead ``gallery`` collection boot indexes.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Type aliases — admin-curation tier vocabulary (CRUD-CONTRACT §7), NOT the
# user-controlled ``visibility`` enum (which lives on ``Visualization``).
# ---------------------------------------------------------------------------

GalleryTier = Literal["featured", "saved", "normal"]

# ---------------------------------------------------------------------------
# Response models (presentational)
# ---------------------------------------------------------------------------


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


class SetTierRequest(BaseModel):
    tier: GalleryTier


class UpdateEntryRequest(BaseModel):
    image_slug: str | None = None
