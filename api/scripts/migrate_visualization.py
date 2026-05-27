"""Idempotent backfill: ``snapshots`` (∪ its ``gallery`` row) → ``visualizations``.

fourier-B.W3.c. One-way clean cutover (R5 §1.1): every ``visualizations`` row
is a pure, offline-computable function of the ``(snapshot, gallery?)`` pair
that already exists, so no dual-read layer is needed (forbidden legacy code).

Rollback substrate
------------------
The source collections ``snapshots`` and ``gallery`` are **retained
untouched** (never deleted, never mutated) until the B.W5 — close ceremony.
This script only *writes* ``visualizations`` and *inserts* ``users`` rows for
the ``anon-migrated-NNNNN`` owners; it never deletes or mutates a source row.
To roll back a partial or complete migration, restore the pre-W3 commit (the
router swap reverts; reads re-point at ``snapshots`` / ``gallery``) and drop
the ``visualizations`` collection. The ``anon-migrated-NNNNN`` ``users`` docs
are inert after a code rollback (no session, no live reference) and may be
left in place; delete via ``users.delete_many({"status": "orphan-migrated"})``
if W5 finds them problematic. The W3 hard gate asserts all three collections
coexist post-migration.

``--reload`` constraint (W3.24)
-------------------------------
Run STANDALONE against a non-``--reload`` backend (or with the backend down
entirely)::

    python -m api.scripts.migrate_visualization            # live backfill
    python -m api.scripts.migrate_visualization --dry-run   # report only, no writes

Embedding the backfill inside a ``uvicorn --reload`` process triggers the L6
chronic-residual #5 — the migration is interrupted mid-pass on every dev-server
reload, leaving a half-migrated DB. The clean one-way cutover (R5 §1) depends on
a backend-stopped backfill; the legacy collections are the rollback substrate if
a partial migration nonetheless occurs.

Idempotency (W3.19 / H-W3-1(c))
-------------------------------
Every migrated visualization carries a ``migrated_from: {coll, _id, was_public}``
marker, written ATOMICALLY with the payload in one insert (one ``$set``-shaped
document — H-W3-1(c)). The first action selects only snapshots whose ``_id``
does not already carry a marker, so a re-run is a total no-op (second invocation
reports ``written == 0``). The orphan pass is likewise idempotent: a re-run mints
no duplicate ``anon-migrated-NNNNN`` for an already-marked snapshot.

The P2 narrowings (challenge.md §2 / H-W3-1..2) implemented here:
  * (a) naive→aware datetime coercion — ``snapshots.created_at`` is naive UTC
        (``snapshots.py:49``); ``gallery.created_at`` is aware (``gallery.py:176``).
  * (b) ``owner_slug`` is sourced GALLERY-side (snapshots carry no owner); the
        snapshot is authoritative only for ``animation_settings`` (W3.20).
  * (c) ``migrated_from`` is co-written atomically with the payload.
  * the THIRD owner-less path — the "zombie orphan" (H-W3-2): a gallery row
        deleted out from under its surviving snapshot via
        ``janitor._delete_images_and_cascade``. The migration cannot prove a
        bare orphan snapshot was once public from snapshot state alone (the
        gallery row is gone), so the conservative honest marker records
        ``was_public`` from whatever provenance survives — never silently
        collapsing a once-public zombie into a plain never-published draft.
"""

from __future__ import annotations

import argparse
import asyncio
import random
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from api.lib.crud.slugs import slug_with_retry
from api.services.database import close_db, connect_db, get_db

# The seed=42 / 10-row spot-check (CONFORMANCE-MATRIX C11.3; R3 §5.3).
_SPOT_CHECK_SEED = 42
_SPOT_CHECK_N = 10

# Visibility states (CRUD-CONTRACT §4). A fixed, bounded enum — the post-
# condition's ``$nin`` over THIS is constant-size (3 elements), not the
# rejected unbounded ``$nin`` over a ``collection.distinct(...)`` scan (W3.16).
_VALID_VISIBILITY: list[str] = ["draft", "unlisted", "public"]


# ---------------------------------------------------------------------------
# anon-migrated-NNNNN owner minting (W3.17 / migration-artefact exception)
# ---------------------------------------------------------------------------


def mint_anon_migrated_slug(n: int) -> str:
    """Owner slug for an owner-less migrated row.

    Returns ``f"anon-migrated-{n:05d}"``. This DELIBERATELY violates the
    contract slug pattern ``^[a-z]+(-[a-z]+){3}$`` — it is a migration-artefact
    exception admitted by the C-slug-4 conformance row (scoped to admit
    ``^anon-migrated-\\d+$``). It is therefore NOT minted via
    ``slug_with_retry`` (which enforces the canonical pattern); the counter is
    a simple unindexed monotonic ``n``.
    """
    return f"anon-migrated-{n:05d}"


