# R-lifecycle-spec — A4 lifecycle / soft-delete / cron / migration / image-blob

Repo: `fourier-analysis` · Date: 2026-05-19 · Mode: READ-ONLY research; the deliverable is a specification proposal that drops cleanly into `coordination/CRUD-CONTRACT.md §4 + §5 + §8 + §11` (ratified at the W1 — CRUD-contract ratification wave; per `coordination/CRUD-CONSTELLATION.md:121-128`).

Cohort scope: fourier-analysis ⇄ value.js (peer; not substrate / consumer). Every assertion in this document is binding on **both** repos unless explicitly marked per-repo. Cite form is `file:line` against the respective repo root.

Inputs verified in full: `api/services/janitor.py`, `api/services/image_storage.py`, `api/services/rate_limiter.py`, `api/services/database.py`, `api/routers/{snapshots,gallery,sessions,admin}.py`, `api/models/{gallery,session,shared,assets}.py`, `~/Programming/value.js/api/src/cron.ts`, `~/Programming/value.js/api/src/migrate-slugs.ts`, `~/Programming/value.js/api/src/migrate-oklab.ts`, `~/Programming/value.js/api/src/routes/palettes.ts`, prior audits `e-crud-slug-valuejs.md` §1+§5, `h3-A-W4-W5-W6.md` §1, `h4-fourier-B.md` §3-§5, `h5-valuejs-C.md` §4-§5.

## Research-artefact discipline

This document is a *research artefact* — it records findings as of authoring time. The substance does not re-decide; the explication does. Every claim traces to a `file:line` citation; every ratified decision is preserved (the 3-state visibility, the `deleted_at` pattern over tombstone-collection, the in-process cron with the `pinned: bool` flag pattern, the @mkbabb migration idiom, the image-blob deferral to fourier-tranche-C all stand as decided).

## Goal criterion (research-artefact framing)

This research lane succeeds if the lifecycle surface — visibility, soft-delete, cron / TTL, migration discipline, the image-blob deferral — is bounded enough to populate `CRUD-CONTRACT.md §4 / §5 / §8 / §11` and `B.md §7 (cross-tranche debt)`, with the supporting §10 conformance-matrix rows named.

## Completion criterion (research-artefact framing)

The document closes when every divergence in §1's per-repo current-state table has an explicit decision, the §7 section-to-contract mapping resolves cleanly, and the citation summary in §8 is complete.

---

## 1. Current state — two-repo comparison

### 1.1 fourier (Python / FastAPI / Motor)

| Concern | Today (verified) |
|---|---|
| Visibility model | None. The two-state proxy is the `gallery` collection's *existence* of a row (`api/routers/gallery.py:199-244`): publish → `tier="normal"`, admin promote → `tier in {featured, saved}`. "Drafts" live only in IndexedDB (`web/src/lib/draftStorage.ts`); they never reach the server. There is no `visibility` field anywhere in `api/models/**`. |
| Soft-delete | **Absent.** Every delete is hard: `gallery.py:311` `db.gallery.delete_one`; `admin.py:157` `db.gallery.delete_one`; `janitor.py:60,70,128,144,152,162,172,177` all `delete_many`. No `deleted_at` field exists in any model. No restoration path. |
| Cron / janitor | `api/services/janitor.py`: a 6 h asyncio loop (`:22`). Cleanup categories: stale contours (`:60` — **an unbounded `$nin`** over a `pinned_contours` set built from a full snapshot + gallery scan at `:39-53`); stale images + cascade (`:70-78` — the same `$nin` pattern); **storage-budget eviction** (`:84-119` — sorts oldest unpinned images, deletes until under `storage_budget_gb`); expired sessions (`:128`); stale users + cascade (`:131-173`); audit-log retention 90 d (`:176-179`). |
| Ownership | Mixed. Gallery rows have `user_slug` but publish admits `None` (`gallery.py:206` — `resolve_session` may return `None`; then `:232` writes `user_slug=None`). Snapshots / contours / images: no owner at all. |
| Migration discipline | None. There are no migration scripts under `api/scripts/`. Every model field has either a hard-coded default in the Pydantic class (e.g. `gallery.py:27` `views: int = 0`) or is implicitly tolerated as missing by Mongo. The closest precedent is the lazy `image_bounds` backfill at `api/dependencies.py:78` — a per-read patch, not a verified migration. |
| Image-blob storage | **Inline in Mongo.** `image_storage.py:97` `"blob": Binary(content)` and `:98` `"thumbnail": Binary(thumb_bytes)` both live in the `images` document. `storage_budget_gb` (`janitor.py:84-119`) is the eviction band-aid named in `e-crud-slug-valuejs.md §5.3` as a KISS-invariant-12 violation. |

### 1.2 value.js (Node / Hono / `palette-api`)

