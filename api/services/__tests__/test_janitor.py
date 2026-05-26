"""Regression test for the janitor's pinned-set inversion (Tranche A.W4.a).

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
predicate. This test asserts:

  1. No ``$nin`` operator appears in any janitor query (the BSON-limit hazard
     is gone outright — invariant 3, no legacy code paths kept as fallback).
  2. Each delete query references the ``pinned: False`` predicate.
  3. Under a populated fake DB, the janitor selects unpinned-old documents
     and skips pinned ones — the policy is preserved end-to-end.
  4. The pin-flag recompute is idempotent: invoking it twice yields the same
     state (this doubles as the migration-backfill check — running the
     janitor against documents missing the ``pinned`` field is safe).
"""

from __future__ import annotations

import asyncio
import copy
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from api.services import janitor


# ---------------------------------------------------------------------------
# Minimal async fake of motor's collection / database interface
# ---------------------------------------------------------------------------


class _AsyncCursor:
    """Async iterator over a pre-materialised list of documents.

    Supports the subset motor's cursor exposes that the janitor consumes —
    ``async for``, ``.sort(field, direction)``.
    """

    def __init__(self, docs: list[dict]) -> None:
        self._docs = list(docs)

    def sort(self, field: str, direction: int = 1) -> "_AsyncCursor":
        self._docs.sort(key=lambda d: d.get(field), reverse=(direction == -1))
        return self

    def __aiter__(self) -> "_AsyncCursor":
        return self

    async def __anext__(self) -> dict:
        if not self._docs:
            raise StopAsyncIteration
        return self._docs.pop(0)


class _DeleteResult:
    def __init__(self, deleted_count: int) -> None:
        self.deleted_count = deleted_count


class _UpdateResult:
    def __init__(self, matched_count: int, modified_count: int) -> None:
        self.matched_count = matched_count
        self.modified_count = modified_count


class FakeCollection:
    """In-memory async collection covering the janitor's call surface."""

    def __init__(self, name: str, docs: list[dict], spy: "QuerySpy") -> None:
        self.name = name
        self.docs: list[dict] = [copy.deepcopy(d) for d in docs]
        self._spy = spy

    # --- predicate evaluation -------------------------------------------------

    def _matches(self, doc: dict, filt: dict) -> bool:
        for k, v in filt.items():
            if isinstance(v, dict):
                for op, arg in v.items():
                    if op == "$lt":
                        if not (doc.get(k) is not None and doc[k] < arg):
                            return False
                    elif op == "$in":
                        if doc.get(k) not in arg:
                            return False
                    elif op == "$nin":
                        if doc.get(k) in arg:
                            return False
                    elif op == "$ne":
                        if doc.get(k) == arg:
                            return False
                    elif op == "$exists":
                        present = k in doc
                        if bool(arg) != present:
                            return False
                    else:
                        raise NotImplementedError(f"FakeCollection op: {op}")
            else:
                if doc.get(k) != v:
                    return False
        return True

    # --- public motor surface -------------------------------------------------

    def find(self, filt: dict, projection: dict | None = None) -> _AsyncCursor:
        self._spy.record(self.name, "find", filt)
        matches = [copy.deepcopy(d) for d in self.docs if self._matches(d, filt)]
        return _AsyncCursor(matches)

    async def delete_many(self, filt: dict) -> _DeleteResult:
        self._spy.record(self.name, "delete_many", filt)
        kept: list[dict] = []
        removed = 0
        for d in self.docs:
            if self._matches(d, filt):
                removed += 1
            else:
                kept.append(d)
        self.docs = kept
        return _DeleteResult(deleted_count=removed)

    async def update_many(self, filt: dict, update: dict) -> _UpdateResult:
        self._spy.record(self.name, "update_many", filt)
        matched = 0
        for d in self.docs:
            if self._matches(d, filt):
                matched += 1
                if "$set" in update:
                    d.update(update["$set"])
        return _UpdateResult(matched_count=matched, modified_count=matched)

    async def distinct(self, field: str, filt: dict | None = None) -> list[Any]:
        f = filt or {}
        self._spy.record(self.name, "distinct", f)
        out: list[Any] = []
        seen: set[Any] = set()
        for d in self.docs:
            if self._matches(d, f):
                v = d.get(field)
                if v is not None and v not in seen:
                    seen.add(v)
                    out.append(v)
        return out

    def aggregate(self, pipeline: list[dict]) -> _AsyncCursor:
        self._spy.record(self.name, "aggregate", pipeline)
        # Drive the pin-recompute pipeline shape (the only aggregation the
        # janitor uses today). Detect the $merge sink and apply pinned=true
        # to the target collection.
        merge_stage = next(
            (st for st in pipeline if "$merge" in st), None
        )
        if merge_stage is None:
            # Storage-budget aggregation: $group sum of bytes
            total = sum(d.get("bytes", 0) for d in self.docs)
            return _AsyncCursor([{"_id": None, "total_bytes": total}])

        # Recompute pipeline: gather $group key and any $unionWith source.
        target_name = merge_stage["$merge"]["into"]
        merge_key = merge_stage["$merge"]["on"]

        key_field_for_source = self._infer_pin_key(pipeline)

        # Collect ids from the leading source (self.docs) under the pipeline's
        # match predicates, plus the $unionWith side if present.
        ids: set = set()
        for d in self.docs:
            if self._pipeline_matches_source(d, pipeline):
                v = d.get(key_field_for_source)
                if v is not None:
                    ids.add(v)
        union = next((st["$unionWith"] for st in pipeline if "$unionWith" in st), None)
        if union is not None:
            union_coll = self._spy.db[union["coll"]]
            union_match = next(
                (
                    st["$match"]
                    for st in union["pipeline"]
                    if "$match" in st and "tier" in st["$match"]
                ),
                {},
            )
            for d in union_coll.docs:
                if union_coll._matches(d, union_match):
                    v = d.get(key_field_for_source)
                    if v is not None:
                        ids.add(v)

        target = self._spy.db[target_name]
        for d in target.docs:
            if d.get(merge_key) in ids:
                d["pinned"] = True
        return _AsyncCursor([])

    @staticmethod
    def _infer_pin_key(pipeline: list[dict]) -> str:
        # The leading $group's _id expression is "$<field>"
        first_group = next(st["$group"] for st in pipeline if "$group" in st)
        expr = first_group["_id"]
        if isinstance(expr, str) and expr.startswith("$"):
            return expr[1:]
        raise ValueError(f"Unexpected $group _id: {expr!r}")

    def _pipeline_matches_source(self, doc: dict, pipeline: list[dict]) -> bool:
        # Apply any $match stages that precede a $group/$unionWith on the
        # source side. For our pipelines there are no leading $match stages
        # on the snapshots source (it's the gallery side that filters by tier).
        for st in pipeline:
            if "$group" in st or "$unionWith" in st:
                break
            if "$match" in st:
                if not self._matches(doc, st["$match"]):
                    return False
        return True


