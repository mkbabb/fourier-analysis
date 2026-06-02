# A1 — PLAN & WAVE-ARCHITECTURE audit of tranche J (fourier-J + value.js-J)

**Auditor**: A1 (plan & wave-architecture).
**Scope**: the J tranche plan and its wave structure across BOTH repos — fourier-analysis-J + value.js-J — read against the governing precepts (KISS atom-diff, inv-15/16/16′/26/27/29/30, no-DAG, single-parent-linear, idiomatic/gestalt-over-bolt-on).
**Substrate read (file:line)**:
- `fourier-analysis/docs/tranches/J/J.md` (1–149), `J/PROGRESS.md` (1–46), `J/design/J.W1-crud-remix.md` (1–357)
- `value.js/docs/tranches/J/J.md` (1–172), `J/PROGRESS.md` (1–59)
- `fourier-analysis/docs/tranches/I/{I.md,FINAL.md,PROGRESS.md}`
- `fourier-analysis/docs/tranches/CANONICAL-ORDERING.md` (§17 κ′, §18 λ′ — the chain head)
- `fourier-analysis/docs/tranches/INVARIANTS.md` (§1, §2.10/§2.11, §3)
- code: `api/lib/crud/cursors.py:15-23`, `api/models/visualization.py:100-180`, `value.js/api/src/services/palette/forks.ts:1-60`
- `docs/constellation/ADOPTION-ASKS.md` (§4, §6)

**VERDICT: SOUND-WITH-REFINEMENTS.** The J plan is the *right* tranche and its spine is idiomatic-gestalt: the CORE (CRUD/REMIX atom-diff) is correctly placed as the value, leads the sequence, and is decomposed KISS-first (single-parent linear, flat content-addressable bag, no DAG) exactly as the precepts mandate. The phantom `most-forked` sort is a real, file-verified gap (`cursors.py:21` is the *only* `fork_count` reference in the entire fourier api — never written, not on the model). The 5 atoms all exist on the model. The DEV/IMPL boundary is correctly placed (between W1 design and W2 impl). BUT five refinements are required before "Begin": (P1) the claimed substrate seed `A3-fourier-valuejs.md` **does not exist** in either repo — the entire plan cites a dangling audit; (P1) ordering μ′ is **not written** into CANONICAL-ORDERING (the chain ends at §18/λ′); (P2) the value.js-J atom-diff `ADOPTION-ASKS` entry that J.md asserts as "NAMED, file-verified" is **not yet seeded**; (P2) the §4.1 motion/VT refutation is sound but the CSS-platform refutation is partly a category-shuffle, not a clean refute; (P2) value.js-J §0 mis-labels its own wave numbers. None of these are architectural — the *shape* is correct; the *evidence chain* has holes.

---

## Findings table

| ID | Sev | Title | Location |
|---|---|---|---|
| A1-1 | P1 | The substrate seed `A3-fourier-valuejs.md` does not exist — the whole plan cites a dangling audit | both J.md, both PROGRESS, `J.W1-crud-remix.md:6` |
| A1-2 | P1 | Ordering μ′ is unwritten — CANONICAL-ORDERING ends at §18/λ′; J close cannot cite it | `CANONICAL-ORDERING.md` §18 (end of file, line 679) |
| A1-3 | P2 | value.js-J atom-diff ADOPTION-ASKS entry asserted as booked but absent from the ledger | `fourier J.md:95,43,109`; `ADOPTION-ASKS.md §6` |
| A1-4 | P2 | §4.1 CSS-platform refutation is a category-shuffle (content-visibility *is* a CSS-platform lever), not a clean refute | `fourier J.md:70`, `J.md:61` |
| A1-5 | P2 | value.js-J §0 bullet wave-labels contradict the §3 wave table (J.W1=design vs §0 "J.W1 (VAL-9)") | `value.js J.md:26-30` vs `:56-61` |
| A1-6 | P2 | Four `WC-design-*` docs sit in `J/design/` unreferenced by any wave — a folded design thread with no plan slot | `fourier J/design/WC-design-*.md` (4 files); not in J.md/PROGRESS |
| A1-7 | NIT | `cursors.py:17,21` citation is off-by-one — the `fork_count` mapping is line 21 only (17 is the `SortKey` Literal) | `fourier J.md:13`, `J.W1-crud-remix.md:8` |
| A1-8 | NIT | fourier-J has 8 wave slots (W0–W7), value.js-J has 6 (W0–W5) — the asymmetry is correct but never reconciled in either §cohort | `fourier J.md:54-64` vs `value.js J.md:54-63` |

