# R5 — Migration: move existing data to the converged `visualization` model without loss (invariant 17)

**Lane**: Wα R5 (tranche-B research wave). RESEARCH-ONLY artefact — records findings as of authoring (2026-05-26). Every claim traces to a `file:line` citation against the live tree (HEAD `926ca6a`). value.js precedent ground-truthed against v0.10.0 (HEAD `16129e0`); the original `migrate-{slugs,oklab}.ts` scripts were deleted at `ee8bfa4` and read here from git history at `b7d7c63`.

**Inputs verified in full**: `api/routers/{gallery,snapshots,admin}.py`, `api/models/{gallery,session,shared,assets}.py`, `api/services/{database,image_storage,janitor}.py`, `~/Programming/value.js/api/src/migrations/check.ts` (live), `git show b7d7c63:api/src/migrate-slugs.ts` + `:migrate-oklab.ts` (history), `docs/tranches/B/research/{R1-fourier-crud,R4-scaling-bounds,R-lifecycle-spec}.md`, `docs/tranches/B/B.md §8`, `docs/tranches/B/waves/W3.md` (scope 8, 16–24).

---

## §0 — Live collection ground-truth (the VERIFY questions answered)

**Do `snapshots` and `gallery` exist as separate collections in `database.py`?** YES. Two distinct collections, distinct indexes:

- `snapshots` (`database.py:59-61`): `create_index("snapshot_hash", unique=True)`; compound `[("image_slug", 1), ("snapshot_hash", 1)], unique=True`. No owner index — **no owner field exists** on a snapshot.
- `gallery` (`database.py:74-85`): `create_index("snapshot_hash", unique=True)` — the gallery row borrows the snapshot's content-hash as its own identity; plus 6 more (`tier`+`created_at`, `image_slug`, `views`, `likes`, `user_slug`, and three cursor-pagination compounds).

**Does `snapshot_hash` link them?** YES, and it is a 1:0..1 link. `gallery.snapshot_hash` is a unique FK into `snapshots.snapshot_hash`. The publish path (`gallery.py:167`) verifies the snapshot exists (404 if not) before inserting the gallery row, so **every gallery row has a parent snapshot**; but a snapshot may exist with **no** gallery row (an unpublished / orphan snapshot — `R1 §3.3`). The link is the snapshot-side cardinality `1 snapshot : {0, 1} gallery rows`.

**What is the `contour_hash` → `contours` FK shape?** `contours.contour_hash` is a unique-indexed SHA-256 hex string (`database.py:52`; minted at `image_storage.py:197` via `compute_contour_hash`). Both `snapshots.contour_hash` (`snapshots.py:54`) and `gallery.contour_hash` (`gallery.py:187`, copied from the snapshot) reference it. The gallery's copy is a denormalised duplicate of the snapshot's — the snapshot is the source of truth (the publish path copies `snapshot.get("contour_hash", "")` at `gallery.py:187`). **The FK is verified resolvable for every snapshot at create-time** (`snapshots.py:35` calls `get_contour(req.contour_hash)` which 404s on a missing contour) — but NOT for legacy snapshots written before that guard, nor against subsequent janitor contour-eviction. This is the dangling-contour-hash hazard (W3.18) — must be a post-condition, not an assumption.

**Live source shapes (field-by-field):**

`snapshots` doc (`snapshots.py:50-57`):
```
{ snapshot_hash, image_slug, contour_hash, contour_settings: dict, animation_settings: dict, created_at }
```
No `owner`, no `views`/`likes`, no `updated_at`, no `tier`. **`created_at` is `datetime.utcnow()` — NAIVE** (`snapshots.py:49`; no `tzinfo`).

`gallery` doc (`gallery.py:184-197`):
```
{ snapshot_hash, image_slug, contour_hash, user_slug: str|None, tier, views, likes,
  liked_ips: list[str], active_bases: list[str], n_harmonics: int, created_at, updated_at }
```
`created_at`/`updated_at` are `datetime.now(UTC)` — **AWARE** (`gallery.py:176`). `active_bases`/`n_harmonics` are denormalised from the snapshot's nested settings at publish (`gallery.py:181-182`) and can drift after a subsequent `PUT /{hash}` (`gallery.py:287-290` `$set`s arbitrary fields, though `UpdateEntryRequest` currently only carries `image_slug`).

