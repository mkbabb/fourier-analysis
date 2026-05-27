# Wχ-P3 — CRUD-cohesion KISS (no shared framework, no codegen, inv-16)

**Probe**: P3 of 5 (per `waves/Wchi.md §3.3`).
**Charter (verbatim from Wchi.md §3.3 Subject)**: "the W5 plan — re-author `CRUD-CONTRACT v2.0.0` with two KISS relaxations (§2 admits user-supplied slugs; §0 binds behaviour not module layout); fourier-side is light (re-author + flip ~88 DEFERRED matrix cells); value.js-side is heavy (the I.W1–W4 sketch, user-re-mandate-gated). The Wα-R1 ratification confirmed the DA3 + CRUD-COHESION findings hold. **Invariant 16 forbids a shared framework / codegen / coordinator**".
**Mode**: read-only adversarial. No source touched, no other wave-spec touched. Sole write path: this file.
**Date**: 2026-05-27.

---

## §0 — Method and live-tree probes (read-only)

The probe interrogates the v2.0.0 cohesion thread for **shared-code shapes** — a typed-shapes package both repos consume, a code-generator, a coordinator service. Each check below produces an evidence row anchored to a `file:line` or a pasted command output.

### Probe-0 — fourier-D coordination grep

```
$ git grep -nE "crud-contract|shared-types|@mkbabb/crud" -- docs/tranches/D/coordination/
(no matches)
```

The phrase `crud-contract` occurs in fourier-D docs only as the **noun "CRUD-CONTRACT v2.0.0"** (a document title, in `coordination/CRUD-COHESION.md §3` and `waves/W5.md`). No reference to a `crud-contract-v2-types.json`, `@mkbabb/crud-types` npm package, or PyPI package both repos import.

### Probe-0a — fourier-D wave-spec grep (broader)

```
$ git grep -nE "crud-contract|shared-types|@mkbabb/crud" -- docs/tranches/D/
docs/tranches/D/waves/W5.md:5: ... (doc-noun mention only)
docs/tranches/D/waves/Wchi.md:146: ... (verbatim probe-text mention only)
```

Only documentary mentions of the **contract title**; no instrumental shared-package reference.

### Probe-0b — value.js sibling repo grep

```
$ cd /Users/mkbabb/Programming/value.js && git grep -nE "crud-contract|fourier-types|@mkbabb/crud" -- src api
(no matches)
```

The live value.js HEAD (`16129e0`, v0.10.0) carries **zero** references to a fourier-typed or shared-CRUD package. `value.js/api/src/` consists of `models.ts`, `routes/`, `services/`, `repositories/`, `middleware/`, `errors/`, `events/`, `validation/`, `format/` — Hono/Zod/MongoDB stack, no shared-types import.

### Probe-0c — value.js published exports

```
$ jq '.exports' /Users/mkbabb/Programming/value.js/package.json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/value.js",
    "default": "./dist/value.js"
  }
}
$ grep -nE "sampleToSVGPath|cubicBezierToSVG" /Users/mkbabb/Programming/value.js/src/{math.ts,index.ts}
src/math.ts:69: export function cubicBezierToSVG(x1: number, y1: number, x2: number, y2: number) {
src/index.ts:170:    cubicBezierToSVG,
```

`sampleToSVGPath` is **NOT** in v0.10.0's published exports. Only `cubicBezierToSVG` exists. The colour-lift consequently rides as a NAMED RESIDUAL (the swap branch is contingent and does not fire at W5).

---

## §1 — Check 1: Two relaxations as contract-behaviour, not framework-coupling

**Authority probed**:
- `docs/tranches/D/coordination/CRUD-COHESION.md §3` (the two relaxations).
- `docs/tranches/B/coordination/CRUD-CONTRACT.md` (v1.0.0 substrate).
- `docs/tranches/D/waves/W5.md §2.1–§2.2` (the concrete amendments).

**Evidence**:

`CRUD-COHESION.md §3` records the relaxations as **behaviour binds, not module binds**:

> 1. **§2 admits user-supplied slugs** — the original §2 over-specified to fourier's `coolname`/4-word accident; value.js's human-named palettes are legitimate. Cohesion binds slug *identity* (one human-readable slug, unique, no hash), not the word-count.
> 2. **§0 binds behaviour, not module layout** — value.js keeps its service+repository+events architecture; the contract binds the observable CRUD behaviour (identity, visibility, soft-delete, the SOTA envelopes), not fourier's `api/lib/crud/` file shape.

