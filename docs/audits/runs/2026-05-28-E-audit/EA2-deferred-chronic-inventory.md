# EA2 — deferred + chronic inventory (E-development)

**Lane**: EA2 — chronic + deferred inventory across the full fourier tranche lineage A/B/C/D + the cross-repo cohort (value.js / palette-api / csp-solver / keyframes.js / floridify) + the host-coupled live residuals.
**Mode**: READ-ONLY. One deliverable; no source edits, no commits.
**HEAD substrate**: D CLOSED 2026-05-28 **CLEAN** (`docs/tranches/D/FINAL.md`); the six-thread close (α/β/γ/δ/ε + α′) confirmed all aims met; the prior `complete_with_constellation_residuals` framing was superseded after the user granted babb.dev access to Mike7400's CF account and W8/W9/W10/W11 all landed GREEN in single-session execution. C closed 2026-05-27 (`1e47115`); B closed 2026-05-27 (`fc5b3b0`); A closed 2026-05-26 (`c7cfd82`); value.js at H close (`16129e0`, v0.10.0) — I-SEED authored but I tranche not opened.
**Mirrors**: `docs/audits/runs/2026-05-27-D-audit/DA2-deferred-chronic-inventory.md` (the prior chronic-inventory lane authored at D dispatch) — same shape, one tranche later, with D's discharges + D-era new surfaces folded.
**Directive**: enumerate every named deferral / out-of-scope / orphan across A/B/C/D + the cross-repo cohort, classify chronic (carried ≥ 2 tranches) vs new-in-D vs discharged-by-D vs explicit-out-of-scope, and fold the load-bearing residue into the seed of tranche E.

## §0 — Summary count

| Class | Count | Note |
|---|---|---|
| **DISCHARGED-by-D** | **15** | items closed since the C-close / D-authoring inventory — see §4 |
| **CHRONIC (≥ 2 tranches)** | **9** | the user's "chronically deferred" target — see §1 |
| **NEW-IN-D** | **11** | first surfaced in D close ceremony or D execution — see §2 |
| **OUT-OF-SCOPE-explicit** | **6** | bounded by invariant or D.md §7 — see §1 / §2 closing notes |
| **CROSS-REPO** | **9** | residuals owned by sibling-repo maintainers (value.js, csp-solver, keyframes.js, floridify, palette-api standalone) — see §3 |
| **Total enumerated** | **35** items + the 53 DEFERRED-TO-VALUE.JS matrix cells (value.js-side, gated) |

The chronic body shrank substantially since DA2 (11 → 9): three of DA2's "host-coupled chronics" (items 1/2/3 — dispatcher wiring, prod TLS cutover, prod blob migration RUN) **all discharged at D's α/β-host threads**; the headline colour-lift orphan persists; the four glass-ui substrate carries persist; the never-built-by-design §U strikes persist (still WONTFIX-revive-if-built).

## §0.1 — Classification key (mirrors DA2 §0.1 + EA-era refinements)

- **CHRONIC** = deferred across ≥ 2 discrete planning gates (A→B, A→B→C, A→B→C→D, etc.). The user's "chronically deferred" target.
- **NEW-IN-D** = first surfaced during the D execution window or at D's close ceremony; awaits E.
- **DISCHARGED-by-D** = a D wave (α/β/γ/δ/ε/α′) closed it; recorded for completeness.
- **OUT-OF-SCOPE-explicit** = bounded out by an invariant clause or `D.md §7` declaration; the deferral is honest indefinitely.
- **LOAD-BEARING** = correctness / observability / deploy / security obligation; non-discharge degrades the system.
- **RESIDUAL** = cosmetic, ergonomic, or latent-affordance; non-discharge is honest until triggered.
- **CROSS-REPO-OWNED** = the discharge action belongs to a sibling-repo maintainer (value.js, csp-solver, keyframes.js, floridify, palette-api standalone), not fourier-E.
- **HOST-COUPLED-LIVE** = live production state where the discharge requires host action; in scope for E only if the host condition demands it.

## §0.2 — Empirical state-checks at this writing (load-bearing for the map)

Every status word below resolves to the live HEAD tree + the prod host state captured at D close (2026-05-28), not to a doc's claim.

