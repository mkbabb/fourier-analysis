"""J.W2 integration — the remix CORE (fork + recorded atom-diff) end-to-end.

Drives ``api/routers/visualizations.py`` against a throwaway Mongo via the shared
``_harness`` (the test_visibility.py pattern): create a source → remix it → assert
the child row, the recorded version + diff edge, the ``fork_count`` write-back,
the no-op 422, idempotent replay, the delete-race guard, and the read endpoints
(``/forks`` · ``/provenance`` · ``/versions`` · ``/diff``).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate, VisualizationRemix

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures

_TOK = {"X-Session-Token": "tok-alpha"}


async def _create_source(db, **over) -> str:
    bind(db)
    await seed_fixtures(db)
    raw = create_body(**over)
    created = await viz.create_visualization(
        VisualizationCreate.model_validate_json(raw),
        make_request("POST", headers=_TOK, body=raw),
    )
    viz._idem_store = None
    return json.loads(bytes(created.body))["slug"]


async def _remix(db, slug, *, headers=None, **fields):
    raw = json.dumps(fields).encode()
    path = f"/api/visualizations/{slug}/remix"
    req = make_request("POST", path=path, headers=headers if headers is not None else _TOK, body=raw)
    return await viz.remix_visualization(slug, VisualizationRemix.model_validate_json(raw), req)


# ---------------------------------------------------------------------------
# remix happy path — child + recorded version + fork_count write-back
# ---------------------------------------------------------------------------


@requires_mongo
def test_remix_creates_child_records_diff_bumps_fork_count():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child = json.loads(bytes(resp.body))
        source = await db.visualizations.find_one({"slug": slug})
        version = await db.visualization_versions.find_one({"viz_slug": child["slug"]})
        return resp.status_code, child, source, version

    status, child, source, version = run_db(body)
    assert status == 201
    # a NEW row, own slug, provenance edge to the source
    assert child["fork_of"] == source["slug"]
    assert child["fork_of_hash"] == source["set_hash"]
    assert child["fork_count"] == 0
    assert child["n_harmonics"] == 256
    assert child["set_hash"] and child["set_hash"] != source["set_hash"]
    # the source's most-forked write-side bumped (was a phantom)
    assert source["fork_count"] == 1
    # the recorded version snapshots the child + carries the remix delta
    assert version["_id"] == f"{child['slug']}:{child['set_hash']}"
    assert version["forked_from_hash"] == source["set_hash"]
    assert version["depth"] == 0 and version["parent_hash"] is None
    assert [(o["op"], o["atom_key"]) for o in version["atom_diff"]] == [("changed", "n_harmonics")]


@requires_mongo
def test_remix_inherits_subject_and_clears_animation_cache():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=128)
        child = json.loads(bytes(resp.body))
        full = await db.visualizations.find_one({"slug": child["slug"]})
        return child, full

    child, full = run_db(body)
    # subject (image/contour) is INHERITED (§1.1 NOT-atom); animation_data stale → None (F-04)
    assert child["image_slug"] == "tidy-image-slug-here"
    assert child["contour_hash"] == "c" * 64
    assert full.get("animation_data") is None


# ---------------------------------------------------------------------------
# guardrails — anon / no-op / delete-race
# ---------------------------------------------------------------------------


@requires_mongo
def test_anonymous_remix_is_401():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, headers={}, n_harmonics=256)
        return resp.status_code

    assert run_db(body) == 401


@requires_mongo
def test_noop_remix_is_422_remix_noop():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug)  # no atom override → empty diff
        return resp.status_code, json.loads(bytes(resp.body))

    status, problem = run_db(body)
    assert status == 422
    assert problem["type"] == "urn:contract:remix-noop"


@requires_mongo
def test_remix_of_deleted_source_is_404():
    async def body(db):
        slug = await _create_source(db)
        await db.visualizations.update_one(
            {"slug": slug}, {"$set": {"deleted_at": datetime.now(UTC)}}
        )
        resp = await _remix(db, slug, n_harmonics=256)
        return resp.status_code

    assert run_db(body) == 404


# ---------------------------------------------------------------------------
# idempotency — same Idempotency-Key replays the same child, one fork bump
# ---------------------------------------------------------------------------


@requires_mongo
def test_remix_idempotent_retry_same_child_one_bump():
    async def body(db):
        slug = await _create_source(db)
        raw = json.dumps({"n_harmonics": 256}).encode()
        path = f"/api/visualizations/{slug}/remix"
        hdrs = {**_TOK, "Idempotency-Key": "remix-key-1"}
        r1 = await viz.remix_visualization(
            slug, VisualizationRemix.model_validate_json(raw),
            make_request("POST", path=path, headers=hdrs, body=raw),
        )
        r2 = await viz.remix_visualization(
            slug, VisualizationRemix.model_validate_json(raw),
            make_request("POST", path=path, headers=hdrs, body=raw),
        )
        source = await db.visualizations.find_one({"slug": slug})
        total_children = await db.visualizations.count_documents({"fork_of": slug})
        return r1, r2, source, total_children

    r1, r2, source, total_children = run_db(body)
    assert json.loads(bytes(r1.body))["slug"] == json.loads(bytes(r2.body))["slug"]
    assert source["fork_count"] == 1  # bumped ONCE, not twice
    assert total_children == 1  # no double-fork


# ---------------------------------------------------------------------------
# read endpoints — forks / provenance / versions
# ---------------------------------------------------------------------------


@requires_mongo
def test_forks_lists_public_children():
    async def body(db):
        slug = await _create_source(db)
        await _remix(db, slug, n_harmonics=256, visibility="public")
        viz._idem_store = None
        await _remix(db, slug, n_harmonics=512, visibility="draft")  # private — hidden from /forks
        resp = await viz.list_forks(slug, limit=20, sort="newest", cursor="")
        return slug, json.loads(bytes(resp.body))

    slug, payload = run_db(body)
    assert len(payload["items"]) == 1  # only the public child (the draft is hidden)
    assert payload["items"][0]["fork_of"] == slug


@requires_mongo
def test_provenance_chain_and_fork_breadcrumb():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child_slug = json.loads(bytes(resp.body))["slug"]
        prov = await viz.get_provenance(child_slug, make_request("GET", headers=_TOK))
        return child_slug, slug, json.loads(bytes(prov.body)), prov.headers.get("ETag")

    child_slug, slug, prov, etag = run_db(body)
    # within-viz chain = the child's single root node
    assert [n["slug"] for n in prov["chain"]] == [child_slug]
    assert prov["chain"][0]["is_fork"] is True
    # cross-viz breadcrumb = child → source ("remixed from → … → original")
    assert [c["slug"] for c in prov["fork_breadcrumb"]] == [child_slug, slug]
    assert prov["fork_breadcrumb"][-1]["fork_of"] is None  # the original
    assert etag is not None


@requires_mongo
def test_versions_bounded_with_recorded_diff():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child_slug = json.loads(bytes(resp.body))["slug"]
        versions = await viz.list_versions(child_slug, make_request("GET", headers=_TOK))
        return json.loads(bytes(versions.body))

    payload = run_db(body)
    assert payload["versions"][0]["depth"] == 0
    assert len(payload["versions"]) == 1  # the root version (bounded ≤50, no cursor)
    assert [(o["op"], o["atom_key"]) for o in payload["versions"][0]["atom_diff"]] == [
        ("changed", "n_harmonics")
    ]


# ---------------------------------------------------------------------------
# diff — recorded delta, identical, off-chain 404, ETag / 304 / immutable
# ---------------------------------------------------------------------------


@requires_mongo
def test_diff_default_returns_recorded_remix_delta():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child = json.loads(bytes(resp.body))
        source = await db.visualizations.find_one({"slug": slug})
        diff = await viz.get_diff(child["slug"], make_request("GET", headers=_TOK), from_="", to="")
        return child, source, diff, json.loads(bytes(diff.body))

    child, source, diff, payload = run_db(body)
    assert set(payload.keys()) == {"from_hash", "to_hash", "ops", "identical"}
    assert payload["from_hash"] == source["set_hash"]
    assert payload["to_hash"] == child["set_hash"]
    assert payload["identical"] is False
    assert [(o["op"], o["atom_key"]) for o in payload["ops"]] == [("changed", "n_harmonics")]
    # immutable + ETag "<from>:<to>"
    assert diff.headers["ETag"] == f'"{source["set_hash"]}:{child["set_hash"]}"'
    assert "immutable" in diff.headers["Cache-Control"]


@requires_mongo
def test_diff_from_head_is_identical_and_off_chain_404():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child = json.loads(bytes(resp.body))
        head = child["set_hash"]
        same = await viz.get_diff(child["slug"], make_request("GET", headers=_TOK), from_=head, to="")
        off = await viz.get_diff(
            child["slug"], make_request("GET", headers=_TOK), from_="deadbeefcafef00d", to=""
        )
        return json.loads(bytes(same.body)), same.status_code, off.status_code

    same, same_status, off_status = run_db(body)
    assert same_status == 200 and same["identical"] is True and same["ops"] == []
    assert off_status == 404


@requires_mongo
def test_diff_if_none_match_304():
    async def body(db):
        slug = await _create_source(db)
        resp = await _remix(db, slug, n_harmonics=256, visibility="public")
        child = json.loads(bytes(resp.body))
        first = await viz.get_diff(child["slug"], make_request("GET", headers=_TOK), from_="", to="")
        etag = first.headers["ETag"]
        again = await viz.get_diff(
            child["slug"], make_request("GET", headers={**_TOK, "If-None-Match": etag}), from_="", to=""
        )
        return again.status_code

    assert run_db(body) == 304
