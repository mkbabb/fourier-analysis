"""Strong-validator ETag + ``If-Match`` dependency (CRUD-CONTRACT §0 SOTA-2, RFC 9110, R3 §1.1).

The canonical serialisation lives in ``canonical_digest`` (J.W2 §12): the ETag
is ``canonical_digest`` over the mutable-field projection — one of the three
projections that primitive serves (content-hash + atom-set-hash are the others).
``_canonical_json`` / ``canonical_digest`` are re-exported here for the existing
callers (the W2 transposition keeps the names working, no legacy shim).
"""

from collections.abc import Iterable
from typing import Any

from fastapi import HTTPException, Request, Response

from api.lib.crud.canonical_digest import canonical_digest, canonical_json
from api.lib.crud.errors import etag_mismatch, precondition_required

# Default mutable fields for a visualization (SCHEMA §3 mutable shape).
_DEFAULT_FIELDS = ("visibility", "title", "description", "tags", "palette_slug", "updated_at")

# Back-compat alias: ``_canonical_json`` was the prior name for this serialiser.
_canonical_json = canonical_json


def compute_etag(doc: dict, *, fields: Iterable[str] | None = None) -> str:
    """Strong ETag ``"<sha256-hex>"`` over the mutable fields (default projection if None)."""
    keys = fields if fields is not None else _DEFAULT_FIELDS
    projection = {k: doc[k] for k in keys if k in doc}
    if not projection:
        projection = {k: v for k, v in doc.items() if k != "_id"}
    return f'"{canonical_digest(projection)}"'


async def require_if_match(request: Request, expected_etag: str) -> None:
    """``Depends``-able. Missing → 428; ``If-Match: *`` → accept; mismatch → 412."""
    header = request.headers.get("If-Match")
    if header is None:
        raise HTTPException(status_code=428, detail=precondition_required().body.decode())
    if header.strip() == "*":
        return
    if header != expected_etag:
        detail = etag_mismatch(detail="If-Match does not equal the current ETag").body.decode()
        raise HTTPException(status_code=412, detail=detail)


def set_etag_header(response: Response, doc: dict, **kwargs: Any) -> str:
    """Compute the ETag, set ``response.headers['ETag']``, return the value."""
    value = compute_etag(doc, **kwargs)
    response.headers["ETag"] = value
    return value
