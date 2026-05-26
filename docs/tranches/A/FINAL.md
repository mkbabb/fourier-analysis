# A — Final disposition

The canonical close artefact for fourier-analysis's first own tranche. Authored at the W6 close ceremony on 2026-05-26 by agent **A.W6 — Close ceremony**, against HEAD `f874dac` (the W5 close), landing alongside this commit at the W6 close hash. Every claim below grounds in `PROGRESS.md`, an `audit/` artefact, or a cited commit per the close-honesty checklist at `docs/precepts/instructions/tranche/SPEC.md §"Close-Honesty Checklist"`.

## §0 — Goal criterion and completion criterion (paired)

Per the paired-criterion discipline at `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion + completion criterion (paired)"`, restated for this document.

**Goal criterion.** This FINAL.md document succeeds when the reader can reconstruct, without recourse to oral history or sibling-repo artefacts, what tranche A intended, what tranche A landed, and what tranche A handed forward — and can verify each of those statements against either a `PROGRESS.md` log entry or a cited commit. The aim is a record the next-letter tranche (B) and the next constellation audit can read as a self-contained close.

**Completion criterion.** The document carries: a wave-by-wave commit ledger with hard-gate verdicts (§2); cumulative metrics with empirical citations (§3); the W0-challenge §4 AMEND ledger discharged row-by-row (§4); the absorbed scope-reveals routed to their destinations (§5); the formal hand-off to tranche B (§6); the constellation final state (§7); the close evidence (§8); and an honest reflection (§9). Every status word resolves to the empirical reality at the W6 commit hash; no claim is grounded in a stale gate run.

Both criteria hold at this writing.

## §1 — Thesis recap

Tranche A is the *charter tranche*: it makes fourier-analysis a plannable repo by attributing the 110-file glass-ui migration cohort that had sat uncommitted across glass-ui's O, P, and Q tranches under chronic-deferral item C1, then closes the surface-level drift the cohort's shadow execution had accreted — the override-stylesheet fork (`fourier-overrides.css` / `ios-fixes.css` / `buttons.css`), the unadopted AB+1 primitive cohort (constellation P12), the unbounded `$nin` janitor, the contour-hash collision, the unwired audit-log backend, the admin surface at lower fidelity than the consumer-facing app. A's binding aim was the **fourth-recurrence closure of the K-invariant-3 shadow-execution anti-pattern** (the pattern that recurred across glass-ui V → AB → AB+1 and now fourier); the remedy is not retrospective scolding but a binding plan that holds, and the plan held — every wave closed on cited evidence, the cohort is attributed, the override layer is gone, the admin surface lifted.

The secondary aim was to seed tranche B (the CRUD / identity convergence tranche, cross-repo with value.js) with a clean substrate: leave the standalone correctness bug (contour-hash) behind a passing regression test, and extract the cross-repo CRUD work cleanly with its destination named. That aim discharges at this close — the contour-hash fix landed under W4.b with a regression-test pair, and the five divergent identity schemes plus the slug convergence plus the visualization entity restructure plus the image-blob-out-of-Mongo question are formally handed to B in §6.

## §2 — Wave-by-wave commit ledger

Each subsection enumerates the wave's opening + closing commits, the sub-agent commits with one-line subjects, and the hard-gate verdicts item-by-item.

### W0 — Open, challenge, hygiene, numerical-test repair (closed at `87472d1`)

| Commit | Subject |
|---|---|
| `3fc960c` | `chore(A.W0): commit submodule wiring + planning artefacts` (opens A) |
| `c69aa33` | `chore(A.W0): untrack tsbuildinfo cache file` |
| `c2e2054` | `chore(A.W0): log W0.a open + hygiene closure` |
| `7cd5973` | `fix(A.W0): repair chebyshev/legendre partial-sum evaluator domain` |
| `87472d1` | `docs(A.W0): land W0 challenge ratification` (closes W0) |

Hard-gate verdicts per `A.md §4` row W0 + `A.md §10` brittleness restoration:

| # | Gate | Disposition |
|---|---|---|
| 1 | `vue-tsc -b --force` exits 0 | SATISFIED — verified at W0.a (`3fc960c`); reconfirmed at W6 (this commit). |
| 2 | Two `tests/test_bases.py::TestEvaluatePartialSum` failures repaired | SATISFIED — `7cd5973` excised the `[-1+ε, 1-ε]` evaluator-domain trim; pytest moved 87 → 89 passed, brittleness window §10 restored. |
| 3 | `.gitmodules` + `docs/precepts` + `docs/instructions` committed | SATISFIED — `3fc960c` lands fifty paths / fourteen thousand five hundred lines of plan + artefact substrate. |
| 4 | `tsbuildinfo` untracked + gitignored | SATISFIED — `c69aa33` runs `git rm --cached web/tsconfig.tsbuildinfo` plus `.gitignore` rule. |
| 5 | Challenge doc at `audit/W0-challenge.md` | SATISFIED — `87472d1` lands 22 ratification rows + the 7-row AMEND ledger this document discharges at §4. |

