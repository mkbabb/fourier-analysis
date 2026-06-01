"""Regression test for the janitor's pinned-set inversion (Tranche A.W4.a),
driven end-to-end against a real ephemeral Mongo (migrated at H.W1 / inv-27).

The prior janitor at ``api/services/janitor.py`` constructed an unbounded
``pinned_contours: set[str]`` / ``pinned_images: set[str]`` in memory, then
passed the materialised list as a ``{"$nin": [list]}`` predicate. The list
grew with every snapshot and every featured/saved gallery entry; under load
it would have defeated the ``last_accessed_at`` index and eventually exceeded
the 16 MB BSON document limit — see ``docs/tranches/A/waves/W4.md`` scope item
1 and the H3 hardening note
``docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md``.

The fix inverts to a per-document ``pinned: bool`` flag on the ``contours``
and ``images`` collections. The janitor's deletion query is
``{"pinned": False, "last_accessed_at": {"$lt": cutoff}}`` — an indexed
predicate. This module asserts:

  1. No ``$nin`` operator appears anywhere in the janitor source (the
     BSON-limit hazard is gone outright — invariant 3, no legacy fallback).
  2. Under a populated real DB, the janitor selects unpinned-old documents
     and skips pinned ones — the pin policy is preserved end-to-end.
  3. The pin-flag recompute is idempotent: running the cycle twice yields the
     same state (this doubles as the migration-backfill check — running the
     janitor against documents missing the ``pinned`` field is safe).
  4. The grace hard-delete reaps soft-deleted visualizations past their
     window, and the recency prune reaps old unpinned blobs.

Why a real DB and not the old hand-rolled ``FakeCollection`` (B.W3+ evolution
note): the original mock was a partial re-implementation of motor's collection
surface, and it drifted out from under ``_cleanup_cycle`` as that routine
evolved through B.W3 (net-new ``deleted_at``-grace pass), the re-rooting of the
pin source from ``snapshots``/``gallery`` onto the converged ``visualizations``
collection, and the move to the batched ``pinned_cron.cron_prune`` helper
(``find(...).limit(...).to_list(...)`` + ``_id``-chunked ``delete_many``). The
mock lacked ``cursor.limit``/``.to_list`` and a faithful ``$merge`` semantics,
so the suite silently failed off the collected path. A real ephemeral Mongo
cannot drift from the janitor's query evolution — it executes the actual
pipeline — so we drive ``_cleanup_cycle`` against a throwaway database using
the shared ``requires_mongo`` / ``run_db`` fixtures (``api/tests/conftest.py``),
the same pattern the ``api/lib/crud`` DB-backed specs use. The no-``$nin``
guard is now a pure AST source-grep (no DB needed), matching the conformance
suite's ``test_no_unbounded_nin``.
"""

from __future__ import annotations

import ast
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from api.services import janitor

# Reuse the suite's shared Mongo fixtures. ``api/tests`` is not a package
# (no ``__init__``), so the bare ``from conftest import ...`` the sibling specs
# use is not importable from this package dir; the fixtures live in the
# importable module ``api.tests.conftest`` either way.
from api.tests.conftest import requires_mongo, run_db

_JANITOR_SRC = Path(janitor.__file__).read_text()


# ---------------------------------------------------------------------------
# Settings + DB injection
# ---------------------------------------------------------------------------


class _FakeSettings:
    """The settings surface ``_cleanup_cycle`` and ``_delete_images`` read.

    ``asset_max_age_days`` drives the recency cutoff (a 400d-old fixture is
    well past it); ``soft_delete_grace_days`` drives the net-new B.W3 grace
    hard-delete; ``user_max_age_days`` is set huge so the fixtures' user/session
    cascade arms stay quiescent (they are exercised by the dedicated
    ``api/tests`` user-cascade specs). ``blob_dir`` points at a throwaway dir so
    the image-prune blob unlink is a harmless no-op.
    """

    asset_max_age_days = 90
    user_max_age_days = 100_000  # quiescent: no stale users in these fixtures
    soft_delete_grace_days = 30

    def __init__(self, blob_dir: str) -> None:
        self.blob_dir = blob_dir


