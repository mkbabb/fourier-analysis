# 2026-05-18 — hardening pass synthesis (fourier-A + fourier-B + value.js-C six-agent pass)

This is the synthesis lane (→ `glossary/meta-terms.md §"Synthesis lane"`) for the second six-agent parallel hardening pass run over fourier-analysis's **A — Cohort attribution, style abrogation, admin parity** tranche, its **B — CRUD convergence ⇄ value.js (research-first)** tranche, and the cross-repo peer **value.js-C — Palette CRUD facility (peer to fourier-B)**. The pass ran six read-only research lanes (→ `glossary/meta-terms.md §"Read-only audit lane"`) plus applied edits at synthesis time; it corrected counts, surfaced one brittleness window (the bounded span inside which the tree is intentionally broken; → `glossary/meta-terms.md §"Brittleness window"`), sharpened invariants, named fallbacks, and ratified the cross-repo authoring split.

---

## §0 — Goal criterion and completion criterion (paired) for the hardening pass

Per the project's paired-criterion discipline (→ `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion + completion criterion (paired)"`), the hardening pass declares both.

**Goal criterion.** Reconcile the A / B / value.js-C plan set against the as-of-2026-05-18 repo state. The aim is plan-honesty: every count, citation, file-bound, and cross-repo dependency reads exactly what the substrate verifies; every silent-deferral becomes a named destination; every fallback becomes a written contract. A fresh reader, opening the plan set after this pass, should be able to dispatch any wave without re-running the audit.

**Completion criterion.** Six lane reports authored under `docs/audits/runs/2026-05-18-tranche-harden/`; eleven load-bearing corrections applied to the plan set with citations; one brittleness window declared in A.md §9 with restoration wave named; three broken citations fixed across both repos; five silent-deferral residuals absorbed into named waves; one latent contract bug (`web/src/lib/api.ts:526,537` batch-endpoint shape mismatch) surfaced and routed; one cross-repo fallback contract (B.W4 minus the `colors.ts` gut) named. The pass closes when this synthesis cites each finding and the plan documents reflect repo state.

Both criteria hold at this writing.

---

## §1 — Agents (the six lanes)

The hardening pass ran six research lanes in parallel. Each lane carries an H-prefix (for *hardening*) plus an enumerated index and a noun-phrase title naming the slice it covered.