### W1 — Attribute and land the glass-ui migration cohort (closed at `83e3a14`)

| Commit | Subject |
|---|---|
| `ffba307` | `feat(A.W1.a.1): land web migration cohort — deletions + rewires` |
| `6a2cfcc` | `docs(A.W1.a.3): land W1 deletion ledger` |
| `47f3e91` | `chore(A.W1.a): log W1.a closure` |
| `83c3bf8` | `feat(A.W1.a.2): style.css decomposition` |
| `05f5025` | `feat(A.W1.b): land api admin/auth/gallery feature cohort` |
| `e02c4cf` | `feat(A.W1.c): land docker/nginx/env-example infra cohort` |
| `4184d7a` | `chore(A.W1): close W1 — status-board flip + W1.b/W1.c/W1 log entries` |
| `83e3a14` | `chore(A.W1.a): reconcile W1.a closure ledger to W1.a.2 hash` (closes W1) |

Hard-gate verdicts per `waves/W1.md §"Hard gate"`:

| # | Gate | Disposition |
|---|---|---|
| 1 | `git status` post-W1 clean (modulo W2-scoped `web/src/styles/`) | SATISFIED — sole residual was `?? web/src/styles/` intentionally preserved per `A.md §6`. |
| 2 | `vue-tsc -b --force` exit 0; `npm run build` exit 0 | SATISFIED — 2.99 s build at W1 close. |
| 3 | `uv run pytest` 89 passed | SATISFIED — W0.c brittleness window held restored. |
| 4 | 11-column deletion ledger at `audit/W1-deletion-ledger.md` | SATISFIED — 31 rows: 17 verified-clean, 13 verified-with-route-evidence, 1 flagged-for-rework (`BouncyToggle.vue` — discharged at W3.b via Switch adoption), 0 flagged-for-retire. |
| 5 | No stub, shadow API, or `*_v2` sibling | SATISFIED — three preserved bugs (contour-hash, Mongo password, batch-contract) carried forward to named W4 / W5 successors. |

AMEND absorption: the W1.a sub-agent commit-order observation (sibling `3926205` over-staging, rebased away; W1.a.1 → W1.a.3 → log → W1.a.2 → reconcile) is recorded in PROGRESS.md `2026-05-26 — W1.a` log entry and inherited here as an authoring-side note. C1 chronic-deferral discharged; K-invariant-3 fourth-recurrence remedy lands.

### W2 — Override-stylesheet abrogation (closed at `5fdf6ff`)

| Commit | Subject | Sub-agent |
|---|---|---|
| `e4177e9` | `refactor(A.W2.a): excise glass-ui-token re-declarations from fourier-overrides.css` | W2.a |
| `79a2433` | `docs(A.W2.a): backfill commit hash column in disposition ledger` | W2.a |
| `ae84509` | `refactor(A.W2.c): migrate styled-slider to GlassScrubber + delete ios-fixes.css` | W2.c |
| `cb75c02` | `docs(A.W2.c): backfill commit hash column in disposition ledger` | W2.c |
| `f934ff2` | `refactor(A.W2.b): fold-to-component the 7 fourier-overrides rules + delete the file` | W2.b |
| `85aae0b` | `docs(A.W2.b): append W2.b ledger rows + file 3 constellation carries` | W2.b |
| `32c23fc` | `docs(A.W2.d): land visual regression evidence + W2 close artefacts` | W2.d |
| `1e2400c` | `docs(A.W2.d): backfill commit hash column in disposition ledger` | W2.d |
| `a7d1904` | `fix(A.W2): adopt cross-repo dev-resolution contract-v2 — runtime imports of value.js parseCSSStylesheet now resolve` | orchestrator (scope-reveal) |
| `88c1858` | `docs(A.W2): update W2-visual-regression with contract-v2 resolution` | orchestrator |
| `10e616c` | `refactor(A.W2.e): fully abrogate buttons.css — migrate .btn-* and .basis-pill consumers to <Button>/<Badge>` | W2.e (user-directive in-band) |
| `b28d9b1` | `docs(A.W2.e): backfill commit hash 10e616c into ledger + PROGRESS log` | W2.e |
| `1f655a1` | `test(A.W2.e): update e2e selectors + DESIGN.md for buttons.css abrogation` | W2.e |
| `54fe271` | `docs(A.W2.f): discharge glass-ui font-asset URL carry` | W2.f |
| `574cd71` | `docs(A.W2.g): land backend Docker validation report` | W2.g |
| `5fdf6ff` | `fix(A.W2.h): mongo init env vars + dev-compose env-driven credentials — backend validation RATIFY` | W2.h (in-band) |
| `cd019b4` | `chore(A.W2): close W2 — status-board flip + close-ceremony log entry` | orchestrator |

Hard-gate verdicts per `waves/W2.md §"Hard gate"`:

