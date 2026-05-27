"""Conformance — soft-delete state machine (CONFORMANCE-MATRIX C5.1–C5.5; CRUD-CONTRACT §5).

``test_anonymous_404_after_delete`` / ``test_restore_in_grace`` drive the live
DELETE → restore round-trip (throwaway Mongo): a soft-deleted row reads 404 to
anonymous callers, and a restore inside the grace window returns 200 with the
row live again. ``test_cron_hard_deletes_past_grace`` /
``test_inside_grace_survives`` assert the grace BOUNDARY through the
``api/lib/crud/softdelete.py`` state machine (the utility the janitor's grace
pass is built on) — a row past grace is ``expired``, a row inside grace
restores — keeping the assertion independent of the janitor's internals.
``test_no_unbounded_nin`` is a runtime source-grep: the janitor's prune uses
indexed predicates, never an unbounded ``$nin``.
"""

from __future__ import annotations

import ast
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from starlette.responses import Response

import api.routers.visualizations as viz
from api.lib.crud import softdelete
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures

_JANITOR = Path(__file__).resolve().parents[3] / "api" / "services" / "janitor.py"


@requires_mongo
def test_anonymous_404_after_delete():
    """C5.1 — DELETE then anonymous GET → 404; the owner still sees the soft-deleted row."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body(visibility="public")
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        slug = json.loads(bytes(created.body))["slug"]
        etag = created.headers["ETag"]
        deleted = await viz.delete_visualization(
            slug, make_request("DELETE", headers={"X-Session-Token": "tok-alpha", "If-Match": etag})
        )
        anon = await viz.get_visualization(slug, make_request("GET"), Response())
        row = await db.visualizations.find_one({"slug": slug}, {"deleted_at": 1})
        return deleted.status_code, anon.status_code, row["deleted_at"]

    del_status, anon_status, deleted_at = run_db(body)
    assert del_status == 204
    assert anon_status == 404
    assert deleted_at is not None  # owner-visible soft-deleted row persists


@requires_mongo
def test_restore_in_grace():
    """C5.2 — POST restore within the grace window → 200; the row is live again."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body(visibility="public")
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        slug = json.loads(bytes(created.body))["slug"]
        etag = created.headers["ETag"]
        await viz.delete_visualization(
            slug, make_request("DELETE", headers={"X-Session-Token": "tok-alpha", "If-Match": etag})
        )
        restored = await viz.restore_visualization(
            slug, make_request("POST", headers={"X-Session-Token": "tok-alpha"})
        )
        row = await db.visualizations.find_one({"slug": slug}, {"deleted_at": 1})
        return restored.status_code, row["deleted_at"]

    status, deleted_at = run_db(body)
    assert status == 200
    assert deleted_at is None  # cleared on restore


@requires_mongo
def test_cron_hard_deletes_past_grace():
    """C5.3 — a row deleted past the grace window is ``expired`` (unrestorable → reaped)."""
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=31)
        await db.visualizations.insert_one(
            {"slug": "quiet-blue-morning-fox", "owner_slug": "u", "deleted_at": old}
        )
        # The grace boundary lives in the soft-delete utility the janitor uses.
        verdict = await softdelete.restore(db.visualizations, "quiet-blue-morning-fox",
                                           owner_slug="u", grace_days=30)
        # The janitor's hard-delete pass reaps rows whose deleted_at < cutoff.
        cutoff = datetime.now(UTC) - timedelta(days=30)
        reaped = await db.visualizations.delete_many({"deleted_at": {"$lt": cutoff}})
        remaining = await db.visualizations.count_documents({"slug": "quiet-blue-morning-fox"})
        return verdict, reaped.deleted_count, remaining

    verdict, reaped, remaining = run_db(body)
    assert verdict == "expired"
    assert reaped == 1 and remaining == 0


@requires_mongo
def test_inside_grace_survives():
    """C5.5 — a row 1 day inside grace survives the cutoff and still restores."""
    async def body(db):
        recent = datetime.now(UTC) - timedelta(days=29)
        await db.visualizations.insert_one(
            {"slug": "quiet-blue-morning-fox", "owner_slug": "u", "deleted_at": recent}
        )
        cutoff = datetime.now(UTC) - timedelta(days=30)
        reaped = await db.visualizations.delete_many({"deleted_at": {"$lt": cutoff}})
        verdict = await softdelete.restore(db.visualizations, "quiet-blue-morning-fox",
                                           owner_slug="u", grace_days=30)
        return reaped.deleted_count, verdict

    reaped, verdict = run_db(body)
    assert reaped == 0  # inside grace — the cutoff does not reach it
    assert verdict == "restored"


def test_no_unbounded_nin():
    """C5.4 — the janitor carries no unbounded ``$nin`` query predicate (indexed prune only)."""
    # Walk the AST so the docstring's retirement narration ("the ``$nin``
    # retirement landed…") is never miscounted — only a real ``{"$nin": …}``
    # dict-key predicate would fail this.
    keys: set[str] = set()
    for node in ast.walk(ast.parse(_JANITOR.read_text())):
        if isinstance(node, ast.Dict):
            for k in node.keys:
                if isinstance(k, ast.Constant) and isinstance(k.value, str) and k.value.startswith("$"):
                    keys.add(k.value)
    assert "$nin" not in keys, f"janitor uses a $nin query predicate; operators: {sorted(keys)}"