| Agent | Slice | Deliverable | Headline finding |
|---|---|---|---|
| **H1 — A.W0 + A.W1 + precepts compliance** | A's open wave (the **Open · challenge · hygiene · numerical-test repair** wave) plus A.W1 — Attribute & land the glass-ui migration cohort, plus precepts cross-walk | `h1-A-W0-W1.md` | **`uv run pytest` shows 2 numerical failures** in `tests/test_bases.py::TestEvaluatePartialSum`; A.md's "green at open" claim is dishonest. 107 → 109 file count; deletion ledger format formalised. |
| **H2 — A.W2 + A.W3** | A.W2 — Override-stylesheet abrogation + A.W3 — Interactive-primitive adoption | `h2-A-W2-W3.md` | `fourier-overrides.css` per-rule counts 24/7/4 → **30/7/4**; `buttons.css` **deletes outright** (audit C's slider-stub residue collapses to 0 because GlassScrubber already shipped). `fira-code` readouts 30 → **69**. `@keyframes` 12 → 14 total / 7 duplicate. |
| **H3 — A.W4 + A.W5 + A.W6** | A.W4 — Scaling, KISS & correctness pass + A.W5 — Admin parity & functionality close + A.W6 — Close | `h3-A-W4-W5-W6.md` | All 6 W4 findings re-confirm. Mongo password at **3 sites** not 2 (prod healthcheck `:47` was missed). Gallery `fetchPage()` admin callers must migrate before offset endpoint drops. Latent **batch-endpoint contract bug** `{processed}` vs `{ok, affected}`. Rate-limiter → **Option A single-replica documented**. |
| **H4 — fourier-B (CRUD convergence)** | the cross-repo CRUD/identity convergence tranche end-to-end | `h4-fourier-B.md` | Invariants 14–17 (the cohort-specific CRUD invariants) coherent with 3 sharpenings. **R3 must emit a 1-row-per-target disposition table.** **CRUD-CONTRACT 13-section outline** with §10 conformance matrix as load-bearing gate (the gate that closes B.W1 — the **Shared CRUD contract** wave). **W4 fallback named** (value.js-C.W1 not published → land everything except `colors.ts` gut). 3 Wχ probes specified. |
| **H5 — value.js-C + value.js A/B deep-read** | the Palette CRUD facility tranche plus its value.js-A and value.js-B predecessors | `h5-valuejs-C.md` | Close-lineage A→B→C sound. **Concrete `Palette` signature** (parent space **OKLCh** not LCh). **`sampleToSVGPath` belongs in `src/math.ts` not `src/easing.ts`** (generalises `cubicBezierToSVG:68`). **Demo already has a `Palette`** at `demo/@/lib/palette/types.ts` → rename to `PersistedPalette`. `cron.ts:24` `$nin` invert added to C.W2 gate. Per-wave test specs named. |
| **H6 — cross-cutting precepts + format compliance** | precepts inheritance, style precept (→ `STYLE.md`), em-dash density, citation chains | `h6-cross-cutting.md` | Invariant inheritance substantively clean. **No Core-Rule breach.** Three broken citations (`W7→W6`; `value.js-B→value.js-C`; timing arrow `C.W3→C.W1`). 8 paragraph-level em-dash sandwiches (kept — user style precept). A.md §7 prompt-recap is overfitting candidate (kept — explicit user directive). |

---

## §2 — Load-bearing corrections applied

The eleven corrections below are each grounded in a lane report; together they constitute the pass's completion evidence.

### 1. Brittleness window declared (A.md §9)

The two pytest failures predate the cohort but **invariant 8** (the A-tranche invariant that numerical correctness precedes UI polish) forbids deferring them. A opens with one brittleness window; the open wave (A.W0 — Open · challenge · hygiene · numerical-test repair) owns the restoration. The "green at open" claim retired.

### 2. Counts re-pinned across A

File count 107 → 109; rule disposition 24/7/4 → 30/7/4; `fira-code` 30 → 69; `@keyframes` 12 → 14/7; native button 89 confirmed (79 git-tracked + 10 in working-tree morph/* files committed at W1 — the **Attribute & land the glass-ui migration cohort** wave).

### 3. `buttons.css` deletes outright

Audit C's "slider stub residue" found no live consumers; GlassScrubber discharges the slider gap; A.W2 (the **Override-stylesheet abrogation** wave) deletes the file entirely. The C-vs-D contradiction resolved.

### 4. Silent-deferral residuals absorbed

D5 (the SliderControl variant prop), C4-residual (the `useTouchGate` and `useResizeObserver` cleanup) → routed into A.W3 — the **Interactive-primitive adoption** wave. D4-residual (the Card migration and CVA decision) → routed into A.W2's disposition ledger. No item lacks a named destination — the discipline binds per **P-Inv 28** (zero deferral at tranche close → `glossary/meta-terms.md §"P-Inv 28"`).

### 5. Deletion ledger format

Eleven-column committed artefact at `docs/tranches/A/audit/W1-deletion-ledger.md`. `BouncyToggle.vue` flagged-for-rework; all others verified-clean per H1's read.

### 6. Latent contract bug surfaced

`web/src/lib/api.ts:526,537` batch-endpoint wrapper return shape contradicts backend (frontend wraps as `{processed}`, backend emits `{ok, affected}`). Folded into A.W5 — the **Admin parity & functionality close** wave — to repair before wiring multi-select UI.

### 7. Cross-repo timing canonicalised

The cohort pairs fourier-B ⇄ value.js-**C** (the Palette CRUD facility tranche), not value.js-B (the close-A-and-simplify tranche, which has a non-CRUD thesis). Close lineage A → B → C is canonical for value.js. Citation fixes applied across both repos. The single hard cross-repo dependency is **fourier-B.W4 — fourier convergence wiring → value.js-C.W1 — library Palette published**.

### 8. W4 fallback named

If value.js-C.W1 (the library `Palette` publish) is not available at fourier-B.W4 dispatch, B.W4 lands everything *except* the `colors.ts` gut. Residual becomes a named B-residual, never silent — invariant 7 satisfied.

### 9. CRUD-CONTRACT structure

13-section outline added to `coordination/CRUD-CONSTELLATION.md`; §10 conformance matrix is load-bearing; one passing test row per assertion × {fourier, value.js} closes B.W1 — the **Shared CRUD contract** wave.

### 10. value.js-C `Palette` signature

Concrete TypeScript shape; OKLCh parent space; `sampleToSVGPath` at `src/math.ts`; demo type renamed `PersistedPalette` (the storage-shape rename that keeps the *domain* `Palette` library-side per cohort invariant 15); named vitest + e2e specs per wave; `cron.ts:24` `$nin` invert added.

### 11. Wχ probes

The challenge wave (fourier-B.Wχ — Challenge wave) ships three adversarial probes per H4:

- **P1** — the framework-in-disguise classifier (classifies every contract section as spec / data / code; rejects invariant 16 if more than 20% need code);
- **P2** — the migration data-preservation probe (re-derives counts; spot-checks 10 random `snapshot_hash` rows; resolves every `user_slug: None` orphan and orphan-snapshot case);
- **P3** — the cross-repo timing + image-blob deferral honesty probe (estimates value.js-B close window; verifies W4 fallback exists; resolves whether deferring the `storage_budget_gb` inline-blob band-aid to fourier tranche C leaves invariant 12 in violation).

Each ships an artefact in `audit/challenge.md`.

---

## §3 — What is now harder

- **A is no longer "green at open"** — one brittleness window is declared; the open wave (A.W0 — Open · challenge · hygiene · numerical-test repair) must repair the 2 pre-existing numerical-test failures or formally re-scope.
- **fourier-B.W1 (the Shared CRUD contract wave) cannot close on narrative** — §10 conformance matrix gate requires one passing test row per contract assertion × repo.
- **R3 (the visualization-entity research lane) cannot ship narrative** — the disposition table is the literal deliverable; the "shared data" admit-rule has three concrete tests.
- **fourier-B.W2 — value.js palette facility (cross-repo tracking row)** is no longer an executable fourier wave — reclassified as a cross-repo tracking row; the actual work lands in value.js-C.

## §4 — What is now softer

Nothing was relaxed. Every change was a tightening or a correction. The hardening pass holds the line.

## §5 — Residual items (not load-bearing)

- 8 paragraph-level em-dash sandwiches (kept — user style precept overrides H6's prose recommendation; → `STYLE.md §"Em-dash discipline"`).
- A.md §7 prompt-recap retained (kept — explicit user directive: "Recap ALL of our prompts and requests hitherto").
- Cross-repo coordination doc mirror in value.js-C currently slightly out of sync on its wave-table cells; the §1 thesis, §5 critical-files table, and timing diagram all carry the canonical info, so the wave-table cells are a follow-up doc-update item.

## §6 — Closing tally

Six hardening reports; eleven load-bearing corrections; one brittleness window declared; three broken citations fixed; five silent-deferral residuals absorbed; one latent contract bug surfaced; one cross-repo fallback contract named. The plan documents now reflect repo state at 2026-05-18, not at audit time. Ready for the A.W0 dispatch (the **Open · challenge · hygiene · numerical-test repair** wave) when fourier-A executes.