| # | Gate | Disposition |
|---|---|---|
| 1 | `fourier-overrides.css` / `ios-fixes.css` / `buttons.css` do not exist | SATISFIED — `web/src/styles/` directory emptied and `rmdir`'d at W2.e. |
| 2 | Per-rule disposition discharged | SATISFIED — `audit/W2-disposition-ledger.md` carries 86 rows across §W2.a (35) / §W2.b (9) / §W2.c (14) / §W2.d (1) / §W2.e (12) / §W2.f (4) / §W2.g (11). |
| 3 | No consumer CSS re-declares a glass-ui token | SATISFIED — `git grep` post-W2.a returns zero. |
| 4 | Before / after screenshots | SATISFIED — 10 PNGs under `audit/W2-screenshots/` (5 pre-contract-v2 + 5 post-contract-v2 + buttons-abrogation + with-backend gallery). |
| 5 | D4-residual fold (Card migration, CVA decision) | SATISFIED — Card filed as constellation carry; CVA retire-with-rationale (zero in-tree `class-variance-authority` imports). |
| 6 | `npm run build` + `vue-tsc -b --force` green | SATISFIED — 8.28 s build at W2 close. |

AMEND absorption: W0-challenge §4 row 5 (`ios-fixes.css` "2 rules" → 2 concerns / 3 selector blocks) and row 6 (`buttons.css` outright-delete claim is correct; the H2 reading prevailed via the W2.e full abrogation directive) discharged in-wave at the W2.e commit; both AMENDs settle at this close per §4 of this document.

### W3 — Interactive-primitive adoption (closed at `8a608e5`)

| Commit | Subject | Sub-agent |
|---|---|---|
| `6049995` | `refactor(A.W3.c): adopt MetricBadge cohort at GalleryAdminBanner + energy readouts` | W3.c |
| `04cf719` | `docs(A.W3.c): land W3 adoption ledger + C4-residual composable disposition` | W3.c |
| `6b7a12c` | `refactor(A.W3.a): migrate native <button> to <Button> across equation/morph/paper/layout` | W3.a |
| `59f270a` | `refactor(A.W3.d): de-duplicate @keyframes, excise cubic-bezier and transition:all` | W3.d |
| `c53ffba` | `refactor(A.W3.b): migrate native <button> to <Button> across visualization/ui + D5 fold` | W3.b |
| `be24948` | `refactor(A.W3.b): migrate visualization+ui native <button> to <Button>` | W3.b |
| `7057fe7` | `docs(A.W3.b): land D5 row in W3-adoption-ledger` | W3.b |
| `8a608e5` | `refactor(A.W3.d): commit residual motion-vocab edits` | W3.d residuals |
| `1376a95` | `chore(A.W3): close W3 — status-board flip + close-ceremony log entry + browser smoke screenshots` | orchestrator |
| `6c7b21d` | `docs(A.W3): land browser smoke screenshots — directory gitignore override` | orchestrator |

Hard-gate verdicts per `waves/W3.md §"Hard gate"`:

| # | Gate | Disposition |
|---|---|---|
| 1 | Native `<button>` count → 0 or per-site justified | SATISFIED — 68 retired; ~9 justified residue (decorative-SVG wrappers `MorphShapePreview`, `DarkModeToggle`; ornament `AnimationControls.play-btn` ×2; W5-territory admin pagination ×4; consumer-side `Tooltip` primitive). |
| 2 | `buttons.css` deleted | SATISFIED via W2.e (`10e616c`) — full abrogation directive landed in-band. |
| 3 | AB+1 P12 primitive cohort adopted | SATISFIED-with-honest-retirement — 13 `MetricBadge` adoptions across 8 files; `AnimatedDigit` / `MetricRow` / `MetricStack` / `MetricCell` / `StatusDot` / `Skeleton` retire-with-rationale (no live-damping counters; sparkline-bar coefficient register; icon + Select tier vocabulary; spinner loading register). Forcing adoption would invert the substrate-with-consumer invariant. |
| 4 | `@keyframes` shadow + `transition: all` + `cubic-bezier` cleanup | SATISFIED — shadow `@keyframes` 6 → 0 (the W0-challenge-named six); `cubic-bezier` 29 → 0; `transition: all` 26 → 0. Eight fourier-local keyframes survive as legitimate (tab-slide-in, adv-open/close, rainbow-slide / drift, golden-shimmer, spin, like-bounce, marquee-scroll). |
| 5 | `npm run build` + `vue-tsc -b --force` green | SATISFIED — 8.28 s build at W3 close. |

AMEND absorption: W0-challenge §4 rows 4 (`fira-code` count rerune to 82) and 9 (`@keyframes` 14 → 16, shadows 7 → 6) discharged at W3.c (the 82 enumeration with 55 kept-as-decorative) and W3.d (6 verified shadows) respectively. Constellation P12 partially discharged — 13 MetricBadge sites land; the remaining primitives retire honestly with file:line-cited rationale.

### W3.5 — Polish wave (paper-texture + dark-mode + sidebar + visualization pipeline) (closed at `cb94aa3`)

