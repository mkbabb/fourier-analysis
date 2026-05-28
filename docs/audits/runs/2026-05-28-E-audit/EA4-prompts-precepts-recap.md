# EA4 — prompts + precepts recap (E-development)

**Lane**: EA4 (fourier-analysis tranche-E DEVELOPMENT phase — audit only; read + ONE deliverable; NO source edits, NO commits).
**Date**: 2026-05-28. **HEAD**: `6039e95` (D CLOSED CLEAN — `fix(D.W8): set -u guard for empty summary arrays in dns-cf-sync.sh`; prior close commit `342a078`). **Predecessors**: A CLOSED `c7cfd82` · B CLOSED `fc5b3b0` · C CLOSED `1e47115` · D CLOSED CLEAN `342a078`. **value.js**: H CLOSED `16129e0` / `v0.10.0`; I seeded-unscoped; the v2.0.0 `VALUE-JS-ASK.md` (53 DEFERRED-TO-VALUE.JS cells) is the binding cross-repo contract awaiting user re-mandate.
**Charter (user, verbatim intent)**: *"Recap ALL of our prompts and requests hitherto and ensure they've been addressed"* — the standing ledger discipline, now extended through the entire D-execution phase + the E-development brief. This lane inherits DA5's 39-directive ledger as its STARTING POINT and extends it through (i) the D-execution prompts issued 2026-05-27 / 2026-05-28, (ii) the W12 close ceremony, (iii) the present E-development brief — then re-verifies every disposition against a commit or `file:line` at HEAD `6039e95`.

**Convention modelled on**: `docs/audits/runs/2026-05-27-D-audit/DA5-prompts-precepts-recap.md` (the predecessor — 39 directives, 0 outstanding); `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md` (the prior-prior recap).

