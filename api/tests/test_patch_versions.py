"""X·F F-D4 (FW6-G1..G4) — PATCH is a mutation of the atom bag, so it versions.

Before F-D4 there were two write paths over the same atoms: create and remix go
through ``enumerate_atoms`` → ``set_hash`` → a version write, while PATCH was a
bare ``$set`` of its non-None fields. So PATCH never versioned (G1), never
re-hashed (G2), could not clear ``palette_slug`` (G3), and accepted a field set
unrelated to the atom set (G4). One ``_write_version`` now serves all three
verbs, and PATCH splits its body into metadata and atoms.

Driven through the real ASGI stack (``conftest.asgi``) against a throwaway
database; skips without a live Mongo.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import api.routers.visualizations as viz
import api.services.database as database
from api.lib.crud.atomdiff import ATOM_KEY_ORDER, enumerate_atoms, set_hash
from api.models.visualization import VisualizationUpdate

from conftest import asgi, requires_mongo, run_db

OWNER = "alpha-beta-gamma-delta"
TOKEN = "tok-alpha"
METADATA = {"visibility", "title", "description", "tags"}


async def _seed(db) -> None:
    database._db = db
    viz._idem_store = None
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    await db.users.insert_one({"_id": OWNER})
    await db.sessions.insert_one(
        {"_id": TOKEN, "user_slug": OWNER, "expires_at": datetime.now(UTC) + timedelta(days=30)}
    )


async def _create(db, **over) -> dict:
    payload = {
        "image_slug": "tidy-image-slug-here",
        "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"],
        "n_harmonics": 8,
        "visibility": "public",
        **over,
    }
    status, raw = await asgi(
        "POST", "/api/visualizations", json.dumps(payload).encode(),
        [("X-Session-Token", TOKEN), ("Content-Type", "application/json")],
    )
    assert status == 201, raw
    return json.loads(raw)


async def _patch(db, slug: str, patch: dict) -> tuple[int, dict]:
    doc = await db.visualizations.find_one({"slug": slug})
    from api.lib.crud import etag

    status, raw = await asgi(
        "PATCH", f"/api/visualizations/{slug}", json.dumps(patch).encode(),
        [("X-Session-Token", TOKEN), ("Content-Type", "application/json"),
         ("If-Match", etag.compute_etag(doc))],
    )
    return status, (json.loads(raw) if raw else {})


@requires_mongo
def test_patch_of_an_atom_writes_a_depth_1_version_and_rehashes():
    """G1 + G2: an atom PATCH is a version (depth 1 off the root) and re-hashes."""

    async def body(db):
        await _seed(db)
        created = await _create(db)
        slug, root = created["slug"], created["set_hash"]
        status, _ = await _patch(db, slug, {"n_harmonics": 12})
        assert status == 200
        doc = await db.visualizations.find_one({"slug": slug})
        versions = await db.visualization_versions.find({"viz_slug": slug}).sort("depth", 1).to_list(10)
        return root, doc, versions

    root, doc, versions = run_db(body)
    assert [v["depth"] for v in versions] == [0, 1]
    child = versions[1]
    assert child["parent_hash"] == root
    assert child["root_hash"] == root
    assert child["n_harmonics"] == 12
    assert [op["atom_key"] for op in child["atom_diff"]] == ["n_harmonics"]
    # The stored set_hash is the recomputed one, and it names the new version.
    assert doc["set_hash"] == set_hash(enumerate_atoms(doc)) == child["set_hash"] != root
    assert doc["version_count"] == 2


@requires_mongo
def test_palette_slug_is_tri_state_on_patch():
    """G3: null clears, omitted inherits, a slug rebinds."""

    async def body(db):
        await _seed(db)
        slug = (await _create(db, palette_slug="warm-amber-dusk-glow"))["slug"]
        s1, _ = await _patch(db, slug, {"palette_slug": None})
        after_clear = await db.visualizations.find_one({"slug": slug})
        s2, _ = await _patch(db, slug, {"title": "kept"})
        after_omit = await db.visualizations.find_one({"slug": slug})
        s3, _ = await _patch(db, slug, {"palette_slug": "cool-teal-night-sea"})
        after_bind = await db.visualizations.find_one({"slug": slug})
        return (s1, s2, s3), after_clear, after_omit, after_bind

    statuses, cleared, omitted, bound = run_db(body)
    assert statuses == (200, 200, 200)
    assert cleared.get("palette_slug") is None
    assert "palette_slug" not in enumerate_atoms(cleared)
    assert omitted.get("palette_slug") is None
    assert bound["palette_slug"] == "cool-teal-night-sea"


def test_patch_atom_fields_equal_the_atom_set():
    """G4: the PATCH body's non-metadata fields ARE the atom set."""
    assert set(VisualizationUpdate.model_fields) - METADATA == set(ATOM_KEY_ORDER)


@requires_mongo
def test_metadata_only_patch_writes_no_version():
    """A PATCH that changes no atom writes no version and keeps set_hash."""

    async def body(db):
        await _seed(db)
        created = await _create(db)
        slug = created["slug"]
        status, _ = await _patch(db, slug, {"title": "renamed", "tags": ["a"]})
        doc = await db.visualizations.find_one({"slug": slug})
        n = await db.visualization_versions.count_documents({"viz_slug": slug})
        return status, created["set_hash"], doc, n

    status, root, doc, n = run_db(body)
    assert status == 200
    assert doc["title"] == "renamed"
    assert doc["set_hash"] == root
    assert n == 1


@requires_mongo
def test_a_non_nullable_atom_rejects_null():
    """Only palette_slug clears; the other atoms reject null with 422."""

    async def body(db):
        await _seed(db)
        slug = (await _create(db))["slug"]
        return [(await _patch(db, slug, {k: None}))[0] for k in ("active_bases", "n_harmonics")]

    assert run_db(body) == [422, 422]
