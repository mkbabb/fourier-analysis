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

from api.lib.crud.atomdiff import AtomOp
from api.lib.crud.softdelete import SoftDeleteMixin
from api.models.shared import AnimationSettings, ContourSettings

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------

Visibility = Literal["draft", "unlisted", "public"]

# The visibility transition guard (J.W1c §5.1). The contract (SCHEMA.md:334-336,
# CRUD-CONTRACT.md:526) forbids exactly one ordered pair — ``public → draft``
# (a de-publication must transit ``unlisted``); every other transition (incl.
# same-state no-ops) is legal. The publish/unpublish verbs + the PATCH-visibility
# path are the guard's first live callers (``errors.visibility_illegal_transition``
# was defined-but-never-called — the twice-struck dead-code chronic).
_FORBIDDEN_VISIBILITY_TRANSITIONS: frozenset[tuple[Visibility, Visibility]] = frozenset(
    {("public", "draft")}
)


def is_legal_visibility_transition(current: Visibility, target: Visibility) -> bool:
    """``False`` only for the contract-forbidden ``public → draft`` (J.W1c §5.1)."""
    return (current, target) not in _FORBIDDEN_VISIBILITY_TRANSITIONS

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

    # --- WAVE D: fork / version / provenance (J.W1-crud-remix §2.1) ---
    # The substrate fourier INHERITS from value.js's proven ``Palette`` shape.
    # ``set_hash`` is the atom-set identity (§1.3) — the version key at HEAD;
    # ``fork_count`` is the WRITE side ``cursors.py:21``'s ``most-forked`` sort
    # already READ (a phantom until now). ``fork_of`` is the single-parent
    # provenance pointer; chain math (``root_hash``/``depth``) lives on the
    # version document, not the live row (§9). Defaulted so legacy rows validate
    # before the additive backfill migration runs; native rows set them at write.
    set_hash: str = ""
    fork_of: str | None = None
    fork_of_hash: str | None = None
    fork_count: int = 0
    version_count: int = 1

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


# ---------------------------------------------------------------------------
# WAVE D — the version collection (the one genuinely-new persisted shape)
# ---------------------------------------------------------------------------


class VisualizationVersion(BaseModel):
    """An immutable snapshot of a viz's remix-atoms at one point on its
    single-parent provenance chain (J.W1-crud-remix §2.2).

    ``_id`` is the content-addressed compound ``f"{viz_slug}:{set_hash}"`` — a
    per-viz, content-addressed identity: a re-insert of the same (viz, atoms) is
    a no-op (the §11 idempotency property), and two *different* vizzes that share
    an atom-set (same defaults over different subjects) never collide (which a
    bare global ``_id = set_hash`` would — the §2.3-vs-§11 tension, resolved here
    toward the per-viz ``{viz_slug, depth}`` filter the read endpoints need).

    For a forked viz the root version's ``atom_diff`` carries the recorded
    source→child remix delta (``forked_from_hash`` = the source's HEAD
    ``set_hash`` at remix time); for an original it is empty. The diff is
    persisted (immutable) so it stays historically correct even if the source is
    later edited (J.W1-crud-remix §2.2 — the edge carries the atom-diff).
    """

    id: str = Field(alias="_id")  # f"{viz_slug}:{set_hash}"
    viz_slug: str
    set_hash: str  # the atom-set identity (§1.3); the version key within the viz
    author_slug: str

    # --- the atoms snapshot (subject-free remix config) ---
    active_bases: list[str]
    n_harmonics: int
    contour_settings: ContourSettings
    animation_settings: AnimationSettings
    palette_slug: str | None = None

    # --- single-parent linear provenance (value.js PaletteVersion shape) ---
    parent_hash: str | None = None  # set_hash of the immediate parent version (null = root)
    forked_from_hash: str | None = None  # source viz's HEAD set_hash at remix time (null = original)
    root_hash: str  # set_hash of the chain root
    depth: int = 0  # 0 at root, +1 per version

    # --- WAVE D: the diff-bearing edge (the recorded remix delta) ---
    atom_diff: list[AtomOp] = Field(default_factory=list)

    created_at: datetime

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


# ---------------------------------------------------------------------------
# WAVE D — the remix request body (J.W1-crud-remix §4.1)
# ---------------------------------------------------------------------------

# Sentinel for the ``palette_slug`` tri-state (F-08): a remix body may OMIT
# ``palette_slug`` (inherit the source's), send ``null`` (clear the binding), or
# send a slug (rebind). Pydantic cannot distinguish absent from explicit-null on
# a ``str | None`` field, so the handler reads ``model_fields_set`` instead.


class VisualizationRemix(BaseModel):
    """POST /{slug}/remix body — the changed atoms; absent atoms inherit the
    source HEAD. ``palette_slug`` is tri-state via ``model_fields_set`` (F-08).
    """

    slug: str | None = None  # child slug; server-generated if absent
    visibility: Visibility = "draft"  # a remix child is born private (§4)

    # Atom overrides — any subset; absent atoms inherit the source HEAD.
    active_bases: list[str] | None = Field(default=None, min_length=1, max_length=16)
    n_harmonics: int | None = Field(default=None, ge=1, le=4096)
    contour_settings: ContourSettings | None = None
    animation_settings: AnimationSettings | None = None
    palette_slug: str | None = None  # tri-state — read via model_fields_set

    # Editorial (rides the create, not the atom-diff).
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=10)

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# WAVE D — hand-typed response twins (inv-26; F-12; no codegen)
# ---------------------------------------------------------------------------


class DiffResponse(BaseModel):
    """The canonical ``/diff`` wire envelope (``docs/tranches/J/design/J-diff-shape.md``
    §3.2). Field NAMES + the op vocabulary are normative; the parity probe asserts
    THIS shape, not value.js's output. ``ops`` is always present (empty ⟺ identical).
    """

    from_hash: str
    to_hash: str
    ops: list[AtomOp]
    identical: bool

    model_config = ConfigDict(extra="forbid")


class ProvenanceNode(BaseModel):
    """One node on the within-viz version chain (J.W1-crud-remix §4.3)."""

    slug: str
    set_hash: str
    author_slug: str
    depth: int
    is_fork: bool
    created_at: datetime

    model_config = ConfigDict(extra="forbid")


class ForkCrumb(BaseModel):
    """One step on the cross-viz ``fork_of`` ancestry breadcrumb (F-03;
    "remixed from → … → original"). A distinct walk from the version chain.
    """

    slug: str
    set_hash: str
    author_slug: str
    fork_of: str | None = None
    created_at: datetime

    model_config = ConfigDict(extra="forbid")


class ProvenanceResponse(BaseModel):
    """``/provenance`` — the within-viz version ``chain`` PLUS the cross-viz
    ``fork_breadcrumb`` (the two distinct walks named in F-03).
    """

    chain: list[ProvenanceNode]
    fork_breadcrumb: list[ForkCrumb]

    model_config = ConfigDict(extra="forbid")


class VersionEntry(BaseModel):
    """One entry in the bounded ``/versions`` list (J.W1-crud-remix §4.5)."""

    set_hash: str
    depth: int
    author_slug: str
    atom_diff: list[AtomOp]
    created_at: datetime

    model_config = ConfigDict(extra="forbid")


class VersionsResponse(BaseModel):
    """``/versions`` — the viz's own ``depth``-ordered version chain, bounded
    ≤50, no cursor (F-11: the ``set_hash`` string ``_id`` breaks ``ObjectId``).
    """

    viz_slug: str
    versions: list[VersionEntry]

    model_config = ConfigDict(extra="forbid")
