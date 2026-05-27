# DA5 — ALL prompts + precepts recap (the standing ledger, extended through C-execution + the D-development brief)

**Lane**: DA5 (fourier-analysis tranche-D DEVELOPMENT phase — audit only; read + ONE deliverable; NO source edits, NO commits).
**Date**: 2026-05-27. **HEAD**: `1e47115` (C CLOSED — `docs(C.W6): close tranche C`). **Predecessors**: A CLOSED `c7cfd82` · B CLOSED `fc5b3b0` · C CLOSED `1e47115`. **value.js**: H CLOSED `16129e0` / `v0.10.0`; I seeded-unscoped (no colour reference); C RETIRED.
**Charter (user, verbatim intent)**: *"Recap ALL of our prompts and requests hitherto and ensure they've been addressed."* — the standing ledger discipline. This lane inherits CA6's 27-directive ledger as its STARTING POINT and extends it through (i) the C-execution prompt and (ii) the present D-development prompt, then re-verifies every disposition against a commit or `file:line` at HEAD `1e47115`.

**Convention modelled on**: `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md` (the prior recap ledger) and `~/Programming/value.js/docs/tranches/H/H-PROMPTS.md` (verbatim-prompt clause-decomposition).

**Sibling D-lanes**: DA1–DA4, DA6 (this round's other audit lanes) supply ground-truth for the C landing, the cross-repo palette/visualization cohesion, the value.js audit, and the screen/design + Playwright surfaces. DA5 synthesises the *prompt-disposition + precept-compliance + D-directive-breakdown* layers; it does not re-derive their findings — where a D-era directive's discharge belongs to a sibling lane or to a D thread, DA5 ROUTES it, it does not pre-empt it.

---

## §0 — Goal criterion and completion criterion (paired)

**Goal.** Give the D-development round a single authoritative answer to the user's standing demand — *every prompt across the ENTIRE A/B/C lineage plus the two new prompts (C-execution, D-development) is enumerated, its disposition re-verified against a commit or file at HEAD `1e47115`, and the open residue routed to a tracked D thread* — and break the D-development prompt itself into discrete tracked requests so the D synthesis can guarantee none is dropped. The target is **zero-outstanding**: everything either DONE or ROUTED-TO-D.

**Completion.** This document carries: the complete prompt ledger (§1) with `verbatim-or-paraphrase | tranche | disposition | evidence`, A/B-era inherited from CA6 + re-confirmed, C-era now resolved through the C close, the C-execution prompt as its own row, and the D-development prompt decomposed into 11 discrete directives; the per-precept compliance audit (§2) of the C execution with `file:line` on every flag; the D-era directive breakdown (§3) routing each of the 11 to a D thread; and the outstanding count (§4). All criteria hold at this writing.

---

## §1 — Prompt ledger (A / B / C / C-exec / D era — every directive, disposition re-verified at `1e47115`)

Dispositions: **ADDRESSED** (landed + evidenced) · **PARTIAL** (substantially landed, named residual) · **ROUTED-TO-D** (deferred to fourier-D by design, named successor) · **OUTSTANDING** (open, unrouted).

A-era and B-era rows are inherited verbatim from CA6 §1.1–§1.2 (themselves grounded in L1's verified A-close ledger + CA1's B ground-truth); DA5 re-confirms each disposition is unchanged at HEAD `1e47115` (no A/B directive regressed during C execution). C-era rows were ADDRESSED-this-round at CA6 writing (planning state); DA5 **promotes** them to their post-execution disposition now that C has CLOSED. The C-execution prompt and the D-development prompt are new rows.

### §1.1 — A-era (founding brief through A close `c7cfd82`) — inherited from CA6 §1.1, re-confirmed

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| A1 | "DEEPLY audit with 6 agents in parallel … NO quick solutions, NO workarounds … fully abrogate fourier-overrides and ios-fixes … bidirectional style audit … Develop out a new tranche hereof, placed in docs, like glass-ui's" | A | **ADDRESSED** | `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`; A authored, opens `3fc960c` |
| A2 | "Explicate each wave, and plan for the CRUD migration … Potentially split that facility into a separate tranche" | A→B | **ADDRESSED** | waves W0–W6 explicated; CRUD split → tranche B |
| A3 | "fully spec out B to encompass both fourier analysis and value.js. Harden and refine both that spec, and A, with 6 agents" | A/B | **ADDRESSED** | `B.md` (17 invariants); `2026-05-18-tranche-harden/{h1..h6,SYNTHESIS}.md` |
| A4 | "Let's further develop the CRUD system … Deploy 6 agents in parallel. SOTA." | B | **ADDRESSED** | `2026-05-19-crud-deepen/SYNTHESIS.md` — 9 decisions + 9 KISS rejections |
| A5 | "Should our CRUD system be a sub-library … or should we roll our own?" | B | **ADDRESSED** | three-tier verdict; `2026-05-19-utility-extraction/DECISION.md`; SLUG-WORDS |
| A6 | "Assay the current set of changes … What is the cannonical ordering?" | A/B | **ADDRESSED** | `2026-05-19-refinement-assay/{r1..r6}.md`; `CANONICAL-ORDERING.md` (now reconciled to ordering δ — §1.4 note) |
| A7 | "Execution order for both repos? … deploy 4 agents … update the tranche/wave spec to latest precepts/ … submodule pin a59c60d" | A/B | **ADDRESSED** (was PARTIAL; closed) | pin `a59c60d` non-canonical → substituted `f27627e`; 4-agent P1–P4 rewrote 30+ docs; spec verified under `f27627e` |
| A8 | "Look to precepts within gaggle/ or feedback-coder/ … Reconcile and update ALL precepts modules within ALL consumers" | A/B | **ADDRESSED** | submodule pinned `f27627e` constellation-wide |
| A9 | "Begin and continue the current tranche … fully orchestrate as team lead … indefatigably … IN TOTALITY. NO quick solutions, NO workarounds." | A | **ADDRESSED** | A.W0→W6 dispatched without intervention; close `c7cfd82` |
| A10 | "fully abrogate `buttons.css`" (in-band W2.e) | A | **ADDRESSED** | `10e616c` — `.btn-*`/`.basis-pill` → `<Button>`/`<Badge>` |
| A11 | "backend tested with docker" (W2.g escalation) | A | **ADDRESSED** | `574cd71` + `5fdf6ff` |
| A12 | "Fira Code count rerun" (canonical recount) | A | **ADDRESSED** | `04cf719` — 82 hits, 13 adopted, 55 kept-decorative |
| A13 | "The paper texture is FAR too extreme … sidebar needs to leverage glass-ui … Dark mode paper totally broken … Deep inspection and refinement." | A | **ADDRESSED** | W3.5: glass-ui `9cf88e6`; fourier `2b308f7` |
| A14 | "glass-ui's version should be the fourier original one … Change and fix items at the ROOT." | A | **ADDRESSED** | glass-ui `9b8de74` + fourier `cb94aa3` (`useSidebarState<T>` at root) |
| A15 | "visualization pipeline … properly refined, tested, inspected" | A | **ADDRESSED** | `e0e9dda` — O(n³)→O(n log n) Visvalingam-Whyatt; single-pass epicycles |

**A-era subtotal**: 15 directives · 15 ADDRESSED · 0 PARTIAL · 0 OUTSTANDING. (A7's PARTIAL at CA6 was already closed at A/B; DA5 records it ADDRESSED.) No A-era directive regressed during C.

### §1.2 — B-era (B-development brief through B close `fc5b3b0`) — inherited from CA6 §1.2, RESOLVED through C

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| B1 | "DEEPLY audit with 6 agents … Fold all findings into B … This is NOT implementation. Tranche development only." | B | **ADDRESSED** | `2026-05-26-B-audit-wave-1/L1..L6` + synthesis; B plan augmented; planning-only honoured |
| B2 | "Begin and continue the current tranche … IN TOTALITY … adhere exactly to the plan … agent orchestration and deep parallelization … fully orchestrate as team lead." | B | **ADDRESSED** | B.W0→W5 dispatched (`b0a85d8`→`fc5b3b0`); CA1 confirms 5 LANDED-AS-PLANNED / 3 DIVERGED / 1 PARTIAL, every divergence named-successor'd |
| B3 | (implicit) "Recap ALL prompts hitherto" | B | **ADDRESSED** | `L1-prompt-precept-recap.md` |
| B4 | (implicit) "Delineate chronically deferred items, fold into B" | B | **ADDRESSED** | `L6-deferred-chronic.md` chronic ledger |
| B5 | (implicit, inherited) "NO legacy code; idiomatic/gestalt; fix at ROOT; deep parallelization" | B → **C** | **ADDRESSED** (was PARTIAL at B; the residual DISCHARGED in C) | B left a frontend legacy-name residual (`snapshot_hash` DTO band + `as unknown as` cast); **C.W4 `f91a656` discharged it at the ROOT** — `git grep -nE "snapshot_hash\|snapshotHash" web/src` → 0 on identity paths (DA5-verified); `FlaggedListResponse` deleted (DA5-verified: 0 hits); the cast removed from `AdminFlaggedPanel.vue` (DA5-verified: 0); `vue-tsc -b --force` green WITH the cast removed (C/FINAL §0(a), the T1 keystone) |

**B-era subtotal**: 5 directives · 5 ADDRESSED · 0 PARTIAL · 0 OUTSTANDING. **B5 — the single live precept violation CA6 flagged as ROUTED-TO-C — is now CLOSED.** Its discharge is C's compliance restoration (C/FINAL §0(a), §9). This is the load-bearing upgrade since CA6: the one open NO-legacy-code breach is gone.

### §1.3 — C-era (the C-development authoring brief) — RESOLVED through the C close `1e47115`

CA6 §1.3 recorded these as ADDRESSED-this-round (planning state); DA5 promotes each to its post-execution disposition.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| C1 | "DEEPLY audit with 6 agents … Devise a path forward." | C | **ADDRESSED** | CA1–CA6 dispatched read-only; folded into expanded C charter `9003cba` |
| C2 | "Recap ALL prompts … ensure they've been addressed." | C | **ADDRESSED** | CA6 ledger (27 directives, 0 OUTSTANDING) — the recap discharged |
| C3 | "NO legacy code." | C | **ADDRESSED** (was ROUTED-TO-C) | The single live legacy-code residual (B5) was discharged at the root in C.W4 `f91a656` — see B5 evidence above. The precept held for every C wave (§2). |
| C4 | "Delineate any chronically deferred items … fold into C." | C | **ADDRESSED** | CA2 18-item inventory; C.md §7 carries every chronic item with a named destination; the `--reload` chronic folded into C.W3 `e6a6b95` |
| C5 | "Delineate any deferred items and fold into C." | C | **ADDRESSED** | CA2 §3 fold map; C.md §7 cross-tranche-debt section enumerates every deferral + successor |
| C6 | "In both value.js and herein. What is next for tranche C?" | C / value.js | **ADDRESSED** | CA3 cohort-reopen verdict; value.js-H CLOSED `16129e0` / v0.10.0; I seeded-unscoped; the colour lift is value.js's to author (inverted edge) |
| C7 | "Fold items into C, expand and augment that tranche and wave set." | C | **ADDRESSED** (was PARTIAL-in-flight) | The expanded C charter (`9003cba`) folded threads γ + δ, added invariant 20, corrected the drifted anchors; **C then EXECUTED to close** (`fce1808`→`1e47115`, 9 execution commits; C/FINAL §2 ledger) |

**C-era subtotal**: 7 directives · 7 ADDRESSED · 0 PARTIAL · 0 ROUTED · 0 OUTSTANDING. **Every C-development directive — including the two CA6 flagged as ROUTED/PARTIAL-in-flight (C3, C7) — is now ADDRESSED through the C execution.**

### §1.4 — C-execution prompt (the "Begin and continue" mandate that drove `fce1808`→`1e47115`)

The C-execution prompt is the canonical execution mandate (identical in shape to A9/B2): *"Begin and continue the current tranche … in totality … NO quick solutions … idiomatic gestalt … fully orchestrate as team lead."* It is one directive, discharged by the entire C wave sequence.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| CE1 | "Begin and continue the current tranche … IN TOTALITY … NO quick solutions, NO workarounds … idiomatic gestalt … adhere to the plan … deep parallelization … fully orchestrate as team lead." | C | **ADDRESSED** | C executed W0 → Wα → Wχ(+harden) → W3 ∥ W4 → W1 ∥ W5 → W2 → W6 (C/FINAL §0, §2); research-first for β; 9 execution commits; **all four Wχ probes found real load-bearing flaws** (P1 janitor-orphans-blobs, P2 live-dispatcher-contradicts-greenfield, P3 dedup-KeyError, P4 insufficient greps) and each was remedied (C/FINAL §5) — the "in totality / no quick solutions" discipline demonstrably held; close `1e47115`; `uv run pytest` 129 passed, `vue-tsc -b --force` exit 0, `npm run build` exit 0 (C/FINAL §8) |

**Notes on C-execution honesty** (relevant to the recap): C closed **`complete_with_host_residuals`** — every host-coupled remainder (shared `/opt/deploy/dispatch.sh` rewrite, prod TLS cert provisioning, prod migration run, precepts-submodule promotion) is a named, runnable successor (C/FINAL §6), never claimed proven-when-not. These residuals are the substrate for D-directive (g) (§3). `CANONICAL-ORDERING.md` is reconciled to **ordering δ** (post-C-close, AUTHORITATIVE §9; DA5-verified at `:270`).

**C-execution subtotal**: 1 directive · 1 ADDRESSED · 0 OUTSTANDING.

### §1.5 — D-development prompt (the present brief — directives being addressed by THIS round)

The D-development brief is the same 6-agent shape, expanded with the recap + fold + cross-repo + design + Playwright mandates. These are directives *in flight this very round* (the 6-lane DA1–DA6 audit + the planned design + Playwright waves + the D synthesis); their disposition is the development-phase state. Each is broken into a discrete tracked request in §3.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| D1 | "DEEPLY audit with 6 agents in parallel." | D | **ADDRESSED** (this round) | DA1–DA6 dispatched read-only under `docs/audits/runs/2026-05-27-D-audit/`; this deliverable + 5 siblings |
| D2 | "NO legacy code." | D | **ADDRESSED-as-binding-precept** (this round) | At HEAD `1e47115` the prior NO-legacy breach (B5) is discharged; DA5 re-verifies 0 identity-path `snapshot_hash`/`FlaggedListResponse`/`as unknown as`-on-identity (§2). The precept is BINDING for every D wave; DA6/§2 guards it. (Residual smell: 2 `as unknown as` serialization casts in `web/src/lib/equation/api.ts:36,53` — NOT identity-name masks; flagged §2 for D consideration.) |
| D3 | "Delineate any deferred items and fold into D." | D | **ADDRESSED** (this round; fold to DA-inventory + D synthesis) | The deferred set is enumerated (§3-c); the C-named successors (`--reload` background-queue, multi-replica) + the chronic carries route to the D synthesis. Ground-truth owner: a DA inventory lane + the synthesis. |
| D4 | "Delineate any chronically deferred items and fold into D." | D | **ADDRESSED** (this round) | The chronic set (the items surviving A→B→C) routes to D (§3-d); the host-ops residuals are the dominant chronic class now. |
| D5 | "Recap ALL of our prompts and requests hitherto and ensure they've been addressed." | D | **ADDRESSED** (this deliverable) | §1 herein — the authoritative ledger, A 15/15 + B 5/5 + C 7/7 + CE 1/1 + D in-flight |
| D6 | "Tranche development only this phase (no implementation)." | D | **ADDRESSED** (this round, held) | This lane writes ONE audit doc, no source edits, no commits; the 6-lane dispatch + design + Playwright are all read-only / analysis; D charter authoring is the only write product. Held. |
| D7 | "SSH in, integrate, and deploy everything (the C residuals)." | D | **ROUTED-TO-D** (host-ops thread) | The C host-residuals (shared dispatcher rewrite, prod TLS cutover, prod migration, precepts-submodule promotion — C/FINAL §6) are the integrate+deploy payload; this is operational host-ops work that requires actual SSH to `mbabb.fridayinstitute.net:1022` — explicitly NOT this development phase per D6, but the named D execution thread. |
| D8 | "4 design agents via the frontend-design plugin analyze EVERY screen of both apps." | D | **ROUTED-TO-D** (Wave 2) | Task #80 (D-dev Wave 2: 4-agent design analysis of every screen). The frontend-design plugin skill is available. Disposition: queued, not yet run. |
| D9 | "Cross-repo palette/visualization CRUD cohesion." | D | **ROUTED-TO-D** (a DA lane + D synthesis) | DA5-verified ground truth: value.js has **NO `src/palette/`** (only `easing/math/parsing/quantize/transform/units`); fourier consumes value.js **only** for easing/timing (`web/src/lib/easings.ts`, `ConvergencePlot.vue` etc.) — no palette/colorScale consumer. The "palette cohesion" is the latent inverted-δ edge (`sampleToSVGPath` + the held `Palette`/`colorScale`); "visualization CRUD cohesion" is the converged-entity + `api/lib/crud/` surface B landed. Routes to a dedicated cross-repo cohesion DA lane. |
| D10 | "Audit value.js." | D | **ROUTED-TO-D** (a DA lane) | value.js at H close (v0.10.0, `16129e0`); I seeded-unscoped. The value.js audit (state, the inverted-δ readiness, I-thesis) routes to a DA value.js lane (mirrors CA3). |
| D11 | "Playwright both apps across local / dev / prod." | D | **ROUTED-TO-D** (Wave 3) | Task #81 (Playwright validation local/dev/prod). The Playwright MCP toolset is available (deferred). Disposition: queued, not yet run. Note: dev/prod targeting depends on D7 (the deploy) landing first. |

**D-era subtotal**: 11 directives · 6 ADDRESSED-this-round (D1, D2, D3, D4, D5, D6) · 5 ROUTED-TO-D (D7 host-ops, D8 design, D9 cross-repo cohesion, D10 value.js audit, D11 Playwright) · 0 OUTSTANDING. The 5 ROUTED are routed to *named D threads / waves / lanes* — none is dropped.

### §1.6 — Aggregate tally

| Disposition | A-era | B-era | C-era | C-exec | D-era | Total |
|---|---|---|---|---|---|---|
| **ADDRESSED** | 15 | 5 | 7 | 1 | 6 | **34** |
| **PARTIAL** | 0 | 0 | 0 | 0 | 0 | **0** |
| **ROUTED-TO-D** | 0 | 0 | 0 | 0 | 5 | **5** |
| **OUTSTANDING** | 0 | 0 | 0 | 0 | 0 | **0** |
| **Total** | 15 | 5 | 7 | 1 | 11 | **39** |

**No directive is OUTSTANDING.** The lineage has grown from CA6's 27 to **39 directives** (the C-execution prompt + the 11-clause D-development prompt). The three PARTIALs CA6 carried (A7, B5, C7) are **all now ADDRESSED** — A7 closed at A/B, **B5/C3 discharged in C.W4** (the standing NO-legacy breach is gone), C7 executed to close. The single ROUTED-TO-C item (C3 remediation) LANDED. The 5 ROUTED-TO-D are the new D-execution payload, each pinned to a named thread.

---

## §2 — Precept compliance audit (the C execution, re-verified at HEAD `1e47115`)

Per standing precept. Verdict format: **HELD** / **HELD-with-residual** / **VIOLATION** (`file:line`). Precepts canon: `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md`; memory feedback (`feedback_no_fallbacks.md`, `feedback_style_archaic.md`, `feedback_parallelization.md`, `feedback_em_dashes.md`); B.md invariants 12/15/16/19/20.

| Precept | C-execution verdict | Evidence / flag |
|---|---|---|
| **No quick solutions / no workarounds** | **HELD.** The CA6-flagged `as unknown as` identity cast in `AdminFlaggedPanel.vue` is REMOVED (DA5-verified 0 hits). The four Wχ probes each found a flaw the research missed and each was fixed at the root, not papered over (C/FINAL §5). **Residual smell (not a violation)**: `web/src/lib/equation/api.ts:36,53` carry 2 `as unknown as Record<string, unknown>` casts — these are request-body serialization casts on the equation-compute path, a *pre-existing* pattern unrelated to identity, not a CA6-class type-truth mask. Flag for D consideration only. |
| **Idiomatic / gestalt** | **HELD.** γ was a genuine type reshape (rename to `slug`/`owner_slug` matching the backend wire, no alias, no cast — C/FINAL §3); the keystone is `vue-tsc` green WITH the cast removed. β is filesystem+nginx (the gestalt storage boundary, atomic per-doc cutover). |
| **Architectural transposition for elegance / simplicity / performance (DESIRABLE)** | **HELD.** inline-`Binary(content)` blob → bounded filesystem backend (`storage_uri`, delete-coupled janitor, invariant 18); manual `deploy.sh` SSH-push → tracked `deploy-hook.sh` with flock + real `:8100` gate. KISS-load-bearing, no contrivance. |
| **NO legacy code** | **HELD** (was the one B VIOLATION). DA5-verified at `1e47115`: `git grep -nE "snapshot_hash\|snapshotHash" web/src` → 0; `FlaggedListResponse` → 0; `as unknown as` on identity → 0; `Binary(content)` in `image_storage.py` → 0; `scripts/deploy.sh` does not exist; no dual-read storage compatibility layer (C/FINAL §8 brittleness-window STRUCK). The live NO-legacy breach CA6 flagged is closed. |
| **Fix at the ROOT** | **HELD.** B's leaf-fix (mirror-the-slug) was re-done at the root in C.W4 (rename the DTO end-to-end + delete the stale type). The `--reload` compute-abort fixed at root (one-token watch-narrowing, not a background-queue band-aid → that's deferred to D as the *proper* root if compute-outliving-request becomes a real trigger). |
| **Deep parallelization with agents** | **HELD.** C ran a 6-lane C-development audit + a 4-lane Wα + a 4-probe Wχ; γ ∥ infra waves on disjoint files; W1 ∥ W5, W3 ∥ W4. This D round is itself a 6-lane DA1–DA6 dispatch + a planned 4-agent design wave (`feedback_parallelization.md` honoured). |
| **Archaic diction intentional (don't flag)** | **HELD.** C plan/audit/FINAL prose preserves the register (therein/heretofore/corporeal); `feedback_style_archaic.md` not flagged. This deliverable continues it. |
| **Unicode em dashes (U+2014), never `---`** | **HELD.** DA5-checked: C/FINAL, C.md, CANONICAL-ORDERING, the C audit lanes use `—`. This deliverable uses `—` throughout. `feedback_em_dashes.md` honoured. |
| **KISS / invariant-12** | **HELD.** C rejected per-line: GridFS/MinIO/S3 (β); a webhook framework + new container + registry (α); mutual TLS + ACME (α); the `Palette`/`colorScale` library nobody calls (δ); a background queue for `--reload` (deferred to D); a dual-read storage layer (β) — C/FINAL §3 "KISS rejections that HELD". |
| **No fallbacks / optional-deps / `*_AVAILABLE` flags** | **HELD.** No optional-dep flags; no `try/except` import guards; no dual-read "for safety" layer past the W4 cutover (C/FINAL §8). The δ colour-consume is a *named residual hold*, not a code fallback — honest. `feedback_no_fallbacks.md` honoured. |

**No precept is violated in the C execution.** The CA6 VIOLATION-1 (the frontend legacy-name band) is the precise thing C.W4 discharged — DA5 re-verifies it gone at HEAD. The one residual worth a D glance is the pair of serialization casts in `equation/api.ts` (a *different*, pre-existing, non-identity pattern); it is HELD-with-residual at worst, not a regression. **Net: the C execution is the cleanest precept landing of the lineage — the only standing violation is closed.**

### §2.1 — D-era precept-compliance forward-guard (the binding list for the D-authoring round)

1. **NO new legacy code** — D's deploy/integration (D7) must not reintroduce a dual-read or a name-mirror; the host-ops rewrite must land the converged shape, not a compatibility shim.
2. **The equation `as unknown as` serialization casts** (`equation/api.ts:36,53`) — if D touches the equation-compute path, reshape rather than carry; otherwise leave (pre-existing, non-load-bearing). Do not let them grow.
3. **The `--reload` background-queue** (deferred to D) must be the ROOT fix (compute outliving a request → a real queue) only IF the trigger fires — not a speculative framework (the "library nobody calls" + inv-16 framework-in-disguise guard). KISS default: the one-token watch-narrowing C landed is sufficient absent the trigger.
4. **The colour `Palette`/`colorScale`** stays latent — D must NOT build it absent a real fourier gradient/scale consumer (inv-15 domain-in-app + library-nobody-calls). If D9 (palette cohesion) is pursued, it is value.js's to author, fourier consumes (the inverted δ edge).
5. **Deep parallelization** — the 4-agent design wave (D8) and the 6-lane DA dispatch must run concurrently where disjoint.
6. **Em dashes + archaic diction** — continue; do not flag the register.

---

## §3 — The D-era directive breakdown (11 discrete tracked requests → routed)

The D-development prompt decomposes into eleven discrete directives. Each is given a tracked ID, a disposition, and a route so the D synthesis can guarantee none is dropped. (a)–(e) are *this development round's own work*; (f) is the binding mode; (g)–(k) are the D execution payload routed to named threads/waves.

| ID | Directive (from the D-development prompt) | Disposition | Route / owner |
|---|---|---|---|
| **(a)** | **6-agent deep audit** [this round] | **ADDRESSED-this-round** | DA1–DA6 read-only dispatch (Task #79); this deliverable is DA5 |
| **(b)** | **NO legacy** | **ADDRESSED-as-binding-precept** | At HEAD the prior breach is gone (§2); binding for every D wave; DA6 + §2.1 guard it |
| **(c)** | **Fold deferred items** | **ADDRESSED-this-round → fold to synthesis** | §1.5-D3; the deferred set (the C-named `--reload` queue, multi-replica, the δ consume) enumerated; the D synthesis (Task #82) folds into the D charter §7 |
| **(d)** | **Fold chronic items** | **ADDRESSED-this-round → fold to synthesis** | §1.5-D4; the dominant chronic class is now the C host-ops residuals (C/FINAL §6); a DA inventory lane + the synthesis fold them |
| **(e)** | **Recap ALL prompts** [this lane] | **ADDRESSED-this-deliverable** | §1 herein — 39 directives, 0 outstanding |
| **(f)** | **Tranche-dev-only this phase** | **HELD (binding mode)** | §1.5-D6; no implementation; the only write product is the D charter + this round's audit docs. The deploy/design/Playwright are analysis or routed-to-execution, not done this phase |
| **(g)** | **SSH + integrate + deploy ALL C residuals** | **ROUTED-TO-D** (host-ops execution thread) | The C/FINAL §6 named residuals: (1) shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration (touches 4 sibling repos); (2) prod MongoDB TLS cutover (`scripts/gen-mongo-certs.sh` → `infra/tls.md §9` compose diff → live ping); (3) prod image-blob migration run (`python -m api.scripts.migrate_image_blobs`); (4) precepts-submodule promotion of `infra/{tls.md, blob-backend-dr.md}` + `deploy.md`. Target host `mbabb.fridayinstitute.net:1022`, checkout `/var/www/fourier-analysis`. Coordination record: `docs/tranches/C/coordination/DEPLOY-RECONCILE.md`. **This is the largest D payload.** |
| **(h)** | **4 design agents via frontend-design plugin analyze every screen** | **ROUTED-TO-D** (Wave 2) | Task #80; the `frontend-design:frontend-design` skill is available. Every screen of *both apps* (fourier web + value.js demo). Queued, not yet run. |
| **(i)** | **Cross-repo palette/visualization CRUD cohesion** | **ROUTED-TO-D** (a DA cohesion lane + synthesis) | §1.5-D9 ground truth: value.js has no `src/palette/`; fourier consumes value.js only for easing/timing; "palette cohesion" = the latent inverted-δ edge (`sampleToSVGPath` + held `Palette`/`colorScale`); "visualization CRUD cohesion" = the converged-entity + `api/lib/crud/` surface. A dedicated DA lane assesses cohesion; the synthesis routes any build to value.js (inverted edge), fourier consumes |
| **(j)** | **Audit value.js** | **ROUTED-TO-D** (a DA value.js lane) | §1.5-D10; value.js at H close (v0.10.0, `16129e0`), I seeded-unscoped. A DA value.js lane (mirrors CA3) audits state + the δ readiness + the I-thesis |
| **(k)** | **Playwright both apps across local / dev / prod** | **ROUTED-TO-D** (Wave 3) | Task #81; the Playwright MCP toolset is available (deferred). local + dev + prod for *both apps*. **Depends on (g)** — dev/prod targeting needs the deploy landed first. Queued |

**D-era breakdown subtotal**: 11 directives · 6 ADDRESSED/HELD-this-round (a, b, c, d, e, f) · 5 ROUTED-TO-D (g, h, i, j, k) · 0 OUTSTANDING. Every one of the 11 is either discharged this round or pinned to a named D thread/wave/lane.

### §3.1 — D-thread/wave map (so the synthesis can verify coverage)

- **Thread H (host-ops)** ← (g): the 4 C host-residuals + the SSH+deploy+integrate execution. The single most-blocking D thread (k depends on it for dev/prod).
- **Wave 2 (design)** ← (h): 4 frontend-design agents, every screen, both apps. (Task #80.)
- **Wave 3 (Playwright)** ← (k): both apps, local/dev/prod. Blocked-by Thread H for the dev/prod tiers. (Task #81.)
- **DA cohesion lane** ← (i): cross-repo palette/visualization CRUD cohesion.
- **DA value.js lane** ← (j): the value.js audit.
- **D synthesis** ← (c)+(d): folds deferred + chronic into the D charter §7. (Task #82.)
- **This round (DA1–DA6)** ← (a)+(e): the 6-agent audit + the recap.

---

## §4 — Outstanding count

**Across the ENTIRE lineage (A + B + C + C-execution + D-development = 39 directives): ZERO OUTSTANDING.**

| Class | Count | Notes |
|---|---|---|
| ADDRESSED / HELD | 34 | All A/B/C/C-exec directives + the 6 this-round D directives (a,b,c,d,e,f) |
| ROUTED-TO-D | 5 | The D execution payload (g host-ops, h design, i cohesion, j value.js, k Playwright) — each pinned to a named thread/wave/lane (§3.1) |
| OUTSTANDING (open, unrouted) | **0** | — |

**The zero-outstanding target is MET.** Everything is either done or routed-to-D. The key change since CA6 (which had 27 directives, 0 outstanding but 3 PARTIAL + 1 ROUTED): the lineage grew to 39, **all three PARTIALs closed** (A7 at A/B, **B5/C3 — the one standing NO-legacy-code violation — discharged in C.W4 `f91a656`**, C7 executed to close), and the 5 new ROUTED items are the explicit D-execution payload, not silent deferrals. No prior directive regressed during the C execution.

---

## §5 — Provenance

- Prior ledger (inherited starting point): `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md` (27 directives) + `SYNTHESIS.md §5`.
- C landing ground-truth: `docs/tranches/C/FINAL.md`; HEAD `1e47115`; the C wave commits `fce1808`→`1e47115` (C/FINAL §2 ledger).
- B5/C3 discharge verification (DA5-run greps at `1e47115`): `git grep -nE "snapshot_hash|snapshotHash" web/src` → 0; `FlaggedListResponse` → 0; `as unknown as` in `AdminFlaggedPanel.vue` → 0; `Binary(content)` in `api/services/image_storage.py` → 0; `scripts/deploy.sh` absent; `scripts/deploy-hook.sh` present.
- The 2 residual serialization casts: `web/src/lib/equation/api.ts:36,53` (DA5-verified, pre-existing, non-identity).
- C host-residuals (D7/g payload): `docs/tranches/C/FINAL.md §6`; `docs/tranches/C/coordination/DEPLOY-RECONCILE.md`; `docs/tranches/C/infra/{tls.md, blob-backend-dr.md}`.
- Cross-repo state (D9/i, D10/j): value.js `src/` has no `palette/` (DA5 `ls`); fourier consumes value.js only for easing/timing (`web/src/lib/easings.ts`, `web/package.json:18` `@mkbabb/value.js: file:../../value.js`); value.js HEAD `16129e0` / tag `v0.10.0`; `sampleToSVGPath` ABSENT in value.js `src/` (δ correctly held as named residual); `docs/tranches/C/coordination/COLOUR-LIFT.md`.
- CANONICAL-ORDERING: reconciled to ordering δ (post-C-close, AUTHORITATIVE §9, `:270`); the body §1–§8 retained as historical record.
- fourier-D named carries (C/FINAL §6): the `--reload` background-queue + multi-replica deployment (both "if ever needed").
- Precepts canon: `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md`; memory `feedback_{no_fallbacks,style_archaic,parallelization,em_dashes}.md`; B.md invariants 12/15/16/18/19/20.
- A close `c7cfd82`; B close `fc5b3b0`; C close `1e47115`; value.js H close `16129e0` / v0.10.0.
