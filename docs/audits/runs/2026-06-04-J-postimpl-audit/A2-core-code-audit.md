# A2 — W2 CORE code audit (post-impl, HEAD 9d7c387)

**Dimension**: A2 — deep-read of the implemented WAVE-D CORE (`canonical_digest`, `atomdiff`,
`models/visualization`, `routers/visualizations` remix/publish/forks/provenance/diff/versions,
`migrate_visualization_forks`, the `visualization_versions` indexes, `web/src/lib/types.ts`)
against `design/J.W1-crud-remix.md` (§11/§12/§13), `design/J.W1c-publish-visibility.md`,
`design/J-diff-shape.md`.

**Verdict**: SOUND-WITH-REFINEMENTS. The five-atom primitive, the `canonical_digest`
collapse (§12), the diff envelope (§4 Python column), the publish in-place flag-flip, and
inv-26 twins are all correct and well-tested (266/266 green; 41 new WAVE-D tests, all pass).
But the §11 "crash leaves no lie" claim is **overstated**, the §11 step order is **inverted
vs the spec and the inversion is undocumented**, and PATCH can mutate the `palette_slug` atom
**outside the version system**, desyncing `set_hash`. None block the dev tranche; all fold into
the next.

---

## Evidence-grounded findings

### P1 — A2-1 — Crash-window leaves a child viz whose `/diff` LIES `identical=True`
`api/routers/visualizations.py:560-600` writes **viz first** (`:587`), **version second**
(`:592 _write_root_version`), `fork_count` bump last (`:600`). A crash between `:587` and
`:592` leaves a child `Visualization` row (with `set_hash`, `fork_of`, `fork_of_hash` all set)
but **no `visualization_versions` document**. Consequences, traced through the read endpoints:
- `/diff` (`:822-839`): `head_version = find_one({"_id": f"{slug}:{head_hash}"})` → `None` →
  `recorded_ops = []`; `effective_from = fork_of_hash` (present on the viz) → else-branch →
  `DiffResponse(from=fork_of_hash, to=head, ops=[], identical=True)`. **A real remix reads as
  "no changes."** This is cached `immutable, max-age=31536000` (`:851`).
- `/versions` (`:873-885`): `find({"viz_slug": slug})` → `[]` → an empty chain for a fork.
- `/provenance` (`:748-786`): `chain=[]` but `fork_breadcrumb` (the viz-level `fork_of` walk)
  is intact → internally inconsistent (a breadcrumb that says "forked from X" over an empty
  version chain).

§11 (`design/J.W1-crud-remix.md:374-381`) claims "every step individually idempotent so a
crash leaves no lie" and names only the `fork_count` over-count as the crash failure mode. The
viz-without-version window is a worse, unacknowledged lie. The `Idempotency-Key` replay
(`:612`) only covers key-bearing retries; a key-less retry does NOT recover.

