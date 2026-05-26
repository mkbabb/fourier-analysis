# L6 — Deferred + chronic items inventory

**Agent**: L6 (sixth of six, B-audit wave 1). **HEAD**: `c7cfd82`. **Mode**: READ-ONLY.

## §0 — Goal + completion criterion (paired)

**Goal.** Surface every deferred item, named-successor carry, scope-reveal, and chronic-deferral mention across the tranche-A corpus and cross-reference each against tranche-B's current scope so that B's authoring round can absorb load-bearing chronics and route the rest with destination-discipline (P-Inv 28).

**Completion.** A single audit document carrying: an exhaustive deferral inventory (§2); a chronic-risk analysis of items routed forward two or more times (§3); a B-scope cross-reference flagging gaps (§4); a C-scope inventory (§5); an orphan-verdict drift check (§6); a severity-classified chronicity ledger (§7); and recommendations partitioned by destination (§8). Both criteria hold at this writing.

## §1 — Substrate observed

Read in full: `docs/tranches/A/{A,FINAL,PROGRESS}.md`; `docs/tranches/A/coordination/CONSTELLATION.md`; `docs/tranches/A/waves/W{1..5}.md`; `docs/tranches/A/audit/{W0-challenge,W3.5-pipeline,W4-deploy-note,W5-a11y,W3-adoption-ledger}.md`; `docs/tranches/B/B.md` + `PROGRESS.md`; `docs/tranches/B/waves/W{1,3,4}.md`; `docs/tranches/B/coordination/{CRUD-CONSTELLATION,CRUD-CONTRACT,CONFORMANCE-MATRIX,SCHEMA,SLUG-WORDS,CRUD-LIB-PY,CRUD-LIB-TS}.md`; `docs/tranches/B/research/{R-identity,R-auth,R-lifecycle}-spec.md`; `docs/audits/runs/2026-05-19-refinement-assay/{r1,r4,r6}.md`; `memory/project_{tranche_a,infra_plan}.md`. Aggregate raw deferral-keyword hit count across the corpus: **≈ 322** (A.md 28; FINAL.md 30; A/PROGRESS.md 47; A wave specs 41; A audit ledgers ≈ 62; CONSTELLATION 8; B.md 14; B/PROGRESS.md 12; B coordination 172).

## §2 — Exhaustive deferral inventory

