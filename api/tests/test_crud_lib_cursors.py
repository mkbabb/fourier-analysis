"""W3.12 spec — api/lib/crud/cursors.py (CRUD-CONTRACT §0 SOTA-1, RFC 4648 §5). Pure functions."""

import random

import pytest
from fastapi import HTTPException

from api.lib.crud import cursors
from api.lib.crud.cursors import CursorPayload


def test_encode_round_trip():
    keys = ["newest", "popular", "most-forked", "views", "likes"]
    for _ in range(100):
        p = CursorPayload(
            id="507f1f77bcf86cd799439011",
            sort_key=random.choice(keys),
            sort_value=random.choice(["2026-01-01T00:00:00", random.randint(0, 10**6)]),
        )
        assert cursors.decode_cursor(cursors.encode_cursor(p)) == p


def test_encode_no_padding():
    enc = cursors.encode_cursor(CursorPayload(id="a", sort_key="views", sort_value=1))
    assert "=" not in enc


def test_decode_none_returns_none():
    assert cursors.decode_cursor(None) is None


def test_decode_garbage_400():
    with pytest.raises(HTTPException) as exc:
        cursors.decode_cursor("not-base64!!")
    assert exc.value.status_code == 400 and "urn:contract:cursor-invalid" in exc.value.detail


def test_decode_stale_sort_400():
    stale = cursors.encode_cursor(CursorPayload(id="a", sort_key="newest", sort_value="x"))
    decoded = cursors.decode_cursor(stale)
    with pytest.raises(HTTPException) as exc:
        cursors.paginate({}, decoded, sort_key="popular")
    assert exc.value.status_code == 400


def test_paginate_first_page():
    q, sort = cursors.paginate({"visibility": "public"}, None, sort_key="newest")
    assert q == {"visibility": "public"}
    assert sort == [("created_at", -1), ("_id", -1)]


def test_paginate_subsequent_page():
    c = CursorPayload(id="507f1f77bcf86cd799439011", sort_key="views", sort_value=42)
    q, sort = cursors.paginate({}, c, sort_key="views")
    assert "$or" in q and len(q["$or"]) == 2
    assert q["$or"][0] == {"views": {"$lt": 42}}
    assert "_id" in q["$or"][1]


def test_next_cursor_from_last():
    doc = {"_id": "507f1f77bcf86cd799439011", "views": 7}
    raw = cursors.next_cursor_from_last(doc, sort_key="views")
    decoded = cursors.decode_cursor(raw)
    assert decoded.id == "507f1f77bcf86cd799439011" and decoded.sort_value == 7
