"""The converged ``visualization`` CRUD surface (fourier-B.W3.a).

Six slug-addressed endpoints over the single ``visualizations`` collection,
replacing the retired ``snapshots`` router and the gallery identity scheme
(CRUD-CONTRACT §1–§5). The router *composes* the ``api.lib.crud`` helpers
explicitly — there is no ``BaseCRUDRouter`` lifecycle inversion (the Wχ.P1
framework-in-disguise certification):

- ``POST   /visualizations``          — create (idempotency + slug retry + owner from session)
- ``GET    /visualizations/{slug}``   — read by slug (visibility-aware, soft-delete filtered)
- ``GET    /visualizations``          — list (cursor pagination, ``public`` / ``owner=me`` filters)
- ``PATCH  /visualizations/{slug}``   — partial update (``If-Match`` ETag + owner check)
- ``DELETE /visualizations/{slug}``   — soft-delete (``If-Match`` ETag + owner check)
- ``POST   /visualizations/{slug}/restore`` — restore from soft-delete within grace

Every non-2xx response is an RFC 9457 ``application/problem+json`` body built
by ``errors.problem`` / its catalog partials. Mutations are ownership-bound
(CRUD-CONTRACT §3): a valid session plus ``doc.owner_slug == user_slug``.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from typing import Annotated, Any, get_args

from fastapi import APIRouter, Query, Request, Response
from pymongo.errors import DuplicateKeyError

from api.dependencies import (
    get_client_ip,
    resolve_session,
    validate_image_slug,
)
from api.lib.crud import atomdiff, cursors, errors, etag, idempotency, slugs, softdelete
from api.lib.crud.canonical_digest import canonical_digest
from api.models.gallery import GalleryTier
from api.lib.crud.atomdiff import ATOM_KEY_ORDER
from api.models.visualization import (
    PATCH_METADATA_FIELDS,
    AtomOp,
    DiffResponse,
    ForkCrumb,
    ProvenanceNode,
    ProvenanceResponse,
    VersionEntry,
    VersionsResponse,
    Visualization,
    VisualizationCreate,
    VisualizationLike,
    VisualizationRemix,
    VisualizationUpdate,
    VisualizationVersion,
    UnavailableCrumb,
    is_legal_visibility_transition,
)
from api.services import read_gate
from api.services.database import get_db, touch_document
from api.services.rate_limiter import hash_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/visualizations", tags=["visualizations"])

# A single process-local idempotency store, bound to the active database lazily
# (the Mongo client is created at app startup; ``get_db()`` is valid by the
# time any request lands). The 24h replay map rides the ``idempotency``
# collection with its own TTL index.
_idem_store: idempotency.IdempotencyStore | None = None


def _store() -> idempotency.IdempotencyStore:
    global _idem_store
    if _idem_store is None:
        _idem_store = idempotency.IdempotencyStore(get_db())
    return _idem_store


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _public_doc(doc: dict) -> dict:
    """Strip non-user-facing internals (``_id`` per CRUD-CONTRACT §1 C1.3)."""
    return {k: v for k, v in doc.items() if k not in ("_id", "liked_ips")}


def _content_hash(*, image_slug: str, contour_hash: str, active_bases: list[str], n_harmonics: int) -> str:
    """sha256 over the content-defining (subject+config) projection (§1).

    The one ``canonical_digest`` primitive over the subject projection (§12);
    byte-identical to the prior ad-hoc ``json.dumps(...).sha256`` — the dedup /
    ETag substrate is preserved across the transposition.
    """
    return canonical_digest(
        {
            "image_slug": image_slug,
            "contour_hash": contour_hash,
            "active_bases": sorted(active_bases),
            "n_harmonics": n_harmonics,
        }
    )


def _compute_content_hash(payload: VisualizationCreate) -> str:
    """sha256 over the content-defining fields (dedup / ETag substrate, §1)."""
    return _content_hash(
        image_slug=payload.image_slug,
        contour_hash=payload.contour_hash,
        active_bases=payload.active_bases,
        n_harmonics=payload.n_harmonics,
    )


async def _write_version(
    db,
    *,
    viz_slug: str,
    author_slug: str,
    atoms: dict,
    set_hash_value: str,
    parent: dict | None,
    fork_of_hash: str | None,
    atom_ops: list[AtomOp],
    now: datetime,
) -> None:
    """Insert one ``VisualizationVersion`` — the ONE version writer (X·F F-D4).

    Create, remix and an atom-changing PATCH all write through here, so the
    chain quadruple (``parent_hash``, ``forked_from_hash``, ``root_hash``,
    ``depth``) carries what it says. ``parent`` is the HEAD version document:
    ``None`` writes a chain root (depth 0, its own root); a parent writes one
    deeper, ``parent_hash`` = the parent's ``set_hash`` and ``root_hash`` its
    root's. ``fork_of_hash`` is the source HEAD at remix time (a root only).

    The ``_id`` (``f"{viz_slug}:{set_hash}"``) is content-addressed, so a
    re-insert of the same (viz, atoms) is an idempotent no-op (the §11 crash-safe
    property). ``atom_ops`` is the recorded delta from the parent (from the
    remix source for a fork root; empty for an original).
    """
    version = VisualizationVersion(
        _id=f"{viz_slug}:{set_hash_value}",
        viz_slug=viz_slug,
        set_hash=set_hash_value,
        author_slug=author_slug,
        active_bases=atoms["active_bases"],
        n_harmonics=atoms["n_harmonics"],
        contour_settings=atoms["contour_settings"],
        animation_settings=atoms["animation_settings"],
        palette_slug=atoms.get("palette_slug"),  # absent (null binding) → None
        parent_hash=parent["set_hash"] if parent else None,
        forked_from_hash=fork_of_hash,
        root_hash=parent["root_hash"] if parent else set_hash_value,
        depth=parent["depth"] + 1 if parent else 0,
        atom_diff=atom_ops,
        created_at=now,
    )
    try:
        await db.visualization_versions.insert_one(version.model_dump(by_alias=True))
    except DuplicateKeyError:
        pass  # content-addressed → re-insert is an idempotent no-op (§11)


async def _scope_for(request: Request) -> str:
    """Idempotency scope: the user_slug if a session resolves, else the IP hash."""
    user_slug = await resolve_session(request)
    if user_slug:
        return f"user:{user_slug}"
    return f"ip:{hash_ip(get_client_ip(request))}"


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("")
async def create_visualization(body: VisualizationCreate, request: Request) -> Response:
    """Publish a new visualization. Anonymous publish is forbidden (§3 → 401)."""
    # Rate limiting (write budget) is enforced once, in RateLimitHeaderMiddleware.
    # Ownership: a publish without a resolvable session is a 401, never a
    # ``owner_slug: None`` orphan row (CRUD-CONTRACT §3; retires gallery.py:188).
    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to publish.")

    db = get_db()
    validate_image_slug(body.image_slug)

    # The image blob is a stable FK (W3.21); the contour-hash must resolve.
    if await db.images.find_one({"image_slug": body.image_slug, "deleted_at": None}, {"_id": 1}) is None:
        return errors.not_found(detail=f"image {body.image_slug!r} does not resolve")
    if await db.contours.find_one({"contour_hash": body.contour_hash}, {"_id": 1}) is None:
        return errors.not_found(detail=f"contour {body.contour_hash!r} does not resolve")

    content_hash = _compute_content_hash(body)
    now = datetime.now(UTC)

    async def _handler() -> Response:
        async def _insert(candidate: str) -> None:
            # Only forward the optional embedded settings when present so the
            # model's ``default_factory`` supplies the canonical defaults.
            optional: dict = {}
            if body.contour_settings is not None:
                optional["contour_settings"] = body.contour_settings
            if body.animation_settings is not None:
                optional["animation_settings"] = body.animation_settings
            viz = Visualization(
                slug=candidate,
                owner_slug=owner_slug,
                visibility=body.visibility,
                content_hash=content_hash,
                image_slug=body.image_slug,
                contour_hash=body.contour_hash,
                active_bases=body.active_bases,
                n_harmonics=body.n_harmonics,
                title=body.title,
                description=body.description,
                tags=body.tags,
                palette_slug=body.palette_slug,
                created_at=now,
                updated_at=now,
                **optional,
            )
            insert_doc = viz.model_dump()
            # WAVE D: stamp the atom-set identity (§1.3) + seed the chain's root
            # version. A native row is born an original (fork_of=None, fork_count=0).
            atoms = atomdiff.enumerate_atoms(insert_doc)
            set_hash_value = atomdiff.set_hash(atoms)
            insert_doc["set_hash"] = set_hash_value
            insert_doc["last_accessed_at"] = now
            await db.visualizations.insert_one(insert_doc)
            await _write_version(
                db, viz_slug=candidate, author_slug=owner_slug, atoms=atoms,
                set_hash_value=set_hash_value, parent=None, fork_of_hash=None,
                atom_ops=[], now=now,
            )

        slug = await slugs.slug_with_retry(_insert)
        # Recency rides the write verbs (X·F F-D5): the subject the new row
        # references is in use now.
        await touch_document("images", {"image_slug": body.image_slug})
        await touch_document("contours", {"contour_hash": body.contour_hash})
        saved = await db.visualizations.find_one({"slug": slug})
        response = Response(
            content=json.dumps(_public_doc(saved), default=str),
            status_code=201,
            media_type="application/json",
        )
        etag.set_etag_header(response, saved)
        response.headers["Location"] = f"/api/visualizations/{slug}"
        return response

    return await idempotency.replay_or_record(request, _store(), f"user:{owner_slug}", _handler)


# ---------------------------------------------------------------------------
# Read (single)
# ---------------------------------------------------------------------------


@router.get("/{slug}")
async def get_visualization(slug: str, request: Request, response: Response) -> Response:
    """Read a single visualization by slug.

    ``draft`` rows are visible to the owner only (non-owners get 404, not 403 —
    refuses to confirm existence, §4). Soft-deleted rows read 404 to anonymous
    callers and to non-owners.
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    db = get_db()
    viewer = await resolve_session(request)
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")
    is_owner = viewer is not None and viewer == doc.get("owner_slug")
    # The owner still reads their soft-deleted row (the restore surface); every
    # other read is the one gate. X·F F-D5: a read never writes — the view
    # count and recency ride POST /{slug}/view (below).
    if not (is_owner and doc.get("deleted_at") is not None):
        if await _readable_or_none(db, slug, viewer) is None:
            return errors.not_found(detail=f"no visualization {slug!r}")

    body = _public_doc(doc)
    out = Response(
        content=json.dumps(body, default=str),
        status_code=200,
        media_type="application/json",
    )
    etag.set_etag_header(out, doc)
    return out


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("")
async def list_visualizations(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="newest"),
    cursor: str = Query(default=""),
    owner: str = Query(default=""),
    # ``Annotated`` so the Python defaults hold for direct calls, too.
    q: Annotated[str, Query(max_length=200)] = "",
    tier: Annotated[str, Query()] = "all",
    basis: Annotated[str, Query(max_length=64)] = "",
) -> Response:
    """List visualizations with cursor pagination (CRUD-CONTRACT §0 SOTA-1, §4).

    Anonymous / default: only ``visibility=public`` live rows. ``?owner=me``
    (with a session) returns the caller's rows in all three visibility states.

    Narrowing (UIA-F-39), each optional and ANDed: ``q`` — a case-insensitive
    substring of the title, description or a tag; ``tier`` — ``featured`` /
    ``saved`` / ``normal`` (a row never tiered is ``normal``) or ``all``;
    ``basis`` — a member of ``active_bases``.
    """
    if sort not in cursors.SORT_KEYS:
        return errors.cursor_invalid(detail=f"unknown sort {sort!r}")
    if tier != "all" and tier not in get_args(GalleryTier):
        return errors.validation_failed(detail=f"unknown tier {tier!r}")

    db = get_db()

    base_query: dict = softdelete.not_deleted_filter()
    if owner == "me":
        viewer = await resolve_session(request)
        if not viewer:
            return errors.session_invalid(detail="?owner=me requires a session")
        base_query["owner_slug"] = viewer
    else:
        base_query["visibility"] = "public"

    # ``paginate`` owns the top-level ``$or`` (its keyset clause), so the
    # narrowing filters ride one ``$and``.
    narrow: list[dict[str, Any]] = []
    if q:
        needle = {"$regex": re.escape(q), "$options": "i"}
        narrow.append({"$or": [{"title": needle}, {"description": needle}, {"tags": needle}]})
    if tier != "all":
        narrow.append({"tier": {"$in": [tier, None]} if tier == "normal" else tier})
    if basis:
        narrow.append({"active_bases": basis})
    if narrow:
        base_query["$and"] = narrow

    cursor_payload = cursors.decode_cursor(cursor or None)
    query, sort_spec = cursors.paginate(base_query, cursor_payload, sort_key=sort)

    docs = (
        await db.visualizations.find(query, {"liked_ips": 0})
        .sort(sort_spec)
        .limit(limit + 1)
        .to_list(limit + 1)
    )

    has_more = len(docs) > limit
    if has_more:
        docs = docs[:limit]

    next_cursor = (
        cursors.next_cursor_from_last(docs[-1], sort_key=sort) if has_more and docs else None
    )

    body = {
        "items": [_public_doc(d) for d in docs],
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
    out = Response(
        content=json.dumps(body, default=str), status_code=200, media_type="application/json"
    )
    if next_cursor:
        out.headers["Link"] = f'</api/visualizations?cursor={next_cursor}>; rel="next"'
    return out


# ---------------------------------------------------------------------------
# Update (partial)
# ---------------------------------------------------------------------------


@router.patch("/{slug}")
async def update_visualization(slug: str, body: VisualizationUpdate, request: Request) -> Response:
    """Owner-bound partial update guarded by an ``If-Match`` ETag (§3, §0 SOTA-2)."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to update.")

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None or doc.get("deleted_at") is not None:
        return errors.not_found(detail=f"no live visualization {slug!r}")
    if doc.get("owner_slug") != owner_slug:
        return errors.not_owner(detail="you do not own this visualization")

    # Optimistic concurrency: the If-Match header must equal the current ETag.
    await etag.require_if_match(request, etag.compute_etag(doc))

    # The visibility transition guard's first live REJECTION path (J.W1c §5.1):
    # an arbitrary PATCH that drops a public row straight to draft is forbidden
    # (the contract requires transiting `unlisted`; de-publish via the verb).
    if body.visibility is not None and not is_legal_visibility_transition(
        doc.get("visibility"), body.visibility
    ):
        return errors.visibility_illegal_transition(
            detail=f"{doc.get('visibility')!r} → {body.visibility!r} is forbidden; "
            "de-publish via `unlisted` (POST /unpublish) first"
        )

    # X·F F-D4: metadata is a plain $set (non-null values); atoms are the remix
    # idiom over the HEAD (omitted inherits, a value rebinds, null clears the
    # one nullable atom) and a changed atom set is a new version.
    now = datetime.now(UTC)
    sent = body.model_fields_set
    updates: dict[str, Any] = {
        k: getattr(body, k) for k in PATCH_METADATA_FIELDS & sent if getattr(body, k) is not None
    }
    unset: dict[str, str] = {}

    head_atoms = atomdiff.enumerate_atoms(doc)
    child_atoms = _apply_atom_overrides(head_atoms, body)
    atom_ops = atomdiff.diff_atoms(head_atoms, child_atoms)
    if atom_ops:
        head_hash = _head_set_hash(doc)
        child_hash = atomdiff.set_hash(child_atoms)
        head_version = await _head_version(db, doc, head_hash, now)
        # Ordered and content-addressed like the remix (§11; the compose stack
        # is a standalone mongod, so no transaction): the version first (an
        # idempotent insert), then the row moves to it only if no other writer
        # moved the HEAD since this read (the set_hash compare below).
        await _write_version(
            db, viz_slug=slug, author_slug=owner_slug, atoms=child_atoms,
            set_hash_value=child_hash, parent=head_version, fork_of_hash=None,
            atom_ops=atom_ops, now=now,
        )
        for key in ATOM_KEY_ORDER:
            if key in child_atoms:
                updates[key] = child_atoms[key]
            elif key in doc:
                unset[key] = ""
        updates["set_hash"] = child_hash
        updates["content_hash"] = _content_hash(
            image_slug=doc["image_slug"], contour_hash=doc["contour_hash"],
            active_bases=child_atoms["active_bases"], n_harmonics=child_atoms["n_harmonics"],
        )
        if {"active_bases", "n_harmonics"} & {op.atom_key for op in atom_ops}:
            updates["animation_data"] = None  # the partial sums are of the old atoms (F-04)

    updates["updated_at"] = now
    change: dict[str, Any] = {"$set": updates}
    if unset:
        change["$unset"] = unset
    if atom_ops:
        change["$inc"] = {"version_count": 1}
        moved = await db.visualizations.update_one(
            {"slug": slug, "set_hash": doc.get("set_hash")}, change
        )
        if moved.matched_count == 0:
            return errors.etag_mismatch(detail="the visualization changed during this update; re-read and retry")
    else:
        await db.visualizations.update_one({"slug": slug}, change)

    updated = await db.visualizations.find_one({"slug": slug})
    out = Response(
        content=json.dumps(_public_doc(updated), default=str),
        status_code=200,
        media_type="application/json",
    )
    etag.set_etag_header(out, updated)
    return out


# ---------------------------------------------------------------------------
# Delete (soft)
# ---------------------------------------------------------------------------


@router.delete("/{slug}")
async def delete_visualization(slug: str, request: Request) -> Response:
    """Owner-bound soft-delete guarded by an ``If-Match`` ETag (§5)."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to delete.")

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None or doc.get("deleted_at") is not None:
        return errors.not_found(detail=f"no live visualization {slug!r}")
    if doc.get("owner_slug") != owner_slug:
        return errors.not_owner(detail="you do not own this visualization")

    await etag.require_if_match(request, etag.compute_etag(doc))

    deleted = await softdelete.soft_delete(db.visualizations, slug, owner_slug=owner_slug)
    if not deleted:
        return errors.not_found(detail=f"no live visualization {slug!r}")
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------


