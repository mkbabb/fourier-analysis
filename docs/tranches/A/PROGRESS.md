# A — progress log

Updated at every wave boundary; reconciled against reality at the W6 close ceremony.

## Status board

Each row carries the wave number plus its noun-phrase title (the canonical display form mandated at `docs/precepts/instructions/tranche/SPEC.md §Waves`).

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — Open, challenge, hygiene, numerical-test repair | planned | — | open · challenge · hygiene · two pre-existing numerical failures restored |
| W1 — Attribute and land the glass-ui migration cohort | planned | — | the C1 chronic-deferral closure |
| W2 — Override-stylesheet abrogation | planned | — | `fourier-overrides.css` + `ios-fixes.css` + `buttons.css` deleted |
| W3 — Interactive-primitive adoption | planned | — | the 89 native buttons retire; AB+1 primitive cohort lands |
| W4 — Scaling, KISS and correctness pass | planned | — | janitor invert; contour-hash fix; dead-code deletion; secrets out |
| W5 — Admin parity and functionality close | planned | — | admin idiom lift; audit-log viewer wired; batch UI; math-honesty |
| W6 — Close | planned | — | reconciliation, `FINAL.md`, constellation update, CRUD hand-off |

## Log

### 2026-05-18 — tranche authored

- The six-agent parallel research fan-out (the pre-execution audit pattern at `docs/precepts/glossary/meta-terms.md §"Pre-execution audit"`) completed; artefacts at `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`.
- `A.md`, `coordination/CONSTELLATION.md`, and the broad-wave specs `waves/W1.md` … `waves/W5.md` were authored.
- The CRUD / identity / value.js convergence was extracted to a research-first cross-repo tranche **B** (`docs/tranches/B/`). A keeps only the standalone contour-hash correctness bug (owned by W4 — the *Scaling, KISS and correctness pass* wave). A re-scoped 8 → 7 waves; the former CRUD wave is gone; the scaling and admin waves renumbered to W4 / W5; the close wave renumbered to W6.
- Tranche open commit: TBD (assigned at W0).
- Next action: dispatch W0 (the *Open, challenge, hygiene, numerical-test repair* wave) — verify build green, run the challenge step against the research artefacts, commit submodule wiring, untrack `tsbuildinfo`, decide the rate-limiter replica strategy.

### 2026-05-18 — six-agent hardening pass

A second six-agent parallel pass was dispatched over disjoint slices (H1–H6); artefacts at `docs/audits/runs/2026-05-18-tranche-harden/{h1..h6}.md`. The pass produced these load-bearing corrections to A — every number below already folds into the plan as it stands:

- **Build-state correction.** File count moved from 107 to 109 (62 modified + 31 deleted + 16 untracked). `uv run pytest` reports **2 failed** in `tests/test_bases.py` (the `TestEvaluatePartialSum::test_chebyshev_partial_sum` and `::test_legendre_partial_sum` cases). A.md §10 declares the brittleness window for that pair with W0 as the restoration wave.
- **W1 deletion ledger formalised.** The W1 (the *Attribute and land the glass-ui migration cohort* wave) deletion ledger lands as a committed artefact at `audit/W1-deletion-ledger.md` in the 11-column row format; `BouncyToggle.vue` is the lone `flagged-for-rework` row (its glass-ui replacement is not empirically discharged).
- **W2 abrogation count corrected.** The W2 (the *Override-stylesheet abrogation* wave) per-rule disposition shifts to **30 delete / 7 fold / 4 lift** (audit C originally reported 24/7/4 by counting light + dark forks as one row). `buttons.css` deletes outright — H2 reconciled the audit-C "slider stub" residue to zero, because the `.styled-slider` recipe is discharged by `<Slider variant="glass-scrubber">` and the native-range `:not(.styled-slider)` recipe has no consumers in the tree.
- **W3 counts corrected.** Inside W3 (the *Interactive-primitive adoption* wave): the `fira-code` tabular-readout count moves from 30 to 69; the `@keyframes` total in `web/src` is 14, of which 7 duplicate a glass-ui canonical animation by name (audit C had conflated name-collision with primitive-shadow at "12 duplicate"); `Skeleton` imports from the root barrel (not the `/skeleton` subpath audit D suggested); the non-trivial button sites are named verbatim — `<Button as="label">` at `ImageUpload.vue:121` and `VisualizationView.vue:220`, `<Collapsible.Trigger asChild>` wrapping `<Button>` at `MobileFloatingToc.vue`.
- **W3 absorbed silent-deferral residuals.** D5 (the `SliderControl.vue` variant prop residual) folds into W3; C4-residual (`useTouchGate`, `useResizeObserver`) folds into W3; D4-residual ("Card migration", "CVA decision") folds into W2.
- **W4 corrections.** Inside W4 (the *Scaling, KISS and correctness pass* wave): the hard-coded Mongo password lives at **3** sites — `docker-compose.yml:14`, `docker-compose.prod.yml:8`, and the `docker-compose.prod.yml:47` healthcheck `mongosh -p` (audit E reported 2 by missing the healthcheck). The gallery store's `fetchPage` admin callers (`setTier`, `deleteEntry` at `gallery.ts:137,149,189,207`) must migrate to the cursor path **before** the offset endpoint drops, or the consolidation regresses admin. The contour-hash regression test pair is specified at `image_storage.py:180` — audit E's `:165` was off by 15 lines.
- **W5 contract-bug addition.** Inside W5 (the *Admin parity and functionality close* wave): the API-client wrappers at `web/src/lib/api.ts:526,537` declare a `{ processed }` return shape, but the backend returns `{ ok, affected }`. W5 repairs the wrapper return types before wiring the UI; otherwise the UI ships against a broken type contract.
- **Rate-limiter decision (W0 input).** Option A — single-replica documented honestly — is the hardening recommendation: `replicas: 1` pin in `docker-compose.prod.yml` plus a deploy note. Prod is already single-replica, so invariant 12 (scale without contrivance) is satisfied by documenting the constraint, not by adding Redis.
- Citation fix in `coordination/CONSTELLATION.md`: the close-wave reference moves from `W7` to `W6` (matching the post-extraction wave count).