---

## Q1 — Is the J wave sequence idiomatic/gestalt? Is the DEV/IMPL boundary placed correctly?

**Largely YES — idiomatic, with the CORE correctly leading and one structural smell.**

The fourier-J sequence is `W0 audit → W1 CORE design → W2 CORE impl → W3 perf → W4 CWV → W5 evidence → W6 tail → W7 close` (`fourier J.md:54-64`). This is the right shape for a data-model tranche: the CORE (the value) leads, the leaf perf/a11y wins follow as consumer-backed adoptions, evidence is its own wave, the tail is last. The plan explicitly and correctly states the CORE is **not** a spine wave — "it is a data-model wave; it leads because it is the value" (`J.md:50`). That is gestalt sequencing — by-leverage, value-first.

**The DEV/IMPL boundary is placed correctly.** Both repos place it between W1 (design doc) and W2 (first impl): fourier `J.md:52,57-58`, value.js `J.md:57,63`. W0 audit + W1 design are DEV/planning; W2+ implement. This is the established discipline (matches H/I) and is internally consistent with the design doc being the "tranche's planning deliverable" (`J.md:57`).

**No wave smells like a quick-solution.** Each leaf wave is additive behind a feature gate (inv-29): W3 `scheduler.yield()` with a `scheduler.postTask`/`setTimeout` floor; W4 `content-visibility` via an already-shipped glass-ui utility; W6 `fetchLater()` with `sendBeacon` floor. The CORE design (`J.W1-crud-remix.md`) is the opposite of a bolt-on — it *transposes* the existing single `_compute_content_hash` (which hashes four fields, `visualizations.py:72`) into per-atom hashes (`J.W1:27,47-61`) so the diff falls out for free, rather than adding a parallel diff store. That is the precept's "transpose the architecture, don't bolt onto it" applied correctly.

**One structural smell (A1-6):** the `J/design/` directory contains four `WC-design-*` docs (motion, layout, typo-color, atmosphere-a11y) — a full design-refinement thread, glass-ui-3.1.0-anchored, spec-only — that is **referenced by no wave** in J.md or PROGRESS.md. Either a "WC" design wave was folded out of the plan but its artifacts left dangling, or a real design-polish thread exists that the wave table silently omits. A reader cannot tell whether WC is in-scope, deferred, or orphaned. The plan must either book WC as a wave/residual or move the docs out of the active tranche dir.

**Verdict Q1: idiomatic and gestalt; DEV/IMPL boundary correct; resolve the WC dangling-thread.**

---

## Q2 — Does J cleanly SUCCEED I? Is the "~65% converged" claim coherent? Are the I-deferred items genuinely folded?

**YES on succession; the convergence claim is coherent; the folds are genuine and individually traceable — but the substrate seed they all hang on is missing (A1-1).**

Succession is clean and correctly motivated. I asked "is it modern?" and converged ~65% of its plan into glass-ui's AQ tranche (`I/FINAL.md:9,47-49`); J asks "does the data model earn the fork/version substrate?" — the question I "left open" (`fourier J.md:3`). The "~65% converged" framing is faithfully carried from `I/FINAL.md §4` (the leverage-principle de-dup), and J does not re-litigate it — it correctly treats the converged α/β/ζ/η as *adopted substrate fourier now consumes*, which is exactly why §4.1 refutes the CSS-platform/motion spine waves (they're glass-ui's now).

