# H6 — Cross-cutting hardening: precepts, format compliance, coherence

**Agent**: H6 (read-only, cross-cutting lane).
**Scope**: fourier-A · fourier-B · value.js-C, read against the shared precepts and the shared LESSONS-LEARNED ledger.
**Method**: precepts first (Core Rules, STYLE, CALIBRATION, overfitting-audit, AGENT_DISPATCH_TEMPLATE, DOC_UPDATE_WAVE), then the three tranche document sets, then cross-checks.
**Posture**: read-only. Every finding cites doc + line.

---

## 1 — Invariant inheritance graph + conflict ledger

### 1.1 Authoritative ancestry

```
value.js-A invariants 1–5  ──┐
                              ├──► value.js-B invariants B1–B5 (inherits A1–A5 unchanged)
                              │
                              └──► value.js-C: "inherits value.js-A's five invariants and value.js-B's five (B1–B5)…
                                              unchanged. From the cohort it additionally binds the four CRUD-specific
                                              invariants 14–17."
                                              (`value.js/docs/tranches/C/C.md:28-29`)

fourier-A invariants 1–13  ──► fourier-B "inherits all 13 of tranche A's invariants unchanged,
                                          and adds four CRUD-specific invariants 14–17."
                                          (`fourier-analysis/docs/tranches/B/B.md:29`)
```

### 1.2 Cohort invariants 14–17 — the cross-repo numbering

| # | Title | fourier-B | value.js-C |
|---|---|---|---|
| 14 | One converged entity per user-named noun | `B.md:31` | `C.md:30` |
| 15 | Domain model in the library, persistence in the app | `B.md:32` | `C.md:31` |
| 16 | Shared by contract before shared by code | `B.md:33` | `C.md:32` |
| 17 | Migration is verified, not hoped | `B.md:34` | `C.md:33` |

**Wording check.** All four are word-for-word coherent across the two repos; this is the intended cohort binding.

### 1.3 The numeric collision — *the principal conflict in the graph*

fourier-A numbers its invariants **1–13** (`A.md:32-44`). value.js-A numbers its invariants **1–5** (`value.js/docs/tranches/A/A.md:30-34`); value.js-B uses **B1–B5** (`value.js/B.md:29-33`).

value.js-C says it inherits "value.js-A's five invariants and value.js-B's five (B1–B5)… unchanged. From the cohort it additionally binds the four CRUD-specific invariants **14–17**." (`C.md:28-29`)

**The conflict.** value.js-C jumps directly from 5 (or B5) to 14, with no 6–13 in its sequence. The numbering 14–17 only makes sense in fourier's namespace, where 1–13 already exist. In value.js's own sequence, the cohort invariants are properly *6–9* — but the cohort document forces a single numbering across both repos. The choice (14–17 wins) is defensible (fourier authored the cohort doc; both repos cite invariants by their cohort number) but value.js-C never explains the jump. A reader of value.js alone meets `14. One converged entity…` with no prior 6–13.

**Fix.** value.js-C `§2 line 28-29` should add a half-sentence: *"the four CRUD-specific invariants are numbered 14–17 in cohort namespace (originating in fourier-A's 1–13 sequence, which fourier-B extends; this repo's local sequence is 1–5 + B1–B5 + cohort 14–17, leaving 6–13 reserved to fourier)."*

### 1.4 Other inheritance frictions

- **fourier-A inv. 11 "one identity scheme"** (`A.md:42`) is partially superseded by **cohort inv. 14** ("one converged entity per user-named noun"). Both repos cite both. A.md's "(A holds the line; tranche B converges the model)" parenthetical (`A.md:42`) is the resolution, but B.md never names the relation. Add one sentence at B.md §2.
- **fourier-A inv. 4 "substrate lands with its consumer"** is redundant with the precepts root rule "Substrate and consumer land together" (`precepts/README.md:8-9`). The redundancy is intentional per the "make them binding and numbered for this repo" framing (`A.md:30`), but the precept lists it again as inv. 5 ("Substrate with consumer", `instructions/README.md:17-18`), and again in LESSONS-LEARNED 2026-04-29 (`LESSONS-LEARNED.md:17-26`). Three statements of one rule across one repo's read-order is exactly the "duplicate before adding policy" KISS/DRY anti-pattern the precepts forbid (Core Rule 1). **Not a blocking conflict — but the cleanest fix is for A to delete its own inv. 4 and cite the precept directly.**
- **fourier-A inv. 13 "repo voice is deliberate"** is well-grounded in `feedback_style_archaic.md` (cited at `A.md:111`), and B/C inherit it. No conflict.
- **value.js-A inv. 5 "zero deferral at close"** and **fourier-A inv. 7 "no silent deferral"** state the same precept (`precepts/README.md:8` + `instructions/README.md:13-15` "no silent deferrals"). They do not conflict. value.js-C inherits both copies through inheritance; both copies say the same thing.

