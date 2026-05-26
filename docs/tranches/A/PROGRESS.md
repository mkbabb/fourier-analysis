# A — progress log

Updated at every wave boundary; reconciled against reality at the W6 close ceremony.

## Status board

Each row carries the wave number plus its noun-phrase title (the canonical display form mandated at `docs/precepts/instructions/tranche/SPEC.md §Waves`).

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — Open, challenge, hygiene, numerical-test repair | **closed** | 2026-05-26 (`87472d1`) | open · challenge · hygiene · brittleness pair restored; 7 AMENDs ledgered for W6 absorption |
| W1 — Attribute and land the glass-ui migration cohort | **closed** | 2026-05-26 (`83e3a14`) | the C1 chronic-deferral closure; 31-row deletion ledger landed; BouncyToggle.vue lone flagged-for-rework |
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

Agent A.W0.c discharged the brittleness window declared at A.md §10. Root cause: `evaluate_partial_sum` in `src/fourier_analysis/bases_evaluation.py` evaluated the polynomial bases on a trimmed domain `[-1+ε, 1-ε]` with `ε = 0.03` — a closed-contour Runge-mitigation heuristic that corrupted the function's contract (the evaluator must compute the canonical partial sum at evenly spaced points of the orthogonality interval `[-1, 1]`). The trim shifted every sample point inward, so the returned values did not coincide with the caller's `np.linspace(-1, 1, n_eval)`. Fix path (a): the trim was excised from the evaluator; the heuristic, if needed for visualization, belongs in the calling plotter rather than the synthesis primitive. Whole-suite reports **89 passed, 0 failed** (W0.a had observed 87 + 2). The §10 suspended gates are restored; W0.d may close the wave. Commit `7cd5973` `fix(A.W0): repair chebyshev/legendre partial-sum evaluator domain`.

### 2026-05-26 — W0.b challenge ratification landed

Agent A.W0.b discharged the challenge moiety of W0. The document — `docs/tranches/A/audit/W0-challenge.md`, committed at `87472d1` — ratifies twenty-two load-bearing plan claims against the post-W0.a substrate. Fifteen rows RATIFY; seven AMEND; one soft ESCALATE; zero hard escalations. The AMEND ledger constitutes the W6 close-ceremony's plan-doc reconciliation checklist:

1. **Cohort count** — 110 paths under `--untracked-files=all` (102 under default `git status` due to directory collapse); A.md §1 and W1.md narrate to ~110.
2. **`ios-fixes.css` rules** — 3 selector blocks across 2 conceptual concerns (W2.md §Scope item 2 softens the literal-count language).
3. **`buttons.css` outright-delete** — five live `.styled-slider` consumer sites plus `.btn-icon-admin` / `.btn-solid` / `.btn-ghost` / `.basis-pill` consumers contradict the H2 "no surviving consumer" reading; the file deletes only after the W2 + W3 *joint* consumer migration completes.
4. **`fira-code` count** — 82 raw hits across `web/src/**/*.{vue,ts}` (≥69, ≤82); W3.md §Scope item 3a rerunes the canonical count before W3 dispatches.
5. **`@keyframes` total / shadow count** — 16 total, 6 verified shadows (`fade-in`, `scale-in`, `slide-up`, `collapsible-{open,close}`, `tooltip-in`); `tab-slide-in` is a candidate seventh pending a glass-ui side recheck.
6. **glass-ui pin** — the consumer compiles against v2.0.0 / `5e79443`, not v1.8.5 / `7e2e385`; W6 reconciles `A.md §1`, `CONSTELLATION.md`, `W1.md` to v2.0.0; the migration targets named in W3 hold under v2.0.0 (Skeleton root-barrel confirmed).
7. **`ConfiguratorRow.vue` path** — the file lives at `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91` (the `custom/configurator/` subpath was missing from the CONSTELLATION emitted-carry citation).

The rate-limiter decision is recorded as **Option A** — single-replica documented honestly via `replicas: 1` pin in `docker-compose.prod.yml` plus a deploy note; the W4-side execution lands the implementation. The single soft escalation (the glass-ui v1.8.5 → v2.0.0 skew) does not block W1 dispatch.

### 2026-05-26 — W0 close ceremony (W0.d)

The three serial agents of W0 — A.W0.a (open + hygiene), A.W0.b (challenge), A.W0.c (numerical-test repair) — have each returned green. Five commits constitute the W0 work:

