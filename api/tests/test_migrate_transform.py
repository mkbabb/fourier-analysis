"""W3.23 unit spec — the migration transform (no DB).

Covers the P2 narrowings (challenge.md §2 / H-W3-1..2) at the pure-transform
level: gallery+parent → visualization; orphan → draft + anon-migrated + pinned
False; zombie → was_public True; naive→aware datetime coercion; gallery-side
owner; W3.20 canonicalise-on-parent.
"""

from datetime import UTC, datetime

from bson import ObjectId

from api.scripts.migrate_visualization import (
    _aware,
    mint_anon_migrated_slug,
    transform,
)


def _snapshot(**over) -> dict:
    base = {
        "_id": ObjectId(),
        "snapshot_hash": "f" * 64,
        "image_slug": "tidy-paint-teal-otter",
        "contour_hash": "c" * 64,
        "contour_settings": {"n_harmonics": 200, "n_points": 1024},
        "animation_settings": {"active_bases": ["fourier-epicycles"], "fps": 30},
        # naive UTC, as snapshots.py:49 writes it
        "created_at": datetime(2026, 1, 2, 3, 4, 5),
    }
    base.update(over)
    return base


# ---------------------------------------------------------------------------
# anon-migrated slug minting (W3.17)
# ---------------------------------------------------------------------------


def test_mint_anon_migrated_slug_pattern():
    assert mint_anon_migrated_slug(0) == "anon-migrated-00000"
    assert mint_anon_migrated_slug(42) == "anon-migrated-00042"
    assert mint_anon_migrated_slug(12345) == "anon-migrated-12345"


def test_anon_migrated_violates_canonical_pattern_admits_exception():
    import re

    canonical = re.compile(r"^[a-z]+(-[a-z]+){3}$")
    scoped = re.compile(r"^anon-migrated-\d+$")
    slug = mint_anon_migrated_slug(7)
    assert canonical.fullmatch(slug) is None  # deliberately violates §2
    assert scoped.fullmatch(slug) is not None  # C-slug-4 exception admits it


# ---------------------------------------------------------------------------
# datetime coercion (H-W3-1(a))
# ---------------------------------------------------------------------------


def test_aware_coerces_naive_to_utc():
    naive = datetime(2026, 1, 1, 0, 0, 0)
    out = _aware(naive)
    assert out.tzinfo is not None
    assert out == datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)


def test_aware_passes_aware_through():
    aware = datetime(2026, 1, 1, tzinfo=UTC)
    assert _aware(aware) is aware


def test_aware_passes_none_through():
    assert _aware(None) is None


# ---------------------------------------------------------------------------
# gallery + parent → public visualization
# ---------------------------------------------------------------------------


def test_gallery_backed_is_public_owner_from_gallery():
    snap = _snapshot()
    gallery = {
        "snapshot_hash": snap["snapshot_hash"],
        "user_slug": "happy-paint-blue-cat",
        "views": 12,
        "likes": 3,
        # H-W3-1(b)/W3.20: drifted denormalisation must be IGNORED — the parent
        # snapshot is canonical for active_bases / n_harmonics.
        "active_bases": ["DRIFTED"],
        "n_harmonics": 999,
        "updated_at": datetime(2026, 2, 2, tzinfo=UTC),
    }
    doc = transform(
        snap, gallery, is_orphan=False, owner_slug="happy-paint-blue-cat", was_public=True
    )
    assert doc["visibility"] == "public"
    assert doc["owner_slug"] == "happy-paint-blue-cat"  # GALLERY-side
    assert doc["views"] == 12 and doc["likes"] == 3
    assert doc["pinned"] is True
    # W3.20 canonicalise-on-parent — NOT the gallery's drifted copy:
    assert doc["active_bases"] == ["fourier-epicycles"]
    assert doc["n_harmonics"] == 200
    # content_hash carries the old snapshot_hash (internal substrate, not URL):
    assert doc["content_hash"] == snap["snapshot_hash"]
    # naive snapshot.created_at coerced to aware:
    assert doc["created_at"].tzinfo is not None
    # marker is part of the doc (atomic; H-W3-1(c)):
    assert doc["migrated_from"]["coll"] == "snapshots"
    assert doc["migrated_from"]["_id"] == str(snap["_id"])
    assert doc["migrated_from"]["was_public"] is True


# ---------------------------------------------------------------------------
# orphan snapshot → draft + pinned False
# ---------------------------------------------------------------------------


def test_orphan_snapshot_is_draft_not_pinned():
    snap = _snapshot()
    doc = transform(
        snap, None, is_orphan=True, owner_slug=mint_anon_migrated_slug(0), was_public=False
    )
    assert doc["visibility"] == "draft"
    assert doc["owner_slug"] == "anon-migrated-00000"
    assert doc["pinned"] is False
    assert doc["views"] == 0 and doc["likes"] == 0
    assert doc["migrated_from"]["was_public"] is False  # never-published draft
    assert doc["deleted_at"] is None


# ---------------------------------------------------------------------------
# zombie orphan → was_public True (H-W3-2 honesty marker)
# ---------------------------------------------------------------------------


def test_zombie_orphan_carries_was_public_true():
    # A once-public gallery row was deleted out from under this snapshot
    # (janitor cascade). Snapshot-side provenance survives.
    snap = _snapshot(published_at=datetime(2025, 12, 1))
    doc = transform(
        snap, None, is_orphan=True, owner_slug=mint_anon_migrated_slug(1), was_public=True
    )
    assert doc["visibility"] == "draft"  # collapsed to draft (no gallery row)
    assert doc["migrated_from"]["was_public"] is True  # but distinguishable
    # The honesty contract: a once-public zombie is NOT silently the same as a
    # never-published draft.
    never_published = transform(
        _snapshot(), None, is_orphan=True, owner_slug="anon-migrated-00002", was_public=False
    )
    assert doc["migrated_from"]["was_public"] != never_published["migrated_from"]["was_public"]