class QuerySpy:
    """Records every query made by the janitor for assertion."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, str, Any]] = []
        self.db: dict[str, FakeCollection] = {}

    def record(self, coll: str, op: str, filt: Any) -> None:
        self.calls.append((coll, op, copy.deepcopy(filt)))

    def queries_against(self, coll: str, op: str) -> list[Any]:
        return [f for (c, o, f) in self.calls if c == coll and o == op]


class FakeDB:
    """Maps ``db.<collection>`` attribute access to FakeCollection."""

    def __init__(self, collections: dict[str, list[dict]]) -> None:
        self._spy = QuerySpy()
        for name, docs in collections.items():
            self._spy.db[name] = FakeCollection(name, docs, self._spy)

    def __getattr__(self, name: str) -> FakeCollection:
        if name in {"_spy"}:
            raise AttributeError(name)
        return self._spy.db.setdefault(
            name, FakeCollection(name, [], self._spy)
        )

    @property
    def spy(self) -> QuerySpy:
        return self._spy


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _fresh_db() -> FakeDB:
    old = datetime.now(UTC) - timedelta(days=400)  # well past the 90d cutoff
    fresh = datetime.now(UTC)

    return FakeDB(
        {
            "contours": [
                # An old contour pinned by a snapshot — must survive.
                {"contour_hash": "C_PINNED_BY_SNAP", "last_accessed_at": old},
                # An old contour pinned by a featured gallery row — must survive.
                {"contour_hash": "C_PINNED_BY_GALLERY", "last_accessed_at": old},
                # An old unpinned contour — must be deleted.
                {"contour_hash": "C_UNPINNED_OLD", "last_accessed_at": old},
                # A fresh unpinned contour — must survive (cutoff guard).
                {"contour_hash": "C_UNPINNED_FRESH", "last_accessed_at": fresh},
            ],
            "images": [
                {"image_slug": "I_PINNED_BY_SNAP", "last_accessed_at": old, "bytes": 100},
                {"image_slug": "I_PINNED_BY_GALLERY", "last_accessed_at": old, "bytes": 100},
                {"image_slug": "I_UNPINNED_OLD", "last_accessed_at": old, "bytes": 100},
                {"image_slug": "I_UNPINNED_FRESH", "last_accessed_at": fresh, "bytes": 100},
            ],
            "snapshots": [
                {
                    "snapshot_hash": "S1",
                    "contour_hash": "C_PINNED_BY_SNAP",
                    "image_slug": "I_PINNED_BY_SNAP",
                },
            ],
            "gallery": [
                {
                    "snapshot_hash": "S_GAL",
                    "contour_hash": "C_PINNED_BY_GALLERY",
                    "image_slug": "I_PINNED_BY_GALLERY",
                    "tier": "featured",
                },
                # A "normal" tier gallery entry must NOT pin (policy preserved).
                {
                    "snapshot_hash": "S_NORMAL",
                    "contour_hash": "C_UNPINNED_OLD",
                    "image_slug": "I_UNPINNED_OLD",
                    "tier": "normal",
                },
            ],
            "sessions": [],
            "users": [],
            "flags": [],
            "admin_audit": [],
        }
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class _FakeSettings:
    asset_max_age_days = 90
    user_max_age_days = 365
    storage_budget_gb = 1000  # high — no budget eviction in these fixtures


@pytest.fixture(autouse=True)
def _patch_settings_and_db(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch ``get_settings`` and ``get_db`` so the janitor sees the fake DB."""
    db = _fresh_db()
    monkeypatch.setattr(janitor, "get_settings", lambda: _FakeSettings())
    monkeypatch.setattr(janitor, "get_db", lambda: db)
    # Stash the fake on the module so individual tests can grab it.
    monkeypatch.setattr(janitor, "_test_db", db, raising=False)