| # | Source file:line | Verbatim clause (key phrase) | Destination | Status |
|---|---|---|---|---|
| 1 | `A/A.md:148-152` | "Deferred out of A and B — fourier tranche C … Infra beyond deploy-file hygiene; webhook CI/CD; MongoDB TLS; port standardization; image-blob-out-of-Mongo storage redesign" | fourier-C | OPEN (C unauthored) |
| 2 | `A/A.md:142` | "A → glass-ui press-scale unification … STILL FILED at W6 close — no upstream commit" | glass-ui | FILED-twice (A.W0 → A.W6) |
| 3 | `A/FINAL.md:219, 292` | "value.js color / path (`colorScale`, `sampleToSVGPath`) — STILL FILED — local carry; awaits value.js convergence under tranche B" | value.js (orphaned) | CHRONIC-FILED |
| 4 | `A/FINAL.md:293` | "glass-ui `--viz-easing` token — STILL FILED — local carry" | glass-ui | FILED |
| 5 | `A/FINAL.md:294` | "glass-ui `::selection` base — STILL FILED — local carry" | glass-ui | FILED |
| 6 | `A/FINAL.md:295` | "glass-ui Tabs entry animation — STILL FILED — local carry" | glass-ui | FILED |
| 7 | `A/FINAL.md:299` | "glass-ui Pagination primitive (NEW at W5) — FILED at W5.a" | glass-ui | FILED (newest) |
| 8 | `A/PROGRESS.md:707-708, 806`; `A/FINAL.md:172, 252, 269`; `A/waves/W4.md:148` | "Ruff F841 unused `result` at `api/services/image_storage.py:224` — routed to tranche B" | B (CRUD convergence) | OPEN-routed |
| 9 | `A/audit/W3.5-pipeline.md:18, 72, 191-194` | "Levels derivation drift between `workspace.runComputeBases` and `computation.compute_bases` — Routed B" | B (request-model lift) | OPEN-routed |
| 10 | `A/audit/W3.5-pipeline.md:73, 196-200` | "Backend `--reload` aborts in-flight compute — Routed C" | fourier-C (infra) | OPEN (C unauthored) |
| 11 | `A/audit/W3.5-pipeline.md:74, 200-202` | "onnxruntime CPU-vendor warning flood — Routed C" | fourier-C (infra) | OPEN (C unauthored) |
| 12 | `A/audit/W4-deploy-note.md:29, 131` | "Option B (Mongo TTL bucket) → fourier tranche C debt path; until that migration lands, raising `replicas` above 1 silently breaks the per-IP throttle" | fourier-C (rate-limiter) | OPEN-routed |
| 13 | `A/audit/W5-a11y.md:22, 103, 110` | "`@axe-core/playwright` automated pass is deferred to tranche B as a named carry … natural Playwright-harness seam" | B (W4 Playwright seam) | OPEN-routed |
| 14 | `A/audit/W3.5-pipeline.md:204-209` | "`web/src/style.css:3` glass-ui import cold-boot race — Routed W3.5.ab; structural fix at glass-ui's next surface tranche" | glass-ui (constellation) | DISCHARGED-narrow (cold-boot mitigation only) / structural-fix STILL FILED |
| 15 | `A/audit/W4-deploy-note.md:29` | "Must first migrate the rate-limiter off its in-process token-bucket store" | fourier-C | OPEN-routed |
| 16 | `A/coordination/CONSTELLATION.md:38` | "A surfaces several cross-repo carries. None is a fourier-side fix; all are filed for the relevant upstream's next tranche" | glass-ui / value.js | meta-statement |
| 17 | `B/B.md:122-126` | "Deferred to fourier tranche C: Image-blob storage redesign; `colors.ts` gut + `easings.ts` sampler retirement (orphan-verdict); Infra (webhook CI/CD, MongoDB TLS, port standardisation)" | fourier-C | OPEN (C unauthored) |
| 18 | `B/B.md:33, 57-59, 120` | "value.js-C is partially-discharged and structurally orphaned … `colors.ts` gut becomes a named B-residual with destination `fourier-tranche-C-or-successor`" | fourier-C-or-successor | OPEN-routed |
| 19 | `B/PROGRESS.md:66` | "A value.js impersonation endpoint missing `expiresAt` — filed to value.js; not in B scope" | value.js | FILED |
| 20 | `B/research/R-lifecycle-spec.md:475, 521` | "image-blob redesign deferred to fourier tranche C — this research confirms the default is correct: defer" | fourier-C | OPEN-routed-and-ratified |
| 21 | `A/A.md:137` | "P12 — primitives → PARTIALLY DISCHARGED at W3.c (`6049995`); remaining primitives retire-with-rationale" | n/a (closed honestly) | DISCHARGED (with honest-retirement) |
| 22 | `A/audit/W0-challenge.md` AMEND ledger (7 rows) | seven AMEND rows ledgered at challenge for W6 absorption | W6 close ceremony | DISCHARGED at FINAL §4 |
| 23 | `r6-fourier-C-scope.md:43-45` | "Rate-limiter upgrade — deferred out of C; future fourier-D pickup if multi-replica becomes a real requirement" | fourier-D (hypothetical) | TIERED-deferral |

## §3 — Chronic-deferral analysis (items routed forward 2+ times)

A chronic-deferral item is one routed forward through two or more discrete planning gates without ratification. The K-invariant-3 cohort (closed at A.W1) was such an item; closure does not preclude fresh chronics from accreting.