| Commit | Subject |
|---|---|
| `3fc960c` | `chore(A.W0): commit submodule wiring + planning artefacts` |
| `c69aa33` | `chore(A.W0): untrack tsbuildinfo cache file` |
| `c2e2054` | `chore(A.W0): log W0.a open + hygiene closure` |
| `7cd5973` | `fix(A.W0): repair chebyshev/legendre partial-sum evaluator domain` |
| `87472d1` | `docs(A.W0): land W0 challenge ratification` |

Per `A.md §3` W0 row, every hard-gate item is now SATISFIED: `vue-tsc -b --force` green; `npm run build` green; `uv run pytest` 89 passed / 0 failed (the brittleness window discharged at W0.c); submodule wiring committed; `tsbuildinfo` untracked + gitignored; challenge doc landed at `audit/W0-challenge.md`. The status-board flips W0 from `planned` to **closed** at `87472d1`. The seven AMEND rows ledgered at the challenge doc §4 carry forward to the W6 close ceremony.

**Next action**: dispatch **W1 — Attribute and land the glass-ui migration cohort**. Three parallel agents (W1.a web, W1.b api, W1.c infra) ride against the post-W0 clean baseline. The post-W0.a substrate carries the ~110-file in-flight cohort; W1's deliverable is the attributed commit sequence plus the 11-column deletion ledger at `audit/W1-deletion-ledger.md`. `BouncyToggle.vue` carries the lone `flagged-for-rework` row.

### 2026-05-26 — W1.a web migration cohort landed

Agent A.W1.a discharged the web slice of W1. Four commits plus a follow-up reconciliation constitute the W1.a work:

| Commit | Subject |
|---|---|
| `ffba307` | `feat(A.W1.a.1): land web migration cohort — deletions + rewires` |
| `6a2cfcc` | `docs(A.W1.a.3): land W1 deletion ledger` |
| `47f3e91` | `chore(A.W1.a): log W1.a closure` (this entry, in its initial form) |
| `83c3bf8` | `feat(A.W1.a.2): style.css decomposition` |
| (this amendment) | `chore(A.W1.a): reconcile W1.a closure ledger to W1.a.2 hash` |

Build state captured post-`83c3bf8`: `npx vue-tsc -b --force` exit 0 (clean typecheck across the post-cohort consumer surface); `npm run build` exit 0 (2.62 s, dist emitted, sole emission is the index-bundle chunk-size warning W6 will reckon with). The web slice is clean — `git status --short` reports zero dirty paths in `web/src/components/**`, `web/src/composables/**`, `web/src/lib/**`, `web/src/stores/**`, `web/src/router/**`, or `web/src/style.css`; `web/src/styles/**` remains untracked per the W1.a scope (W2 — the *Override-stylesheet abrogation* wave — owns abrogation).

Deletion-ledger disposition tally at `docs/tranches/A/audit/W1-deletion-ledger.md`: **17 `verified-clean`, 13 `verified-with-route-evidence`, 1 `flagged-for-rework`, 0 `flagged-for-retire`** — total 31, discharging the W0-challenge §2 row 2 taxonomy exactly (20 glass-ui-shadow-copy + 4 directory-relocation + 4 module-fold + 3 auth-store-replacement). The lone `flagged-for-rework` row is `BouncyToggle.vue` (ledger row 6) per the H1 hardening finding; disposition falls to W3 (the *Interactive-primitive adoption* wave) because no glass-ui-side substrate at v2.0.0 / `5e79443` carries the bouncy-toggle affordance.

**Sequencing note.** The W1.md §Scope item 3 fixed sequence prescribes W1.a.1 → W1.a.2 → W1.a.3 → log. Empirically the landings were W1.a.1 → W1.a.3 → log → W1.a.2 → reconciliation. The mid-stream re-order traces to a sibling-agent rebase cascade: `A.W1.b`'s first commit (`3926205`, since rebased away) over-staged the full cohort including `web/src/style.css`, was observed at A.W1.a's open as the empirical W1.a.2 substance landing under the W1.b subject, was committed to the ledger and log on that basis, and was subsequently amended by A.W1.b at `05f5025` to its proper api-only scope — returning `web/src/style.css` to A.W1.a's responsibility. The W1.a.2 commit `83c3bf8` then landed under the correct subject, after the ledger and log were already on disk; the present amendment reconciles the `commit_chunk` columns. The W6 close ceremony's AMEND ledger inherits both the sibling-agent file-bounds violation observation and the sequencing-clarification note.