def _run_cycle() -> FakeDB:
    asyncio.run(janitor._cleanup_cycle())
    return janitor._test_db  # type: ignore[attr-defined]


class TestJanitorNoUnboundedNin:
    """The hard-gate assertion: the janitor's queries contain no ``$nin``."""

    def test_no_nin_operator_anywhere(self) -> None:
        db = _run_cycle()
        for _coll, _op, filt in db.spy.calls:
            assert "$nin" not in _stringify(filt), (
                f"Janitor query unexpectedly used $nin (the W4.a inversion "
                f"forbids it — see api/services/janitor.py). Offending call: "
                f"{_coll}.{_op}({filt!r})."
            )

    def test_delete_queries_use_pinned_false_predicate(self) -> None:
        db = _run_cycle()
        contour_deletes = db.spy.queries_against("contours", "delete_many")
        image_deletes = db.spy.queries_against("images", "delete_many")

        assert contour_deletes, "Janitor must issue a delete_many on contours."
        assert image_deletes, "Janitor must issue a delete_many on images."

        for filt in contour_deletes + image_deletes:
            assert filt.get("pinned") is False, (
                "Janitor delete must filter on the indexed pinned=False "
                f"predicate; got {filt!r}."
            )
            assert "last_accessed_at" in filt, (
                f"Janitor delete must retain the age cutoff; got {filt!r}."
            )


class TestJanitorPinPolicyPreserved:
    """End-to-end: pinned old assets survive; unpinned old assets are deleted."""

    def test_pinned_assets_survive_unpinned_old_assets_deleted(self) -> None:
        db = _run_cycle()
        contour_hashes = {d["contour_hash"] for d in db.contours.docs}
        image_slugs = {d["image_slug"] for d in db.images.docs}

        # Pinned by snapshot → survives.
        assert "C_PINNED_BY_SNAP" in contour_hashes
        assert "I_PINNED_BY_SNAP" in image_slugs
        # Pinned by featured gallery row → survives.
        assert "C_PINNED_BY_GALLERY" in contour_hashes
        assert "I_PINNED_BY_GALLERY" in image_slugs
        # Unpinned + old → deleted.
        assert "C_UNPINNED_OLD" not in contour_hashes
        assert "I_UNPINNED_OLD" not in image_slugs
        # Unpinned + fresh → survives (cutoff guard).
        assert "C_UNPINNED_FRESH" in contour_hashes
        assert "I_UNPINNED_FRESH" in image_slugs

    def test_pinned_flag_persisted_on_survivors(self) -> None:
        db = _run_cycle()
        # The recompute IS the migration: every surviving doc now carries an
        # explicit ``pinned`` field (no legacy ``$exists: false`` documents).
        for d in db.contours.docs:
            assert "pinned" in d, f"Contour missing pinned field: {d!r}"
        for d in db.images.docs:
            assert "pinned" in d, f"Image missing pinned field: {d!r}"


class TestJanitorRecomputeIdempotent:
    """Running the cycle twice yields the same state — backfill is idempotent."""

    def test_two_cycles_same_state(self) -> None:
        db = _run_cycle()
        state_after_first = {
            "contours": sorted(d["contour_hash"] for d in db.contours.docs),
            "images": sorted(d["image_slug"] for d in db.images.docs),
            "contour_pins": sorted(
                d["contour_hash"] for d in db.contours.docs if d.get("pinned")
            ),
            "image_pins": sorted(
                d["image_slug"] for d in db.images.docs if d.get("pinned")
            ),
        }

        asyncio.run(janitor._cleanup_cycle())
        state_after_second = {
            "contours": sorted(d["contour_hash"] for d in db.contours.docs),
            "images": sorted(d["image_slug"] for d in db.images.docs),
            "contour_pins": sorted(
                d["contour_hash"] for d in db.contours.docs if d.get("pinned")
            ),
            "image_pins": sorted(
                d["image_slug"] for d in db.images.docs if d.get("pinned")
            ),
        }
        assert state_after_first == state_after_second


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _stringify(obj: Any) -> str:
    """Recursive repr that exposes any nested ``$nin`` keys to substring search."""
    if isinstance(obj, dict):
        return "{" + ",".join(f"{k!r}:{_stringify(v)}" for k, v in obj.items()) + "}"
    if isinstance(obj, list):
        return "[" + ",".join(_stringify(v) for v in obj) + "]"
    return repr(obj)