**The I-deferred ledger folds are genuine, each traceable to its I source:**
- **e2e/axe CI evidence** — I deferred it ("not claimed green here … no covering run," `I/FINAL.md:39`; `I/FINAL.md:73`) → J.W5 EVIDENCE (`fourier J.md:62`, `:117`). Genuine.
- **`scheduler.yield()`** — named in I's ι tail, never executed (`I.md:21`; `I/FINAL.md:72` "remain inv-16′ asks") → J.W3 (`fourier J.md:60`, `:118`). Genuine — the highest remaining INP lever.
- **content-visibility gap** — I shipped `.deferred-section` on the *paper window* (`I/FINAL.md:16`) but the *gallery grid* never adopted it → J.W4 (`fourier J.md:61`, `:120`). Genuine — an unapplied-consumer gap, not a name-drop.
- **CSP/`fetchLater` ι tail** — I left it "PARTIAL LOCAL + BOOKED" (`I/FINAL.md:23,72`) → J.W6 (`fourier J.md:63`, `:119`). Genuine.

All four are real I residuals, not invented scope. The fold is honest.

**BUT (A1-1):** every one of these folds, and the CORE itself, is anchored to `docs/constellation/next/audit/A3-fourier-valuejs.md` — cited as "the WAVE-D seed" in `fourier J.md:5`, `value.js J.md:6-7`, `J.W1-crud-remix.md:6`, and both PROGRESS logs. **That file does not exist.** `docs/constellation/next/` contains only `ADOPTION-ASKS.md` + `DEPLOY-STANDARDIZATION-DESIGN.md`; an exhaustive `find`/`grep` across both repos returns the path *only* inside the J docs that cite it. So the binding-question, the §4.1 refutations ("the audit's REFUTE rule"), the §5 consumer list, the G5/G6 bookings, and the cross-repo `/diff` parity check all cite a substrate that is not on disk. The *content* of the seed is reconstructable (the asymmetry is independently file-verifiable — see Q3/Q5), so this is not fatal, but per inv-27's evidence discipline a plan cannot cite a covering document that does not exist. **Either author the A3 audit (W0 intake is the natural home) or re-cite the real substrate** (the live code asymmetry + the I FINAL ledger).

**Verdict Q2: J succeeds I cleanly; the ~65% claim and the four folds are coherent and genuine; the missing A3 seed must be authored or re-cited.**

---

## Q3 — Are the two §4.1 spine-wave REFUTATIONS sound, or a convenient dodge?

**The motion/VT refutation is SOUND. The CSS-platform refutation is a CATEGORY-SHUFFLE that half-dodges (A1-4) — defensible in outcome but not in form.**

**Motion/View Transitions (spine W5) — SOUND refute.** `fourier J.md:71` refutes it because fourier already shipped its VT arm in I.ε (`/w/`↔`/v/` route-morph via `startViewTransition`, commit `262c3d0` — verified in `I/FINAL.md:18,34`), and the FLIP-engine retirements are glass-ui/keyframes-owned (inv-30). The remix-flow genuinely has no motion surface that earns a VT wave — a diff-viewer render is a CSS-Custom-Highlight leaf under the CORE consumers (`J.W1:291`), not a route morph. Booking a VT wave for a JSON diff would be substrate-without-consumer (inv-15). This refute is correct and well-grounded. **Holds.**

**CSS-platform (spine W4 — anchor/overlay/forms) — refute is a category-shuffle.** `fourier J.md:70` refutes it on two grounds: (a) the anchor/overlay/forms substrate converged into glass-ui's AQ (true — fourier adopts via `^3.1.0`, `I/FINAL.md:22`); (b) "the one fourier-local CSS-platform leaf — `content-visibility` on the gallery grid — **is** the CWV wave (W4 above), not a separate anchor/forms wave." Ground (a) is sound (overlay/forms are genuinely glass-ui's now, no fourier-local lever). But ground (b) **mislabels the refute**: `content-visibility` *is itself a CSS-platform capability* — the plan moves it to the "CWV/content-visibility" spine slot (spine W2 → J.W4) and then declares the CSS-platform slot empty. That is not a refutation of CSS-platform; it is a *re-slotting* of one CSS-platform lever into the CWV slot, leaving the *anchor/forms* half genuinely refuted. The honest statement is: "the anchor-positioning/forms half of spine-W4 is refuted (glass-ui-owned, no fourier lever); the `content-visibility` half is landed at J.W4 under the CWV slot." As written, it reads as if the entire CSS-platform category has no fourier consumer, which is false — content-visibility is one. **Refine the wording; the *outcome* (no separate anchor/forms wave) is correct, the *framing* over-claims.** This is not real dodged work — there is no fourier-local anchor/forms lever — so it is P2 (form), not P1 (substance).