`W5.md §2.1` records the concrete §0 amendment text:

> Add a §0.4 "Module-layout neutrality" clause: "This contract binds the observable CRUD behaviour at the HTTP boundary — wire shapes, header semantics, error envelopes, idempotency semantics. It does NOT bind the per-language module layout that produces them. fourier's `api/lib/crud/` utility-module layout is one valid implementation; value.js's `api/src/{services, repositories, errors, events, middleware}` is another. Both conform when their wire-level behaviour matches §1–§8. **Invariant 16 (no shared framework, no codegen) holds.**"

`W5.md §2.2` records the §2 slug amendment text — both modes (server-generated, server-validated-user-supplied) "MUST handle collision via insert-then-catch" — a behaviour rule, not a shared-utility rule. fourier keeps `api/lib/crud/slugs.py`; value.js keeps `api/src/repositories/...`; neither imports the other's utility.

**Probe-0/0a/0b** (above) confirm no shared `crud-contract-v2-types.json`, no `@mkbabb/crud` package, no cross-repo import.

`B/coordination/CRUD-CONTRACT.md` (v1.0.0) substrate at `:178-208` already rejected shared frameworks/codegen/coordinator under invariant 16:
- `:195` "Shared CRUD framework (BaseCRUDRouter, CRUDMixin, lifecycle inversion, 'register-your-entity' patterns). Reject: control inversion is the rot pattern invariant 16 was always aimed at"
- `:204` "Codegen (OpenAPI → client SDK; a `crud-types` shared package compiled to both Python and TS). Reject: invariant 16 explicit prohibition; the contract is text."
- `:207` "A third coordinating service (Redis for rate-limit state, NATS for cron fanout, etc.). Reject: invariant 16, 'no superfluous-cloud systems'."

v2.0.0 inherits this stance — `W5.md §2.1`'s explicit "Invariant 16 (no shared framework, no codegen) holds" line is the inheritance re-certification.

**Verdict**: PASS. The two relaxations are **purely contract-behaviour binds**, not framework couplings. The v2.0.0 draft does **NOT** introduce a shared `crud-contract-v2-types.json` or a `npm/PyPI` package both repos import. Probe-0/0a/0b confirm absence of cross-repo shared-types code in both trees.

---

## §2 — Check 2: §10 close-rule preserved with three-way disposition; per-repo matrix flip

**Authority probed**:
- `docs/tranches/D/coordination/CRUD-COHESION.md §6.1` (the v2.0.0 §10 close-rule reinterpretation per H3).
- `docs/tranches/D/waves/W5.md §2.4` (the cell-flip protocol) + `§5 G2/G3` (per-cell verification gates).

**Evidence**:

`CRUD-COHESION.md §6.1` records the **three-way disposition** that replaces the v1.0.0 binary "both columns PASS":

> The v1.0.0 contract's §10 close rule was a literal binary "both columns PASS." v2.0.0 reinterprets it as a **three-way dispositioning**: every DEFERRED cell is named as **ADDRESSED** (value.js already conforms today — flip to PASS), **DEFERRED-TO-VALUE.JS** (the cohort-reopen path; a value.js alignment-tranche resolves it; recorded here as the cross-repo ask), or **RETIRED-AS-OVER-SPEC** (the clause was over-specified to fourier's accident — relaxed per the two KISS relaxations of §3). The close rule becomes "every cell named with one of the three dispositions; **DEFERRED-TO-VALUE.JS is the cohort-reopen path, not a fail**." This is what makes cohesion KISS-honest without forcing a shared framework (inv-16).

`W5.md §3.5 (cell-flip arithmetic)` quantifies the disposition:
> ~8 ADDRESSED + ~2 RETIRED-AS-OVER-SPEC + ~78 DEFERRED-TO-VALUE.JS. **No cell flips PASS that value.js does not actually pass today.**

**Per-repo matrix flip mechanism** (W5.md §2.4 + the W5 charter): fourier's column is flipped by reading value.js source (`value.js/api/src/**:LINE` citations) — a **read-only audit**, not a code-share. value.js authors its own conformance suite at `value.js/api/test/conformance/**` (per `DA3 §5` I.W4 sketch) and its column flips on its own suite. Neither repo's flip depends on cross-repo code import — only on:
- fourier reading value.js source (the ADDRESSED citation pattern).
- value.js writing its own tests (the I.W4 wave, in a separate value.js tranche).

The contract is **text**; the matrix is a **doc**; the suites are **per-repo**. No cross-repo CI is implied; no shared test harness; no shared assertion library.