1. **value.js `colorScale` + `sampleToSVGPath` library additions** (item #3). Filed at A.W2.b CONSTELLATION; restated at A.W6 (`FINAL.md §7`, "STILL FILED"); reframed at B.W4 as orphan-verdict residual destined `fourier-tranche-C-or-successor` (B.md §7, B/PROGRESS.md:100). **Three gates without landing**; the upstream is structurally orphaned per the R1/R4 assays. CHRONIC.
2. **glass-ui press-scale unification** (item #2). Filed at A.W0-challenge §4 row 21 (path correction); restated at A.W6 ("STILL FILED — no upstream commit"). **Two gates**; awaits glass-ui's next surface tranche. CHRONIC-RESIDUAL.
3. **Infrastructure standardisation** (item #1, #17). Named at `memory/project_infra_plan.md` (2026-03-28); deferred from A.§9; deferred from B.§7. **Three gates**; fourier-C unauthored — the file containing the plan is the only governance. CHRONIC-LOAD-BEARING.
4. **Image-blob-out-of-Mongo storage redesign** (items #1, #17, #20). Named at A.md §9; restated at B.md §7; researched at R-lifecycle-spec §6.2-6.3 and ratified-as-deferred; named at r6-fourier-C-scope as C's primary thesis. **Three gates and now ratified-deferred**; C-scope is scoped but the tranche itself is unauthored. CHRONIC-LOAD-BEARING.
5. **Backend `--reload` aborts in-flight compute** (item #10). Surfaced at W3.5.d; routed to C; C unauthored. **Two gates**; observable as `ERR_EMPTY_RESPONSE` cascade. CHRONIC-RESIDUAL (development-ergonomics severity).
6. **onnxruntime CPU-vendor warning** (item #11). Surfaced at W3.5.d; routed to C; C unauthored. **Two gates**; cosmetic. NOT-CHRONIC (cosmetic; explicit cosmetic-scope deferral is acceptable indefinitely).
7. **Option B rate-limiter (Mongo TTL bucket)** (items #12, #15). Named at A.W0-challenge §3; ratified Option A at A.W4; Option B filed forward to C; r6 ratifies the C-deferral and defers it again to a hypothetical fourier-D. **Three gates and now tiered**. NOT-CHRONIC (invariant-12-satisfying disposition; only triggers when multi-replica becomes a need).
8. **Ruff F841 unused `result` at `image_storage.py:224`** (item #8). Discovered at W4.b; routed to B; B.W3's `image_storage.py` modify-carve is the natural absorption seam (`B/waves/W3.md` scope §3 + file-bounds table). **One gate, with B's natural absorption seam present**. NOT-CHRONIC if B.W3 absorbs.
9. **Levels-derivation drift** (item #9). Discovered at W3.5.d; routed to B as "lift to single seam in `ComputeBasesRequest` model". **One gate**. **B-scope-GAP**: no B wave currently names this absorption (search of `B/waves/W{1,3,4}.md` returns zero hits for `levels-derivation` or `runComputeBases`). FLAG.
10. **MetricBadge / AnimatedDigit etc. subpath-only export surface** (P12 partial discharge). W3.c adopted MetricBadge × 13; the remaining primitives retire-with-rationale at `W3-adoption-ledger.md:42-46`. The retirement is honest (substrate-shape mismatch), not chronic. NOT-CHRONIC.
11. **`@axe-core/playwright` a11y automation** (item #13). Filed at A.W5; routed to B as "natural Playwright-harness seam". B.W4.d authors `e2e/visualization-crud.spec.ts` — the Playwright harness lands. **B-scope-GAP**: no B wave names axe integration. FLAG.
12. **Contour-hash structural restructure**. W4.b did the narrow hash fix (correctness); B.W3 §3 scope explicitly owns the structural restructure of `api/services/image_storage.py` ("split blob/hash from slug issuance; lift slug-issuance into `api/slugs.py`"). **Cleanly absorbed in B**; NOT-CHRONIC.
13. **Mongo password literal at `docker-compose.prod.yml`**. W4.c moved to env reference (`2eb5a57`); `git grep cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` returns zero in source (FINAL.md §2 W4 gate 6). DISCHARGED.

## §4 — B-scope cross-reference

| Routed-to-B item | Absorbing B wave | Disposition |
|---|---|---|
| Ruff F841 `image_storage.py:224` | **B.W3.b** (file-bounds includes `image_storage.py` modify-carve) | ABSORBED |
| Contour-hash structural restructure | **B.W3** §3 (named explicitly) | ABSORBED |
| Five-divergent-identity-schemes convergence | **B.W3** + **B.W4** | ABSORBED (load-bearing) |
| Slug convergence with value.js | **B.W1** (CRUD-CONTRACT) + **SLUG-WORDS** | ABSORBED |
| Visualization entity restructure | **B.W3** + admin re-point **B.W4.c** | ABSORBED |
| Rate-limiter Option A doc | **B.W3** §13 (README single-replica block) per R3 §6 | ABSORBED |
| `colors.ts` gut onto value.js | **B.W4.b** (held under orphan-verdict; reframed as `fourier-tranche-C-or-successor` residual) | ABSORBED-as-deferred |
| **Levels-derivation drift** (W3.5.d → B) | **none currently** — no row in W1, W3, or W4 scope names `ComputeBasesRequest` lift | **FLAG-GAP** |
| **`@axe-core/playwright` a11y automation** (A.W5 → B) | **none currently** — W4.d authors Playwright spec but does not name axe integration | **FLAG-GAP** |

## §5 — C-scope inventory

Every "route to C" / "fourier-tranche-C" reference (C is named at A.md §9 and B.md §7 but unauthored at HEAD `c7cfd82`):

1. Image-blob-out-of-Mongo storage redesign — primary C thesis per r6 (filesystem + nginx > GridFS > MinIO > managed S3).
2. Infrastructure standardisation per `memory/project_infra_plan.md` — webhook CI/CD; MongoDB TLS posture; port standardisation; secondary C thesis per r6 §1.
3. Backend `--reload` aborts compute (W3.5.d) — disable `--reload` for compute container OR move to background queue.
4. onnxruntime CPU-vendor warning suppression (W3.5.d).
5. Rate-limiter Option B (Mongo TTL bucket) — only if multi-replica becomes a real need; r6 §3.2 defers this further to a hypothetical fourier-D.
6. `colors.ts` gut + `easings.ts` sampler retirement — `fourier-tranche-C-or-successor` per B.W4.b orphan-verdict primary path (the "successor" qualifier admits a future value.js re-engagement at any letter; not strictly C-bound).
7. Any color/palette-domain residual not absorbed by B.W4 (a forward-declared possibility, not a current named item).

## §6 — Orphan-verdict context check

The R1 + R4 assays (`docs/audits/runs/2026-05-19-refinement-assay/r{1,4}.md`) record the value.js-C orphan verdict: value.js raced D→E→F→G→H, landing six of thirteen contract surfaces incidentally, never opening C, never ratifying the cohort contract. fourier-B's authored plan **fully reflects** this:

- `B.md §0`-block (line 9) declares the orphan verdict.
- B.md §3 W2 row marked "Not load-bearing under the orphan verdict … tracked-as-orphaned".
- B.md §3 W4 title amended to "fourier convergence wiring (orphan-verdict fallback primary)".
- B.md §6 hard-gates carry "Under the orphan-verdict fallback" overlays.
- B.md §7 carries an explicit "Cross-repo dependency (orphan-verdict, 2026-05-26)" sub-section.
- `B/PROGRESS.md:30, 100` records the verdict and the W4 reframing.
- `B/waves/W1.md`, `B/waves/W3.md`, `B/waves/W4.md` each carry orphan-verdict overlays at their hard-gates and sub-gates; `DEFERRED` is admitted as a fifth conformance-matrix status alongside TBD/WIP/PASS/WAIVED per R3 §9.

**No plan-doc drift detected.** The orphan verdict is absorbed.

## §7 — Chronicity ledger

| Item | Severity | Citations | Proposed B-absorption |
|---|---|---|---|
| Infrastructure standardisation (webhook CI/CD, MongoDB TLS, port) | **CHRONIC-LOAD-BEARING** | `memory/project_infra_plan.md`; A.md §9; B.md §7; r6 §1 | **None** — belongs to fourier-C (whose scope r6 already drafts). B-scope rejection appropriate. |
| Image-blob storage redesign | **CHRONIC-LOAD-BEARING** | A.md §9; B.md §7; R-lifecycle-spec §6.2-6.3; r6 §1, §3.4 | **None** — research-ratified as C-scope. |
| value.js `colorScale` / `sampleToSVGPath` lifts | **CHRONIC-RESIDUAL** | A/CONSTELLATION:43; FINAL §7; B.md §7; B.W4.b | Already absorbed-as-deferred to `fourier-tranche-C-or-successor`. Status is honest. |
| glass-ui press-scale unification | **CHRONIC-RESIDUAL** | A.W0-challenge §4 row 21; FINAL §7 | Belongs in glass-ui's next surface tranche; B should NOT absorb. |
| `--reload` aborts compute | **CHRONIC-RESIDUAL** | W3.5-pipeline.md §2, §5 | Belongs to C (dev-ergonomics). |
| Levels-derivation drift | **NOT-CHRONIC-BUT-GAP** | W3.5-pipeline.md §5 | **B-SCOPE-GAP — add to W3 (request model)** |
| `@axe-core/playwright` automation | **NOT-CHRONIC-BUT-GAP** | W5-a11y.md:22, 103, 110 | **B-SCOPE-GAP — fold into W4.d** |
| Ruff F841 `image_storage.py:224` | **NOT-CHRONIC** (one gate; B.W3.b file-bounds absorbs) | A/PROGRESS:707; FINAL §5; W4.md:148 | Already absorbed; B.W3.b will close incidentally. |
| Glass-ui Pagination primitive | **NOT-CHRONIC** (one gate; W5-novel) | A/CONSTELLATION:47 | Belongs in glass-ui. |
| `--viz-easing`, `::selection`, Tabs entry animation | **NOT-CHRONIC** (named local carries) | A/CONSTELLATION:44-46 | Belong in glass-ui; B should NOT absorb. |
| onnxruntime warning | **NOT-CHRONIC** (cosmetic) | W3.5-pipeline.md §2 | C-territory; deferral safe indefinitely. |

## §8 — Recommendations for B-authoring round

**Must absorb in this B authoring round (close the two FLAG-GAPS):**

1. **Levels-derivation drift** — add a `B.W3` scope row (or a `B.W4` agent sub-task on `web/src/stores/workspace.ts`) naming the lift of the `Array.from({length: min(N,50)}, …)` construction into the `ComputeBasesRequest` Pydantic model so the derivation has a single seam. The current `B.W3` scope (`api/models/visualization.py` + the request-shape work) is the natural home; one line in §3 plus a file-bounds row for `api/models/shared.py` (or a new `api/models/compute.py`) discharges it.
2. **`@axe-core/playwright` adoption** — augment `B.W4.d`'s Playwright sub-gate to require an `axe-core` integration in `e2e/visualization-crud.spec.ts` (or a sibling spec) per `audit/W5-a11y.md:110`. Without this, the W5-filed carry chronic-defers to its third gate.

**Defer to a later B sub-wave or to B.W5 (close):**

- The value.js orphaned cross-repo carries (`colorScale`, `sampleToSVGPath`) — already handled by orphan-verdict overlay at B.W4.b; B.W5 records the named-successor entry in PROGRESS.md.
- The W4.b ruff F841 — incidental absorption at B.W3.b (no plan-doc edit needed; `image_storage.py` modify-carve naturally retires the unused `result`).

**Belongs outside B (do not absorb):**

- All five glass-ui local carries (`press-scale`, `--viz-easing`, `::selection`, `Tabs entry`, `Pagination`) — belong to glass-ui's next surface tranche; CONSTELLATION discipline holds.
- All fourier-C named items (infra; image-blob; `--reload`; onnxruntime; rate-limiter Option B; `colors.ts` residual). C-authoring is its own follow-on; B should not annex C scope.

**Quantitative summary.**
- Total deferral hits across corpus: **322** (across 15 instrumented files).
- Chronic-risk items (routed forward 2+ times): **5** (items 1, 2, 3, 4 of §3; arguably 5).
- CHRONIC-LOAD-BEARING: **2** (infrastructure; image-blob).
- CHRONIC-RESIDUAL: **3** (value.js color/path; press-scale; `--reload`).
- B-absorption count (already in scope): **7**; **2 additional gaps to absorb** (levels-derivation; axe).
- C-absorption count (named, awaiting C-authoring): **5–6** rows.
- glass-ui-carry count (filed and held outside fourier scope): **5** rows.