### P1 — A2-2 — The migration "self-heal" PERMANENTLY destroys a crash-orphaned fork's delta
`api/scripts/migrate_visualization_forks.py:111-127` writes a root version for any viz lacking
one — but **always with `atom_diff=[]`** (`:125`) and `forked_from_hash=row.get("fork_of_hash")`
(`:122`). So when the backfill heals an A2-1 orphan fork, it mints a version that says "forked
from X, zero recorded delta." `/diff` then permanently returns `from=fork_of_hash, to=head,
ops=[], identical=True` — the remix delta is **gone forever**, not merely until a re-run. The
"content-addressed → idempotent re-insert is a no-op" story (`:130`) is true for the `_id`, but
the *recovered version's body is wrong* and the duplicate-key catch means a later correct write
can never replace it. The §11 "second line of defense" framing (`design:381`) does not hold for
the delta.

### P1 — A2-3 — PATCH mutates the `palette_slug` ATOM outside the version system → `set_hash` goes stale
`VisualizationUpdate` carries `palette_slug` (`api/models/visualization.py:207`), and PATCH
`$set`s it (`api/routers/visualizations.py:381-383`) **without recomputing `set_hash` or
minting a version**. `palette_slug` is one of the five remix atoms (`atomdiff.py:29-35`). After
a palette PATCH the stored `set_hash` no longer equals `set_hash(enumerate_atoms(doc))`:
- `_head_set_hash(doc)` (`:480`) returns the *stale stored* `set_hash` (since `doc.get(...)` is
  truthy), so `/diff` + `/versions` keep asserting the pre-PATCH atom identity, cached immutably
  for a year (`:851`).
- The whole WAVE-D model rests on "every atom-set change is a version" — PATCH violates it for
  the one PATCHable atom. Either `palette_slug` should be remix-only (drop it from
  `VisualizationUpdate`) or a palette PATCH must mint a new version + bump `version_count`.
This is the deepest model-integrity gap; J.W1c §4.5 (`design/J.W1c-publish-visibility.md`) only
reconciled PATCH-*visibility*, never PATCH-*palette*.

### P2 — A2-4 — `/diff` validates `to` then SILENTLY IGNORES it (contract lie)
`api/routers/visualizations.py:830-839`: `to` is range-checked against `on_chain` (`:830-831`)
but `effective_from = from_ or fork_of_hash or head_hash` and `to_hash` is **forced to
`head_hash`** in both branches (`:835`, `:838`). `GET /diff?from=X&to=Y` ignores `Y` entirely —
the response always diffs against HEAD, and the ETag `"<from>:<to>"` (`:841`) is built from the
forced HEAD, not the requested `to`. With a 2-hash depth-0 chain the practical blast radius is
small, but the endpoint accepts a parameter it discards. Either honor `to` (pick the target
version) or reject a non-empty `to != head` with 400/404 instead of feigning support.

### P2 — A2-5 — §11 step order is INVERTED vs the spec, and the inversion is undocumented
§11 mandates **version-first** (`design/J.W1-crud-remix.md:377` step 2 "Insert the child
VisualizationVersion **first**") then **viz** (step 3). The impl does the opposite — viz at
`:587`, version at `:592` — and the router docstring (`:493-498`) asserts "insert child viz …
→ insert child root version" as if that were the plan. The inversion is in fact **forced and
correct**: the version `_id` is the compound `f"{viz_slug}:{set_hash}"` (the §2.3-vs-§11
resolution, `models/visualization.py:221-226`), and `viz_slug` (the child's random slug) does
not exist until `slug_with_retry` inserts the viz. So §11's literal "version-first" is
*impossible* under the compound-`_id` decision. The code is right; §11 is stale. The audit
flags this because §11 is cited as the crash-safety proof and its stated ordering no longer
matches the only correct ordering — the proof needs re-deriving for viz-first (and it does NOT
hold cleanly, per A2-1).

### NIT — A2-6 — `content_hash` and `set_hash` diverge on palette/settings (latent dedup smell)
`_content_hash` (`api/routers/visualizations.py:83-97`) projects only `{image_slug,
contour_hash, sorted(active_bases), n_harmonics}` — it **excludes** `palette_slug`,
`contour_settings`, `animation_settings`. But `set_hash` includes all five atoms (verified:
two children differing only by palette get the *same* `content_hash`, *different* `set_hash`).
The `content_hash` index is non-unique (`database.py:98`), so no insert failure; `content_hash`
is documented "never identity" (`models/visualization.py:121`). Defensible, but a palette-only
or settings-only remix produces a child whose `content_hash == parent's` — worth a one-line
note that dedup/ETag-by-content-hash is coarser than the atom set.

### NIT — A2-7 — `most-forked` cursor `next_cursor_from_last` KeyErrors on an un-migrated legacy row
`cursors.py:76` does `doc["fork_count"]`. Native + backfilled rows always carry it; a legacy
row that has not yet been backfilled (the migration is registered but runs post-health-gate)
would `KeyError` if it surfaces in a `sort=most-forked` page. Bounded by "migration has run,"
but it couples the read path to migration completion. A `doc.get("fork_count", 0)` removes the
coupling.

### NIT — A2-8 — `enumerate_atoms` `sorted(bases)` is not None-safe (unreachable today)
`atomdiff.py:91` `sorted(bases)` raises `TypeError` if `active_bases` contains `None`. The model
validates `list[str]` with `min_length=1` at every boundary, so this is unreachable via the API
— a defense-in-depth note only.

### NIT — A2-9 — `_visibility_verb` skips the write on a no-op, diverging from §3.2's "harmless idempotent write"
`api/routers/visualizations.py:656-659` only `$set`s when `target != current`, so a re-publish
of an already-`public` row does NOT bump `updated_at` (the ETag is unchanged). §3.2
(`design/J.W1c-publish-visibility.md:153`) says publish "writes the literal value it already
holds." The impl is arguably *more* correct (a no-op shouldn't churn `updated_at`), but it
diverges from the spec's stated mechanic. Cosmetic; reconcile the prose to the (better) impl.