@router.post("/{slug}/restore")
async def restore_visualization(slug: str, request: Request) -> Response:
    """Restore a soft-deleted visualization within the grace window (§5)."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to restore.")

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug}, {"owner_slug": 1})
    if doc is not None and doc.get("owner_slug") != owner_slug:
        return errors.not_owner(detail="you do not own this visualization")

    result = await softdelete.restore(db.visualizations, slug, owner_slug=owner_slug)
    if result == "not_found":
        return errors.not_found(detail=f"no visualization {slug!r}")
    if result == "expired":
        return errors.soft_deleted(detail="grace window elapsed; the row is gone")

    restored = await db.visualizations.find_one({"slug": slug})
    out = Response(
        content=json.dumps(_public_doc(restored), default=str),
        status_code=200,
        media_type="application/json",
    )
    etag.set_etag_header(out, restored)
    return out


# ===========================================================================
# WAVE D — the remix / publish CORE + the read endpoints (J tranche)
# ===========================================================================


# The one read gate (X·F F-D5): ``api/services/read_gate.py``.
_readable_or_none = read_gate.readable_visualization


# ---------------------------------------------------------------------------
# View (the one counter; a GET never writes) — X·F F-D5 · FW6-G6
# ---------------------------------------------------------------------------


@router.post("/{slug}/view", status_code=204)
async def record_view(slug: str, request: Request) -> Response:
    """Count one view of a readable visualization and refresh its recency.

    The web sends it once per page-visible open (``navigator.sendBeacon``); the
    GET that renders the row writes nothing, so a crawler, a prefetch or a
    re-render never moves the count or the janitor's retention signal.
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")
    db = get_db()
    if await _readable_or_none(db, slug, await resolve_session(request)) is None:
        return errors.not_found(detail=f"no visualization {slug!r}")
    await db.visualizations.update_one(
        {"slug": slug}, {"$inc": {"views": 1}, "$set": {"last_accessed_at": datetime.now(UTC)}}
    )
    return Response(status_code=204)


