# CANONICAL-ORDERING — cross-tranche, cross-repo execution order across fourier-analysis and @mkbabb/value.js

**Scope**: every tranche currently legible in `fourier-analysis` (the demo + paper + companion site) and `@mkbabb/value.js` (the colour-authority library + palette-api + demo), their hard/soft dependencies, the critical path through them, and the next action.
**Authored**: 2026-05-26 by R5 (refinement-assay cohort).
**Reconciles with**: R1's cohort-orphan assay (the verdict on whether value.js-C — the cohort-peer tranche to fourier-B — is effectively orphaned) and R6's fourier-C scoping (the open-design scoping for fourier-analysis's infra + image-blob-out-of-Mongo tranche); parallel-dispatched. Both R1 and R6 outputs were not yet present at `docs/audits/runs/2026-05-19-refinement-assay/` at this document's authoring. This document is **provisional pending R1's cohort verdict**; both orderings (cohort-live, cohort-orphan) are given in §5.
**Authority**: this is the only execution-order document spanning both repos. Per-tranche `*.md` and `coordination/CRUD-CONSTELLATION.md` (the cohort coordination doc bound to fourier-B's CRUD-and-identity-convergence question) remain the authority for individual dependency claims.

> **⚠ SUPERSEDED — see §14 (Ordering ι, 2026-05-28, constellation-wide execution order).** §1–§13 reconciled fourier-A→F + value.js-A→I. Now the user asks the cross-repo execution order across ALL developed tranches (fourier-F + value.js + glass-ui + speedtest + the deploy repo). **§14 is the authoritative current ordering;** §1–§13 are the historical record. Headline: glass-ui's active `g.w5` release wave is the upstream publisher chokepoint (blocks speedtest-AQ); fourier-F is glass-ui-INDEPENDENT and runs in parallel as the live-bug + deploy-spine critical path.

---

## §0 — Goal criterion and completion criterion (paired) for the ordering document itself

Per the project's tranche-and-wave discipline (→ `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion + completion criterion (paired)"`), every unit of decomposition carries both an aim and an evidence-bearing close-condition. CANONICAL-ORDERING is itself such a unit — an execution-order substrate document.

**Goal criterion.** Give a fresh reader the cross-repo execution map: which tranche depends on which, the critical path through them, where parallelism is possible, and the single most-blocking next move. The aim is an unambiguous ordering — every open tranche has a clear "what opens next" answer that resolves to a specific authoritative document.

**Completion criterion.** All four of (a) the §1 inventory cites a status authority per row; (b) the §2 dependency graph is sourced (timing edges to `CRUD-CONSTELLATION.md`; within-repo edges to the per-tranche plan); (c) §3 enumerates the critical path's node count and bottleneck explicitly; (d) §7 names the next action with citation. The document is provisional-but-complete as long as the R1 / R6 assays are noted as pending in §5 with both contingent orderings stated.

---

## §1 — Tranche inventory

The inventory below names each tranche by what it IS (its one-line title / thesis), not just its enumerated letter. A tranche, per `glossary/meta-terms.md §"Tranche"`, is the unit of project decomposition that closes a binding question — each carries an uppercase letter and lives at `docs/tranches/{LETTER}/`.

| Repo | Tranche | Status | Title / thesis (one line) | Authority |
|---|---|---|---|---|
| fourier-analysis | **A — Cohort attribution, style abrogation, admin parity** | **planning** (open 2026-05-18; W0 not yet dispatched) | fourier-analysis's first own-letter tranche — absorbs the glass-ui migration cohort, retires the override stylesheets, lifts admin to parity with the user surface | `docs/tranches/A/A.md` |
| fourier-analysis | **B — CRUD convergence ⇄ value.js (research-first)** | **planning** (provisional; pending Wχ + value.js-C side) | the cross-repo CRUD/identity convergence tranche — pairs with value.js-C, opens after A closes | `docs/tranches/B/B.md` |
| fourier-analysis | **C — Infra + image-blob-out-of-Mongo** | **not authored** (R6 scoping in flight) | per `A.md §8` deferral and `B.md §7` deferral — absorbs the image-blob storage redesign and the infrastructure residuals A and B park forward | `A.md §8`, `B.md §7` |
| value.js | **A — Consumer un-break + design-resilience audit** | **closed** 2026-05-19 (closed inside B.W0) | value.js's first own-letter tranche — un-break the consumer, audit the library against the design-resilience criterion | `docs/tranches/A/FINAL.md` |
| value.js | **B — Close A, simplify, complete the AND** | **closed** 2026-05-19 (`6d1cb40` … merged) | the close-A-and-simplify tranche; not a CRUD tranche — its thesis is orthogonal to the cohort | `docs/tranches/B/FINAL.md` |
| value.js | **C — Palette CRUD facility (peer to fourier-B)** | **planning, possibly orphan** (R1 verdict pending) | the cohort peer to fourier-B authored 2026-05-18; never opened across the entire D→E→F→G→H execution window | `docs/tranches/C/C.md` |
| value.js | **D — Contract-v2, backend refactor, library hardening** | **closed** 2026-05-20 — `v0.6.0` | the v0.6.0 release tranche — service+repository pattern, ApiError hierarchy, contract-v2 adoption | `docs/tranches/D/FINAL.md` |
| value.js | **E — Architectural transpositions, api/ pipeline parity** | **closed** 2026-05-20 — `v0.7.0` | the architectural-transposition tranche; legacy-clean, WhitePointColor lift, DIRECT_PATHS, nameParser, type-tidy | `docs/tranches/E/FINAL.md` |
| value.js | **F — "No deferrals" + post-W12 substrate hygiene** | **closed** 2026-05-21 — `v0.8.0` | the zero-deferral tranche — clears the carry-forward backlog, hardens substrate hygiene | `docs/tranches/F/FINAL.md` |
| value.js | **G — Type-system completion + decomposition + invariant codification** | **closed** 2026-05-22 — `v0.9.0` | the type-system-completion tranche — color/utils.ts decomposition into 9 conversion modules, invariant codification | `docs/tranches/G/FINAL.md` |
| value.js | **H — Cascade-correctness + type-system II + demo decomposition** | **planning, ratified; awaits user "Begin"** | the cascade-correctness tranche; polish-grade, rejects new architectural axes | `docs/tranches/H/H.md`, `H/PROGRESS.md §H.W0 close` |

**Cohort-peer note**: value.js-C (the **Palette CRUD facility** tranche) is the *peer* to fourier-B (the **CRUD convergence** tranche) per the metadata blocks in `B.md §metadata` and `C.md §metadata`. The pairing skipped value.js-B because value.js-B was already in flight with a non-CRUD thesis (the close-A-and-simplify tranche). The pairing therefore is **fourier-B ⇄ value.js-C**, not B⇄B.

**Orphan risk**: value.js subsequently authored, executed, and closed D, E, F, G — all *after* C was authored 2026-05-18 — without C ever opening. By value.js's own close lineage (`C.md §metadata`: "close lineage A → B → C is canonical"), C should have opened before D. R1's assay determines whether C is therefore effectively orphaned. See §5.

---

## §2 — Dependency graph

The graph reads top-to-bottom in time order. Arrows are HARD (downstream cannot open without upstream) unless annotated. The cross-repo edge is the single hard cross-repo dependency named in `CRUD-CONSTELLATION.md §timing`.

```
                     value.js                                  fourier-analysis
                     ────────                                  ────────────────

   A (closed)                                                  A (planning)
     │                                                            │
     │ (close lands in B.W0)                                      │
     ▼                                                            ▼
   B (closed) ─────────────┐                                   A.W0 (challenge + brittleness)
     │                     │ canonical-lineage gap:               │
     │                     │ C should have opened here            ▼
     ▼                     │                                   A.W1 … A.W5
   D (closed v0.6.0)       │                                      │
     │                     │                                      ▼
     ▼                     │                                   A.W6 close ──────────┐
   E (closed v0.7.0)       │                                                        │
     │                     │                                                        │
     ▼                     │                                                        ▼
   F (closed v0.8.0)       │                                                     fourier-B.W0
     │                     │                                                        │
     ▼                     │                                                        ▼
   G (closed v0.9.0)       │                                                     fourier-B.Wα (research, 6 lanes)
     │                     │                                                        │
     ▼                     │                                                        ▼
   H (planning;            │                                                     fourier-B.Wχ (challenge, 3 probes)
   "Begin" pending) ──────╮│                                                        │
                          ││                                                        ▼
                          ▼▼                                                     fourier-B.W1 (CRUD-CONTRACT.md
                       value.js-C.W0 ◄──── HARD: requires both ──────────────────  ratified, value.js sign-off)
                       (open gate)         (a) value.js-B closed ✓                  │
                          │                (b) fourier-B.W1 ratified                │ parallel:
                          ▼                                                         ▼
                       value.js-C.W1 (library Palette) ◄── soft: cite contract ──── fourier-B.W3 (visualization
                          │                                                          entity + api/lib/crud/)
                          │ publish npm version bump                                 │
                          ▼                                                          ▼
                       value.js-C.W2 (palette-api + ─── parallel ──┐               fourier-B.W4 ◄── HARD: requires
                       api/src/crud/)                              │                value.js-C.W1 published
                          ▼                                        ▼                  │ (W4 fallback: defer the
                       value.js-C.W3 (demo wiring) ─── parallel ──┘                   colors.ts gut if missing —
                          │                                                           per B.md §7, "W4 fallback")
                          ▼                                                          ▼
                       value.js-C.W4 close ◄────── cite cohort discharged ────── fourier-B.W5 close
                                                                                    │
                                                                                    ▼
                                                                                 fourier-C (infra +
                                                                                 image-blob redesign) —
                                                                                 R6 scoping in flight
```

Source: `coordination/CRUD-CONSTELLATION.md §timing` for the cross-repo edges; `fourier-A.md §3 +§8` and `fourier-B.md §3 + §7` for the within-repo edges; `value.js-C.md §metadata + §3` for the C open-gate.

The fourier-A waves named on the critical path read (per `A.md §3` wave table):

- **fourier-A.W0 — Open · challenge · hygiene · numerical-test repair** (3 serial agents);
- **fourier-A.W1 — Attribute & land the glass-ui migration cohort** (3 parallel);
- **fourier-A.W2 — Override-stylesheet abrogation** (4 parallel);
- **fourier-A.W3 — Interactive-primitive adoption** (4 parallel);
- **fourier-A.W4 — Scaling, KISS & correctness pass** (3 parallel);
- **fourier-A.W5 — Admin parity & functionality close** (4 parallel);
- **fourier-A.W6 — Close** (1 serial).

The fourier-B waves named on the critical path read (per `B.md §3`):

- **fourier-B.W0 — Open · research dispatch**;
- **fourier-B.Wα — Research wave (6 read-only lanes)** — the joint research wave that runs as a six-lane pre-execution audit (→ `glossary/meta-terms.md §"Pre-execution audit"`);
- **fourier-B.Wχ — Challenge wave (3 probes)** — the adversarial probe wave whose challenge tests the cohort answer for framework-disguise risk, migration data preservation, and cross-repo timing honesty;
- **fourier-B.W1 — Shared CRUD contract**;
- **fourier-B.W3 — fourier `visualization` entity + migration + `api/lib/crud/` utility module landing**;
- **fourier-B.W4 — fourier convergence wiring** (the wave whose `colors.ts` gut hard-depends on value.js-C.W1's published `Palette`);
- **fourier-B.W5 — Close**.

---

## §3 — Critical path

The longest sequential chain through *open* work, end-to-end:

```
fourier-A.W0  →  A.W1  →  A.W2  →  A.W3  →  A.W5  →  A.W6 close
              →  fourier-B.W0  →  Wα  →  Wχ  →  B.W1 (contract ratified)
              →  value.js-C.W0 (open gate)  →  C.W1 (library Palette published)
              →  fourier-B.W4 (consumes published Palette)  →  B.W5 close
              →  (fourier-C open, if scoped by then)
```

**12 sequential nodes from A.W0 → B.W5 close** (fourier-A: 6 of 7 waves on the critical path; fourier-B: 5 of 7 wave-slots; value.js-C: 2 nodes). value.js-H (the cascade-correctness tranche), value.js-C.W2 (the palette-api alignment wave), value.js-C.W3 (the demo-wiring wave), fourier-A.W4 (the scaling-and-correctness pass), and fourier-B.W3 (the visualization-entity wave) are *not* on the critical path — they are parallel branches.

**The bottleneck node**: `value.js-C.W1 — Library Palette` (library `Palette` published with npm version bump). This is the single hard cross-repo dependency (per `CRUD-CONSTELLATION.md §timing`, last line). `fourier-B.W4 — fourier convergence wiring` cannot complete its `colors.ts` gut without it; a fallback exists (`fourier-B.md §7`: "B.W4 lands everything *except* the `colors.ts` gut-onto-value.js"), but the fallback then defers the gut to a successor wave.

**Why fourier-A blocks everything in fourier-land**: per `fourier-B.md §metadata`: "B opens only after A closes." There is no fast path around it.

---

## §4 — Parallelisable points

### Within fourier-A (per `A.md §3` last paragraph)

- **fourier-A.W4 — Scaling, KISS & correctness pass** is independent of A.W2/A.W3 and may overlap if agent budget allows.
- **A.W1 (the cohort-attribution wave), A.W2 (the override-stylesheet abrogation), A.W3 (the interactive-primitive adoption)** are sequential — W2 must precede W3 because the button system consolidates first and W5 reuses W3's primitive vocabulary.
- Peak parallelism within a wave: 4 agents (W2, W3, W5 — per `A.md §3` agents column).

### Within fourier-B (per `B.md §3`)

- **fourier-B.W3 — visualization entity + migration** and **fourier-B.W1 — Shared CRUD contract** do not hard-depend on value.js and proceed concurrently as soon as fourier-B's challenge closes (`CRUD-CONSTELLATION.md §timing`: "fourier-side waves that do *not* hard-block on value.js … proceed as soon as fourier-B's challenge closes").
- **fourier-B.W3 and value.js-C.W1 — library Palette** are independent at file bounds and run concurrently (per `CRUD-CONSTELLATION.md §timing` diagram, "parallel" annotation).

### Within value.js-C (per `C.md §3` last paragraph)

- **value.js-C.W2 — palette-api + `api/src/crud/`** and **value.js-C.W3 — demo wiring** are independent at file bounds and may run concurrently.

### Cross-repo, simultaneously dispatchable today

- **value.js-H (cascade-correctness)** and **fourier-A (cohort-attribution + style abrogation + admin parity)** are entirely independent. value.js-H awaits user "Begin" authorization (per `value.js/H/PROGRESS.md §91`); fourier-A awaits W0 dispatch. **Both can run in parallel** with no shared write-bounds.

### Agent-budget-wise

Hard ceiling 10 agents/wave per `A.md §3`; fourier-A peaks at 4, fourier-B at 4, value.js-C at 3. Two repos × ~4 agents = ~8 concurrent agents at peak when fourier-A is mid-execution and value.js-H runs in parallel.

---

## §5 — Cohort reconciliation contingency

R1's refinement assay is scheduled to determine whether **value.js-C (the Palette CRUD facility tranche)** is effectively orphaned (authored 2026-05-18, never opened, while value.js shipped D / E / F / G across 4 days). Two orderings follow.

### Ordering α — cohort live (R1 verdict: value.js-C still real)

Critical path is §3 above unchanged. `fourier-B.W4 — fourier convergence wiring` consumes `value.js-C.W1 — library Palette`'s published `Palette`. value.js-C opens after value.js-H closes (or runs parallel; H's `coordination/Q.md` confirms zero cross-repo writes — per `H.md §F3 inheritance`, "H default: ZERO cross-repo writes"). The full lineage A → B → C → D → E → F → G → H is honored *retroactively* by opening C between H close and any future I.

### Ordering β — cohort orphan (R1 verdict: value.js-C dead)

If C is judged orphaned (i.e. the user has implicitly chosen *not* to converge palette CRUD with fourier, and the value.js side has accreted post-D facility shape that contradicts the C plan), then:

1. **`fourier-B` thesis narrows**: the §1 thesis line 2 ("the colour/palette domain model moves to where it belongs — value.js, the library") is **scoped out**. fourier-B (the CRUD convergence tranche) becomes a pure *internal* CRUD convergence — the `visualization` entity, the migration, the admin re-point — without the cross-repo `colors.ts` gut.
2. **`fourier-B.W2 — value.js palette facility (cross-repo tracking row)`** is deleted; it was already a tracking-row not an executable wave (the work would have landed in value.js-C).
3. **`fourier-B.W4 — fourier convergence wiring` collapses** to the admin/store re-point only; the `colors.ts` gut is reclassified as `fourier-tranche-C` scope or as carry to a future tranche.
4. **Critical path shortens by 2 nodes**: value.js-C.W0 + C.W1 drop out. New critical path is 10 sequential nodes (fourier-A 6 + fourier-B 4 [W0, Wα, Wχ, W1+W3+W4 collapsed]).
5. **The contract** (`CRUD-CONTRACT.md` per `CRUD-CONSTELLATION.md §111`) is still ratified at fourier-B.W1 *as a one-sided design document* — fourier honors it; value.js's sign-off becomes optional; `coordination/CRUD-CONSTELLATION.md` is rewritten to record the orphan disposition.
6. **fourier-tranche-C** (the infra + image-blob redesign tranche per R6's scoping) absorbs any colour-domain-relocation residual.

R5's recommendation for β: rewrite `fourier-B.md §1 thesis bullets 1-3` to drop bullets 2 and 3 entirely, keeping only bullet 1 (the identity-model collapse). The CRUD contract becomes a fourier-internal coherence document, not a cross-repo treaty.

---

## §6 — Per-tranche dispatch precondition

Each row names the open-gate (the evidence-bearing condition the orchestrator checks before dispatching the tranche's first wave) in one sentence.

| Tranche | One-sentence open-gate |
|---|---|
| **fourier-A — Cohort attribution, style abrogation, admin parity** | None blocking — user authorization to begin W0; the brittleness window in `A.md §9` (the bounded span inside which the tree is intentionally broken; → `glossary/meta-terms.md §"Brittleness window"`) is declared at open, not a blocker. |
| **fourier-B — CRUD convergence ⇄ value.js** | A.W6 close ceremony complete with `FINAL.md` cited (`B.md §metadata`: "B opens only after A closes"). |
| **fourier-C — Infra + image-blob redesign** (per R6 scoping) | B.W5 close + R6 scoping document landed; absorbs the image-blob deferral (`B.md §7`) and infra residuals (`A.md §8`). |
| **value.js-A** | (closed) — n/a. |
| **value.js-B** | (closed) — n/a; closed A inside B.W0. |
| **value.js-C — Palette CRUD facility** (under ordering α — cohort live) | (a) value.js-B closed ✓ already; AND (b) `fourier-B.W1 — Shared CRUD contract` ratifies `CRUD-CONTRACT.md` with value.js sign-off (per `value.js/C/C.md §metadata`, H5-corrected open-gate). |
| **value.js-C — Palette CRUD facility** (under ordering β — orphan) | Permanently deferred — close-out PROGRESS entry under "orphan disposition" citing R1. |
| **value.js-D..G** | (closed) — n/a. |
| **value.js-H — Cascade-correctness + type-system II + demo decomposition** | User issues "Begin and continue the current tranche…" execution authorization (per `value.js/H/PROGRESS.md §91`, "**H.W1 awaits explicit user execution authorization**"). |

---

## §7 — The next action

**Dispatch `fourier-A.W0 — Open · challenge · hygiene · numerical-test repair`.** Single most-blocking, lowest-cost first move.

Rationale (citing sources):

- value.js side is either closed (A-G) or awaiting user "Begin" (H); not blocking on R5 or anyone else.
- fourier-A is currently the *root* of every fourier-side critical-path node (`A.md §metadata`: "fourier-analysis's first own-letter tranche"; `B.md §metadata`: "B opens only after A closes").
- A.W0 — the open-and-hygiene wave — is small (3 serial agents per `A.md §3`), specified, and its gates are ready: `vue-tsc -b --force` green; the 2 pre-existing `test_bases.py` numerical failures fixed or formally re-scoped per `A.md §9`; submodule wiring committed; `tsbuildinfo` untracked.
- The orphan-cohort verdict (R1's assay on whether value.js-C is effectively orphaned) does **not** affect A.W0 — A's W0…W6 are entirely intra-repo per `A.md §5`. A can dispatch without waiting on R1 or R6.
- value.js-H (the cascade-correctness tranche) can begin in parallel as a separate user authorization; the two tranches share no write bounds. If user agent-budget supports it, dispatching both at once is the maximum-parallel move (per `feedback_parallelization.md`).

The next-action-after-next: once A.W0 closes green, **dispatch A.W1 — Attribute & land the glass-ui migration cohort in parallel with the R1/R6 assay reconciliation**. The R1 verdict only matters when fourier-B opens (~A.W6 close), giving the assay full A-execution-window to land.

---

## §8 — Ordering γ (2026-05-27 reconciliation — AUTHORITATIVE)

The events §1–§7 treated as pending have RESOLVED. This section is the current cross-repo ordering, reconciled by the C-development audit (`docs/audits/runs/2026-05-27-C-audit/{SYNTHESIS,CA3,CA6}.md`). It supersedes the contingent §5 orderings α/β.

### §8.1 — Reconciled tranche inventory

| Repo | Tranche | Status (2026-05-27) | Note |
|---|---|---|---|
| fourier | **A** — cohort attribution, style abrogation, admin parity | **CLOSED** `c7cfd82` | executed W0–W6 |
| fourier | **B** — CRUD/identity convergence | **CLOSED** `fc5b3b0` | executed W0 → Wα → Wχ → W1 → W2∥W3 → W4 → W5; `complete_with_misses` (cohort half orphaned), clean against the fourier aim |
| fourier | **C** — infra + storage + B-residual discharge | **AUTHORED + EXPANDED** (this round); awaits user C.W0 authorization | four threads α/β/γ/δ per `C.md` |
| value.js | **A–G** | **CLOSED** (A,B inside B.W0; D v0.6, E v0.7, F v0.8, G v0.9) | — |
| value.js | **C** — palette CRUD facility (cohort peer to fourier-B) | **RETIRED** 2026-05-26 | ordering β fired; `value.js/docs/tranches/C/FINAL.md` |
| value.js | **H** — cascade-correctness | **CLOSED** v0.10.0 `16129e0` | polish-grade; zero palette-domain work |
| value.js | **I** — *seeded, thesis open* | **SEEDED** (`value.js/docs/tranches/H/I-SEED.md`); thesis undeclared | candidate host for the narrow `sampleToSVGPath` lift iff forward-themed + user-mandated |

### §8.2 — The cohort verdict (β fired)

Ordering β (cohort-orphan) is the realized history: value.js-C never opened; the repo raced D→E→F→G→H; value.js-C is formally RETIRED. fourier-B accordingly closed with its identity-convergence thesis landed fourier-internally and the colour-domain bullet held as a residual. The `CRUD-CONTRACT.md` ratified fourier-unilaterally at B.W1 (`4626d4c`) stands as a **latent affordance** a future value.js re-engagement consumes.

### §8.3 — The inverted edge (the only live cross-repo dependency)

The original hard edge `fourier-B.W4 → value.js-C.W1` is **severed**. The sole remaining cross-repo edge **inverts** and is latent + conditional:

```
value.js-<I-or-dedicated>.W_x  ──(publishes sampleToSVGPath in src/math.ts)──▶  fourier-C.W4-δ (consumes)
        [open thesis; user-re-mandate-gated]                         [conditional; holds as residual if absent]
```

Per `CA4`, this is the *only* genuine colour-lift deliverable (the `Palette`/`colorScale` domain model is held latent — premature, no consumer). `coordination/` on the fourier side: `docs/tranches/C/coordination/COLOUR-LIFT.md`.

### §8.4 — Current critical path + next action

fourier-C is the sole open fourier tranche; its threads are fourier-internal except the conditional δ. value.js has no open executing tranche (H closed; I seeded but thesis-undeclared, awaiting user mandate). **The two repos are now decoupled** — neither blocks the other.

- **fourier next action**: await user authorization for **C.W0** (open · research dispatch · baseline audit). C's research-first gate (W0 → Wα → Wχ) governs before any implementation wave; thread γ (W4, the slug-identity discharge) is independent and parallel-capable.
- **value.js next action**: await user mandate for **value.js-I** (thesis open). If the user wants the colour lift, I is forward-themed as the narrow `sampleToSVGPath` publish; otherwise the lift stays the fourier-C residual.

No fast path couples them; the colour-lift edge is the only seam, and it is conditional on both sides.

---

## §9 — Ordering δ (2026-05-27 post-C-close — AUTHORITATIVE)

fourier-C has CLOSED (`docs/tranches/C/FINAL.md`). This supersedes §8 (ordering γ, which treated fourier-C as authored-awaiting-authorization).

### §9.1 — Reconciled tranche inventory

| Repo | Tranche | Status (2026-05-27) | Note |
|---|---|---|---|
| fourier | **A** — cohort attribution, style abrogation, admin parity | **CLOSED** `c7cfd82` | executed W0–W6 |
| fourier | **B** — CRUD/identity convergence | **CLOSED** `fc5b3b0` | `complete_with_misses` (cohort half orphaned), clean against the fourier aim |
| fourier | **C** — infra + storage + B-residual discharge | **CLOSED** (this round) | executed W0 → Wα → Wχ(+harden) → W3∥W4 → W1∥W5 → W2 → W6; `complete_with_host_residuals` — repo-landable aim clean; host-coupled acts named (§9.3) |
| value.js | **A–G** | **CLOSED** | — |
| value.js | **C** — palette CRUD (cohort peer to fourier-B) | **RETIRED** 2026-05-26 | ordering β fired |
| value.js | **H** — cascade-correctness | **CLOSED** v0.10.0 `16129e0` | zero palette-domain work |
| value.js | **I** — *seeded, thesis open* | **SEEDED**; thesis undeclared | candidate host for the narrow `sampleToSVGPath` lift iff forward-themed + user-mandated |

### §9.2 — The inverted edge (unchanged — still the only live cross-repo dependency)

```
value.js-<I-or-dedicated>.W_x  ──(publishes sampleToSVGPath in src/math.ts)──▶  fourier-C-successor (consumes)
        [open thesis; user-re-mandate-gated]                         [latent; held as a named residual at C close]
```

fourier-C closed with the δ-consume as a **named residual** — value.js v0.10.0 does not export `sampleToSVGPath`, so `easings.ts` was left byte-identical to HEAD. The edge persists into a fourier successor, fired iff value.js publishes. `docs/tranches/C/coordination/COLOUR-LIFT.md` records the ask.

### §9.3 — fourier-C's host-coupled residuals (the close was `complete_with_host_residuals`)

Everything repo-landable landed + proven; these outward-facing host acts carry runnable successors (`C/FINAL.md §6`):
- the shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration (touches 4 sibling repos) — `coordination/DEPLOY-RECONCILE.md`;
- the prod MongoDB TLS cutover (run `gen-mongo-certs.sh` → apply the `infra/tls.md §9` diff → deploy → ping);
- the prod image-blob migration run (`python -m api.scripts.migrate_image_blobs`);
- the precepts-submodule promotion of the staged `infra/{tls.md, blob-backend-dr.md}` + the deploy precept.

### §9.4 — Current critical path + next action

**No fourier tranche is open.** A/B/C are closed; the repo carries the host-coupled residuals (§9.3) as named successors and the latent δ edge.

- **fourier next action**: none required to close C. A fourier-D opens only if/when a named residual is promoted to a tranche (multi-replica; the `--reload` background queue; a colour-scale consumer) or new work is mandated. The host-ops residuals are operational steps, not tranche work.
- **value.js next action**: await user mandate for **value.js-I** (thesis open). If the user wants the colour lift, I is forward-themed as the narrow `sampleToSVGPath` publish; otherwise the lift stays the fourier residual.

The two repos remain decoupled; the colour-lift edge is the only seam, conditional on both sides.

---

## §10 — Ordering ε (2026-05-27 post-D-authoring — AUTHORITATIVE)

The 10-lane D-development audit (`docs/audits/runs/2026-05-27-D-audit/SYNTHESIS.md`) supersedes §9 (which assumed A/B/C were *deployed* and the cross-repo edge was the latent colour seam). Two facts overturn that:

1. **None of A/B/C is in production.** Prod fourier serves pre-A `8818ae5` (2026-03-28) — every prior tranche "closed" against a tree the world never saw. fourier-D's spine is the first real deploy (prod SSH now available).
2. **The cross-repo edge broadened.** It is no longer one latent colour function — value.js ships a live, deployed `palette-api` v2.0.0, and fourier's `visualization.palette_slug` is a live slug-FK into its palette noun. Cohesion is concrete: `CRUD-CONTRACT v2.0.0` + a value.js alignment tranche.

### §10.1 — Reconciled tranche inventory

| Repo | Tranche | Status (2026-05-27) | Note |
|---|---|---|---|
| fourier | **A / B / C** | **CLOSED** (`c7cfd82`, `fc5b3b0`, C-close) | but **NOT deployed** — prod runs pre-A `8818ae5` |
| fourier | **D** — prod-deploy + design + backend-symmetry + CRUD cohesion | **AUTHORED** (this round); awaits user D.W0 authorization | five threads α/β/γ/δ/ε per `docs/tranches/D/D.md` |
| value.js | **A–H** | **CLOSED** (H = v0.10.0 `16129e0`) | the npm library `@mkbabb/value.js` |
| value.js | **palette-api** | **LIVE on prod** (v2.0.0, in-repo `value.js/api/`, Hono+Mongo+Zod, healthy) | the CRUD cohesion target; divergent on ~11 contract clauses |
| value.js | **I** — *seeded, thesis open* | **SEEDED** | candidate host for the value.js-side CRUD alignment + the `sampleToSVGPath` publish |

### §10.2 — The cross-repo edges (now two, both live-grounded)

```
fourier visualization.palette_slug  ──(slug-FK)──▶  value.js palette-api palette noun   [LIVE today]
fourier-D.W5 (CRUD-CONTRACT v2.0.0) ◀─(cohesion)─▶  value.js alignment tranche          [authored fourier-side; value.js user-gated]
value.js-<I-or-dedicated> (publishes sampleToSVGPath) ──▶ fourier-D.W5-δ (consumes)      [conditional; orthogonal sub-item]
```

### §10.3 — Current critical path + next action

- **fourier next action**: await user authorization for **D.W0**. D's spine is the first prod deploy of A/B/C (W1) — until it lands, the *production-parity* invariant is unmet for the whole lineage. Research-first gate (W0 → Wα → Wχ) governs δ + deploy-safety.
- **value.js next action**: await user re-mandate for **value.js-I** as the CRUD-alignment + colour-publish tranche. fourier-D authors the contract v2.0.0 + records the ask (`D/coordination/CRUD-COHESION.md`); it does not author value.js's tranche.

The repos are now **coupled at the CRUD layer** (the live `palette_slug` FK + the cohesion contract), not merely at the latent colour seam — the broadest the cross-repo relationship has been since the B cohort.

### §10.4 — Constellation scope (tranche-D α′, 2026-05-27)

D's α′ thread (`docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md`) broadens the operational picture beyond the fourier↔value.js pair this document orders, to the **whole babb.dev constellation** on the shared AWS host (`34.197.214.67`): fourier, color (palette-api), sudoku (csp-solver), words (floridify), grammar (bbnf-lang), keyframes.js, value.js, speedtest. CANONICAL-ORDERING remains the **tranche-ordering** authority for fourier + value.js; the constellation *deployment* normalization is operational (DNS/CF-Pages/ingress), with fourier as the pilot and the others as bounded rollout — not new tranches (except the user-gated palette-api→color rename, which is a value.js-side concern). Two cross-cutting gates: the **live Mongo exposure** (urgent) and the **`api.<app>` TLS-ceiling** decision.

---

## §11 — Ordering ζ (2026-05-28 post-D-close + E-authoring — AUTHORITATIVE)

The 6-lane E-development audit (`docs/audits/runs/2026-05-28-E-audit/SYNTHESIS.md`) supersedes §10 (which was the post-D-authoring ε, when D was still planned and not yet executed). Two facts overturn the prior framing:

1. **fourier-D CLOSED CLEAN 2026-05-28** — all six threads GREEN; production is LIVE on `fourier.babb.dev` (CF Pages) + `api.fourier.babb.dev` (origin Apache + LE); the constellation is normalized (8 CF DNS records + 4 Pages projects + 7 SANs); the webhook chain is restored (`deploy.babb.dev → :9000` LIVE; the 2-month constellation regression CLOSED).
2. **The cross-repo cohesion is opening as a cohort** — fourier-E + value.js-I run together; the user's "fix our cross repos" IS the I re-mandate D held conditional. The 53 DEFERRED-TO-VALUE.JS conformance cells land in I.W1-W4; the `palette_slug` FK cross-repo CORS fix lands at E.W1; the cross-repo source boundary preserved (inv-16 + Wχ-P3.C4 inherited).

### §11.1 — Reconciled tranche inventory

| Repo | Tranche | Status (2026-05-28) | Note |
|---|---|---|---|
| fourier | **A / B / C** | **CLOSED** (`c7cfd82`, `fc5b3b0`, C-close `1e47115`) | not deployed at the time of their closes; D closed the production gap |
| fourier | **D** | **CLOSED CLEAN 2026-05-28** (`342a078` + post-close `6039e95`) | all six threads GREEN; production LIVE |
| fourier | **E** — cross-repo cohesion completion + consumer hardening + architectural transpositions + test integrity + operational hygiene | **AUTHORED 2026-05-28** (this commit); awaits user E.W0 authorization | five threads α/β/γ/δ/ε + conditional ζ per `docs/tranches/E/E.md` |
| value.js | **A–H** | **CLOSED** (H = v0.10.0 `16129e0`) | the npm library `@mkbabb/value.js` |
| value.js | **palette-api** | **LIVE on prod** (v2.0.0; api.color.babb.dev) | the CRUD cohesion target; partial-conform (17%) — I.W1-W4 closes the gap |
| value.js | **I** — *cohort peer for fourier-E* | **CONDITIONAL-OPEN** at fourier-E.W2 | user re-mandated 2026-05-28; opens as cohort; the 53 DEFERRED-TO-VALUE.JS cells |

### §11.2 — The cross-repo edges (now three, all live-grounded)

```
fourier visualization.palette_slug ──(slug-FK)──▶  value.js palette-api palette noun   [LIVE today]
fourier-E β consumer hardening (ApiProblem class) ←──(inv-16 independent)──▶ value.js-I.W4 (same shape)
fourier-E.W1 CORS fix             ──(cross-app coord)──▶ palette-api ALLOWED_ORIGINS adds fourier.babb.dev
fourier-E δ conformance probe T7  ──(probes both APIs)──▶ value.js-I conformance suite
```

### §11.3 — Current critical path + next action

- **fourier next action**: await user authorization for **E.W0**. E's spine is the cross-repo cohesion completion (the value.js-I re-mandate D recorded) + consumer hardening (all 6 consumer surfaces) + 5 architectural transpositions. Research-first gate (W0 → Wα → Wχ) governs α + γ.
- **value.js next action**: open **value.js-I** as cohort peer at fourier-E.W2. The 53 cells + the I.W1-W4 sketch are authored in `docs/tranches/E/coordination/{CRUD-COHESION-E.md, COHORT-VALUE-JS-I.md}`. The value.js maintainer authors `value.js/docs/tranches/I/I.md` per the cohort coordination.

The repos remain **independent at the source-boundary level** (inv-16) while **coupled at the contract layer** (CRUD-CONTRACT v2.0.0 documentation seam) and at the **live CORS + FK seam** (E.W1 closes the browser-layer gap).

### §11.4 — Cohort closure shape (binding)

The cohort closes via one of two paths:
- **Paired close**: fourier-E.FINAL.md AND value.js-I.FINAL.md both land; conformance probe T7 green; CANONICAL-ORDERING → ordering η.
- **Named successor**: fourier-E closes; one or more I waves remain; E.FINAL records the residual + the named successor (e.g. value.js-I.W4 → value.js-J).

Half-state at the FK seam is rejected.

---

## §12 — Ordering η (2026-05-28 post-E-close + post-I-close — AUTHORITATIVE)

**fourier-E CLOSED 2026-05-28** (`docs/tranches/E/FINAL.md`; 15 fourier commits W0→W11; T7 12/12 PASS verifies cross-repo conformance at protocol layer).

**value.js-I CLOSED 2026-05-28** (`value.js/docs/tranches/I/FINAL.md`; 4 value.js commits + the β.2 demo hardening commit; Scenario A paired close).

### §12.1 — The cohort closes — Scenario A

Per `coordination/CRUD-COHESION-E.md §5`:
1. ✅ `fourier/docs/tranches/E/FINAL.md` — landed at fourier HEAD.
2. ✅ `value.js/docs/tranches/I/FINAL.md` — landed at value.js HEAD.
3. ✅ T7 conformance probe 12/12 PASS (live at W10 close 2026-05-28T05:55Z; cron-installed on host every 6h).

Zero half-state. Zero new chronic items. All named-residuals carry explicit owners (operator coord / fourier-F / value.js-J / external repo asks).

### §12.2 — Updated inventory at ordering η

| Repo | Tranche | Status | Authority |
|---|---|---|---|
| fourier-analysis | **A-D** | CLOSED | per-tranche FINAL.md |
| fourier-analysis | **E** — *cross-repo cohesion completion + consumer hardening + arch transpositions + test integrity + ops hygiene* | **CLOSED 2026-05-28** | `docs/tranches/E/FINAL.md` |
| value.js | **A-H** | CLOSED | per-tranche FINAL.md |
| value.js | **I** — *CRUD-CONTRACT v2.0.0 conformance (cohort peer to fourier-E)* | **CLOSED 2026-05-28** | `value.js/docs/tranches/I/FINAL.md` |

### §12.3 — Critical path post-η

The post-cohort hygiene + the named-residuals review is the next concern. Suggested:
- **fourier-F** (or J/K): polish + named-residuals review (T-S3 host-flip execution; W11 FULL rename; floridify upstream; :8140 vhost; C9 numbering; per-call-site adoption of plumbed I.W4 envelopes; D.W6 AMBER → GREEN Playwright matrix).
- **value.js-J** (or later): hard-removal of `palette.status` legacy field (post-consumer-audit); Idempotency-Key API-side replay store; per-repo conformance suite.

### §12.4 — Cross-repo edges at ordering η (all live-grounded + verified by T7)

```
fourier visualization.palette_slug  ──(slug-FK)──▶  value.js palette-api palette noun   [LIVE; T7-verified]
fourier ApiProblem (web/src/lib)    ←──(inv-16)──▶  value.js demo ApiProblem (per-repo) [LIVE; per-repo independent]
fourier CORS (Origin: fourier...)   ──(ACAO echo)─▶ palette-api CORS                    [LIVE since E.W1; T7-verified]
fourier T7 conformance probe        ──(probes both APIs)──▶ both APIs + envelope shape  [LIVE; cron every 6h]
```

### §12.5 — The current critical path + next action

- **fourier next action**: deferred-with-owner items review (T-S3 host-flip; FULL rename; etc.) at a fourier-F open OR at the next operational deploy window. None are blocking.
- **value.js next action**: deferred-with-owner items review (per-call-site adoption; status drop after consumer audit) at a value.js-J open.

Both repos enter the **post-cohort hygiene window**. The constellation is FULLY GREEN at the URL + envelope + cross-repo CORS + browser-layer FK seam.

End of CANONICAL-ORDERING §12 — ordering η.

---

## §13 — Ordering θ (2026-05-28 post-E-close + post-I-close + F-authoring — AUTHORITATIVE)

**fourier-F AUTHORED 2026-05-28** (`docs/tranches/F/F.md`; 6-lane FA1-FA6 audit + SYNTHESIS at `docs/audits/runs/2026-05-28-F-audit/`; 5 threads; 2 new invariants; 12-wave shape; dev-only — no implementation ran).

### §13.1 — F is single-repo post-cohort hygiene

E + I closed Scenario A at ordering η. The cohort handshake discharged. F is single-repo with ASK-only cross-repo touchpoints (csp-solver route-registration regression; F-T-N1 paired demo PR for the legacy `status` field drop).

The user's 2026-05-28 EE3 directive ("Deploy 6 agents in parallel to lighthouse test each page… DEEPLY audit… NO legacy code… fold into a new tranche… NOT an implementation phase. Tranche development only. Workflow.") IS the F authoring substrate.

### §13.2 — Updated inventory at ordering θ

| Repo | Tranche | Status | Authority |
|---|---|---|---|
| fourier-analysis | **A-D** | CLOSED | per-tranche FINAL.md |
| fourier-analysis | **E** | CLOSED 2026-05-28 (Scenario A) | `docs/tranches/E/FINAL.md` |
| fourier-analysis | **F** — *post-cohort hygiene (API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge)* | **AUTHORED 2026-05-28** (dev only — no implementation) | `docs/tranches/F/F.md` + `docs/audits/runs/2026-05-28-F-audit/SYNTHESIS.md` |
| value.js | **A-H** | CLOSED | per-tranche FINAL.md |
| value.js | **I** | CLOSED 2026-05-28 (Scenario A peer to fourier-E) | `value.js/docs/tranches/I/FINAL.md` |

### §13.3 — The F payload

**5 threads** (KISS-honest; no manufactured scope):
- **α API-vhost-correctness** — load-bearing prod regression on `api.fourier.babb.dev` (FA1 §5 F-API-1); rate-limit middleware wiring (F-API-2); inv-22 first lands.
- **β compute-cache-symmetry** — FA5 F-T-S1 parametric collapse + `compute_bases` wiring + collection rename; closes E3 hit-rate residual.
- **γ operator-window-consolidation** — single SSH session: T-S3 host-flip + value.js dispatcher arm delete + `:8140` vhost + cron evidence (closes FA3 trust-delta).
- **δ UX + a11y + perf polish** — Lighthouse-surfaced floor: `button-name` failures + missing `meta-description`/`robots.txt` + CM fonts on jsdelivr + LCP 7–8 s.
- **ε chronic + transpositions + auto-migration GREEN-verified** — C4 onnxruntime + C9 numbering + N2 CF wildcard + FA5 F-T-N1/E1/S2 + W8 migration trigger.

**2 new invariants** (by name):
- **inv-21** post-cohort-hygiene-bounded — each F thread single-PR or single-SSH-session.
- **inv-22** vhost-correctness-symmetric — both API vhosts return JSON on `/`, `/health`, `/docs`, `/openapi.json`.

**15-item must-NOT list** at SYNTHESIS §4. **12 items REJECTED-from-F** with explicit rationale (FA4 §4 + SYNTHESIS §6).

### §13.4 — Critical path post-θ + next action

- **fourier next action**: await user authorisation for **F.W0**. F's spine is the 5-thread shape with research-first gating for α + γ (Wα 3 lanes; Wχ 4 probes).
- **value.js next action**: STAYS-OUT-of-cohort-coord for F; the F-T-N1 paired demo PR at F.W7 is the only fourier-side touch the value.js maintainer needs to action.

The constellation remains FULLY GREEN at the URL + envelope + cross-repo CORS + browser-layer FK seam; F is the bounded hygiene + UX-polish lift that EE3 mandated.

### §13.5 — F research-first audit complete (2026-05-28; workflow `w0ma5070c`)

**§13.6 — F widens to constellation scope (2026-05-28; thread ζ added).** The user directed CI/webhook/deploy standardization + security across the constellation + a dedicated deploy repo. A READ-ONLY 4-lane survey grounded it (`docs/audits/runs/2026-05-28-constellation-survey/`); the design substrate is `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md`. Decisions: (1) created PRIVATE repo **`mkbabb/deploy`** (charter `e3b16d8`) as the versioned home of the deploy spine; (2) the survey's S1/S2 committed-credential flags are **WITHDRAWN** (maintainer 2026-05-28: nothing needs rotating — Clerk `pk_*` publishable by design, speedtest `cfat_*` non-sensitive); (3) **folded into fourier-F as thread ζ** (6 threads now; 17 wave slots). The **C8 5-gate constellation-infra chronic DISCHARGES via ζ**. fourier-F now spans `fourier-analysis/**` + the new `deploy/**` repo (inv-16 preserved — the other 5 app repos adopt via maintainer-owned PRs, coordinated as F-ζ.4 asks). The deploy repo is a new constellation node alongside fourier + value.js.

---

The F Wα (3 research lanes) + Wχ (4 challenge probes) ran READ-ONLY; substrate at `docs/audits/runs/2026-05-28-F-research/`. **F charter RATIFIED-WITH-DELTA** — no thread killed; **F.W1 does NOT pivot** (the `api.fourier.babb.dev` stale-SPA regression is ORIGIN-served — host Apache → Docker `nginx:alpine`:8100 → SPA catch-all; `Server: nginx/1.29.5`, no `cf-ray` — not CF Pages). Five binding deltas folded into the charter: (1) F.W1 origin-nginx surgical `location =` fix; (2) W3 SPLITS into W3a (now) + W3b (operator-gated on INVALID gh token); (3) inv-22 revised (`/docs` Swagger-OK; scope {fourier, color}); (4) F-δ.b NARROWED to a single font-pin (route-lazy + self-host manufactured); (5) F-T-E1 + F-T-S2 REJECTED (only F-T-N1 doc-ASK survives). W1/W2/W3a/W4/W5(narrowed)/W6/W7(F-T-N1)/W8 are GREEN-to-execute on authorization; **W3b alone is operator-gated**.

End of CANONICAL-ORDERING §13 — ordering θ.

---

## §14 — Ordering ι (2026-05-28 constellation-wide execution order — AUTHORITATIVE)

The user asks: given the several developed tranches (fourier-F, value.js, glass-ui, speedtest, the new `deploy` repo, &c.), what is the proper execution order? Grounded in a live survey of every sibling's tranche board (2026-05-28).

### §14.1 — Open-state inventory at ordering ι

| Repo | Latest closed | Open / in-flight | Disposition |
|---|---|---|---|
| **fourier-analysis** | E (Scenario A) | **F AUTHORED** (6 threads α-ζ; 17 waves; research gate GREEN; W3b unblocked) | the live-bug + deploy-spine critical path; **glass-ui-independent** |
| **value.js** | I (Scenario A w/ fourier-E) | value.js-J latent (E5/E6/E7; per-call-site ifMatch) | named-successor; opens on a real driver; NOT gating |
| **glass-ui** | V (+ uppercase lineage to V) | **`g.w5` release-engineering wave ACTIVE** (changesets + release workflow + npm-registry consumption migration + muster) | **the upstream publisher chokepoint** — everything consumes glass-ui; standing mandate: do NOT inject competing publisher commits into the active changeset flow |
| **speedtest** | AP (2026-05-28) | **AQ SEEDED** — headline carry `R0-glass` **BLOCKED on glass-ui g.w5** | the CF-Pages deploy REFERENCE; an F-ζ deploy-adoption target (needs CI); AQ opens after g.w5 settles |
| **deploy** (NEW, private) | — | charter seeded (`e3b16d8`); spine-capture is F-ζ | versioned home of the deploy spine; authored by fourier-F |
| **csp-solver** (sudoku) | — | route-registration regression (N4) | F-ζ.4 adoption ask + N4 route-fix (maintainer-owned) |
| **words** (floridify) | (no tranche system) | — (S1 flag WITHDRAWN — `pk_*` publishable) | F-ζ.4 adoption ask (CI + deploy-hook) |
| **keyframes.js** | (no tranche system) | — | F-ζ.4 CF-Pages-convergence adoption ask |

### §14.2 — The dependency edges (what gates what)

```
glass-ui g.w5 (ACTIVE publisher) ──hard──▶ speedtest-AQ (R0-glass handoff; standing no-compete mandate)
glass-ui g.w5                    ──soft──▶ any fourier/value.js demo polish wanting the NEW glass-ui surface
                                            (build-time VENDORED today → not a hard gate for fourier-F)
fourier-F.γ (W3a→W3b host-flip)  ──hard──▶ F-ζ.2 (per-repo HMAC split)
F-ζ.3 (deploy templates)         ──hard──▶ cross-repo deploy adoption (speedtest/words/csp/value.js/keyframes)
fourier-F                        ──⊥────── glass-ui  (INDEPENDENT — F touches no glass-ui surface; runs in parallel)
(S1/S2 secret findings WITHDRAWN — nothing needs rotating; no longer an edge)
```

### §14.3 — The proper execution order (tiered; parallel where independent)

**Tier 0 — (REMOVED).** The survey's S1/S2 committed-credential flags are WITHDRAWN (maintainer 2026-05-28: nothing needs rotating — Clerk `pk_*` is publishable by design; the speedtest `cfat_*` is non-sensitive). No security-first rotation step. The real webhook-secret hardening (shared HMAC → per-repo, survey S4/S5) is NOT an exposure-remediation; it rides F-ζ.2.

**Tier 1 — two independent tracks run IN PARALLEL:**

- **Track A — glass-ui `g.w5`** (the upstream publisher): let it settle. It is the changeset/release-engineering wave every consumer depends on; the standing mandate forbids competing publisher commits. Its completion unblocks speedtest-AQ + any surface-consuming polish. *Owner: glass-ui maintainer + muster agent.*

- **Track B — fourier-F** (glass-ui-independent; the live-bug + deploy-spine critical path; awaits user authorization, research gate already GREEN). Internal order:
  1. **F.W1 (α)** — the live prod regression (api.fourier vhost SPA-bleed + rate-limit). HIGHEST urgency (live bug).
  2. **F.W2 (β)** — compute-cache-symmetry (mechanical; parallel-safe).
  3. **F.W3a → W3b (γ)** — the operator host-flip (per-repo webhooks; gh now valid; W3a stages, W3b flips). **Prerequisite for ζ.**
  4. **F.W4-W8 (δ + ε)** — UX/a11y/perf polish + chronic discharge + transpositions + migration-GREEN-verified (parallelizable; lower urgency; glass-ui-independent).
  5. **F.W9-W11 (ζ.1-ζ.3)** — deploy-spine capture into `mkbabb/deploy` + per-repo HMAC + the standard templates. **ζ.3 templates are the constellation enabler.**
  6. **F.W12 (ζ.4)** — author the cross-repo adoption-ask ledger.

**Tier 2 — rendezvous: cross-repo deploy adoption** (gated on F-ζ.3 templates; speedtest additionally gated on glass-ui g.w5; maintainer-owned; per-repo PARALLEL):
- **speedtest** — adopt CI template (has none); opens its AQ tranche once g.w5 settles (R0-glass) AND ζ.3 templates exist. (speedtest is the CF-Pages reference, so it mostly already conforms.)
- **words/floridify** — adopt CI + deploy-hook.
- **csp-solver** — N4 route-registration fix + adopt CI + deploy-hook.
- **value.js** — frontend CF-Pages convergence (drift from GH-Pages) + palette-api rsync→git.
- **keyframes.js** — CF-Pages convergence.

**Tier 3 — closes:**
- **F.W13** — fourier-F close (after α-ζ); CANONICAL-ORDERING → ordering κ.
- value.js-J / speedtest-AQ-beyond / glass-ui-next — open on their own drivers.

### §14.4 — The critical path + the single most-blocking move

**Critical path** (longest hard-edge chain): `fourier-F.γ (host-flip) → F-ζ.2 (per-repo HMAC) → F-ζ.3 (templates) → cross-repo deploy adoption`. Everything downstream of the deploy normalization waits on ζ.3 templates, which waits on γ.

**Single most-blocking move**: **authorize fourier-F** (it is the only critical-path track under this repo's control; research gate is GREEN; W1 is a live bug). glass-ui g.w5 proceeds in parallel under its own owner; the two rendezvous at Tier 2.

**Parallelism note**: fourier-F and glass-ui g.w5 are genuinely independent (F touches no glass-ui surface; glass-ui is build-time-vendored in fourier today). Do NOT serialize them. The only serialization is: (a) γ before ζ within F; (b) ζ.3 templates + g.w5 before the cross-repo adoption rendezvous. (There is no longer a security-first Tier 0 — the S1/S2 findings are WITHDRAWN.)

End of CANONICAL-ORDERING §14 — ordering ι.

---

## §15 — Ordering θ′ (2026-05-29 post-F-close — AUTHORITATIVE for fourier)

**fourier-F CLOSED 2026-05-29** (`docs/tranches/F/FINAL.md`; fourier HEAD `d98da91`; deploy-repo `mkbabb/deploy` HEAD `7c4e96b`). This records the close of the post-cohort hygiene tranche that ordering θ (§13) authored and ordering ι (§14) sequenced as Track B. §14's tier framing is unchanged for the constellation; §15 records what fourier-F actually delivered and the forward residuals.

### §15.1 — F closed GREEN-with-named-residuals

All six threads (α API-vhost-correctness, β compute-cache-symmetry, γ operator-window, δ UX+a11y+perf, ε chronic+transpositions+migration-GREEN, ζ constellation deploy standardization) landed. 14 wave rows (W0, W1, W2, W3a, W3b, W4–W13) CLOSED; 12 fourier commits + 1 deploy-repo commit (`7c4e96b`) + 2 host-ops receipt sets. T7 12/12 PASS; pytest 214/214; vue-tsc + build green. inv-12/16/20/21/22 honored + the new `docs/tranches/INVARIANTS.md` canonical ledger (C9 name-resolved).

**The headline:** F not only landed its planned hygiene + UX surface — it discovered that the constellation auto-deploy chain had been silently BROKEN for ~2 months (host pinned at `6039e95`) and restored it. Three masked deploy-blockers fixed (stale `web/vendor` Dockerfile COPY `60f1f89`; drifted `web/package-lock.json` `37da6f0`; the 3-layer W8 auto-migration defect `a04f636`+`4007ec5`) + the chronic webhook-secret regression (secret MISSING on all 5 repos — root-caused + closed + hardened to per-repo HMAC). inv-22 is now co-enforced on every deploy by the inv-22-aware health gate (`0a7a743`).

### §15.2 — Updated inventory at ordering θ′

| Repo | Tranche | Status | Authority |
|---|---|---|---|
| fourier-analysis | **A-E** | CLOSED | per-tranche FINAL.md |
| fourier-analysis | **F** — *post-cohort hygiene + constellation deploy standardization* | **CLOSED 2026-05-29** (GREEN-with-named-residuals) | `docs/tranches/F/FINAL.md` |
| value.js | **A-I** | CLOSED | per-tranche FINAL.md |
| value.js | **J** — *latent (E5/E6/E7; per-call-site ifMatch)* | not opened | named-successor; opens on a real driver |
| deploy (`mkbabb/deploy`, private) | spine + templates | **AUTHORED** `7c4e96b` (ζ.1–ζ.3) | the versioned home of the deploy spine |

### §15.3 — The forward residuals (maintainer- + operator-owned; none gating fourier)

The deploy-process normalization is now version-controlled (`mkbabb/deploy`) and the per-repo HMAC split is live on host. What remains is cross-repo adoption + one infra wave — none under fourier's unilateral control:

- **The 7 cross-repo adoption asks** (`docs/constellation/ADOPTION-ASKS.md`, inv-16 maintainer-owned): CI template (words/speedtest/csp-solver); docker-hardening level-up; frontend CF-Pages convergence (value.js/keyframes); palette-api `rsync`→`git`; csp-solver route-registration (N4); floridify Mongo-bind (N7). These are §14 Tier-2 rendezvous items — now gated on adoption, not on the templates (which exist).
- **`dispatch.sh` full retirement** — gated on the 4 non-fourier repos adopting `deploy-hook.sh`; per-repo isolation already achieved at W3b.
- **Real-client-IP resolution** behind the 2-hop Apache→nginx chain (rate limiter keys on proxy IP → shared global bucket; per-client correctness needs nginx `real_ip` + XFF-hop resolver + Apache XFF verification) — a successor infra wave.

### §15.4 — Current critical path + next action

**No fourier tranche is open.** A–F closed. The §14 critical path (`γ host-flip → ζ.2 HMAC → ζ.3 templates → cross-repo adoption`) has advanced through ζ.3 — the templates exist; the constellation deploy-adoption rendezvous (§14 Tier 2) is now the forward concern, maintainer-owned and per-repo parallel.

- **fourier next action**: none required. A fourier-G opens only if a named residual is promoted (the real-client-IP infra wave) or new work is mandated. The 30-day stale-watch (F/FINAL §5) tracks E's + F's residuals with owners.
- **value.js next action**: value.js-J on its own driver (E5/E6/E7).
- **constellation next action**: the per-repo maintainers action the `ADOPTION-ASKS.md` ledger; speedtest-AQ additionally awaits glass-ui `g.w5` (§14 Track A) for its R0-glass handoff.

The constellation auto-deploy is RESTORED + hardened; fourier sits CLEANLY post-F with all residuals owned and watched.

End of CANONICAL-ORDERING §15 — ordering θ′.