**Verdict Q3: motion/VT refute is sound; CSS-platform refute is correct-in-outcome but mis-framed (a re-slot dressed as a refute) — tighten the language.**

---

## Q4 — Are fourier-J and value.js-J SYMMETRIC where they should be and asymmetric where they must be?

**Mostly correct — the asymmetric starting point is right, the shared pattern is right, but the wave-count asymmetry is unreconciled (A1-8) and value.js-J's §0 wave-labels are internally inconsistent (A1-5).**

**Correctly asymmetric (the starting point).** value.js EXTENDS (atom-diff onto existing fork machinery — `value.js J.md:41,158`); fourier INHERITS (the whole fork+version+provenance substrate it lacks — `fourier J.md:13`, `value.js J.md:158`). This is the right asymmetry: `forks.ts:29` confirms value.js already ships `forkPalette` (cross-collection transaction), and `cursors.py:21` confirms fourier has only the phantom read-side. The "symmetric close, asymmetric start" framing (`value.js J.md:158`) is correct and well-stated.

**Correctly symmetric (the pattern + envelope).** Both author the atom-diff as a *per-language PATTERN* (`lib/crud/atomdiff.py` / `lib/crud/atomdiff.ts`), authored once, adopted twice, NO shared package (inv-16/inv-26 — `fourier J.md:81`, `value.js J.md:41,109`; `J.W1:19,170`). The `{fromHash, toHash, atomDiff}` edge shape and the `/diff?from=` response envelope are symmetric, with only the atom-VALUES differing (config atoms vs `PaletteColor[]`) — `J.W1:299-313`. The cross-repo `/diff` shape-parity check is the symmetric close gate (`fourier J.md:43,109`; `value.js J.md:31,105`). This is exactly inv-16 "shared by contract" applied correctly — a pattern, never a framework.

**Correctly asymmetric (scope).** value.js-J additionally carries VAL-9/VAL-1 re-gates + the I-tail Idempotency-Key/conformance-suite close (`value.js J.md:28-29,60`) — value.js's own chronic deferrals, ≥2-consumer-gated. fourier-J explicitly DISCLAIMS these as "not a fourier residual" (`fourier J.md:99,126-127`). Correct — they are value.js-owned and must not symmetrize into fourier.

**Unreconciled asymmetry (A1-8):** fourier-J has 8 wave slots (W0–W7); value.js-J has 6 (W0–W5). The difference is legitimate (value.js folds perf into W2 and has no separate EVIDENCE/TAIL waves because its perf+CSP differ), but neither repo's §cohort section states "the wave counts differ because X." A reader pairing the two cohort plans has to reverse-engineer why fourier W5(evidence)/W6(tail) have no value.js peer. Add one reconciling sentence.

**Internal inconsistency (A1-5):** value.js-J §0 labels its goal-criterion bullets `J.W2 (REMIX core)`, `J.W1 (VAL-9 re-gate)`, `J.W4 (VAL-1)`, `J.W2-perf`, `J.W3 (diff render)` (`value.js J.md:26-30`) — but the §3 wave table (`:56-61`) places design at W1, REMIX core at W2, diff render at W3, and *both* VAL re-gates at W4. So the §0 bullet "J.W1 (VAL-9 re-gate)" contradicts "J.W1 = the CORE spec" (the design wave) in the table. The VAL-9 verdict is *recorded* at W1 (design) but *discharged* at W4 (impl) — the bullet label conflates the two. Fix the §0 labels to match the table.

**Verdict Q4: the symmetry/asymmetry split is architecturally correct; reconcile the wave-count asymmetry in one sentence and fix value.js-J §0's wave-labels.**

---

