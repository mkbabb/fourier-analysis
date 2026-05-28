"""C.W3 §A.4 spec — the janitor is a peer writer into ``admin_audit``.

Reconciled at fourier-D.W3 γ: the two gallery-cascade audit rows
(``janitor:cascade_delete_gallery_for_images`` and
``janitor:cascade_delete_gallery``) were retired along with the dead
``gallery`` collection — the eleven-row ledger is now a nine-row ledger.

Two layers of proof, mirroring ``test_janitor_bounded_query.py``:

1. **Source grep (runs without Mongo)** — ``api/services/janitor.py`` factors a
   single ``_log_janitor_audit`` helper and wires it to all nine destructive
   sweeps of §A.2 (post-D.W3); the helper carries the ``"system:janitor"``
   sentinel and the ``count >= 1`` gate; the model is not loosened. This arm
   gates even in a Mongo-less CI, so a new destructive op added without an
   audit emission fails the suite loudly.
2. **Behaviour (``@requires_mongo``)** — against a throwaway Mongo, the five
   integration tests R4 binds: each sweep writes its row; a zero-effect sweep
   writes none; a re-run is idempotent and does not double-count; the
   non-transactional stale-user cascade self-heals; every janitor row satisfies
   the ``AuditEntry`` model (homogeneity).

Skips the behavioural arm cleanly when no Mongo is reachable; the source-grep
arm runs unconditionally.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

import api.services.database as database
from api.models.admin import AuditEntry
from api.services import janitor

from conftest import requires_mongo, run_db

_JANITOR_SRC = Path(__file__).resolve().parents[1] / "services" / "janitor.py"

# The nine destructive sweeps of §A.2 (reconciled at fourier-D.W3 γ; the two
# gallery-cascade rows were retired with the dead ``gallery`` collection).
# This list is the contract: every destructive op MUST appear here and be wired
# to ``_log_janitor_audit`` — the source-grep arm fails loudly otherwise.
_EXPECTED_ACTIONS = [
    "janitor:hard_delete_visualizations",
    "janitor:prune_contours",
    "janitor:prune_images",
    "janitor:delete_expired_sessions",
    "janitor:cascade_soft_delete_visualizations",
    "janitor:cascade_delete_flags",
    "janitor:cascade_delete_sessions",
    "janitor:delete_stale_users",
    "janitor:prune_audit",
]


# ---------------------------------------------------------------------------
# 1. Source-grep arm (runs without Mongo — the emission contract)
# ---------------------------------------------------------------------------


def test_single_helper_wired_to_every_destructive_sweep():
    """One ``_log_janitor_audit`` helper, nine call-sites (§A.2 post-D.W3 γ)."""
    src = _JANITOR_SRC.read_text()
    # One definition + nine invocations == ten mentions of the token.
    assert src.count("_log_janitor_audit") >= 10, (
        "expected one _log_janitor_audit definition plus nine call-sites"
    )
    # Count the invocations specifically (the ``await _log_janitor_audit(`` form).
    invocations = len(re.findall(r"await\s+_log_janitor_audit\(", src))
    assert invocations == 9, f"expected 9 audit emissions, found {invocations}"


def test_every_expected_action_string_is_emitted():
    """Each of the nine §A.2 ``janitor:<sweep>`` action strings appears in source."""
    src = _JANITOR_SRC.read_text()
    for action in _EXPECTED_ACTIONS:
        assert f'"{action}"' in src, f"missing audit emission for {action}"


def test_helper_carries_sentinel_and_gate():
    """The helper bakes in the ``"system:janitor"`` sentinel and the ``count >= 1`` gate."""
    src = _JANITOR_SRC.read_text()
    assert '"system:janitor"' in src, "the janitor actor sentinel is missing"
    assert "count < 1" in src, "the count >= 1 emission gate is missing"


def test_audit_entry_model_not_loosened():
    """``AuditEntry`` still requires all four fields (no ``str | None`` widening)."""
    fields = AuditEntry.model_fields
    assert set(fields) == {"timestamp", "action", "target", "ip_hash"}
    for name in ("timestamp", "action", "target", "ip_hash"):
        assert fields[name].is_required(), f"{name} must stay required for homogeneity"


# ---------------------------------------------------------------------------
# 2. Behavioural arm — the five R4-bound integration tests
# ---------------------------------------------------------------------------

# Defaults from ``api/config.py``: asset/30d, user/90d, soft-delete-grace/30d.
# Seed everything well past every cutoff (400 days) so the boundaries are crisp.
_ANCIENT = timedelta(days=400)


async def _ensure_merge_indexes(db) -> None:
    """Create the unique indexes the pin-recompute ``$merge`` requires.

    ``_recompute_pin_flags`` merges onto ``contours`` / ``images`` keyed on
    ``contour_hash`` / ``image_slug``; MongoDB rejects a ``$merge … on`` whose
    join field lacks a unique index (error 51183). Production creates these in
    ``database.connect_db`` (``contours.contour_hash`` unique, ``images.image_slug``
    unique); the throwaway test DB must mirror them or the cycle cannot run.
    """
    await db.contours.create_index("contour_hash", unique=True)
    await db.images.create_index("image_slug", unique=True)


async def _janitor_rows(db) -> list[dict]:
    """Every ``admin_audit`` row the janitor wrote this collection (action ^janitor:)."""
    return [doc async for doc in db.admin_audit.find({"action": {"$regex": "^janitor:"}})]


async def _seed_full_deletable_set(db, now: datetime) -> None:
    """Seed one deletable document per sweep so a single cycle exercises all nine rows.

    Caveat (§A.4 Test 1): the pin recompute runs first and re-pins any contour /
    image referenced by a LIVE visualization. The seeded contour / image are NOT
    referenced by any live viz, so the recompute leaves them ``pinned=False`` and
    the recency prune reaps them.

    Reconciled at fourier-D.W3 γ: the two gallery-cascade seed rows
    (``gallery.insert_one`` for the image cascade and the stale-user cascade)
    were removed along with the dead ``gallery`` collection. The remaining
    seed exercises the nine surviving destructive sweeps.
    """
    await _ensure_merge_indexes(db)
    grace_old = now - _ANCIENT

    # Row 1: a soft-deleted visualization past the grace window.
    await db.visualizations.insert_one(
        {"slug": "graced-viz-aa-bb", "owner_slug": "fresh-owner", "deleted_at": grace_old}
    )

    # Row 2: an old, unpinned contour, referenced by no live viz.
    await db.contours.insert_one(
        {"contour_hash": "old-contour", "pinned": False, "last_accessed_at": grace_old}
    )

    # Row 3: an old, unpinned image (the legacy gallery-cascade row 4 retired).
    await db.images.insert_one(
        {"image_slug": "old-image", "pinned": False, "last_accessed_at": grace_old}
    )

    # Row 4 (was 5): an expired session (not owned by the stale user, so it is
    # reaped by the expired-sessions sweep specifically).
    await db.sessions.insert_one(
        {"slug": "expired-sess", "user_slug": "fresh-owner", "expires_at": now - timedelta(days=1)}
    )

    # Rows 5–8 (was 6–10): a stale user with referencing live viz / flags /
    # sessions. The legacy ``gallery`` cascade row was retired with the
    # collection.
    await db.users.insert_one({"_id": "stale-user", "last_seen_at": grace_old})
    await db.visualizations.insert_one(
        {"slug": "stale-user-viz", "owner_slug": "stale-user", "deleted_at": None}
    )
    await db.flags.insert_one({"slug": "stale-user-flag", "reporter_slug": "stale-user"})
    await db.sessions.insert_one(
        {
            "slug": "stale-user-sess",
            "user_slug": "stale-user",
            "expires_at": now + timedelta(days=7),
        }
    )

    # Row 9 (was 11): an old admin_audit row past the 90-day retention window.
    await db.admin_audit.insert_one(
        {
            "timestamp": now - _ANCIENT,
            "ip_hash": "10.0.0.1-hashed",
            "action": "set_tier:featured",
            "target": "some-old-slug",
        }
    )


@requires_mongo
def test_each_sweep_writes_its_audit_row():
    """One row per sweep that deleted >= 1, with the correct action / payload (§A.4 Test 1)."""

    async def body(db):
        database._db = db
        now = datetime.now(UTC)
        await _seed_full_deletable_set(db, now)
        await janitor._cleanup_cycle()
        return await _janitor_rows(db)

    rows = run_db(body)
    by_action = {r["action"]: r for r in rows}

    # Every one of the eleven sweeps was effective and wrote exactly one row.
    assert set(by_action) == set(_EXPECTED_ACTIONS), (
        f"missing/spurious janitor actions: {set(by_action) ^ set(_EXPECTED_ACTIONS)}"
    )
    assert len(rows) == len(_EXPECTED_ACTIONS), "spurious or duplicate janitor rows written"

    # Every row carries count=1 (one deletable doc per sweep), the sentinel actor,
    # and a tz-aware timestamp.
    for action, row in by_action.items():
        assert re.search(r"count=1\b", row["target"]), (
            f"{action}: expected count=1 in {row['target']!r}"
        )
        assert row["ip_hash"] == "system:janitor", f"{action}: wrong actor sentinel"
        assert row["timestamp"].tzinfo is not None, f"{action}: timestamp not tz-aware"

    # The sweeps the table marks with a cutoff carry the ``cutoff=`` clause.
    cutoff_bearing = {
        "janitor:hard_delete_visualizations",
        "janitor:prune_contours",
        "janitor:prune_images",
        "janitor:delete_expired_sessions",
        "janitor:cascade_soft_delete_visualizations",
        "janitor:delete_stale_users",
        "janitor:prune_audit",
    }
    for action in cutoff_bearing:
        assert "cutoff=" in by_action[action]["target"], f"{action}: missing cutoff= clause"

    # The cohort-bounded cascades carry the ``users=`` facet. The legacy
    # ``janitor:cascade_delete_gallery_for_images`` row (with its ``images=``
    # facet) and the ``janitor:cascade_delete_gallery`` row were retired at
    # fourier-D.W3 γ along with the dead ``gallery`` collection.
    for action in (
        "janitor:cascade_soft_delete_visualizations",
        "janitor:cascade_delete_flags",
        "janitor:cascade_delete_sessions",
    ):
        assert "users=1" in by_action[action]["target"], f"{action}: missing users= facet"


@requires_mongo
def test_zero_effect_sweep_writes_no_row():
    """An empty DB matches no cutoff → zero janitor rows (proves the count >= 1 gate; §A.4 Test 2)."""

    async def body(db):
        database._db = db
        await _ensure_merge_indexes(db)
        await janitor._cleanup_cycle()
        return await db.admin_audit.count_documents({"action": {"$regex": "^janitor:"}})

    assert run_db(body) == 0


@requires_mongo
def test_rerun_is_idempotent_and_does_not_double_count():
    """Two cycles: run 1 reaps + writes rows; run 2 deletes nothing + writes none (§A.4 Test 3)."""

    async def body(db):
        database._db = db
        now = datetime.now(UTC)
        await _seed_full_deletable_set(db, now)

        await janitor._cleanup_cycle()
        after_first = await db.admin_audit.count_documents({"action": {"$regex": "^janitor:"}})

        await janitor._cleanup_cycle()
        after_second = await db.admin_audit.count_documents({"action": {"$regex": "^janitor:"}})

        # End-state: the seeded deletable docs are gone after run 1 and stay gone.
        survivors = {
            "viz": await db.visualizations.count_documents({}),
            "contours": await db.contours.count_documents({}),
            "images": await db.images.count_documents({}),
            "users": await db.users.count_documents({}),
        }
        return after_first, after_second, survivors

    after_first, after_second, survivors = run_db(body)
    assert after_first == len(_EXPECTED_ACTIONS), "run 1 did not write all eleven rows"
    # Run 2 deleted nothing → wrote no new janitor rows → the count is unchanged.
    # (The run-1 janitor rows themselves are < 90 days old, so the audit-retention
    # prune never reaps them and cannot inflate the second count either.)
    assert after_second == after_first, "re-run double-counted janitor audit rows"
    # The deletable cohort is fully reaped: only the (live) stale-user-derived
    # docs the cascade soft-deletes survive as soft-deleted, not as live rows.
    assert survivors["contours"] == 0
    assert survivors["images"] == 0
    assert survivors["users"] == 0


@requires_mongo
def test_partial_cascade_self_heals():
    """A crash-straddled cascade self-heals via stale_slugs re-derivation (§A.4 Test 4)."""

    async def body(db):
        database._db = db
        await _ensure_merge_indexes(db)
        now = datetime.now(UTC)
        grace_old = now - _ANCIENT

        # A stale user whose cascade was already partially applied out-of-band
        # (simulating a crash BEFORE the user delete): the user is still alive,
        # the flags/sessions still reference it; re-derivation must finish the
        # cascade and finally delete the user.
        await db.users.insert_one({"_id": "half-reaped", "last_seen_at": grace_old})
        await db.flags.insert_one({"slug": "orphan-flag", "reporter_slug": "half-reaped"})
        await db.sessions.insert_one(
            {
                "slug": "orphan-sess",
                "user_slug": "half-reaped",
                "expires_at": now + timedelta(days=7),
            }
        )

        await janitor._cleanup_cycle()

        return {
            "user": await db.users.count_documents({"_id": "half-reaped"}),
            "flags": await db.flags.count_documents({"reporter_slug": "half-reaped"}),
            "sessions": await db.sessions.count_documents({"user_slug": "half-reaped"}),
        }

    state = run_db(body)
    # The re-derivation re-selected the survivor and completed the remaining
    # cascades — no orphan is left that a later cycle cannot reap.
    assert state["user"] == 0, "the half-reaped stale user was not finally deleted"
    assert state["flags"] == 0, "the orphaned flag was not cascade-reaped"
    assert state["sessions"] == 0, "the orphaned session was not cascade-reaped"


@requires_mongo
def test_audit_rows_satisfy_AuditEntry():
    """Every janitor row constructs a valid ``AuditEntry`` (homogeneity; §A.4 Test 5)."""

    async def body(db):
        database._db = db
        now = datetime.now(UTC)
        await _seed_full_deletable_set(db, now)
        await janitor._cleanup_cycle()
        return await _janitor_rows(db)

    rows = run_db(body)
    assert rows, "no janitor rows were written to validate"
    for row in rows:
        without_id = {k: v for k, v in row.items() if k != "_id"}
        # Constructs without raising → the /api/admin/audit viewer renders a
        # mixed admin+janitor collection without error.
        entry = AuditEntry(**without_id)
        assert entry.action.startswith("janitor:")
        assert entry.ip_hash == "system:janitor"