**Sibling E-lanes**: EA1–EA3, EA5, EA6 (this round's other audit lanes) supply ground-truth for the post-D landing assessment, cross-repo state, the design recap, and the precept-compliance forward-guard. EA4 synthesises the *prompt-disposition + precept-compliance + E-directive-breakdown* layers; it does not re-derive their findings — where an E-era directive's discharge belongs to a sibling lane or to an E thread, EA4 ROUTES it.

---

## §0 — Summary

- **Total prompts (lineage)**: **50** (DA5's 39 + 6 D-execution-phase prompts re-confirmed + 1 D-execution mandate already counted at DA5 row D6 — kept distinct here at row CE2 + 4 new D-execution mandates + 5 E-era directives broken out)
- **ADDRESSED-COMPLETELY**: **44**
- **ADDRESSED-PARTIALLY**: **0**
- **ROUTED-TO-E**: **6** (the E execution payload, named below)
- **OUTSTANDING (open, unrouted)**: **0**
- **Precepts holding**: **10/10** (KISS · NO-legacy · NO-fallback · idiomatic-gestalt · fix-at-ROOT · deep-parallelization · archaic-diction-intentional · em-dashes · NO-quick-solutions · architectural-transposition-DESIRABLE)

**Zero-outstanding holds.** Every prompt across A/B/C/D + the D-execution phase is either DONE (44) or ROUTED-TO-E (6, each pinned to a named thread/wave/lane). The single load-bearing change since DA5: the 5 ROUTED-TO-D items (DA5 D7–D11) are **all now DISCHARGED through the D execution** — host-ops deployed, design refined, cross-repo cohesion authored (`CRUD-CONTRACT v2.0.0` + `VALUE-JS-ASK.md`), value.js audited (state unchanged at H close `16129e0`), Playwright matrix configured + executed (local AMBER / host AMBER / prod LIVE via CF Pages). The new ROUTED-TO-E set is fundamentally different: it is the E-development brief's NEW work (cross-repo refine/test/CRUD of both palette APIs + fourier viz APIs; include ALL consumers; fix cross-repos).

---

## §1 — Prompt ledger (chronological)

Dispositions: **ADDRESSED** (landed + evidenced) · **PARTIAL** (substantially landed, named residual) · **ROUTED-TO-E** (deferred to fourier-E by design, named successor) · **OUTSTANDING** (open, unrouted).

A-era through D-era inherited from `DA5 §1.1–§1.5` and re-verified unchanged at HEAD `6039e95`. The D-execution-phase prompts (CE-class) are extended; the new E-development directive is decomposed in §1.7.

### §1.1 — A-era (founding brief through A close `c7cfd82`) — inherited from DA5 §1.1, re-confirmed

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| A1 | "DEEPLY audit with 6 agents in parallel … NO quick solutions, NO workarounds … fully abrogate fourier-overrides and ios-fixes … bidirectional style audit." | A | **ADDRESSED** | `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`; A opens `3fc960c` |
| A2 | "Explicate each wave, and plan for the CRUD migration … Potentially split that facility into a separate tranche." | A→B | **ADDRESSED** | waves W0–W6 explicated; CRUD split → tranche B |
| A3 | "fully spec out B to encompass both fourier analysis and value.js. Harden and refine both that spec, and A, with 6 agents." | A/B | **ADDRESSED** | `B.md` (17 invariants); `2026-05-18-tranche-harden/{h1..h6,SYNTHESIS}.md` |
| A4 | "Let's further develop the CRUD system … Deploy 6 agents in parallel. SOTA." | B | **ADDRESSED** | `2026-05-19-crud-deepen/SYNTHESIS.md` — 9 decisions + 9 KISS rejections |
| A5 | "Should our CRUD system be a sub-library … or should we roll our own?" | B | **ADDRESSED** | three-tier verdict; `2026-05-19-utility-extraction/DECISION.md`; SLUG-WORDS |
| A6 | "Assay the current set of changes … What is the cannonical ordering?" | A/B | **ADDRESSED** | `2026-05-19-refinement-assay/{r1..r6}.md`; `CANONICAL-ORDERING.md` (now ordering ε post-D-close) |
| A7 | "Execution order for both repos? … deploy 4 agents … update the tranche/wave spec to latest precepts/ … submodule pin a59c60d." | A/B | **ADDRESSED** | pin `a59c60d` non-canonical → substituted `f27627e`; 4-agent P1–P4 rewrote 30+ docs |
| A8 | "Look to precepts within gaggle/ or feedback-coder/ … Reconcile and update ALL precepts modules within ALL consumers." | A/B | **ADDRESSED** | submodule pinned `f27627e` constellation-wide; subsequently `63240e6` post-D.W2 |
| A9 | "Begin and continue the current tranche … fully orchestrate as team lead … indefatigably … IN TOTALITY. NO quick solutions, NO workarounds." | A | **ADDRESSED** | A.W0→W6 dispatched without intervention; close `c7cfd82` |
| A10 | "fully abrogate `buttons.css`" (in-band W2.e) | A | **ADDRESSED** | `10e616c` — `.btn-*`/`.basis-pill` → `<Button>`/`<Badge>` |
| A11 | "backend tested with docker" (W2.g escalation) | A | **ADDRESSED** | `574cd71` + `5fdf6ff` |
| A12 | "Fira Code count rerun" (canonical recount) | A | **ADDRESSED** | `04cf719` — 82 hits, 13 adopted, 55 kept-decorative |
| A13 | "The paper texture is FAR too extreme … sidebar needs to leverage glass-ui … Dark mode paper totally broken … Deep inspection and refinement." | A | **ADDRESSED** | W3.5: glass-ui `9cf88e6`; fourier `2b308f7` |
| A14 | "glass-ui's version should be the fourier original one … Change and fix items at the ROOT." | A | **ADDRESSED** | glass-ui `9b8de74` + fourier `cb94aa3` (`useSidebarState<T>` at root) |
| A15 | "visualization pipeline … properly refined, tested, inspected." | A | **ADDRESSED** | `e0e9dda` — O(n³)→O(n log n) Visvalingam-Whyatt; single-pass epicycles |

**A-era subtotal**: 15 directives · 15 ADDRESSED · 0 OUTSTANDING. No A-era directive regressed during B/C/D execution.

### §1.2 — B-era (B-development brief through B close `fc5b3b0`) — inherited from DA5 §1.2, re-confirmed

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| B1 | "DEEPLY audit with 6 agents … Fold all findings into B … This is NOT implementation. Tranche development only." | B | **ADDRESSED** | `2026-05-26-B-audit-wave-1/L1..L6` + synthesis; B plan augmented; planning-only honoured |
| B2 | "Begin and continue the current tranche … IN TOTALITY … adhere exactly to the plan … agent orchestration and deep parallelization … fully orchestrate as team lead." | B | **ADDRESSED** | B.W0→W5 dispatched (`b0a85d8`→`fc5b3b0`); CA1 confirms 5 LANDED-AS-PLANNED / 3 DIVERGED / 1 PARTIAL |
| B3 | "Recap ALL prompts hitherto." | B | **ADDRESSED** | `L1-prompt-precept-recap.md` |
| B4 | "Delineate chronically deferred items, fold into B." | B | **ADDRESSED** | `L6-deferred-chronic.md` |
| B5 | "NO legacy code; idiomatic/gestalt; fix at ROOT." | B → **C** | **ADDRESSED** (DISCHARGED in C.W4 `f91a656`; re-verified at D-execution: backend `snapshot_hash` → `content_hash` in D.W3 `ce61e7c` completes the rename end-to-end) | `git grep snapshot_hash api/` → 0 on identity paths at HEAD; `git grep snapshot_hash web/src/` → 0 |

**B-era subtotal**: 5 directives · 5 ADDRESSED · 0 OUTSTANDING. **B5 — the standing NO-legacy breach — is now FULLY DISCHARGED end-to-end** (frontend in C.W4, backend in D.W3).

### §1.3 — C-era (C-development authoring brief through C close `1e47115`) — inherited from DA5 §1.3, re-confirmed

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| C1 | "DEEPLY audit with 6 agents … Devise a path forward." | C | **ADDRESSED** | CA1–CA6 dispatched read-only; folded into expanded C charter `9003cba` |
| C2 | "Recap ALL prompts … ensure they've been addressed." | C | **ADDRESSED** | CA6 ledger (27 directives, 0 OUTSTANDING) |
| C3 | "NO legacy code." | C | **ADDRESSED** | The single live legacy-code residual (B5) was discharged at the root in C.W4 `f91a656` |
| C4 | "Delineate any chronically deferred items … fold into C." | C | **ADDRESSED** | CA2 18-item inventory; C.md §7 carries every chronic item |
| C5 | "Delineate any deferred items and fold into C." | C | **ADDRESSED** | CA2 §3 fold map; C.md §7 cross-tranche-debt section |
| C6 | "In both value.js and herein. What is next for tranche C?" | C / value.js | **ADDRESSED** | CA3 cohort-reopen verdict; value.js-H CLOSED `16129e0`; I seeded-unscoped |
| C7 | "Fold items into C, expand and augment that tranche and wave set." | C | **ADDRESSED** | expanded C charter `9003cba`; C EXECUTED to close `1e47115` |

**C-era subtotal**: 7 directives · 7 ADDRESSED · 0 OUTSTANDING.

### §1.4 — C-execution prompt (drove `fce1808`→`1e47115`) — inherited from DA5 §1.4

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| CE1 | "Begin and continue the current tranche … IN TOTALITY … NO quick solutions, NO workarounds … idiomatic gestalt … adhere to the plan … deep parallelization … fully orchestrate as team lead." | C | **ADDRESSED** | C executed W0 → Wα → Wχ(+harden) → W3 ∥ W4 → W1 ∥ W5 → W2 → W6; 9 execution commits; `1e47115` close |

**C-execution subtotal**: 1 directive · 1 ADDRESSED · 0 OUTSTANDING.

### §1.5 — D-development prompts (the 2026-05-27 brief + 4 follow-up directives) — DA5 D1–D11 re-promoted post-execution

The D-development brief decomposed into 11 directives at DA5; DA5 carried 6 ADDRESSED-this-round + 5 ROUTED-TO-D. EA4 re-promotes each ROUTED-TO-D item to its post-D-execution disposition.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition at DA5 | Disposition NOW (post-D-close) | Evidence |
|---|---|---|---|---|---|
| D1 | "DEEPLY audit with 6 agents in parallel." | D | ADDRESSED | **ADDRESSED** | DA1–DA6 dispatched (`10bb0ba`); 4 design lanes A1–A4 (`9b45f92`); 6 normalization lanes NA1–NA6 (`5749ee2`) |
| D2 | "NO legacy code." | D | ADDRESSED-as-binding-precept | **ADDRESSED** (binding precept HELD across W1–W12; D.W3 `ce61e7c` discharges the backend `snapshot_hash` band; dead `gallery` stratum deleted; typed `ImageAsset` retires the dict shim) | `git grep -nE "snapshot_hash\|snapshotHash" api/` → 0 on identity paths at HEAD; W3 close `audit/W3-backend-no-legacy.md` |
| D3 | "Delineate any deferred items and fold into D." | D | ADDRESSED-this-round | **ADDRESSED** | D.md §7 + DA2 inventory; folded into W1–W12; W12 close FINAL §6 enumerates surviving items |
| D4 | "Delineate any chronically deferred items and fold into D." | D | ADDRESSED-this-round | **ADDRESSED** | C host-ops residuals (the dominant chronic class) all discharged in D.W1+W2+W10; the `--reload` background-queue + multi-replica are explicitly OUT-OF-D per `D.md §7` |
| D5 | "Recap ALL of our prompts and requests hitherto and ensure they've been addressed." | D | ADDRESSED | **ADDRESSED** | DA5 — 39 directives, 0 outstanding |
| D6 | "Tranche development only this phase (no implementation)." | D | ADDRESSED (held) | **ADDRESSED** | DA1–DA6 produced only audit docs; D charter `05038dc`; no source edits until D.W1 dispatched per CE2 |
| D7 | "SSH in, integrate, and deploy everything (the C residuals)." | D | ROUTED-TO-D | **ADDRESSED** | D.W1.Phase1 `577f037` (Mongo bind off `0.0.0.0`); D.W1.Phase2 host deploy LIVE via SSH-trigger; W2 `1233b06` + `5b84e31` (verified-TLS); W2 precepts `64f79f9`; the C host-ops residuals (shared dispatcher, prod TLS, prod migration, precepts promotion) ALL landed; FINAL §0(a)–(d), §2 ledger |
| D8 | "4 design agents via the frontend-design plugin analyze every screen." | D | ROUTED-TO-D | **ADDRESSED** | D-dev `9b45f92` — 4-agent design analysis (A1–A4) + screen captures; D.W4 `2e4a452` discharged every finding (cartoon-card shim across 14 sites, IA collapse, gallery orphans, light-mode contrast 9/9 + 11/11 enumeration gap closed, focus rings, GalleryCard a11y); FINAL §0(f) |
| D9 | "Cross-repo palette/visualization CRUD cohesion." | D | ROUTED-TO-D | **ADDRESSED** | D.W5 `c2ce6d7` — `CRUD-CONTRACT v2.0.0` (2 KISS relaxations + §10 close-rule + §0 inv-16 re-cert); CONFORMANCE-MATRIX 27/53/7 (87 total); `VALUE-JS-ASK.md` records the cross-repo ask; `palette_slug` FK clause from Wα-R1 is the binding cross-repo artefact; colour-lift = named residual (value.js@0.10.0 doesn't export `sampleToSVGPath`); FINAL §0(g) |
| D10 | "Audit value.js." | D | ROUTED-TO-D | **ADDRESSED** | DA3 cross-repo audit (`DA3-valuejs-crud-cohesion.md`); value.js HEAD unchanged at H close `16129e0`/v0.10.0 (inv-16 preserved); I seeded-unscoped; cross-repo ask user-re-mandate-gated in `VALUE-JS-ASK.md` |
| D11 | "Playwright both apps across local / dev / prod." | D | ROUTED-TO-D | **ADDRESSED** | D.W6 `2682487` — cross-env Playwright matrix configured + executed; local AMBER (3p/4f pre-existing UI drift); host AMBER (3p/3f same drift); prod RED at W6-close → resolved to GREEN at W9 close via CF Pages migration `5bba8ce` + `9cb9dc5` (`api.fourier.babb.dev` ingress live); `.github/workflows/ci.yml` 3 jobs; 82 `@requires_mongo` skips retire under live-Mongo CI (211 passed/0 skipped); FINAL §0(h) |

**D-era subtotal**: 11 directives · 11 ADDRESSED · 0 OUTSTANDING. **All 5 DA5-ROUTED items are now DISCHARGED through D execution.**

### §1.6 — D-execution-phase user prompts (the in-flight directives during W0→W12, 2026-05-27 / 2026-05-28)

These are user prompts issued **during** D-execution, not in the D-development brief. They are extracted from the wave close records, the PROGRESS log, and the user's own enumeration in the EA4 charter. Each is a real user mandate the execution had to honour.

| # | Verbatim-or-paraphrase (excerpted) | Issued | Tranche/wave | Disposition | Evidence |
|---|---|---|---|---|---|
| **CE2** | "Begin and continue the current tranche. You must read any and all appurtenant documentation and adhere exactly to the plan, in particular regarding agent orchestration and deep parallelization. Do not edit items directly unless befitting and fully orchestrate the processes as team lead. Continue through this indefatigably: do not relinquish control back to me until you have completed the plan IN TOTALITY. NO quick solutions, NO workarounds: idiomatic, gestalt approaches." | 2026-05-27 | D (the execution mandate) | **ADDRESSED** | D executed W0 → Wα → Wχ → W1 → W2 → W8 → W3 → W3+W4 deploy → W6 → W5 → W12 prov (CE3 unblocker resolved CE5 mid-flight, enabling W10→W9→W11 in single-session 2026-05-28) → W12 CLEAN close. 14 execution commits at HEAD `342a078` + `6039e95`; W0–W12 PROGRESS log all reconciled (PROGRESS.md §status board) |
| **CE3** | "Further, let's plan to rename the palette-api endpoint to be simply `color` on the mbabb server — we should have either an `api.color.babb.dev` or `color.api.babb.dev`" | 2026-05-27 | D (folded as thread α′ then to W11) | **ADDRESSED** | folded as `87806f8` (domain/endpoint naming standardization); resolved to `api.color.babb.dev` (consistency with `api.fourier.babb.dev`); landed at W8 `0f5d7c1` (DNS) + W10 `9cb9dc5` (Apache vhost + LE SAN + CORS); W11 `803433d` (cosmetic close — public surface complete; container/dir/volume names DEFERRED as named-residual due to data-bearing volume orphan-risk) |
| **CE4** | "I'd like to migrate and normalize the following … value.js's color api should be on the mbabb server — the frontend should be deployed to cloudflare via pages. For fourier, the backend docker container and frontend app should be fully on the mbabb server, unless it would befit being split into docker backend and the cloudflare frontend. For keyframes.js, that should be fully migrated to cloudflare pages, and away from github pages. For sudoku (CSC 411 and the like) we should either go the fourier route, or split. For words, we should either go the fourier route, or split. … All endpoints should resolve to `{something}.babb.dev`." | 2026-05-27 | D (folded as thread α′; new waves W8–W12) | **ADDRESSED** | `coordination/CONSTELLATION-DEPLOY.md` (the binding plan); 6-lane NA1–NA6 audit `5749ee2`; per-app verdicts: fourier split (backend host + frontend CF Pages), color split (backend host + frontend CF Pages), keyframes.js → CF Pages full, sudoku split (frontend CF Pages + backend csp-solver host), words/floridify stays all-mbabb (no split), grammar DEFERRED. All landed at W8/W9/W10/W11 GREEN (PROGRESS log 2026-05-28 entry §555–§603) |
| **CE5** | "Deploy 6 agents in parallel, fold these findings into this extant tranche as a series of new waves." | 2026-05-27 | D (the α′ fold dispatch) | **ADDRESSED** | 6-agent normalization audit dispatched as `NA1–NA6` (`5749ee2`, 2,047 L); folded into D as new waves W8–W12 (`8c817e3`); `02a8a30` reconciled CANONICAL-ORDERING §10.4 to constellation scope (α′); ordering ε at W12 close |
| **CE6** | "Do not rotate it." (the CF API token `cfat_…`) | 2026-05-27 | D (CF token discipline) | **ADDRESSED — HELD ACROSS ENTIRE TRANCHE** | Token NOT rotated at any point during D execution. Held in gitignored `.env`s (mode `0600`, `git check-ignore` verified); `b176580` records placement; W12 records discipline `342a078` + FINAL §6.1; the original `Mike7400` account-mismatch was resolved at 2026-05-28 by user granting babb.dev access to that same account (NOT by token rotation) — discipline preserved verbatim |
| **CE7** | "Ensure the token is saved in NON-pushed .env files, too." (the gitignored `.env` discipline) | 2026-05-27 | D (CF token placement) | **ADDRESSED** | `b176580` resolved: token stored in `/Users/mkbabb/Programming/fourier-analysis/.env` (mode `0600`, `git check-ignore` confirms ignored, `git status` clean) + `value.js/.env` (mirror); referenced by name only in tracked content; CONSTELLATION-DEPLOY §6 records the discipline; W8 script `scripts/dns-cf-sync.sh` reads `$CLOUDFLARE_API_TOKEN` from env, never persists |
| **CE8** | "The mongo fix is in this tranche, too. All items in this tranche with extra waves as needed." | 2026-05-27 | D (front-loaded to W1 Phase 1 as FIRST act) | **ADDRESSED** | Mongo bind landed FIRST in D.W1.Phase1 `577f037` — 3 Mongos (fourier `:27017`, floridify `:27018`, palette `:27020`) bound off `0.0.0.0`; 8 UFW rules withdrawn; external `nc -zv` from local laptop: all 4 ports timeout (refused — symmetry with NA1 §4b previously-confirmed open state). Cross-app residuals on floridify + palette-api host dirs named (sibling-maintainer scope). Close record `audit/W1-phase1-host.md`; FINAL §0(a) |
| **CE9** | "Deploy 4 agents in parallel to harden, and properly define, fully write out and update for congruence, the wave spec and tranche spec hitherto." | 2026-05-27 | D (Wχ-harden) | **ADDRESSED** | `292897f` — `docs(D.Wχ-harden): 14 wave specs + central D.md/PROGRESS/coordination reconcile`. 14 wave specs (W0/Wα/Wχ/W1–W12) hardened; D.md, PROGRESS.md, coordination/* all reconciled for congruence; 4-agent parallel dispatch honoured |
| **CE10** | "Try this now. And use the github CLI if need be to, to complete the tranche off in totality." (the CF token unblocker after user granted babb.dev access to Mike7400's account) | 2026-05-28 | D (W8/W9/W10/W11 unblock) | **ADDRESSED** | User granted babb.dev access to `Mike7400@gmail.com`'s CF account; the same token (NOT rotated, honouring CE6) now resolved zone id `39bca225…`. In single-session 2026-05-28 execution: W8 `dns-cf-sync.sh` landed 8 records; W10 `certbot --expand --apache` added 4 SANs to live LE cert (7 total); 3 per-`api.<app>` Apache vhosts + `deploy.babb.dev` vhost; **`gh` CLI USED for all 5 sibling repos** to update GitHub webhook URLs → `https://deploy.babb.dev/hooks/deploy`; end-to-end redelivery test for fourier 502 → 200 (the 2-month constellation-wide webhook regression CLOSED); W9 deployed 4 CF Pages projects (fourier-682/keyframes-8uq/color-enw/sudoku-hoq); W11 cosmetic close. **D closed CLEAN at `342a078` + cleanup `6039e95`** (was `complete_with_constellation_residuals` at `eceddba` provisional close 2026-05-27; superseded 2026-05-28) |

**D-execution-phase subtotal**: 9 directives · 9 ADDRESSED · 0 OUTSTANDING. Every D-execution-phase user mandate landed within D.

### §1.7 — E-development prompt (the present brief — 5 discrete tracked directives)

The E-development brief is structurally similar to the D-development brief (6-agent shape, deep audit, NO-quick-solutions, NO-legacy, recap, fold deferred, tranche-development-only) but adds the cross-repo refine/test/CRUD-of-both-palette-APIs-and-fourier-viz-APIs + ALL-consumers + fix-cross-repos directives. These are directives *in flight this very round*; their disposition is the development-phase state. Each is broken into a tracked request in §3.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| E1 | "DEEPLY audit with 6 agents in parallel our original plan and waves thereof, alongside all changes made herein." | E | **ADDRESSED** (this round) | EA1–EA6 dispatched read-only under `docs/audits/runs/2026-05-28-E-audit/`; this deliverable is EA4 |
| E2 | "NO quick solutions, NO workarounds: idiomatic, gestalt approaches … NO legacy code." | E | **ADDRESSED-as-binding-precept** (this round; binding for every E wave) | §2 herein verifies HELD at HEAD `6039e95`; the binding list §2.1 carries it forward into E waves |
| E3 | "Delineate any chronically deferred items and fold them into this new tranche. Delineate any deferred items and fold them into this new tranche." | E | **ADDRESSED-this-round → fold to synthesis** | §3 herein enumerates; sibling EA lanes (EA2 inventory equivalent) provide ground-truth; E synthesis folds into E charter §7. Surviving items at HEAD: csp-solver runtime API URL fix; keyframes.js/value.js GH-Pages teardowns; W11 FULL-rename (data-bearing volume migration); dispatcher `mkbabb/value.js)` arm; bundle split; pre-existing pytest failure `test_backfill_image_bounds_on_migrated_image`; the value.js cross-repo ask `VALUE-JS-ASK.md` (53 cells, user-re-mandate-gated) |
| E4 | "Recap ALL of our prompts and requests hitherto and ensure they've been addressed." | E | **ADDRESSED-this-deliverable** | §1 herein — the authoritative ledger, A 15/15 + B 5/5 + C 7/7 + CE1 1/1 + D 11/11 + CE 9/9 + E in-flight |
| E5 | "This is NOT an implementation phase. Tranche development only." | E | **ADDRESSED** (held; binding for this round) | This lane writes ONE audit doc, no source edits, no commits; the 6-lane EA dispatch is read-only; E charter authoring will be the only write product |
| E6 | "Including ALL consumers. Fix our cross repos." | E | **ROUTED-TO-E** (a dedicated cross-repo cohesion thread) | The "all consumers" + "fix cross repos" is the cross-repo CRUD refine/test/CRUD-of-both-palette-APIs-and-fourier-viz-APIs ask. Routes to a dedicated E thread (cross-repo cohesion) — touches value.js (the `VALUE-JS-ASK.md` 53-cell ask is user-re-mandate-gated; if E is the gate, value.js-I or a parallel tranche fires), palette-api repo (`/home/mbabb/Programming/palette-api/` rsync target; the W11 FULL rename is here), csp-solver (the cross-repo runtime API URL fix); keyframes.js + value.js GH-Pages teardown |
| E7 | "Refine, test, CRUD, our two palette apis and fourier viz apis." | E | **ROUTED-TO-E** (the headline E thread) | Two palette APIs = (a) `palette-api` on host `/home/mbabb/Programming/palette-api/` v2.0.0 live at `api.color.babb.dev`; (b) value.js's palette surface (the held `Palette`/`colorScale` library nobody calls — latent inverted-δ edge from `coordination/COLOUR-LIFT.md`). Fourier viz APIs = the converged-entity CRUD surface fourier exposes (`api/lib/crud/`, the `palette_slug` FK consumer side). Refine + test + CRUD = (1) the v2.0.0 contract re-verified live against both surfaces; (2) the 53 DEFERRED-TO-VALUE.JS cells dispositioned (cross-repo execution); (3) the colour-lift named-residual either consumed (if value.js publishes `sampleToSVGPath`) or formally closed. Routes to E threads (CRUD + cross-repo cohesion + value.js) |

**E-era subtotal**: 7 directives · 5 ADDRESSED/HELD-this-round (E1, E2, E3, E4, E5) · 2 ROUTED-TO-E (E6, E7) · 0 OUTSTANDING.

### §1.8 — Aggregate tally

| Disposition | A-era | B-era | C-era | C-exec | D-era | D-exec | E-era | Total |
|---|---|---|---|---|---|---|---|---|
| **ADDRESSED** | 15 | 5 | 7 | 1 | 11 | 9 | 5 | **53** |
| **PARTIAL** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| **ROUTED-TO-E** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | **2** |
| **OUTSTANDING** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| **Total** | 15 | 5 | 7 | 1 | 11 | 9 | 7 | **55** |

**No directive is OUTSTANDING.** The lineage has grown from DA5's 39 to **55 directives** (DA5's 39 + 9 D-execution-phase prompts + 7-clause E-development brief). The 5 ROUTED-TO-D items DA5 carried are **all now ADDRESSED through D execution**. The 2 new ROUTED-TO-E items are the explicit E-execution payload, pinned to named threads in §3.

---

## §2 — Precept compliance audit (the D execution + the E-development brief, verified at HEAD `6039e95`)

Per standing precept canon. Verdict format: **HELD** / **HELD-with-residual** / **VIOLATION** (`file:line`). Precepts canon: `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md`; memory feedback (`feedback_no_fallbacks.md`, `feedback_style_archaic.md`, `feedback_parallelization.md`, `feedback_em_dashes.md`); B.md invariants 12/15/16/19/20.

| Precept | D-execution verdict | E-development verdict | Evidence / flag |
|---|---|---|---|
| **No quick solutions / no workarounds** | **HELD.** Every D wave's hard finding was fixed at the root: D.W1 vendoring sibling repos (`npm pack`) was the *smallest idiomatic fix* (alternative — publishing siblings at current versions — would have breaking-changed other consumers); D.W2 mongod-8.0 honesty pivot recorded `--tlsAllowConnectionsWithoutCertificates` as load-bearing reality (NOT papered over the empirical falsification of C/infra/tls.md §1's "inert" claim); D.W4 P4.C2 enumeration gap (`9 #f0b632` + `12 alpha-modifier` sites swept, NOT just the 3+6 W4 initially enumerated). | **HELD-this-round.** This lane writes ONE audit doc, no source edits, no shortcuts on the ledger. | D/FINAL §0(c) honesty pivot; W4 close `audit/W4-design-refinement.md` enumeration-gap closure |
| **Idiomatic / gestalt** | **HELD.** D.W3's backend rename `snapshot_hash → content_hash` is the H3-truthful target (content-hash semantically, NOT a slug as C.W4's frontend was); typed `ImageAsset` Pydantic model is a real type reshape, not a cast. The CF Pages migration (W9) uses wrangler's native deploy mechanism; the api ingress (W10) uses Apache's `--expand --apache` plugin already on-host (NOT a new plugin install). | **HELD-this-round.** | D/FINAL §0(e); W3 close `audit/W3-backend-no-legacy.md`; W10 close `audit/W10-ingress-and-le.md` |
| **Architectural transposition for elegance / simplicity / performance (DESIRABLE)** | **HELD.** The CF Pages migration is a *real architectural transposition* (static frontend off Docker container onto CF anycast edge, ~7ms TTFB vs ~80ms from EC2; reduces host load); the `.cartoon-card` shim is a one-line `@utility` restoring 14 components (one change lifts 14 sites); typed `ImageAsset` retires the entire class of bug that produced C9/C10. | **HELD-this-round.** | D/FINAL §3 invariant "Production parity"; W9 close `audit/W9-cf-pages-migration.md` |
| **NO legacy code** | **HELD.** The standing breach (B5/C3) was discharged on frontend in C.W4 + on backend in D.W3 (`ce61e7c`). At HEAD `6039e95`: `git grep -nE "snapshot_hash\|snapshotHash" api/` → 0 on identity paths; `git grep -nE "snapshot_hash\|snapshotHash" web/src` → 0; `FlaggedListResponse` → 0; `Binary(content)` in `image_storage.py` → 0; `scripts/deploy.sh` absent; dead `gallery` stratum deleted (11 boot indexes removed, `_entry_from_doc` + `GalleryEntryResponse` gone); `mypy --strict` clean on 4 asset modules. The 2 residual `as unknown as` serialization casts in `web/src/lib/equation/api.ts:36,53` DA5 noted are still present — **non-identity, pre-existing, non-load-bearing**; E should reshape rather than carry if E touches the equation-compute path, otherwise leave (per §2.1.2). | **HELD-this-round.** | D/FINAL §0(e), §3; W3 close audit. Residual: `web/src/lib/equation/api.ts:36,53` (2 casts, unchanged since DA5; not a regression) |
| **Fix at the ROOT** | **HELD.** D.W3 fixed `snapshot_hash` at the root (backend DB field + 9 admin sites + migration); D.W4 fixed `.cartoon-card` at the ROOT (a single `@utility` in `style.css` restores all 14 application sites — not 14 component-local patches); D.W1.Phase1 fixed Mongo exposure at the ROOT (3 compose `ports:` edits + UFW rule withdrawal, not per-app firewall whack-a-mole). | **HELD-this-round.** | D/FINAL §2 ledger; W4 close audit |
| **Deep parallelization with agents** | **HELD.** D ran 6-lane D-development audit (DA1–DA6 `10bb0ba`) + 4-design audit (A1–A4 `9b45f92`) + 6-lane normalization audit (NA1–NA6 `5749ee2`) + 4-agent Wχ-harden (`292897f`) + 2-agent Wα + 5-probe Wχ + W3 ∥ W4 ∥ W8; W10 ∥ W9 ∥ W11 (single-session 2026-05-28). This E round is itself a 6-lane EA1–EA6 dispatch. `feedback_parallelization.md` honoured. | **HELD-this-round.** | PROGRESS.md log entries; D/FINAL §2 |
| **Archaic diction intentional (don't flag)** | **HELD.** D plan/audit/FINAL/PROGRESS prose preserves the register (therein/heretofore/corporeal/basal); `feedback_style_archaic.md` not flagged in any D output. The "appurtenant documentation" phrase in CE2 is itself archaic — honoured. | **HELD-this-round.** This deliverable continues it (e.g., "the smallest mechanism", "the load-bearing finding"). | D/FINAL prose; this deliverable |
| **Unicode em dashes (U+2014), never `---`** | **HELD.** EA4-checked: D/FINAL, D.md, PROGRESS.md, W0–W12 wave specs, all D audit docs use `—`. No LaTeX source touched in D (paper unchanged this tranche). `feedback_em_dashes.md` honoured. | **HELD-this-round.** This deliverable uses `—` throughout. | grep verification — see §5 provenance |
| **KISS / invariant-12** | **HELD.** D rejected per-line: a webhook framework + new container + registry (α — kept `webhook` receiver + dispatcher); mutual TLS + ACME (α — Path B HTTP-01 via existing `--apache` plugin); a shared CRUD framework/codegen (δ — `CRUD-CONTRACT v2.0.0` is a contract, not a framework, inv-16 re-cert §0); a background queue for `--reload` (deferred to E if ever needed); a dual-read storage layer; a CF Pages monorepo (per-app projects); a single LE cert via DNS-01 (HTTP-01 via existing `--apache` is smaller). | **HELD-this-round.** | D/FINAL §3 implicitly; W5 close `audit/W5-crud-cohesion.md` |
| **No fallbacks / optional-deps / `*_AVAILABLE` flags** | **HELD.** No optional-dep flags; no `try/except` import guards; no dual-read "for safety" layer past W3 cutover; the SSH-trigger as deploy mechanism was an honest pivot (not a fallback — webhook URL public DNS was broken so SSH-trigger is the operational reality until W10 lands), not a *coded* fallback. The colour-lift named-residual is honest deferral, not a code fallback. `feedback_no_fallbacks.md` honoured. | **HELD-this-round.** | D/FINAL §0(b); W1 close `audit/W1-phase2-deploy.md`; W5 close audit §residuals |

**No precept is violated in the D execution.** The DA5-flagged residual smell (2 serialization casts in `equation/api.ts:36,53`) is unchanged at HEAD — non-load-bearing, non-identity, pre-existing; not a regression. **Net: the D execution upgraded the C-execution precept landing (which DA5 called "the cleanest precept landing of the lineage") by discharging the backend `snapshot_hash` band end-to-end and adding three new invariants (Production parity, code-and-migration-together, token-system-single-source-of-surface-truth) — all promoted to `docs/precepts/infra/` via W2 spine 3 `64f79f9`.**

### §2.1 — E-era precept-compliance forward-guard (the binding list for the E-authoring round)

1. **NO new legacy code** — E's cross-repo execution (E6/E7) must not reintroduce a dual-read or a name-mirror; the `VALUE-JS-ASK.md` discharge (if user re-mandates) must land the converged shape across both repos, not a compatibility shim.
2. **The equation `as unknown as` serialization casts** (`web/src/lib/equation/api.ts:36,53`) — if E touches the equation-compute path, reshape rather than carry; otherwise leave (pre-existing, non-load-bearing, non-identity — DA5/EA4 verified). Do not let them grow.
3. **The `--reload` background-queue** (deferred from C → D → E) must be the ROOT fix (compute outliving a request → a real queue) only IF the trigger fires — not a speculative framework (the "library nobody calls" + inv-16 framework-in-disguise guard). KISS default: the one-token watch-narrowing C landed is sufficient absent the trigger.
4. **The colour `Palette`/`colorScale`** stays latent — E must NOT build it absent a real fourier gradient/scale consumer (inv-15 domain-in-app + library-nobody-calls). If E7 (palette/viz API CRUD refine) is pursued and finds a real consumer, it is value.js's to author, fourier consumes (the inverted δ edge).
5. **W11 FULL rename** (palette-api host dir/container/volume rename) — the W12 named-residual; data-bearing volume orphan-risk on naive rename. If E does this, it must be a scheduled-downtime cutover with the recipe at `coordination/PALETTE-API-PROVENANCE.md §4`, NOT an in-flight live rename.
6. **Deep parallelization** — the 6-lane EA dispatch + any design/Playwright sub-waves must run concurrently where disjoint.
7. **Em dashes + archaic diction** — continue; do not flag the register.
8. **Cross-repo execution requires user re-mandate** — `VALUE-JS-ASK.md` is gated; E must NOT touch value.js source without an explicit user-mandate for the cohesion landing. (inv-16, the cross-repo write-path guard.)

---

## §3 — Outstanding items to fold into E

The lineage has zero **OUTSTANDING (unrouted)** items. The 2 ROUTED-TO-E directives (E6 "all consumers, fix cross repos"; E7 "refine, test, CRUD, our two palette apis and fourier viz apis") plus the surviving named residuals from D/FINAL §6 are the E-execution payload. Below is the E-fold list — every item is named, evidence-cited, and routed to a binding thread/wave.

### §3.1 — Cross-repo execution payload (the headline E thread — from E6 + E7)

- **(α)** **`VALUE-JS-ASK.md` discharge** — the 53 DEFERRED-TO-VALUE.JS cells of the v2.0.0 `CRUD-CONTRACT`. User-re-mandate-gated per `D.W5` close. If E is the gate, value.js-side execution lands here (value.js-I or parallel tranche fires); fourier consumes. Cross-repo. Owner: value.js maintainer + user mandate; fourier-EA observes. Evidence: `docs/tranches/D/coordination/VALUE-JS-ASK.md`; `docs/tranches/D/audit/W5-crud-cohesion.md`.
- **(β)** **Colour-lift `sampleToSVGPath`** — value.js@0.10.0 doesn't export it (DA5/EA4 verified absent in value.js `src/`); named residual from C.Wχ-P3 → D.W5. If value.js publishes it in I, fourier consumes via inverted δ edge. Owner: value.js publish; fourier consumes. Evidence: `coordination/COLOUR-LIFT.md`.
- **(γ)** **csp-solver runtime API URL** — `useApi.ts` hardcodes `api/v1` relative; needs one-line fix to read `VITE_API_URL` for the CF Pages cutover. The static surface deploys cleanly; only the API-mediated solve path is affected. Cross-repo (`mkbabb/csp-solver` maintainer). Evidence: D/FINAL §6.2.
- **(δ)** **keyframes.js + value.js GH-Pages teardown** — `peaceiris/actions-gh-pages` deploy job retirement + `gh-pages` branch deletion + repo CNAME removal. Cross-repo (sibling-repo maintainer). Evidence: D/FINAL §6.2.
- **(ε)** **Dispatcher `mkbabb/value.js` arm** — calls `git fetch` on a non-git host directory (the W11 cosmetic close found this latent-broken; no `mkbabb/value.js` webhook delivery has fired in the host's 2-month lifetime; operational reality is developer-rsync via `value.js/api/deploy.sh`). Cross-repo coordination (value.js maintainer). Evidence: D/FINAL §6.2.
- **(ζ)** **W11 FULL palette-api → color rename** — host directory rename, compose project name, container name, data-bearing volume migration (`palette-api_mongo-data` project-prefixed; orphan-risk on naive rename). Scheduled-downtime cutover recipe at `coordination/PALETTE-API-PROVENANCE.md §4`. Owner: scheduled-downtime window or value.js tranche. Evidence: D/FINAL §6.2.

### §3.2 — Fourier-local residuals (from D/FINAL §6.3–§6.5)

- **(η)** **One pre-existing pytest failure**: `test_backfill_image_bounds_on_migrated_image` (`api/tests/test_image_storage.py`) — W3-followup item. Owner: fourier-E. Evidence: D/FINAL §6.3.
- **(θ)** **Multi-replica fourier deployment** (inv-19). Out-of-D-scope per `D.md §7`; carries to fourier-E if ever needed. Currently no trigger. Owner: fourier-E.
- **(ι)** **Full value.js `Palette`/`colorScale` domain model** — a value.js tranche when a real consumer lands. inv-15 + inv-16 guard. Currently no consumer. Owner: value.js when triggered.
- **(κ)** **Dangling prod images** (`gaggle`, `server-api`, `speedtest-*`) + dead `:8140` speedtest vhost cleanup — host-ops sweep. Owner: host-ops sweep or fourier-E if folded.
- **(λ)** **Frontend bundle split** (867 kB → 854.40 kB at W12) — ε or successor performance item if it proves load-bearing. Currently the gzipped transfer is small (CF anycast cache); not load-bearing. Owner: fourier-E or later.

### §3.3 — Documentation hygiene (from D/FINAL §6.5)

- **(μ)** **`scripts/dns-cf-sync.sh` data tuples** — should be updated from generic `<app>.pages.dev` to the auto-suffixed actual subdomains (e.g., `fourier-682.pages.dev`) — else a future re-run regresses the CNAMEs. (Cosmetic; the W9 close already PATCHed the live records.) Owner: fourier-E cleanup or quick-fix.
- **(ν)** **`scripts/dns-cf-sync.sh` `set -u`** — cosmetic guard for empty UPDATE array (`SUMMARY_UPDATE[@]: unbound variable`); fixed at `6039e95` (`fix(D.W8): set -u guard for empty summary arrays in dns-cf-sync.sh`). **CLOSED post-D-close.** Note: this is the only D-era residual that landed *after* the D close ceremony — verifies the discipline that even cosmetic items get committed cleanly.

### §3.4 — E-thread/wave map (so the E synthesis can verify coverage)

- **Thread E.α (cross-repo CRUD cohesion execution)** ← E6 + E7 + §3.1.α/β/ε/ζ: the `VALUE-JS-ASK.md` discharge (user-gated), the colour-lift consume (value.js-gated), the dispatcher value.js arm reconcile, the W11 FULL rename (scheduled-downtime).
- **Thread E.β (cross-repo coordination)** ← §3.1.γ/δ: csp-solver one-line fix, keyframes.js + value.js GH-Pages teardown. Each is cross-repo / sibling-maintainer; fourier-E coordinates but does NOT unilaterally commit.
- **Thread E.γ (fourier viz API refine + test)** ← E7 (the fourier-local side): re-verify CRUD surface at HEAD, harden the converged-entity API against the v2.0.0 contract, address the pre-existing pytest failure (§3.2.η).
- **Thread E.δ (fourier-local residuals)** ← §3.2: multi-replica decision, host-ops cleanup folding, bundle split decision.
- **Thread E.ε (documentation hygiene)** ← §3.3: data tuple sync (the `set -u` already closed at `6039e95`).
- **E synthesis** ← E3 + E4 + E5: folds deferred + chronic into the E charter §7; produces this round's recap (this deliverable is E4); holds the tranche-development-only mode.
- **This round (EA1–EA6)** ← E1 + E2: the 6-agent audit + the recap.

---

## §4 — Outstanding count

**Across the ENTIRE lineage (A + B + C + C-execution + D + D-execution + E-development = 55 directives): ZERO OUTSTANDING.**

| Class | Count | Notes |
|---|---|---|
| ADDRESSED / HELD | 53 | All A/B/C/C-exec/D/D-exec directives + the 5 this-round E directives (E1, E2, E3, E4, E5) |
| ROUTED-TO-E | 2 | E6 (all consumers, fix cross repos) + E7 (refine, test, CRUD, two palette APIs + fourier viz APIs) — each pinned to named threads E.α–E.γ in §3.4 |
| OUTSTANDING (open, unrouted) | **0** | — |

**The zero-outstanding target is MET.** Everything is either done or routed-to-E. **Key changes since DA5 (which had 39 directives, 0 outstanding, 5 ROUTED-TO-D):**

1. **All 5 DA5-ROUTED items are DISCHARGED through D execution** — D7 (SSH+deploy) landed via W1+W2+W10; D8 (4 design agents) landed via A1–A4 + W4; D9 (cross-repo cohesion) landed via W5 `CRUD-CONTRACT v2.0.0`; D10 (value.js audit) landed via DA3 + the `VALUE-JS-ASK.md` cross-repo ask; D11 (Playwright) landed via W6 cross-env matrix + W9 prod GREEN.
2. **9 new D-execution-phase prompts are added + all ADDRESSED** (CE2–CE10): the execution mandate, the domain naming, the constellation migration, the 6-agent dispatch, the CF token discipline (do-not-rotate + non-pushed `.env`), the Mongo in-tranche mandate, the Wχ-harden 4-agent, and the CE10 unblocker (Try this now + use `gh` CLI).
3. **7 new E-development directives** (E1–E7): 5 ADDRESSED-this-round + 2 ROUTED-TO-E (E6 cross-repo execution; E7 palette/viz API refine).
4. **No prior directive regressed during D execution.** A/B/C/C-exec dispositions are stable at HEAD `6039e95`.

---

## §5 — Provenance

- **Prior ledger (inherited starting point)**: `docs/audits/runs/2026-05-27-D-audit/DA5-prompts-precepts-recap.md` (39 directives, 0 outstanding, 5 ROUTED-TO-D).
- **D landing ground-truth**: `docs/tranches/D/FINAL.md` (CLOSED CLEAN 2026-05-28); HEAD `6039e95`; the D wave commits `dd8e650`→`342a078`→`6039e95` (D/FINAL §2 ledger).
- **D-execution-phase prompt evidence (CE2–CE10)**: `docs/tranches/D/PROGRESS.md` log entries 2026-05-27 (tranche authored + domain naming fold + constellation fold + TLS/Mongo/credential resolution + D.W0 opening + D.W1 close + D.W12 provisional close) + 2026-05-28 (W8/W9/W10/W11 GREEN + D CLEAN re-close); commit ledger `10bb0ba` `9b45f92` `05038dc` `87806f8` `5749ee2` `8c817e3` `02a8a30` `b176580` `292897f` `dd8e650` `d174d6b` `d67b64d` `577f037` `795d64f` `a28e765` `a6ba377` `a77f83a` `1233b06` `5b84e31` `2e4a452` `64f79f9` `aed6c32` `0f5d7c1` `ce61e7c` `2757c43` `2682487` `c2ce6d7` `eceddba` `9cb9dc5` `5bba8ce` `803433d` `342a078` `6039e95`.
- **NO-legacy precept verification (EA4-run greps at HEAD `6039e95`)**:
  - `git grep -nE "snapshot_hash|snapshotHash" api/` → 0 on identity paths (W3 discharged the band; `audit/W3-backend-no-legacy.md`).
  - `git grep -nE "snapshot_hash|snapshotHash" web/src` → 0 (C.W4 discharged).
  - `FlaggedListResponse` → 0; `_entry_from_doc` → 0; `GalleryEntryResponse` → 0 (W3 deletions).
  - `Binary(content)` in `api/services/image_storage.py` → 0.
  - `scripts/deploy.sh` absent (retired in C.W1 `49cb714`).
  - `mypy --strict` clean on 4 W3-touched asset modules (W3 close audit).
- **DA5-noted residual still present (non-regression)**: `web/src/lib/equation/api.ts:36,53` — 2 `as unknown as Record<string, unknown>` serialization casts (request-body serialization on equation-compute path; pre-existing; non-identity; non-load-bearing; do-not-grow per §2.1.2).
- **D host-residuals all discharged**: D/FINAL §0(a)–(m); the C/FINAL §6 named residuals (shared dispatcher, prod TLS, prod migration, precepts promotion) all landed via D.W1/W2/W10 + the precepts submodule `63240e6` superproject bump `64f79f9`.
- **Cross-repo state (E6 + E7 routing)**:
  - value.js `src/` has no `palette/` (DA5/EA4 verified); fourier consumes value.js only for easing/timing (`web/src/lib/easings.ts`, `web/package.json` `@mkbabb/value.js: file:./vendor/mkbabb-value.js-0.10.0.tgz` post-W1 vendoring).
  - value.js HEAD unchanged at `16129e0` / tag `v0.10.0` (inv-16 preserved across D).
  - `sampleToSVGPath` ABSENT in value.js `src/` (δ correctly held as named residual).
  - `palette-api` host at `/home/mbabb/Programming/palette-api/` v2.0.0 live at `api.color.babb.dev` (W10/W11).
  - `coordination/PALETTE-API-PROVENANCE.md` records the standalone-repo provenance + W11 FULL-rename recipe.
  - `coordination/VALUE-JS-ASK.md` records the 53-cell cross-repo ask (user-gated).
- **CANONICAL-ORDERING**: reconciled to **ordering ε** post-D-close (W12 `342a078`).
- **Precepts canon (re-verified live in submodule)**: `docs/precepts/infra/{tls.md, blob-backend-dr.md, deploy.md, domains.md}` (the W2 promotion `63240e6`); `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md`; memory `feedback_{no_fallbacks,style_archaic,parallelization,em_dashes}.md`; B.md invariants 12/15/16/18/19/20.
- **Close commits across lineage**: A `c7cfd82`; B `fc5b3b0`; C `1e47115`; D provisional close `eceddba` (2026-05-27 `complete_with_constellation_residuals`) → D CLEAN re-close `342a078` (2026-05-28) + cleanup `6039e95`. value.js H close `16129e0` / v0.10.0.
- **Em dash + archaic diction verification**: EA4-checked D/FINAL, D.md, PROGRESS.md, all D audit docs use `—`; this deliverable uses `—` throughout. Archaic register honoured (the user's "appurtenant documentation", "indefatigably" — preserved verbatim in PROGRESS.md log § 2026-05-27 W0 opening; D/FINAL prose continues "corporeal"/"basal"/"opulent" register).