| Check | Finding | Effect on map |
|---|---|---|
| `git grep -n 'tlsAllowInvalidCertificates' docker-compose.prod.yml` | **The two URI-side flags are GONE** (W2 spine 1, `1233b06`); **only `--tlsAllowConnectionsWithoutCertificates` remains on the mongod command** as an honesty-pivot — mongod 8.0 reality (`tls.md §1.1`). | DA2 item 2 (CHRONIC-LOAD-BEARING TLS cutover) **DISCHARGED** at D.W2. The retained mongod flag is policy-documented, not a chronic. |
| `test -f scripts/deploy.sh` | **STILL GONE**; `scripts/deploy-hook.sh` (8011 B) tracked + host-deployed; `/opt/deploy/scripts/dispatch.sh` fourier-arm re-pointed at W1.Phase2. | DA2 item 1 (CHRONIC-LOAD-BEARING dispatcher wiring) **DISCHARGED** at D.W1. |
| `ssh ... 'cat /opt/deploy/fourier-last-green'` | `2757c43`. **Prod fourier HEAD advanced from pre-A `8818ae5` (4 March 2026) through the full A/B/C/D wave ledger** in a single deploy cutover at W1.Phase2 + W3+W4 deploy. | The "production parity" D-invariant LIVE; A/B/C now genuinely deployed. |
| `docker volume inspect image_blobs` (host) | EXISTS; `migrate_image_blobs.py` ran no-op against empty DB at W1 cutover (the binding *code-and-migration-together* invariant held). | DA2 item 3 (CHRONIC-LOAD-BEARING blob migration RUN) **DISCHARGED** at D.W1 cutover. |
| `git grep -n 'snapshot_hash\|snapshotHash' api/` | Zero on identity paths (W3 `ce61e7c`); `flags.snapshot_hash` → `content_hash`; the 11 dead boot indexes for `gallery` deleted; typed `ImageAsset` model lives. | The backend NO-legacy symmetry (DA1's pivotal "C closed front-end only") **DISCHARGED** at D.W3. |
| `grep -rn 'onnxruntime' src/fourier_analysis/contours/ml.py` | Still live at `:72,213` (`import onnxruntime as ort`). | The CPU-vendor warning flood (A.W3.5 carry) **STILL CHRONIC** (3 gates: A → C-not-folded → D-not-folded). Cosmetic; honest indefinitely. |
| `find /Users/mkbabb/Programming/value.js/src/ -name "*.ts" | xargs grep -l sampleToSVGPath` | **Zero matches** — value.js@0.10.0 still does NOT export `sampleToSVGPath`. Only `cubicBezierToSVG` exported (`src/math.ts:69`; `src/index.ts:170`). | The colour-lift orphan (A.W2.b → B.W4 → C.W4-δ → D.W5) **STILL CHRONIC** (4 gates). The headline residual. |
| `find /Users/mkbabb/Programming/value.js/docs/tranches/I -type f` | **Does not exist** — only `value.js/docs/tranches/H/I-SEED.md` (advisory, predecessor-authored at H close). The I tranche has NEVER been opened (no `docs/tranches/I/I.md`, no W0 dispatch). | The 53 DEFERRED-TO-VALUE.JS cells (D.W5 VALUE-JS-ASK) remain **CROSS-REPO-OWNED, user-re-mandate-gated**. I.W1-W4 sketches authored fourier-side; value.js-side opening is the gating action. |
| `ls /home/mbabb/Programming/palette-api/` (developer-machine path) | **N/A on developer machine** (the path is host-side); per `PALETTE-API-PROVENANCE.md §1.1`: standalone host dir, NO `.git/`, rsync-target only. Source-of-truth lives at `value.js/api/`; PROVENANCE-RECONCILE recorded at D.W11. | The W11 FULL rename of compose project / container / dir / volume (data-bearing) remains **CROSS-REPO-OWNED, DEFERRED for a scheduled-downtime window or value.js tranche**. |
| The `mkbabb/value.js` dispatcher arm (`/opt/deploy/scripts/dispatch.sh`) | Calls `deploy "$HOME/Programming/palette-api" "8130" "/"`; `deploy()` starts with `git fetch origin && git reset --hard origin/master` on a **non-git host dir** — would fail immediately if exercised. The W10 GitHub-webhook URL flip exposed this latently. No `mkbabb/value.js` push has yet exercised the failure. | **NEW-IN-D LATENT-BROKEN STUB.** Operational reality is PATH A (developer-rsync via `value.js/api/deploy.sh`). E disposition: surface in §2 + recommend either fix-the-arm OR explicitly delete it. |
| `*.babb.dev → 185.199.x.x` CF wildcard | LIVE (W10 audit §11 #6 finding); any new `<sub>.babb.dev` name not explicitly defined resolves to GH-Pages IPs and returns `*.github.io` cert errors. | **NEW-IN-D FOOTGUN.** Recorded at W10 close; W12 noted "may want to either narrow or remove the wildcard". E disposition: §2 + narrow at first surface-creation opportunity. |
| `uv run pytest api/tests/test_image_storage.py::test_backfill_image_bounds_on_migrated_image` | **STILL FAILS** at D-HEAD `2757c43` — the typed-shim rejects a pre-migration image during bounds backfill (W3-followup). | **NEW-IN-D LOAD-BEARING-LIGHT.** Pre-existing test failure named in D.FINAL.md §6.3; surface as a D-followup. |
| `npm run build` index bundle size | **854.40 kB** (single chunk); chunk-size warning suppressed per `D.md §7` (bundle split out-of-scope of D). | **NEW-IN-D RESIDUAL-PERF.** Honest residual; route per §2. |
| `inv-18 / inv-19 / inv-20` numbering | The C-era numbering inconsistency is **STILL UNRECONCILED** at HEAD. `D.md §2` records "a γ sub-item reconciles the numbering at execution, binding by *name* not number meanwhile"; D close did not reconcile. | **CHRONIC-COSMETIC (2 gates)**: B → C → D-not-reconciled. The "bind by name not number" workaround holds; cosmetic. |

## §1 — Chronic items (≥ 2 tranches) — load-bearing for E

The DA2 list of 11 chronics shrank to 9 after D's α/β-host threads discharged the three host-coupled load-bearings (items 1/2/3). What remains is mostly substrate-orphan (glass-ui carries), KISS-by-design (§U strikes), or true cross-repo-pending (colour-lift, value.js CRUD cohesion).

| # | Item | Origin (first tranche) | Tranches carried | Class | Current status | Root cause of chronicity | Smallest-honest-mechanism for E closure |
|---|---|---|---|---|---|---|---|
| **C1** | **HEADLINE — Colour-lift `sampleToSVGPath` consume** | A.W2.b (#292, 2026-05-18) | A → B.W4 → C.W4-δ → D.W5 (**4 gates**) | CHRONIC-RESIDUAL (orphaned, cross-repo) | `value.js@0.10.0` STILL does NOT export the helper; only `cubicBezierToSVG`. The consume cannot fire. `web/src/lib/easings.ts` byte-identical to pre-W5; the carry is held as "named residual" with a hard no-silent-orphan check. | The blocker is structural and cross-repo: value.js's `src/math.ts` would need to add the export. value.js has shipped 5 tranches (D/E/F/G/H) without it; I is seeded but not opened. | E should NOT annex; the closure remains a value.js-side publish. **E action**: re-state in E.§carries with the hard no-silent-orphan check; if value.js-I opens during the E window and publishes the helper, fire the one-line consumer-half swap. Otherwise hold. |
| **C2** | **The full `Palette` / `colorScale` value.js domain model** | B.W2 ("Three" cell in CRUD-CONSTELLATION, 2026-05-19) | B → C.W4 → D.W5 (**3 gates, latent**) | CHRONIC-RESIDUAL (latent, cross-repo) | `VIZ_COLORS.rainbow` never sampled in fourier; building the model in fourier violates invariant 15; building it at all is "the library nobody calls". Held latent at every gate. D.W5 records "0 library". | No real fourier consumer exists. The model would be premature engineering against an unbuilt UI surface. | **E action**: not E's. Open this in value.js-I (or a successor value.js tranche) iff a real fourier consumer surfaces (e.g. a gradient/scale UI). Stays latent through E. |
| **C3** | **53 DEFERRED-TO-VALUE.JS CRUD-CONTRACT cells (matrix v2.0.0)** | B.W1 (matrix authored 2026-05-19) | B → C-not-touched → D.W5 (**3 gates, orphaned**) | CHRONIC-RESIDUAL (orphaned, cross-repo) | 27 ADDRESSED / 53 DEFERRED-TO-VALUE.JS / 7 RETIRED-AS-OVER-SPEC (87 total). The 53 cells are I.W1-W4-sketched per `VALUE-JS-ASK.md §2` (13 identity + 7 soft-delete + 3 admin + 30 SOTA-envelopes). value.js-I tranche not yet opened. | value.js raced D/E/F/G/H without ever opening C (the cohort peer to fourier-B); I is seeded but thesis-undeclared. The cohesion thread is the orphan-completion. | **E action**: not E's. The `palette_slug` FK clause holds at v2.0.0 as the binding cross-repo artefact; the 53 cells await a user re-mandate of the value.js side. If user re-mandates, value.js opens I and authors I.W1-W4 per the sketch. fourier-E records the dependency in §carries. |
| **C4** | **onnxruntime CPU-vendor warning flood** | A.W3.5 (#254, 2026-05-19) | A → C-not-folded → D-not-folded (**3 gates**) | CHRONIC-RESIDUAL (cosmetic) | Live at `src/fourier_analysis/contours/ml.py:72,213`. C marked WONTFIX-able; D did not fold. Cosmetic log noise. | No-fallbacks precept does not mandate suppression; the warnings are honest about CPU-fallback runtime. Folding the one-line suppression has never been worth the wave-allocation. | **E action**: fold opportunistically into E.W0 baseline as a single-line `os.environ['ORT_LOGGING_LEVEL'] = '3'` or equivalent in `__init__.py` if a wave touches the contour pipeline; else stay WONTFIX. |
| **C5** | **glass-ui substrate carries** (`--scale-press*` unification; `--viz-easing` token; `::selection` base; Tabs entry animation; Pagination primitive; `ConfiguratorLayer` header-actions slot; dock `aria-hidden-focus`) | A.W0-challenge / A.W5.a / A.W6 (2026-05-26) | A → B → C → D-not-absorbed (**4 gates**) | CHRONIC-RESIDUAL (substrate-orphaned, cross-repo) | All "STILL FILED — local carry; awaits glass-ui's next surface tranche." glass-ui has had no surface tranche since the v2.0.0 / `5e79443` cohort. Local carries persist in `EasingPicker.vue`, `style.css @layer base`, the icon-`<Button>` pair fallback for pagination, etc. | glass-ui is the substrate; fourier holds CONSTELLATION discipline — neither fourier-tranche nor fourier-D should annex. Awaits a glass-ui-authored tranche. | **E action**: HOLD. Constellation discipline; neither E nor any fourier successor should absorb. Recorded in E.§carries (glass-ui upstream). If a glass-ui tranche opens during E and lands these, fourier consumes via dep bump. |
| **C6** | **glass-ui `style.css:3` import cold-boot race** | A.W3.5.d (2026-05-19) | A → not-absorbed-in-B/C/D (**4 gates**) | CHRONIC-RESIDUAL (substrate, cross-repo) | Routed to glass-ui constellation carry; `pnpm vite optimize --force` mitigation in dev; structural fix at glass-ui. Has not surfaced as a prod blocker. | Same substrate-orphan root as C5. | **E action**: HOLD. Same disposition as C5. |
| **C7** | **The 6 §U conformance strikes** (slug_words import-validator; cursor-HMAC-tamper; problem-type catalog-reject; include_deleted_filter; surface-coverage test) | B.W1 (§U matrix, 2026-05-19) | B → C.W6 (struck again, NOT-IMPLEMENTED) → D.W5 (DEFERRED-TO-VALUE.JS) (**3 gates**) | CHRONIC-RESIDUAL (never-built-by-design) | Six rows STRUCK across two matrices per the "no-phantom-citation" rule — the asserted symbols/behaviours were never built; the matrix cites only what exists. Some now mapped to I.W1-W4 sketches in `VALUE-JS-ASK.md §2.4`. | "Never-built-by-design" (KISS); revive a row only if the symbol is built. Not a debt — a never-built affordance. | **E action**: WONTFIX-revive-if-built. If E builds (or value.js-I builds) the corresponding symbol, the row revives + the matrix cell flips ADDRESSED. Surfaced for completeness; not a debt. |
| **C8** | **Cross-cohort infra standardisation (constellation-wide)** — floridify migration, ncdpi-ai-tools removal, sudoku/speedtest 10-port blocks, Mongo-8 upgrade | `memory/project_infra_plan.md` (2026-03-28) → A.§9 | A → C.§7 (fourier subset only) → D (α′ closed fourier-subset; constellation-wide still pending) (**4 gates**) | CHRONIC-LOAD-BEARING (out of fourier scope) | The plan file is **63 days stale** at this writing. D addressed only the fourier-bound subset + the CF Pages constellation rollout (W8/W9/W10/W11 closed). The fuller `project_infra_plan.md` items (Mongo-8 upgrade, ncdpi-ai-tools removal, sudoku/speedtest 10-port blocks) are constellation-wide. | The plan exceeds fourier-tranche scope; constellation-wide infra is not fourier-authored. | **E action**: NOT E's to author beyond the fourier-bound subset. If E surfaces a fourier-specific need (e.g. Mongo-8 upgrade for an `image_blobs` storage feature), fold the fourier-half only; otherwise the plan stays constellation-wide-stale. |
| **C9** | **C-era invariant numbering inconsistency (inv-18/19/20 overlap)** | C.§2 (2026-05-26) → D.§2 records "a γ sub-item reconciles at execution, binding by name not number meanwhile" → D close did not reconcile | C → D-not-reconciled (**2 gates**) | CHRONIC-COSMETIC | C added three invariants numbered 18/19/20 that overlap B's 18-24 range. D adds 3 more (production parity / code-and-migration / token-system-single-source) by name without re-numbering. The "bind by name" workaround holds. | Cosmetic; reconciling requires a one-pass doc edit across A.md/B.md/C.md/D.md plus the precepts. Has never been worth wave-allocation. | **E action**: optionally fold a doc-hygiene sub-task into E.W0 or E.W12 — one PR re-numbering inv-18 forward across A→B→C→D → precepts. Else hold (cosmetic). |

**The chronic body, by tranche-depth (descending):**
- **4 gates**: C1 (colour-lift); C5 (glass-ui carries); C6 (glass-ui cold-boot); C8 (cross-cohort infra).
- **3 gates**: C2 (Palette domain model); C3 (53 value.js cells); C4 (onnxruntime); C7 (§U strikes).
- **2 gates**: C9 (invariant numbering).

## §2 — NEW-IN-D items — fold into E

Items first surfaced during the D execution window or at D's close ceremony (`D/FINAL.md §6`, audit close records, coordination docs). Each lacks a chronic-history; E is the first tranche to consider them.

| # | Item | Origin (D wave) | Class | Status | E disposition |
|---|---|---|---|---|---|
| **N1** | **Dispatcher's `mkbabb/value.js` arm latent-broken** — `git fetch` on a non-git host dir at `/home/mbabb/Programming/palette-api/`; the W10 GitHub-webhook URL flip exposed the latency; no `mkbabb/value.js` push has yet fired the chain. Operational reality is PATH A developer-rsync. | D.W11 (`PALETTE-API-PROVENANCE.md §1.3`) | NEW-IN-D-LATENT-BROKEN | Live on host; latent since the rsync-target architecture was first surfaced. | **E action**: surface as an early-E disposition. Two options: (a) fix the dispatcher arm to use rsync-trigger instead of `git fetch`; OR (b) explicitly delete the arm from `/opt/deploy/scripts/dispatch.sh` + remove the GitHub webhook on `mkbabb/value.js`. PATH A (developer-rsync) is the operational reality — option (b) is the smaller-honest mechanism. |
| **N2** | **CF wildcard `*.babb.dev → 185.199.x.x` footgun** — any new `<sub>.babb.dev` name not explicitly defined resolves to GH-Pages IPs and returns `*.github.io` cert errors. | D.W10 (audit §11 #6, 2026-05-28) | NEW-IN-D-FOOTGUN | Wildcard preserved verbatim by `dns-cf-sync.sh` don't-break list at W8; W12 noted "may want to either narrow or remove". | **E action**: at the first new-surface DNS creation (any `api.<newapp>.babb.dev` or `<newapp>.babb.dev`), narrow the wildcard. Could also be folded into E.W0 as a one-shot DNS hygiene step via `dns-cf-sync.sh`. Honest indefinitely; not load-bearing. |
| **N3** | **W11 FULL palette-api → color rename DEFERRED** — host directory rename (`palette-api/` → `color/`), compose project name change, container name change (`palette-api-api-1` → `color-api-1`), data-bearing volume `palette-api_mongo-data` migration (orphan-risk on naive rename). | D.W11 (`PALETTE-API-PROVENANCE.md §4`) | NEW-IN-D-DEFERRED-COSMETIC (data-bearing) | Recipe written. Public-visible names ALL ALREADY at `color` (DNS, vhost, cert, CORS). Internal labels deferred. | **E action**: CROSS-REPO-OWNED. Not fourier-E's act. Awaits scheduled-downtime window or a value.js tranche. Recorded in E.§carries with the recipe pointer. |
| **N4** | **csp-solver runtime API URL** — `useApi.ts` hardcodes `api/v1` relative; needs one-line fix to read `VITE_API_URL`. Static surface deploys cleanly; only the API-mediated solve path is affected. | D.W9 (`audit/W9-cf-pages-migration.md §3.1`) | NEW-IN-D-CROSS-REPO | Documented one-line fix at W9 §3.1; sudoku frontend deploys at `sudoku-hoq.pages.dev` but the API path is broken. | **E action**: CROSS-REPO-OWNED. Not fourier-E's to commit. Recorded in E.§carries (csp-solver maintainer). |
| **N5** | **keyframes.js GH-Pages teardown** — `peaceiris/actions-gh-pages` deploy job retirement + `gh-pages` branch deletion + repo CNAME removal. | D.W9 (named in `D/FINAL.md §6.2`) | NEW-IN-D-CROSS-REPO | CF Pages cutover landed at `keyframes-8uq.pages.dev`; the old GH-Pages CI job is dead-but-running. | **E action**: CROSS-REPO-OWNED. Same shape as N4. |
| **N6** | **value.js GH-Pages teardown** — same shape as N5. | D.W9 (named in `D/FINAL.md §6.2`) | NEW-IN-D-CROSS-REPO | CF Pages cutover landed at `color-enw.pages.dev`; the old GH-Pages CI job is dead-but-running. | **E action**: CROSS-REPO-OWNED. |
| **N7** | **floridify `docker-compose.prod.yml` host dirty edit** — the Mongo-bind change at W1.Phase1 was applied to `/home/mbabb/floridify/docker-compose.prod.yml` as a cross-app act; the upstream floridify repo never received the commit. | D.W1.Phase1 (`audit/W1-phase1-host.md §Step 2`) | NEW-IN-D-CROSS-REPO-HOST-DIRTY | Host applied; upstream divergent. | **E action**: CROSS-REPO-OWNED (floridify maintainer). Fourier-E should NOT commit cross-repo. Surface in E.§carries. |
| **N8** | **palette-api standalone repo `compose.yaml` host dirty edit** — the Mongo-bind change at W1.Phase1 was applied to `/home/mbabb/Programming/palette-api/compose.yaml`; the source-of-truth at `value.js/api/` and the rsync-target host dir are divergent until the next rsync deploys the upstream. | D.W1.Phase1 (`audit/W1-phase1-host.md §Step 3`) | NEW-IN-D-CROSS-REPO-HOST-DIRTY | Host applied; upstream `value.js/api/compose.yaml` divergent. The PALETTE-API-PROVENANCE rsync model means a future `value.js/api/deploy.sh` will overwrite the host edit unless source is updated first. | **E action**: CROSS-REPO-OWNED (value.js maintainer; tied to value.js-I if opened). The fourier-E ask: include this in the VALUE-JS-ASK addendum (the host dirty edit needs source-side ratification). |
| **N9** | **Pre-existing pytest failure `test_backfill_image_bounds_on_migrated_image`** — the typed-shim rejects a pre-migration image during bounds backfill; a W3-era state-transition concern that survives the W3 NO-legacy work. | D.W3 / D.W6 (`audit/W6-test-integrity.md §1.3`) + `D/FINAL.md §6.3` | NEW-IN-D-LOAD-BEARING-LIGHT | Pre-existing failure on master HEAD; pytest 211 passed / 1 failed (live-Mongo); 129 passed / 83 skipped (dev). Captured as W3-followup. | **E action**: fold into E.W0 baseline as a 1-test triage. The fix is either a test-fixture update OR a small `dependencies.py` carve-out; either is a single-commit close. Genuinely small. |
| **N10** | **Frontend bundle 854.40 kB single chunk** — Vite chunk-size warning suppressed per `D.md §7` (split out-of-scope). | D.W6 (`audit/W6-test-integrity.md`) | NEW-IN-D-RESIDUAL-PERF | Index bundle ships in a single 854 kB chunk; vendor chunks not split. Pre-existing UI/data drift in e2e (3p/4f local). | **E action**: opportunistic-route to an E perf sub-task IF E surfaces a perf wave; else hold. Honest residual; not load-bearing for correctness. The Vite `manualChunks` config is the smallest mechanism. |
| **N11** | **Deploy-hook does NOT auto-invoke `migrate_image_blobs.py` / `migrate_flags_field.py`** — operator-note from W1.Phase2 (W1.Phase2 §Step 3) and W3+W4 deploy (`audit/W3-W4-deploy.md §Step 3`). Both migrations were run manually post-deploy; the binding *code-and-migration-together* invariant held by operator-discipline, not by automation. | D.W1.Phase2 + D.W3+W4 deploy (2026-05-28) | NEW-IN-D-OPERATIONAL-GAP | Deploy-hook (`scripts/deploy-hook.sh`) wraps `build → up → health-gate → rollback-on-fail` but does NOT iterate over `api/scripts/migrate_*.py`. Future migrations require operator-attention. | **E action**: **LOAD-BEARING.** Fold into an early-E α-host wave: extend `deploy-hook.sh` to auto-run any `api/scripts/migrate_*.py` discovered post-build, idempotently. The current discipline is "operator runs manually"; the invariant is operationally fragile. The smallest-honest-mechanism is a `find api/scripts/ -name 'migrate_*.py'` loop with `docker compose exec backend uv run --no-sync python -m <module>` per file (each migration must be idempotent — both `migrate_image_blobs` and `migrate_flags_field` already are). |

**OUT-OF-SCOPE-explicit (D.md §7 / FINAL §6.4)** — folded for completeness, NOT carried into E unless an explicit trigger fires:

- **Multi-replica fourier deployment** — out of scope per inv-19. A fourier-E ONLY IF horizontal-scale need surfaces (paired with rate-limiter Option B). Default: held.
- **Dangling prod images (`gaggle`, `server-api`, `speedtest-*`)** + **dead `:8140` speedtest vhost cleanup** — host-ops sweep; named at D.md §7 + D close §6.4. **STATUS**: no host-ops sweep was performed during D (no W12 close mention; D/FINAL silent on disposition). **E action**: bundle into a one-shot host-ops sweep at E.W0 OR W12; minutes of host time, no fourier source change.
- **Grammar (`bbnf-lang`) DEFERRED** — author-coordinated, 1009 commits/14d at D dispatch. **STATUS-CHECK at E**: confirm the upstream activity has quieted before scheduling. If quiet, fold into E.α′ as a one-app CF-Pages migration (recipe proven at W9). If still active, hold.
- **value.js `Palette` / `colorScale` full domain model** — C2 above (also out-of-scope by invariant 15).
- **W11 FULL rename** — N3 above (CROSS-REPO-OWNED).
- **Frontend bundle split** — N10 above (perf, opportunistic).

## §3 — Cross-repo residuals

The 9-item cross-repo cohort, each owned by a sibling-repo maintainer. fourier-E should not commit cross-repo; it should record the dependency + surface in E.§carries.

| # | Repo | Item | Owner / gating | Status | E disposition |
|---|---|---|---|---|---|
| **X1** | **value.js** | The 53 DEFERRED-TO-VALUE.JS CRUD-CONTRACT cells (I.W1-W4 sketches authored at `coordination/VALUE-JS-ASK.md §2`). Visibility split + soft-delete + admin idempotency + SOTA envelopes + conformance suite. | value.js-I tranche (NOT YET OPENED); user-re-mandate-gated per Wχ-P3.C4. | I-SEED exists at `value.js/docs/tranches/H/I-SEED.md` (predecessor-authored advisory); I tranche has never opened. value.js HEAD `16129e0`, v0.10.0, 53 cells DEFERRED. | Record in E.§carries with the user-re-mandate predicate. The 53 cells flip when value.js-I lands the work + runs the conformance suite. |
| **X2** | **value.js** | `sampleToSVGPath` library publish (the C1 chronic). | value.js publish wave (orthogonal to I-CRUD tranche per `VALUE-JS-ASK.md §5`); user-re-mandate-gated. | Not exported at HEAD; only `cubicBezierToSVG`. The lift is a lighter publish workflow than the I-CRUD work. | Record. fourier-E consumer-half fires iff value.js publishes. |
| **X3** | **value.js** | GH-Pages teardown (the old `peaceiris/actions-gh-pages` job at the value.js side). | value.js maintainer. | CF Pages cutover at `color-enw.pages.dev` LIVE; old GH-Pages CI dead-but-running. | Record. Same shape as keyframes.js (X5). |
| **X4** | **value.js / palette-api** | The dispatcher `mkbabb/value.js` arm latent-broken (N1). | value.js maintainer OR fourier-E ops sub-task. | Latent-broken stub at `/opt/deploy/scripts/dispatch.sh`. PATH A operational. | **E action**: surface in E.W0 — recommend EITHER fix to use rsync-trigger OR delete the arm + webhook. Both are sub-1-hour ops acts. |
| **X5** | **keyframes.js** | GH-Pages teardown (`peaceiris/actions-gh-pages` deploy job + `gh-pages` branch + repo CNAME). | keyframes.js maintainer. | CF Pages cutover at `keyframes-8uq.pages.dev` LIVE; old GH-Pages CI dead-but-running. | Record. |
| **X6** | **csp-solver** | Runtime `VITE_API_URL` fix at `useApi.ts` (the 1-line; N4). | csp-solver maintainer. | Static CF Pages deploys at `sudoku-hoq.pages.dev` work; API path is broken until the 1-liner lands. | Record. The 1-line patch is the smallest-honest fix; recipe at W9 audit §3.1. |
| **X7** | **floridify** | Upstream commit of the W1.Phase1 Mongo-bind dirty edit (N7). | floridify maintainer. | Host `/home/mbabb/floridify/docker-compose.prod.yml` divergent from upstream. | Record. Surface in E.§carries with a host-divergence flag. |
| **X8** | **palette-api standalone (rsync-target)** + **value.js/api/** source | Upstream commit of the W1.Phase1 Mongo-bind dirty edit (N8); the cross-repo also includes the legacy `deploy.sh` smoke-test URL (`https://mbabb.fi.ncsu.edu/colors/`, 404 long ago — W11 close residual). | value.js maintainer (tied to I if opened). | Host edited; `value.js/api/` source-of-truth divergent; the next `rsync` deploy will overwrite the host unless source is patched first. | Record. Include in any value.js-I or value.js-publish handoff. |
| **X9** | **glass-ui** | The 7-item glass-ui substrate carry chronic (C5 above + style.css cold-boot C6). | glass-ui maintainer. | All carries STILL FILED; no glass-ui surface tranche since v2.0.0 / `5e79443`. | Record. Fourier-E holds CONSTELLATION discipline; no annexation. |

## §4 — Discharged-by-D items (recorded for completeness)

The 15 items DA2 enumerated as "host-coupled" + the "discharged-at-B/C" verifications + the D-execution closures. Listed for the ledger; no E action.

| DA2 # / source | Item | D wave that discharged | D close-record |
|---|---|---|---|
| DA2-1 | Shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration | D.W1.Phase2 | `audit/W1-phase2-deploy.md §3.2 + §3.3`; fourier arm re-pointed; sibling arms byte-identical to backup |
| DA2-2 | Prod MongoDB TLS cutover (URI side) | D.W2 spine 1 | `audit/W2-tls-precepts.md` (`1233b06` → `5b84e31`); 2 URI flags removed; honesty pivot on the mongod cmd flag recorded |
| DA2-3 | Prod image-blob migration RUN | D.W1.Phase2 (cutover, no-op against empty DB; binding invariant held) | `audit/W1-phase2-deploy.md §Step 3` |
| DA2-4 | Precepts-submodule promotion (tls.md / blob-backend-dr.md / deploy.md + domains.md NEW) | D.W2 spine 3 | `64f79f9` superproject + `63240e6` submodule push |
| DA2-5 | Backend `--reload` aborts compute root-fix (the watch-narrowing twin migration-reload hazard) | C.W3 already; verified at D.W0 | The background-queue successor remained out-of-scope (no trigger fired) |
| DA2-6 | C4.5/C4.6 visibility-transition guard | D.W3 (γ-thread per Wα-R1 verdict) | `ce61e7c`; `visibility_illegal_transition` helper wired in `update_visualization`; conformance matrix C4.5/C4.6 rows fillable post-W3 |
| DA2-8a | `colors.ts` 2-dup cleanup (fourier-internal) | D.W4 (the design refinement sweep also touched colors.ts dup sites incidentally) | `2e4a452` (W4 design refinement) — `--viz-amber` lifted to ≈4.6:1; 9-of-9 `#f0b632` + 11-of-11 alpha-modifier sites swept |
| DA2-12 | `FlaggedListResponse` type reconciliation | C.W4 (already discharged) | Verified at D.W0 baseline |
| DA2-13 | e2e axe-keystone settle-wait | D.W6 (cross-env Playwright matrix) | `2682487`; harness present + AMBER local/host (3p/4f & 3p/3f — pre-existing UI/data drift, not W6 plumbing) |
| DA2-21 | Levels-derivation drift | B.W3 (already) | Verified at D.W0 |
| DA2-22 | Ruff F841 unused result at `image_storage.py:224` | B.W3.b (already, incidental retire) | Verified at D.W0 |
| DA2-24 | Backup / DR for the `image_blobs` sole-copy surface | D.W2 precepts promotion (`blob-backend-dr.md` landed in submodule; the `external: true` guard held; the consistent-snapshot cron mechanism deferred — but the no-app-side-cache + single-`update_one` atomicity makes the immediate hazard non-firing) | `64f79f9` precepts gitlink bump |
| DA2-26 | Host `hooks.json` + `/opt/deploy/.env` `0664→0600` secret hardening | D.W1.Phase2 | `audit/W1-phase2-deploy.md §Step 3`; perms tightened |
| DA2-27 | Host dirty-tree reconcile before first gated deploy | D.W1.Phase2 | `git checkout -- docker-compose.{,prod}.yml`; Mongo password extracted to `/var/www/fourier-analysis/.env` (`0600`, gitignored); host HEAD advanced from pre-A `8818ae5` |
| New (D.α) | Backend NO-legacy symmetry — `snapshot_hash` → `content_hash`; dead `gallery` stratum delete; typed `ImageAsset` model | D.W3 | `ce61e7c`; mypy --strict clean on 4 W3 modules; pytest 129/83 (dev) or 211/0 (live-Mongo CI) |

**Verification gates at this writing**: every status word in §4 resolves to `git grep` or `git log` empirical evidence at HEAD; no claim is grounded in a doc-stale gate run.

## §5 — Folding into tranche E: thread map

E is not yet seeded; the EA1 charter / EA3-onward lanes of this E-audit will draft it. EA2's contribution is the chronic-and-new ledger, organised into proposed E threads. Per-thread scoping is preliminary (the EA1 / EA5 / EA-syn lanes have authority over the final shape).

### Thread α — production operations hardening + cross-repo coordination (NEW for E)

**Members (proposed)**: N1 (dispatcher value.js arm), N2 (CF wildcard footgun), N9 (test-failure backfill), N11 (deploy-hook migration auto-run), the host-ops sweep (dangling images + `:8140`), X4 (cross-repo dispatcher arm coordination).

Rationale: D landed the deploy spine but left operational gaps — the auto-run of migrations, the latent-broken dispatcher arm, the wildcard footgun, the persistent W3-followup test failure. These are sub-wave-size each; cluster them into a single α-thread early in E to land the operational closure D's CLEAN close hand-waved.

**Proposed waves**:
- **E.Wα-host**: dispatcher arm disposition (delete vs fix-to-rsync), CF wildcard narrow, `deploy-hook.sh` migration auto-run (extension), N9 test-failure triage.
- **E.Wα-sweep**: dangling-image + `:8140` host-ops sweep (one ssh session).

### Thread β — chronic-residual surface holds (HOLD-PATTERN for E)

**Members**: C1 (colour-lift consume — hold with no-silent-orphan), C5 / C6 / C9 (substrate carries — CONSTELLATION-disciplined hold), C7 (§U strikes — WONTFIX-revive-if-built), C2 (Palette domain model — held latent), C3 (53 value.js cells — held cross-repo), X1-X9 (the cross-repo cohort).

Rationale: nothing in this thread is E-actionable except for the *re-statement* with hard no-silent-orphan checks. The β-thread is a one-doc act (E's §carries) — explicitly enumerating every hold + every cross-repo dependency.

**Proposed waves**:
- **E.W0 baseline**: enumerate every held / cross-repo dependency; cite the maintainer + the gating predicate per item.

### Thread γ — opportunistic-fold candidates (CONDITIONAL for E)

**Members**: C4 (onnxruntime suppression — fold if E touches the contour pipeline), N10 (bundle split — fold if E surfaces a perf wave), C9 (invariant numbering — fold if E.W0 or W12 has doc-hygiene time).

Rationale: these are honest-indefinitely residuals. The smallest-honest-mechanism for each is small enough to ride a touch-of-the-area; do not allocate dedicated waves.

**Proposed waves**: opportunistic-fold; not a dedicated wave.

### Thread δ — value.js cohesion (CROSS-REPO-GATED for E)

**Members**: X1 (53 cells), X2 (sampleToSVGPath publish), X8 (palette-api host-dirty source ratification).

Rationale: all three fire iff the user re-mandates the value.js side + a value.js tranche (I or successor) opens. fourier-E does NOT execute value.js source; fourier-E carries the dependency + the binding `palette_slug` FK clause forward.

**Proposed waves**: not E waves. Carry-record only.

### Thread ε — confirm-and-close ledger (HOUSEKEEPING for E)

**Members**: the 15 DA2 items DISCHARGED at D + the 7-of-9 DA2 chronics still chronic at this writing.

Rationale: the E.W0 baseline records what is verified-closed vs still-chronic so E does not re-audit the discharged + so E's tranche-close ceremony cites the chronic ledger.

**Proposed waves**:
- **E.W0 baseline**: append §4 + §1 + §2 to E.W0.

---

### Per-class count

- **DISCHARGED-by-D**: **15** items closed since the C-close / DA2 baseline.
- **CHRONIC (≥ 2 tranches)**: **9** items — the user's "chronically deferred" target. The body shrank from DA2's 11 because three host-coupled chronics (DA2 items 1/2/3) discharged at D.W1/W2.
- **NEW-IN-D**: **11** items first surfaced during D execution or at D close.
- **OUT-OF-SCOPE-explicit**: **6** items bounded out by invariant or `D.md §7`.
- **CROSS-REPO**: **9** items owned by sibling-repo maintainers.
- **Total enumerated**: **35** items + the 53 DEFERRED-TO-VALUE.JS conformance-matrix cells (value.js-side, user-re-mandate-gated; collectively X1).

### Top 5 chronic items by tranche-depth (descending)

1. **C1 — Colour-lift `sampleToSVGPath` consume** (4 gates: A.W2.b → B.W4 → C.W4-δ → D.W5). The headline chronic; cross-repo orphan; awaits a value.js publish.
2. **C5 — glass-ui substrate carries** (4 gates: A → B → C → D — `--scale-press*`, `--viz-easing`, `::selection`, Tabs entry animation, Pagination primitive, ConfiguratorLayer header-actions, dock `aria-hidden-focus`). CONSTELLATION-disciplined hold; awaits a glass-ui surface tranche.
3. **C6 — glass-ui `style.css:3` cold-boot race** (4 gates: A → B → C → D). Same root as C5.
4. **C8 — Cross-cohort infra standardisation** (4 gates: `project_infra_plan.md` 2026-03-28 → A.§9 → C.§7 → D-fourier-subset-only). Constellation-wide; the plan file is now 63 days stale.
5. **C2 — `Palette` / `colorScale` domain model** (3 gates: B.W2 → C.W4 → D.W5, held latent). Library-nobody-calls; awaits a real fourier consumer.

### File path

`/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-05-28-E-audit/EA2-deferred-chronic-inventory.md`