> **DRIFT-1 (timezone):** `snapshots.created_at` is naive UTC; `gallery.created_at` is aware UTC. The migration must normalise (coerce naive → `tzinfo=UTC`) when canonicalising `visualization.created_at` on the snapshot, else Mongo comparisons and the janitor's `last_accessed_at` predicate mix aware/naive and raise `TypeError`. This is a real, BLOCKING-adjacent finding; see §6.

---

## §1 — Cutover decision

### §1.1 Verdict: CLEAN CUTOVER (one-way write), with the source collections retained as passive rollback substrate. NO dual-read layer.

A *dual-read compatibility layer* — code that, on a `GET`, tries the `visualizations` collection and falls back to reading `snapshots`/`gallery` — is **provably unnecessary** and is the exact "legacy code the invariants forbid" (`B.md §8` reason line; invariant 13/14). The proof that a clean cutover is possible:

1. **The transformation is total and offline-computable.** Every `visualizations` row is a pure function of `(snapshot, gallery?)` rows that already exist. There is no field on the new entity that cannot be sourced or deterministically synthesised from the old collections (see §2's field map — every target field resolves). A read does not need the old shape; it needs the new row, which the backfill writes in full before cutover.
2. **The migration runs against a stopped (or non-`--reload`) backend** (W3.24): there is no concurrent-write window where a row exists in the old shape but not the new. The router swap (`api/main.py` unmounts `snapshots`, gallery becomes a `visibility="public"` filter) lands in the **same** deploy as the completed backfill. There is no interval in which a live read could miss data — so there is nothing for a dual-read path to cover.
3. **value.js precedent is single-read.** Neither `migrate-slugs.ts` nor `migrate-oklab.ts` introduced a dual-read; they backfilled then the read paths assumed the new shape (enforced by the `check.ts` startup probe, `check.ts:100-121`). The cohort idiom (invariant 16) is "backfill + startup smoke-probe asserts applied," not "read both shapes forever."

Dual-read would be justified ONLY if (a) the backfill could not complete in one pass before the read paths flip, or (b) some target field were unresolvable from the source. Neither holds. Therefore: clean cutover.

### §1.2 Brittleness-window verdict: NARROW — from "maybe dual-pathed reads" to "within-script, backend-stopped, no suspended read gates."

`B.md §8` declares provisionally `breaking_changes_during_wave: maybe`, `suspended_gates: [gallery list/read endpoints during the migration cutover]`. R5 narrows it:

- **Keep**: the window's *existence* and its `restoration_wave: W3` (it restores in the same wave — the migration completes within it). Keep the `snapshots`+`gallery` survival as rollback substrate to W5 (hard-gate item 9; `R-lifecycle-spec §5.5`).
- **Remove**: the "or during which reads are briefly dual-pathed" clause and the `suspended_gates: [gallery list/read]` entry. With a backend-stopped backfill (W3.24) the read endpoints are never live against a half-migrated DB — there are no gates to suspend during the cutover because the cutover is atomic at the deploy boundary. The dev-server `--reload` interference (L6 chronic-residual #5; W3.24) is the only operational hazard, and it is dispatched by the docstring constraint, not by a suspended gate.

Narrowed YAML:
```yaml
breaking_changes_during_wave: yes (W3 — the snapshot_hash URL handle is retired; old read shapes removed)
suspended_gates: []   # backfill runs backend-stopped; no live half-migrated read window
restoration_wave: W3  # router swap + backfill land in the same deploy
rollback_substrate: snapshots + gallery collections retained read-only until W5 close, then renamed _legacy
reason: a converged entity cannot be reached through the old identity scheme;
        a dual-read layer is provably unnecessary (R5 §1.1) and is forbidden legacy code.
```

---

## §2 — The transformation (field-by-field, against LIVE shapes)

The migration is **two passes** (the §5.3 example's single snapshot-rooted pass is necessary but NOT sufficient — see DRIFT-2). The target entity shape is `R1 §4a`.

### §2.1 Pass A — snapshot (∪ its gallery row) → `visualization`

Iterate `snapshots`; left-join the (≤1) gallery row on `snapshot_hash`. The snapshot is the canonical parent (W3.20).

| `visualization` field | Source | Rule |
|---|---|---|
| `slug` | minted | `slug_with_retry` (the contract `^[a-z]+(-[a-z]+){3}$` scheme); the ONE public handle. NOT the snapshot_hash. |
| `owner_slug` | `gallery.user_slug` | If gallery present and `user_slug` non-null → that. If gallery present and `user_slug is None` → orphan-gallery rule (§2.3). If NO gallery row (orphan snapshot) → orphan-snapshot rule (§2.2). **NOT NULL** post-condition (`R4 §2.2`). |
| `image_slug` | `snapshot.image_slug` | stable FK; blobs NOT migrated (W3.21). |
| `contour_hash` | `snapshot.contour_hash` | snapshot is source of truth (not gallery's denormalised copy). |
| `contour_settings` | `snapshot.contour_settings` | absorbed verbatim. |
| `animation_settings` | `snapshot.animation_settings` | absorbed verbatim — **parent is canonical** (W3.20). |
| `content_hash` | `snapshot.snapshot_hash` | the old snapshot_hash formula becomes the server-internal ETag/idempotency substrate; **never a URL** (`R1 §4a`). |
| `visibility` | derived | gallery present → `"public"`; orphan snapshot → `"draft"` (`R-lifecycle §5.3:364`; W3.23). |
| `tier` | `gallery.tier` else `"normal"` | admin/moderation, orthogonal to visibility. |
| `views`/`likes`/`liked_ips` | `gallery.*` else `0/0/[]` | counters preserved. |
| `active_bases` | `snapshot.animation_settings.active_bases` | **canonicalise on the parent** (W3.20), NOT `gallery.active_bases` (may have drifted). |
| `n_harmonics` | `snapshot.contour_settings.n_harmonics` | canonicalise on the parent (W3.20), NOT `gallery.n_harmonics`. |
| `version_count` | literal `0` | ETag substrate (`R1 §4a:103`). |
| `created_at` | `snapshot.created_at` | **coerce naive → `tzinfo=UTC`** (DRIFT-1). |
| `updated_at` | `gallery.updated_at` else `snapshot.created_at` | coerce naive→aware. |
| `last_accessed_at` | `now(UTC)` | janitor predicate substrate. |
| `deleted_at` | `None` | live. |
| `pinned` | derived | `True` iff (gallery present AND tier∈{featured,saved}) OR (visibility≠draft AND not deleted) — matches the re-rooted pin policy (`R4 §1.3`). Janitor recomputes anyway (`janitor.py:181-276`); the migration value is a seed. |
| `migrated_from` | `{coll, _id}` | **`{"coll": "snapshots", "_id": snapshot._id}`** (W3.19) — the idempotency marker. |

### §2.2 Orphan-snapshot rule (no gallery row)

Snapshots with no paired gallery row (`R1 §3.3`: NO delete path touches `snapshots` — owner-less, immortal, pinning their contour/image forever). These become `visibility="draft"` visualizations with a minted **`anon-migrated-NNNNN`** owner (W3.17) bound to a real `users` doc with `status: "orphan-migrated"` and the snapshot's `created_at`. `pinned=False` (a draft orphan does not pin). This is the path that finally makes orphan snapshots reapable — once they are draft visualizations owned by a real (admin-managed) user, the stale-user cascade and the soft-delete grace sweep can reach them.

**Detection mechanism (BOUNDED — W3.16):** do NOT use `$nin` over `gallery.distinct("snapshot_hash")` (the BSON 16 MB ceiling gates at ~250 k orphans — same hazard the janitor already retired, `R4 §1.2`). Use the chunked `$lookup` left-anti-join:
```python
db.snapshots.aggregate([
    {"$lookup": {"from": "gallery", "localField": "snapshot_hash",
                 "foreignField": "snapshot_hash", "as": "_g"}},
    {"$match": {"_g": {"$size": 0}}},
])
```
or an `_id`-range chunked scan. Both are unbounded-ceiling-free. Sub-gate: `grep -E '\$nin.*list\(' api/scripts/migrate_visualization.py` returns zero (W3.16, hard-gate 5-analog).

### §2.3 Orphan-gallery rule (gallery row with `user_slug: None`)

The other immortality path (`R1 §3.1`, `R4 §2.1`, ground-truthed at `gallery.py:162` resolve / `:188` write / `:199` insert — NO `require_session`; the stale-user cascade never reaps it because `None ∉ stale_slugs`). The migration **must resolve every `user_slug: None`** by minting an `anon-migrated-NNNNN` owner (W3.17) bound to a real user, visibility `"public"` (it WAS published). This closes the orphan: the row now has a real owner and can be cascaded/soft-deleted. New orphans cannot form post-cutover because the converged `POST /visualizations` requires a session (401 anonymous — W3 scope 6, `R4 §2.2`).

`mint_anon_migrated_slug(n) -> f"anon-migrated-{n:05d}"` is a **separate function** from `slug_with_retry` (W3.17). `anon-migrated-NNNNN` deliberately violates `^[a-z]+(-[a-z]+){3}$` — admitted as a migration-artefact exception (C-slug-4 row scoped to admit `^anon-migrated-\d+$`). Each minted slug also gets a real `users` doc (`_id = the anon slug`, `status: "orphan-migrated"`, `created_at` from the source row) so the stale-user janitor and ownership checks have a real principal.

### §2.4 Pass ordering and the `migrated_from` disambiguation

Pass A (snapshots) writes every published + orphan-snapshot visualization. Because every gallery row has a parent snapshot (§0), Pass A's snapshot-join already covers all gallery-backed rows — there is no separate "gallery-only" pass. The `user_slug: None` resolution (§2.3) happens inside Pass A when the joined gallery row carries a null owner. The `migrated_from: {coll: "snapshots", _id}` marker keys idempotency on the snapshot `_id`; re-running mints no duplicate `anon-migrated-NNNNN` for the same orphan (W3.19).

> **DRIFT-2 (the §5.3 example is single-pass and uses two different idempotency/owner schemes):** `R-lifecycle-spec §5.3:350` keys idempotency on `source_snapshot_hash`, and `:362` assigns a single shared `owner_slug="orphan-archive"` user to ALL orphans. The W3.md authored scope (items 17/19) supersedes both: idempotency keys on `migrated_from:{coll,_id}` (not `source_snapshot_hash`), and orphans get **per-row** `anon-migrated-NNNNN` owners (not one shared `orphan-archive`). The §5.3 example is a research sketch; the W3.md scope is the authority. R5 reconciles to W3.md. Implementers must NOT copy `:350` / `:362` verbatim. (`content_hash` likewise replaces the example's `source_snapshot_hash` per `R1 §4a:95` — same field, contract name.)

---

## §3 — Verification plan

### §3.1 Count-parity formula

Let:
- `S` = `snapshots.count_documents({})` (pre)
- `G` = `gallery.count_documents({})` (pre)
- `O_snap` = orphan snapshots = snapshots with no gallery row (the §2.2 `$lookup`-size-0 count)
- `V` = `visualizations.count_documents({})` (post)

Because every gallery row has exactly one parent snapshot and every snapshot yields exactly one visualization (published-or-draft):

```
V == S
and equivalently  V == (S - O_snap) + O_snap == G' + O_snap
```
where `G' = S - O_snap` = number of snapshots that DO have a gallery row. Note `G' ≤ G`; `G' < G` would mean gallery rows reference a missing snapshot, which the publish guard (`gallery.py:167-169`) forbids, so under invariant integrity `G' == G` and the clean form is:

> **`count(visualizations_after) == count(snapshots_before) == count(gallery_before) + count(orphan_snapshots_before)`**

The W3.c sub-gate states this as `len(visualizations_after) == len(gallery_before) + len(snapshots_with_no_gallery_row_before)` — identical to the right-hand form. The script asserts both equalities; any inequality means a dropped or duplicated row → `RuntimeError`, migration aborts. (If `G > G'`, that itself is a pre-existing integrity violation — surface it, do not silently absorb it.)

### §3.2 seed=42 spot-check (mandated: seed=42, 10 rows)

Per W3 scope 9/8 and `CONFORMANCE-MATRIX C11.3`: `random.seed(42); random.sample(migrated_rows, 10)`. For each sampled row, the artefact (`audit/migration-counts.md`) records the diff showing union resolution: `snapshot_hash → viz_slug`, `visibility`, resolved `owner` (real slug | `anon-migrated-NNNNN`), and the W3.20 parity check that `viz.active_bases == snapshot.animation_settings.active_bases` and `viz.n_harmonics == snapshot.contour_settings.n_harmonics` (proving canonicalisation-on-parent, NOT on the possibly-divergent gallery denormalisation). Sample must include ≥1 orphan-snapshot row and ≥1 (formerly-)null-owner row if any exist, so the spot-check exercises both adversarial paths.

### §3.3 Schema-validate every migrated doc

Validate each written doc against `api/models/visualization.py` (the Pydantic model). The owner-required and visibility-enum constraints are the load-bearing two:
- `count_documents({"owner_slug": None}) == 0` else abort (`R-lifecycle §5.3:405-412`; `R4 §2.2` gate).
- `count_documents({"visibility": {"$nin": ["draft","unlisted","public"]}}) == 0` else abort (`:406-415`).
- `slug` uniqueness is guaranteed by the unique index + `slug_with_retry`; `anon-migrated-NNNNN` slugs are validated against the scoped exception pattern, not the canonical one.

### §3.4 Dangling-contour-hash post-condition (W3.18) — BLOCKING if it fails

After backfill, assert every `visualization.contour_hash` resolves in `contours`:
```python
unresolved = db.visualizations.aggregate([
    {"$lookup": {"from": "contours", "localField": "contour_hash",
                 "foreignField": "contour_hash", "as": "_c"}},
    {"$match": {"_c": {"$size": 0}}},
    {"$project": {"slug": 1, "contour_hash": 1}},
])
```
If non-empty: **abort** with the unresolved `slug` list for manual reconciliation (C-mig-3). This is real: the janitor time-deletes unpinned contours (`janitor.py:66-68`), and a legacy snapshot whose contour was evicted (the snapshot kept the image/contour pinned only while it was the pin source — but a contour evicted before the snapshot existed, or a hash drift, leaves a dangling FK). The post-condition surfaces it rather than writing a broken visualization.

### §3.5 Image-FK survival (W3.21)

The cutover validation also asserts `images.{image_slug}` resolves for every visualization (blobs NOT migrated — stable FK, `R1 §4a:91`, C5 §6 Option B). A bounded `$lookup` mirror of §3.4 against `images.image_slug`.

---

## §4 — Reversibility

### §4.1 During the brittleness window: REVERSIBLE via the source collections.

Per `R-lifecycle-spec §5.5`: `snapshots` + `gallery` are **kept untouched** (read + write-frozen, never deleted) through W3→W5. The migration only **writes** `visualizations` and **inserts** `users` rows for `anon-migrated-NNNNN` owners; it never deletes or mutates a source row. Rollback = redeploy the pre-W3 commit (the router swap reverts; reads re-point at `snapshots`/`gallery`). No separate rollback script is needed because the source data is the rollback target. The hard-gate (item 9) asserts all three collections coexist post-migration (`mongosh db.getCollectionNames()` returns `snapshots` AND `gallery` AND `visualizations`).

> **Rollback side-effect to document:** the `anon-migrated-NNNNN` `users` docs written by the migration are NOT removed by a code rollback. They are inert (no session, no gallery rows under the old shape reference them). A rollback should leave them (harmless) or an optional `migrate_visualization.py --rollback` could `delete_many({"status": "orphan-migrated"})` on the `users` collection + drop `visualizations`. R5 recommends the inert-leave (KISS, invariant 12) — the inverse script is not built unless W5 finds the orphan-migrated users problematic.

### §4.2 After W5 close: ONE-WAY + verified completeness proof.

At the W5 close ceremony the gate inverts (W3 hard-gate 9): `snapshots`/`gallery` rename to `_snapshots_legacy`/`_gallery_legacy` (per CRUD-CONTRACT §11), then drop. From that point the migration is one-way; invariant 17 is discharged by the **completeness proof** — the count-parity (§3.1) + seed=42 spot-check (§3.2) + the four post-condition `RuntimeError` assertions (§3.3–§3.5) recorded in `audit/migration-counts.md`. This is exactly the bar `h5-valuejs-C.md §4.3` calls "the migration-safety bar invariant 17 admits."

### §4.3 Idempotency via `migrated_from` (W3.19).

The script's first action per row: `if db.visualizations.find_one({"migrated_from.coll": "snapshots", "migrated_from._id": snap["_id"]}): skip`. (The §5.3 example's `source_snapshot_hash`-keyed skip is superseded — DRIFT-2.) Re-running is a total no-op once converged; second invocation reports `visualizations_written == 0`, `skipped_already_migrated == S` (the C11.1 conformance row). The orphan pass's `anon-migrated-NNNNN` minting is likewise idempotent because the snapshot `_id` it keys on already carries a marker on re-run — no duplicate anon users. Add an index `migrated_from._id` (sparse) if the re-run skip-scan needs to be bounded; otherwise the existing `_id`-pass + per-row find is acceptable at the deployed scale (single-replica, <10⁵ entities per `R1 §4c`).

---

## §5 — The @mkbabb migration idiom (extracted from the live value.js script(s))

The original one-off scripts were deleted at value.js `ee8bfa4` and consolidated into a **startup smoke-probe** `api/src/migrations/check.ts` (read live). The one-off scripts read from history at `b7d7c63`. The idiom, distilled:

1. **Single file**, runnable standalone: `npx tsx src/migrate-X.ts` (Node) / `uv run python -m api.scripts.migrate_X` (Python). `dotenv/config` import for env; `getDb()` / `closeDb()` bracket (`migrate-slugs.ts:9-11,69`).
2. **Idempotent by query** — the filter selects only documents *missing* the new field or *already-different* from target: `find({ $or: [{oklabColors: {$exists: false}}, {oklabColors: {$size: 0}}] })` (`migrate-oklab.ts:53-58`); `updateMany({sessionToken: token, userSlug: {$exists: false}}, ...)` (`migrate-slugs.ts:55-58`). Re-run is a no-op once converged. Skip-counter for already-done docs (`migrate-slugs.ts:32-36`: `if (session?.userSlug) { skipped++; continue; }`).
3. **Per-document `$set`** — never a wholesale rewrite; `updateOne({_id}, {$set: {oklabColors}})` (`migrate-oklab.ts:75-78`).
4. **Progress counts** — `created`/`skipped`/`updated` counters logged per-doc and summarised at end (`migrate-slugs.ts:18-19,63,66`; `migrate-oklab.ts:62,80`).
5. **Top-level `.catch(err => { console.error; process.exit(1) })`** — fail loud, non-zero exit (`migrate-slugs.ts:71-74`; `migrate-oklab.ts:88-91`).
6. **Post-condition / straggler check.** The *original* one-off scripts had NO post-condition (R-lifecycle §1's value.js row: "neither has a post-condition verification or a reversibility step" — the named gap). The **live** `check.ts` IS the post-condition, lifted into a startup probe: `PALETTE_INVARIANTS` predicate list (`check.ts:34-53`), `checkMigrations` scans every doc and collects `{slug, field}` violations (`:61-94`), `assertMigrationsApplied` exits non-zero on any violation and prints offending slug+field (`:100-121`). **This is the idiom's evolution the fourier migration should adopt:** the straggler check is not just script-end output — it is a startup invariant the server refuses to boot without (a `check_migrations.py` analog asserting zero null owners / valid visibility / no dangling contour-hash; this is the natural home for the §3.3–§3.4 post-conditions, run at `connect_db()` before the app accepts traffic).

**Convergence for fourier** (`migrate_visualization.py`): single file under `api/scripts/`; idempotent by `migrated_from` marker (the §exists-skip analog of `migrate-slugs.ts:32-36`); per-doc `insert_one` (the new-collection analog of per-doc `$set`); `Report` dataclass counters (the `created`/`skipped` analog); `RuntimeError` post-conditions + an optional startup `check_migrations` probe (the `check.ts` analog); `asyncio.run(main())` with the `finally: close_db()` bracket and a non-zero exit on exception (the `.catch(process.exit(1))` analog). Adds (beyond value.js): a `--dry-run` flag (R3 §5.1 Gap 2) and `random.seed(42)` spot-check (R3 §5.3) — value.js had neither; these are fourier-side strengthenings the cohort idiom does not yet carry.

---

## §6 — Drift ledger + crosswalk (W3.md scope 8, 16–24 vs LIVE data shapes)

| # | W3.md claim | Live actual | Status |
|---|---|---|---|
| 8 | Migration mirrors `migrate-slugs.ts:25-67` idiom; idempotent per-doc `$set`; progress counts; post-condition straggler check; `--dry-run`; seed=42; rollback-substrate docstring. | `migrate-slugs.ts` deleted at `ee8bfa4`; live idiom is `check.ts` (startup probe) + history at `b7d7c63`. Idiom holds (§5). `snapshots`/`gallery` are real separate collections (§0). | **ACCURATE (idiom)**; **DRIFTED (citation)** — `migrate-slugs.ts:25-67` no longer exists at HEAD; read from history. Non-blocking. |
| 16 | Orphan-snapshot detection via chunked `$lookup` (from gallery) or `_id`-range; `$nin` over `gallery.distinct` REJECTED (16 MB at ~250 k). | Confirmed: gallery has unique `snapshot_hash` index (`database.py:75`); `$lookup` join is sound and bounded. The janitor already retired its own `$nin` (`R4 §1.2`), so the precedent is live. | **ACCURATE.** |
| 17 | `mint_anon_migrated_slug(n) -> f"anon-migrated-{n:05d}"`, separate from `slug_with_retry`; violates the canonical pattern; C-slug-4 admits `^anon-migrated-\d+$`. | Two orphan paths exist and need it: orphan snapshots (`R1 §3.3`, no gallery row) AND `user_slug:None` gallery rows (`gallery.py:188`, `R4 §2.1`). Both confirmed live. | **ACCURATE & NECESSARY** (both paths live). |
| 18 | Dangling-contour-hash post-condition; `$lookup` to contours, `$size:0` → abort with slug list. | `contour_hash` FK confirmed (`contours.contour_hash` unique, `database.py:52`); snapshots' contour resolvability NOT guaranteed for legacy/evicted contours (`janitor.py:66-68` evicts). | **ACCURATE & NECESSARY** — real dangling hazard. |
| 19 | `migrated_from: {coll, _id}` marker; first action `find({migrated_from: {$exists: false}})`; re-run no-op. | No `migrated_from` field exists today (new). Supersedes the §5.3 example's `source_snapshot_hash`-keyed idempotency (DRIFT-2). | **ACCURATE**; supersedes R-lifecycle §5.3:350. |
| 20 | Canonicalise on snapshot's `animation_settings` (parent); gallery `active_bases`/`n_harmonics` may diverge; reset from parent; seed=42 verifies parity. | Confirmed: gallery denormalises at publish (`gallery.py:181-182`) and `PUT` can `$set` arbitrary fields (`gallery.py:287-290`) → divergence is possible. Parent snapshot's nested settings are the source. | **ACCURATE & NECESSARY** (divergence is reachable). |
| 21 | `image_slug` is a stable FK; blobs NOT migrated; resolve wherever blob lives; cutover validates `images.{image_slug}` resolves. | Confirmed: `images` stores `blob` inline (`image_storage.py:97`), owner-less, deduped by `sha256` (`database.py:43`). FK-stable. C5 §6 Option B. | **ACCURATE** (defer-to-C correct). |
| 22 | IndexedDB `WorkspaceDraft` NOT server-migrated at W3; lift deferred to W4 on next save. | Out of R5 scope (client-only store, no server collection — `R1` 7th noun). Cross-reference only. | **ACCURATE** (deferral noted; no server data). |
| 23 | Two new test specs: `test_migrate_transform.py` (unit) + `test_migrate_integration.py` (seeded e2e: count parity; second-run zero writes; dangling abort; dry-run mutates nothing); plus `test_migrate_anon_migrated_slug_pattern_scoped`. | Test specs not yet authored (W3 implementation). The four assertions map to §3.1/§3.3/§3.4/§4.3. | **ACCURATE** (spec, pending impl). |
| 24 | Standalone `python -m api.scripts.migrate_visualization` against a non-`--reload` backend; docstring-only constraint; legacy collections are the rollback substrate on partial migration. | Confirmed the hazard: `uvicorn --reload` would interrupt mid-pass (L6 chronic-residual #5). Backend-stopped backfill is what makes the clean cutover atomic (§1.1.2). | **ACCURATE & load-bearing** (underpins §1's clean-cutover proof). |

### §6.1 New drifts surfaced by R5 (beyond the W3.md crosswalk)

- **DRIFT-1 (timezone, §0):** `snapshots.created_at` is **naive** (`snapshots.py:49` `datetime.utcnow()`); `gallery.created_at` is **aware** (`gallery.py:176` `datetime.now(UTC)`). The migration MUST coerce naive→aware UTC when canonicalising on the snapshot, or the janitor's aware-`cutoff` comparisons (`janitor.py:51,67`) raise `TypeError: can't compare offset-naive and offset-aware datetimes`. **This is the single highest-risk finding** — it is silent until the first janitor cycle post-migration. Mitigation is one line (`.replace(tzinfo=UTC)` on naive source datetimes) but it MUST be in the transform. Recommend a unit assertion in `test_migrate_transform.py`.
- **DRIFT-2 (§2.4):** the R-lifecycle §5.3 example diverges from the W3.md authored scope on idempotency key (`source_snapshot_hash` vs `migrated_from`) and orphan owner (single `orphan-archive` vs per-row `anon-migrated-NNNNN`). W3.md is authority. Implementers must not copy the example verbatim.

### §6.2 Does anything BLOCK the W3 migration?

**No hard blocker.** Both adversarial paths (orphan snapshots, `user_slug:None` gallery rows) are resolvable by the W3.17 `anon-migrated-NNNNN` rule; both orphan-immortality paths are confirmed live and the migration is the mechanism that finally makes them reapable. The transformation is total (§2) and clean-cutover is provably possible (§1.1). The two **near-blocking** conditions, both internal to the migration and both with a defined honest disposition:

1. **DRIFT-1 timezone coercion** — must be in the transform or the post-migration janitor crashes. One-line fix; flagged here so it is not discovered in production.
2. **Dangling contour-hash (§3.4 / W3.18)** — if any legacy snapshot references an evicted contour, the migration *aborts* (by design) with the unresolved-slug list. This is correct behaviour, not a blocker — but it means the migration may need a manual contour-reconciliation pre-step on a dirty DB. The operator runs `--dry-run` first; the dry-run surfaces the dangling list without writing.

---

## Appendix — citation index

- Source collections: `api/services/database.py:42-96`.
- Gallery publish / orphan owner: `api/routers/gallery.py:155-201` (resolve `:162`, write `:188`, insert `:199`).
- Snapshot shape / naive datetime: `api/routers/snapshots.py:49-57`.
- Contour hash FK: `api/services/image_storage.py:165-231`; `database.py:52`.
- Janitor pin recompute / `$nin` retirement: `api/services/janitor.py:181-276`; aware cutoff `:51,67`.
- Visualization target shape / indexes: `R1 §4a-4d`.
- Migration idiom (live): `~/Programming/value.js/api/src/migrations/check.ts:34-121`. One-off scripts (history): `git show b7d7c63:api/src/migrate-slugs.ts` (`:9-74`), `:migrate-oklab.ts` (`:53-91`).
- Canonical Python migration sketch (superseded on idempotency/owner): `R-lifecycle-spec §5.3:300-444`. Reversibility table: `§5.5:456-462`.
- Brittleness window: `B.md §8:157-173`.
- W3 scope items 8, 16–24: `docs/tranches/B/waves/W3.md:22,33-49`.
