# B.Wχ — challenge wave close (consolidated)

**Date**: 2026-05-26. **Substrate**: the six Wα deliverables (`research/R1`–`R6`) + the consolidated drift ledger (`PROGRESS.md`, Wα close entry). **Per-probe artefacts**: `audit/challenge-P1.md` (framework-in-disguise), `challenge-P2.md` (migration-preserves-data), `challenge-P3.md` (timing + image-blob), `challenge-P4.md` (invariant 18–20 binding-test).

Four adversarial probes ran read-only against the live tree. Each was charged to BREAK the plan, not ratify it. **No probe rejected the plan shape.** Two narrowed it with surgical, named scope additions. The hardening directives in §5 are binding on the implementation waves; the wave specs carry a "Wχ hardening (2026-05-26)" addendum citing this document.

## §0 — Verdict summary

| Probe | Charge | Disposition | Binds |
|---|---|---|---|
| **P1** framework-in-disguise | reject inv16 if > 20% of contract sections need shared code | **ACCEPTED** — invariant 16 HOLDS | 0% shared code (12 spec / 1 data / 0 code); utility module is a genuine called-from library, no control inversion |
| **P2** migration-preserves-data | find a data shape the migration loses/corrupts | **NARROWED** | 3 required W3 transform additions + 1 new owner-less path + the empty-DB → seeded-test reality |
| **P3** timing + image-blob | hidden cross-repo dep; invariant-12 violation on band-aid retire | **A ACCEPTED / B NARROWED** | W4 fallback honest, no hidden dep; band-aid retire admitted under 3 conditions; `deleted_at` is net-new W3 work |
| **P4** invariant 18–20 binding | confirm each invariant is falsifiable, not claim-only | **ACCEPTED** (all three) | each binds to a named falsifiable test; 1 devDep gap (`@axe-core/playwright` absent) |

**Plan-shape verdict: COHERENT and DISPATCHABLE.** The research-first lifecycle's gate is satisfied — implementation waves may dispatch. The narrowings fold into W1/W2/W3/W4 per §5; none changes a wave's agent count or file-bound disjointness.

## §1 — P1 framework-in-disguise (ACCEPTED)

