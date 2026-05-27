# CA6 — Prompt + precept recap · CANONICAL-ORDERING reconciliation · adversarial C-plan-shape guard

**Lane**: CA6 (fourier-analysis tranche-C DEVELOPMENT phase — planning only; read + ONE deliverable; NO source edits, NO commits).
**Date**: 2026-05-27. **HEAD**: `fc5b3b0` (B CLOSED). **A close**: `c7cfd82` (W6). **value.js**: H CLOSED `16129e0` / `v0.10.0`; I seeded-unscoped; C RETIRED.
**Charter (user, verbatim intent)**: *"Recap ALL of our prompts and requests hitherto and ensure they've been addressed."* — produce the authoritative prompt+precept recap, verify each request's disposition, and adversarially guard the forthcoming C plan shape.

**Convention modelled on**: `~/Programming/value.js/docs/tranches/H/H-PROMPTS.md` (verbatim-prompt clause-decomposition) and `docs/audits/runs/2026-05-26-B-audit-wave-1/L1-prompt-precept-recap.md` (the B-era recap ledger shape).

**Sibling lanes consumed**: CA1 (B plan-vs-reality), CA2 (deferred/chronic inventory), CA3 (value.js state + cohort-reopen verdict), CA4 (colour-domain lift verdict), CA5 (storage+infra audit). This lane synthesises their findings into the prompt-disposition + precept-compliance + guard layers; it does not re-derive their ground-truth.

---

## §0 — Goal criterion and completion criterion (paired)

**Goal.** Give the C-authoring round a single authoritative answer to the user's standing demand — *every prompt across A/B/C-era is enumerated, its disposition verified against a commit or file, and the open residue routed* — and an adversarial guard that pre-empts the expanded C from over-scoping or re-importing the framework/domain anti-patterns the cohort already rejected.

**Completion.** This document carries: a complete prompt ledger (§1) with `verbatim-or-paraphrase | tranche | disposition | evidence`; a per-precept compliance audit of the B landing + planned C (§2) with file:line on every flagged violation; the CANONICAL-ORDERING reconciliation spec (§3) enumerating every stale claim → corrected state; and the adversarial C-plan-shape guard (§4) with the KISS guardrails and the recommended C scope boundary. Both criteria hold at this writing.

---

## §1 — Prompt ledger (A / B / C era — every directive, disposition verified)

Dispositions: **ADDRESSED** (landed + evidenced) · **PARTIAL** (substantially landed, named residual) · **ROUTED-TO-C** (deferred to fourier-C by design, named successor) · **OUTSTANDING** (open, unrouted). A-era rows compress L1's verified ledger (which already proved 17/18 ADDRESSED at A close `c7cfd82`); B-era rows ground-truth against CA1; C-era rows are the current dispatch's own directives.