def _apply_atom_overrides(head_atoms: dict, body: VisualizationRemix | VisualizationUpdate) -> dict:
    """HEAD atoms ∪ a body's atom fields — the remix idiom, shared with PATCH.

    An atom absent from ``model_fields_set`` inherits the HEAD; a value rebinds;
    ``palette_slug: null`` clears the binding (the atom leaves the bag, F-08).
    """
    child = dict(head_atoms)
    sent = body.model_fields_set
    if "active_bases" in sent and body.active_bases is not None:
        child["active_bases"] = sorted(body.active_bases)
    if "n_harmonics" in sent and body.n_harmonics is not None:
        child["n_harmonics"] = body.n_harmonics
    if "contour_settings" in sent and body.contour_settings is not None:
        child["contour_settings"] = body.contour_settings.model_dump()
    if "animation_settings" in sent and body.animation_settings is not None:
        child["animation_settings"] = body.animation_settings.model_dump()
    if "palette_slug" in sent:
        if body.palette_slug is None:
            child.pop("palette_slug", None)
        else:
            child["palette_slug"] = body.palette_slug
    return child


async def _head_version(db, doc: dict, head_hash: str, now: datetime) -> dict:
    """The HEAD's version document. A legacy row whose root was never written
    (it predates WAVE D's version collection) gets its root written first, so a
    PATCH always extends a real chain."""
    found = await db.visualization_versions.find_one({"_id": f"{doc['slug']}:{head_hash}"})
    if found is not None:
        return found
    await _write_version(
        db, viz_slug=doc["slug"], author_slug=doc.get("owner_slug", ""),
        atoms=atomdiff.enumerate_atoms(doc), set_hash_value=head_hash, parent=None,
        fork_of_hash=doc.get("fork_of_hash"), atom_ops=[], now=now,
    )
    return await db.visualization_versions.find_one({"_id": f"{doc['slug']}:{head_hash}"})


