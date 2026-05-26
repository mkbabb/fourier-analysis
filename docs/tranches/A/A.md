# A — Charter tranche: cohort attribution, style abrogation, admin parity

**Tranche letter**: A — the first tranche (a tranche being the project decomposition unit defined at `docs/precepts/glossary/meta-terms.md §"Tranche"`) authored by fourier-analysis under its own letter.
**Predecessor close**: none. fourier-analysis has run as a consumer node inside the glass-ui constellation (across glass-ui's O, P, and Q tranches) without ever opening a plan folder of its own. A is letter zero of the fourier sequence.
**Constellation linkage**: A binds to glass-ui's stream as the successor consumer of the P-tranche CR-2 cross-walk / P.W5 Lane B (see `coordination/CONSTELLATION.md`). The cross-repo CRUD-and-identity convergence the audit surfaced — shared with `@mkbabb/value.js` — is extracted whole to **tranche B** (the next-letter fourier tranche, `docs/tranches/B/`).
**Open commit**: TBD — assigned at W0 authoring commit.
**Close commit**: TBD — assigned at W6 close ceremony.
**Span**: opens 2026-05-18.
**Mode**: tranche development only at this open per user directive. The plan is seeded by a six-agent parallel pre-execution audit (the six-lane research pattern documented at `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Pre-execution audit"`) whose artefacts sit at `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`; those artefacts constitute the research wave, and W0 carries the mandatory challenge step. The plan was hardened by a second six-agent parallel pass on 2026-05-18 (artefacts at `docs/audits/runs/2026-05-18-tranche-harden/{h1..h6}.md`); every count and scope decision below already folds that hardening in.

## §1 — Thesis

fourier-analysis has shipped real work through three glass-ui constellation tranches (O, P, Q) without once owning a plan folder. The cost is by now visible and chronic: a 110-file glass-ui-v2.0.0 migration cohort (the *cohort* being the dispatchable group of file changes catalogued under one architectural intent — see `glossary/meta-terms.md §"Agent unit"` for the kindred granularity term) has sat uncommitted across O, P, and Q, named "working tree DIRTY — same in-flight refactor" at *every* constellation audit; and the repo has accreted a stale fork of glass-ui's token system alongside an admin view built in a visibly lower-fidelity design language than the app it administers. (W6 reconciliation note: the cohort and pin were initially documented as 109-file / v1.8.5 / `7e2e385`; W0-challenge §4 row 20 discovered the consumer was in fact compiling against v2.0.0 / `5e79443` with 110 paths under `--untracked-files=all`. The amended figures stand and the migration targets named in W3 hold under v2.0.0.)

This is the **fourth recurrence** of the K-invariant-3 shadow-execution anti-pattern (glass-ui V → AB → AB+1, and now fourier). The remedy is not another retrospective. fourier is a product with its own architecture, and it needs its own tranche to land that architecture honestly.

Tranche A is therefore the **charter tranche**: it makes the repo plannable, then closes the surface-level drift. It does four things, in dependency order:

1. **Attribute and land the migration cohort.** The 110 uncommitted files (60 modified + 31 deleted + 19 untracked, as ratified at W0-challenge §2 row 1 under `--untracked-files=all`; the H1 hardening pass observed 109 under default-untracked counting) form a near-complete, internally clean glass-ui v2.0.0 migration. They are committed under a plan, not shadow-executed. Every deletion is verified to have a wired replacement, with the lone exception of `BouncyToggle.vue` — which W1 (the *Attribute and land the glass-ui migration cohort* wave) flags for explicit rework. This closes chronic item C1.
2. **Abrogate the override stylesheets.** `fourier-overrides.css` is a stale fork of `glass-ui/tokens.css` — roughly 70% of its lines re-declare tokens glass-ui already ships, and two of its forks have *regressed* (the `fourier-f` utility, and the neutral ladder). It is deleted in full; `ios-fixes.css` likewise; `buttons.css` exists only because the consumer reinvented the button system across 89 native `<button>` elements. Every surviving rule is folded idiomatically into its owning component or lifted to glass-ui. No override layer survives.
3. **Pass the repo for scale, KISS, and correctness.** The janitor builds an unbounded `$nin` set; the rate-limiter holds process-local state with no replica story; dead code (`logo.ts`, `math-worker.ts`, `compute.py`) ships with no consumer; `store_contour_asset` carries a coordinate-hash collision bug that mis-serves contours. A fixes each with the smallest honest change — no superfluous cloud, no contrivance.
4. **Lift the admin surface and close functionality gaps.** The admin view drops to native `confirm()` / `<select>`, hand-rolled pagination, and zero `aria-*`; a complete audit-log backend ships with no viewer. A brings the admin *UI* to glass-ui parity on the current data models and wires the dead halves.

**What A deliberately does not do.** The audit surfaced a deeper structural fact: fourier and its sibling `@mkbabb/value.js` have each, independently, built the *same* CRUD facility in two languages — slug-addressed entities, sessions, admin moderation, a cleanup cron, MongoDB — and fourier's own CRUD surface carries five divergent identity schemes for what the user experiences as one entity. Converging that is cross-repo, research-worthy, and must not be answered with overengineering. It is its own architectural intent and belongs in its own tranche. A therefore extracts it whole to **tranche B** (the *CRUD / identity convergence* tranche, `docs/tranches/B/B.md`); A keeps only the standalone *correctness* bug (the contour hash, owned by W4 — the *Scaling, KISS and correctness pass* wave), because correctness cannot wait for a research tranche.

Every A change composes around one root: the repo never had a plan to hold its architecture, so each surface drifted independently. A is that plan. KISS and DRY are load-bearing; architectural transposition for elegance, simplicity, and performance is in scope and welcome; quick fixes, workarounds, compatibility shims, and legacy code are out of scope by invariant.

## §2 — Goal criterion (tranche-level aim)

A succeeds when fourier-analysis is a *plannable* repo: a clean working tree carrying an attributed migration cohort, a single canonical token + button + interactive-primitive vocabulary (sourced from glass-ui rather than a consumer fork), a scaling and correctness surface free of contrivance and free of the contour-hash collision bug, and an admin view at design parity with the consumer-facing app. The aim is fourth-recurrence closure of the K-invariant-3 shadow-execution anti-pattern through a binding plan that holds; the secondary aim is to seed tranche B with a clean substrate by leaving the standalone correctness bug behind a passing regression test and the cross-repo CRUD / identity convergence cleanly extracted with its destination named.

## §3 — Invariants

Tranche A codifies fourier-analysis's baseline invariant set (numbered binding rules scoped to a tranche — see `glossary/meta-terms.md §"Tranche-local invariants"`). All inherit from `docs/precepts/` and `docs/instructions/README.md`; A makes them binding and numbered for this repo. They bind tranche B unchanged.

1. **KISS / DRY** — the smallest complete mechanism that prevents the real failure. Kill duplication before adding policy.
2. **No quick fixes, no workarounds** — no stubs, no shadow APIs, no `*_v2` siblings, no "temporary" compatibility layers. Execute the plan; do not route around it.
3. **No legacy code** — a retired path is deleted, not commented out, not feature-flagged, not left as a fallback branch.
4. **Substrate lands with its consumer** — a token, component, helper, endpoint, or model added in a wave has a runtime caller or test in the same wave, or it is deleted (the substrate-with-consumer discipline at `glossary/meta-terms.md §"Substrate-with-consumer"`).
5. **No overfitting** — every public surface, token, component, helper, or parser branch needs a current consumer and evidence. Single-use private helpers inline; unused surfaces delete.
6. **Gates close on evidence** — build / lint / test output, runtime observation, benchmark artefact, generated diff, or deletion proof. "API exists", a grep hit for a source string, or narrative-only proof never closes a gate (the hard-gate discipline at `glossary/meta-terms.md §"Hard gate"`).
7. **No silent deferral** — every unfinished item has a named destination wave or a formal retire entry in `FINAL.md §debt` (P-Inv 28 inherited; see `glossary/meta-terms.md §"P-Inv 28"`).
8. **Numerical correctness precedes UI polish** — figure and reconstruction changes compare generated artefacts or tests, never just source formulas.
9. **Surface-appropriate evidence** — web visual or interaction changes require browser evidence; API changes require focused endpoint or service tests; record which surface a gate exercises.
10. **Token-first, component-over-CSS-class** — a styling need is met by a glass-ui token, then a glass-ui component, then a glass-ui `@apply` utility, before any consumer-authored CSS. Consumer CSS that re-declares a glass-ui token is drift, not configuration.
11. **One identity scheme** — a CRUD entity the user names and navigates to carries exactly one human-readable slug. Content hashes are content-addressing for deduplication, never user-facing identity. (A holds the line; tranche B converges the model.)
12. **Scale without contrivance** — no superfluous cloud system, no overengineering. Process-local state is never presented as durable; a single-replica constraint is documented honestly in the deploy surface, not hidden behind in-memory caches that fail silently under replication.
13. **Repo voice is deliberate** — archaic diction in prose and the paper (therein, heretofore, corporeal register) is intentional and preserved; LaTeX source uses Unicode em dashes (U+2014). Do not flag or reduce.

A opens with **one declared brittleness window** (a bounded span inside which the tree is intentionally broken — see `glossary/meta-terms.md §"Brittleness window"`) for two pre-existing numerical-test failures: `tests/test_bases.py::TestEvaluatePartialSum::{test_chebyshev_partial_sum,test_legendre_partial_sum}` — the Chebyshev / Legendre partial-sum approximation is off by a consistent factor (observed at H1 hardening). These failures predate the cohort, but invariant 8 (numerical correctness precedes UI polish) forbids deferring them. The window is declared formally in §9; W0 (the *Open, challenge, hygiene, numerical-test repair* wave) owns the resolution. Every other wave closes green.

## §4 — Wave schedule

Each row below cites the wave by number AND noun-phrase title (the canonical display form mandated at `docs/precepts/instructions/tranche/SPEC.md §Waves`). The *closes on* column states the wave's completion criterion (the evidence-bearing artefact set that proves close); each wave's own document carries the paired goal criterion.

| Wave | Title | Agents | Closes on | Status |
|---|---|---|---|---|
| W0 | Open, challenge, hygiene, numerical-test repair | 3 serial | `vue-tsc -b --force` exits green; the two pre-existing `test_bases.py` numerical failures fixed or formally re-scoped per §9; `.gitmodules` / `docs/precepts` / `docs/instructions` committed; `tsbuildinfo` untracked and gitignored; challenge doc at `audit/W0-challenge.md` | planned |
| W1 | Attribute and land the glass-ui migration cohort | 3 parallel | working tree clean; build + typecheck green; deletion proof — every retired file's glass-ui replacement wired and rendering | planned |
| W2 | Override-stylesheet abrogation | 4 parallel | `fourier-overrides.css` + `ios-fixes.css` deleted; `buttons.css` reduced to zero or a justified slider stub; per-rule disposition discharged; before / after browser screenshots; build green | planned |
| W3 | Interactive-primitive adoption | 4 parallel | native interactive `<button>` count → 0 (or per-site justified); `AnimatedDigit` / `Metric*` / `StatusDot` / `Skeleton` adopted at audited sites; browser evidence; build green | planned |
| W4 | Scaling, KISS and correctness pass | 3 parallel | janitor pinned-flag and rate-limiter changes with tests; contour-hash collision regression test passes; `logo.ts` / `math-worker.ts` / `compute.py` deletion proof; secrets out of compose files | planned |
| W5 | Admin parity and functionality close | 4 parallel | admin idiom lift with browser evidence; audit-log viewer + tab wired to the live backend; batch multi-select UI; math-honesty fixes; build green | planned |
| W6 | Close | 1 serial | `PROGRESS.md` reconciled; `FINAL.md` cites every commit + gate; DOC_UPDATE run; `CONSTELLATION.md` updated; CRUD carry handed to tranche B | planned |

Hard ceiling 10 agents per wave (per the precept dual-ceiling exception for read-only audit lanes); A peaks at 4. The W0 → W1 transition is a strict gate — nothing dispatches against an unverified tree. W2 must precede W3 because the button system consolidates before the override layer is removed, so adoption has a canonical target. W4 is independent of W2 / W3 at file bounds and may overlap if agent budget allows. W5 depends on W3 because it reuses the migrated button + primitive vocabulary.

## §5 — Phases

**Phase I — honest baseline (W0–W1).** The repo cannot be planned against while 107 files float uncommitted and the build state is asserted rather than observed. W0 verifies green and commits the precepts / instructions submodule wiring that should have landed when fourier first joined the constellation. W1 (the *Attribute and land the glass-ui migration cohort* wave) attributes the migration cohort to this plan and lands it — the C1 chronic-deferral remedy and the K-invariant-3 closure.

**Phase II — style convergence (W2–W3).** With a clean tree, the override layer is abrogated. `fourier-overrides.css` and `ios-fixes.css` are deleted outright; `buttons.css` collapses into glass-ui's `<Button>` system. Every surviving rule is folded into its owning component or proposed to glass-ui via the constellation. This discharges the AB+1 primitive-adoption debt (constellation P12, the third-recurrence cohort the prior constellation tranche surfaced but did not adopt) the repo has carried unaddressed across two tranches.

**Phase III — soundness (W4–W5).** The scaling pass removes process-local-state contrivance and dead code with the smallest honest change, and fixes the one standalone correctness bug. The admin lift brings the moderation surface to parity and wires the audit-log backend's missing front half — on the *current* data models. Tranche B later re-points the admin data layer at the converged entity; A makes admin *look* right, B makes the *model* right.

**Phase IV — close (W6).** Doc reconciliation, `FINAL.md`, constellation update, formal hand-off of the CRUD carry to tranche B.

Broad waves carry their own specs: `waves/W1.md` … `waves/W5.md`. W0 and W6 are ceremony and are specified inline above plus in `PROGRESS.md`.

## §6 — Critical files and ownership

| Surface | Files | Owning wave |
|---|---|---|
| Submodule / repo wiring | `.gitmodules`, `docs/precepts/`, `docs/instructions/`, `web/.gitignore`, `web/tsconfig.tsbuildinfo` | W0 (the *Open, challenge, hygiene, numerical-test repair* wave) |
| Migration cohort | the 107 uncommitted paths reported by `git status` — `web/src/components/**`, `web/src/style.css`, `api/**`, Docker / nginx surfaces | W1 (the *Attribute and land the glass-ui migration cohort* wave) |
| Override stylesheets | `web/src/styles/fourier-overrides.css`, `ios-fixes.css`, `buttons.css`, `web/src/style.css` | W2 (the *Override-stylesheet abrogation* wave) |
| Interactive primitives | `web/src/components/**` native `<button>` sites; readout / metric components | W3 (the *Interactive-primitive adoption* wave) |
| Scaling / correctness / dead code | `api/services/{janitor,rate_limiter,image_storage}.py`, `api/routers/{compute,gallery}.py`, `web/src/lib/{logo,math-worker}.ts`, `docker-compose*.yml` | W4 (the *Scaling, KISS and correctness pass* wave) |
| Admin / functionality | `web/src/components/visualization/gallery/Admin*.vue`, `GalleryAdminBanner.vue`, `api/routers/admin.py`, `web/src/components/equation/{FrequencyGraph,ConvergencePlot}.vue` | W5 (the *Admin parity and functionality close* wave) |

No two waves hold overlapping write bounds. W1 owns the cohort commit; every subsequent wave edits only post-W1 working-tree-clean state. `api/services/image_storage.py` is touched at W4 (the hash fix only) and again, structurally, by tranche B — sequential, no conflict.

## §7 — Completion criterion (tranche-level hard gates)

Every wave's gate is named in its own spec and closes on an artefact (invariant 6). The tranche-level close gates — what *proves* A is done — are:

- `vue-tsc -b --force` exits 0 and `npm run build` (web) succeeds at HEAD.
- `uv run pytest` green — the two `test_bases.py` failures resolved per §9; `uv run ruff check` clean; `uv run mypy` where wired.
- Working tree clean at every wave close.
- `fourier-overrides.css` and `ios-fixes.css` do not exist; `git grep` for their import lines returns nothing.
- No native interactive `<button>` remains unjustified; no consumer CSS re-declares a glass-ui token.
- The contour-hash collision regression test exists and passes.
- `logo.ts`, `math-worker.ts`, `compute.py` deleted (deletion proof).
- `PROGRESS.md` matches reality; `FINAL.md` cites commits and artefacts.

Invalid hard gates (rejected at the challenge step): "component migrated" without browser evidence; "endpoint added" without a test; a disabled feature with no restoration wave; a grep hit standing in for runtime behaviour.

## §8 — Prompt and precept recap

Tranche A must demonstrably address every request the user has issued. The recap (the full table with addressed / partial / unaddressed verdicts lives at `docs/audits/runs/2026-05-18-fourier-tranche/a-plan-archaeology.md`):

| Request / precept | Source | Disposition |
|---|---|---|
| No fallback / legacy / optional-dep patterns | `memory/feedback_no_fallbacks.md` | Invariants 2, 3; W2 deletes the override layer outright |
| Archaic diction is intentional | `memory/feedback_style_archaic.md` | Invariant 13 |
| Unicode em dashes in LaTeX | `memory/feedback_em_dashes.md` | Invariant 13 |
| Maximize parallel agent usage | `memory/feedback_parallelization.md` | §4 parallel waves; six-agent research fan-out |
| Infra standardization (webhook CI/CD, MongoDB TLS, port standardization) | `memory/project_infra_plan.md` | W4 deploy-surface hygiene; remainder routed to fourier tranche C (§9) |
| Idiomatic, gestalt approaches; architectural transposition for elegance | this prompt | §1 thesis; invariants 1, 10, 11 |
| Fully abrogate `fourier-overrides` and `ios-fixes`; streamline `styles/` | this prompt | W2 |
| CRUD / visualization ↔ slug ↔ value.js convergence; palettes / colours KISS | this prompt | **extracted to tranche B** — cross-repo, research-first (§9) |
| Scale with no contrivance, no superfluous cloud | this prompt | Invariant 12; W4 |
| Design / math / functionality audit of admin + consumer views | this prompt | research artefact `f-…md`; W5 |
| Bidirectional style audit congruent to precepts | this prompt | research artefacts `c-…md`, `d-…md`; W2 / W3 |
| Tranche developed in `docs/`, glass-ui-style | this prompt | this document set + `docs/tranches/B/` |
| Explicate each wave; plan CRUD for both apps; potentially split CRUD | this prompt | §5 phases + wave specs; tranche B (§9) |
| AB+1 primitive-adoption cohort (constellation P12) | glass-ui constellation | W3 |
| glass-ui DESIGN.md migration tasks (constellation P10) | glass-ui constellation | W2 / W3 fold |

## §9 — Cross-tranche debt and explicit deferrals

A opens with debt inherited from the constellation and closes by either landing it or naming its destination. Every deferral here names a destination wave or a destination tranche — never a generic "future tranche" placeholder (per invariant 7 and P-Inv 28).

**Inherited (absorbed into A):**

- **C1** — the 110-file migration cohort (60 M + 31 D + 19 ?? under `--untracked-files=all`; 109 under the H1 default-untracked counting) uncommitted across glass-ui's O / P / Q tranches → **landed at W1 `83e3a14`**.
- **P12** — the AB+1 primitive-adoption cohort (`AnimatedDigit`, `MetricRow / Stack`, `MetricCell`) never adopted → **partially discharged at W3.c `6049995`** (13 MetricBadge sites adopted; remaining primitives retire-with-rationale per `audit/W3-adoption-ledger.md` substrate-shape mismatch).
- **P CR-2** — dock typed-context + `useClipboard` + HoverCard + GlassScrubber → **verified discharged** by audit `d-…md`; A re-confirmed at W0 challenge `87472d1`; no further work.

**Emitted by A (cross-repo, to the constellation):**

- **A → glass-ui press-scale unification** — three glass-ui primitives express the press affordance three ways (`glass-ui/src/components/ui/button/index.ts:9`, `glass-ui/src/components/ui/toggle/index.ts:33`, `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91` per W0-challenge §4 row 21 path correction); audit `d-…md` S1+S2. Filed to glass-ui's next tranche; not a fourier-side fix. STILL FILED at W6 close — no upstream commit.

**Extracted from A — tranche B (CRUD / identity convergence, cross-repo with value.js):**

The whole CRUD / identity / value.js convergence. fourier carries five divergent identity schemes; a saved visualization has no stable human-readable handle; snapshots have no Update / Delete / list and grow unboundedly; `colors.ts` hand-rolls colour logic value.js already ships; and value.js has independently built a structurally identical CRUD facility (its `palette-api` — slugs, sessions, admin, cron, MongoDB) in a second language. This is one architectural intent, it is cross-repo, and the user's brief demands it be *researched* and *KISS* — not overengineered into a shared framework. It opens as the research-first tranche **B** (`docs/tranches/B/B.md`), bound to value.js by `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`. The contour-hash *correctness* bug stays in A.W4; correctness does not wait on a research tranche.

**Deferred out of A and B — fourier tranche C (not to be confused with value.js's tranche C):**

- Infra beyond deploy-file hygiene: webhook CI/CD, MongoDB TLS, port standardization — `project_infra_plan.md` scope.
- Image-blob-out-of-Mongo storage redesign — architectural; tranche B's research wave (R4) decides whether it is in B's scope or defers here.

**Hardening-pass residuals (folded into A waves at the named destinations):**

- **D5** — `SliderControl.vue` variant prop residual (audit `a-plan-archaeology.md §Deferred ledger`) → folded into **A.W3** primitive-adoption scope; W3's spec is amended to name `SliderControl` explicitly.
- **C4-residual** — `useTouchGate`, `useResizeObserver` composables → folded into **A.W3** adoption scope (verify each has a glass-ui composable replacement; otherwise retire-with-rationale or carry to fourier tranche C).
- **D4-residual** — "Card migration", "CVA decision" → folded into **A.W2** disposition scope; named in W2's hardened disposition table.

## §10 — Brittleness window

```yaml
breaking_changes_during_wave: pre-existing red, declared at A open
suspended_gates:
  - tests/test_bases.py::TestEvaluatePartialSum::test_chebyshev_partial_sum
  - tests/test_bases.py::TestEvaluatePartialSum::test_legendre_partial_sum
restoration_wave: W0
reason: two pre-existing numerical-correctness failures in the Python basis
        evaluators (partial-sum approximation differs from the test fixture by
        a consistent factor ≈0.85). They predate the A migration cohort but
        invariant 8 forbids deferring them. W0 investigates the root cause
        and either (a) fixes the evaluator, (b) fixes the test fixture if it
        was wrong, or (c) re-scopes formally with a paper-citation rationale
        and a named successor wave. The close ceremony cannot run while
        either failure persists.
```

No other window. Every wave after W0 closes green; the close ceremony has only this one suspended gate to restore.