## Q5 — ARCHITECTURAL TRANSPOSITION: where could the plan be simpler/more-elegant by transposing rather than adding?

**The CORE is already well-transposed — and the plan correctly REFUSES the two transpositions that would be wrong. Two genuine simplification opportunities exist, both minor.**

**The plan's transpositions are sound and should NOT be "improved" toward a shared lib:**
1. The atom-diff is correctly a **shared PATTERN, not a shared lib/CRUD generic** (`J.W1:19,170`; inv-16). The auditor's prompt asks "should the CORE be a shared lib/crud generic instead of two parallel implementations?" — **NO**, and the plan is right to refuse it. The atom-SET differs (5 fixed config atoms keyed by name vs variable `PaletteColor[]` keyed by position — `J.W1:305`); a shared generic would be a `BaseCRUDRouter`-in-disguise (inv-16 forbids exactly this; the Wχ.P1 certification is cited at `fourier J.md:81`). The `diff_atoms(before, after)` core *is* already repo-agnostic (`J.W1:185-205`) — parameterized over enumerate+key — which is the correct degree of sharing: a copied 18-line pure function, not an imported package. **This is the idiomatic answer; do not transpose further.**
2. The plan correctly **transposes the existing content-hash** rather than adding a parallel store: `_compute_content_hash` (one hash over four fields, `visualizations.py:72`) is decomposed into per-atom hashes (`J.W1:47-61`), and the diff edge lives ON the child version document (1:1 with the child, single-parent) rather than in a separate `provenance_edges` collection — "a separate collection would be a needless join. KISS" (`J.W1:150`). This is transpose-over-bolt-on done right.

**Genuine simplification opportunities (minor):**
3. **The `set_hash` vs `content_hash` coexistence (`J.W1:73`) is the one place the design adds rather than transposes.** It keeps `content_hash` (subject-bearing dedup/ETag) AND introduces `set_hash` (subject-free remix-config identity) as two hashes computed from "overlapping but distinct material." The design defends this (collapsing them re-conflates subject with config). The defense is correct, but the plan should make `set_hash` *derive from the same per-atom hashing machinery* it already builds — which it does (`atom_hash` → `set_hash`, `J.W1:63-71`) — so this is acceptable. No change needed, but W2 should verify the two hashes never drift (a single canonical-json discipline feeds both).
4. **The 6-wave-spine mapping is partly forced (relates to A1-4).** The plan maps the CORE onto "not a spine wave" and then maps 4 leaf waves onto 4 spine slots while refuting 2. The honest gestalt is simpler: J is a **CORE + 4 consumer-backed leaves + close** tranche; the "canonical 6-wave modern-web spine" is an I-era frame that no longer fits a data-model tranche. Forcing the mapping produces the §4.1 category-shuffle (A1-4). **Transposition: drop the spine-mapping ceremony and present J as "CORE (W1→W2) + leaf wins (W3 perf, W4 CWV, W5 evidence, W6 tail) + close (W7)."** The spine was the right frame for I (a modernization tranche); J is a data-model tranche and the spine mapping is vestigial scaffolding. This is the single most-elegant simplification available — remove the forced frame rather than add refutations to defend it.

**Verdict Q5: the CORE transpositions are correct and the no-shared-lib refusal is idiomatic; the one elegant simplification is to drop the vestigial 6-wave-spine mapping that J inherited from I (it forces the §4.1 category-shuffle).**

---

## Q6 — Is the ordering-letter discipline (I=λ′, J=μ′) consistent across both repos and CANONICAL-ORDERING?

**NO — μ′ is asserted by both J plans but is NOT written into CANONICAL-ORDERING (A1-2). This is the most concrete plan-completeness gap.**