| Commit | Subject | Sub-agent |
|---|---|---|
| glass-ui `9cf88e6` | `fix(styles): restore canonical subtle paper-texture opacity (0.04 / 0.06)` | glass-ui / W3.5.ab |
| `2b308f7` | `docs(A.W3.5.ab): discharge paper-texture root fix carry` | fourier / W3.5.ab |
| `e0e9dda` | `refactor(A.W3.5.d): visualization pipeline refinements — heap-VW, single-pass epicycles, auto-compute dedupe` | fourier / W3.5.d |
| glass-ui `9b8de74` | `feat(sidebar): generalize useSidebarState over arbitrary tree shape — consumer half` | glass-ui / W3.5.c |
| `cb94aa3` | `refactor(A.W3.5.c): adopt glass-ui sidebar primitives in PaperSidebar + MobileFloatingToc` | fourier / W3.5.c |

In-band scope-reveal absorbing three user directives mid-W4 dispatch: paper-texture opacity restoration (glass-ui root fix from `opacity='1'` to canonical `0.04` / `0.06`), sidebar glass-ui leverage (`useSidebarState<T>` generalised at glass-ui, consumed at `PaperSidebar.vue` + `MobileFloatingToc.vue`), visualization pipeline refinements (O(n³) → O(n log n) heap-driven Visvalingam-Whyatt; single-pass epicycle computation; auto-compute watcher dedupe; `nHarmonics` priorSlug gate; dead `Animation` import excision). No fourier-side override of the texture opacity introduced; the fix flows from upstream per the *fix at root* discipline. Three residuals routed to successor tranches (see §5).

### W4 — Scaling, KISS and correctness pass (closed at `3658501`)

| Commit | Subject | Sub-agent |
|---|---|---|
| `3b7706d` | `chore(A.W4.c): delete logo.ts, math-worker.ts, compute.py — unconsumed substrate` | W4.c |
| `2eb5a57` | `fix(A.W4.c): move Mongo password to env reference + deploy.replicas:1 pin (Option A)` | W4.c |
| `599c5e6` | `docs(A.W4.c): land deploy-note rate-limiter constraint + .env.example update` | W4.c |
| `efdb4ff` | `refactor(A.W4.a): invert janitor from unbounded $nin to per-doc pinned flag` | W4.a |
| `840aacb` | `test(A.W4.a): janitor regression test — no $nin, indexed predicate, idempotent recompute` | W4.a |
| `b526088` | `docs(A.W4.a): land rate-limiter Option A source-side note + PROGRESS log entry` | W4.a |
| `7936137` | `fix(A.W4.b): contour-hash collision — hash on ordered coordinate pairs at image_storage.py:180` | W4.b |
| `2d7e24e` | `refactor(A.W4.b): consolidate gallery to cursor pagination — drop offset endpoint + count_documents` | W4.b |
| `0e016aa` | `feat(A.W4.b): contour-hash regression test pair + admin-caller cursor migration` | W4.b |
| `3658501` | `docs(A.W4.b): land W4.b close log entry — hash + gallery consolidation evidence` | W4.b (closes W4) |
| `7c04fa4` | `chore(A.W4+W3.5): close W4 + polish wave — status-board flips + close-ceremony log` | orchestrator |

Hard-gate verdicts per `waves/W4.md §"Hard gate"`:

| # | Gate | Disposition |
|---|---|---|
| 1 | Janitor no longer builds unbounded id set | SATISFIED — `test_janitor.py::TestJanitorNoUnboundedNin::test_no_nin_operator_anywhere` asserts no `$nin` in any query a full cycle issues; the pinned-flag inversion routes through indexed predicate `{"pinned": False, "last_accessed_at": {"$lt": cutoff}}`. |
| 2 | Rate-limiter Option A documented | SATISFIED — `audit/W4-deploy-note.md` §1 documents the `replicas: 1` pin + the rate-limiter scaling constraint; `docker-compose.prod.yml` enforces. |
| 3 | `test_contour_hash.py` exists, regression captured | SATISFIED — pre-fix collision reproduced for diagonal-pair and triangle-pair; post-fix discrimination confirmed; 3 new passing tests. |
| 4 | `logo.ts` / `math-worker.ts` / `compute.py` deleted | SATISFIED — `git grep` deletion proof. |
| 5 | Gallery one paginated list endpoint; no `count_documents` on hot path | SATISFIED — offset `GET /api/gallery` retired; cursor handler sole list path; `count_documents` removed. |
| 6 | No literal credential in tracked file | SATISFIED — `git grep cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` returns zero in source (survives only in audit-ledger witness files, as intended). |
| 7 | `uv run pytest` green; `vue-tsc -b --force` exit 0; `docker compose config` validates both compose files | SATISFIED — pytest 97 passed (89 baseline + 5 W4.a janitor + 3 W4.b hash); typecheck green; compose configs validate. |

Scope-reveal: ruff F841 unused `result` at `api/services/image_storage.py:224` — routed to tranche B per §5 (pre-existing, outside W4.b modify-carve bounds).

### W5 — Admin parity and functionality close (closed at `885d676`)