def _head_set_hash(doc: dict) -> str:
    """The viz's atom-set identity — the stored ``set_hash``, or computed for a
    legacy row that predates the additive fork-fields backfill migration."""
    return doc.get("set_hash") or atomdiff.set_hash(atomdiff.enumerate_atoms(doc))


# ---------------------------------------------------------------------------
# Remix (fork + a recorded atom-diff) — J.W1-crud-remix §4.1 / §11
# ---------------------------------------------------------------------------


@router.post("/{slug}/remix")
async def remix_visualization(slug: str, body: VisualizationRemix, request: Request) -> Response:
    """Fork a source visualization into a NEW child carrying a recorded atom-diff.

    The remix is the ordered, idempotent, content-addressed write sequence of
    ``J.W1-crud-remix §11`` (NO Mongo transaction — standalone-topology-honest):
    delete-race guard → insert child viz (slug-unique) → insert child root
    version (content-addressed) → conditional-last ``fork_count`` bump. A no-op
    remix (no atom changed) is a 422 ``urn:contract:remix-noop`` (the fourier
    tightening over value.js's verbatim-copy fork).
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to remix.")

    db = get_db()
    source = await _readable_or_none(db, slug, owner_slug)
    if source is None:
        return errors.not_found(detail=f"no live visualization {slug!r}")

    # The child atoms = source HEAD ∪ body overrides (palette_slug tri-state, F-08).
    source_atoms = atomdiff.enumerate_atoms(source)
    child_atoms = _apply_atom_overrides(source_atoms, body)

    # NOTE (F-02): ``palette_slug`` is a SOFT/optional reference — fourier owns no
    # ``palettes`` collection (palettes live in the value.js service, inv-16), so
    # it cannot FK-validate the slug. A dangling palette degrades the render, not
    # the data model; the binding is recorded verbatim.

    atom_ops = atomdiff.diff_atoms(source_atoms, child_atoms)
    if not atom_ops:
        return errors.problem(
            "urn:contract:remix-noop",
            422,
            "Remix changes nothing",
            detail="a remix must change at least one atom",
        )

    child_set_hash = atomdiff.set_hash(child_atoms)
    source_set_hash = _head_set_hash(source)
    child_content_hash = _content_hash(
        image_slug=source["image_slug"],
        contour_hash=source["contour_hash"],
        active_bases=child_atoms["active_bases"],
        n_harmonics=child_atoms["n_harmonics"],
    )
    now = datetime.now(UTC)

    async def _handler() -> Response:
        # (1) delete-race guard — re-confirm the source still lives (§11 step 1).
        live = await db.visualizations.find_one({"slug": slug}, {"_id": 1, "deleted_at": 1})
        if live is None or live.get("deleted_at") is not None:
            return errors.not_found(detail=f"source {slug!r} vanished mid-remix")

        # (2) insert the child Visualization (slug-unique via slug_with_retry).
        async def _insert(candidate: str) -> None:
            child = Visualization(
                slug=candidate,
                owner_slug=owner_slug,
                visibility=body.visibility,
                content_hash=child_content_hash,
                image_slug=source["image_slug"],  # subject INHERITED (§1.1 NOT-atom)
                contour_hash=source["contour_hash"],
                active_bases=child_atoms["active_bases"],
                n_harmonics=child_atoms["n_harmonics"],
                contour_settings=child_atoms["contour_settings"],
                animation_settings=child_atoms["animation_settings"],
                palette_slug=child_atoms.get("palette_slug"),  # absent → None binding
                title=body.title,
                description=body.description,
                tags=body.tags,
                set_hash=child_set_hash,
                fork_of=slug,
                fork_of_hash=source_set_hash,
                fork_count=0,
                version_count=1,
                created_at=now,
                updated_at=now,
            )
            doc = child.model_dump()  # animation_data defaults None (F-04 — stale)
            doc["last_accessed_at"] = now
            await db.visualizations.insert_one(doc)

        child_slug = await slugs.slug_with_retry(_insert)

        # (3) insert the child root version, carrying the recorded remix delta.
        await _write_version(
            db, viz_slug=child_slug, author_slug=owner_slug, atoms=child_atoms,
            set_hash_value=child_set_hash, parent=None, fork_of_hash=source_set_hash,
            atom_ops=atom_ops, now=now,
        )

        # (4) conditional, LAST: bump the source fork_count (the most-forked sort
        #     write-side; self-healing — an over-count is cosmetic, §11 step 4).
        await db.visualizations.update_one({"slug": slug}, {"$inc": {"fork_count": 1}})

        saved = await db.visualizations.find_one({"slug": child_slug})
        response = Response(
            content=json.dumps(_public_doc(saved), default=str),
            status_code=201,
            media_type="application/json",
        )
        etag.set_etag_header(response, saved)
        response.headers["Location"] = f"/api/visualizations/{child_slug}"
        return response

    return await idempotency.replay_or_record(request, _store(), f"user:{owner_slug}", _handler)


# ---------------------------------------------------------------------------
# Publish / unpublish (the idempotent in-place visibility flag-flip) — J.W1c
# ---------------------------------------------------------------------------


async def _visibility_verb(slug: str, request: Request, *, verb: str) -> Response:
    """The shared publish/unpublish body — an idempotent in-place ``$set`` on the
    SAME ``{slug}`` row (NEVER a new document, the structural anti-duplication
    guarantee, J.W1c §3.4). ``publish`` → ``public``; ``unpublish`` → the
    contract-legal ``public→unlisted`` exit (never the forbidden ``public→draft``).
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail=f"A session is required to {verb}.")

    db = get_db()
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None or doc.get("deleted_at") is not None:
        # A soft-deleted row cannot be published — no resurrect (J.W1c §5.3).
        return errors.not_found(detail=f"no live visualization {slug!r}")
    if doc.get("owner_slug") != owner_slug:
        return errors.not_owner(detail="you do not own this visualization")

    await etag.require_if_match(request, etag.compute_etag(doc))

    current = doc.get("visibility")
    if verb == "publish":
        target = "public"
    else:  # unpublish: only a public row flips (to unlisted); else a no-op (§3.3)
        target = "unlisted" if current == "public" else current

    # Compose the guard (J.W1c §5.1) — these verbs only ever choose legal targets,
    # so this never rejects, but the guard is COMPOSED, not bypassed.
    if not is_legal_visibility_transition(current, target):
        return errors.visibility_illegal_transition(
            detail=f"{current!r} → {target!r} is not a legal transition"
        )

    if target != current:
        await db.visualizations.update_one(
            {"slug": slug}, {"$set": {"visibility": target, "updated_at": datetime.now(UTC)}}
        )

    updated = await db.visualizations.find_one({"slug": slug})
    body = _public_doc(updated)
    body["published"] = updated.get("visibility") == "public"  # derived convenience (§6)
    out = Response(content=json.dumps(body, default=str), status_code=200, media_type="application/json")
    etag.set_etag_header(out, updated)
    return out


