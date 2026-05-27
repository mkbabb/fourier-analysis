"""The converged ``visualization`` entity (fourier-B.W3).

One Pydantic model collapses fourier's five-scheme identity state (human
slug, content hash, uuid4 token, ObjectId, IndexedDB key) onto a single
``visualizations`` collection with one human-readable slug, a required
non-null owner, a 3-state ``visibility`` enum, and soft-delete by
``deleted_at`` (CRUD-CONTRACT §1–§5; SCHEMA.md §3).

The shape mirrors ``coordination/SCHEMA.md``'s canonical ``Visualization``
schema. Representation may diverge per-repo (Pydantic vs TypeScript);
*shape* may not.

Datetime discipline (H-W3-1(a)): ``created_at`` / ``updated_at`` /
``deleted_at`` are tz-aware ``datetime`` values (UTC). The legacy
``snapshots.created_at`` was naive; the W3 migration coerces. Indexes
and queries assume aware datetimes throughout.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from api.lib.crud.softdelete import SoftDeleteMixin
from api.models.shared import AnimationSettings, ContourSettings

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------

Visibility = Literal["draft", "unlisted", "public"]

# ---------------------------------------------------------------------------
# Embedded animation state (SCHEMA.md §8 ``AnimationData`` body)
# ---------------------------------------------------------------------------


class Point2D(BaseModel):
    """A single ``{x, y}`` partial-sum coordinate (SCHEMA.md §8)."""

    x: float
    y: float

    model_config = ConfigDict(extra="forbid")


class AnimationData(BaseModel):
    """Precomputed partial-sum trajectories the renderer consumes per rAF.

    ``partial_sums`` keys are stringified ints — the JSON-serialisation form
    (JSON object keys are always strings; the underlying domain is the basis
    level ordinal ∈ ℕ). The consumer-side ``BasisCanvas.vue`` drops its
    ``(sumsForBasis as any)?.[level]`` cast in favour of typed bracket access
    over ``Record<string, {x, y}>`` (the W2/W4 wave lands the cast removal).
    """

    active_bases: list[str] = Field(default_factory=list)
    n_harmonics: int = Field(default=1, ge=1, le=256)
    partial_sums: dict[str, Point2D] = Field(default_factory=dict)

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Provenance marker (W3.19 / H-W3-1(c) / H-W3-2)
# ---------------------------------------------------------------------------


class MigratedFrom(BaseModel):
    """Idempotency + recoverable-provenance marker for migrated rows.

    ``coll`` names the source collection; ``id`` is its ``_id`` (stringified).
    ``was_public`` distinguishes a once-public "zombie orphan" (a gallery row
    deleted out from under its surviving snapshot via the janitor cascade)
    from a never-published draft — preserving recoverable provenance per
    H-W3-2. Written atomically with the payload in one ``$set`` (H-W3-1(c)).
    """

    coll: Literal["gallery", "snapshots"]
    id: str
    was_public: bool = False

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# The persisted entity (SCHEMA.md §3 ``Visualization``)
# ---------------------------------------------------------------------------


class Visualization(SoftDeleteMixin):
    """A saved Fourier-analysis result. One row per user-named noun.

    The ``slug`` is the public handle; ``content_hash`` is a dedup / ETag
    substrate, never identity (CRUD-CONTRACT §1). ``owner_slug`` is required
    and non-null (invariant 14 / §3). ``deleted_at`` (inherited from
    ``SoftDeleteMixin``) is ``None`` for live rows.
    """

    slug: str
    owner_slug: str  # required, non-null (CRUD-CONTRACT §3)
    visibility: Visibility = "draft"
    content_hash: str
    image_slug: str
    contour_hash: str

    active_bases: list[str] = Field(default_factory=list)
    n_harmonics: int = Field(default=1, ge=1, le=4096)

    contour_settings: ContourSettings = Field(default_factory=ContourSettings)
    animation_settings: AnimationSettings = Field(default_factory=AnimationSettings)
    animation_data: AnimationData | None = None

    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list)
    palette_slug: str | None = None

    views: int = 0
    likes: int = 0
    # Admin-set sticky flag. The janitor's bounded prune skips pinned docs
    # (CRUD-CONTRACT §8); never set by end users.
    pinned: bool = False

    # Approximate persisted byte-size of the referenced blobs (the per-doc
    # honesty field that survives the ``storage_budget_gb`` band-aid
    # retirement per H-W3-5 — kept for observability, not eviction).
    bytes: int = 0

    # Idempotency + provenance marker for migrated rows (W3.19); ``None`` for
    # rows created natively through ``POST /visualizations``.
    migrated_from: MigratedFrom | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Request shapes (SCHEMA.md §3 ``VisualizationCreate`` / ``VisualizationUpdate``)
# ---------------------------------------------------------------------------


class VisualizationCreate(BaseModel):
    """POST body. Server generates the slug if absent and recomputes the
    content hash; ``owner_slug`` is sourced from the session, never the body.
    """

    slug: str | None = None
    visibility: Visibility = "draft"
    image_slug: str
    contour_hash: str
    active_bases: list[str] = Field(min_length=1, max_length=16)
    n_harmonics: int = Field(ge=1, le=4096)
    contour_settings: ContourSettings | None = None
    animation_settings: AnimationSettings | None = None
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=10)
    palette_slug: str | None = None

    model_config = ConfigDict(extra="forbid")


class VisualizationUpdate(BaseModel):
    """PATCH body. Partial; ``slug`` is immutable and ``content_hash`` is
    recomputed server-side (so neither appears here).
    """

    visibility: Visibility | None = None
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] | None = Field(default=None, max_length=10)
    palette_slug: str | None = None

    model_config = ConfigDict(extra="forbid")