| Commit | Subject | Sub-agent |
|---|---|---|
| `d88969c` | `fix(A.W5.c): batch endpoint wrapper return types — {processed} → {ok, affected, errors}` | W5.c (contract FIRST) |
| `f0d066f` | `refactor(A.W5.a): admin idiom lift — Dialog/Select/Pagination + a11y` | W5.a |
| `e6e572c` | `docs(A.W5.a): land W5-a11y.md + PROGRESS log entry` | W5.a |
| `5053f5f` | `feat(A.W5.b): wire AdminAuditLog tab into GalleryView` | W5.b |
| `e464e29` | `docs(A.W5.b): close-amend — record AdminAuditLog co-landing under W5.a` | W5.b |
| `c981f3a` | `feat(A.W5.c): batch multi-select UI — gallery admin list` | W5.c |
| `885d676` | `fix(A.W5.d): FrequencyGraph log axis annotation + ConvergencePlot endpoint-true original curve` | W5.d |
| `4a4ad6d` | `docs(A.W5.c): land W5.c log entry — batch multi-select + contract-bug fix` | W5.c |
| `3bb5dbe` | `docs(A.W5.d): land W5.d screenshots — before/after pairs` | W5.d |
| `557ba4e` | `docs(A.W5): land W5 screenshots — gitignore override + audit-log/batch-multiselect captures` | orchestrator |
| `f874dac` | `chore(A.W5): close W5 — status-board flip + close-ceremony log entry` | orchestrator |

Hard-gate verdicts per `waves/W5.md §"Hard gate"`:

| # | Gate | Disposition |
|---|---|---|
| 1 | No native `confirm()` or `<select>` in admin tree | SATISFIED — `git grep` returns zero across `web/src/components/visualization/gallery/Admin*`. |
| 2 | Admin moderation passes a11y check | SATISFIED with documented substitution — manual checklist at `audit/W5-a11y.md`; `@axe-core/playwright` automation filed as tranche-B carry (no Playwright harness shipped). |
| 3 | `AdminAuditLog.vue` exists, tab wired, renders live `/api/admin/audit` data | SATISFIED — browser observation at `audit/W5-screenshots/audit-log.png`. |
| 4 | Batch multi-select round-trips against `batch_gallery` / `batch_users`; wrapper types match | SATISFIED — `BatchResponse { ok, affected, errors? }` shared interface at `web/src/lib/types.ts:225`; both wrappers re-typed; consumers ride the new shape. |
| 5 | `FrequencyGraph` log axis labelled; `ConvergencePlot` original curve closes | SATISFIED — screenshot pairs at `audit/W5-screenshots/{frequency-graph,convergence-plot}-{before,after}.png`; closure matches `paper/fourier_paper.tex:2272-2294` periodic-interval convention; no backend math change. |
| 6 | `npm run build` + `vue-tsc -b --force` green | SATISFIED — 12.70 s build at W5 close. |

### W6 — Close (this commit)

The W6 ceremony lands as the present commit: FINAL.md authorship (this document), A.md AMEND application (§2 below), CONSTELLATION.md emitted-carry disposition (§3 below), wave-doc Discharge appendices (Phase 4), PROGRESS.md status-board flip + tranche-level log entry. No new source touched.

## §3 — Cumulative metrics

The empirically verified tallies at the W6 commit:

| Metric | Value | Citation |
|---|---|---|
| File count cohort committed | 110 / 110 under `--untracked-files=all` (102 under default `git status` due to directory collapse) | W0-challenge §4 row 1 + W1 deletion-ledger 31 D paths |
| Override stylesheets deleted | `fourier-overrides.css` (354 LOC → 0); `ios-fixes.css` (35 LOC → 0); `buttons.css` (216 LOC → 0); `web/src/styles/` directory removed | W2.a + W2.b + W2.c + W2.e; `rmdir` succeeded at W2.e |
| Native `<button>` count | 89 → ~9 justified residue (decorative-SVG wrappers + ornament + W5 pagination + Tooltip) | W3.a + W3.b; W3 close ledger |
| Primitive adoptions (P12) | 13 MetricBadge across 8 files; AnimatedDigit / MetricRow / MetricStack / MetricCell / StatusDot / Skeleton retire-with-rationale | W3.c; `audit/W3-adoption-ledger.md` |
| Motion vocabulary | `cubic-bezier(...)` 29 → 0; `transition: all` 26 → 0; shadow `@keyframes` 6 → 0 | W3.d; pre/post grep tables in PROGRESS log entry |
| Pytest | 89 → 97 passed (W4.a +5 janitor; W4.b +3 contour-hash) | verified at W6 commit (`uv run pytest 2>&1 | tail`) |
| Backend Docker stack | Validated end-to-end at W2.h (RATIFY); 10 endpoint rows green; mongo init env vars + dev-compose env-driven credentials | W2.g + W2.h; `audit/W2-backend-validation.md` |
| Cross-repo carries discharged | 3 — glass-ui font-asset URL hygiene (`e123dc1`); paper-texture opacity (`9cf88e6`); sidebar `useSidebarState<T>` generic (`9b8de74`) | CONSTELLATION.md "Emitted" rows updated at §7 |
| Cross-repo carries still filed | 6 — press-scale unification; `--viz-easing` token; `::selection` base; Tabs entry animation; value.js color / path additions; glass-ui Pagination primitive (W5.a finding) | CONSTELLATION.md "Emitted" rows updated at §7 |
| Compute commits in tranche A | 65 commits under `git rev-list 3fc960c..HEAD --count` (W6 close commit raises to 66) | verified at W6 commit |

