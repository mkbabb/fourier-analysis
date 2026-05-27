"""Strong-validator ETag + ``If-Match`` dependency (CRUD-CONTRACT §0 SOTA-2, RFC 9110, R3 §1.1)."""

import hashlib
import json
from collections.abc import Iterable
from datetime import datetime
from typing import Any

from fastapi import HTTPException, Request, Response

from api.lib.crud.errors import etag_mismatch, precondition_required

# Default mutable fields for a visualization (SCHEMA §3 mutable shape).
_DEFAULT_FIELDS = ("visibility", "title", "description", "tags", "palette_slug", "updated_at")


def _json_default(obj: Any) -> Any:
    return obj.isoformat() if isinstance(obj, datetime) else str(obj)


def _canonical_json(obj: Any) -> bytes:
    """Stable serialisation: ``sort_keys=True``, no whitespace, ISO timestamps."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=_json_default).encode()


def compute_etag(doc: dict, *, fields: Iterable[str] | None = None) -> str:
    """Strong ETag ``"<sha256-hex>"`` over the mutable fields (default projection if None)."""
    keys = fields if fields is not None else _DEFAULT_FIELDS
    projection = {k: doc[k] for k in keys if k in doc}
    if not projection:
        projection = {k: v for k, v in doc.items() if k != "_id"}
    digest = hashlib.sha256(_canonical_json(projection)).hexdigest()
    return f'"{digest}"'


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