def _run_cycle_against(db, settings, monkeypatch) -> None:
    """Point the janitor's ``get_db`` / ``get_settings`` at the test db, run."""
    monkeypatch.setattr(janitor, "get_db", lambda: db)
    monkeypatch.setattr(janitor, "get_settings", lambda: settings)


async def _seed(db) -> None:
    """Populate the throwaway DB with the pin-policy fixture.

    Pin source is the converged ``visualizations`` collection (re-rooted at
    B.W3 / H-W3-6): a contour/image is pinned iff a *live* (``deleted_at ==
    None``) visualization references it. A *soft-deleted* visualization no
    longer pins its blobs.
    """
    # The pin recompute is a ``$merge`` joined on ``contour_hash`` /
    # ``image_slug``; Mongo requires a *unique* index on the join field of the
    # target collection (error 51183 otherwise). Production creates exactly
    # these in ``api.services.database.connect_db`` — mirror them here so the
    # test exercises the real server-side pipeline rather than a stand-in.
    await db.contours.create_index("contour_hash", unique=True)
    await db.images.create_index("image_slug", unique=True)

    old = datetime.now(UTC) - timedelta(days=400)  # well past the 90d cutoff
    fresh = datetime.now(UTC)

    await db.contours.insert_many(
        [
            # Old contour pinned by a live visualization — must survive.
            {"contour_hash": "C_PINNED", "last_accessed_at": old},
            # Old unpinned contour — must be reaped by the recency prune.
            {"contour_hash": "C_UNPINNED_OLD", "last_accessed_at": old},
            # Fresh unpinned contour — must survive (cutoff guard).
            {"contour_hash": "C_UNPINNED_FRESH", "last_accessed_at": fresh},
        ]
    )
    await db.images.insert_many(
        [
            {"image_slug": "I_PINNED", "last_accessed_at": old},
            {"image_slug": "I_UNPINNED_OLD", "last_accessed_at": old},
            {"image_slug": "I_UNPINNED_FRESH", "last_accessed_at": fresh},
        ]
    )
    await db.visualizations.insert_many(
        [
            # Live visualization → pins C_PINNED / I_PINNED.
            {
                "contour_hash": "C_PINNED",
                "image_slug": "I_PINNED",
                "deleted_at": None,
            },
            # A soft-deleted visualization whose window has NOT lapsed: it does
            # not pin (deleted_at != null) but also is not yet hard-deleted.
            {
                "contour_hash": "C_UNPINNED_OLD",
                "image_slug": "I_UNPINNED_OLD",
                "deleted_at": fresh,
            },
            # A soft-deleted visualization past the grace window → hard-deleted.
            {
                "contour_hash": "C_GRACE",
                "image_slug": "I_GRACE",
                "deleted_at": datetime.now(UTC) - timedelta(days=60),
            },
        ]
    )


# ---------------------------------------------------------------------------
# 1. Source-grep gate — no DB required.
# ---------------------------------------------------------------------------


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
                if (
                    isinstance(k, ast.Constant)
                    and isinstance(k.value, str)
                    and k.value.startswith("$")
                ):
                    keys.add(k.value)
    return keys


class TestJanitorNoUnboundedNin:
    """The hard-gate assertion: the janitor source contains no ``$nin``."""

    def test_no_nin_operator_anywhere(self) -> None:
        ops = _mongo_operator_keys(_JANITOR_SRC)
        assert "$nin" not in ops, (
            "Janitor uses a $nin query predicate (the W4.a inversion forbids "
            f"it — see api/services/janitor.py). Operators seen: {sorted(ops)}."
        )


# ---------------------------------------------------------------------------
# 2-4. End-to-end pin policy + grace + idempotency against a real Mongo.
# ---------------------------------------------------------------------------