@router.post("/{slug}/publish")
async def publish_visualization(slug: str, request: Request) -> Response:
    """Flip a private/unlisted row to ``public`` in place (idempotent, no new row)."""
    return await _visibility_verb(slug, request, verb="publish")


@router.post("/{slug}/unpublish")
async def unpublish_visualization(slug: str, request: Request) -> Response:
    """Flip a ``public`` row out of the public view to ``unlisted`` (contract-legal)."""
    return await _visibility_verb(slug, request, verb="unpublish")


# ---------------------------------------------------------------------------
# Like (UIA-F-46)
# ---------------------------------------------------------------------------
#
# One ``visualization_likes`` row per (visualization, session user), keyed by a
# deterministic ``_id`` so the uniqueness is the primary key's — no extra
# index. The row's ``likes`` counter moves only when that row is created or
# removed, so repeating a state is a no-op and the counter never drops below 0.


def _like_id(slug: str, viewer: str) -> str:
    return f"{slug}:{viewer}"


async def _like_state(db: Any, slug: str, viewer: str) -> Response:
    doc = await db.visualizations.find_one({"slug": slug}, {"likes": 1})
    liked = await db.visualization_likes.count_documents({"_id": _like_id(slug, viewer)}, limit=1)
    body = {"slug": slug, "liked": bool(liked), "likes": max(0, (doc or {}).get("likes", 0))}
    return Response(content=json.dumps(body), status_code=200, media_type="application/json")