| Concern | Today (verified) |
|---|---|
| Visibility model | A `status` field on palettes (`api/src/routes/palettes.ts:412` `status: "published"`) — but the only value ever written is `"published"`, and `formatPalette` falls back as `status?: "published" | "featured"` (`demo/@/lib/palette/types.ts:23`). Effectively a single-state field; no `draft` or `unlisted` path. |
| Soft-delete | **Absent.** `routes/palettes.ts:491` `db.collection("palettes").deleteOne({ slug })` is a hard delete; `:492-493` cascades to votes and flags hard. No `deleted_at`. |
| Cron / janitor | `api/src/cron.ts` (29 lines total): expired sessions by `expiresAt` (`:9-11`); stale sessions by `lastSeenAt < 30 days ago` (`:14-16`); **orphaned votes** by `paletteSlug: { $nin: paletteSlugs }` (`:18-24`) — **the unbounded `$nin` pattern the fourier-A.W4 — image storage cleanup wave retired on fourier's side still ships here**. No grace-period hard-delete, no audit-retention, no cascade beyond votes. |
| Ownership | `userSlug` field on palettes (`routes/palettes.ts:411,486`). Anonymous publish path admitted via `sessionToken === sessionToken` check (`:486`) but `userSlug` may be `null` for sessionless publish. |
| Migration discipline | **Two precedents.** `migrate-slugs.ts` (74 lines, runnable via `npx tsx`, idempotent by skipping documents with existing `userSlug` at `:32-36`); `migrate-oklab.ts` (85 lines, query for documents missing field at `:53-58`, in-line CSS → OKLab, per-document `$set`). Both report counts; neither has a post-condition verification or a reversibility step. **The `formatPalette ?? []`-per-field fallback at `routes/palettes.ts:18-26` is invariant 17's named violation.** |
| Image-blob storage | N/A — value.js does not store image blobs. Palette payloads are tiny (≤ 50 colours × a few-hundred-byte CSS strings). |

### 1.3 The shape of convergence

Both repos already share the *idiom* — Mongo, slug identity, content hash, in-process cron, anonymous-permissive ownership. Neither has visibility states, soft-delete, or migration verification. fourier additionally carries the unbounded `$nin` + storage-budget pair; value.js carries the unbounded `$nin` + the per-field `??` fallback pair. The contract is one specification with two language implementations (invariant 16); the per-repo deltas in this document call out exactly which lines change in which repo.

---

## 2. Visibility state machine — §4

### 2.1 The three states (ratified)

| State | Semantic | Listed in public gallery? | Reachable by URL? | Writeable by owner? |
|---|---|---|---|---|
| `draft` | private working copy | no | only with `?token=<session>` header | yes |
| `unlisted` | shareable, not listed | no | yes (by slug) | yes |
| `public` | listed in gallery | yes | yes (by slug) | yes |

This is the 3-state form ratified at `B.md:31` and `coordination/CRUD-CONSTELLATION.md:45,121`. Supersedes audit E's `private / public` two-state proposal (`e-crud-slug-valuejs.md §4a`, `h4-fourier-B.md §3 line 53`). Stored as `visibility: "draft" | "unlisted" | "public"` on each `visualization` (fourier) / `palette` (value.js) document; **NOT NULL**, default `draft`.

### 2.2 Transitions

```
                     ┌───────────┐
                     │   draft   │
                     └───────────┘
                       │     │
                       │     │
              owner    │     │   owner
              publish  │     │   publish-unlisted
              (listed) │     │   (link-only)
                       ▼     ▼
                 ┌────────┐  ┌──────────┐
            ┌───►│ public │◄►│ unlisted │◄───┐
            │    └────────┘  └──────────┘    │
            │       │             │          │
            │       └────┐  ┌─────┘          │
            │            ▼  ▼                │
   admin    │       (any state)              │ owner
   delete   │            │                   │ unpublish
   (hard,   │            │ owner             │ (returns to
   bypasses │            │ soft-delete       │  draft)
   grace)   │            ▼                   │
            │    ┌───────────────┐           │
            │    │  deleted_at   │           │
            └────┤   (tombstone- ├───────────┘
                 │  none; record │  owner restore
                 │  retained N   │  (within grace)
                 │  days)        │
                 └───────────────┘
                         │ janitor
                         │ after grace
                         ▼
                    hard delete
                  (record purged)
```

| Transition | Caller | Auth required | Mongo update |
|---|---|---|---|
| `(create)` → `draft` | owner | session | `$set: { visibility: "draft", owner_slug, ... }` on insert |
| `draft` → `unlisted` | owner | session + owner match | `$set: { visibility: "unlisted", updated_at }` |
| `draft` → `public` | owner | session + owner match | `$set: { visibility: "public", published_at, updated_at }` |
| `unlisted` ↔ `public` | owner | session + owner match | same |
| `public` / `unlisted` → `draft` | owner | session + owner match | `$set: { visibility: "draft", updated_at }`; `$unset: { published_at }` |
| `*` → `deleted_at` set | owner | session + owner match | `$set: { deleted_at: now }` (see §3) |
| `deleted_at` cleared | owner | session + owner match (within grace) | `$unset: { deleted_at }` (see §3) |
| `*` → hard delete | admin | bearer | `db.<coll>.delete_one`; logs `admin_audit` (`api/routers/admin.py:50-59`) |
| `*` → suspended | admin | bearer | `users.status = "suspended"`; entity rows retained but excluded from public lists by ownership-suspend index filter (`h4-fourier-B.md §3.7`) |

### 2.3 Endpoint and list-filter contract

