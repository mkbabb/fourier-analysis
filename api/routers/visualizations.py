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

import hashlib
import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Query, Request, Response

from api.dependencies import (
    get_client_ip,
    resolve_session,
    validate_image_slug,
)
from api.lib.crud import cursors, errors, etag, idempotency, slugs, softdelete
from api.models.visualization import (
    Visualization,
    VisualizationCreate,
    VisualizationUpdate,
)
from api.services.database import get_db
from api.services.rate_limiter import hash_ip, write_limiter

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


def _compute_content_hash(payload: VisualizationCreate) -> str:
    """sha256 over the content-defining fields (dedup / ETag substrate, §1)."""
    material = json.dumps(
        {
            "image_slug": payload.image_slug,
            "contour_hash": payload.contour_hash,
            "active_bases": sorted(payload.active_bases),
            "n_harmonics": payload.n_harmonics,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(material.encode()).hexdigest()


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
    write_limiter.check(hash_ip(get_client_ip(request)))

    # Ownership: a publish without a resolvable session is a 401, never a
    # ``owner_slug: None`` orphan row (CRUD-CONTRACT §3; retires gallery.py:188).
    owner_slug = await resolve_session(request)
    if not owner_slug:
        return errors.owner_required(detail="A session is required to publish.")

    db = get_db()
    validate_image_slug(body.image_slug)

    # The image blob is a stable FK (W3.21); the contour-hash must resolve.
    if await db.images.find_one({"image_slug": body.image_slug}, {"_id": 1}) is None:
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
            insert_doc["last_accessed_at"] = now
            await db.visualizations.insert_one(insert_doc)

        slug = await slugs.slug_with_retry(_insert)
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
    doc = await db.visualizations.find_one({"slug": slug})
    if doc is None:
        return errors.not_found(detail=f"no visualization {slug!r}")

    viewer = await resolve_session(request)
    is_owner = viewer is not None and viewer == doc.get("owner_slug")

    if doc.get("deleted_at") is not None and not is_owner:
        return errors.not_found(detail=f"no visualization {slug!r}")
    if doc.get("visibility") == "draft" and not is_owner:
        return errors.not_found(detail=f"no visualization {slug!r}")

    await db.visualizations.update_one(
        {"slug": slug}, {"$inc": {"views": 1}, "$set": {"last_accessed_at": datetime.now(UTC)}}
    )

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
) -> Response:
    """List visualizations with cursor pagination (CRUD-CONTRACT §0 SOTA-1, §4).

    Anonymous / default: only ``visibility=public`` live rows. ``?owner=me``
    (with a session) returns the caller's rows in all three visibility states.
    """
    if sort not in cursors.SORT_KEYS:
        return errors.cursor_invalid(detail=f"unknown sort {sort!r}")

    db = get_db()

    base_query: dict = softdelete.not_deleted_filter()
    if owner == "me":
        viewer = await resolve_session(request)
        if not viewer:
            return errors.session_invalid(detail="?owner=me requires a session")
        base_query["owner_slug"] = viewer
    else:
        base_query["visibility"] = "public"

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

    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    updates["updated_at"] = datetime.now(UTC)
    await db.visualizations.update_one({"slug": slug}, {"$set": updates})

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