async def _liker(slug: str, request: Request) -> str | Response:
    """The session user for a like verb on a readable row, or the problem to answer."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")
    viewer = await resolve_session(request)
    if not viewer:
        return errors.session_invalid(detail="A session is required to like.")
    if await _readable_or_none(get_db(), slug, viewer) is None:
        return errors.not_found(detail=f"no visualization {slug!r}")
    return viewer


@router.get("/{slug}/like")
async def get_like(slug: str, request: Request) -> Response:
    """The caller's like state and the row's like count."""
    viewer = await _liker(slug, request)
    if isinstance(viewer, Response):
        return viewer
    return await _like_state(get_db(), slug, viewer)


@router.put("/{slug}/like")
async def set_like(slug: str, body: VisualizationLike, request: Request) -> Response:
    """Set the caller's like state (idempotent per session); returns ``{liked, likes}``."""
    viewer = await _liker(slug, request)
    if isinstance(viewer, Response):
        return viewer

    db = get_db()
    key = _like_id(slug, viewer)
    if body.liked:
        try:
            await db.visualization_likes.insert_one(
                {"_id": key, "slug": slug, "user_slug": viewer, "created_at": datetime.now(UTC)}
            )
        except DuplicateKeyError:
            pass  # already liked by this session user: the state asked for holds
        else:
            await db.visualizations.update_one({"slug": slug}, {"$inc": {"likes": 1}})
    else:
        removed = await db.visualization_likes.delete_one({"_id": key})
        if removed.deleted_count:
            await db.visualizations.update_one(
                {"slug": slug, "likes": {"$gt": 0}}, {"$inc": {"likes": -1}}
            )
    return await _like_state(db, slug, viewer)