**Verdict**: the invariant graph is *substantively coherent*. The numbering jump (5 → 14 in value.js-C) is a documentation hole, not a substantive conflict.

---

## 2 — Core Rules compliance table

The eight precept Core Rules (`docs/precepts/README.md:3-17`), audited against the three plans.

| Rule | A | B | C | Notes / cites |
|---|---|---|---|---|
| 1. KISS / DRY (smallest rule preventing real failure) | PASS | PASS | PASS | All three thesis paragraphs argue KISS load-bearing: `A.md:26`, `B.md:25`, `C.md:24`. Minor redundancy noted in §1.4 (precept-restated invariants). |
| 2. Execute the plan (no stubs / shadow APIs / temporary layers) | PASS w/ one exception | PASS | PASS | A.W2 admits a "justified slider stub" for `buttons.css` (`A.md:54`, `W2.md:7`). This is permitted by the wave's per-rule disposition table and named explicitly; not a violation but flagged because the word "stub" appears in a hard gate. The replacement is the W3 button migration, named at `W2.md:14`. |
| 3. Substrate + consumer land together | PASS | PASS w/ a soft seam | PASS | B.W2 (value.js palette facility) executes in value.js-C's tranche, and fourier-B.W4 is the consumer; `B.md:44-46` and `coordination/CRUD-CONSTELLATION.md:104` document the seam as "the single hard cross-repo dependency." This is the precept's *named bounded* seam (`instructions/README.md:9-11`), not a violation. |
| 4. No overfitting (current consumer + evidence, or delete) | PASS | PASS | PASS | A.W4 names three deletions (`logo.ts`, `math-worker.ts`, `compute.py`) by LOC + zero-consumer scan (`A.md:21`, `W4.md:17`). B's `colors.ts` gut is the same pattern (`B.md:22`). C.W2 retires `formatPalette` per-field defaulting (`C.md:21-22`). |
| 5. Gates close on evidence (artefact, not narrative) | PASS | PASS w/ one soft gate | PASS | A's hard gates cite commands + artefacts throughout (`A.md:88-100`). B's tranche-level gates at `B.md:78-87` include `coordination/CRUD-CONTRACT.md is ratified and both repos cite it` — *ratification* is procedural, not an artefact. Acceptable because the document exists post-W1, but the gate should add "the document is present at path X" to bind to a deletion proof / file-exists artefact. C.W2's `Playwright re-probe green` is a runtime evidence gate per cohort inv. matched to value.js's A3 (`C.md:41`). |
| 6. Research findings are not plans until challenged | PASS | PASS (explicit) | PASS (joint) | A is post-six-agent-research (`A.md:9`) and W0 explicitly carries the mandatory challenge (`A.md:52`). B is research-first by design with Wα + Wχ before any implementation (`B.md:6, 41-42, 49`). C consumes the joint challenge (`C.md:6, 39`). |
| 7. Wave close updates docs before next wave opens | PASS w/ scope gap | PASS | PASS | See §6 below — the matrix is broadly compliant but several waves do not *name* which docs update. |
| 8. Repo-specific stays repo-specific | PASS | PASS | PASS | `instructions/README.md` (fourier) carries only the fourier-specific rules (`docs/instructions/README.md:1-18`); shared precepts are not restated. value.js side keeps its own. |

**Top violation**: none rise to a blocking precept breach. The closest is the redundant restating of inv. 4 ("substrate with consumer") across three layers (precept root, precept instructions, fourier-A inv. 4) — a soft DRY breach at the *meta* level. Resolution is one line of citation.

---

## 3 — Stub / shadow / silent-deferral scan

The precepts forbid (in plan documents) forward-references with no destination, "TBD" tokens whose resolution path is unclear, deferred items without a named tranche/wave, and language patterns like compatibility shim / temporary / fallback / legacy / optional opt-in.

