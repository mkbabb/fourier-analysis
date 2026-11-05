"""X·F F-D7 (FW6-G13, G14) — extraction identity covers what extraction reads;
editor contours are authoritative.

(a) the cache key covers every ContourSettings field extraction consumes (the
    ML thresholds were missing), and EXTRACTION_FIELDS is that set by an ``ast``
    walk of the consumers, so a newly consumed field cannot slip out again;
(b) an editor save stores its ``image_bounds`` (from the contour it edits),
    never a GET-time backfill;
(c) an extraction that lands on an editor contour's hash leaves the editor's
    asset byte-equal.
"""

from __future__ import annotations

import ast
import asyncio
import inspect
import json
import textwrap

import api.services.database as database
from api.models.shared import ContourSettings
from api.services.image_storage import extraction_cache_key, store_contour_asset

from conftest import asgi, requires_mongo, run_db


def _attrs_read(func, name: str) -> set[str]:
    tree = ast.parse(textwrap.dedent(inspect.getsource(func)))
    return {
        n.attr
        for n in ast.walk(tree)
        if isinstance(n, ast.Attribute) and isinstance(n.value, ast.Name) and n.value.id == name
    }


def test_cache_key_covers_the_ml_thresholds():
    """(a) a different ml_threshold or ml_detail_threshold is a different key."""
    base = ContourSettings()
    key = extraction_cache_key("a" * 64, base)
    assert extraction_cache_key("a" * 64, base.model_copy(update={"ml_threshold": 0.6})) != key
    assert extraction_cache_key("a" * 64, base.model_copy(update={"ml_detail_threshold": 0.6})) != key


def test_extraction_fields_are_the_fields_extraction_reads():
    """(a) EXTRACTION_FIELDS == what to_contour_config and extract_contour read."""
    from api.routers.images import extract_contour

    consumed = (_attrs_read(ContourSettings.to_contour_config, "self") & set(ContourSettings.model_fields)) | (
        _attrs_read(extract_contour, "cs") & set(ContourSettings.model_fields)
    )
    assert ContourSettings.EXTRACTION_FIELDS == consumed
    assert {"ml_threshold", "ml_detail_threshold", "n_points"} <= consumed


SQUARE = {"x": [-10.0, 10.0, 10.0, -10.0], "y": [-10.0, -10.0, 10.0, 10.0]}
BOUNDS = {"minX": -384.0, "maxX": 384.0, "minY": -256.0, "maxY": 256.0}


@requires_mongo
def test_an_editor_save_stores_the_edited_contours_bounds():
    """(b) POST /api/contours carries image_bounds from the contour it edits."""

    async def body(db):
        database._db = db
        await db.contours.create_index("contour_hash", unique=True)
        src = await store_contour_asset([0.0, 1.0, 1.0], [0.0, 0.0, 1.0], "tidy-image-slug-here",
                                        source="extract", image_bounds=BOUNDS)
        status, raw = await asgi(
            "POST", "/api/contours",
            json.dumps({"image_slug": "tidy-image-slug-here", "points": SQUARE,
                        "from_contour": src["contour_hash"]}).encode(),
            [("Content-Type", "application/json")],
        )
        assert status == 200, raw
        stored = await db.contours.find_one({"contour_hash": json.loads(raw)["contour_hash"]})
        return stored

    stored = run_db(body)
    assert stored["source"] == "editor"
    assert stored["image_bounds"] == BOUNDS


@requires_mongo
def test_an_extraction_never_rewrites_an_editor_contour():
    """(c) the editor's asset is byte-equal after an extraction lands on its hash."""

    async def body(db):
        database._db = db
        await db.contours.create_index("contour_hash", unique=True)
        await store_contour_asset(SQUARE["x"], SQUARE["y"], "tidy-image-slug-here",
                                  source="editor", image_bounds=BOUNDS)
        before = await db.contours.find_one({"source": "editor"})
        await asyncio.sleep(0.02)  # a later write would carry a later stamp
        await store_contour_asset(SQUARE["x"], SQUARE["y"], "tidy-image-slug-here", source="extract",
                                  image_bounds={"minX": -1, "maxX": 1, "minY": -1, "maxY": 1},
                                  extraction_cache_key_value="k" * 64)
        after = await db.contours.find_one({"_id": before["_id"]})
        return before, after

    before, after = run_db(body)
    assert after == before
