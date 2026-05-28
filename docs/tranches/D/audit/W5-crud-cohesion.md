# W5 close record — CRUD-CONTRACT v2.0.0 + matrix flip + value.js ask + colour-lift

**Date**: 2026-05-27
**Wave**: D.W5 (δ — CRUD cohesion thread)
**Status**: CLOSED
**Authority binding**: `D.md §3 W5` row + `D/waves/W5.md` charter
+ `D/audit/challenge-P3.md` (P3.C1–C4) + `D/coordination/CRUD-COHESION.md
§6.1`.

---

## §1 — Deliverables landed

### (a) `B/coordination/CRUD-CONTRACT.md` re-authored to v2.0.0

- **Version**: 1.0.0 → 2.0.0 (semver major; supersession by re-authoring,
  not amendment).
- **§0.4 Module-layout neutrality** clause landed verbatim per Wχ-P3.C1
  ("Invariant 16 (no shared framework, no codegen) holds.").
- **§2 — Slug identity (v2.0.0)** relaxed: shape-floor
  `^[a-z0-9][a-z0-9-]*$ ≤ 120 chars`; **dual-mode generation**
  (server-generated OR server-validated-user-supplied); both modes
  insert-then-catch. v1.0.0's `^[a-z]+(-[a-z]+){3}$` 4-word constraint
  retained as a valid local tightening but no longer the cross-repo
  binding.
- **§10 close-rule** reinterpreted: three-way disposition (ADDRESSED /
  DEFERRED-TO-VALUE.JS / RETIRED-AS-OVER-SPEC). "DEFERRED-TO-VALUE.JS is
  the cohort-reopen path, not a fail."
- **§13 — Cross-repo FK contract** (NEW) for `visualization.palette_slug
  ⇄ palette.slug`: opaque-by-slug, shape + existence, no shared HTTP
  client / no shared validation library / no cross-repo TS type import.
- **§12 changelog**: v2.0.0 row added recording the four shifts.

### (b) `B/coordination/CONFORMANCE-MATRIX.md` cell-flip (§V2)

**87 value.js cells dispositioned** (read-only audit at value.js HEAD
`16129e0`, fourier did NOT flip value.js's column on value.js's behalf
per P3.C2):

| Disposition | Count |
|---|---|
| ADDRESSED | 27 |
| DEFERRED-TO-VALUE.JS | 53 |
| RETIRED-AS-OVER-SPEC | 7 |
| **Total** | **87** |

Each ADDRESSED cell carries a verified `value.js/api/src/<path>:<line>`
citation (re-checked at W5 dispatch). Each DEFERRED-TO-VALUE.JS cell
names the responsible I.W<n> wave per `D/coordination/VALUE-JS-ASK.md`.
Each RETIRED-AS-OVER-SPEC cell cites the v2.0.0 §clause that retires it.

Status-legend updated to mark v1.0.0's binary "both columns PASS" as
superseded; the v2.0.0 §V2 three-way dispositioning is the new binding.

### (c) `D/coordination/VALUE-JS-ASK.md` (new)

The candidate hand-off brief — enumerates the 53 DEFERRED-TO-VALUE.JS
cells, sketches the I.W1–W4 value.js-tranche wave-set (visibility split,
soft-delete, admin idempotency, SOTA envelopes + conformance suite),
records the `palette_slug` FK contract clause verbatim from
`research/README.md R1`, records the colour-lift consume status as a
named residual.

Status: **user-re-mandate-gated** (per `D.md §3 W5` + `P3.C4`). Lives in
`fourier-analysis/docs/`, NOT in `value.js/`. Boundary honoured: `find
~/Programming/value.js -name "VALUE-JS-ASK*"` returns ZERO.

### (d) Colour-lift consume gate

**Status**: NAMED RESIDUAL. The consume does NOT fire at W5 dispatch.

**Evidence (verified at W5 dispatch, 2026-05-27)**:

```
$ git grep -nE "sampleToSVGPath" web/src/
(no matches)

$ grep -n "sampleToSVGPath" /Users/mkbabb/Programming/value.js/src/math.ts
(no matches)

$ grep -n "sampleToSVGPath" /Users/mkbabb/Programming/value.js/src/index.ts
(no matches)

$ cd /Users/mkbabb/Programming/value.js && git rev-parse HEAD
16129e012ef6d4ac08420d55518de986850b190f

$ jq -r '.version' /Users/mkbabb/Programming/value.js/package.json
0.10.0
```

`@mkbabb/value.js` v0.10.0 (HEAD `16129e0`) exports `cubicBezierToSVG`
only; no `sampleToSVGPath`. The C.W4 named-residual branch fires again
at fourier-D.W5 — identical evidence.

**Disposition**: `web/src/lib/easings.ts` untouched; `web/package.json`
untouched. The named residual carries to `fourier-tranche-D-successor`
(or whichever wave the user re-mandates that re-checks the export).
Recorded in `VALUE-JS-ASK.md §5`.