| Hit | Location | Verdict |
|---|---|---|
| `Open commit: TBD (W0 authoring commit)` | `A.md:6` | **OK** — destination named (W0). Standard placeholder. |
| `Close commit: TBD (W6 close ceremony)` | `A.md:7` | **OK** — destination named (W6). |
| `Predecessor close: A — docs/tranches/A/FINAL.md (TBD)` | `B.md:4` | **OK** — destination is A's W6 close. |
| `Open: TBD (after A close)` | `B.md:7` | **OK** — destination named (A close). |
| `Shared contract … slug word-list (location TBD by Wχ)` | `B.md:69` | **OK** — destination is the joint challenge wave. The phrase "by Wχ" is a named tranche+wave resolution path. |
| `Open: TBD (after value.js-B close AND fourier-B's joint research+challenge close)` | `C.md:7` | **OK** — destination named. |
| `buttons.css reduced to zero or a justified slider stub` | `A.md:54`, `W2.md:7`, `W2.md:14` | **FLAGGED** — the word *stub* in a hard-gate string is a precept anti-pattern. The wave text says the residue is "minimal slider-only" (`W2.md:14`) and that W3 deletes it (`W3.md:23`, `W3.md:44`). The semantics are honest; the word choice contradicts inv. 2 ("no stubs"). Rewrite as "justified slider-only carve" or "minimal slider residue". |
| `image-blob-out-of-Mongo storage redesign — Wα research lane R4 decides whether it is admitted to B's scope or deferred; the default is C` | `B.md:102`, `research/README.md:50-51` | **OK** — destination is tranche C with a research-lane decision gate; default is named. |
| `Image-blob-out-of-Mongo storage redesign … tranche B's research wave (R4) decides` | `A.md:144-145` | **OK** — same destination as above; A and B agree. |
| `Infra beyond deploy-file hygiene: webhook CI/CD, MongoDB TLS, port standardization` deferred | `A.md:144`, `B.md:103` | **FLAGGED** — destination cited as "tranche C" in A (`A.md:142`), but C's `C.md` is the value.js peer tranche, not a fourier-side infra tranche. **There is no fourier-side tranche C yet authored**, and the infra carry has no fourier-side destination wave/tranche named. This is the closest thing to a silent deferral in the plan set: A says "deferred to tranche C", but C is the value.js CRUD tranche, not the fourier infra tranche. **Either rename the destination ("deferred to a future fourier infra tranche") or note that A.md is using "tranche C" to mean a generic next-in-letter, not the value.js cohort tranche.** |
| `the very legacy code the invariants forbid` | `B.md:114-115`, `research/README.md:58` | **OK** — naming a *prohibition*, not introducing legacy code. |
| `the LATER dual-read compatibility layer would be the very legacy code the invariants forbid` | `B.md:114-115` | **OK** — invoking prohibition by reference, not endorsing the pattern. |
| value.js's `formatPalette … defaulting fallback` | `C.md:21-22, 41, 69, 83` | **OK** — *the existing fallback in the repo is what C.W2 retires*; that is the precept-aligned use of the word. |
| `dual-read window? The latter is the very legacy code the invariants forbid unless research proves a clean cutover is impossible` | `B.md research/README.md:58` | **OK** — the research lane is asked to falsify the cutover. |
| `Maybe (W3)` brittleness in `breaking_changes_during_wave: maybe` | `B.md:110`, `C.md:109` | **OK** — provisional, to be confirmed/removed at challenge close. The SPEC permits a brittleness block (`tranche/SPEC.md:69-81`). |

**Top stub/deferral risk**: the fourier-side infra carry (`A.md:142, B.md:103`) cites "tranche C" with no fourier-side tranche C in existence. C is value.js's tranche. Either rename the destination or add a clarifying sentence ("a future fourier tranche, currently unnamed").

---

## 4 — STYLE / voice trim list

The repo voice is dense, archaic, and deliberate (`feedback_style_archaic.md`, A inv. 13 at `A.md:44`). The STYLE precept and CALIBRATION corpus name the lines: no editorialising, sparing em-dashes (one per paragraph), no epanorthosis ("not X, but Y"), no banned-word cluster (delve / tapestry / robust / leverage / pivotal / etc.), no hype-verb register.

### 4.1 Banned-word scan — clean

`grep -nE "stable|robust|comprehensive|leverage|delve|tapestry|underscore|seamless|ever-evolving|navigate the|in conclusion|landscape|pivotal|testament|in the realm of"` over the three plans + their wave specs returned only:

- `W1.md:67` "stable build" — clean ("stable" used in technical sense).
- `A.md:140` "stable human-readable handle" — clean (technical sense).
- `B.md:13` "stable human-readable handle" — clean (same).

No banned-cluster hits.

### 4.2 Em-dash discipline — *the principal style drift*

The STYLE precept allows em-dashes "permitted but sparing. … A paragraph carrying more than one em-dash is almost always over-punctuated" (`STYLE.md:84-86`).

Paragraphs in the plan set with **more than one em-dash**:

| File:para | dashes | Sample |
|---|---|---|
| `A.md:12` (the invariants list block) | 13 | inv. 1–13 each leads with `**Title** — definition`. Acceptable: each item is one bullet with one em-dash; the count is artefact of the block format. |
| `A.md:4` (§1 thesis opening) | 3 | "shipped real work through three glass-ui constellation tranches (O, P, Q) without once owning a plan folder. The cost is now visible and chronic: a 107-file glass-ui-v1.8.5 migration cohort has sat uncommitted across O, P, and Q — named 'working tree DIRTY — same in-flight refactor' at *every* constellation audit — and the repo has accreted…" — **the inner em-dash sandwich is parenthetical**, an N18 pattern (CALIBRATION N18). **Recommended trim**: split into two sentences. *"The cost is now visible and chronic. A 107-file glass-ui-v1.8.5 migration cohort has sat uncommitted across O, P, and Q, named 'working tree DIRTY — same in-flight refactor' at every constellation audit, and the repo has accreted…"* |
| `A.md:8` | 2 | "fourier and its sibling `@mkbabb/value.js` have each, independently, built the *same* CRUD facility in two languages — slug-addressed entities, sessions, admin moderation, a cleanup cron, MongoDB — and fourier's own CRUD surface…" — same N18 pattern. **Trim**: convert to a parenthesised list, not an em-dash sandwich. |
| `A.md:20` "Phase III — soundness (W4–W5)" | 2 | The first dash is heading-like and load-bearing (cohort with title); the second carries a parenthetical. Acceptable boundary case; not flagged. |
| `A.md:36` (cross-tranche debt list) | 3 | Three list bullets each lead `- **Cn** — text`. Acceptable: bullet items carry their own dashes. |
| `B.md:49` (§1 ¶2 "audit `e-crud-slug-valuejs.md` found…") | 4 | "five divergent identity schemes — human slugs, content hashes, uuid4, `imageSlug` keying — for what the user experiences as one thing: a saved visualization." **The two-dash sandwich is the N18 pattern** (CALIBRATION `N18`). **Trim**: ", which carry human slugs, content hashes, uuid4, and `imageSlug` keying," (replace the dash-sandwich with a comma-bound relative clause). |
| `B.md:51` | 3 | "That brief contains a trap. The naive reading — 'build a shared CRUD framework both apps import' — is overengineering." Standard sandwich. **Trim**: *"The naive reading ('build a shared CRUD framework both apps import') is overengineering."* — parens carry the gloss without the dash count. |
| `B.md:53` (item 1, ¶ on identity model) | 4 | "**fourier's identity model** — five schemes collapse to one `visualization` entity: one human-readable slug, a required `owner`, a `visibility` field (draft / unlisted / public), and soft-delete." The leading dash is load-bearing (definition). The mid-sentence dashes are absent — actually one dash here. **Re-count: 1 leading + interpolated punctuation appears as dashes in the encoding but is part of the embedded slash-list. False positive.** |
| `B.md:57` (cohort inv. 14 row) | 4 | "**One converged entity per user-named noun** — the noun a user saves and navigates to (fourier: `visualization`; value.js: `palette`) is one collection, one slug, one lifecycle. No parallel noun for…" Acceptable: rule-statement format. |
| `B.md:65` (Phase III sentence) | 3 | "fourier's consumers — stores, `draftStorage.ts`, `colors.ts`, the admin surface lifted in A.W5 — are re-pointed at the converged entity…" N18 pattern. **Trim**: *"fourier's consumers (stores, `draftStorage.ts`, `colors.ts`, and the admin surface lifted in A.W5) are re-pointed…"* |
| `C.md:13` | 5 | "every facility row exists in both repos in two languages: slug, sessions, admin, cron, hash, db wiring, middleware. fourier additionally hand-rolls colour logic in `web/src/lib/colors.ts` where value.js — *the colour library fourier already depends on* — ships `parseCSSColor`…" Sandwich + italicized gloss. **Trim**: italicise inline: *"where value.js (the colour library fourier already depends on) ships `parseCSSColor`…"* |

**Prose drift count**: approximately **8** paragraph-level em-dash sandwiches across the three plans where the dash carries a parenthetical that the CALIBRATION corpus's N5/N11/N18 entries name as the breach. The plans' archaic register *does not earn* extra em-dash slack; the precept (`STYLE.md:84-86`) is explicit.

### 4.3 Editorialising / hype-verb register

- `A.md:46` "A introduces ZERO brittleness windows" — the uppercase ZERO is editorial. **Trim**: *"A opens with no brittleness window."*
- `B.md:25` "B is the architectural transposition tranche A deliberately declined to attempt. It composes because it has one root: two repos, and one repo internally, grew the same facility without a plan to hold it. B is that plan." Three short sentences, last one repeats. The last sentence reads as outline-closer (cf. CALIBRATION N12). **Trim**: drop "B is that plan." The first two sentences carry the claim; the third is rhetorical.
- `A.md:26` "Every A change composes because they share one root: the repo never had a plan to hold its architecture, so each surface drifted independently. A is that plan." Mirror of B.md:25. Same trim.
- `C.md:24` "two languages is the honest description of the system" — close to editorial; clean by margin.

### 4.4 Epanorthosis ("not X, but Y") — clean

`grep -nE "not just .* but|not .{1,30} but"` returns no hits across the three plans. (The plans use the construction-free, declarative register the precept rewards.)

### 4.5 Outline-shaped closers