# ---------------------------------------------------------------------------
# Forks (the children list — the most-forked write-side consumer) — §4.2
# ---------------------------------------------------------------------------


@router.get("/{slug}/forks")
async def list_forks(
    slug: str,
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="newest"),
    cursor: str = Query(default=""),
) -> Response:
    """List the public children that were remixed from ``slug`` (cursor-paginated)."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")
    if sort not in cursors.SORT_KEYS:
        return errors.cursor_invalid(detail=f"unknown sort {sort!r}")

    db = get_db()
    base_query = softdelete.with_not_deleted({"fork_of": slug, "visibility": "public"})
    cursor_payload = cursors.decode_cursor(cursor or None)
    query, sort_spec = cursors.paginate(base_query, cursor_payload, sort_key=sort)

    docs = (
        await db.visualizations.find(query, {"liked_ips": 0})
        .sort(sort_spec)
        .limit(limit + 1)
        .to_list(limit + 1)
    )
    has_more = len(docs) > limit
    if has_more:
        docs = docs[:limit]
    next_cursor = (
        cursors.next_cursor_from_last(docs[-1], sort_key=sort) if has_more and docs else None
    )

    body = {
        "items": [_public_doc(d) for d in docs],
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
    out = Response(content=json.dumps(body, default=str), status_code=200, media_type="application/json")
    if next_cursor:
        out.headers["Link"] = f'</api/visualizations/{slug}/forks?cursor={next_cursor}>; rel="next"'
    return out


# ---------------------------------------------------------------------------
# Provenance (within-viz version chain + cross-viz fork breadcrumb) — §4.3 / F-03
# ---------------------------------------------------------------------------


@router.get("/{slug}/provenance")
async def get_provenance(slug: str, request: Request) -> Response:
    """The within-viz version ``chain`` PLUS the cross-viz ``fork_breadcrumb``
    ("remixed from → … → original") — the two distinct walks named in F-03.
    Both ≤50, cycle-guarded; the chain is immutable, so the result is ETag-able.
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    db = get_db()
    viewer = await resolve_session(request)
    doc = await _readable_or_none(db, slug, viewer)
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    versions = (
        await db.visualization_versions.find({"viz_slug": slug}).sort("depth", 1).limit(50).to_list(50)
    )
    chain = [
        ProvenanceNode(
            slug=slug,
            set_hash=v["set_hash"],
            author_slug=v["author_slug"],
            depth=v["depth"],
            is_fork=v.get("forked_from_hash") is not None,
            created_at=v["created_at"],
        )
        for v in versions
    ]

    # Cross-viz fork_of ancestry walk (this viz → its source → … → original).
    # X·F F-D5 (FW6-G5): every hop passes the one read gate. An ancestor the
    # viewer cannot read is emitted as an ``unavailable`` crumb carrying only
    # its position, and the walk stops there (its own lineage is its owner's).
    breadcrumb: list[ForkCrumb | UnavailableCrumb] = []
    seen: set[str] = set()
    cur: dict | None = doc
    while cur is not None and len(breadcrumb) < 50:
        cur_slug = cur["slug"]
        if cur_slug in seen:
            break  # cycle-guard
        seen.add(cur_slug)
        parent_slug = cur.get("fork_of")
        parent = (
            await _readable_or_none(db, parent_slug, viewer)
            if parent_slug and parent_slug not in seen
            else None
        )
        breadcrumb.append(
            ForkCrumb(
                slug=cur_slug,
                set_hash=_head_set_hash(cur),
                author_slug=cur.get("owner_slug", ""),
                # A pointer to an unreadable parent is that parent's identity.
                fork_of=parent_slug if parent is not None else None,
                created_at=cur["created_at"],
            )
        )
        if parent_slug and parent is None and parent_slug not in seen:
            breadcrumb.append(UnavailableCrumb(ordinal=len(breadcrumb)))
        cur = parent

    resp = ProvenanceResponse(chain=chain, fork_breadcrumb=breadcrumb)
    out = Response(
        content=json.dumps(resp.model_dump(), default=str), status_code=200, media_type="application/json"
    )
    etag.set_etag_header(out, resp.model_dump())
    return out