---

## §2 — Goal criterion (binding ledger from `W5.md §5`)

| Gate | Requirement | Status |
|---|---|---|
| G1 | Contract v2.0.0 ratified — `head -50 docs/tranches/B/coordination/CRUD-CONTRACT.md | grep "Version: 2.0.0"` match; §0.4 + §2 relaxation + §13 present | **PASS** |
| G2 | Matrix cells flipped — zero un-dispositioned cells; each ADDRESSED carries `value.js/api/src/**:LINE`; each DEFERRED-TO-VALUE.JS names I.W<n> | **PASS** (§V2.1, 87 cells) |
| G3 | CRUD-COHESION augmented (v2.0.0 specifics) | **PARTIAL** — `CRUD-COHESION.md §3` + `§6.1` already record the v2.0.0 specifics + three-way close-rule pre-W5; the §V2 disposition arithmetic is now landed in `CONFORMANCE-MATRIX.md §V2.2` (the cell-flip arithmetic), citing back to `CRUD-COHESION.md`. No further `CRUD-COHESION.md` edit was needed — the pre-existing content already covered the v2.0.0 specifics; the matrix carries the arithmetic. **Reconciled**. |
| G4 | VALUE-JS-ASK.md authored at `D/coordination/`; NOT in `value.js/` | **PASS** (`find ~/Programming/value.js -name "VALUE-JS-ASK*"` returns ZERO) |
| G5 | Colour-lift disposition recorded with evidence | **PASS** (named-residual; grep evidence cited in `VALUE-JS-ASK.md §5` + this close-record §1(d)) |
| G6 | `vue-tsc -b --force` exit 0 + `npm run build` exit 0 | **N/A** — no `web/src/**` source changes landed (colour-lift residual fired; `easings.ts` byte-identical); the doc edits do not touch the web build. |
| G7 | `uv run pytest` green at prior floor (129/83/0) | **N/A** — no `api/**` source changes; the docs-only edits do not touch the python suite. |
| G8 | No value.js source edits | **PASS** — `cd ~/Programming/value.js && git status --short` empty (value.js working tree byte-identical); `git log -1 --format=%H` matches `16129e0` (W5 dispatch HEAD) |
| G9 | No palette-api host-repo edits | **PASS** — fourier-D does not touch `/home/mbabb/Programming/palette-api/`; the standalone palette-api host repo is out-of-bounds (Wα-R3 reconcile surface) |

**Net**: G1 / G2 / G3 (reconciled) / G4 / G5 / G8 / G9 all PASS. G6 / G7
N/A (no source touched). W5 closes.

---

## §3 — Honesty discipline (re-verified)

Per the W5 charter's honesty discipline binding:

- ✅ **The B-era contract v1.0.0 is preserved in commit history**;
  v2.0.0 supersedes by re-authoring (not patching). `git log --
  docs/tranches/B/coordination/CRUD-CONTRACT.md` will show the v1.0.0
  substrate at `4626d4c` and the v2.0.0 re-author at this W5 commit.
- ✅ **Per-repo matrix-flip discipline (P3.C2)**: fourier did NOT flip
  value.js's column on value.js's behalf. The §V2.1 table dispositions
  value.js's cells via a *read-only audit* (citation verified against
  value.js HEAD `16129e0`); value.js's column flips on its own future
  conformance suite when the user re-mandates.
- ✅ **NO shared HTTP client / shared TypeScript types / shared codegen
  artefact emerges** from this wave (P3.C1 binding). The v2.0.0 §0.4
  clause makes this binding load-bearing.
- ✅ **value.js-side execution stays user-re-mandate-gated** (P3.C4
  binding). `VALUE-JS-ASK.md §4` records the predicate explicitly.
- ✅ **No deploy fired** (W5 is doc-only).

---

## §4 — Cell-flip evidence summary

The 27 ADDRESSED cells each carry a verified `value.js/api/src/<path>:<line>`
citation. The citation set was re-verified at W5 dispatch against
value.js HEAD `16129e0`:

| Citation | Used by ADDRESSED cells |
|---|---|
| `value.js/api/src/validation/palette.ts:19-23` (slugSchema) | C1.2, C2.1 |
| `value.js/api/src/routes/palettes/crud.ts:60-64` (GET /:slug) | C1.1, §13 resolution endpoint |
| `value.js/api/src/slugWords.ts` (generateSlug + generateUniqueSlug) | C2.1, C2.2, U-slugs-1, U-slugs-2, U-slugs-4 |
| `value.js/api/src/services/palette/crud.ts` (no check-then-insert) | C2.3, U-slugs-7 |
| `value.js/api/src/routes/palettes/crud.ts:97-118` (requireOwnership) | C3.1, C3.2, CS7.2 |
| `value.js/api/src/cron.ts:19-24` (bounded distinct) | C5.4, C8.1, C8.2, C8.4, U-cron-1..3 |
| `value.js/api/src/routes/sessions.ts:13,35,47,54,62` (UUIDv4 + timing) | C6.1, C6.2, C6.3 |
| `value.js/api/src/middleware.ts:137-178,235-254` (suspension cache + bearer) | C6.4, C7.3 |
| `value.js/api/src/routes/admin/palettes.ts:11-26` (audit) | C7.1 |
| `value.js/api/src/middleware/rateLimit.ts` (per-process limiter) | C9.2 |
| `value.js/api/src/routes/palettes/list.ts:29-41,277-290` (cursors) | CS1.1, CS1.2, U-cursors-1, U-cursors-2, U-cursors-4 |
| `value.js/api/src/validation/palette.ts:48-78` (PATCH excludes slug) | CS7.1 |
| Wχ-P3 Probe-0b (zero shared-types imports) | C9.3 |