- `GET /api/visualizations` (no auth) — `find({ visibility: "public", deleted_at: null })`. Replaces both `gallery.py:78` `list_gallery` and `gallery.py:121` `list_gallery_cursor`.
- `GET /api/visualizations?owner=me` (session) — `find({ owner_slug: <session>, deleted_at: null })`; **all three visibility states** returned (the caller's own drafts + unlisted + public). Per `h4-fourier-B.md:184`.
- `GET /api/visualizations/{slug}` (no auth) — returns the document iff `visibility != "draft"` and `deleted_at == null`; else 404 unless the caller is the owner.
- `PATCH /api/visualizations/{slug}` (session + owner match) — accepts `{ visibility, ... }`; rejects `visibility` not in the enum at validation time.
- `DELETE /api/visualizations/{slug}` (session + owner match) — soft-deletes (sets `deleted_at`; see §3); does **not** call `db.<coll>.delete_one`.
- `POST /api/visualizations/{slug}/restore` (session + owner match, within grace) — clears `deleted_at`.

### 2.4 Indexes

```python
db.visualizations.create_index([("visibility", 1), ("deleted_at", 1), ("created_at", -1)])  # public list
db.visualizations.create_index([("owner_slug", 1), ("deleted_at", 1), ("updated_at", -1)])  # my list
db.visualizations.create_index("slug", unique=True)
db.visualizations.create_index("deleted_at", sparse=True)                                   # janitor hard-delete query
```

Conformance per `coordination/CRUD-CONSTELLATION.md:127` §10: integration test `test_visibility_list_filter` asserts unauthenticated `GET /api/visualizations` returns exclusively `visibility=public, deleted_at=null` rows. The same test on value.js: `palette-visibility-list-filter.test.ts`.

---

## 3. Soft-delete spec — §5

### 3.1 Pattern decision: `deleted_at` timestamp (NOT a tombstone-collection)

**Recommendation: `deleted_at: datetime | null` on the entity document.** Tombstone-collection rejected for this scale.

| Dimension | `deleted_at` field | Tombstone collection (audit info, original purged) |
|---|---|---|
| Restore cost | trivial (`$unset deleted_at`) | high (re-materialise from tombstone, regenerate dependent rows) |
| Storage cost | identical to live row × grace days | small (audit only) but loses the document |
| Query complexity | one extra predicate per list (`deleted_at: null`) covered by compound index | a `UNION` across two collections for any "show recently deleted" view |
| Implementation LOC | ~15 lines per entity (insert field, filter list, restore endpoint, janitor hard-delete) | ~60 lines (separate model, copy semantics, restore re-insert path) |
| Audit value | survives the grace; admin sees the live row marked deleted | dies with the grace expiry — only the audit row remains |
| Scale concern (> 1M / yr) | sparse index on `deleted_at` keeps query bounded | tombstone collection grows monotonically; eventually needs its own TTL |

For this scale (single-replica, < 1M docs / year per `coordination/CRUD-CONSTELLATION.md` cohort identity and audit E §5 "single MongoDB, single nginx" judgment as KISS-aligned), **`deleted_at` strictly dominates**. The tombstone variant is only justified when restorability is rare AND the live document is large enough that 30-day retention is itself a storage problem — neither holds. KISS — invariant 12.

### 3.2 Field and behaviour

- **Field**: `deleted_at: datetime | null`. `null` means alive. Set on soft-delete via `$set: { deleted_at: datetime.now(UTC) }`. Cleared on restore via `$unset: { deleted_at: "" }`.
- **Grace period**: **30 days** default (config: fourier `settings.soft_delete_grace_days`; value.js `process.env.SOFT_DELETE_GRACE_DAYS`). 30 days matches `session_ttl_days` and the existing `lastSeenAt` 30-day rule (`~/Programming/value.js/api/src/cron.ts:6`). Configurable per repo; identical default.
- **Restoration**: `POST /api/visualizations/{slug}/restore` (fourier) / `POST /api/palettes/:slug/restore` (value.js). Requires session + owner match. Rejects with 410 Gone if `deleted_at + grace_days < now`. Idempotent — restoring an alive document is a 200 no-op.
- **List filtering**: every list endpoint filters `{ deleted_at: null }`. Single-document GET returns 404 (not 410) for deleted documents to avoid leaking existence. Owner GET returns the deleted document with the `deleted_at` field populated.
- **Hard-delete invariant**: **only the cron janitor** and **admin actions** call `db.<coll>.delete_one` / `deleteOne`. The owner path **never** hard-deletes (replaces `api/routers/gallery.py:311` and `~/Programming/value.js/api/src/routes/palettes.ts:491`). Admin hard-delete logs `admin_audit` (matches the existing `api/routers/admin.py:161`).
- **Cascade on soft-delete**: nothing cascades on soft-delete itself — children (votes, likes, flags) remain. Hard-delete (cron after grace, or admin) cascades:
  - Votes / likes / flags pointing at the deleted entity → hard-deleted in the same cron pass.
  - Snapshots / contours that become unreferenced after the entity is purged → eligible for cron prune in the *next* cycle by the `pinned` flag (§4.2 below).

### 3.3 Conformance assertion (§10 row)

- fourier: `api/tests/test_visualization_soft_delete.py::test_delete_then_restore_within_grace`, `::test_delete_past_grace_returns_410`, `::test_admin_delete_bypasses_grace`.
- value.js: `api/test/palette-soft-delete.test.ts::delete_then_restore_within_grace`, etc.
- Grep proof: `grep -rE "delete_(one|many)|deleteOne|deleteMany" api/ | grep -v janitor | grep -v admin` returns zero hits outside janitor + admin. The grep is the §10 mechanical gate.

---

## 4. Cron / TTL canonical pattern — §8

### 4.1 Mechanism choice: in-process cron (asyncio / Node interval)

| Option | Verdict |
|---|---|
| **A. In-process cron** (today's `api/services/janitor.py:15-22` 6 h `asyncio.sleep` loop; the equivalent Node `setInterval` in value.js) | **CHOSEN.** The smallest honest mechanism. Already shipped. Survives single-replica (the deployment constraint already documented at `docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §5 Option A`). Six-hour cadence is loose enough that scheduler drift is irrelevant. |
| B. Mongo TTL indexes | Tempting (`expires_at` index on sessions already uses this idiom at `api/services/database.py:60-65`). **Rejected for entity hard-delete** because TTL-purge gives no audit (`admin_audit` would receive nothing), no cascade (Mongo TTL deletes one row at a time, no hook), and no grace-tunable knob outside index recreation. **Kept for sessions** (where audit is irrelevant and the cascade is one-direction) — see §4.4. |
| C. `temporal.io` / `inngest` / k8s `CronJob` | Rejected — invariant 12 (no superfluous cloud). Both repos run on a single host; introducing a workflow engine is the contrivance the brief forbids. |
| D. External cron + `curl` to an admin endpoint | Rejected — adds an external dependency for a 6-hour wakeup. The in-process path already runs. |

The contract pins **option A**. value.js's `cron.ts` already uses `setInterval` implicitly via the host process; the contract requires `cron.ts` to be wrapped in an explicit `setInterval(cleanup, 6 * 3600 * 1000)` matching fourier's cadence (today `cron.ts` exports `cleanup()` but does not self-schedule — the caller does, per `~/Programming/value.js/api/src/index.ts`).

### 4.2 The canonical `pinned: bool` flag pattern

**The single load-bearing change.** Today fourier's `janitor.py:60-65` and `:70-78` build a Python `set` of *all* pinned `contour_hash` / `image_slug` from a full snapshot + gallery scan, then pass it as `{"$nin": list(...)}`. value.js's `cron.ts:18-24` does the same for orphaned votes (`distinct("slug")` → `$nin: paletteSlugs`). Both patterns:

1. **Cannot use an index** for large `$nin` arrays (Mongo's query planner falls back to collection scan above ~1000 array elements; cite: Mongo docs, MongoDB Server-15833 ticket discussion).
2. **Can exceed the 16 MB BSON limit** on the *query document itself* as the pinned set grows.
3. **Force two collection scans** (build the pinned set, then run the prune).

**Canonical pattern: a per-document `pinned: bool` flag, maintained on write.**

```python
# fourier — every contour / image carries a pinned bool, updated on snapshot/gallery write.
db.contours.update_one(
    {"contour_hash": h},
    {"$setOnInsert": {..., "pinned": False}, "$set": {"last_accessed_at": now}},
    upsert=True,
)
# On snapshot publish or gallery promote:
db.contours.update_one({"contour_hash": h}, {"$set": {"pinned": True}})
db.images.update_one({"image_slug": s}, {"$set": {"pinned": True}})
# On gallery unpublish (soft-delete grace expiry → hard delete → cascade):
# recompute pin from remaining references; if zero, set pinned=False.
```

**Janitor query becomes**:

```python
await db.contours.delete_many({
    "last_accessed_at": {"$lt": cutoff},
    "pinned": False,
})
```

Bounded. Uses the compound index `(pinned, last_accessed_at)`. Janitor body shrinks from ~120 lines to ~40.

**value.js equivalent**:

```ts
// Replace cron.ts:18-24 (the orphan-vote $nin).
// Walk votes; check the palette exists. With ≤ 1M votes the cursor is cheap.
const orphanedSlugs: string[] = [];
const voteSlugs = await db.collection("votes").distinct("paletteSlug");
for (const slug of voteSlugs) {
    const exists = await db.collection("palettes").findOne({ slug }, { projection: { _id: 1 } });
    if (!exists) orphanedSlugs.push(slug);
}
if (orphanedSlugs.length > 0) {
    await db.collection("votes").deleteMany({ paletteSlug: { $in: orphanedSlugs } });
}
```

`$in` over a *bounded* set (the orphaned slugs only) is index-friendly. The alternative — and equivalent — form is a per-palette `vote_count` field already maintained; when a palette is hard-deleted, cascade its votes (`routes/palettes.ts:492` already does this for owner-delete; the cron path needs the same cascade hook from the janitor's hard-delete-past-grace step).

### 4.3 Index for the canonical pattern

```python
# fourier:
db.contours.create_index([("pinned", 1), ("last_accessed_at", 1)])  # janitor query
db.images.create_index([("pinned", 1), ("last_accessed_at", 1)])
# Existing indexes (api/services/database.py:42-50) are retained.
```

```ts
// value.js api/src/db.ts (alongside the existing index definitions):
await db.collection("palettes").createIndex({ deleted_at: 1, visibility: 1, createdAt: -1 });
// Votes already keyed by (userSlug, paletteSlug) unique; the orphan-vote sweep needs no new index.
```

### 4.4 Cron pass categories (after convergence)

| Category | Query shape (post-convergence) | Frequency |
|---|---|---|
| Sessions expired | `db.sessions.delete_many({ expires_at: {$lt: now} })` — fourier (`janitor.py:128`); equivalent value.js (`cron.ts:9-11`) | every 6 h |
| Sessions stale | `db.sessions.delete_many({ last_seen_at: {$lt: cutoff_30d} })` — value.js (`cron.ts:14-16`); add to fourier | every 6 h |
| Soft-deleted past grace | `db.<entity>.delete_many({ deleted_at: {$lt: now - grace_days} })` — cascades to votes / likes / flags (§3.2 cascade list) | every 6 h |
| Stale contours / images | `db.<asset>.delete_many({ pinned: false, last_accessed_at: {$lt: cutoff} })` — replaces `janitor.py:60-78` | every 6 h |
| Stale users + cascade | `db.users.delete_many({ last_seen_at: {$lt: user_cutoff} })` — preceded by cascade of children (`janitor.py:131-173`) | every 6 h |
| Audit-log retention | `db.admin_audit.delete_many({ timestamp: {$lt: now - 90d} })` (`janitor.py:176-179`) — keep | every 6 h |
| **Storage-budget eviction** | **RETIRED** (`janitor.py:84-119`). The image-blob decision (§6) governs storage; band-aid eviction is invariant-12 violation as per `h4-fourier-B.md:226`. | n/a |

### 4.5 Sessions: optional TTL-index alternative

Sessions' `expires_at` already has the database index (`api/services/database.py:60-65`). The current code uses a *plain* index and the cron explicitly deletes. **Optional optimisation**: convert to a Mongo TTL index (`expireAfterSeconds: 0`) which lets Mongo purge expired sessions without cron involvement. The contract **does not require** this — both forms are conformant — but recommends it for sessions specifically because (a) sessions are never restored, (b) sessions have no audit requirement, (c) cascade is one-way (session → nothing). `database.py:60-65` already documents an OperationFailure path that recreates the index; converting to TTL is a one-line change.

### 4.6 Conformance assertion (§10 row)

- fourier: `api/tests/test_janitor_bounded_query.py::test_no_nin_in_janitor_source` — a grep-style assertion against the janitor source: `assert "$nin" not in open("api/services/janitor.py").read()`. Plus runtime: `test_pinned_flag_prevents_pruning` populates a pinned contour at `last_accessed_at: 100d ago` and asserts the janitor pass leaves it intact.
- value.js: `api/test/cron-bounded-query.test.ts::no_nin_in_cron_source` — same grep on `api/src/cron.ts`. The current source fails this test (`cron.ts:24`); the W3 — fourier visualization entity wave lands it on the fourier side; the value.js-C.W2 wave lands the value.js side (held DEFERRED under the orphan verdict).

---

## 5. Migration discipline — §11

### 5.1 The canonical migration shape (invariant 17)

A migration ships as **three artefacts**:

1. **Backfill script** — idempotent (re-runnable; no-op on second run); single file; runnable via the @mkbabb idiom (`npx tsx src/migrate-X.ts` for Node, `uv run python -m api.scripts.migrate_X` for Python).
2. **Verification harness** — a `verify_migration.py` / `verify-migration.ts` that runs the *post-condition* count check (e.g. "every visualization has a non-null `owner_slug`"; "every palette has the seven `formatPalette` defaults backfilled") and reports zero violations or fails the deploy.
3. **EITHER** a reversibility script (a separate `migrate-X-rollback.{ts,py}` that inverts the changes) **OR** a completeness proof in the migration's own output (the count-before / count-after / spot-check-diff that proves no data was lost). Invariant 17 admits both; `h5-valuejs-C.md §4.3` calls the latter "the migration-safety bar invariant 17 admits."

Per-field `??` fallbacks (`~/Programming/value.js/api/src/routes/palettes.ts:18-26`; fourier has no equivalent today, but the `Pydantic field defaults` at `api/models/gallery.py:25-30` play the same role) are **retired in the same commit** as the migration script that backfills them. The deletion of the fallback is the gate (`h5-valuejs-C.md §4.4`).

### 5.2 The @mkbabb migration idiom (precedent from value.js)

Extracted from `~/Programming/value.js/api/src/migrate-slugs.ts` and `migrate-oklab.ts` (both verified in full):

1. Single file, `api/src/migrate-<noun>.ts` (Node) / `api/scripts/migrate_<noun>.py` (Python).
2. `import "dotenv/config"` first (Node) / load env first (Python).
3. **Idempotent by query** — the filter selects only documents *missing* the new field (`migrate-oklab.ts:53-58`) or *already-different* from the target. Re-running is a no-op once converged.
4. Progress logs — per-document log line OR per-batch progress; final summary with counts.
5. Top-level `migrate()` wrapped in `.catch(err => { console.error; process.exit(1) })`.
6. Reuse the API's DB wiring (`getDb()` from `./db.js` or `api.services.database.get_db()`).
7. **No DB transactions** — both repos run single-replica Mongo; idempotency replaces atomicity.

### 5.3 Canonical migration script — Python form (the W3 — fourier visualization entity wave's example)

```python
# api/scripts/migrate_visualization.py
#
# Backfill: collapse `snapshots` + `gallery` into one `visualizations` collection.
# Idempotent. Re-running is a no-op once converged.
#
# Usage: uv run python -m api.scripts.migrate_visualization
"""One-time migration: build visualizations from snapshots + gallery rows."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from dataclasses import dataclass, field

from api.services.database import connect_db, close_db, get_db
from api.slugs import generate_slug

logger = logging.getLogger("migrate_visualization")


@dataclass
class Report:
    snapshots_seen: int = 0
    gallery_seen: int = 0
    visualizations_written: int = 0
    per_field_backfilled: dict[str, int] = field(default_factory=dict)
    spot_check: list[dict] = field(default_factory=list)
    skipped_already_migrated: int = 0


async def migrate() -> Report:
    db = get_db()
    report = Report()

    pre_snapshots = await db.snapshots.count_documents({})
    pre_gallery = await db.gallery.count_documents({})

    async for snap in db.snapshots.find({}):
        report.snapshots_seen += 1

        # Find a paired gallery row (if any) — gallery.snapshot_hash references snapshots.
        gallery = await db.gallery.find_one({"snapshot_hash": snap["snapshot_hash"]})
        if gallery is not None:
            report.gallery_seen += 1

        # Idempotency: skip if a visualization for this snapshot_hash already exists.
        existing = await db.visualizations.find_one({"source_snapshot_hash": snap["snapshot_hash"]})
        if existing is not None:
            report.skipped_already_migrated += 1
            continue

        owner_slug = (gallery or {}).get("user_slug")
        # Owner-required invariant 14: surface the orphan path now, do not silently default.
        if owner_slug is None and gallery is not None:
            logger.warning(
                "orphan gallery entry %s — assigning to deterministic 'orphan-archive' user",
                gallery.get("snapshot_hash"),
            )
            owner_slug = "orphan-archive"  # bound to a real (admin-managed) user

        visibility = "public" if gallery is not None else "draft"
        slug = generate_slug()
        # Unique-slug retry (matches api/services/image_storage.py:76 idiom).
        while await db.visualizations.find_one({"slug": slug}):
            slug = generate_slug()

        viz_doc = {
            "slug": slug,
            "owner_slug": owner_slug,
            "visibility": visibility,
            "deleted_at": None,
            "image_slug": snap["image_slug"],
            "contour_hash": snap["contour_hash"],
            "contour_settings": snap["contour_settings"],
            "animation_settings": snap["animation_settings"],
            "source_snapshot_hash": snap["snapshot_hash"],   # dedup key
            "tier": (gallery or {}).get("tier", "normal"),
            "views": (gallery or {}).get("views", 0),
            "likes": (gallery or {}).get("likes", 0),
            "liked_ips": (gallery or {}).get("liked_ips", []),
            "active_bases": snap["animation_settings"].get("active_bases", []),
            "n_harmonics": snap["contour_settings"].get("n_harmonics", 0),
            "created_at": snap["created_at"],
            "updated_at": (gallery or {}).get("updated_at", snap["created_at"]),
            "published_at": (gallery or {}).get("created_at") if gallery else None,
            "pinned": gallery is not None and gallery.get("tier") in {"featured", "saved"},
        }

        await db.visualizations.insert_one(viz_doc)
        report.visualizations_written += 1

        # Spot-check sample of 10
        if len(report.spot_check) < 10:
            report.spot_check.append({
                "snapshot_hash": snap["snapshot_hash"],
                "viz_slug": slug,
                "visibility": visibility,
                "owner": owner_slug,
            })

    # Post-condition checks (invariant 17 — verified, not hoped):
    null_owner_count = await db.visualizations.count_documents({"owner_slug": None})
    bad_visibility = await db.visualizations.count_documents(
        {"visibility": {"$nin": ["draft", "unlisted", "public"]}}
    )
    if null_owner_count > 0:
        raise RuntimeError(
            f"Migration incomplete: {null_owner_count} visualizations have null owner_slug"
        )
    if bad_visibility > 0:
        raise RuntimeError(
            f"Migration incomplete: {bad_visibility} visualizations have invalid visibility"
        )

    # Completeness proof: every snapshot is now represented OR an audit-logged skip.
    expected = pre_snapshots
    actual = report.visualizations_written + report.skipped_already_migrated
    if actual != expected:
        raise RuntimeError(
            f"Completeness check failed: {expected} snapshots vs {actual} visualizations + skips"
        )

    return report


async def main() -> None:
    await connect_db()
    try:
        report = await migrate()
        logger.info("Migration complete: %s", report)
        print(f"snapshots_seen={report.snapshots_seen}")
        print(f"visualizations_written={report.visualizations_written}")
        print(f"skipped_already_migrated={report.skipped_already_migrated}")
        print(f"spot_check={report.spot_check}")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
```

### 5.4 The value.js `formatPalette ?? []` retirement (palette-schema migration)

This is the named invariant-17 violation on the value.js side. Per `h5-valuejs-C.md §4.2`:

- **Backfill script**: `api/src/migrate-palette-schema.ts` — for each palette missing any of `tags`, `versionCount`, `forkCount`, `forkOf`, `forkOfHash`, `oklabColors`, `currentHash`, `$set` the default (or computed `currentHash` via `hash.ts:computeContentHash`).
- **Verification harness**: post-condition `countDocuments({ $or: [{tags: {$exists: false}}, {versionCount: {$exists: false}}, ...] })` returns 0; throws if not.
- **Retirement step (same commit)**: delete `routes/palettes.ts:18-26` lines (the seven `?? <default>` expressions); `formatPalette` body becomes the four lines shown in `h5-valuejs-C.md §4.4`.

The grep proof — `grep -nE "\?\? \[\]\| \?\? null\| \?\? 0\| \?\? 1" api/src/routes/palettes.ts` returns zero hits — is the §10 mechanical gate for invariant 17 on the value.js side.

### 5.5 Reversibility vs completeness-proof — choose per migration

| Migration | Reversibility | Completeness proof |
|---|---|---|
| `migrate_visualization.py` (the W3 — fourier visualization entity wave) | **Reversible via the source collections** — `snapshots` + `gallery` are *kept* during the brittleness window (`B.md §8`); rollback re-points reads at the old collections. Hard-cutover after the W3 close ceremony drops the old collections; from that point the migration is one-way and the **completeness proof** (counts + spot-check + post-condition assertions) discharges invariant 17. | The script's `RuntimeError` paths are the proof: zero null owners, valid visibility, count parity. |
| `migrate-palette-schema.ts` (the value.js-C.W2 wave; held DEFERRED under the orphan verdict) | **One-way** — backfilling a missing field does not require rollback (re-running with the field present is a no-op). | Post-condition `countDocuments` zero check at the script end. |
| Future per-field migrations | Default: one-way + completeness proof. Reversibility only if the field is being *removed* (rare). | The post-condition check is the gate; without it the migration is "hoped, not verified" — invariant 17 violation. |

### 5.6 Conformance assertion (§10 row)

- fourier: `api/tests/test_migration_visualization.py::test_idempotent_re_run`, `::test_post_condition_owner_required`, `::test_completeness_count_parity`.
- value.js: `api/test/migrate-palette-schema.test.ts::idempotent_re_run`, `::post_condition_no_missing_fields`, `::grep_formatPalette_has_no_double_question_mark` (the retirement proof).

---

## 6. Image-blob decision — defer to fourier tranche C

### 6.1 Verdict: **DEFER to fourier tranche C**, not admit to B.

Per `B.md §7` ("Deferred to tranche C: Image-blob-out-of-Mongo storage redesign — the Wα — research wave's lane R4 decides whether it is admitted to B's scope or deferred; the default is C"). This research confirms the **default** is correct: defer.

### 6.2 Rationale (KISS — invariant 12)

| Argument | Weight |
|---|---|
| **B's thesis is identity convergence, not storage architecture.** Tranche B's brief (`B.md §1`) is "one shared optimum for CRUD". The image-blob redesign is orthogonal — it does not require, nor block, the visibility / soft-delete / cron / migration convergence this spec proposes. Admitting it doubles B's scope. | high |
| **value.js has no image-blob story to converge with.** The cohort identity is *fourier ⇄ value.js*. value.js does not store image blobs; palettes are ≤ 50 colours. There is nothing to converge here at the cohort layer; this is a fourier-internal decision that has no peer-tranche counterpart. Including it in B would be a fourier-side scope inflation under the cohort banner. | high |
| **The band-aid is still operational.** `storage_budget_gb` eviction (`janitor.py:84-119`) currently works for the deployed scale. `h4-fourier-B.md §3.8` calls for its **retirement** as part of cron canonicalisation (§4 above), but retirement of the eviction-pass is not the same as relocation of the blobs — the eviction was already a band-aid; removing it merely surfaces the underlying storage question as a clean problem for tranche C. | medium |
| **Tranche A research already named the candidate set.** `e-crud-slug-valuejs.md §5.3`: "GridFS, or filesystem + path — but only when blob volume actually warrants it; flag, don't pre-optimize." The honest path: name the problem in B's `§7 Cross-tranche debt`, defer the design to C, do not pre-build. | high |

### 6.3 Named successor: **fourier tranche C** (storage architecture)

Tranche C is named in `B.md §7` as the destination for "Image-blob-out-of-Mongo storage redesign". This spec ratifies that destination. The proposed C-tranche scope:

- **Storage backend decision** — survey {GridFS (still Mongo, native binary chunked store), MinIO (self-hosted S3-compatible), Cloudflare R2 / AWS S3 / Backblaze B2 (managed S3), filesystem + nginx static serve}. Apply invariant 12: the smallest honest mechanism for the deployed scale. Default candidates (KISS-ordered): **filesystem + nginx static serve** (zero new infra; nginx already deployed per `nginx/fourier.conf`) > **GridFS** (still single-system, native, but loses the projection-leakage benefit) > **MinIO** (one new container, S3 API forward-compat) > managed S3 (the brief's "no superfluous cloud" gate).
- **Migration** — same shape as §5: backfill (move blobs from Mongo to the chosen backend; update each `images` document with a `storage_uri: str` field); verification (every `images` doc has either `blob` or `storage_uri`; never both; backend-side file count matches Mongo `storage_uri` count); reversibility (the Mongo `blob` field is the rollback target; kept until C close).
- **Janitor delta** — `storage_budget_gb` eviction deleted; the new backend is responsible for its own retention. Cron categories in §4.4 do not change.
- **API surface delta** — `GET /api/images/{slug}/blob` (`api/routers/images.py`) returns a redirect or streams from the new backend; the current `image_bytes(asset)` helper at `api/services/image_storage.py:113-117` becomes the migration boundary.

### 6.4 What the W3 — fourier visualization entity wave + the W4 — fourier convergence wiring wave still do for images

The image-blob redesign deferral does **not** mean images are untouched in B:

- The W3 — fourier visualization entity wave's migration script touches `images` to add the `pinned` flag (§4.2).
- The W3 carve converges `images` ownership onto the `visualization.image_slug` reference; images themselves remain owner-less but their *referencing* visualization carries the owner.
- The W4 — fourier convergence wiring wave wires the frontend to the converged `visualization` endpoint; image-upload / fetch endpoints are untouched.

The deferral is precisely scoped: **storage location**, not **storage identity** or **storage referencing**. Both are settled in B; only "where the bytes live" defers to C.

### 6.5 Cross-tranche debt entry (drops into `B.md §7`)

> **Deferred to fourier tranche C** — Image-blob-out-of-Mongo storage redesign. `api/services/image_storage.py:97-98` keeps blobs inline in Mongo; `janitor.py:84-119` `storage_budget_gb` eviction is the band-aid that the W3 — fourier visualization entity wave **retires** (per §4 canonical cron). The storage-location decision (GridFS / MinIO / filesystem-+-CDN / managed S3) lands in fourier-tranche-C with the migration shape per `R-lifecycle-spec.md §6`. value.js has no peer side of this work; this is fourier-only successor scope.

---

## 7. Section-to-contract mapping (drops cleanly into `coordination/CRUD-CONTRACT.md`)

Per `coordination/CRUD-CONSTELLATION.md:115-128` the contract has 13 sections. This research delivers four of them in completed form, plus successor-scope language for one cross-tranche-debt row.

| `CRUD-CONTRACT.md` section | Substance | Source in this document |
|---|---|---|
| §4 Visibility | 3-state machine, transitions, list-filter semantics, indexes, conformance | §2 above |
| §5 Soft-delete | the `deleted_at` pattern, 30-day grace, restoration, hard-delete invariant, conformance | §3 above |
| §8 Cron / TTL | in-process cron, the `pinned` flag canonical pattern, no unbounded `$nin`, cron categories table, conformance | §4 above |
| §11 Migration disposition | per-migration shape (backfill + verification + reversibility-OR-completeness-proof), canonical script template, retirement step for `formatPalette ??`, conformance | §5 above |
| `B.md §7` (cross-tranche debt; not a §10 row) | image-blob redesign deferred to fourier tranche C | §6 above |

The §10 conformance matrix rows produced by this spec (one per binding assertion):

1. `test_visibility_list_filter` — public list filters `visibility=public, deleted_at=null`. ⇄ value.js: `palette-visibility-list-filter.test.ts`.
2. `test_delete_then_restore_within_grace` — soft-delete + restore round-trip. ⇄ value.js: same name.
3. `test_delete_past_grace_returns_410` — restoration past grace fails 410. ⇄ value.js: same.
4. `test_admin_delete_bypasses_grace` — admin hard-delete is immediate, logs `admin_audit`. ⇄ value.js: same.
5. `test_no_nin_in_janitor_source` — grep-style: `"$nin" not in janitor.py source`. ⇄ value.js: same on `cron.ts`.
6. `test_pinned_flag_prevents_pruning` — pinned old document survives cron. ⇄ value.js: equivalent on cron `pinned` / orphan-vote replacement.
7. `test_migration_idempotent_re_run` — running migration twice is a no-op. ⇄ value.js: same.
8. `test_migration_post_condition_owner_required` — post-condition asserts zero null owners (fourier) / zero missing schema fields (value.js).
9. `test_migration_completeness_count_parity` — snapshot count matches visualization count + skips (fourier) / palette count matches palettes-with-all-defaults (value.js).
10. `test_grep_no_formatPalette_double_question_mark` — value.js-only: grep `routes/palettes.ts` for `?? \[]` / `?? null` / `?? 0` / `?? 1` returns zero (the invariant-17 retirement gate).

Each conformance row above is one literal `§10` table cell × {fourier, value.js} × {test name, run command, expected output}. The W1 — CRUD-contract ratification wave ratifies; the W3 — fourier visualization entity wave implements the fourier-side tests; the value.js-C.W2 wave implements the value.js-side tests (held DEFERRED under the orphan verdict).

---

## 8. Citation summary (load-bearing)

- `api/services/janitor.py:22, :39-53, :60-78, :84-119, :128, :131-173, :176-179` — cron categories + unbounded `$nin` + storage-budget eviction.
- `api/services/image_storage.py:97-98` — inline blob storage; `:113-117` `image_bytes` helper.
- `api/routers/gallery.py:206, :232, :311` — anonymous-publish orphan path; hard-delete from owner.
- `api/routers/admin.py:50-59, :157-163` — admin audit log + hard-delete.
- `api/services/database.py:42-89` — index definitions.
- `api/services/rate_limiter.py:51, :110-113` — single-replica constraint (already documented at `h3-A-W4-W5-W6.md §5 Option A`).
- `~/Programming/value.js/api/src/cron.ts:9-11, :14-16, :18-24` — sessions, stale-sessions, orphan-vote `$nin`.
- `~/Programming/value.js/api/src/routes/palettes.ts:11-27, :412, :491-493` — `formatPalette ??` invariant-17 violation; hard-delete.
- `~/Programming/value.js/api/src/migrate-slugs.ts:1-74`, `migrate-oklab.ts:1-85` — @mkbabb migration idiom precedent.
- `docs/tranches/B/B.md:31, :103` — 3-state visibility ratified; image-blob default-to-C.
- `docs/tranches/B/coordination/CRUD-CONSTELLATION.md:45-49, :115-131` — contract outline.
- `docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §1 W4-1` — janitor `$nin` finding.
- `docs/audits/runs/2026-05-18-tranche-harden/h4-fourier-B.md §3.4, §3.5, §3.8` — visibility, soft-delete, cron contract sketches.
- `docs/audits/runs/2026-05-18-tranche-harden/h5-valuejs-C.md §4` — palette-schema migration precedent.
- `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md §5.3` — image-blob KISS context.
