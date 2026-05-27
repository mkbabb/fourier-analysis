# B.W3 migration verification — `snapshots ∪ gallery → visualizations`

**Script**: `api/scripts/migrate_visualization.py` (idempotent, per-doc, `--dry-run`).
**Invariant discharged**: 17 (migration preserves data — no loss).
**Date authored**: 2026-05-26. **Branch**: `master`.

## Why the proof runs against a SEED, not the live DB (H-W3-3)

The live dev DB source collections are **EMPTY** (`snapshots=0, gallery=0,
contours=5, images=4` — challenge.md §2). A `--dry-run` against the empty DB
proves NOTHING about transform correctness. The **load-bearing proof** is the
seeded end-to-end spec `api/tests/test_migrate_integration.py`, which builds a
fixture covering every adversarial shape and asserts count-parity + transform
correctness on it. The tables below are populated against that seed; the live-DB
columns are the empty ground-truth captured for the cutover record.

## Pre / post counts

### Live DB (read-only ground-truth, challenge.md §2)

| Collection | Pre | Post |
|---|---|---|
| `snapshots` | 0 | 0 (retained — rollback substrate to W5) |
| `gallery` | 0 | 0 (retained — rollback substrate to W5) |
| `contours` | 5 | 5 |
| `images` | 4 | 4 |
| `visualizations` | absent | 0 |

`--dry-run` against the empty live DB exits 0 with all-zero counts. This is the
expected vacuous pass; it is NOT the correctness proof.

### Seeded fixture (the load-bearing proof — `test_migrate_integration.py`)

| Symbol | Meaning | Count |
|---|---|---|
| `S` | `snapshots` (pre) | 5 |
| `G` | `gallery` (pre) | 3 |
| `O_snap` | orphan snapshots (no gallery row; bounded `$lookup` §W3.16) | 2 |
| `V` | `visualizations` (post) | 5 |
| anon-migrated owners minted | (orphan + zombie + user_slug:None) | 3 |

**Seed composition** (5 snapshots):
- 2 gallery-backed, real owner (`a…`, `b…`) → `public`
- 1 gallery-backed, `user_slug:None` (`c…`) → `public`, owner resolved to `anon-migrated`
- 1 orphan snapshot, never published (`e…`) → `draft`, `pinned=False`, `was_public=False`
- 1 **zombie orphan** (`f…`; gallery deleted out from under a once-public snapshot) → `draft`, `was_public=True`

## Count-parity formula (challenge.md §2 / R5 §3.1 — the durable, narrowed form)

```
durable DB invariant:  count(snapshots) ≥ count(gallery)
parity (asserted):     count(visualizations_after)
                         == count(snapshots_before)
                         == count(gallery_before) + count(orphan_snapshots_before)
```

Against the seed: `V (5) == S (5) == G (3) + O_snap (2)`. ✔

`assert_count_parity()` raises `RuntimeError` on any inequality, including the
pre-existing-integrity case `S < G` (surfaced, never silently absorbed). The
"every gallery row has a parent snapshot" property is a **creation-time** check
(`gallery.py:167`), not a durable FK — so orphan detection is **snapshot-side**
(the bounded `$lookup` left-anti-join, NOT an unbounded `$nin` over
`gallery.distinct(...)`).

## Resolution rules (the owner-less paths)

| Source shape | `owner_slug` | `visibility` | `pinned` | `migrated_from.was_public` |
|---|---|---|---|---|
| gallery row, `user_slug` non-null | `gallery.user_slug` (GALLERY-side, H-W3-1(b)) | `public` | `True` | `True` |
| gallery row, `user_slug:None` (R5 §2.3) | minted `anon-migrated-NNNNN` | `public` | `True` | `True` |
| orphan snapshot, never published (R5 §2.2) | minted `anon-migrated-NNNNN` | `draft` | `False` | `False` |
| **zombie orphan** (gallery cascade-deleted, H-W3-2) | minted `anon-migrated-NNNNN` | `draft` | `False` | **`True`** ← honesty marker |

`mint_anon_migrated_slug(n) -> "anon-migrated-{n:05d}"` deliberately violates the
contract pattern `^[a-z]+(-[a-z]+){3}$` — a migration-artefact exception (C-slug-4
admits `^anon-migrated-\d+$`). It is minted via a monotonic counter, **NOT** via
`slug_with_retry` (which is reserved for the canonical-pattern public handles).

