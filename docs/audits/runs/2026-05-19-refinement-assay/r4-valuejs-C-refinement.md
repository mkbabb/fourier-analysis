# R4 — value.js-C refinement assay

**Author**: R4 (READ-ONLY refinement agent).
**Date**: 2026-05-26.
**Subject**: value.js cohort tranche C (the CRUD peer to fourier-B), authored 2026-05-18, planning-only through value.js v0.9.0 (D→E→F→G→H executed under different theses).
**Mode**: refinement-or-retire; refinement report only — no edits authored.

---

## §1 — value.js-C as-authored (snapshot)

Cohort tranche **C** in `~/Programming/value.js/docs/tranches/C/` was authored 2026-05-18
under the joint fourier-B/value.js-C cohort. Documents on disk:

- `C.md` (140 lines, last touched 2026-05-19 in U5 refinement round)
- `PROGRESS.md` (96 lines; final entry "U1–U6 utility-extraction refinement round")
- `coordination/CRUD-CONSTELLATION.md` (93 lines, value.js-mirror of the authoritative
  fourier-side binding)
- `research/README.md` (24 lines; "no own research; consumes joint Wα")
- `waves/W{1,2,3}.md` (provisional specs)

**Scope summary** (`C.md §3` wave table, U5-refined):

| Wave | Scope |
|---|---|
| C.W0 | open — acquire joint research + ratified `CRUD-CONTRACT.md` |
| C.W1 | library `Palette` at `src/palette/`; `colorScale`; `sampleToSVGPath` at `src/math.ts`; demo `Palette → PersistedPalette` rename; npm version bump |
| C.W2 | palette-api alignment to contract; `formatPalette ??` defaulting retires; `cron.ts:24` unbounded `$nin` invert to `pinned` flag; `migrate-palette-schema.ts` ship; `api/src/crud/` utility module landing per U4 spec |
| C.W3 | demo native library-`Palette` consumption; `PersistedPalette` confined to api boundary |
| C.W4 | close |

**Cohort identity** (`C.md §1`): "research-first, joint with fourier-B"; opens after
**value.js-B close AND fourier-B.W1 ratifies `CRUD-CONTRACT.md`** (H5 corrected open-gate).
PROGRESS.md last-action: "none until value.js-B closes and fourier-B's joint Wα + Wχ close."

**Status board on disk** (`PROGRESS.md §status board`): W0 planned, W1–W4 all provisional —
**zero waves executed**. C has stayed planning-only across the entire D→E→F→G→H execution
period.

---

## §2 — D–H overlap survey (per-tranche, per-C-wave)

The survey reads each `FINAL.md §thesis verdict` (D, E, F, G) plus `H.md §1`, then probes
the specific files C named.

### §2.1 — Did any tranche author or consume a CRUD contract document?

**NO.** `find ~/Programming/value.js -name "CRUD-CONTRACT.md"` returns nothing in
value.js. Only `~/Programming/value.js/docs/tranches/C/coordination/CRUD-CONSTELLATION.md`
(the C-authored mirror) mentions CRUD-CONTRACT. The authoritative
`fourier-analysis/docs/tranches/B/coordination/CRUD-CONTRACT.md` exists in fourier's repo
but **was never ratified by value.js** (no value.js-side sign-off artefact in D–H).

D–H FINAL/H.md fourier-mentions are read-boundary acknowledgements only:
- `E/FINAL.md:22` ("Analyze the recent speedtest and glass-ui and fourier analysis work")
- `F/FINAL.md:28` ("F3 cross-repo write boundary … Zero writes to … fourier-analysis")
- `G/FINAL.md:187` ("fourier-analysis: chronic 109-file dirty tree")
- `H/H.md:127` ("fourier-analysis/ — read-only")

No tranche **consumed** a CRUD contract; no tranche **authored** one. The contract sits
unratified in fourier's repo.

### §2.2 — Did any tranche touch `palette-api` schema (the `formatPalette ??` fallback)?