@requires_mongo
class TestJanitorPinPolicyPreserved:
    """End-to-end: pinned old assets survive; unpinned old assets are deleted."""

    def test_pinned_assets_survive_unpinned_old_assets_deleted(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path
    ) -> None:
        settings = _FakeSettings(blob_dir=str(tmp_path))

        async def body(db):
            await _seed(db)
            _run_cycle_against(db, settings, monkeypatch)
            await janitor._cleanup_cycle()
            return (
                [d["contour_hash"] async for d in db.contours.find({})],
                [d["image_slug"] async for d in db.images.find({})],
            )

        contour_hashes, image_slugs = run_db(body)
        contour_hashes = set(contour_hashes)
        image_slugs = set(image_slugs)

        # Pinned by a live visualization → survives.
        assert "C_PINNED" in contour_hashes
        assert "I_PINNED" in image_slugs
        # Unpinned + old → reaped by the recency prune.
        assert "C_UNPINNED_OLD" not in contour_hashes
        assert "I_UNPINNED_OLD" not in image_slugs
        # Unpinned + fresh → survives (cutoff guard).
        assert "C_UNPINNED_FRESH" in contour_hashes
        assert "I_UNPINNED_FRESH" in image_slugs

    def test_pinned_flag_persisted_on_survivors(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path
    ) -> None:
        settings = _FakeSettings(blob_dir=str(tmp_path))

        async def body(db):
            await _seed(db)
            _run_cycle_against(db, settings, monkeypatch)
            await janitor._cleanup_cycle()
            contours = [d async for d in db.contours.find({})]
            images = [d async for d in db.images.find({})]
            return contours, images

        contours, images = run_db(body)
        # The recompute IS the migration: every surviving doc now carries an
        # explicit ``pinned`` field (no legacy ``$exists: false`` documents).
        for d in contours:
            assert "pinned" in d, f"Contour missing pinned field: {d!r}"
        for d in images:
            assert "pinned" in d, f"Image missing pinned field: {d!r}"
        # And the policy holds: the live-referenced blobs are flagged pinned,
        # the fresh-but-unreferenced one is not.
        by_hash = {d["contour_hash"]: d for d in contours}
        assert by_hash["C_PINNED"]["pinned"] is True
        assert by_hash["C_UNPINNED_FRESH"]["pinned"] is False

    def test_grace_window_hard_deletes_lapsed_visualizations(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path
    ) -> None:
        """B.W3 net-new grace pass: soft-deleted viz past the window are reaped.

        The not-yet-lapsed soft-deleted viz (``deleted_at`` = now) survives the
        grace pass; the 60-day-old one (window = 30d) is hard-deleted.
        """
        settings = _FakeSettings(blob_dir=str(tmp_path))

        async def body(db):
            await _seed(db)
            _run_cycle_against(db, settings, monkeypatch)
            await janitor._cleanup_cycle()
            return [d["contour_hash"] async for d in db.visualizations.find({})]

        remaining = set(run_db(body))
        # Live viz survives; recently soft-deleted viz survives (within grace);
        # the 60-day-old soft-deleted viz is hard-deleted.
        assert "C_PINNED" in remaining
        assert "C_UNPINNED_OLD" in remaining
        assert "C_GRACE" not in remaining


@requires_mongo
class TestJanitorRecomputeIdempotent:
    """Running the cycle twice yields the same state — backfill is idempotent."""

    def test_two_cycles_same_state(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path
    ) -> None:
        settings = _FakeSettings(blob_dir=str(tmp_path))

        async def _snapshot(db):
            contours = [d async for d in db.contours.find({})]
            images = [d async for d in db.images.find({})]
            return {
                "contours": sorted(d["contour_hash"] for d in contours),
                "images": sorted(d["image_slug"] for d in images),
                "contour_pins": sorted(
                    d["contour_hash"] for d in contours if d.get("pinned")
                ),
                "image_pins": sorted(
                    d["image_slug"] for d in images if d.get("pinned")
                ),
            }

        async def body(db):
            await _seed(db)
            _run_cycle_against(db, settings, monkeypatch)
            await janitor._cleanup_cycle()
            first = await _snapshot(db)
            await janitor._cleanup_cycle()
            second = await _snapshot(db)
            return first, second

        first, second = run_db(body)
        assert first == second