`W5.md §5 G2` enforces this honestly: "Each ADDRESSED cell carries a `cite: value.js/api/src/<path>:<line>` evidence row — fourier verifies by reading value.js source... a 'PASS' cell where value.js's code does NOT conform today is **invalid**."

**Verdict**: PASS. The §10 close-rule is preserved as a per-repo three-way disposition. The matrix flip mechanism is independent-per-repo (fourier flips its column on its own conformance suite + audited reads of value.js source; value.js will flip its column on its own future conformance suite). No cross-repo code sharing.

---

## §3 — Check 3: `palette_slug` FK by SHAPE + EXISTENCE (not by code-sharing)

**Authority probed**:
- `docs/tranches/D/research/README.md` R1 (the binding FK clause).
- `docs/tranches/D/waves/W5.md §1.1` + `§2.3` (the §13 cross-repo FK contract amendment).

**Evidence**:

`research/README.md R1` carries the ratified FK clause verbatim:

> **Fourier (the FK holder) guarantees**:
> - `Visualization.palette_slug: str | None` — nullable...
> - When non-`None`, the slug conforms to `^[a-z0-9][a-z0-9-]*$` with length ≤ 120.
> - Uniqueness is **within the `visualization` document scope only** — fourier stores the slug as an *opaque foreign key*; uniqueness within the *palette space* is value.js's invariant.
> - Fourier does **not** validate that the slug resolves at write time (no cross-repo round-trip on `POST /visualizations` or `PATCH /visualizations/{slug}`)...
>
> **Value.js (the palette source-of-truth) guarantees**:
> - `GET /palettes/{slug}` returns HTTP 200 with the palette envelope iff (a) the palette exists and (b) it is visible to the caller.
> - Returns HTTP 404 in all other cases. Never returns 403 (visibility-denied palettes are indistinguishable from missing).
> - The slug in the URL is the **stable identity** — no hash, no version suffix, no DB `_id` in the path.
> - Slug uniqueness within the palette space is enforced via a Mongo unique index on the value.js side.