- **Shared-code share: 0%.** Of the 13 CRUD-CONTRACT sections, twelve are pure spec; §9 admits exactly one cross-repo artefact — the slug word-list — which is *data* (≤ 6.8 KB JSON, zero runtime dependency), not code. Counting the word-list perversely as "shared" yields 7.7%, still under the 20% reject gate. **Zero sections force a third package both repos import.**
- **Utility-module framework audit: no smell.** All 12 helpers across the 8 `api/lib/crud/` modules are *called by* hand-rolled routers; none registers routes, owns dispatch, or inverts control. The two danger zones hold: `idempotency.replay_or_record` is explicitly "not a decorator; invoked explicitly" (a higher-order callback taking the route's own handler as an argument); `etag.require_if_match` is a consumer-declared FastAPI `Depends` that can only raise 428/412. No `BaseCRUDRouter` / `CRUDMixin` / `@crud_endpoint` / metaclass / registry / codegen.
- **LOC ceiling: achievable framework-free.** The ≤ 525-LOC ceiling (R3 §3.1 raised) actively rewards flat functions over abstraction layers. Non-blocking note: the Python module sits ~5% over its own ~500-LOC self-target via named functional compressions (the `functools.partial` `errors.py` collapse, the slug-words roll-in) — within the hardened 525 ceiling.
- **Disposition: ACCEPTED. Invariant 16 holds; the three named anti-patterns are absent in any prescriptive sense.**

## §2 — P2 migration-preserves-data (NARROWED)

- **Count-parity premise tested.** "Every gallery row has a parent snapshot" is a *creation-time* check (`gallery.py:167`), NOT a durable FK. Nothing ever deletes snapshots (`grep` → zero snapshot deletes); gallery rows ARE deleted (user/admin/janitor). So the durable invariant is `count(snapshots) ≥ count(gallery)`; the Wα R5 parity formula survives only because orphans are defined snapshot-side: `count(visualizations_after) == count(snapshots_before) == count(gallery_before) + count(orphan_snapshots_before)`.
- **THIRD owner-less path FOUND — the "zombie orphan".** `_delete_images_and_cascade` (`janitor.py:293`) deletes a gallery row but leaves its parent snapshot — producing an owner-less snapshot that was once a real public/featured entry. The W3.17 orphan rule collapses it to `draft` + `anon-migrated-NNNNN`, *mis-classifying* a formerly-public row. The migration must carry an honesty note (a once-public zombie is not the same as a never-published draft) and preserve recoverable provenance.
- **Data-loss / corruption candidates:**
  - **D-1 (MEDIUM) — naive/aware datetime landmine.** `snapshots.created_at = datetime.utcnow()` (naive, `snapshots.py:49`) vs `gallery.created_at = datetime.now(UTC)` (aware, `gallery.py:176`), confirmed. **Absent from the W3 plan.** Bites the seed=42 spot-check and any mixed-provenance Python comparison. (Correction to a sibling brief: it does NOT bite the janitor cron, which compares `last_accessed_at`, not `created_at`.) The transform must coerce naive → aware.
  - **D-3 (LOW-but-sharp) — split-source owner merge.** Snapshots carry NO owner field. W3.20's "canonicalise on the snapshot's settings" wording is correct for `animation_settings` but DANGEROUS if read as "owner from snapshot" — every gallery owner would be lost. The transform must source `owner_slug` GALLERY-side (the snapshot is authoritative only for `animation_settings`).
  - **D-2 (LOW, inherited) — visibility downgrade** — needs an honesty note, not a code change.
  - **Idempotency caveat** — `migrated_from` must be co-written ATOMICALLY with the payload (one `$set`, not two writes).
- **Bounded-query + dangling-hash: SOUND.** W3.16's chunked `$lookup` (no unbounded `$nin`) and W3.18's dangling-contour-hash abort are correct against the live `contour_hash` → `contours` FK (the FK genuinely dangles via the `janitor.py:66` recency prune).
- **LIVE DB STATE (read-only, DB `fourier`): `snapshots=0, gallery=0, contours=5, images=4, users=1, flags=0`; `visualizations` absent.** Both migration *source* collections are EMPTY. **Consequence: the `--dry-run` gate proves nothing about correctness — the seeded `test_migrate_integration.py` end-to-end spec is the ONLY load-bearing migration verification.** W3.c must build the seed fixture (gallery+parent-snapshot pairs; an orphan snapshot; a zombie orphan; a `user_slug:None` row; mixed naive/aware timestamps) and assert parity + transform correctness on it.
- **Disposition: NARROWED.** No row is lost; all fixes are local to the W3.c transform. **Required W3 additions: (1) tz-coerce `created_at`/`updated_at` naive→aware; (2) source `owner_slug` gallery-side; (3) zombie-orphan honesty + atomic `migrated_from` write; (4) the seeded integration test is the load-bearing proof, not the dry-run.**

## §3 — P3 timing + image-blob (A ACCEPTED / B NARROWED)

- **Sub-probe A — W4 fallback: ACCEPTED-AS-HONEST.** Every W4 sub-gate (stores, draftStorage, helper-adoption, session TTL, RateLimit, ETag, axe-core) is purely fourier-internal. The single cross-repo edge (`colors.ts` gut + `easings.ts` sampler retire + dep bump) is SEVERED, not deferred — value.js-C is RETIRED and `web/package.json` pins `file:../../value.js`, not a published tag. The fallback holds `colors.ts`/`easings.ts` byte-identical and records a named non-silent residual to `fourier-tranche-C-or-successor`. No hidden dependency.
- **Sub-probe B — image-blob: HONEST DEFERRAL, NOT a silent liability.** The `storage_budget_gb` band-aid WAS the invariant-12 violation (a contrivance); retiring it removes the contrivance. A principled bound survives independently: the tranche-A-landed access-recency prune (`{pinned: False, last_accessed_at: {$lt: cutoff}}`, live at `janitor.py:66-77`) bounds storage to the rolling active working set — abandoned blobs reap at the recency cutoff regardless of total volume.
- **MAJOR CORRECTION (surfaced by P3, binds W3):** the premise that soft-delete / `deleted_at` "already landed in tranche A" is **FALSE** — there is ZERO `deleted_at` anywhere in live `api/`. Soft-delete is **net-new W3 work** landing in the same wave. (The `pinned`-flag recency prune DID land in A; `deleted_at`-grace did not — they are distinct mechanisms.)
- **Disposition: A accepted; B NARROWED.** W3 may retire the band-aid ONLY IF it: **(1) keeps the recency prune live with a correctly re-rooted pin-source on `visualizations`; (2) lands AND tests the `deleted_at`-grace cascade that frees unreferenced blobs; (3) corrects the loose `W3.md:43` justification (the real bound is the recency prune, which is STRONGER than "the brittleness window bounds the storage clock" claims).**

## §4 — P4 invariant 18–20 binding-test (ACCEPTED, all three)

- **Tooling reality:** Playwright IS installed (`@playwright/test ^1.58.2`; `web/playwright.config.ts`; 5 existing e2e specs under `web/`). **`@axe-core/playwright` is NOT installed** — absent from `web/package.json` and `web/node_modules/@axe-core`. One-line devDep gap; W2 (which folds axe-core forward) must add it before its keystone-state spec can run.
- **Inv18 — ACCEPTED.** Modal-a11y clauses → axe-core measurable; dock-naming + z-token → grep measurable. One live literal `z-[15]` at `EquationPanel.vue:114`. `ExportModal.vue` is hand-rolled (`<Teleport>` + `.modal-card`) with NO `role="dialog"` / `aria-modal` / Esc / focus-trap — the HIGH a11y gap is real and red.
- **Inv19 — ACCEPTED (falsifiable, with a demonstrable red baseline).** `saveContourPoints` (`workspace.ts:230-250`) changes `store.contour` identity, NULLS `epicycleData`/`basesData`, and launches NO recompute; the `ContourSettings` watcher (`ContourSettings.vue:138-147`) keys on `[strategy, …, nPoints]`, NOT `store.contour` — so post-save the canvas stays blank (the red baseline). Observable signals a Playwright spec can assert: canvas-not-placeholder (pixel/visibility) + unchanged control values + a single compute pass. An optional `window.__store` test hook sharpens it but is not required.
- **Inv20 — ACCEPTED.** Four `Math.min/max(...)` variadic spreads at `useViewTransform.ts:21-24`, confirmed on the per-rAF `drawFrame` path. Grep-assertable post-hoist (`grep -nE 'Math\.(min|max)\(\.\.\.'` → zero on the per-frame consumer once the spread moves inside an identity-keyed `computed`).
- **Disposition: ACCEPTED.** All three bind to a named falsifiable test, each with a red baseline. Non-blocking: add `@axe-core/playwright`; optionally expose the store to `page.evaluate`.

## §5 — Binding hardening directives (fold into the implementation waves)

Each directive names its destination wave and the artefact that carries it. The wave specs carry a "Wχ hardening (2026-05-26)" addendum pointing here.

**W1 — CRUD-contract ratification:**
- **H-W1-1** — Correct the slug word-list count from **120/120/128/128 → 128/128/128/128** (Wα R3). `SLUG-WORDS.md §1.5`, the JSON-schema `wordList120`, and the reference loaders' `_EXPECTED_COUNTS` all assert 120/120 and would *reject the live data*. Adopt 128/128 verbatim (keyspace 2.68×10⁸; "adopt verbatim, no churn"). Update the counts table + schema (`wordList120` → `wordList128` or a count-agnostic min-bound). The actual extraction of `docs/precepts/data/slug-words.json` is owed at W3 (the file is ENOENT today); W1 fixes the *spec* count.
- **H-W1-2** — Record the §9 disposition verbatim from Wα R3: **10 contract / 1 data / 0 library / 0 service**; slug-words home = `docs/precepts/data/slug-words.json` (precepts-submodule form, chosen over npm+PyPI on strict-KISS grounds). P1 certifies invariant 16 holds — cite this challenge close in the §9 disposition.

**W2 — UX coherence:**
- **H-W2-1** — Add `@axe-core/playwright` to `web/package.json` devDependencies and `npm install` it BEFORE the keystone-state spec runs (P4). This is the one-line gap blocking the Invariant-18 measurement binding.
- **H-W2-2** — Confirmed live targets: the single `z-[15]` literal at `EquationPanel.vue:114` (route through `--z-*`); `ExportModal.vue` is hand-rolled with no a11y primitives (the Dialog substitution is the discharge). The existing e2e specs live under `web/` (not repo-root `e2e/`) — the new spec paths are relative to `web/`.

**W3 — visualization entity + migration + utility module (the most-narrowed wave):**
- **H-W3-1 (from P2)** — The migration transform MUST: (a) coerce `created_at`/`updated_at` naive→aware (the D-1 landmine); (b) source `owner_slug` GALLERY-side, NOT from the snapshot (D-3 — the snapshot is authoritative only for `animation_settings`); (c) write `migrated_from` atomically with the payload in one `$set`.
- **H-W3-2 (from P2)** — Handle the THIRD owner-less path (the "zombie orphan": gallery-deleted-but-snapshot-survives via `janitor.py:293`) with an honesty marker distinguishing a once-public zombie from a never-published draft.
- **H-W3-3 (from P2)** — The dev DB source collections are EMPTY (`snapshots=0, gallery=0`). The `--dry-run` proves nothing about correctness. `test_migrate_integration.py` (W3.23) is the LOAD-BEARING proof — it MUST build a seed fixture covering: gallery+parent-snapshot pairs; an orphan snapshot; a zombie orphan; a `user_slug:None` gallery row; mixed naive/aware timestamps. The count-parity + transform assertions run against the seed, not the empty live DB.
- **H-W3-4 (from P3)** — Soft-delete / `deleted_at` is **net-new W3 work** (zero `deleted_at` in live `api/` — it did NOT land in A). W3 lands the field, the soft-delete state machine, and the `deleted_at`-grace hard-delete cascade that frees unreferenced blobs.
- **H-W3-5 (from P3)** — The band-aid retirement is admitted ONLY WITH: the recency prune kept live with its pin-source re-rooted onto `visualizations`; the `deleted_at`-grace cascade landed AND tested; the loose `W3.md:43` justification corrected (the real storage bound is the recency prune, stronger than the "brittleness window bounds the clock" text).
- **H-W3-6 (from Wα R1/R4)** — **Janitor scope SHRINKS**: the `$nin` is ALREADY retired (tranche A); W3 must NOT re-implement it. W3's janitor work = re-root `_recompute_pin_flags` onto `visualizations` (same-shape edit) + add the `deleted_at`-grace pass + retire `storage_budget_gb`.
- **H-W3-7 (from Wα R1)** — `api/routers/compute.py` does NOT exist (compute lives in `contours.py:36-59` + `equations.py`); the orphan-publish anchor is `gallery.py:188` (not `:206`). W3 regenerates all `database.py`/`gallery.py`/`janitor.py` line citations against HEAD before writing conformance rows.
- **H-W3-8 (from Wα R3)** — Invariant 21 (cryptographic-RNG slug mint) is REAL work: fourier still uses `coolname` (CPython Mersenne) at `api/slugs.py`; `api/lib/crud/slugs.py` lifts to `secrets.choice`.

**W4 — convergence wiring:**
- **H-W4-1** — The axe-core integration (W2.16 folds it forward) is shared with W4.d; W4.d extends the W2 keystone coverage into the visualization-crud lifecycle spec. The `@axe-core/playwright` devDep added at W2 (H-W2-1) satisfies both.
- **H-W4-2** — The orphan verdict is SETTLED (P3): Agent B's `colors.ts`/`easings.ts` work is PROGRESS-residual only; no value.js publish to wait for.

**B.md §8 brittleness window (from Wα R5 + P2):**
- **H-BW-1** — NARROW the window: clean one-way cutover (no dual-read; proven unnecessary — backfill runs backend-stopped). REMOVE the "dual-pathed reads" clause and the `suspended_gates: [gallery list/read]` entry; KEEP the window's existence + `restoration_wave: W3` + legacy-collection survival.

## §6 — Plan-shape verdict

**COHERENT and DISPATCHABLE.** No probe rejected the plan. Invariant 16 is adversarially certified (P1). All three new invariants are falsifiable with red baselines (P4). The migration is honest once the four P2 narrowings + the P3 band-aid conditions fold into W3 (§5 H-W3-*). The cross-repo dependency is severed, not pending — the W4 fallback is unconditionally primary (P3-A). The implementation sequence proceeds: **W1 (contract, docs) → W2 (UX, web/) ∥ W3 (entity, api/) → W4 (convergence) → W5 (close)**. The W2 ∥ W3 parallelism is safe (disjoint `web/` vs `api/` file bounds); the only cross-surface collision risk is at W4's consumer wiring, caught by the W4 triumvirate redress lane.

The research-first gate is closed. Implementation is authorised.