### §1.1 — A-era (the founding brief through A close `c7cfd82`)

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| A1 | "DEEPLY audit with 6 agents in parallel … NO quick solutions, NO workarounds … fully abrogate fourier-overrides and ios-fixes … bidirectional style audit … Develop out a new tranche hereof, placed in docs, like glass-ui's" | A | **ADDRESSED** | `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`; A authored, opens `3fc960c` (L1 #1) |
| A2 | "Explicate each wave, and plan for the CRUD migration … Potentially split that facility into a separate tranche" | A→B | **ADDRESSED** | waves W0–W6 explicated; CRUD split → tranche B (L1 #2) |
| A3 | "fully spec out B to encompass both fourier analysis and value.js. Harden and refine both that spec, and A, with 6 agents" | A/B | **ADDRESSED** | `B.md` (17 invariants); `docs/audits/runs/2026-05-18-tranche-harden/{h1..h6,SYNTHESIS}.md` (L1 #4) |
| A4 | "Let's further develop the CRUD system … Deploy 6 agents in parallel. SOTA." | B | **ADDRESSED** | `2026-05-19-crud-deepen/SYNTHESIS.md` — 9 decisions + 9 KISS rejections (L1 #5) |
| A5 | "Should our CRUD system be a sub-library … exports the slug facilities — or should we roll our own?" | B | **ADDRESSED** | three-tier verdict; `2026-05-19-utility-extraction/DECISION.md`; SLUG-WORDS (L1 #7) |
| A6 | "Assay the current set of changes … What is the cannonical ordering?" | A/B | **ADDRESSED** | `2026-05-19-refinement-assay/{r1..r6}.md`; `CANONICAL-ORDERING.md` (now STALE — §3) (L1 #8) |
| A7 | "Execution order for both repos? … deploy 4 agents … update the tranche/wave spec to latest precepts/ … submodule pin a59c60d" | A/B | **PARTIAL** (pin mismatch) | pin `a59c60d` non-canonical → substituted `f27627e`; 4-agent P1–P4 rewrote 30+ docs (L1 #9). Residual closed at A/B (spec verified under `f27627e`). |
| A8 | "Look to precepts within gaggle/ or feedback-coder/ … Reconcile and update ALL precepts modules within ALL consumers" | A/B | **ADDRESSED** | submodule pinned `f27627e` constellation-wide; consumers delineated (L1 #10) |
| A9 | "Begin and continue the current tranche … fully orchestrate as team lead … indefatigably … IN TOTALITY. NO quick solutions, NO workarounds." | A | **ADDRESSED** | A.W0→W6 dispatched without intervention; close `c7cfd82` (L1 #11) |
| A10 | "fully abrogate `buttons.css`" (in-band W2.e) | A | **ADDRESSED** | `10e616c` — `.btn-*`/`.basis-pill` → `<Button>`/`<Badge>` (L1 #12) |
| A11 | "backend tested with docker" (W2.g escalation) | A | **ADDRESSED** | `574cd71` + `5fdf6ff` (Mongo init env + dev-compose creds) (L1 #13) |
| A12 | "Fira Code count rerun" (canonical recount) | A | **ADDRESSED** | `04cf719` — 82 hits, 13 adopted, 55 kept-decorative with file:line (L1 #14) |
| A13 | "The paper texture is FAR too extreme … sidebar needs to leverage glass-ui … Dark mode paper is totally broken … Deep inspection and refinement." | A | **ADDRESSED** | W3.5: glass-ui `9cf88e6` (paper opacity `1`→`0.04/0.06`); fourier `2b308f7` (L1 #15) |
| A14 | "glass-ui's version should be the fourier original one … Change and fix items at the ROOT." | A | **ADDRESSED** | glass-ui `9b8de74` + fourier `cb94aa3` (`useSidebarState<T>` at root); fix-at-root held, no fourier override (L1 #15) |
| A15 | "visualization pipeline … properly refined, tested, inspected" | A | **ADDRESSED** | `e0e9dda` — O(n³)→O(n log n) Visvalingam-Whyatt; single-pass epicycles (L1 #16) |

**A-era subtotal**: 15 directives · 14 ADDRESSED · 1 PARTIAL (A7, closed) · 0 OUTSTANDING. (L1's authoritative tally was 18 finer-grained rows, 17 ADDRESSED / 1 PARTIAL; CA6 collapses factual-correction turns and pre-compact duplicates into the substantive 15. No A-era directive is OUTSTANDING.)

### §1.2 — B-era (the B-development brief through B close `fc5b3b0`)

The B-era opening directive is the canonical 6-agent invocation (identical in shape to value.js's H-open and to the C-open below), followed by the execution mandate.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| B1 | "DEEPLY audit with 6 agents … Fold all findings into B … This is NOT implementation. Tranche development only." | B | **ADDRESSED** | `2026-05-26-B-audit-wave-1/L1..L6` + synthesis; B plan augmented; planning-only honoured |
| B2 | "Begin and continue the current tranche … IN TOTALITY … adhere exactly to the plan … agent orchestration and deep parallelization … do not edit items directly unless befitting and fully orchestrate as team lead." | B | **ADDRESSED** | B.W0→W5 dispatched (`b0a85d8`→`fc5b3b0`); orchestrated; close `fc5b3b0`; CA1 confirms 5 LANDED-AS-PLANNED / 3 DIVERGED / 1 PARTIAL, every divergence named-successor'd |
| B3 | (implicit, from B1) "Recap ALL prompts hitherto" | B | **ADDRESSED** | `L1-prompt-precept-recap.md` (the A-close ledger; 17/18 ADDRESSED) |
| B4 | (implicit) "Delineate chronically deferred items, fold into B" | B | **ADDRESSED** | `L6-deferred-chronic.md` chronic ledger; B absorbed the CRUD/identity/colour-lift threads |
| B5 | (implicit, inherited) "NO legacy code; idiomatic/gestalt; fix at ROOT; deep parallelization" | B | **PARTIAL** | Backend clean (CA1 §5: `api/lib/crud/` framework-free, 525 LOC, inv-16 holds adversarially). **Frontend legacy-name residual** — see §2 VIOLATION-1. |

**B-era subtotal**: 5 directives · 4 ADDRESSED · 1 PARTIAL (B5 — the frontend `snapshot_hash` DTO-name band + the `as unknown as` cast). The PARTIAL is the only B-era disposition that is not clean; it routes to C (§1.3 disposition note) or to a web-type sweep (CA2's verdict).

### §1.3 — C-era (the current dispatch — the open directive being discharged now)

The C-era brief is the same 6-agent shape, expanded with the recap + fold + colour mandates. These are directives *being addressed by this very audit round* (the 6-lane CA1–CA6 dispatch + the forthcoming synthesis); their disposition is the planning-phase state.

| # | Verbatim-or-paraphrase (excerpted) | Tranche | Disposition | Evidence |
|---|---|---|---|---|
| C1 | "DEEPLY audit with 6 agents … Devise a path forward." | C | **ADDRESSED** (this round) | CA1–CA6 dispatched read-only under `docs/audits/runs/2026-05-27-C-audit/`; this deliverable + 5 siblings |
| C2 | "Recap ALL prompts … ensure they've been addressed." | C | **ADDRESSED** (this deliverable) | §1 herein — the authoritative ledger; A 14/15 + B 4/5 + C in-flight |
| C3 | "NO legacy code." | C | **ROUTED-TO-C** (binding precept) | The single live legacy-code residual (frontend `snapshot_hash` DTO-name + `as unknown as` cast, CA1 §3.1–3.2) is the only "NO legacy code" violation at HEAD; §4 routes its remediation. Precept itself: BINDING for every C wave (§2). |
| C4 | "Delineate any chronically deferred items … fold into C." | C | **ADDRESSED** (this round) | CA2 — 18-item inventory; 6 CHRONIC; C's stub already owns 3 CHRONIC-LOAD-BEARING (infra, blob, `storage_budget_gb`); the one CHRONIC item C silently dropped (backend `--reload`, CA2 #12 / CA5 §5) is folded into C.W0+W3 |
| C5 | "Delineate any deferred items and fold into C." (the doubled F1 "no deferrals" re-assert) | C | **ADDRESSED** (this round) | CA2 §3 — fold map: thread α (already-in-C), β (new infra-ergonomics folds), γ (conditional colour consume), δ (discharged-at-B, confirm-close) |
| C6 | "In both value.js and herein. What is next for tranche C?" | C / value.js | **ADDRESSED** (this round) | CA3 — value.js-H CLOSED v0.10.0; I seeded-unscoped; cohort-reopen verdict **(a)** — a value.js tranche publishes, fourier-C consumes; the colour lift is value.js's to author |
| C7 | "Fold items into C, expand and augment that tranche and wave set." | C | **PARTIAL → IN-FLIGHT** | The synthesis lane (the round's next step, task #69) authors the expanded C. CA2/CA5 supply the fold targets; §4 herein supplies the scope boundary. **Not yet committed** — this is the planning artefact that precedes it. |

**C-era subtotal**: 7 directives · 5 ADDRESSED-this-round · 1 ROUTED-TO-C (C3 — the legacy residual remediation) · 1 PARTIAL-in-flight (C7 — the C expansion the synthesis lane writes). 0 OUTSTANDING.

### §1.4 — Aggregate tally

| Disposition | A-era | B-era | C-era | Total |
|---|---|---|---|---|
| **ADDRESSED** | 14 | 4 | 5 | **23** |
| **PARTIAL** | 1 (A7, closed) | 1 (B5) | 1 (C7, in-flight) | **3** |
| **ROUTED-TO-C** | 0 | 0 | 1 (C3) | **1** |
| **OUTSTANDING** | 0 | 0 | 0 | **0** |
| **Total** | 15 | 5 | 7 | **27** |

**No directive is OUTSTANDING.** The three PARTIALs are honest: A7 (precepts-pin mismatch) is fully closed at A/B; B5 (frontend legacy-name band) is the load-bearing residual C must clear (the only live "NO legacy code" breach); C7 (the C expansion) is the planning step in flight this very round. The one ROUTED-TO-C item (C3 remediation) is the B5 residual's destination — addressed under the recommended scope boundary in §4.

---

## §2 — Precept compliance audit (B landing + planned C)

Per standing precept. Verdict format: **OBSERVED** / **OBSERVED-with-residual** / **VIOLATION** (file:line). Precepts canon: `TRANCHE-AND-WAVE-SPEC.md`; memory feedback (`feedback_no_fallbacks.md`, `feedback_style_archaic.md`, `feedback_parallelization.md`, `feedback_em_dashes.md`, `project_infra_plan.md`).

| Precept | B landing verdict | Planned C verdict |
|---|---|---|
| **No quick solutions / no workarounds** | **OBSERVED-with-residual.** Backend clean. **One workaround**: `AdminFlaggedPanel.vue:53-60` `as unknown as { items; next_cursor; has_more }` — the SFC force-casts past a stale wrapper type rather than reshaping it (CA1 §3.2). | C must NOT carry the cast forward as "reconciliation"; reshape `FlaggedListResponse` or route to a web-type sweep. |
| **Idiomatic / gestalt approaches** | **OBSERVED.** `api/lib/crud/` is the strongest artefact — framework-free, 525 LOC exact, all 6 helpers genuinely called (CA1 §5; inv-16 holds adversarially). | C's storage relocation is gestalt (filesystem+nginx, atomic cutover, CA5 §2) — no contrivance. |
| **Architectural transpositions for elegance / simplicity / performance** | **OBSERVED.** Five identity schemes → one `visualizations` collection; `snapshots.py` deleted; `gallery.py` → 90-line alias (CA1 §1 W3). | C transposes inline-blob → bounded backend (inv 18); manual SSH → webhook (inv 19). KISS-load-bearing. |
| **NO legacy code** | **VIOLATION** (see VIOLATION-1). The slug is mirrored into a field still named `snapshot_hash` purely so legacy consumers compile. | **BINDING for every C wave.** The remediation (rename `snapshot_hash`→`slug` + ~16 consumers) is the live discharge. |
| **Fix at the ROOT** | **OBSERVED-with-residual.** A14's fix-at-root discipline held in A. In B, the frontend re-point was done at the *leaf* (mirror-the-slug) not the *root* (rename the DTO) — see VIOLATION-1. | C.W4 storage gate fixes at root (drop the inline write, not wrap it). |
| **Deep parallelization** | **OBSERVED.** 6-lane Wα; 4-lane Wχ; W2∥W3 (`feedback_parallelization.md`). | C peaks at 4 agents/wave; W3 overlaps W1/W2. CA1–CA6 is itself a 6-lane dispatch. |
| **Archaic diction intentional** | **OBSERVED.** B plan/audit prose preserves register; `feedback_style_archaic.md` not flagged. | C plan prose continues the register. |
| **Em dashes (U+2014) in LaTeX / docs** | **OBSERVED.** Docs use `—`; `feedback_em_dashes.md`. | continue. |
| **No fallbacks / optional-deps / `*_AVAILABLE` flags** | **OBSERVED-with-residual.** No optional-dep flags; no `try/except` import guards. The orphan-verdict `colors.ts` "fallback" is a *named-residual hold*, not a code fallback — honest. The `as unknown as` cast (VIOLATION-1) is the one defensive-programming smell. | C.W4 brittleness window must NOT leave a dual-read compatibility layer "for safety" (C.md §6 already rejects this as inv-3 legacy) — `feedback_no_fallbacks.md` enforced. |

### VIOLATION-1 — the frontend legacy-name band (NO-legacy-code + fix-at-ROOT + no-workarounds)

The single live precept violation in the B landing. The slug-identity convergence stopped at the API boundary; the frontend was re-pointed by **mirroring the slug into a DTO field still named for the retired 64-char content hash**, so ~16 gallery consumers and a stale type cluster keep compiling. Concrete sites (CA1 §3, re-verified):

- `web/src/stores/gallery.ts:37` — `snapshot_hash: v.slug` (slug mirrored into the legacy slot)
- `web/src/stores/gallery.ts:29` — `return e.snapshot_hash` (key getter reads the slug-slot)
- `web/src/stores/workspace.ts:33` — interface field `snapshot_hash: string`
- `web/src/stores/workspace.ts:364` — `return { slug: data.slug, snapshot_hash: data.slug }`
- `web/src/lib/types.ts:201-206` — `FlaggedListResponse` (retired offset-pagination shape); `:191-199` `FlaggedEntryInfo` carries `snapshot_hash`+`user_slug`; `:88-95` `Snapshot`, `:115-127` `GalleryEntry` (pre-converged names)
- `web/src/lib/api.ts:577,582,694,698` — `listFlaggedVisualizations` typed to the stale wrapper
- `web/src/components/visualization/gallery/AdminFlaggedPanel.vue:53-60` — the `as unknown as` cast past the stale type

**Severity**: bounded + located + honest (recorded in B/FINAL §6 as carries). But it is **the** "NO-legacy-code" breach the user's standing C3 directive targets, and it survived because the B-close grep was scope-limited to `visualizations.py`+`main.py` (CA1 §4 — the grep "is chosen to pass"). **Disposition**: the rename is `web/src/lib` type-soundness work, NOT infra/storage (CA2 #6: wrong thread for C-as-scoped). **Recommendation: it is the strongest candidate for the ONE in-scope exception to C's infra-only boundary** — see §4. If C does not take it, it must be routed to a named web-type sweep with a hard no-silent-orphan check, not left as the standing "reconciliation" framing (which understates a cast-masked type-truth gap as cosmetic).

**No other precept is violated in the B landing.** The conformance-skeleton gap (CA1 §2.1 — 15 skip-skeletons, matrix bound by proxy not cited rows) is a *gate-honesty* weakness (a "gates close on evidence" near-miss, the cited paths SKIP), not a precept violation per se; C should fill or re-point them (CA1 §5 #3).

---

## §3 — CANONICAL-ORDERING reconciliation spec (every stale claim → corrected state)

`docs/tranches/CANONICAL-ORDERING.md` was authored 2026-05-26 by R5 (refinement-assay), **provisional pending R1's cohort verdict**. The verdict has since settled and four tranches have closed. Every load-bearing claim is now stale. The synthesis lane applies this diff; CA6 specs it. CA3 §5 independently reaches the same conclusion (re-author, new ordering γ).

| # | Line(s) | Stale claim (as written) | Corrected state | Authority |
|---|---|---|---|---|
| 1 | §1 row 1, `:26` | fourier-A status **"planning (open 2026-05-18; W0 not yet dispatched)"** | fourier-A **CLOSED 2026-05-26 `c7cfd82`** (W6 close; A.W0–W6 all landed) | `A/FINAL.md`; `git log c7cfd82` |
| 2 | §1 row 2, `:27` | fourier-B status **"planning (provisional; pending Wχ + value.js-C side)"** | fourier-B **CLOSED 2026-05-27 `fc5b3b0`** (W0→W5; `complete_with_misses` against the cohort aim, clean against the fourier aim) | `B/FINAL.md`; `git log fc5b3b0` |
| 3 | §1 row 3, `:28` | fourier-C **"not authored (R6 scoping in flight)"** | fourier-C **AUTHORED** as a stub at `docs/tranches/C/C.md` (infra + image-blob scope) — and **being expanded this round** (the CA1–CA6 + synthesis dispatch folds the B residuals + the colour-lift carry) | `C.md`; this audit run |
| 4 | §1 row 6, `:31` | value.js-C **"planning, possibly orphan (R1 verdict pending)"** | value.js-C **RETIRED** — the orphan verdict is **SETTLED, not pending**; library-`Palette` axis ORPHANED absent user re-mandate | `~/Programming/value.js/docs/tranches/C/FINAL.md`; CA3 §1 |
| 5 | §1 row 11, `:36` | value.js-H **"planning, ratified; awaits user 'Begin'"** | value.js-H **CLOSED 2026-05-26 `16129e0` / v0.10.0** (cascade-correctness; touched zero palette-domain work) | `value.js/H/FINAL.md`; `git describe → v0.10.0`; CA3 §1 |
| 6 | §2 graph, `:48-96` | dependency graph shows fourier-A/B as open with the **HARD `fourier-B.W4 → value.js-C.W1`** cross-repo edge live | The edge is **SEVERED, not delayed** — the W4 fallback was the unconditional primary path (B/FINAL §7). The graph's entire fourier column is now historical. | `B/FINAL.md §7`; CA3 §5 |
| 7 | §3 critical path, `:124-138` | 12-node critical path A.W0 → B.W5 with bottleneck **`value.js-C.W1 — Library Palette`** | The path is **fully traversed** (A + B closed). The bottleneck node never fired (C.W1 was never published). The only live forward node is **fourier-C open**. | `B/FINAL.md`; CA1 |
| 8 | §5, `:170-190` | cohort reconciliation as a **pending contingency** — ordering α (cohort live) vs β (orphan), R1 verdict scheduled | **β fired** (orphan). α is dead. Per CA3, a **NEW ordering γ** is now warranted: the cross-repo edge **INVERTS** — a future value.js tranche (forward-themed I, or later, user-re-mandate-gated) **publishes** the colour-domain surface; fourier-C **consumes** it. The original `fourier→value.js` producer→consumer direction is reversed. | CA3 §3, §5; `B/FINAL.md §6-7` |
| 9 | §6 row `value.js-C` (α/β), `:203-204` | open-gate framed as "(a) value.js-B closed AND (b) fourier-B.W1 ratifies with value.js sign-off" / "Permanently deferred under β" | value.js-C is **RETIRED**; the CRUD-CONTRACT was ratified **fourier-unilaterally** (sign-off NOT required); it persists as a **latent affordance** a future value.js re-engagement consumes without re-research | `B/FINAL.md §6`; CA3 §3 (Q3) |
| 10 | §7 next-action, `:212` | "Dispatch fourier-A.W0 — … Single most-blocking, lowest-cost first move." | **DONE.** A.W0 dispatched + closed; the live next-action is **author/expand fourier-C** (this round). | `A/FINAL.md`; this audit run |
| 11 | header `:5-6` | "**provisional pending R1's cohort verdict**; both orderings (cohort-live, cohort-orphan) are given in §5" | The verdict is **settled (β-orphan, now inverting to γ)**. The document is no longer provisional — it is **stale and must be re-authored** (CA3 §5 #4: supersede with the reopened cross-repo map). | CA3 §5 |

**Reconciliation verdict**: CANONICAL-ORDERING is stale in **every load-bearing row** — all 5 tranche-status cells (4 closures + 1 retirement), the dependency graph, the critical path, the cohort contingency (α/β resolved; γ now needed), the open-gate table, and the next-action. The synthesis lane should either (a) re-author it with ordering γ (the inverted cross-repo edge: value.js-publishes → fourier-C-consumes, user-re-mandate-gated) per CA3 §5, or (b) supersede it with a `COLOUR-LIFT-CONSTELLATION.md` successor to `CRUD-CONSTELLATION.md`. Per CANONICAL-ORDERING's own `§Authority` line ("the only execution-order document spanning both repos"), it cannot simply be deleted — it must be re-authored or explicitly superseded with a forward pointer.

---

## §4 — Adversarial C-plan-shape guard

The expanded C the synthesis lane is about to author threads four candidate theses: **(i)** infra hygiene (webhook CI/CD, TLS, ports — C.md owns); **(ii)** storage relocation (image-blob out of Mongo — C.md owns); **(iii)** the B-residual fold (the `snapshot_hash` legacy band, `FlaggedListResponse`, conformance skeletons, backend `--reload`); **(iv)** the narrow colour lift (CA4: only `sampleToSVGPath` is genuine). This guard probes whether that shape is honest.

### (a) Is multi-thesis C over-scoped → split or thread?

**Probe**: C.md already declares two *intentionally separable* threads (infra hygiene + storage architecture, "share neither files nor risk", C.md §1). Adding (iii) the B-residual fold and (iv) the colour lift would make C a **four-thesis tranche** — and a tranche, per `TRANCHE-AND-WAVE-SPEC.md §Tranche`, "closes a *single* binding question."

**Verdict: THREAD the legitimately-fourier-infra residuals; SPLIT OUT the cross-repo and web-type concerns.** Specifically:
- (i)+(ii) are C's genuine binding question ("retire the three architectural surface drifts", C.md goal) — they THREAD cleanly (C.md already sequences infra-before-storage).
- (iii-infra) the backend `--reload` chronic (CA2 #12, CA5 §5) is a *legitimate fourier-infra* residual C silently dropped — it THREADS into C.W0 (finding) + C.W3 (remedy). This is the one fold that *belongs*.
- (iii-web) the `snapshot_hash` legacy band + `FlaggedListResponse` (VIOLATION-1) is **`web/src/lib` type-soundness, not infra/storage** (CA2 #6). It is a *different thread*. **But** it is the live "NO-legacy-code" breach (C3). **Recommendation: take it as a single explicitly-bounded C.W-residual sub-wave OR route it to a named web-type sweep — not silently dissolve it into the infra waves.** Either is honest; mixing it *into* W1/W2/W4 is not (it would muddy the infra hard gates).
- (iv) the colour lift is **NOT fourier-C's to author** — see (c).

C is over-scoped *only if* it annexes (iv-domain) and (iii-web) without bounding them. With (iv) routed out and (iii-web) bounded as its own sub-wave-or-sweep, C stays a coherent infra+storage+infra-residual tranche.

### (b) Does ANY fold risk framework-in-disguise (inv 16) or domain-in-app (inv 15)?

**inv-16 (framework-in-disguise)**: **NO RISK from the planned C folds.** C's infra+storage work introduces no `BaseCRUDRouter`, no codegen, no coordinator service. The webhook receiver (C.W1) is a deploy artefact, not a shared framework. The storage backend (C.W4, filesystem+nginx per CA5) is a value-helper boundary (`image_bytes` shim), not control inversion. The B `api/lib/crud/` already passed the adversarial inv-16 check (CA1 §4: "genuinely a called-from library, 525 LOC exact"). **Guardrail to hold**: C.W3's janitor audit-log + recovery must not grow a janitor *framework* — it is a `delete_many`→`admin_audit` emission, single-agent, single-file (C.md §5).

**inv-15 (domain-in-app)**: **HIGH RISK — but only if C annexes the colour domain model.** This is the central adversarial finding. CA2 §2 (headline) + CA3 §3 + CA4 §5 all converge: **folding the `Palette`/`colorScale` domain model into fourier-C would re-implement *in the app* the very thing the lift exists to relocate *to the library* — an inv-15 violation, and the degenerate "fourier authors its own palette domain object" branch CANONICAL-ORDERING §5 β.6 explicitly named as the worse path.** The guard's hardest line: **C must NOT build a `Palette` class.** CA4 §5 proves there is no fourier consumer for it (`colors.ts` = 0 domain symbols; `VIZ_COLORS.rainbow` is never sampled as a scale) — building it would also be the "library nobody calls" anti-pattern (premature, KISS-rejected).

### (c) Is the cross-repo colour lift even fourier-C's to author?

**NO.** Three independent lanes agree:
- **CA3 §3 (Q4) verdict (a)**: a *value.js* tranche publishes the library colour-domain surface (`Palette` + `colorScale` + `sampleToSVGPath`); fourier-C *consumes*. The lift's whole premise (inv-15) is "the library owns the colour domain."
- **CA4 §5**: the *only* genuine, immediately-consumed lift is `sampleToSVGPath` (generalising value.js's existing `cubicBezierToSVG` at `src/math.ts:69`), consumed by fourier's `easings.ts:generateCurveSVGPath`. `Palette`/`colorScale` are "specified-but-not-pulled" — defer.
- **CA2 §4**: the domain half "should NOT go in C"; correct successor = a reopened value.js cohort.

**The authoring belongs to value.js** (CA3 §4 sketches I.W1–W5: `sampleToSVGPath` → `colorScale` → `src/palette/` → publish → close). **fourier-C's only role is a CONDITIONAL consumer half**: *if* a value.js tranche republishes the surface during C's window, a provisional fourier-C wave re-points `easings.ts` onto `sampleToSVGPath` (and only then). The cross-repo edge INVERTS (§3 row 8): value.js produces, fourier consumes — the reverse of the original B-era direction. And it is **user-re-mandate-gated** (B/FINAL — "opens only if the user re-mandates the library-`Palette` domain object as a new value.js tranche"). Absent that re-mandate, fourier-C must **NOT** annex the domain model; it re-states the carry in C.§7 with a hard no-silent-orphan check (CA2 §2 headline) so the 3-gate chronic-residual does not evaporate into a fourth indefinite filing.

### §4.1 — KISS guardrails (the binding list for the C-authoring round)

1. **C builds NO `Palette` class and NO `colorScale`** (no fourier consumer; inv-15 domain-in-app violation; "library nobody calls"). — CA4 §5, CA2 §2, CA3 §3.
2. **The colour lift is value.js's to author** (a forward-themed value.js tranche), user-re-mandate-gated. fourier-C carries at most a *conditional consumer-half* wave for `sampleToSVGPath`, contingent on a value.js publish during C's window. — CA3 §3-4.
3. **Default storage backend is filesystem+nginx** (zero new container, zero external dep, atomic cutover); reject MinIO/S3 absent per-line justification (inv-12, challenge P1). — CA5 §2.
4. **No dual-read compatibility layer left "for safety"** past the W4 cutover — that is the inv-3 legacy code C.md §6 already names invalid. — C.md §6, `feedback_no_fallbacks.md`.
5. **The `snapshot_hash` legacy band must NOT be carried as "reconciliation"** (it is a cast-masked type-truth breach, the live NO-legacy-code violation) — discharge it as a bounded sub-wave OR a named web-type sweep with a no-silent-orphan check; do not dissolve it into the infra waves. — VIOLATION-1, CA1 §3-5.
6. **Re-baseline infra against live `docker-compose*.yml`, not the 60-day-old `project_infra_plan.md`** (the memory cites stale port `8091`; the deploy.sh health-check is a dead-port bug). — CA5 §3.1, CA2 §2.
7. **Provision Mongo in CI** or the migration count-parity proof (both B's and C.W4's) silently skips and is vacuous. — CA1 §2.2, CA5 §2.2.
8. **Hold inv-16 against the janitor + webhook work** — no janitor framework, no shared deploy framework; value-helper boundaries only. — §4(b).

### §4.2 — Recommended C scope boundary

**fourier-C STAYS fourier-only: infra hygiene + storage relocation + the legitimately-fourier-infra residual (backend `--reload`), PLUS one explicitly-bounded web-type discharge of the `snapshot_hash` legacy band (the live NO-legacy-code breach).**

The colour lift is **NOT in fourier-C** as a domain authoring; it is a **value.js-tranche deliverable** (forward-themed, user-re-mandate-gated) with a **conditional fourier-C consume-only wave** for `sampleToSVGPath` that fires only if value.js republishes during C's window. The cross-repo edge inverts (value.js publishes → fourier consumes) and is recorded in the re-authored CANONICAL-ORDERING (ordering γ) or a `COLOUR-LIFT-CONSTELLATION.md` successor.

Stated as the one-line boundary the user's recap demands: **C = {webhook CI/CD, MongoDB TLS, port standardization, janitor audit+recovery, `--reload` fix, image-blob relocation, `snapshot_hash`-band rename} — all fourier-only; the colour-domain lift is value.js's (re-mandate-gated), with fourier-C holding only a conditional `sampleToSVGPath`-consume wave.**

---

## §5 — Provenance

- Prompt corpus: `L1-prompt-precept-recap.md` (A-era verbatim, transcript lines); B/C-era open directives (this dispatch's framing + the canonical 6-agent invocation shape, matched against `H-PROMPTS.md §1`).
- B landing ground-truth: CA1 (`CA1-b-plan-reality.md`), `B/FINAL.md`, HEAD `fc5b3b0`.
- Deferred/chronic inventory: CA2 (`CA2-deferred-chronic-inventory.md`).
- value.js state + cohort verdict: CA3 (`CA3-valuejs-state-cohort-reopen.md`); `value.js/docs/tranches/{H/FINAL.md, C/FINAL.md, H/I-SEED.md}`; tag `v0.10.0`; HEAD `16129e0`.
- Colour-lift verdict: CA4 (`CA4-colour-domain-lift.md`).
- Storage+infra ground-truth: CA5 (`CA5-storage-infra-audit.md`).
- Precepts: `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md`; `~/.claude/projects/-Users-mkbabb-Programming-fourier-analysis/memory/{feedback_no_fallbacks,feedback_style_archaic,feedback_parallelization,feedback_em_dashes,project_infra_plan}.md`.
- Stale ordering: `docs/tranches/CANONICAL-ORDERING.md` (provisional, R5, 2026-05-26).
- A close `c7cfd82`; B close `fc5b3b0`; B invariants 15/16 verbatim at `B.md:41,43`.
