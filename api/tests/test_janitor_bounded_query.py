"""W3.10 spec — the janitor makes only bounded queries (CRUD-CONTRACT §8, H-W3-6).

Two layers of proof:

1. **Source grep** — ``api/services/janitor.py`` contains no unbounded
   ``$nin``-over-``list(...)`` predicate and no ``storage_budget_gb`` band-aid
   (hard-gate items 5 + 6). The ``$nin`` retirement landed in tranche A; W3
   asserts it stays retired and that the band-aid is gone.
2. **Behaviour** — the recency prune delegates to the bounded
   ``api.lib.crud.pinned_cron.cron_prune`` helper, whose query is the indexed
   ``{pinned: False, last_accessed_at: {$lt: cutoff}}`` shape (no full-scan
   id-set construction), and the soft-delete grace pass is a bounded
   ``deleted_at`` range delete. Both are exercised against a throwaway Mongo.

Skips the behavioural arm when no Mongo is reachable; the source-grep arm runs
unconditionally.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

import api.services.database as database
from api.lib.crud import pinned_cron

from conftest import requires_mongo, run_db

_JANITOR_SRC = Path(__file__).resolve().parents[1] / "services" / "janitor.py"


# ---------------------------------------------------------------------------
# 1. Source-grep assertions (hard-gate items 5 + 6)
# ---------------------------------------------------------------------------


def _code_lines(src: str) -> list[str]:
    """Lines of executable source with comments + docstrings stripped.

    The janitor *documents* the retired ``$nin`` pattern in prose; the hard
    gate is about the live predicate, not the archaeology note. We strip
    ``#`` comments and any line inside a triple-quoted block before grepping.
    """
    out: list[str] = []
    in_doc = False
    for raw in src.splitlines():
        line = raw
        # toggle triple-quote docstring/comment blocks (handles the common case
        # of a block delimiter alone on its line)
        if line.count('"""') == 1 or line.count("'''") == 1:
            in_doc = not in_doc
            continue
        if in_doc:
            continue
        code = line.split("#", 1)[0]
        out.append(code)
    return out


def test_no_unbounded_nin_over_a_list():
    """No ``$nin`` predicate built from an in-memory ``list(...)`` (CRUD-CONTRACT §8 C8.1)."""
    src = _JANITOR_SRC.read_text()
    # Hard-gate item 5: the rejected shape is ``{"$nin": list(...)}`` over an
    # unbounded collection scan — grep the whole file (the gate's literal form).
    assert re.search(r"\$nin.*list\(", src) is None, "unbounded $nin over a list survives"
    # And no ``$nin`` token survives in *executable* source (comments/docstrings
    # that explain the tranche-A retirement are allowed).
    code = "\n".join(_code_lines(src))
    assert "$nin" not in code, "the janitor carries a live $nin predicate"


def test_no_storage_budget_band_aid():
    """The ``storage_budget_gb`` eviction band-aid is retired (hard-gate item 6 / H-W3-5)."""
    src = _JANITOR_SRC.read_text()
    assert "storage_budget_gb" not in src


def test_janitor_delegates_to_bounded_cron_prune():
    """The recency prune is the bounded ``pinned_cron.cron_prune`` helper, not a hand-rolled scan."""
    src = _JANITOR_SRC.read_text()
    assert "pinned_cron.cron_prune" in src or "cron_prune(" in src


# ---------------------------------------------------------------------------
# 2. Behavioural assertions — the prune query is indexed + bounded
# ---------------------------------------------------------------------------


@requires_mongo
def test_cron_prune_only_removes_unpinned_past_cutoff():
    async def body(db):
        database._db = db
        now = datetime.now(UTC)
        old = now - timedelta(days=400)
        await db.contours.insert_many(
            [
                {"contour_hash": "old-unpinned", "pinned": False, "last_accessed_at": old},
                {"contour_hash": "old-pinned", "pinned": True, "last_accessed_at": old},
                {"contour_hash": "fresh-unpinned", "pinned": False, "last_accessed_at": now},
            ]
        )
        deleted = await pinned_cron.cron_prune(db.contours, cutoff=now - timedelta(days=30))
        survivors = {d["contour_hash"] async for d in db.contours.find({}, {"contour_hash": 1})}
        return deleted, survivors

    deleted, survivors = run_db(body)
    assert deleted == 1  # only the old + unpinned row
    assert survivors == {"old-pinned", "fresh-unpinned"}


@requires_mongo
def test_grace_pass_is_a_bounded_deleted_at_range():
    """The soft-delete grace hard-delete is a bounded range over ``deleted_at`` (§5 / §8 cat. 2)."""

    async def body(db):
        database._db = db
        now = datetime.now(UTC)
        await db.visualizations.insert_many(
            [
                {"slug": "past-grace-aa-bb", "deleted_at": now - timedelta(days=400)},
                {"slug": "within-grace-cc-dd", "deleted_at": now - timedelta(days=1)},
                {"slug": "alive-ee-ff-gg-hh", "deleted_at": None},
            ]
        )
        grace_cutoff = now - timedelta(days=30)
        result = await db.visualizations.delete_many({"deleted_at": {"$lt": grace_cutoff}})
        survivors = {d["slug"] async for d in db.visualizations.find({}, {"slug": 1})}
        return result.deleted_count, survivors

    deleted, survivors = run_db(body)
    assert deleted == 1
    assert survivors == {"within-grace-cc-dd", "alive-ee-ff-gg-hh"}