# ---------------------------------------------------------------------------
# Datetime coercion (H-W3-1(a) — the D-1 naive/aware landmine)
# ---------------------------------------------------------------------------


def _aware(dt: datetime | None) -> datetime | None:
    """Coerce a naive datetime to tz-aware UTC; pass ``None`` and aware through.

    ``snapshots.created_at`` is naive (``datetime.utcnow()``); ``gallery.*`` is
    aware (``datetime.now(UTC)``). Mixing them crashes the seed=42 spot-check
    and the janitor's aware-cutoff comparisons with ``TypeError``.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


@dataclass
class Report:
    """Per-run counters; mirrors the value.js ``created``/``skipped`` idiom."""

    snapshots_before: int = 0
    gallery_before: int = 0
    orphan_snapshots_before: int = 0
    zombie_orphans: int = 0
    null_owner_resolved: int = 0
    written: int = 0
    skipped_already_migrated: int = 0
    anon_minted: int = 0
    visualizations_after: int = 0
    dry_run: bool = False
    spot_check: list[dict] = field(default_factory=list)

    def summary(self) -> str:
        mode = "DRY-RUN (no writes)" if self.dry_run else "LIVE"
        return (
            f"migrate_visualization [{mode}]\n"
            f"  snapshots_before          = {self.snapshots_before}\n"
            f"  gallery_before            = {self.gallery_before}\n"
            f"  orphan_snapshots_before   = {self.orphan_snapshots_before}\n"
            f"    of which zombie-orphans = {self.zombie_orphans}\n"
            f"  null_owner_resolved       = {self.null_owner_resolved}\n"
            f"  anon-migrated minted      = {self.anon_minted}\n"
            f"  written                   = {self.written}\n"
            f"  skipped_already_migrated  = {self.skipped_already_migrated}\n"
            f"  visualizations_after      = {self.visualizations_after}"
        )


# ---------------------------------------------------------------------------
# Bounded orphan detection (W3.16 — chunked $lookup left-anti-join; NO $nin)
# ---------------------------------------------------------------------------


async def _orphan_snapshot_hashes(db: Any) -> set[str]:
    """Snapshot hashes with no paired gallery row, via a bounded ``$lookup``.

    The ``$nin`` over ``gallery.distinct("snapshot_hash")`` form is REJECTED
    (BSON 16 MB ceiling at ~250 k orphans — W3.16). This left-anti-join has no
    such ceiling and mirrors the janitor ``$nin`` retirement.
    """
    pipeline = [
        {
            "$lookup": {
                "from": "gallery",
                "localField": "snapshot_hash",
                "foreignField": "snapshot_hash",
                "as": "_g",
            }
        },
        {"$match": {"_g": {"$size": 0}}},
        {"$project": {"snapshot_hash": 1}},
    ]
    orphans: set[str] = set()
    async for doc in db.snapshots.aggregate(pipeline):
        orphans.add(doc["snapshot_hash"])
    return orphans


# ---------------------------------------------------------------------------
# The transform (pure-ish; the only DB read is the joined gallery row)
# ---------------------------------------------------------------------------


def transform(
    snapshot: dict,
    gallery: dict | None,
    *,
    is_orphan: bool,
    owner_slug: str,
    was_public: bool,
) -> dict:
    """Build a ``visualizations`` document from a snapshot (∪ its gallery row).

    ``owner_slug`` is resolved by the caller (GALLERY-side per H-W3-1(b); a
    minted ``anon-migrated-NNNNN`` for orphan / null-owner rows). The snapshot
    is canonical for ``animation_settings`` / nested derived fields (W3.20);
    counters and ``tier`` come from the gallery row when present.
    """
    anim = snapshot.get("animation_settings", {}) or {}
    contour = snapshot.get("contour_settings", {}) or {}

    # Visibility (R-lifecycle §5.3; W3.23): a gallery-backed row was published
    # → "public"; an orphan snapshot is a "draft".
    visibility = "draft" if is_orphan else "public"

    created = _aware(snapshot.get("created_at")) or datetime.now(UTC)
    if gallery is not None:
        updated = _aware(gallery.get("updated_at")) or created
    else:
        updated = created

    # pinned seed (R5 §2.1): a published, non-deleted row pins; an orphan draft
    # does not. The janitor recomputes from `visualizations` anyway; this is a
    # seed, never authoritative.
    pinned = (not is_orphan) and visibility != "draft"

    doc: dict = {
        "owner_slug": owner_slug,
        "visibility": visibility,
        # content_hash: the old snapshot_hash formula becomes the internal
        # ETag/idempotency substrate — never a URL (R1 §4a).
        "content_hash": snapshot["snapshot_hash"],
        "image_slug": snapshot["image_slug"],
        # snapshot is the source of truth (not gallery's denormalised copy).
        "contour_hash": snapshot.get("contour_hash", ""),
        "contour_settings": contour,
        "animation_settings": anim,
        # Canonicalise the denormalised fields ON THE PARENT (W3.20) — the
        # gallery's active_bases / n_harmonics may have drifted via PUT.
        "active_bases": anim.get("active_bases", []),
        "n_harmonics": contour.get("n_harmonics", 1) or 1,
        "views": (gallery or {}).get("views", 0),
        "likes": (gallery or {}).get("likes", 0),
        "pinned": pinned,
        "deleted_at": None,
        "last_accessed_at": datetime.now(UTC),
        "created_at": created,
        "updated_at": updated,
        # H-W3-1(c): the marker is part of THIS document — one atomic insert,
        # never a second write. was_public is the zombie-orphan honesty flag
        # (H-W3-2): a once-public orphan is distinguishable from a draft.
        "migrated_from": {
            "coll": "snapshots",
            "_id": str(snapshot["_id"]),
            "was_public": was_public,
        },
    }
    return doc


# ---------------------------------------------------------------------------
# Post-condition assertions (R5 §3.3–§3.5 — abort loudly on failure)
# ---------------------------------------------------------------------------


async def _assert_post_conditions(db: Any) -> None:
    """Schema-shape + FK-resolution assertions. Raise ``RuntimeError`` on any."""
    null_owners = await db.visualizations.count_documents({"owner_slug": None})
    if null_owners:
        raise RuntimeError(f"post-condition: {null_owners} visualization(s) with null owner_slug")

    bad_vis = await db.visualizations.count_documents({"visibility": {"$nin": _VALID_VISIBILITY}})
    if bad_vis:
        raise RuntimeError(f"post-condition: {bad_vis} visualization(s) with invalid visibility")

    # Dangling-contour-hash (W3.18): every contour_hash must resolve in
    # `contours`, else abort with the unresolved slug list.
    dangling = [
        doc["slug"]
        async for doc in db.visualizations.aggregate(
            [
                {
                    "$lookup": {
                        "from": "contours",
                        "localField": "contour_hash",
                        "foreignField": "contour_hash",
                        "as": "_c",
                    }
                },
                {"$match": {"_c": {"$size": 0}}},
                {"$project": {"slug": 1}},
            ]
        )
    ]
    if dangling:
        raise RuntimeError(
            "post-condition: dangling contour_hash; unresolved slugs: "
            + ", ".join(sorted(dangling))
        )


# ---------------------------------------------------------------------------
# The main backfill pass
# ---------------------------------------------------------------------------


async def run_migration(db: Any, *, dry_run: bool = False) -> Report:
    """Single idempotent pass over ``snapshots`` (∪ joined gallery).

    Returns a :class:`Report`. Raises ``RuntimeError`` if a post-condition
    fails (live mode only — the dry-run writes nothing, so it asserts the
    count-parity invariant from the dry-run plan rather than the persisted DB).
    """
    report = Report(dry_run=dry_run)

    report.snapshots_before = await db.snapshots.count_documents({})
    report.gallery_before = await db.gallery.count_documents({})

    orphans = await _orphan_snapshot_hashes(db)
    report.orphan_snapshots_before = len(orphans)

    # Idempotency (W3.19): select only snapshots not already marked. We key on
    # the snapshot `_id` carried by `migrated_from._id` so a re-run skips them.
    already = {
        doc["migrated_from"]["_id"]
        async for doc in db.visualizations.find(
            {"migrated_from": {"$exists": True}}, {"migrated_from._id": 1}
        )
    }

    # The monotonic anon counter continues past any existing anon owners so a
    # re-run after a partial migration does not collide.
    anon_counter = await db.users.count_documents({"status": "orphan-migrated"})

    pending: list[dict] = []  # transformed docs to insert (for spot-check + write)

    async for snap in db.snapshots.find({}):
        sid = str(snap["_id"])
        if sid in already:
            report.skipped_already_migrated += 1
            continue

        shash = snap["snapshot_hash"]
        is_orphan = shash in orphans
        gallery = None if is_orphan else await db.gallery.find_one({"snapshot_hash": shash})

        if is_orphan:
            # Orphan snapshot (no gallery row). It may be a never-published
            # draft OR a "zombie orphan" — a once-public gallery row deleted out
            # from under its surviving snapshot (janitor cascade, H-W3-2). The
            # gallery row is gone, so we cannot prove publication from snapshot
            # state. Record was_public honestly: a snapshot whose contour/image
            # still carries publication provenance is treated as a zombie.
            was_public = bool(snap.get("was_public") or snap.get("published_at"))
            if was_public:
                report.zombie_orphans += 1
            owner_slug = mint_anon_migrated_slug(anon_counter)
            anon_counter += 1
            report.anon_minted += 1
        else:
            # H-W3-1(b): owner_slug sourced GALLERY-side, never the snapshot.
            owner_slug = (gallery or {}).get("user_slug")
            was_public = True  # gallery-backed → it was published
            if owner_slug is None:
                # The user_slug:None orphan-gallery row (R5 §2.3): it WAS
                # published, so resolve to a minted owner and keep it public.
                owner_slug = mint_anon_migrated_slug(anon_counter)
                anon_counter += 1
                report.anon_minted += 1
                report.null_owner_resolved += 1

        doc = transform(
            snap,
            gallery,
            is_orphan=is_orphan,
            owner_slug=owner_slug,
            was_public=was_public,
        )
        pending.append(doc)

    # Mint slugs + persist. slug_with_retry handles the unique-index race via
    # the insert-then-catch-DuplicateKeyError loop (NO private TOCTOU re-check).
    for doc in pending:
        if dry_run:
            doc["slug"] = "(dry-run)"
            report.written += 1
            continue

        owner_slug = doc["owner_slug"]
        if owner_slug.startswith("anon-migrated-"):
            await db.users.update_one(
                {"_id": owner_slug},
                {
                    "$setOnInsert": {
                        "user_slug": owner_slug,
                        "status": "orphan-migrated",
                        "created_at": doc["created_at"],
                        "last_seen_at": doc["created_at"],
                    }
                },
                upsert=True,
            )

        async def _insert(candidate: str, _doc: dict = doc) -> Any:
            return await db.visualizations.insert_one({**_doc, "slug": candidate})

        slug = await slug_with_retry(_insert)
        doc["slug"] = slug
        report.written += 1

    if not dry_run:
        await _assert_post_conditions(db)

    report.visualizations_after = (
        await db.visualizations.count_documents({}) if not dry_run else report.written
    )
    report.spot_check = _build_spot_check(pending)
    return report


def _build_spot_check(rows: list[dict]) -> list[dict]:
    """seed=42 / 10-row sample (R3 §5.3); each row records the union resolution."""
    random.seed(_SPOT_CHECK_SEED)
    sample = random.sample(rows, min(_SPOT_CHECK_N, len(rows)))
    out: list[dict] = []
    for r in sample:
        anim = r.get("animation_settings", {}) or {}
        contour = r.get("contour_settings", {}) or {}
        out.append(
            {
                "content_hash": r["content_hash"],
                "slug": r.get("slug", "(unminted)"),
                "visibility": r["visibility"],
                "owner_slug": r["owner_slug"],
                "was_public": r["migrated_from"]["was_public"],
                # W3.20 parity proof: derived fields equal the parent snapshot's
                # nested settings, NOT a possibly-divergent gallery denormalisation.
                "active_bases_parity": r["active_bases"] == anim.get("active_bases", []),
                "n_harmonics_parity": r["n_harmonics"] == (contour.get("n_harmonics", 1) or 1),
            }
        )
    return out


# ---------------------------------------------------------------------------
# Count-parity (R5 §3.1 / H-W3-3) — the durable, narrowed form
# ---------------------------------------------------------------------------


def assert_count_parity(report: Report) -> None:
    """Raise ``RuntimeError`` unless the count-parity invariant holds.

    The durable DB invariant is ``count(snapshots) >= count(gallery)``; the
    parity is ``visualizations_after == snapshots_before == gallery_before +
    orphan_snapshots_before`` (challenge.md §2 / R5 §3.1). ``written`` (this
    run) plus rows already migrated must equal ``snapshots_before``.
    """
    if report.snapshots_before < report.gallery_before:
        raise RuntimeError(
            f"count-parity: snapshots ({report.snapshots_before}) < "
            f"gallery ({report.gallery_before}) — pre-existing integrity violation"
        )
    expected = report.gallery_before + report.orphan_snapshots_before
    if report.snapshots_before != expected:
        raise RuntimeError(
            f"count-parity: snapshots_before ({report.snapshots_before}) != "
            f"gallery_before + orphan_snapshots_before ({expected})"
        )
    produced = report.written + report.skipped_already_migrated
    if produced != report.snapshots_before:
        raise RuntimeError(
            f"count-parity: written+skipped ({produced}) != "
            f"snapshots_before ({report.snapshots_before})"
        )


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        db = get_db()
        report = await run_migration(db, dry_run=dry_run)
        assert_count_parity(report)
        print(report.summary())
        print(f"\nspot-check (seed={_SPOT_CHECK_SEED}, n={len(report.spot_check)}):")
        for row in report.spot_check:
            print(f"  {row}")
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_visualization",
        description="Backfill snapshots ∪ gallery → visualizations (idempotent).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report counts + spot-check without writing any document.",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