# ---------------------------------------------------------------------------
# Diff (the recorded atom-diff; cacheable, immutable) — §4.4 / J-diff-shape.md
# ---------------------------------------------------------------------------


@router.get("/{slug}/diff")
async def get_diff(
    slug: str,
    request: Request,
    from_: str = Query(default="", alias="from"),
    to: str = Query(default=""),
) -> Response:
    """The canonical ``/diff`` envelope (``J-diff-shape.md §3.2``) between an
    on-chain ``from`` set-hash and the viz HEAD. Default (no ``from``) returns the
    recorded remix delta (``fork_of_hash`` → HEAD) — or ``identical`` for an
    original. Off-chain hash → 404; immutable, ETag-able (``"<from>:<to>"``).
    """
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    db = get_db()
    viewer = await resolve_session(request)
    doc = await _readable_or_none(db, slug, viewer)
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    head_hash = _head_set_hash(doc)
    fork_of_hash = doc.get("fork_of_hash")
    head_version = await db.visualization_versions.find_one({"_id": f"{slug}:{head_hash}"})
    recorded_ops = [AtomOp(**op) for op in (head_version or {}).get("atom_diff", [])]

    # The set-hashes on THIS viz's chain: its HEAD + (for a fork) the recorded
    # source HEAD at remix time. Any other `from`/`to` is off-chain → 404.
    on_chain = {head_hash} | ({fork_of_hash} if fork_of_hash else set())
    if from_ and from_ not in on_chain:
        return errors.not_found(detail=f"version {from_!r} is not on this visualization's chain")
    if to and to not in on_chain:
        return errors.not_found(detail=f"version {to!r} is not on this visualization's chain")

    effective_from = from_ or fork_of_hash or head_hash
    if effective_from == head_hash:
        resp = DiffResponse(from_hash=head_hash, to_hash=head_hash, ops=[], identical=True)
    else:  # effective_from == fork_of_hash → the recorded remix delta
        resp = DiffResponse(
            from_hash=fork_of_hash, to_hash=head_hash, ops=recorded_ops, identical=not recorded_ops
        )

    etag_val = f'"{resp.from_hash}:{resp.to_hash}"'
    if request.headers.get("If-None-Match") == etag_val:
        not_modified = Response(status_code=304)
        not_modified.headers["ETag"] = etag_val
        return not_modified

    out = Response(
        content=json.dumps(resp.model_dump(), default=str), status_code=200, media_type="application/json"
    )
    out.headers["ETag"] = etag_val
    out.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return out


# ---------------------------------------------------------------------------
# Versions (the viz's own depth-ordered chain, bounded ≤50, no cursor) — §4.5 / F-11
# ---------------------------------------------------------------------------


@router.get("/{slug}/versions")
async def list_versions(slug: str, request: Request) -> Response:
    """The viz's own version chain, ``depth``-ordered, bounded ≤50 (no cursor —
    F-11: a string ``set_hash`` ``_id`` breaks ``ObjectId`` cursor casting)."""
    if not slugs.validate_slug(slug):
        return errors.slug_invalid(detail=f"{slug!r} is not a 4-word slug")

    db = get_db()
    viewer = await resolve_session(request)
    doc = await _readable_or_none(db, slug, viewer)
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    versions = (
        await db.visualization_versions.find({"viz_slug": slug}).sort("depth", 1).limit(50).to_list(50)
    )
    entries = [
        VersionEntry(
            set_hash=v["set_hash"],
            depth=v["depth"],
            author_slug=v["author_slug"],
            atom_diff=[AtomOp(**op) for op in v.get("atom_diff", [])],
            created_at=v["created_at"],
        )
        for v in versions
    ]
    resp = VersionsResponse(viz_slug=slug, versions=entries)
    return Response(
        content=json.dumps(resp.model_dump(), default=str), status_code=200, media_type="application/json"
    )