The 65-commit figure exceeds the prompt's "47-ish" estimate; the surplus traces to the in-band scope absorptions (W2.e through W2.h; the W3.5 polish wave; numerous backfill / reconciliation commits the close-ceremony discipline mandates after each sub-agent return). The plan was a tool, not a leash — see §9.

## §4 — AMEND ledger discharge

The seven AMEND rows enumerated at `audit/W0-challenge.md §4`, each marked DISCHARGED-via or DISCHARGED-by-edit-applied at this close.

| # | W0-challenge AMEND | Disposition at W6 |
|---|---|---|
| 1 | Cohort count 109 → 110 paths under `--untracked-files=all` | DISCHARGED via PROGRESS log entries (`2026-05-26 — W1.a` enumerates the 31 D paths; the 110 figure reconciled at W0-challenge close). No plan-doc edit needed — the W1 deletion-ledger carries the accurate count. |
| 5 | `ios-fixes.css` "2 rules" → 2 concerns / 3 selector blocks | DISCHARGED via W2.c — `ae84509` lifted the 3 selector blocks (mobile-first responsive sizing + code-block overflow split) into `style.css @layer base`; W2-disposition-ledger §W2.c records 14 rows; `ios-fixes.css` itself deleted in the same commit. |
| 6 | `buttons.css` outright-delete claim (H2 reading vs. live-consumer reality) | DISCHARGED via W2.e — `10e616c` fully abrogated `.btn-icon-admin` (3 sites) + `.btn-solid` + `.btn-ghost` + `.basis-pill` (4 sites) to `<Button>` / `<Badge>` per the user-directive in-band scope absorption. The original H2 outright-delete claim was substantively correct; the W0-challenge AMEND #6 amended the *sequencing* (W2 + W3 joint migration required) rather than the *terminus* (file deletes). The W2.e directive collapsed the joint sequencing into a single wave by pulling all `.btn-*` recipe migration into W2; the terminus held. |
| 4 | `fira-code` count 69 → 82 | DISCHARGED via W3.c — `04cf719` empirically enumerated 82 raw hits; 13 sites adopted to `MetricBadge`; 55 sites kept-as-decorative (slugs / hashes / section numbers / kbd hints / numeric inputs / text-state labels — all file:line cited in `audit/W3-adoption-ledger.md §"Kept-as-decorative sites"`); the residual 14 trace to in-component duplicate hits / multi-line declarations. The 82 figure is the canonical post-W3 count. |
| 9 | `@keyframes` 14 → 16; shadow count 7 → 6 | DISCHARGED via W3.d — `59f270a` verified 6 live shadows (`fade-in`, `scale-in`, `slide-up`, `collapsible-open`, `collapsible-close`, `tooltip-in`) and excised the 3 consumer-side declarations (`fourier-overrides.css` did not survive W2.a / W2.b; `CollapsibleSection.vue` + `ConvergencePlot.vue` cleared at W3.d); the candidate seventh `tab-slide-in` confirmed as a W2.b-folded fourier-local carry (not a glass-ui shadow), retained in `style.css` with its PRM guard. Eight legitimate fourier-local keyframes survive per W3-adoption-ledger §"`@keyframes` retained". |
| 20 | glass-ui pin v1.8.5 / `7e2e385` → v2.0.0 / `5e79443` | DISCHARGED via edit applied at this commit — `A.md §1` (the substantive thesis) historically referenced "glass-ui v1.x"; the close ceremony's edit pass updates `CONSTELLATION.md` Node-identity table to "v2.0.0 / `5e79443`" with the W0-challenge discovery note. The migration targets named in W3 hold under v2.0.0 (Skeleton root-barrel ratified at W0-challenge §2 row 12). |
| 21 | `ConfiguratorRow.vue` path missing `custom/configurator/` subpath | DISCHARGED via edit applied at this commit — `CONSTELLATION.md` "Emitted-to-glass-ui press-scale" row updated to cite `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91`. |

All seven AMEND rows DISCHARGED. The W6 close ceremony's plan-doc reconciliation checklist closes empty.

## §5 — Scope-reveals absorbed and routed

A absorbed work beyond the original plan; each absorption either landed in-band with named-destination citation or routes to a successor tranche.