The W1.a sub-gate per `W1.md §"A.W1.a — Web migration cohort"` is satisfied: every deleted `web/` component or composable has its replacement wired and rendering against the post-cohort tree; `vue-tsc -b --force` exits 0; the dev-server-rendered routes (the `confirming_route(s)` column of the ledger) discharge the substrate-with-consumer invariant for every retirement save `BouncyToggle.vue`. W1 hard-gate item 4 (the deletion-ledger artefact) closes on `6a2cfcc`; the `style.css` decomposition gate (W1.md §Scope item 3) closes on `83c3bf8`.

### 2026-05-26 — W1.b api feature cohort landed

Agent A.W1.b discharged the api slice of W1 at commit `05f5025` — `feat(A.W1.b): land api admin/auth/gallery feature cohort`. Thirteen paths, +897 / −21; the new `api/models/admin.py` surface (119 lines) lands alongside the +430-line `api/routers/admin.py` delta, the +177-line `api/routers/gallery.py` delta, and the smaller deltas in `janitor.py`, `main.py`, `dependencies.py`, and the rate-limiter / database services.

Post-commit verification: `git status --short -- api/` empty; `uv run pytest` 89 passed in 60 s; `uv run ruff check api` 23 errors (equal to the W0.a baseline — the cohort introduced no new ruff debt); `npx vue-tsc -b --force` exit 0. The H1 hardening pass's +778-line admin/auth/gallery observation is broadly congruent (the empirical figure on landing was 897 +21; the discrepancy traces to the count's basis of comparison rather than scope drift). No unconsumed endpoint observed — every new admin / gallery endpoint has a runtime caller in `web/src/lib/api.ts` (the audit-log endpoint at `:595`, batch endpoints at `:531` and `:542`, users-prune at `:518`, etc.). No tests yet wire to the new admin surface — test authorship for those endpoints is W4 / W5 territory by plan, not W1's.

Three preserved bugs carry forward to their named successor waves: (a) the contour-hash collision at `api/services/image_storage.py:180` (W4.b), (b) the Mongo password literal at three sites (W4.c), (c) the batch-endpoint contract divergence between `web/src/lib/api.ts:526,:537` (`{ processed }`) and `api/routers/admin.py:362-451` (`{ ok, affected }`) (W5.c).