None found. The plans close on §-numbered sections that name what they contain (cross-tranche debt, brittleness window). This is exactly the P10/P11 (precepts-edicts cadence) pattern the CALIBRATION corpus rewards.

---

## 5 — Constellation / coordination citation audit

### 5.1 fourier-A `coordination/CONSTELLATION.md`

| Claim | Cite | Verdict |
|---|---|---|
| glass-ui pin `v1.8.5` (`7e2e385`) | `CONSTELLATION.md:14` | **UNVERIFIED in this audit** — not in scope for H6. |
| `M.W0 / M.W1-C` landed `301a95e` | `CONSTELLATION.md:22` | Plausible (recent git log shows `301a95e`). |
| `P CR-2 / P.W5-Lane-B` landed `4df1a06` | `CONSTELLATION.md:23` | Plausible (`4df1a06` in recent git log). |
| **`A close (W7)`** at `CONSTELLATION.md:54` | line 54 | **BROKEN CITATION** — A's actual wave table ends at **W6** (`A.md:50-58`). "A close (W7)" is a stale reference to an older wave count. The wave was re-scoped 8 → 7 at authoring (`PROGRESS.md:27` records the renumber). **Fix**: change `W7` → `W6` at `CONSTELLATION.md:54`. |
| `A.W6` (B does not begin until W6) | `CONSTELLATION.md:44` | **OK** — consistent with A.md:58. |

### 5.2 fourier-B `coordination/CRUD-CONSTELLATION.md`

| Claim | Cite | Verdict |
|---|---|---|
| value.js peer is tranche C | `CRUD-CONSTELLATION.md:13` | **OK** — verified against `value.js/docs/tranches/C/C.md:1`. |
| Joint research artefacts at `~/Programming/fourier-analysis/docs/tranches/B/research/R{1..6}-*.md` | (referenced from C side: `value.js/.../C/coordination/CRUD-CONSTELLATION.md:19`) | **NOT YET REALISED** — the directory `docs/tranches/B/research/` exists and contains only `README.md` (the lane scope). R1–R6 deliverables do not yet exist. Coherent with `B.md` being a research-first opening plan; the citation is forward-looking, not broken. |
| **Timing diagram arrow** at `CRUD-CONSTELLATION.md:97`: `fourier-B.W4 ────── consumes ─────►    value.js-C.W3 (demo wiring)` | line 97 | **INCONSISTENCY** — the prose immediately after at line 104 says "**fourier-B.W4 → value.js-C.W1 published** is the single hard cross-repo dependency." The arrow points at C.W3 (demo wiring); the text names C.W1 (library Palette publish). The intended dependency is *fourier-B.W4 consumes the value.js npm bump that lands at C.W1 close*; the diagram arrow should point at C.W1, not C.W3. (The value.js-C mirror at `value.js/.../C/coordination/CRUD-CONSTELLATION.md:80` carries the same arrow at the same coordinates — the mirror is faithful, but inherits the error.) **Fix**: redraw the arrow from `fourier-B.W4` to `value.js-C.W1 published`. |
| **"This document is owned by fourier-B and mirrored in citation by value.js-B"** | `CRUD-CONSTELLATION.md:107` | **BROKEN CITATION** — should be **value.js-C**, not value.js-B. value.js-B is the close-A-and-simplify tranche; the cohort peer is value.js-C (this is correctly named everywhere else in the doc). **Fix**: s/value.js-B/value.js-C/ at line 107. |

### 5.3 value.js-C `coordination/CRUD-CONSTELLATION.md`

| Claim | Cite | Verdict |
|---|---|---|
| Authoritative cohort binding at `~/Programming/fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md` | `C-CRUD.md:5` | **OK**. |
| `Shared contract artefact … (ratified fourier-B.W1, value.js sign-off)` | `C-CRUD.md:18` | **OK** — consistent with fourier-B.W1 (`B.md:43`). |
| Mirror timing diagram inherits the W3-vs-W1 arrow inconsistency | `C-CRUD.md:80` | **MIRROR INHERITS UPSTREAM ERROR** — fix at fourier source, then mirror. |
| Mirror authority sentence is correctly worded (no value.js-B / value.js-C swap) | `C-CRUD.md:91` | **OK**. |

### 5.4 Other cross-references

- `B.md:5` says "value.js-B is already in flight at 2026-05-18 as 'Close A, simplify, complete the AND' with a non-CRUD thesis" — verified against `value.js/docs/tranches/B/B.md:1, 6`.
- `B.md:24` "value.js — *the colour library fourier already depends on*" — verified against `MEMORY.md` ("value.js (^0.4.6)") and `CONSTELLATION.md:14`.
- `C.md:13` "fourier-analysis/docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md" — the path is a forward reference; A.md:9 confirms the audit run directory exists with `{a..f}.md` artefacts. **NOT VERIFIED in H6** (audit artefact files not read in this lane), but the path scheme is consistent.