### NIT — A2-10 — F-12 named a `ForksPage` twin; `/forks` reuses the inline generic page shape
F-12 (`design/J.W1-crud-remix.md:409`) lists `ForksPage` among the hand-typed twins. The router
emits an untyped inline `{items, next_cursor, has_more}` dict (`:717-721`) reusing the
list/gallery shape; no `ForksPage` in `models/visualization.py` or `web/src/lib/types.ts`.
Defensible reuse, but the named inv-26 twin is absent — book the rename-or-add decision.

---

## Adversarial judgement of the listed design decisions

- **Compound `_id` `f"{viz_slug}:{set_hash}"`** — SOUND, and it correctly resolves the
  §2.3-vs-§11 tension (two vizzes sharing an atom-set never collide). The side effect is that
  it FORCES viz-first ordering (A2-5), which §11 never re-derived crash-safety for (A2-1).
- **`atom_diff` = recorded source→child delta** — SOUND and internally consistent across
  `/diff`/`/versions`/`/provenance` on the happy path (tests `test_remix.py:202-241` pass). The
  only path where it desyncs is the A2-1/A2-2 crash-window and the A2-3 PATCH-palette path.
- **Soft `palette_slug` (no FK)** — SOUND given inv-16 (fourier owns no palettes collection);
  the §13 F-02 "soft reference" option was deliberately taken with a one-line rationale at
  `:530-533`. No objection.
- **`set_hash = ""` default** (`models/visualization.py:145`) — SOUND as *additive-migration
  safety*, NOT a legacy/fallback smell. `_head_set_hash` (`:480`) computes on the fly for an
  un-backfilled row (`doc.get("set_hash") or …`), and native rows always set it at write
  (`:217`, `:577`). It is the documented "validate before backfill" seam, not a silent
  fallback. Passes the no-legacy smell test. (The one wrinkle: the same `or` truthiness makes a
  *stale* set_hash sticky — A2-3.)
- **Null-palette omission from the bag** — SOUND and the only mechanism that lets fourier
  exercise `added`/`removed` (J-diff-shape §5.4); the other four atoms always present → only
  `changed`. `enumerate_atoms` (`:96-98`) + `diff_atoms` (`:138-141`) implement it correctly;
  tests cover it.

## Is the §11 no-transaction sequence genuinely crash-safe + standalone-honest?

**Standalone-honest: YES.** No `start_transaction`/replica-set dependency anywhere; the
sequence is four single-document ops, matching the codebase's single-doc-atomic posture. The
standalone-topology argument (§11) is correct and the decline of path (b) is sound.

**Crash-safe "leaves no lie": NO, overstated.** The version `_id` content-addressing makes the
*version insert* idempotent, but (a) the viz insert is slug-randomized (`slug_with_retry`,
`:589`), so a key-less retry double-forks; and (b) a crash between viz-insert and version-insert
(A2-1) leaves a fork whose `/diff` asserts `identical=True` and whose `/versions` is empty, and
the migration "heal" cements that lie (A2-2). The honest statement is: *crash-safe against
double-writes when an `Idempotency-Key` is present; otherwise the ordered writes bound the
damage to an over-count PLUS a possible version-less fork whose diff reads empty.* §11's prose
should be amended to name the version-less-fork window and either (i) make the viz insert carry
enough to reconstruct the delta (e.g. persist `fork_of_hash` + a recompute-on-read fallback in
`/diff` when the version is missing), or (ii) accept the window explicitly as the publish-tranche
does for its own TOCTOU.

---

## Test posture

41 new WAVE-D tests (`test_remix.py` 16, `test_publish.py` 9, `test_diff_shape.py` 5,
`test_crud_lib_atomdiff.py` ~8, `test_migrate_forks.py` ~3); full `pytest api/` = **266 passed**
(reproduced locally, 18.5s). Coverage gaps the findings expose: **no test for the A2-1
crash-window** (viz present, version absent); the idempotent-retry test
(`test_remix.py:138-159`) exercises the `Idempotency-Key` path, NOT the content-addressed
"second line of defense" §11 leans on; **no test for A2-3** (PATCH palette → stale set_hash);
**no test for A2-4** (`/diff?to=` honored).
