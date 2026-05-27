"""Opaque base64url cursor encode/decode/paginate (CRUD-CONTRACT §0 SOTA-1, RFC 4648 §5).

Unifies ``gallery.py:57-71`` and value.js ``palettes.ts:29-41`` into one form:
``base64url(json({id, sort_key, sort_value}))`` with stale-sort detection.
"""

import base64
import json
from typing import Literal

from bson import ObjectId
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError

from api.lib.crud.errors import cursor_invalid

SortKey = Literal["newest", "popular", "most-forked", "views", "likes"]
Sort = list[tuple[str, int]]

SORT_KEYS: dict[str, str] = {  # sort_key → ordering field
    "newest": "created_at", "popular": "views", "most-forked": "fork_count",
    "views": "views", "likes": "likes",
}  # fmt: skip


def _cursor_400(reason: str) -> HTTPException:
    return HTTPException(status_code=400, detail=cursor_invalid(detail=reason).body.decode())


class CursorPayload(BaseModel):
    """Decoded shape of an opaque pagination cursor (SCHEMA §2)."""

    id: str  # ObjectId-as-string, tie-breaker
    sort_key: SortKey
    sort_value: str | int  # ISO timestamp or non-negative integer


def encode_cursor(payload: CursorPayload | dict) -> str:
    """Base64url-encode a CursorPayload (URL-safe, no ``=`` padding)."""
    if isinstance(payload, CursorPayload):
        payload = payload.model_dump()
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(raw: str | None) -> CursorPayload | None:
    """Decode + validate. ``None`` → ``None``; bad base64url/JSON/schema → 400 cursor-invalid."""
    if raw is None:
        return None
    try:
        padded = raw + "=" * (-len(raw) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded))
        return CursorPayload.model_validate(data)
    except (ValueError, ValidationError, TypeError) as exc:
        raise _cursor_400(str(exc)) from exc


def paginate(
    base_query: dict, cursor: CursorPayload | None, *, sort_key: str, sort_dir: int = -1
) -> tuple[dict, Sort]:
    """Combine ``base_query`` with cursor predicates → (query, sort). Stale-sort raises 400."""
    sort_field = SORT_KEYS[sort_key]
    op = "$lt" if sort_dir < 0 else "$gt"
    if cursor is not None:
        if cursor.sort_key != sort_key:
            raise _cursor_400("stale sort_key")
        base_query["$or"] = [
            {sort_field: {op: cursor.sort_value}},
            {sort_field: cursor.sort_value, "_id": {op: ObjectId(cursor.id)}},
        ]
    return base_query, [(sort_field, sort_dir), ("_id", sort_dir)]


def next_cursor_from_last(doc: dict, *, sort_key: str) -> str:
    """Build the next-page cursor from the last item of a ``limit+1`` query."""
    value = doc[SORT_KEYS[sort_key]]
    if hasattr(value, "isoformat"):
        value = value.isoformat()
    return encode_cursor(CursorPayload(id=str(doc["_id"]), sort_key=sort_key, sort_value=value))