- I=λ′ is consistent and landed: `CANONICAL-ORDERING.md §18` is "Ordering λ′ (I)"; `I/FINAL.md:78` and `I.md:34` cite ordering λ′. Correct.
- J=μ′ is asserted by both J plans as the *target*: `fourier J.md:44,64,118` ("CANONICAL-ORDERING → ordering μ′"); `fourier PROGRESS.md:17,24`; the value.js side does not name a Greek letter (value.js uses its own A–I/J lineage, not the fourier μ′ chain — which is correct, μ′ is a fourier-rooted ordering letter).
- **But CANONICAL-ORDERING ends at §18 / λ′ (line 679).** There is no §19 / ordering μ′. The Greek chain is `...θ′(§15) → ι′(§16) → κ′(§17) → λ′(§18)`. μ′ is the correct *next* letter (λ → μ), so the discipline is internally consistent in *intent* — but the document that is "the only execution-order document spanning both repos" (`CANONICAL-ORDERING.md:6`) has not been updated to author μ′ for J. J's own completion criterion requires "CANONICAL-ORDERING → ordering μ′" (`fourier J.md:44`), so this is a W0 intake obligation that is currently unmet at authoring.

**This is expected-but-must-be-booked:** J is AUTHORED-not-opened (`fourier J.md:7`), and W0 is where "CANONICAL-ORDERING → ordering μ′" lands (`PROGRESS.md:17`). So μ′ being unwritten is consistent with "awaits Begin." The finding is: the chain head must gain a §19/μ′ section at W0 open, and no J close can cite μ′ until it exists (inv-27 evidence discipline). The letter choice (μ′) is correct.

**Verdict Q6: the ordering-LETTER (μ′) is the correct next letter and is consistently named in the J plans; but it is unwritten in CANONICAL-ORDERING — a W0 obligation that must be discharged at open and cannot be cited as evidence until it exists.**

---

## Fold-recommendations (forward tranche / W0 intake)

1. **[A1-1, P1] Author the A3 substrate OR re-cite the real substrate at W0.** The plan's binding seed `docs/constellation/next/audit/A3-fourier-valuejs.md` does not exist. W0 audit intake must either produce it (the asymmetry is fully reconstructable + file-verifiable) or replace every `A3 §N` citation with the live-code asymmetry (`cursors.py:21`, `forks.ts`) + `I/FINAL.md`. Fold into **W0**.
2. **[A1-2, P1] Write §19 / ordering μ′ into CANONICAL-ORDERING at W0 open.** The chain ends at §18/λ′; J's close criterion cites μ′ which does not yet exist. Fold into **W0** (the same wave that re-confirms the I close).
3. **[A1-3, P2] Seed the value.js-J atom-diff `ADOPTION-ASKS` entry before asserting it booked.** `ADOPTION-ASKS.md §6` carries no value.js-J/atom-diff/remix entry; J.md:95 asserts it as "NAMED, file-verified." Either seed it at W0 (PROGRESS.md:17 already lists this as a W0 action) or soften the present-tense assertion in J.md §6 to "to be seeded at W0." Fold into **W0**.
4. **[A1-4 + Q5, P2] Drop the vestigial 6-wave-spine mapping; present J as CORE + leaves + close.** The spine frame is an I-era inheritance that forces the §4.1 CSS-platform category-shuffle. Re-present §4 as "CORE (W1→W2) + 4 consumer-backed leaf wins + close" and reduce §4.1 to the one honest refute (anchor/forms — glass-ui-owned) + the one honest re-slot (content-visibility → CWV). Fold into **W1 design / charter cleanup**.
5. **[A1-5, P2] Fix value.js-J §0 wave-labels to match the §3 table.** `value.js J.md:26-30` labels VAL-9 as "J.W1" (it discharges at W4); the design wave is W1. Correct the bullet headers. Fold into **value.js-J W0/W1**.
6. **[A1-6, P2] Book or relocate the four `WC-design-*` docs.** They sit in `fourier J/design/` referenced by no wave. Either add a WC design-refinement wave/residual to the plan, or move them out of the active tranche dir with a disposition note. Fold into **W1 / charter**.
7. **[A1-8, NIT] Add one sentence reconciling the 8-vs-6 wave-count asymmetry** in each repo's §cohort/§9 coordination. Fold into **W0/charter**.
8. **[A1-7, NIT] Fix the `cursors.py:17,21` → `cursors.py:21` citation** (line 17 is the `SortKey` Literal, not the mapping). Fold into **W1 design doc correction**.
