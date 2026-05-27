"""Conformance — cron / bounded prune (CONFORMANCE-MATRIX C8.1, C8.2, C8.4, C8.5; CRUD-CONTRACT §8).

The janitor's reap is built on ``api/lib/crud/pinned_cron.cron_prune`` — the
indexed ``{pinned: False, last_accessed_at: {$lt: cutoff}}`` prune that retires
the unbounded ``$nin``-over-``distinct()`` anti-pattern. These rows assert that
utility's invariants (one tick clears the unpinned-stale fixture, a pinned row
survives a stale TTL, a second tick is a no-op) against a throwaway Mongo, plus
the runtime source-grep that no ``$nin`` survives in the janitor itself. Testing
the utility keeps the assertion independent of the janitor's in-flight internals.
"""

from __future__ import annotations

import ast
from datetime import UTC, datetime, timedelta
from pathlib import Path

from api.lib.crud import pinned_cron

from conftest import requires_mongo, run_db

_JANITOR = Path(__file__).resolve().parents[3] / "api" / "services" / "janitor.py"


def _mongo_operator_keys(source: str) -> set[str]:
    """Every ``$``-prefixed Mongo operator used as a *dict key* in the source.

    Walks the AST so docstring / comment prose mentioning ``$nin`` (the
    retirement narration) is never counted — only an actual query predicate
    ``{"$nin": ...}`` would surface here.
    """
    keys: set[str] = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Dict):
            for k in node.keys:
                if isinstance(k, ast.Constant) and isinstance(k.value, str) and k.value.startswith("$"):
                    keys.add(k.value)
    return keys


def test_no_unbounded_nin():
    """C8.1 — zero ``$nin`` query predicates in the janitor (indexed prune only)."""
    ops = _mongo_operator_keys(_JANITOR.read_text())
    assert "$nin" not in ops, f"janitor uses a $nin query predicate; operators seen: {sorted(ops)}"


@requires_mongo
def test_one_tick_clears_fixture():
    """C8.2 — one prune tick clears the unpinned-stale rows, leaving pinned + fresh."""
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=100)
        new = datetime.now(UTC)
        await db.contours.insert_many([
            {"pinned": False, "last_accessed_at": old},  # 3 unpinned-stale → reaped
            {"pinned": False, "last_accessed_at": old},
            {"pinned": False, "last_accessed_at": old},
            {"pinned": True, "last_accessed_at": old},   # pinned-stale → survives
            {"pinned": False, "last_accessed_at": new},  # unpinned-fresh → survives
        ])
        cutoff = datetime.now(UTC) - timedelta(days=30)
        reaped = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
        remaining = await db.contours.count_documents({})
        return reaped, remaining

    reaped, remaining = run_db(body)
    assert reaped == 3 and remaining == 2


@requires_mongo
def test_pinned_survives_ttl():
    """C8.5 — a ``pinned: True`` row past the TTL cutoff is NOT reaped."""
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=365)
        await db.contours.insert_one({"pinned": True, "last_accessed_at": old})
        cutoff = datetime.now(UTC) - timedelta(days=30)
        reaped = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
        survived = await db.contours.count_documents({"pinned": True})
        return reaped, survived

    reaped, survived = run_db(body)
    assert reaped == 0 and survived == 1


@requires_mongo
def test_second_tick_noop():
    """C8.4 — the prune is idempotent: a second tick reaps zero."""
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=100)
        await db.contours.insert_many([
            {"pinned": False, "last_accessed_at": old},
            {"pinned": False, "last_accessed_at": old},
        ])
        cutoff = datetime.now(UTC) - timedelta(days=30)
        first = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
        second = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
        return first, second

    first, second = run_db(body)
    assert first == 2 and second == 0