**YES — discharged by D.W2 Lane D.** `~/Programming/value.js/api/src/format/palette.ts`
exists (relocated from `api/src/routes/palettes.ts` by D.W2 Lane C #8 — "D-HARDEN-3 §1 C1
extraction") and the `??` defaulting was **excised by D.W2 Lane D (F1)** with a
`migrations/check.ts` startup probe replacing per-field fallback compensation.

Citations:
- `api/src/format/palette.ts:7-12` — "Pre-migration `??` defaults were excised in Lane D
  (F1) — the `assertMigrationsApplied` smoke probe at startup
  (`migrations/check.ts`) verifies the at-rest data carries every field…"
- `api/src/format/palette.ts:54-77` — formatter body returns `rest.tags`, `rest.versionCount`,
  `rest.forkOf`, `rest.oklabColors` directly; zero `??` operators.
- `docs/tranches/D/FINAL.md §D.W2 Lane D` — "F1/F2/F3/W2/W3/W4 fail-explicit dispositions;
  F1 migration smoke-probe `migrations/check.ts`".

**C.W2 scope item "retire `formatPalette` per-field fallback" is already shipped under
the D-thesis "fail-explicit" axis (D3 invariant).**

### §2.3 — Did any tranche touch `cron.ts:24` (the unbounded `$nin`)?

**YES — discharged by E.W2 Lane A.** `~/Programming/value.js/api/src/cron.ts` has been
**rewritten**. The current file is 34 lines (vs. the pre-D version C.W2 referenced); line 24
is now `const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);` — not an `$nin`
query. The cron handler migrated from raw `db.collection(...)` calls to repository methods
(`sessions.deleteExpired`, `sessions.deleteStale`, `votes.deleteOrphaned`).

Citations:
- `api/src/cron.ts:1-12` header — "E.W2 Lane A — migrated from raw `db.collection(...)`
  calls to the repository surface."
- `api/src/cron.ts:25-29` — repository delegation; `palettes.listAllSlugs()` +
  `votes.deleteOrphaned(paletteSlugs)` is the new orphaned-vote sweep (bounded by the
  positive slug list, not unbounded `$nin`).
- `docs/tranches/E/FINAL.md §E.W2` — "api/ pipeline parity (6 lanes — sessions+colors
  migration, withTransaction, requireOwnership, palette-manager slim, middleware split,
  104 backend tests)."

C.W2's "`cron.ts:24` invert to per-doc `pinned` flag" is **mooted, not discharged in form,
but discharged in spirit**: the unbounded `$nin` antipattern is gone via a different
remediation (repository-mediated bounded query). The `pinned` flag mechanism C planned is
not present and is no longer needed for correctness.

### §2.4 — Did any tranche extract a `Palette` type into `src/` of the library?

**NO.** `find ~/Programming/value.js/src -name "*palette*" -o -name "*Palette*"` returns
nothing. `~/Programming/value.js/src/` contains exactly: `easing.ts`, `index.ts`,
`math.ts`, `parsing/`, `quantize/`, `transform/`, `units/`, `utils.ts`, `vite-env.d.ts`.
**No `src/palette/` directory; no `Palette` class; no `colorScale`; no `sampleToSVGPath`.**
`src/math.ts:69` still has `cubicBezierToSVG` (the existing primitive that C.W1 would
have generalised) — never generalised.

D's library-perf folds (`L3`/`L5`/`L8`/`L11`/`L12` in D.W3 Lane C) touched easings/lerp/
parseCSSValueUnit memoisation but **did not introduce a Palette domain object**. G.W1 Lane
B decomposed `color/utils.ts` into 9 conversion modules — orthogonal to palette domain.

### §2.5 — Did any tranche relocate `slugWords.ts`?

**NO.** `~/Programming/value.js/api/src/slugWords.ts` still exists with hardcoded
`ADJECTIVES`/`VERBS`/`NOUNS` arrays inline (`slugWords.ts:4-21` ADJECTIVES,
`slugWords.ts:23+` VERBS). C.W2's "re-points at `coordination/SLUG-WORDS.md` data per
U2" / shared `docs/precepts/data/slug-words.json` extraction is unhappened.

### §2.6 — Was `api/src/crud/` utility module landed?

**NO.** `ls ~/Programming/value.js/api/src/crud/` → no such directory. The U4 spec
(`coordination/CRUD-LIB-TS.md`, 8 files of `slugs/cursors/errors/etag/idempotency/
softdelete/pinnedCron`) is unland.

However, **functional equivalents exist** via D.W2 Lane C's parallel-evolution structure:
`api/src/errors/`, `api/src/repositories/`, `api/src/services/`, `api/src/middleware/`,
`api/src/validation/`, `api/src/format/`, `api/src/migrations/` — 9 directories, all
introduced by D.W2 Lane C (20 NEW files / 1502 LoC) and E.W2 (6 lanes).