**Summary**: three broken citation items (one wave-number, one diagram arrow, one tranche-letter swap), all in fourier-A's and fourier-B's coordination docs. The value.js-C mirror carries one inherited error from fourier-B. All four are one-token edits.

---

## 6 — DOC_UPDATE coverage matrix

Per `DOC_UPDATE_WAVE.md`, every wave close must reconcile `PROGRESS.md`, wave status, parent wave-table status, `FINAL.md` (at close), and local lessons (if a reusable process incident).

| Wave | Names PROGRESS.md update? | Names wave-status update? | Names FINAL/CONSTELLATION/coord update? | Verdict |
|---|---|---|---|---|
| A.W0 | implicit (`A.md:52` close conditions; PROGRESS.md `Log` already shows it) | yes (table at A.md:52) | yes — `docs/precepts`/`docs/instructions` submodule wiring committed | **OK** |
| A.W1 | yes (`W1.md:24` lists `docs/tranches/A/PROGRESS.md` in file bounds) | yes | partial — does not name `CONSTELLATION.md` update although the cohort landing is the chronic-item closure named there | **MINOR GAP** — add `coordination/CONSTELLATION.md` update line. |
| A.W2 | not named | yes (status table) | no | **GAP** — `W2.md` does not name a PROGRESS.md update step. Wave bounds (lines 22-28) do not list PROGRESS.md. Add to bounds. |
| A.W3 | not named | yes | no | **GAP** — same as W2. |
| A.W4 | not named | yes | partial — `W4-deploy-note.md` is named as an artefact (W4.md:70) but PROGRESS.md update is not in file bounds | **GAP** — add PROGRESS.md update. |
| A.W5 | not named | yes | no | **GAP** — same. |
| A.W6 (close) | yes (`A.md:58`: PROGRESS.md reconciled, FINAL.md, DOC_UPDATE run, CONSTELLATION.md updated) | yes | yes | **OK** — close ceremony is fully specified. |
| B.W0/Wα/Wχ | partial — `B.md:42` "challenge close" produces hardened wave specs, but does not name PROGRESS.md update at each wave close | partial | no | **GAP** — the three planning waves need a doc-update bullet each. |
| B.W1–W5 | not named (provisional; will be specified at challenge close) | yes (table) | yes for W5 close (B.md:47) | **DEFERRED** — by design; the hardened wave specs at `waves/W*.md` will own this. Acceptable. |
| C.W0 | yes (`C.md:39` records value.js-B close + joint Wα/Wχ artefacts cited) | yes | yes (`coordination/CRUD-CONSTELLATION.md`) | **OK** |
| C.W1–W4 | provisional — same deferral as B | yes (table) | yes for W4 close | **DEFERRED** — by design. Acceptable. |

**Verdict**: A's W2/W3/W4/W5 wave specs do not list `PROGRESS.md` in their file bounds, although the precept makes the doc update a hard close condition (`DOC_UPDATE_WAVE.md:14-23`). All five waves *do* close green; the precept compliance is satisfied procedurally because the orchestrator runs DOC_UPDATE_WAVE at every close (`A.md:58` close gate). The fix is to add a one-line *"this wave's close updates `docs/tranches/A/PROGRESS.md`"* note in each wave's file-bounds table, mirroring W1.md.

---

## 7 — Overfitting candidates

Per `audits/overfitting-audit.md`, every public surface, helper, doc section, invariant, artefact must earn its place. The plans themselves are subject to this rule — sections that do not carry a load-bearing claim are overfitting.