| Scope-reveal | Disposition | Destination |
|---|---|---|
| W2.h docker-compose mongo init env vars | LANDED in-band at `5fdf6ff` (dev-side); prod completion at W4.c `2eb5a57` | n/a |
| W2.e `buttons.css` full abrogation directive | LANDED in-band at `10e616c` | n/a |
| W2.f glass-ui font-asset URL hygiene | LANDED cross-repo at glass-ui `e123dc1` (Option B — base64 inline data URIs) | discharged |
| W3.5.ab paper-texture opacity restoration | LANDED cross-repo at glass-ui `9cf88e6` | discharged |
| W3.5.c sidebar `useSidebarState<T>` generic | LANDED cross-repo at glass-ui `9b8de74` | discharged |
| W3.5.d visualization pipeline refinements | LANDED at `e0e9dda` (heap-VW, single-pass epicycles, auto-compute dedupe, priorSlug gate, dead substrate excision) | n/a |
| W4.b ruff F841 unused `result` at `api/services/image_storage.py:224` | ROUTED — pre-existing, outside W4.b modify-carve bounds | tranche B (CRUD convergence — natural home for `image_storage.py` structural work) |
| W3.5.d levels-derivation drift between `workspace.ts:runComputeBases` and `computation.py:compute_bases` | ROUTED | tranche B (CRUD convergence — lift to single seam in `ComputeBasesRequest` model) |
| W3.5.d backend `--reload` aborts in-flight compute on file write; onnxruntime CPU-vendor warning flood | ROUTED | tranche C (infra + image-blob) |
| W3.5.d `web/src/style.css:3` glass-ui import cold-boot race | ROUTED | glass-ui constellation carry (`pnpm vite optimize --force` mitigation; structural fix at glass-ui's next surface tranche) |
| W5.a glass-ui Pagination primitive (consumer-side fallback to icon `<Button>` pair) | FILED | glass-ui constellation (Q-tranche or successor) |
| W5.a `@axe-core/playwright` a11y automation | ROUTED | tranche B (natural Playwright-harness seam — no harness ships in fourier yet) |

## §6 — Carries to tranche B (CRUD convergence) — formal hand-off

Per `A.md §9` and `coordination/CONSTELLATION.md §"Sibling constellation"`, tranche B (the *CRUD / identity convergence* tranche, cross-repo with `@mkbabb/value.js`, `docs/tranches/B/`) inherits the following from A at this close. B's own discharge cycle owns the items; A's role is solely to name them with destination + substrate state.

1. **The five divergent identity schemes the audit surfaced.** Slug + content-hash + entity-id + cursor-token + draft-id — what the user experiences as one entity carries five identifiers under the present model. B converges to one canonical slug-addressed identity per invariant 11.
2. **The slug system convergence with value.js.** value.js's `palette-api` independently ships a slug-addressed entity model in Node / Express; fourier's `api/slugs.py` ships the adjective-noun-noun form in Python. B authors the shared contract (the CRUD-CONTRACT artefact under `docs/tranches/B/`).
3. **The visualization entity restructure.** Re-pointing the admin data layer at the converged entity. A made admin *look* right (W5.a idiom lift, W5.b audit viewer, W5.c batch UI); B makes the *model* right.
4. **The image-blob-out-of-Mongo question.** Per `A.md §9` deferred ledger, B's research wave (R4) decides whether it stays in B scope or defers to tranche C.
5. **The contour-hash bug behind a passing regression test.** W4.b discharged the bug at `image_storage.py:180`; the 3-test regression pair (`test_contour_hash.py::{positive_diagonal_hashes_distinctly_from_negative_diagonal, swapped_vertex_triangles_hash_distinctly, identical_curves_hash_identically}`) guards B's incoming substrate. B inherits clean substrate.
6. **The Option A rate-limiter decision.** Per `docs/audits/runs/2026-05-19-crud-deepen/SYNTHESIS.md` and `research/R-auth-spec.md §6`, B's auth spec inherits Option A (single-replica documented honestly via `deploy.replicas: 1`) with SHA-256-hashed IP keying. The fourier-side discharge lives at `audit/W4-deploy-note.md`.
7. **The W4.b scope-reveal carry.** Ruff F841 unused `result` at `api/services/image_storage.py:224` — routed per §5.

## §7 — Constellation final state

The state of `coordination/CONSTELLATION.md` after the W6 edit pass (Phase 3 of the close ceremony), reflecting empirical reality:

### Node identity (post-W6)

- glass-ui pin: `file:../../glass-ui` @ **v2.0.0 / `5e79443`** (revised from v1.8.5 / `7e2e385` per W0-challenge soft escalation; the W6 edit pass landed at this commit).

### Inherited from the glass-ui stream

| ID | Item | A disposition |
|---|---|---|
| M.W0 / M.W1-C | v1.0 subpath-surface migration | LANDED at `301a95e`; A verified clean at W0. |
| P CR-2 / P.W5-Lane-B | dock typed-context, `useClipboard`, HoverCard re-import, GlassScrubber adoption | LANDED at `4df1a06`; A re-confirmed at W0; no further work. |
| P12 | AB+1 primitive-adoption cohort (`AnimatedDigit`, `Metric*`) | **PARTIALLY DISCHARGED at W3.c (`6049995`)** — 13 MetricBadge sites adopted; remaining primitives retire-with-rationale per substrate-shape mismatch documented at `audit/W3-adoption-ledger.md`. |

### Emitted to the glass-ui stream (and value.js)

| Carry | Status at W6 |
|---|---|
| A → glass-ui press-scale unification | STILL FILED — no upstream commit; awaits glass-ui's next surface tranche |
| A → value.js color / path additions (`colorScale(stops, t)` + generic `sampleToSVGPath(fn, n)`) | STILL FILED — local carry; awaits value.js convergence under tranche B |
| A → glass-ui `--viz-easing` token | STILL FILED — local carry in `EasingPicker.vue` (4 consumers) |
| A → glass-ui `::selection` base | STILL FILED — local carry in `web/src/style.css @layer base` |
| A → glass-ui Tabs entry animation | STILL FILED — local carry in `web/src/style.css` (3 consumers via UnderlineTabs) |
| A → glass-ui font-asset URL hygiene | **DISCHARGED at glass-ui `e123dc1`** (W2.f, Option B base64 inline data URIs) |
| A → glass-ui paper-texture opacity | **DISCHARGED at glass-ui `9cf88e6`** (W3.5.ab, canonical subtle values 0.04 / 0.06) |
| A → glass-ui `useSidebarState<T>` generic | **DISCHARGED at glass-ui `9b8de74`** (W3.5.c, generic over `T extends TreeNode`) |
| A → glass-ui Pagination primitive (NEW at W5) | FILED at W5.a — present admin pagination uses icon `<Button>` pair fallback |

ConfiguratorRow.vue path corrected at this commit to `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91`.

## §8 — Tranche close evidence

Captured at the W6 commit (this commit). Each line is empirically run, not asserted.

| Check | Result |
|---|---|
| `git status` | clean (only the W6 closing commit's residue staged at the point of commit) |
| `cd web && npx vue-tsc -b --force; echo exit=$?` | **exit=0** |
| `cd web && npm run build` | **exit 0**; built in 18.30 s; largest chunks `index-CLIqMPAA.js` 861.96 kB (gzip 351.18 kB), `PaperView-DRP9LkK_.js` 471.25 kB (gzip 119.86 kB), `Tooltip.vue_*` 263.20 kB (gzip 78.69 kB) — chunk-size warning unchanged from the W3 envelope |
| `uv run pytest` | **97 passed in 204.10s (0:03:24)** |
| `uv run ruff check api` | 23 errors (the W0.a baseline) — **no regression** |
| Commit count `git rev-list 3fc960c..HEAD --count` (pre-W6) | **65 commits** (this W6 commit raises to 66) |

## §9 — Reflection

The K-invariant-3 shadow-execution anti-pattern is closed for the fourth time across the constellation — and this time the closure is paired with a binding tranche-folder, not a retrospective. fourier-analysis has run as a consumer node inside glass-ui's O / P / Q tranches without ever opening a plan folder of its own; that surface drift is the cost the constellation paid for the convenience of not authoring fourier's own letter. A is fourier's letter zero, and the discipline held: every wave closed on cited evidence, every sub-agent's commit threaded back to a hard-gate row, every AMEND from the W0-challenge §4 ledger has a discharge entry at §4 of this document. The contract-v2 cross-repo dev-resolution adoption at `a7d1904` was load-bearing in the close: without it, the buttons.css abrogation could not have been verified at build time, and the W2.f font-asset hygiene discharge would have stalled on a 403 the consumer could not bypass. The sidebar fix-at-root at W3.5.c is the corresponding evidence that the constellation has internalised the cross-repo discipline — the augmentation landed in glass-ui as `9b8de74` because fourier refused to coerce its `PaperSectionData` to a foreign tree shape; the substrate carried the wrong default, so the substrate took the fix.

The honest reckoning: A absorbed scope beyond the original plan. The W3.5 polish wave was not in `A.md §4`'s seven-wave schedule; the W2.h docker-compose fix landed in-band on a daemon-bearing host after W2.g escalated environmentally; the contract-v2 adoption was a constellation-driven scope-reveal the W2 disposition ledger had filed as a blocker. These were necessary, not gratuitous — each absorption traces to a user directive or a substrate fact the plan could not have predicted at authoring time, and each landed under a sub-agent letter (W2.e through W2.h; W3.5.ab through W3.5.d) with PROGRESS log attribution and hard-gate citation. The plan is a tool, not a leash; tranche-folder discipline produces a plannable substrate precisely because it accommodates scope honestly. What remains for tranche B: the CRUD / identity convergence the cross-repo audit surfaced — five divergent identity schemes, the slug convergence with value.js, the visualization entity restructure, the image-blob-out-of-Mongo question, the W4.b scope-reveal carry. The contour-hash bug is behind a passing regression test; the rate-limiter decision is Option A under deploy-pin; the admin surface is at glass-ui parity. B inherits clean substrate. Tranche A is closed.
