"""Conformance — single-slug identity (CONFORMANCE-MATRIX C1.1–C1.3, CS7.1, CS7.2; CRUD-CONTRACT §1).

The visualization entity has exactly one user-facing handle: the 4-word
``slug``. ``test_no_hash_in_url`` greps the client + router sources for a
content-hash-shaped URL fragment (none survive the B convergence);
``test_slug_read_shape`` / ``test_no_id_field`` / ``test_slug_stable_across_crud``
/ ``test_owner_required`` drive the live router (throwaway Mongo) to prove the
slug reads, never leaks ``_id``, is stable across the CRUD lifecycle, and that
anonymous publish is refused.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from starlette.responses import Response

import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate, VisualizationUpdate

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures

_REPO_ROOT = Path(__file__).resolve().parents[3]
_SLUG_RE = re.compile(r"^[a-z]+(-[a-z]+){3}$")


def test_no_hash_in_url():
    """C1.1 — no content-hash-shaped fragment appears in any client/router URL."""
    # A hash-in-URL would be a literal like `/visualizations/${...content_hash}`
    # or a route segment named for a hash. The B convergence keyed every URL on
    # `slug`; grep the web + router sources for a hash-shaped path interpolation.
    targets = [_REPO_ROOT / "web" / "src", _REPO_ROOT / "api" / "routers"]
    pattern = r"/(visualizations|gallery|v|w)/[^\"'`]*(content_hash|snapshot_hash|[0-9a-f]{32,})"
    offenders: list[str] = []
    for root in targets:
        result = subprocess.run(
            ["grep", "-rnE", pattern, str(root)],
            capture_output=True, text=True,
        )
        if result.stdout.strip():
            offenders.extend(result.stdout.strip().splitlines())
    assert not offenders, f"hash-shaped URL fragment(s): {offenders}"


@requires_mongo
def test_slug_read_shape():
    """C1.2 — GET by 4-word slug → 200; a 64-hex string → 400 slug-invalid."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body()
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        slug = json.loads(bytes(created.body))["slug"]
        ok = await viz.get_visualization(slug, make_request("GET"), Response())
        bad = await viz.get_visualization("a" * 64, make_request("GET"), Response())
        return ok.status_code, json.loads(bytes(bad.body))

    status, bad_body = run_db(body)
    assert status == 200
    assert bad_body["type"] == "urn:contract:slug-invalid"


@requires_mongo
def test_no_id_field():
    """C1.3 — the read body never carries a top-level ``_id``."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body()
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        slug = json.loads(bytes(created.body))["slug"]
        read = await viz.get_visualization(slug, make_request("GET"), Response())
        return json.loads(bytes(read.body))

    payload = run_db(body)
    assert "_id" not in payload
    assert _SLUG_RE.match(payload["slug"])


@requires_mongo
def test_owner_required():
    """CS7.2 — same body: anonymous publish → 401 owner-required; with session → 201."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body()
        anon = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw), make_request("POST", body=raw)
        )
        viz._idem_store = None
        owned = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        return anon.status_code, json.loads(bytes(anon.body))["type"], owned.status_code

    anon_status, anon_type, owned_status = run_db(body)
    assert anon_status == 401 and anon_type == "urn:contract:owner-required"
    assert owned_status == 201


@requires_mongo
def test_slug_stable_across_crud():
    """CS7.1 — slug is byte-identical across create → read → patch → read."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body(visibility="unlisted")
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        created_body = json.loads(bytes(created.body))
        slug = created_body["slug"]
        etag = created.headers["ETag"]

        read1 = json.loads(bytes(
            (await viz.get_visualization(slug, make_request("GET"), Response())).body))
        patch_raw = json.dumps({"visibility": "public"}).encode()
        patched = await viz.update_visualization(
            slug,
            VisualizationUpdate.model_validate_json(patch_raw),
            make_request("PATCH", headers={"X-Session-Token": "tok-alpha", "If-Match": etag},
                         body=patch_raw),
        )
        patched_body = json.loads(bytes(patched.body))
        return slug, read1["slug"], patched.status_code, patched_body["slug"]

    slug, read_slug, patch_status, patch_slug = run_db(body)
    assert read_slug == slug
    assert patch_status == 200 and patch_slug == slug
    # `slug` is not a mutable field on VisualizationUpdate — it cannot be patched.
    assert "slug" not in VisualizationUpdate.model_fields