| Candidate | Cite | Verdict |
|---|---|---|
| A.md §7 "Prompt and precept recap" (the 14-row table) | `A.md:104-122` | **STRONGEST OVERFITTING CANDIDATE** — the table is a defensive cross-reference to the user's feedback memory files and prior chats. Every row says either "Invariant N", "W*N*", or "(extracted to tranche B)". The information is already in §1 thesis, §2 invariants, §3 wave schedule, and §8 cross-tranche debt. This is the only section of A.md whose deletion would lose no claim — every row's content is restated elsewhere. **Recommended action**: delete §7 outright; the wave table + invariants + thesis already cover the same surface. KISS/DRY. The audit artefact `a-plan-archaeology.md` (cited at line 104) is the authoritative ledger; A.md need not duplicate it. |
| A.md §9 "Brittleness window" with body "None." | `A.md:148-149` | **MILD** — one-line section, two lines including header. The negation is informative (says the absence is deliberate, not omitted). Boundary case; keeping it is per the SPEC's "Brittleness Window" requirement (`tranche/SPEC.md:69-81`). Keep. |
| B.md provisional wave table W1–W5 | `B.md:43-47` | **OK** — explicitly named provisional and hardened post-challenge (`B.md:6, 49`). This is the precept-compliant shape for a research-first tranche. Not overfitting. |
| C.md §5 critical-files table | `C.md:60-74` | **OK** — refined at joint Wχ (named at line 60); load-bearing for W0 acquire-artefacts. |
| `coordination/CRUD-CONSTELLATION.md §Structural twins` table | `CRUD-CONSTELLATION.md:18-32` | **OK** — the table is the evidence base for the convergence thesis; deletion would unground the thesis. |
| `coordination/CRUD-CONSTELLATION.md §Timing` ASCII diagram | `CRUD-CONSTELLATION.md:71-102` | **MILD** — the diagram has one inconsistency (§5.2 above) and one "value.js-B" → "value.js-C" typo. Even fixed, it duplicates the sequence the prose at lines 104 + the wave tables already supply. **Boundary case**: keep if a future reader benefits from the ASCII; delete if textual sequence is preferred. Recommend keeping but fixing the two errors first. |
| `coordination/CONSTELLATION.md §Inherited from the glass-ui stream` table row "M.W0 / M.W1-C" with disposition "LANDED `301a95e` — A verifies clean at W0" | `CONSTELLATION.md:22` | **OK** — load-bearing: W0's challenge re-verifies the prior landings. |
| `A.md:9` "Mode: tranche development only at this open" | line 9 | **OK** — encodes user's directive verbatim ("This is tranche development only in this session." mirrored across all three plans). Load-bearing. |
| value.js-C's "value.js-C dispatches no own research wave — it joins fourier-B's joint wave" repeated at `C.md:6, 45, research/README.md:3` | various | **MILD redundancy** — the rule is stated three times. Acceptable: each occurrence has a distinct read-order context (header, §3 table close, research/README). Keep. |

**Strongest candidate for trimming**: **A.md §7** "Prompt and precept recap" (`A.md:104-122`) — fourteen rows, every row restates a §1/§2/§3/§8 commitment, and the authoritative ledger is `a-plan-archaeology.md`. Delete §7 outright; replace with a one-sentence pointer in §8.

---

## 8 — AGENT_DISPATCH compliance

The template (`tranche/AGENT_DISPATCH_TEMPLATE.md:5-46`) specifies a prompt shape: worktree, read-first list, scope, may-modify, may-read, do-not-touch, hard gate, return format, non-negotiables.