**Incident**: a first commit attempt at `3926205` over-staged the cohort (96 paths, including `web/src/style.css` — W1.a's bound) due to pre-staged web entries in the index. Recovered via `git reset --soft HEAD~1` and `git reset HEAD -- web/`; recommitted with the verified 13-path staged set at `05f5025`. The over-staged commit was never pushed and has been rebased away. The incident's downstream effect — the W1.a sequencing re-order — is recorded in the W1.a entry above and inherited by the W6 AMEND ledger.

The W1.b sub-gate per `W1.md §"A.W1.b — API feature cohort"` is satisfied: the api cohort lands attributed, no stubs or shadow APIs survive the commit, the ruff baseline holds, pytest is green.

### 2026-05-26 — W1.c infra surface cohort landed

Agent A.W1.c discharged the infra slice of W1 at commit `e02c4cf` — `feat(A.W1.c): land docker/nginx/env-example infra cohort`. Five paths, +114 / −90.

Substantive shape: `docker-compose.yml` advances mongo from 7 to 8.0 and the MONGO_URI gains admin auth; `docker-compose.prod.yml` (+53 / −1) lands TLS-required mongod, per-service memory limits, json-file log rotation, the loopback-only nginx publish (`127.0.0.1:${HTTP_PORT}`), and the SSL cert mounts; `nginx/fourier.conf` (+22 / 0) carries the three `limit_req` zones (general / compute / upload), the compute-route regex split, and the security-header set; `.env.example` collapses to the direct-TLS Mongo posture; `scripts/dev.sh` (+22 / −72) sheds the SSH-tunnel orchestration. The agent had to `git add -f scripts/dev.sh` because the `scripts/` directory is broadly gitignored but `dev.sh` was already tracked — a soft surprise not blocking the commit.

Verification: `docker compose -f docker-compose.yml config` exit 0 (base validates); the combined base + prod composition validates exit 0; the standalone prod overlay correctly errors with `service "mongo" has neither an image nor a build context` because it is a pure overlay, not a stand-alone compose.

The Mongo password literal stands at the three H3-named sites (`docker-compose.yml:14`, `docker-compose.prod.yml:8`, `:47` healthcheck) — positive proof of cohort attribution; W4.c moves them to env reference. The rate-limiter `replicas: 1` pin (Option A per W0-challenge §3) is not landed here — W4.c lands it. The `.gitignore` diff was empty after W0.a's ssl/ block absorption at `c69aa33`, so nothing residual was staged.

The W1.c sub-gate per `W1.md §"A.W1.c — Infra surface cohort"` is satisfied: both compose files validate, no out-of-bounds touches, the secrets are preserved AS-IS for W4.c.

### 2026-05-26 — W1 close ceremony

The three parallel agents of W1 — A.W1.a (web), A.W1.b (api), A.W1.c (infra) — have each returned green. Seven commits constitute the W1 work:

| Commit | Subject |
|---|---|
| `e02c4cf` | `feat(A.W1.c): land docker/nginx/env-example infra cohort` |
| `05f5025` | `feat(A.W1.b): land api admin/auth/gallery feature cohort` |
| `ffba307` | `feat(A.W1.a.1): land web migration cohort — deletions + rewires` |
| `6a2cfcc` | `docs(A.W1.a.3): land W1 deletion ledger` |
| `47f3e91` | `chore(A.W1.a): log W1.a closure` |
| `83c3bf8` | `feat(A.W1.a.2): style.css decomposition` |
| `83e3a14` | `chore(A.W1.a): reconcile W1.a closure ledger to W1.a.2 hash` |

Per `W1.md §"Hard gate (completion criterion, item-by-item)"`, every gate item is SATISFIED:

1. `git status` reports a clean working tree post-W1 — the sole residual `?? web/src/styles/` block is the W2 territory intentionally preserved per A.md §6 (the override stylesheets are W2's scope; W1 commits the cohort minus those).
2. `vue-tsc -b --force` exits 0; `npm run build` exits 0 in 2.99 s.
3. `uv run pytest` reports 89 passed (the W0.c-restored brittleness window holds).
4. The 11-column deletion ledger at `docs/tranches/A/audit/W1-deletion-ledger.md` carries 31 rows: 17 `verified-clean`, 13 `verified-with-route-evidence`, 1 `flagged-for-rework` (`BouncyToggle.vue`), 0 `flagged-for-retire` — exactly the W0-challenge §2 row 2 taxonomy.
5. No stub, shadow API, or `*_v2` sibling introduced; the cohort lands as-is; the three preserved bugs (contour-hash, Mongo password, batch-endpoint contract) carry forward to their named W4 / W5 successors per invariant 7's no-silent-deferral discipline.

The status-board flips W1 from `planned` to **closed** at `83e3a14`. The C1 chronic-deferral item — the cohort that sat uncommitted across glass-ui's O, P, and Q tranches — is hereby attributed under tranche A's plan; the K-invariant-3 fourth-recurrence remedy is discharged.

The two sequencing observations recorded in the W1.a and W1.b entries above (the sibling-agent file-bounds violation at the original `3926205`, and the W1.a out-of-order landing) are carried forward to the W6 close ceremony's AMEND ledger as authoring-side notes — neither alters substrate state.

**Next action**: dispatch **W2 — Override-stylesheet abrogation**. Four parallel agents (W2.a token de-fork, W2.b fold-to-component, W2.c ios-fixes delete + `buttons.css` post-migration deletion, W2.d visual regression evidence). Critical AMEND #6 from W0-challenge §4: `buttons.css` cannot delete outright — five live `.styled-slider` consumer sites plus `.btn-icon-admin` / `.btn-solid` / `.btn-ghost` / `.basis-pill` consumers exist; the file deletes only after the W2 + W3 *joint* consumer migration completes. W2 performs the non-button-recipe migration; W3 performs the button-recipe migration; the deletion lands at the latter of the two.

### 2026-05-26 — W2.e full `buttons.css` abrogation

Per user directive of 2026-05-26 the W2/W3 split for `buttons.css` is
revoked: the entire `.btn-*` + `.basis-pill` migration is pulled into
W2, the file deletes here, and W3 retains the native-`<button>`
migration scope only. Agent A.W2.e discharged the abrogation at commit
`<COMMIT_HASH_PENDING>` — `refactor(A.W2.e): fully abrogate buttons.css
— migrate .btn-* and .basis-pill consumers to <Button>/<Badge>`.

Architectural transposition: each consumer-side recipe migrates to the
smallest idiomatic glass-ui primitive whose `buttonVariants` /
`badgeVariants` already ships the four-state contract (focus-visible /
hover / press / disabled). Bespoke geometry that the variant does not
ship is filed as a per-component scoped retint hook over the variant
— the A.md invariant 10 escape hatch. The migrations:

- `.btn-icon-admin` (3 sites, `GalleryCard.vue:121-141` pre →
  `:121-144` post) → `<Button variant="glass" size="icon">` + scoped
  `.admin-overlay-btn` (h-7 w-7 rounded-full + scale-hover 1.1 /
  scale-active 0.95).
- `.btn-solid` (1 site, `ExportModal.vue:86-89`) → `<Button
  variant="default">` — the recipe's `--foreground` / `--background`
  pair was a reinvented primary palette; the canonical `--primary`
  token routes through the default variant.
- `.btn-ghost` (1 site, `ExportModal.vue:85`) → `<Button
  variant="outline">` — the recipe's 2 px bordered + transparent-bg +
  hover-muted geometry matches outline's `border-input bg-background
  hover:bg-accent` exactly.
- `.basis-pill` interactive toggle (3 in-loop sites,
  `BasisSelector.vue:133-141` pre → `:133-144` post) → `<Button
  variant="outline" size="sm">` + scoped `.basis-toggle` retint hook
  + `aria-pressed` for the active state (replaces the prior `.active`
  class-binding with the semantic ARIA contract `buttonVariants`
  already reads via `aria-pressed:` modifiers — eliminates the
  reinvented active-state idiom).
- `.basis-pill` decorative read-only (2 sites,
  `GalleryCard.vue:84-92` pre → `:84-94` post; and
  `GalleryCardModal.vue:132-140` pre → `:132-142` post) → `<Badge
  variant="outline" size="sm">` + scoped `.basis-tint` retint hook
  (the decorative use was never a button — `<Badge>` is the precise
  semantic primitive). The recipe over-served two distinct roles
  (interactive toggle + decorative label); the migration splits them
  onto the two correct primitives.
- `web/src/lib/equation/notation.ts:3-7` (pre) → `:3-9` (post): the
  comment-only `.basis-pill` reference was updated to cite the
  post-migration vocabulary (`<Button variant="outline" size="sm">`
  + `aria-pressed`-driven tint via `.basis-toggle`).

Post-W2.e file inventory: `web/src/styles/` is **empty and removed
from the tree** (`rmdir` succeeded). The `@import "./styles/buttons.css"`
line at `web/src/style.css:4` is elided.

Verification:
- `git grep -nE 'buttons\.css|\.btn-(icon-admin|solid|ghost)|\.basis-pill' -- 'web/src/'` returns empty. The `.basis-pill-btn` class in `GallerySearchBar.vue:110` is a distinct self-contained recipe outside the `.basis-pill` lineage and not in W2.e scope.
- `npx vue-tsc -b --force` exit 0 (clean typecheck across the post-W2.e consumer surface).
- `npm run build` carries the W2.d-documented pre-existing substrate blocker (`@mkbabb/glass-ui → @mkbabb/value.js: parseCSSStylesheet` import fault). Reproduced the failure on baseline `88c1858` via `git stash` to confirm the blocker is **not** attributable to W2.e — it predates the wave and is filed as the constellation carry per `audit/W2-disposition-ledger.md` row d1. The build-green surrogate is the typecheck per W2.d's precedent.
- Browser smoke: `/gallery` and `/visualize` render the surrounding chrome cleanly with zero console errors. The dev MongoDB is empty in this instance so the live `.basis-pill` / `.btn-icon-admin` / ExportModal surfaces could not be exercised against gallery entries — the cleanly-rendered router + header + upload pipeline confirms no broken cascade from the migration. Screenshots at `audit/W2-screenshots/buttons-abrogated-{gallery,visualize-basis,visualize-chrome}.png`.

The W3.md scope item 2 hard gate ("`buttons.css` deleted") **lands
here**, ahead of W3's native-`<button>` migration. W3 owns the
native-`<button>` migration concern only going forward; the
button-recipe sub-gate is satisfied by W2.e. The status-board reflects
W2 closing the override-stylesheet abrogation chapter in full: every
override stylesheet authored under the consumer fork
(`fourier-overrides.css`, `ios-fixes.css`, `buttons.css`) is now
deleted, and `web/src/styles/` no longer exists.