> **Cross-repo invariant**: the FK is *resolve-only*, not *enforce-at-write*. Fourier never reaches across to value.js on the write path; value.js never reaches across to fourier. Only cross-repo traffic is the read-side (fourier's frontend fetches `GET /palettes/{slug}`). This orthogonality is the load-bearing KISS property.

**Both halves are shape + existence**: fourier binds shape (`^[a-z0-9][a-z0-9-]*$` ≤ 120) at write-time; value.js binds existence at read-time (200/404 from `GET /palettes/{slug}`). **No shared HTTP client, no shared validation library, no cross-repo TypeScript type import.** Fourier validates with its own pydantic regex; value.js validates with its own zod regex. The two regex strings happen to coincide (the v2.0.0 relaxation chose value.js's shape as the shared shape-floor) — coincidence of *text*, not coincidence of *code*.

`W5.md §2.3` (the §13 amendment) inscribes this in the contract text:

> §13 — Cross-repo FK contract. fourier's `visualization` entity carries an optional `palette_slug: str | None` field ... that references a value.js palette. The FK is **opaque-by-slug**: fourier stores a validated slug, never a hash, never a URL substring, never the `palette.id` top-level field; value.js's `GET /palettes/:slug` is the resolution path; the slug is the lookup key. fourier does NOT cross-service-validate at write-time (no synchronous resolve call) — KISS, invariant 12. ... The contract binds the *shape*; the *resolution* policy is per-app.

`W5.md §1.1` adds the unresolvable-FK degradation policy:
> The reference is *opaque-by-slug* — fourier does NOT validate the slug exists on the value.js side at write-time ... the eventual-consistency hand-off lives at read-time.

`R1 §C4.5/C4.6 disposition`: even the visibility-transition guard (the lone clause that could imply a state-machine code import) is dispatched as **W3 (γ-thread)** — a fourier-internal router-local code change with **no wire-shape change**. The contract records *which* transitions are allowed in the matrix as a post-hoc fill; *enforcement* is fourier-side only.

**Verdict**: PASS. The `palette_slug` FK is bound by SHAPE (fourier's regex + length floor) + EXISTENCE (value.js's `GET /palettes/{slug}` 200/404). No shared HTTP client, no shared validation library, no shared TypeScript type. The two repos meet at the wire, not in the code.

---

## §4 — Check 4: Colour-lift orthogonal to the cohesion thread

**Authority probed**:
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md §4` (the orthogonality framing).
- `docs/tranches/D/waves/W5.md §1.4` (the verified-at-harden grep).
- `docs/tranches/D/coordination/CRUD-COHESION.md §5` (the orthogonal-sub-item record).

**Evidence**:

`DA3 §4` carries the load-bearing framing verbatim:

> **Note**: the inverted δ edge is a **library** (`@mkbabb/value.js` at 0.10.0) concern, *orthogonal* to the **palette-api** (v2.0.0) CRUD cohesion this lane audits. They are two distinct value.js surfaces: the npm-published colour library vs the in-repo deployed backend. The δ edge touches `value.js/src/`; the CRUD cohesion touches `value.js/api/src/`. A cohesion D-tranche should keep them as **separate threads** (do not entangle the one-function colour lift with the multi-clause backend alignment).

`CRUD-COHESION.md §5` records the same separation:
> The inverted δ edge from C (`coordination/COLOUR-LIFT.md`) — value.js publishes `sampleToSVGPath` in `src/math.ts`, fourier consumes in `easings.ts` — is **orthogonal** to this backend cohesion (it is `value.js/src/`, the library; the cohesion is `value.js/api/`, the service). It rides as a bounded D.W5 sub-item, fired iff value.js publishes; else it stays a named residual (value.js v0.10.0 does not export it).

**Probe-0c** (above) re-verified at this probe:
- `value.js/package.json` v0.10.0 exports `./dist/value.js` (the bundled library).
- `value.js/src/index.ts:170` exports `cubicBezierToSVG`.
- **No export of `sampleToSVGPath`** — neither in `src/math.ts` (only `cubicBezierToSVG` at `:69`) nor in `src/index.ts`.

The lift touches `value.js/src/` (the library), NOT `value.js/api/` (the backend). The two surfaces are inhabit-disjoint in the file tree.

`W5.md §1.4` records the same verification done at Wχ harden:
> `grep -rn "sampleToSVGPath" ~/Programming/value.js/src/` at HEAD (value.js HEAD `16129e0`, `package.json:3 "version": "0.10.0"`) → **NO MATCH**. Only `cubicBezierToSVG` exists at `value.js/src/math.ts:69`. ... The named-residual branch is the *expected* outcome; the swap-branch is the *contingent* fire-iff. **W5 verifies the grep AGAIN at dispatch** (not at this harden) — the gap between this harden and W5 dispatch may see value.js publish; the verification at dispatch decides.

The colour-lift is **bounded**: a single-line swap at `web/src/lib/easings.ts:89` + a `web/package.json` version bump, **iff and only iff** value.js publishes `sampleToSVGPath`. The cohesion thread does NOT entangle the multi-clause CRUD work with the one-function library lift.

**Verdict**: PASS. The colour-lift is orthogonal to the CRUD cohesion thread, touches `value.js/src/` (library) not `value.js/api/` (backend), is currently a NAMED RESIDUAL because v0.10.0 does not export `sampleToSVGPath`, and is bounded to one fourier-side import-change if it ever fires.

---

## §5 — Check 5: No new shared-host artefact emerges

**Authority probed**: `docs/tranches/D/waves/W5.md §3` (file bounds) + the deliverable enumeration in `CRUD-COHESION.md §4` + the W5 hard-gate ledger `§5`.

**Evidence**:

W5's deliverables (per `W5.md §3` "File bounds"):

| File | Action | Locale |
|---|---|---|
| `docs/tranches/B/coordination/CRUD-CONTRACT.md` | edit (v1.0.0 → v2.0.0) | fourier-repo doc |
| `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md` | edit (cell dispositions) | fourier-repo doc |
| `docs/tranches/D/coordination/CRUD-COHESION.md` | edit (v2.0.0 specifics) | fourier-repo doc |
| `docs/tranches/D/coordination/VALUE-JS-ASK.md` | create (hand-off doc) | fourier-repo doc |
| `web/src/lib/easings.ts` + `web/package.json` | conditional swap (iff value.js publishes `sampleToSVGPath`) | fourier-repo source, one line |

`W5.md §3` explicit "Do NOT touch" list:
> `value.js/**` (out-of-bounds — fourier-D never edits value.js source...); `/home/mbabb/Programming/palette-api/**` (the standalone palette-api host repo — out-of-bounds...); `api/**` (W3 owns); `web/src/components/**` (W4 owns); `docker-compose*.yml` (W1/W2 own)

**No new shared container, no new shared DB, no new shared queue, no new shared API gateway, no new shared service.** The cohesion thread produces:
- A documentation contract (text).
- A documentation matrix (cell dispositions).
- A coordination ask (text).
- A hand-off doc (text).
- Optionally one fourier-side import-line change.

**Verdict**: PASS. The cohesion thread produces ZERO new shared-host artefacts. Every deliverable is either a fourier-repo doc edit, a fourier-repo doc creation, or a fourier-side single-line source change. The colour-lift, if it fires, consumes from value.js's existing npm export shape (it does not create a new shared package).

---

## §6 — Check 6: value.js-side execution is a separate value.js tranche

**Authority probed**:
- `docs/tranches/D/D.md §3 W5` row (the binding wave-table verbatim).
- `docs/tranches/D/waves/W5.md §3` (the file-bounds Do-NOT-touch).
- `docs/tranches/D/coordination/CRUD-COHESION.md §6` (the disposition).

**Evidence**:

`D.md §3 W5` row (verbatim):

> W5 — *CRUD-CONTRACT v2.0.0 + cohesion* | δ | 2-3 parallel | `CRUD-CONTRACT v2.0.0` ratified (the two KISS relaxations + the §10 close-rule reinterpretation per H3: every DEFERRED cell named); fourier **dispositions** the ~88 DEFERRED matrix cells against `palette-api` in **three categories** (ADDRESSED / DEFERRED-TO-VALUE.JS / RETIRED-AS-OVER-SPEC) — not a binary flip; the value.js alignment ask recorded in `coordination/`; the colour-lift (`sampleToSVGPath`) consumed iff value.js publishes (evidence-based grep at dispatch — currently absent → named-residual branch expected). **value.js-side execution is a value.js tranche** (user-re-mandate-gated) — D authors the fourier side + the cross-repo contract

Direct verbatim match for the P3 charter check: **"value.js-side execution is a value.js tranche (user-re-mandate-gated)"**.

`D.md §4` Phase IV row:
> Phase IV — cross-repo cohesion (W5). The contract v2.0.0; fourier-light; the value.js ask recorded.

`D.md §10` (cross-repo carries):
> `CRUD-CONTRACT v2.0.0` + the value.js alignment → **W5**; the value.js-side execution is a value.js tranche (user-re-mandate-gated). The colour-lift (`sampleToSVGPath`) is a bounded W5 sub-item.

`W5.md §3` "Do NOT touch":
> `value.js/**` (out-of-bounds — fourier-D never edits value.js source; the value.js-side execution is a *value.js tranche*, user-re-mandate-gated); `/home/mbabb/Programming/palette-api/**` (the standalone palette-api host repo — out-of-bounds; the provenance reconcile is Wα-R3)

`W5.md §3 G4`:
> VALUE-JS-ASK.md authored. `ls docs/tranches/D/coordination/VALUE-JS-ASK.md` exists; ... **It does NOT live in `value.js/`** (a `find ~/Programming/value.js -name "VALUE-JS-ASK*" -newer /tmp/_d_open_timestamp` returns ZERO).

**Note on W9.c**: W9 (`CF-Pages frontend migration`) includes a `W9.c value.js/color` arm that performs the GH-Pages teardown of the `color.babb.dev` demo. That is **frontend-deploy (α′ thread)**, not the CRUD cohesion (δ thread P3 is auditing). The δ thread (W5) explicitly does not touch any value.js source. The α′ thread's W9.c is a separate concern (CF-Pages migration) and does not implicate the cohesion-KISS audit.

**Verdict**: PASS. `D.md §3 W5` says verbatim "value.js-side execution is a value.js tranche (user-re-mandate-gated)". `W5.md §3` foredbids fourier-D from touching `value.js/**`. The cross-repo cohesion is achieved by *two independent tranches* meeting at a shared text contract — fourier-D authors the fourier side + the contract; the value.js side awaits user re-mandate as a value.js tranche.

---

## §7 — Summary table

| Check | Subject | Result | Evidence anchor |
|---|---|---|---|
| 1 | Two relaxations are contract-behaviour, not framework-coupling | PASS | `CRUD-COHESION.md §3` + `W5.md §2.1` "Invariant 16 holds" + Probe-0/0a/0b zero shared-types matches |
| 2 | §10 three-way disposition + per-repo matrix flip | PASS | `CRUD-COHESION.md §6.1` + `W5.md §3.5 cell-flip arithmetic` + `W5.md §5 G2` per-cell verification gate |
| 3 | `palette_slug` FK by SHAPE + EXISTENCE (no shared code) | PASS | `research/README.md R1` cross-repo invariant + `W5.md §2.3` §13 amendment text |
| 4 | Colour-lift orthogonal; v0.10.0 absent → named-residual | PASS | `DA3 §4` orthogonality + `W5.md §1.4` grep-NO-MATCH + Probe-0c v0.10.0 exports inspection |
| 5 | No new shared-host artefact | PASS | `W5.md §3` file bounds (docs + one optional fourier-side import) |
| 6 | value.js-side is a separate tranche | PASS | `D.md §3 W5` verbatim "value.js-side execution is a value.js tranche" + `W5.md §3` Do-NOT-touch `value.js/**` |

All six checks PASS clean against the v2.0.0 design. No shared-code shape surfaces. Invariant 16 (no shared framework/codegen/coordinator) is honoured.

---

## Verdict

**PASS-WITH-CONDITIONS**: the v2.0.0 cohesion plan preserves KISS-cohesion-as-contract (not cohesion-as-shared-code); invariant 16 holds across every check. The conditions below bind the load-bearing properties into W5's hard gates so the implementation cannot drift.

The six adversarial checks return:
- No shared `crud-contract-v2-types.json` package.
- No `@mkbabb/crud` npm/PyPI dependency.
- No cross-repo TypeScript / Pydantic type import.
- No shared HTTP client / validation library / assertion harness.
- No new shared container, DB, queue, or API gateway.
- The matrix flip is per-repo, evidence-based, three-way (ADDRESSED / DEFERRED-TO-VALUE.JS / RETIRED-AS-OVER-SPEC).
- The `palette_slug` FK is opaque-by-slug; meet-at-the-wire, not meet-in-the-code.
- The colour-lift is orthogonal, library-not-backend, currently a named residual (v0.10.0 lacks `sampleToSVGPath`).
- `D.md §3 W5` and `W5.md §3` both bind the value.js-side execution to a separate value.js tranche (user-re-mandate-gated).

The expected outcome (per Wchi.md §3.3) was PASS-WITH-CONDITIONS naming the inv-16 preamble re-certification, the per-repo matrix-flip discipline, the colour-lift carve, and the value.js-tranche carve. All four conditions hold; they are bound below.

## Conditions to bind

- **P3.C1** — v2.0.0 contract preamble re-certifies invariant 16 (no shared framework / no codegen / no coordinator). Concretely: the `§0.4 Module-layout neutrality` clause from `W5.md §2.1` must land in `B/coordination/CRUD-CONTRACT.md` verbatim, with the explicit closing sentence "Invariant 16 (no shared framework, no codegen) holds." Bound into **W5.G_inv16-preamble**.

- **P3.C2** — per-repo matrix flip discipline. fourier flips its column on its own conformance suite + audited reads of value.js source (`cite: value.js/api/src/<path>:<line>`); value.js's column flips on its own future conformance suite. No cross-repo CI harness, no shared assertion library, no shared mock fixtures. The `W5.md §5 G2/G3` per-cell verification gates (every ADDRESSED cell has a verified `value.js/api/src/**:LINE` citation; every DEFERRED-TO-VALUE.JS cell names the responsible `I.W<n>` wave; no cell silently flips to PASS) enforce this. Bound into **W5.G_per-repo-matrix-flip**.

- **P3.C3** — colour-lift bounded; gated on value.js publish. The W5 dispatch re-runs `grep -rn "sampleToSVGPath" ~/Programming/value.js/src/` at execution-time; iff match, the swap is a single-line change at `web/src/lib/easings.ts:89` + a `web/package.json` version bump; else NAMED RESIDUAL recorded in `PROGRESS.md`. The lift remains library-not-backend (touches `value.js/src/` only, never `value.js/api/`) and never carries any cohesion contract-shape change. Probe-0c confirms v0.10.0 currently lacks the export → the named-residual branch is the expected outcome. Bound into **W5.G_colour-lift-bounded**.

- **P3.C4** — value.js-side execution recorded as a separate value.js tranche (user-re-mandate-gated). fourier-D never edits `value.js/**` or `/home/mbabb/Programming/palette-api/**`. The W5 deliverable `D/coordination/VALUE-JS-ASK.md` is the hand-off brief authored on the fourier side (never landed in value.js's tree). The `W5.md §5 G4` check "find ~/Programming/value.js -name VALUE-JS-ASK\* returns ZERO" enforces the boundary. Bound into **W5.G_valuejs-tranche-gated** + the coordination ask in `D/coordination/CRUD-COHESION.md`.

---

**File created**: `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/D/audit/challenge-P3.md`