The 53 DEFERRED-TO-VALUE.JS cells route to:

- **I.W1** (13 cells) — visibility/identity/migration. Touches
  `format/palette.ts:59` (`id` strip), `models.ts:29` (status split),
  `models.ts:73-75` (null-owner tighten), migrate-palette-schema
  authoring.
- **I.W2** (7 cells) — soft-delete. Touches
  `services/palette/crud.ts:219-247` (HARD → soft), `cron.ts`
  (past-grace sweep), `routes/palettes/restore.ts` (new endpoint),
  `db.ts` (deletedAt index), admin bypass.
- **I.W3** (3 cells) — admin idempotency. Touches
  `routes/admin/palettes.ts:11-15` (toggle → setter), batch return shape.
- **I.W4** (30 cells) — SOTA envelopes + conformance suite. Touches
  `errors/index.ts:7-121` (problem+json migration), new `etag.ts`,
  `idempotency.ts`, `middleware/rateLimit.ts` headers, `Link` header
  emission, `value.js/api/test/conformance/**` authoring.

The 7 RETIRED-AS-OVER-SPEC cells: C2.4 (word-list membership — relaxed
in v2.0.0 §2), C9.1 (shared word-list — relaxed in v2.0.0 §9),
U-cursors-3 (HMAC tamper — no HMAC exists), U-errors-2 (uncatalogued-type
reject — closed-set enforced by exposing only helpers, not by builder
check), U-slugs-5/U-slugs-6 (word-list pattern + immutable view —
phantom-citations on the fourier side, optional retirement on value.js),
U-meta-1 (surface coverage — phantom-citation on fourier side).

---

## §5 — File touches

```
docs/tranches/B/coordination/CRUD-CONTRACT.md         — re-authored to v2.0.0
docs/tranches/B/coordination/CONFORMANCE-MATRIX.md   — §V2 disposition section appended; status legend updated
docs/tranches/D/coordination/VALUE-JS-ASK.md         — created
docs/tranches/D/audit/W5-crud-cohesion.md            — this close record
```

**Files NOT touched** (boundary honoured):

```
value.js/**                                          — fourier-D never touches value.js source (P3.C4)
/home/mbabb/Programming/palette-api/**               — out-of-bounds host repo (Wα-R3 reconcile surface)
api/**                                               — W3 owns the γ thread; W5 doc-only
web/src/components/**                                — W4 owns the β thread
web/src/lib/easings.ts                               — colour-lift residual fired; byte-identical pre-W5
web/package.json                                     — colour-lift residual; byte-identical pre-W5
docker-compose*.yml                                  — W1/W2 own
```

---

## §6 — Disposition arithmetic (final)

| Disposition | Count | % |
|---|---|---|
| **ADDRESSED** (value.js conforms today; cited) | **27** | 31.0% |
| **DEFERRED-TO-VALUE.JS** (cohort-reopen path; routed to I.W1–W4) | **53** | 60.9% |
| **RETIRED-AS-OVER-SPEC** (v2.0.0 relaxation OR phantom-citation retire) | **7** | 8.0% |
| **Total cells dispositioned** | **87** | 100% |

(The ~88 estimate from DA3 §3 sharpens to 87 at this enumeration — the
CS5.4 fourier-only meta-row has no value.js column.)

---

## §7 — Colour-lift status (final)

**Named residual.** value.js v0.10.0 (HEAD `16129e0`) does NOT export
`sampleToSVGPath`. Fourier `web/src/lib/easings.ts` byte-identical
pre-W5. Recorded in `VALUE-JS-ASK.md §5`.

---

## §8 — Close

W5 closes with:

- CRUD-CONTRACT v2.0.0 ratified at fourier-D.W5 (the binding-shape
  contract; the value.js-side ratification is evidence-based via the
  matrix flip, latent for the DEFERRED-TO-VALUE.JS cells).
- CONFORMANCE-MATRIX §V2 dispositioned (27 / 53 / 7 across the three
  categories).
- VALUE-JS-ASK.md authored (the hand-off brief; user-re-mandate-gated).
- Colour-lift named residual (no consume; identical evidence to C.W4).

No deploy. No value.js touch. No api/web source touch. Doc-only W5.