The wave specs in this set are not themselves dispatched prompts; they are wave *specifications* per `WAVE_SPEC.md`. The plans dispatch agents *from* these specs. The template applies to those dispatch prompts (not yet authored — A's W1/W2/W3/W4/W5 are planned, not dispatched). What *can* be checked is whether the wave specs carry enough information for a precept-compliant dispatch.

| Required dispatch element | Present in A.W1–W5 specs? |
|---|---|
| Worktree (implicit — repo root) | yes (implicit per fourier-only scope; explicit absolute path is a dispatch-time addition) |
| Read-first list | partial — wave specs name `c-style-consumer.md`, `d-style-glassui.md`, etc. by reference; a dispatch prompt would expand to explicit `Read first:` paths |
| Scope (numbered) | yes — `W1.md:11-15`, `W2.md:11-18`, `W3.md:11-21`, `W4.md:11-21`, `W5.md:11-21` |
| File bounds (modify / read / do-not-touch) | yes — `W1.md:18-24`, `W2.md:22-30`, `W3.md:24-30`, `W4.md:23-34`, `W5.md:24-32` |
| Hard gate (artefact-bound) | yes — every wave names a gate with artefacts |
| Per-agent sub-gate | yes — `Sub-gate:` lines under each `A.W*.x` unit |
| Verification artefacts | yes — every wave has a `## Verification Artefacts` section |
| Return format | not specified in wave specs (specified in template; the orchestrator will add it at dispatch time) |
| Non-negotiables | implicit via invariants; not restated per dispatch |

**Verdict**: the wave specs are *dispatch-ready* — an orchestrator can take any A.W*.x unit, paste it into the AGENT_DISPATCH_TEMPLATE, and emit a precept-compliant prompt. The template's `Return format` and `Non-negotiables` sections are not duplicated in the wave specs (correct — they are template-level, not wave-level).

**Sample check, A.W1.a**: filling the template:
- Worktree: `/Users/mkbabb/Programming/fourier-analysis`
- Scope: `W1.md:30-32` (mechanism + files + sub-gate)
- May modify: `web/src/components/**, web/src/composables/**, web/src/lib/**, web/src/style.css, web/index.html, web/src/App.vue` — clean
- Hard gate: `vue-tsc -b --force` exits 0; dev server renders every migrated route without console error — artefact-bound
- Non-negotiables: A inv. 2 (no stubs), inv. 4 (substrate with consumer), inv. 6 (gates close on evidence) — citable

Prompt would land in ~250 words, well under the template's "~700-word" mis-scoping threshold (`ORCHESTRATION.md:34`).

**No AGENT_DISPATCH compliance breach found.**

---

## Summary — verdict by lane

- **Invariant coherence**: substantively coherent (cohort 14–17 word-for-word, A's 1–13 inherited unchanged). One documentation hole — value.js-C's "5 → 14" jump unexplained. One soft DRY redundancy (A inv. 4 restates a precept root rule). No substantive conflicts.
- **Core Rules**: clean. The closest violation is the *meta*-DRY redundancy of restating "substrate with consumer" at three layers.
- **Stub/shadow/deferral**: clean except (a) the word "stub" in A.W2's hard gate (rephrase) and (b) "tranche C" in A.md/B.md referencing fourier infra carry, where C is the value.js cohort tranche (clarify).
- **STYLE**: ~8 paragraph-level em-dash sandwiches across the three plans where the dash carries a parenthetical (precept N5/N11/N18 breach). One "ZERO" all-caps editorial flourish in A.md:46. Two outline-closer "X is that plan." final sentences (A.md:26, B.md:25).
- **Constellation citation**: three broken one-token references — `W7` → `W6` (fourier-A CONSTELLATION:54); timing-diagram arrow `C.W3` → `C.W1` (fourier-B CRUD-CONSTELLATION:97; value.js-C mirror inherits); `value.js-B` → `value.js-C` (fourier-B CRUD-CONSTELLATION:107).
- **DOC_UPDATE coverage**: A.W2–W5 do not list `PROGRESS.md` in their file bounds (the orchestrator carries it via `DOC_UPDATE_WAVE`, but the wave specs should mirror W1.md and name it explicitly).
- **Overfitting**: A.md §7 "Prompt and precept recap" is the strongest deletion candidate — fourteen rows duplicating claims already in §1/§2/§3/§8, authoritative version at `a-plan-archaeology.md`.
- **AGENT_DISPATCH**: wave specs are dispatch-ready; no compliance breach.

---

## Top-line summary (≤400 words)

**Invariant coherence verdict: substantively clean.** The cohort invariants 14–17 are word-for-word coherent between fourier-B and value.js-C; the 13 fourier-A invariants pass to B unchanged. One documentation hole: value.js-C jumps from its native sequence (1–5, B1–B5) directly to cohort 14–17 with no narrative on the 6–13 gap — a half-sentence at `value.js/.../C/C.md:28-29` would close it. One soft DRY redundancy: fourier-A inv. 4 restates a Core-Rule the precept root already names; harmless but worth one citation-not-restatement edit.

**Top Core-Rule violation: none rises to a precept breach.** The strongest pressure is the *meta*-DRY redundancy of "substrate with consumer" stated at three layers (precept root, precept instructions, fourier-A inv. 4 — `precepts/README.md:8`, `instructions/README.md:17-18`, `A.md:35`). One-line fix: cite the precept; do not restate.

**Top stub/deferral risk: the fourier-side infra carry destination.** `A.md:142` and `B.md:103` defer infra (webhook CI/CD, MongoDB TLS, port standardization) to "tranche C." Tranche C is value.js's CRUD cohort tranche, not a fourier-side infra tranche, which does not yet exist. Either rename the destination ("a future fourier infra tranche, currently unnamed") or add a clarifying line. The risk is small (the carry is deferral by design), but the destination wording violates "named destination" in the strict reading.

**Prose drift count: approximately 8 paragraph-level em-dash sandwiches.** Locations: `A.md:4, 8`; `B.md:13, 49, 51, 65`; `C.md:13`; plus a CALIBRATION N18 cluster at `B.md`. Each is a parenthetical em-dash sandwich the STYLE precept (`STYLE.md:84-86`) names as over-punctuation. Also flagged: one editorial "ZERO" (A.md:46) and two outline-closer "is that plan" final sentences (A.md:26, B.md:25). No banned-word cluster hits; no epanorthosis.

**Strongest overfitting candidate: A.md §7 "Prompt and precept recap" (`A.md:104-122`).** Fourteen rows, every row restates a commitment already made in §1 (thesis), §2 (invariants), §3 (wave schedule), or §8 (cross-tranche debt). The authoritative ledger is the audit artefact `a-plan-archaeology.md` (cited at line 104). Recommended action: delete §7 outright; replace with a one-sentence pointer in §8. KISS/DRY at the plan-document level.

**Coordination-citation triage** (three one-token edits): `W7` → `W6` at `CONSTELLATION.md:54`; arrow `C.W3` → `C.W1` at `CRUD-CONSTELLATION.md:97` (mirror at `value.js/.../C/.../CRUD-CONSTELLATION.md:80`); `value.js-B` → `value.js-C` at `CRUD-CONSTELLATION.md:107`.