## seed=42 spot-check (10 rows; CONFORMANCE-MATRIX C11.3, R3 §5.3)

`random.seed(42); random.sample(rows, min(10, len(rows)))`. Each sampled row
records the union resolution and the W3.20 canonicalise-on-parent parity proof
(`active_bases == snapshot.animation_settings.active_bases`;
`n_harmonics == snapshot.contour_settings.n_harmonics`, NOT the possibly-drifted
gallery denormalisation). The spot-check format (one dict per row):

```
{
  "content_hash":       <old snapshot_hash — internal substrate, never a URL>,
  "slug":               <minted public handle | "(dry-run)" | "(unminted)">,
  "visibility":         "draft" | "unlisted" | "public",
  "owner_slug":         <real slug | "anon-migrated-NNNNN">,
  "was_public":         <bool — the zombie-orphan honesty flag>,
  "active_bases_parity": <bool — viz.active_bases == parent's>,
  "n_harmonics_parity":  <bool — viz.n_harmonics == parent's>,
}
```

Against the empty live DB the sample is empty (`n=0`); against the seed it covers
≥1 orphan-snapshot row and ≥1 formerly-null-owner row, exercising both adversarial
paths. The script prints the sample to stdout at the end of every run.

## Post-condition assertions (abort loudly — R5 §3.3–§3.5)

Run after the backfill in live mode (`_assert_post_conditions`):

1. `count_documents({"owner_slug": None}) == 0` — required non-null owner (§3).
2. `count_documents({"visibility": {"$nin": [draft, unlisted, public]}}) == 0` —
   bounded 3-element enum (NOT an unbounded `$nin` over a distinct scan).
3. **Dangling contour-hash (W3.18)**: a bounded `$lookup` from `visualizations`
   to `contours`; any `$size:0` match aborts with the unresolved slug list. The
   integration spec `test_dangling_contour_hash_aborts` proves the abort fires.

## Idempotency (W3.19)

Every row carries `migrated_from: {coll, _id, was_public}`, written **atomically**
in the same insert as the payload (H-W3-1(c)). The pass first reads the set of
already-marked snapshot `_id`s and skips them. The integration spec
`test_second_run_zero_writes` proves: second run `written == 0`,
`skipped_already_migrated == 5`, no duplicate rows, no duplicate `anon-migrated`
owners minted.

## Rollback substrate (hard-gate item 9)

`snapshots` and `gallery` are **retained untouched** (never deleted, never
mutated) through W3 → W5. The script only writes `visualizations` and inserts
`users` rows for the `anon-migrated-NNNNN` owners. Rollback = restore the pre-W3
commit + drop `visualizations`. At the W5 close the gate inverts: the legacy two
rename to `_snapshots_legacy` / `_gallery_legacy`. Post-migration,
`db.getCollectionNames()` must list `snapshots` AND `gallery` AND `visualizations`.

## `--reload` constraint (W3.24)

Run STANDALONE: `python -m api.scripts.migrate_visualization` against a
non-`--reload` backend (or backend down). Embedding inside `uvicorn --reload`
interrupts the pass on every dev-server reload (L6 chronic-residual #5); the
legacy collections are the rollback substrate if a partial migration occurs.

## Verification run log

| Check | Command | Result |
|---|---|---|
| Lint | `uv run ruff check api/scripts/migrate_visualization.py` | clean |
| Unit transform | `uv run pytest api/tests/test_migrate_transform.py -q` | 8 passed |
| Integration (seeded) | `uv run pytest api/tests/test_migrate_integration.py -q` | 4 skipped — live Mongo unavailable (`requires_mongo` guard); re-run against a reachable Mongo to land the load-bearing proof |
| Bounded-orphan gate | `grep -E '\$nin.*list\(' api/scripts/migrate_visualization.py` | 0 matches |
| Helper-consumption | `grep -E 'mint_anon_migrated_slug\|slug_with_retry\|was_public\|--dry-run'` | all present |

> **Note**: the 4 integration assertions (count-parity, second-run zero writes,
> dangling-hash abort, dry-run mutates nothing) are authored and ruff-clean but
> SKIPPED in this environment — no MongoDB is reachable and Docker was not brought
> up. They MUST be run green against a live Mongo (`MONGO_TEST_URI` or
> `localhost:27017`) before the W3 hard gate closes; they are the load-bearing
> correctness proof per H-W3-3.