### 2026-05-19 — tranche-B spec corpus authored (informational; A unchanged)

Tranche B's full spec corpus landed today via a six-agent SOTA round (artefacts at `docs/audits/runs/2026-05-19-crud-deepen/`). This entry is informational for A — A's plan is unchanged. The relevance to A: the contour-hash fix at A.W4 (the *Scaling, KISS and correctness pass* wave) is now an explicit conformance-matrix row in `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md` (the B-side validation that A's correctness fix held); the Option A rate-limiter decision A.W4 selected is inherited by B's auth spec (`research/R-auth-spec.md §6`) with SHA-256-hashed IP keying. The W0 dispatch (the *Open, challenge, hygiene, numerical-test repair* wave) remains the next action for tranche A.

### 2026-05-26 — W0.a open + hygiene landed

Agent A.W0.a — the first of W0's three serial agents — has discharged the open-and-hygiene moiety of the wave. Two commits land on `master`:

- **3fc960c** `chore(A.W0): commit submodule wiring + planning artefacts` — the `.gitmodules` declaration, the `docs/precepts` submodule gitlink pinned at `f27627e` (verified against the propagation done in the prior session), and the `docs/instructions/` + `docs/audits/` + `docs/tranches/` corpora. Fifty paths, fourteen thousand five hundred lines of plan and artefact — the substrate that should have existed when fourier first joined the constellation, hereby installed in-tree.
- **c69aa33** `chore(A.W0): untrack tsbuildinfo cache file` — `git rm --cached web/tsconfig.tsbuildinfo` plus `.gitignore` rules to bar its return. The pre-existing `ssl/` TLS-cert ignore block (a one-block addition wholly unrelated to the W1 cohort's substantive churn) was folded in under the same hygiene heading; A.md §6 places `web/.gitignore` in W0's ownership, so the bundling is in-charter.

Build state captured at the W0.a close:

- `npx vue-tsc -b --force` — exit 0 (clean typecheck across the consumer surface).
- `npm run build` — exit 0; built in 2.60s; 2655 modules transformed; the usual chunk-size warning on the index bundle and PaperView, no errors.
- `uv run pytest` — 87 passed, **2 failed**, exactly the brittleness pair A.md §10 declares: `tests/test_bases.py::TestEvaluatePartialSum::test_chebyshev_partial_sum` and `::test_legendre_partial_sum`. The Legendre case mismatches 196 of 200 sample points with a max absolute difference of 0.072 — a consistent off-by-a-factor as the H1 hardening pass observed. These two failures are the W0.c (numerical-test repair) hand-off; W0.b (challenge) and W0.c remain open.
- `uv run ruff check api` — 23 pre-existing errors (W4 territory per A.md §6, not W0's scope).

The W0 close gate (per A.md §3, W0 row) is **partial**: the submodule wiring is committed, the tsbuildinfo is untracked-and-gitignored, the build is verified green, and the brittleness window is observed and recorded. The remaining gates — the `audit/W0-challenge.md` artefact and the two `test_bases.py` repairs — fall to W0.b and W0.c respectively. The W0 row in the status board flips only at the W0.d close ceremony, after all three serial agents return.

### 2026-05-26 — W0.c numerical-test repair landed

Agent A.W0.c discharged the brittleness window declared at A.md §10. Root cause: `evaluate_partial_sum` in `src/fourier_analysis/bases_evaluation.py` evaluated the polynomial bases on a trimmed domain `[-1+ε, 1-ε]` with `ε = 0.03` — a closed-contour Runge-mitigation heuristic that corrupted the function's contract (the evaluator must compute the canonical partial sum at evenly spaced points of the orthogonality interval `[-1, 1]`). The trim shifted every sample point inward, so the returned values did not coincide with the caller's `np.linspace(-1, 1, n_eval)`. Fix path (a): the trim was excised from the evaluator; the heuristic, if needed for visualization, belongs in the calling plotter rather than the synthesis primitive. Whole-suite reports **89 passed, 0 failed** (W0.a had observed 87 + 2). The §10 suspended gates are restored; W0.d may close the wave.