The **decomposition shape** is different from C.W2's U4 spec: value.js evolved a
**service+repository+errors+events+DI+zod** architecture (D's vocabulary), not a
**`api/src/crud/` utility module** (C's vocabulary). The two are not directly mergeable
without a non-trivial mapping exercise.

### §2.7 — Demo `Palette → PersistedPalette` rename (C.W3)?

**NO.** `~/Programming/value.js/demo/@/lib/palette/types.ts:7-28` still defines
`export interface Palette { … }` (24-line interface). No `PersistedPalette` symbol exists.
The demo type is unchanged in shape since the C planning date.

---

## §3 — Cohort-C disposition verdict

**Verdict: (b) PARTIALLY-DISCHARGED + (d) ORPHANED — combined.**

A clean (a)/(b)/(c)/(d) verdict is not honest. The picture per scope item:

| C scope item | Disposition | Discharge path |
|---|---|---|
| C.W0 — open after CRUD-CONTRACT.md ratified | **NEVER MET** | Contract never ratified by value.js side. |
| C.W1 — library `Palette` type at `src/palette/` | **(c) FULLY-PENDING** | No `src/palette/` exists. |
| C.W1 — `colorScale` primitive | **(c) FULLY-PENDING** | Absent from `src/`. |
| C.W1 — `sampleToSVGPath` at `src/math.ts` | **(c) FULLY-PENDING** | Absent from `src/math.ts`. |
| C.W2 — `formatPalette ??` fallback retires | **(a) DISCHARGED-BY-D.W2-LANE-D** | F1 excision + `assertMigrationsApplied` probe. |
| C.W2 — `cron.ts:24` unbounded `$nin` invert | **(a) DISCHARGED-IN-SPIRIT-BY-E.W2-LANE-A** | Different remediation (repository methods, positive-slug bounding), but antipattern gone. |
| C.W2 — `migrate-palette-schema.ts` ships | **(a) DISCHARGED-BY-D.W2-LANE-D-VIA-F1-PROBE** | The `migrations/check.ts` startup probe is the functional analog (verifies, doesn't backfill). |
| C.W2 — `api/src/crud/` utility module | **(d) ORPHANED** | Different architectural evolution chose service+repository pattern (D.W2 Lane C) instead. |
| C.W2 — `slugWords.ts` re-points to shared data | **(c) FULLY-PENDING** | Still hardcoded in `api/src/slugWords.ts`. |
| C.W3 — demo `Palette → PersistedPalette` rename | **(c) FULLY-PENDING** | demo `Palette` interface unchanged. |
| C.W3 — demo natively consumes library `Palette` | **(c) FULLY-PENDING** | No library Palette to consume. |

**Cohort verdict in one sentence**: **value.js-C's palette-api hardening axis is
retroactively discharged-by-D-and-E (with different mechanics); its library-Palette axis
is fully-pending and orphaned by value.js's chosen direction; the cross-repo cohort
contract was never ratified.**

The honest description: **value.js advanced past C's premises without consuming C's
plan.** D solved the formatPalette fallback under a "fail-explicit" thesis (not a
"cohort contract" thesis); E solved the cron antipattern under a "pipeline parity"
thesis (not a "pinned flag" thesis). The library-Palette domain object never landed
because no value.js execution-thesis from D through H required it — fourier was the only
demand-side consumer, and fourier's tranche-B work has not pulled.

---

## §4 — Refinement proposals

Three options, ranked by honesty + load-bearing-ness for the next round:

### Option 1 (RECOMMENDED) — Retire C with the AB+1 pattern; relocate residue

C retires as a planning artefact with retroactive attribution. Mirrors value.js's own
established **AB+1 pattern** (the glass-ui constellation precedent of closing a tranche
retroactively when its work happened under different letters). Concrete actions:

1. **Author `value.js/docs/tranches/C/FINAL.md`** with §thesis-verdict = **RETIRED**.
   The thesis "shared CRUD contract + library Palette + api alignment" is split:
   - **api-alignment axis**: discharged-by-D-and-E (cite `D/FINAL.md §D.W2 Lane D` for
     formatPalette F1 excision; cite `E/FINAL.md §E.W2 Lane A` for cron rewrite).
   - **library-Palette axis**: never landed; **orphaned** because no value.js
     execution-thesis from D through H required it.
   - **CRUD-CONTRACT ratification**: never executed; the cross-repo cohort dissolved
     when fourier-B did not pull a contract ratification through to value.js.
2. **Move C's residual library-Palette scope to a new value.js tranche I (or later)**
   *if and only if* the user re-mandates it. Without re-mandate, the library-Palette
   work is not on value.js's roadmap (H's thesis is cascade-correctness + type-system
   completion II + demo decomposition — no palette domain object).
3. **`PROGRESS.md` closes with**: "RETIRED 2026-05-26. Axis disposition per FINAL.md
   §thesis verdict; residue routed per §debt."

### Option 2 — Shrink C to library-only

Retire C.W2 and C.W0 (discharged / dependency-dead); retain C.W1 (library `Palette` +
`colorScale` + `sampleToSVGPath`) + C.W3 (demo consume) as a 2-wave tranche. **Cost**:
this is the same as authoring a new tranche, and pretending it's still "C" obscures the
honest fact that D–H executed without it. **Verdict**: dishonest. Not recommended.

### Option 3 — Merge C residue into H

H is in flight (planning-only at H open per `H.md`). H's thesis explicitly **rejects**
new architectural axes ("polish-grade — not structural rescue"). The library `Palette`
domain object is a new axis; it does not fit H. **Verdict**: forces H to grow a fifth
axis it doesn't want. Not recommended.

**Recommendation: Option 1.** Author `value.js/docs/tranches/C/FINAL.md` as a
retirement ceremony with axis disposition + residue routing. Update fourier-B
coordination per §5 below.

---

## §5 — fourier-B impact statement

The cohort timing diagram in `~/Programming/fourier-analysis/docs/tranches/B/
coordination/CRUD-CONSTELLATION.md` (mirrored in C's view) names the single hard
cross-repo dependency: **fourier-B.W4 → value.js-C.W1 published**. **value.js-C.W1 will
never publish** under Option 1. Therefore:

1. **fourier-B.W4's fallback contract becomes the primary path.** The plan as captured
   in cohort artefacts has fourier-B.W4 ready with a "land everything except the
   `colors.ts` gut" fallback if value.js-C.W1 is unavailable. This fallback is now the
   *primary* path, not the fallback.
2. **`web/src/lib/colors.ts` does NOT gut onto a value.js `Palette` import.** The file
   stays (current state: 117 LoC, still defines `VIZ_COLORS.fourier` etc.) until either
   (a) the user re-mandates the library Palette domain object as a new value.js tranche
   or (b) fourier independently authors its own palette domain object.
3. **The `easings.ts` SVG-sampling workaround stays.** `web/src/lib/easings.ts:89`
   (`generateCurveSVGPath`) is fourier's own primitive — value.js's
   `sampleToSVGPath` will not materialise.
4. **fourier still pins `@mkbabb/value.js ^0.4.6`** while value.js published v0.9.0 —
   a 5-minor-version drift independent of C. fourier-B's "version-bump consume" should
   move forward (consuming v0.9.0's `parseCSSColor`, `mixColors`, `color2`, gamut
   mapping — the surface that already exists), without expecting a `Palette` import.
5. **R3's input should be updated**: the cross-repo dependency is *severed*, not
   *delayed*. fourier-B's coordination doc should record discharged status with
   citation to this report.

**One-line fourier-B impact**: *fourier-B.W4 must execute its fallback contract as the
primary path; the cross-repo `Palette` import gut is canceled; `colors.ts` and
`easings.ts` workarounds become permanent.*

---

## §6 — Source-of-truth file citations

- `~/Programming/value.js/docs/tranches/C/C.md` (140 lines; cohort plan as authored)
- `~/Programming/value.js/docs/tranches/C/PROGRESS.md:5-13` (status board: zero waves executed)
- `~/Programming/value.js/src/` (no `palette/` dir; no `colorScale`; no `sampleToSVGPath`)
- `~/Programming/value.js/api/src/format/palette.ts:7-12, 54-77` (formatPalette F1 excision evidence)
- `~/Programming/value.js/api/src/cron.ts:1-12, 20-34` (cron repository-mediated rewrite evidence)
- `~/Programming/value.js/api/src/slugWords.ts:4-21` (slugWords still hardcoded, not relocated)
- `~/Programming/value.js/api/src/` (no `crud/` subdir; service+repository pattern instead)
- `~/Programming/value.js/demo/@/lib/palette/types.ts:7-28` (demo `Palette` interface unchanged)
- `~/Programming/value.js/docs/tranches/D/FINAL.md §D.W2 Lane D` (formatPalette F1 disposition)
- `~/Programming/value.js/docs/tranches/E/FINAL.md §E.W2` (cron pipeline-parity disposition)
- `~/Programming/value.js/docs/tranches/H/H.md §1` (H thesis; no palette domain axis)
- `~/Programming/value.js/package.json:3` (version `0.9.0`)
- `~/Programming/fourier-analysis/web/package.json` (still pins `@mkbabb/value.js ^0.4.6`)
- `~/Programming/fourier-analysis/web/src/lib/colors.ts` (117 LoC; still defines `VIZ_COLORS`)
- `~/Programming/fourier-analysis/web/src/lib/easings.ts:89` (`generateCurveSVGPath` workaround)
- `~/Programming/fourier-analysis/docs/tranches/B/coordination/CRUD-CONTRACT.md` (exists; never ratified by value.js)

---

**End of refinement assay.**
