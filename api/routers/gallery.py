"""Gallery — a thin presentational alias over the converged ``visualizations``.

The identity-bearing publish / CRUD / like / flag endpoints were carved out at
fourier-B.W3: publishing, reading, updating and soft-deleting now live in
``api/routers/visualizations.py`` against the single ``visualizations``
collection (CRUD-CONTRACT §1–§5). What survives here is the *public gallery
view* — a read-only list of ``visibility="public"`` live rows — kept as the
stable frontend-facing path while the consumer migration (B.W4) re-points the
web client onto ``/api/visualizations``.

``_entry_from_doc`` is retained because ``api/routers/admin.py`` consumes it for
moderation over the legacy ``gallery`` collection, which survives as rollback
substrate until the B.W5 close ceremony (hard-gate item 9).
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Query, Response

from api.lib.crud import cursors, errors, softdelete
from api.models.gallery import GalleryEntryResponse
from api.services.database import get_db

logger = logging.getLogger(__name__)

gallery_router = APIRouter(prefix="/api/gallery", tags=["gallery"])


def _entry_from_doc(doc: dict) -> GalleryEntryResponse:
    """Build a response model from a legacy gallery document (admin.py consumer)."""
    data = {k: v for k, v in doc.items() if k not in ("_id", "liked_ips")}
    return GalleryEntryResponse(**data)


def _public_doc(doc: dict) -> dict:
    """Strip non-user-facing internals from a visualization document."""
    return {k: v for k, v in doc.items() if k not in ("_id", "liked_ips")}


@gallery_router.get("/cursor")
async def list_public_gallery(
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="newest"),
    cursor: str = Query(default=""),
) -> Response:
    """Public gallery list — a ``visibility="public"`` alias over ``visualizations``.

    Read-only, anonymous-permissible, cursor-paginated (CRUD-CONTRACT §0 SOTA-1,
    §4). The canonical path is ``GET /api/visualizations``; this alias is kept so
    the pre-migration frontend keeps loading until B.W4 re-points it.
    """
    if sort not in cursors.SORT_KEYS:
        return errors.cursor_invalid(detail=f"unknown sort {sort!r}")

    db = get_db()
    base_query = softdelete.with_not_deleted({"visibility": "public"})
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
    return Response(
        content=json.dumps(body, default=str), status_code=200, media_type="application/json"
    )
