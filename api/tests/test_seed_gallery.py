"""FORTY-SIXTH C — the gallery's demo pieces (``api/scripts/seed_gallery.py``).

The seeds are public rows the site's own account holds, made through the routes' own
services: listed publicly with no owner on them, idempotent (a second run leaves them), kept by
the janitor however long the account goes unseen, and a drawing's picture registers its outline
on it. Every manifest entry's picture exists and is credited in ``SOURCES.md``.

Against a throwaway Mongo (see ``conftest``); skips when no Mongo. The drawings run the series
computes in the API's pool; one portrait runs the real non-ML extraction.
"""

from __future__ import annotations

import io
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

import api.routers.visualizations as viz
from api.config import settings
import api.services.database as database
from api.scripts import seed_gallery as seeds
from api.services import janitor

from conftest import requires_mongo, run_db

OWNER = "quiet-amber-site-owner"
MANIFEST = json.loads(seeds.MANIFEST.read_text())


def test_every_seed_has_its_picture_and_its_credit():
    sources = (seeds.MANIFEST.parent / "SOURCES.md").read_text()
    keys = [s["key"] for s in MANIFEST["seeds"]]
    assert keys == [
        "joseph-fourier",
        "leonhard-euler",
        "augustin-louis-cauchy",
        "the-sun",
        "the-moon",
    ]
    for seed in MANIFEST["seeds"]:
        if seed["kind"] == "picture":
            path = seeds.MANIFEST.parent / seed["file"]
            assert path.is_file(), path
            assert seed["file"] in sources, seed["file"]
            assert "Public domain" in seed["description"]
            assert min(Image.open(path).size) >= 400, f"{seed['file']} is too small to trace"
        else:
            assert (seeds.REPO / seed["drawing"]).is_file()
        assert seed["contour_settings"].get("strategy", "auto") != "ml", (
            "no seed loads the ML models"
        )


def test_a_drawing_registers_its_outline_on_its_picture():
    points = json.loads((seeds.REPO / "web/src/assets/fourier-paths/sun.json").read_text())[
        "original"
    ]
    png, xs, ys, bounds = seeds.drawing_assets(points, 1024)
    img = np.asarray(Image.open(io.BytesIO(png)).convert("RGBA"))
    assert img.shape[:2] == (seeds.DRAWING_PX, seeds.DRAWING_PX)
    assert img[0, 0, 3] == 0, "the ground is transparent"
    assert len(xs) == len(ys) == 1024
    half = seeds.DRAWING_PX / 2
    assert bounds == {"minX": -half, "maxX": half, "minY": -half, "maxY": half}
    # Every outline point lands on the drawn line (y up in the outline, down in the picture).
    hits = sum(
        img[int(round(half - y)), int(round(x + half)), 3] > 0
        for x, y in zip(xs[::16], ys[::16], strict=True)
    )
    assert hits == len(xs[::16])


@pytest.fixture
def blob_dir(tmp_path, monkeypatch):
    """The pictures go to a per-test directory."""
    d = tmp_path / "blobs"
    d.mkdir()
    monkeypatch.setattr(settings, "blob_dir", str(d))
    return d


async def _bind(db) -> None:
    database._db = db
    viz._idem_store = None
    await db.users.create_index("last_seen_at")
    # The janitor's pin recompute merges on these (the app creates them at start).
    await db.contours.create_index("contour_hash", unique=True)
    await db.images.create_index("image_slug", unique=True)


@requires_mongo
def test_drawings_seed_as_public_rows_once_and_the_janitor_keeps_them(blob_dir):
    async def body(db):
        await _bind(db)
        first = await seeds.seed_gallery(owner=OWNER, only={"the-sun", "the-moon"})
        again = await seeds.seed_gallery(owner=OWNER, only={"the-sun", "the-moon"})
        listed = json.loads(
            bytes(
                (
                    await viz.list_visualizations(
                        seeds._request("", "GET", "/api/visualizations"),
                        limit=20,
                        sort="newest",
                        cursor="",
                        owner="",
                    )
                ).body
            )
        )
        # The account goes unseen past the janitor's window: its pieces stay.
        await db.users.update_one(
            {"_id": OWNER}, {"$set": {"last_seen_at": datetime.now(UTC) - timedelta(days=400)}}
        )
        await janitor._cleanup_cycle()
        live = await db.visualizations.count_documents({"owner_slug": OWNER, "deleted_at": None})
        sessions = await db.sessions.count_documents({"user_slug": OWNER})
        return first, again, listed, live, sessions

    first, again, listed, live, sessions = run_db(body)
    assert [r["action"] for r in first] == ["seeded", "seeded"]
    assert [r["action"] for r in again] == ["held", "held"]
    items = listed["items"]
    assert sorted(i["title"] for i in items) == ["The moon", "The sun"]
    for item in items:
        assert item["visibility"] == "public"
        assert "owner_slug" not in item
        assert "the-site" in item["tags"]
    assert OWNER not in json.dumps(listed)
    assert live == 2, "the janitor keeps the site's account and its pieces"
    assert sessions == 0, "the script's session is gone"


@requires_mongo
def test_a_portrait_seeds_by_its_non_ml_extraction(blob_dir):
    async def body(db):
        await _bind(db)
        rows = await seeds.seed_gallery(owner=OWNER, only={"joseph-fourier"})
        doc = await db.visualizations.find_one({"owner_slug": OWNER})
        contour = await db.contours.find_one({"contour_hash": doc["contour_hash"]})
        return rows, doc, contour

    rows, doc, contour = run_db(body)
    assert rows[0]["action"] == "seeded"
    assert doc["title"] == "Joseph Fourier"
    assert doc["contour_settings"]["strategy"] == "multi_threshold"
    assert contour["point_count"] == 1024
    assert contour["image_bounds"] is not None


def test_the_api_image_carries_the_seed_pictures():
    ignored = (seeds.REPO / ".dockerignore").read_text().split()
    assert not any(Path(p).parts[:2] == ("api", "seeds") for p in ignored)
