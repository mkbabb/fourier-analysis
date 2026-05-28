# VALUE-JS-ASK — the cross-repo cohesion brief (fourier-D.W5)

**Status**: candidate hand-off doc. **User re-mandate predicate** — the
value.js-side execution is a *value.js tranche* that the user must
re-mandate before any value.js source is touched (per `D.md §3 W5`
+ `D/coordination/CRUD-COHESION.md §6` + Wχ-P3 condition C4 — binding).
**Authored**: 2026-05-27 (fourier-D.W5). **Authority**: this doc is the
**fourier-side** record of the ask; it lives in `fourier-analysis/docs/`
NOT in `value.js/` (a `find ~/Programming/value.js -name "VALUE-JS-ASK*"`
returns ZERO — the boundary is honoured per Wχ-P3.C4).

This is the brief fourier-D would hand to the user when the user
re-mandates the value.js side. It enumerates the 53 DEFERRED-TO-VALUE.JS
cells from `B/coordination/CONFORMANCE-MATRIX.md §V2`, names the I.W1–W4
wave-set sketch (per `DA3 §5`), records the `palette_slug` FK contract
clause (lifted verbatim from `D/research/README.md R1`), and binds the
colour-lift consume status as a named residual (value.js@0.10.0 does NOT
export `sampleToSVGPath` per Wχ-P3 §3.3 #4).

---

## §1 — What this is

The user's directive at D open: "recap our original palette/visualization
CRUD API for both [fourier] herein and value.js — we must get both repos
up to a cohesive spec. Audit value.js, too." Fourier-D-W5 delivered the
fourier-side: re-authored `CRUD-CONTRACT v2.0.0` (the two KISS relaxations
+ the §10 three-way close-rule + the §13 cross-repo FK clause); flipped
the ~88 DEFERRED conformance-matrix cells against the live `palette-api`
v2.0.0 (53 DEFERRED-TO-VALUE.JS / 27 ADDRESSED / 7 RETIRED-AS-OVER-SPEC).

**This doc records what's left** — the 53 cells that need value.js-side
work, the I.W1–W4 wave sketch that would close them, and the cross-repo
binding artefact (the `palette_slug` FK contract clause from
`research/README.md R1`).

The doc is **fourier-side**. It does NOT live in `value.js/`; it does NOT
edit `value.js/`. Per Wχ-P3.C4: fourier-D never touches `value.js/**`;
the value.js-side execution is a separate value.js tranche the user
re-mandates.

---

## §2 — The 53 DEFERRED-TO-VALUE.JS cells

Drawn from `B/coordination/CONFORMANCE-MATRIX.md §V2.1`. Each cell names:
the contract section, the assertion, the v2.0.0 binding §clause, and the
responsible I.W<n> wave.

### §2.1 — Identity / ownership / visibility (I.W1 wave — 11 cells)

| Cell | Clause | v2.0.0 binding | I.W<n> |
|---|---|---|---|
| C1.3 | no top-level `_id` in response | §1.3 | I.W1 |
| C3.3 | schema rejects null owner | §3 | I.W1 |
| C3.4 | zero null-owner post-migration | §3, §11 | I.W1 |
| C4.1 | visibility enum 3-state | §4 | I.W1 |
| C4.2 | anonymous list public-only | §4 | I.W1 |
| C4.3 | draft 404 to non-owner | §4 | I.W1 |
| C4.4 | owner sees all three | §4 | I.W1 |
| C4.5 | public→draft rejected | §4 | I.W1 |
| C4.6 | two-step via unlisted | §4 | I.W1 |
| C4.7 | default-to-draft on POST | §4 | I.W1 |
| C11.1/C11.2/C11.3 | migration idempotent + count-verify + spot-check | §11 | I.W1 |

**I.W1 sketch** (per DA3 §5):
- Strip top-level `id: String(_id)` from `format/palette.ts:59`.
- Tighten `userSlug` to non-null in the Mongo validator + the typed model
  (`models.ts:73-75`); drop the legacy `sessionToken` shim.
- Split the single 4-state `status` (`models.ts:29`,
  `["published","featured","hidden","draft"]`) into 3-state `visibility`
  (`["draft","unlisted","public"]`) + admin `tier`
  (`["featured","normal"]`).
- Add the `visibility_illegal_transition` guard to the PATCH handler.
- Add a `migrate-palette-schema.ts` script: split `status` → `visibility +
  tier`; sweep null-owner rows (carry over from the existing
  `migrate-slugs.ts` precedent); add `deletedAt: null` column for the
  soft-delete migration that follows in I.W2.

### §2.2 — Soft-delete + grace + restore (I.W2 wave — 7 cells)

| Cell | Clause | v2.0.0 binding | I.W<n> |
|---|---|---|---|
| C5.1 | anonymous 404 after delete | §5 | I.W2 |
| C5.2 | restore within grace | §5 | I.W2 |
| C5.3 | cron hard-deletes past grace | §5 | I.W2 |
| C5.5 | inside-grace survives | §5 | I.W2 |
| C7.5 | admin hard-delete bypasses grace | §5, §7 | I.W2 |
| U-soft-1 | soft-delete sets `deletedAt` | §5 | I.W2 |
| U-soft-2 | not-deleted filter | §5 | I.W2 |

**I.W2 sketch** (the largest single delta — per DA3 §5):
- Replace the HARD cascade delete in `services/palette/crud.ts:219-247`
  with a soft-delete: set `deletedAt: <now>`; leave the row in place;
  leave votes/flags as orphan-tolerant until the cron hard-delete pass.
- Add `POST /palettes/:slug/restore` endpoint.
- Add a Mongo TTL or query-time `deletedAt < cutoff` cron sweep in
  `cron.ts`.
- Add the `deletedAt_1` compound index.
- Admin `DELETE /admin/palettes/:slug` hard-deletes (bypasses grace) +
  cascades.
- For the §13 FK: `GET /palettes/:slug` returns 410 Gone for soft-deleted
  palettes (distinguishable from 404 never-existed).

### §2.3 — Admin idempotency (I.W3 wave — 3 cells)

| Cell | Clause | v2.0.0 binding | I.W<n> |
|---|---|---|---|
| C7.2 | idempotent suspend | §7 | I.W3 |
| C7.6 | unified batch return shape | §7 | I.W3 |
| C8.5 | pinned-flag survives TTL (Option-A path; Option-B already ADDRESSED) | §8 | I.W3 (optional) |

**I.W3 sketch** (per DA3 §5):
- Rename `POST /admin/palettes/:slug/feature` (toggle) to
  `POST /admin/palettes/:slug/set-tier` (idempotent setter; body carries
  the target tier). Audit row carries `noop: true` on no-state-change.
- Replace the `{processed, errors}` batch return shape with `{ok, affected,
  errors?}` (the W5.c contract-bug fix shape).
- *(Optional)* — adopt the `pinned: bool` flag pattern (v2.0.0 §8 Option A)
  if value.js wants to pin specific palettes against TTL. The Option B
  (bounded distinct) path value.js uses today already conforms to §8.

### §2.4 — SOTA envelopes + conformance suite (I.W4 wave — 32 cells)

The bulk of the DEFERRED-TO-VALUE.JS cluster: the four RFC-grade
envelopes value.js does not emit today.

| Cell cluster | Clause | v2.0.0 binding | I.W<n> |
|---|---|---|---|
| CS1.3 | invalid cursor 400 problem+json | §0 SOTA-1, §S1 | I.W4 |
| CS2.1 / CS2.2 / U-etag-1..5 | ETag + If-Match (7 cells) | §0 SOTA-2, §S2 | I.W4 |
| CS3.1 / CS3.2 / U-idem-1..3 | Idempotency-Key (5 cells) | §0 SOTA-4, §S3 | I.W4 |
| CS4.1 / CS4.2 | RateLimit headers (2 cells) | §0 SOTA-6, §S4 | I.W4 |
| CS5.1 / CS5.2 / CS5.3 / U-errors-1 / U-errors-3 | problem+json envelope + URN catalog (5 cells) | §0 SOTA-3, §S5 | I.W4 |
| CS6.1 | Link rel="next" (1 cell) | §0 SOTA-5, §S6 | I.W4 |
| U-slugs-3 | slug-exhausted 503 (1 cell) | §0 SOTA-3 | I.W4 |
| U-slugs-5 / U-slugs-6 | word-list invariants (2 cells; optional retirement) | §9 | I.W4 (optional) |

**I.W4 sketch** (per DA3 §5):
- **problem+json**: Re-shape the typed-error-class emission in
  `errors/index.ts:7-121`. Each error class maps to a problem+json body
  `{type: "urn:contract:<kebab>", title, status, detail, instance}` with
  Content-Type `application/problem+json`. The `{error:{code,message,
  detail}}` shape is retired (1.0 of the value.js D.W2 architecture is
  rolled to a 1.1 patch — backward-incompatible at the wire).
- **ETag + If-Match**: Add `etag.ts` middleware. `GET /palettes/:slug`
  emits `ETag: "<sha256-hex>"`; `PATCH`/`DELETE` validate `If-Match`
  header against current; emit `428 Precondition Required` on missing,
  `412 Precondition Failed` on mismatch (both as problem+json).
- **Idempotency-Key**: Add `idempotency.ts` middleware. POST creation
  paths replay-via-key with a 24h Mongo TTL collection.
- **RateLimit headers**: Augment `middleware/rateLimit.ts` to emit
  `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` per RFC
  9239 on every response; `Retry-After` on 429.
- **Link header**: Augment list endpoints to emit `Link: <…>;
  rel="next"` per RFC 8288.
- **Conformance suite**: Author `value.js/api/test/conformance/**`
  (vitest-based) with one file per §1–§S7 + §U section, mirroring
  fourier's `api/tests/conformance/`. Per-repo flip discipline per
  Wχ-P3.C2: value.js's matrix column flips on this suite, NOT on
  fourier's behalf. The suite is invoked via `npm run test:conformance`
  from `value.js/api/`.

### §2.5 — Cell-flip arithmetic

| Wave | Cells | % of DEFERRED-TO-VALUE.JS |
|---|---|---|
| I.W1 — visibility/identity/migration | 13 | 24.5% |
| I.W2 — soft-delete | 7 | 13.2% |
| I.W3 — admin idempotency | 3 | 5.7% |
| I.W4 — SOTA envelopes + conformance suite | 30 | 56.6% |
| **Total** | **53** | **100%** |

The I.W4 cluster is the dominant load (>50%) — the SOTA envelopes are
multi-cell concerns each fanning out across §S* + §U.

---

## §3 — The `palette_slug` FK contract (binding cross-repo artefact)

**Lifted verbatim from `docs/tranches/D/research/README.md R1`** — the
ratified `palette_slug` FK contract clause from Wα-R1. This is the **one
binding cross-repo artefact** the cohesion thread produces.

### Fourier (the FK holder) guarantees

- `Visualization.palette_slug: str | None` — nullable; the visualization
  may carry no palette association (None is the legitimate empty state).
- When non-`None`, the slug conforms to `^[a-z0-9][a-z0-9-]*$` with length
  ≤ 120.
- Uniqueness is **within the `visualization` document scope only** —
  fourier stores the slug as an *opaque foreign key*; uniqueness within
  the *palette space* is value.js's invariant.
- Fourier does **not** validate that the slug resolves at write time (no
  cross-repo round-trip on `POST /visualizations` or
  `PATCH /visualizations/{slug}`). The slug may become stale if the
  upstream palette is deleted; fourier carries this as
  graceful-degradation (the visualization renders with no palette, the
  frontend shows a "palette unavailable" affordance — not an error).
- The slug is **ETag-participating** (`etag.py:14` `_DEFAULT_FIELDS`
  includes `palette_slug`; a slug change rotates the visualization's
  ETag).
- The slug is **exposed verbatim** on `GET /visualizations/{slug}` (no
  enrichment, no resolve-and-inline of the palette payload) — the client
  fetches the palette separately.

### Value.js (the palette source-of-truth) guarantees

- `GET /palettes/{slug}` returns HTTP 200 with the palette envelope iff
  (a) the palette exists and (b) it is visible to the caller.
- Returns HTTP 404 in all other cases. Never returns 403 (visibility-denied
  palettes are indistinguishable from missing).
- The slug in the URL is the **stable identity** — no hash, no version
  suffix, no DB `_id` in the path.
- Slug uniqueness within the palette space is enforced via a Mongo unique
  index on the value.js side.
- Slug **immutability**: once created, the slug does not change for that
  palette's lifetime. A rename produces a new palette; a fourier 404 always
  means deletion (never "renamed").
- *(Once I.W2 lands)* — `GET /palettes/{slug}` returns 410 Gone for
  soft-deleted palettes (distinguishable from 404 never-existed); fourier's
  product surface chooses the unresolvable-FK rendering.

### Cross-repo invariant

The FK is *resolve-only*, not *enforce-at-write*. Fourier never reaches
across to value.js on the write path; value.js never reaches across to
fourier. The only cross-repo traffic is the read-side (fourier's frontend
fetches `GET /palettes/{slug}`). **This orthogonality is the load-bearing
KISS property** (DA3 §5 "Critical design notes" §3; Wχ-P3 §3 verdict).

**No shared HTTP client, no shared validation library, no cross-repo
TypeScript type import.** Fourier validates with its own pydantic regex;
value.js validates with its own zod regex
(`value.js/api/src/validation/palette.ts:19-23`). The two regex strings
coincide by *text* (the v2.0.0 relaxation chose value.js's shape as the
shared shape-floor), not by *code*.

### C4.5/C4.6 visibility-transition guard disposition

**Verdict (from `research/README.md R1`): W3 (γ-thread).** The guard is an
internal-state-machine fix — the `visibility_illegal_transition` helper
already exists in fourier's `api/lib/crud/`, the call site is
`update_visualization`, the fix is router-local code with no wire-shape
change. The contract v2.0.0 records *which transitions are allowed* on
the conformance matrix as a post-hoc fill; the *enforcement* is W3-γ on
the fourier side. **The value.js-side companion (C4.5/C4.6 value.js
column) is DEFERRED-TO-VALUE.JS I.W1**, conditioned on the visibility split.

---

## §4 — Status: user-re-mandate-gated

Per `D.md §3 W5` row (verbatim): "value.js-side execution is a value.js
tranche (user-re-mandate-gated)". Per Wχ-P3.C4 (verbatim): "value.js-side
execution recorded as a separate value.js tranche (user-re-mandate-gated).
fourier-D never edits `value.js/**` or `/home/mbabb/Programming/palette-api/**`."

**The predicate for triggering the value.js tranche**:
1. The user re-mandates the cohesion work (either after seeing this brief
   or as part of a broader cross-repo work-set).
2. A value.js-tranche is opened (likely host: `value.js/docs/tranches/I/`
   per the I-series naming sketched in `DA3 §5`).
3. The value.js-tranche authors I.W0 (open + baseline against this brief),
   I.W1–I.W4 (the per-wave execution per §2.1–§2.4 above), I.W5 (close +
   conformance-suite green + the value.js column of
   `B/coordination/CONFORMANCE-MATRIX.md §V2.1` flipped on the suite, not
   on fourier's behalf).

**Until the user re-mandates**: the cells stay at DEFERRED-TO-VALUE.JS;
fourier serves the visualization with `palette_slug` as opaque-by-slug
(per §3 above); the value.js `palette-api` v2.0.0 continues serving
unchanged on prod (`palette-api-api-1` HTTP 200, 2 months stable).

---

## §5 — Colour-lift consume status (named residual)

**Status**: NAMED RESIDUAL at fourier-D.W5 close. The consume **does NOT
fire** at W5 dispatch.

### Evidence (verified at W5 dispatch, 2026-05-27)

- `git grep -nE "sampleToSVGPath" web/src/` (fourier) → ZERO matches (the
  consume has NOT landed; `web/src/lib/easings.ts` is byte-identical
  pre-W5).
- `grep -n "sampleToSVGPath" /Users/mkbabb/Programming/value.js/src/math.ts`
  → ZERO matches.
- `grep -n "sampleToSVGPath" /Users/mkbabb/Programming/value.js/src/index.ts`
  → ZERO matches.
- value.js HEAD `16129e0`, `@mkbabb/value.js` v0.10.0.
- Only `cubicBezierToSVG` is exported (`src/math.ts:69`; `src/index.ts:170`).

### Disposition

The consume **fires iff value.js publishes `sampleToSVGPath`** in
`src/math.ts` and exports it from `src/index.ts`. The fire-condition is
identical to the C.W4 named-residual branch (the C-era inverted δ edge,
re-verified at fourier-D.W5).

**When the consume fires** (future): a one-line change to
`web/src/lib/easings.ts:89 generateCurveSVGPath` swaps the local
implementation onto the imported helper; the import line at
`easings.ts:9-16` adds `sampleToSVGPath` to the named imports from
`@mkbabb/value.js`; `web/package.json` records the value.js pin bump (if
a tag is published; the local-path pin at `file:../../value.js` already
resolves to the local source).

**Until then**: the colour-lift carries as a named residual in
`PROGRESS.md` (the destination is `fourier-tranche-D-successor` or
whatever wave the user re-mandates that re-checks the export).

### Coupling note

The colour-lift is **orthogonal** to the CRUD cohesion (per `DA3 §4` +
`Wχ-P3 §4`). The lift touches `value.js/src/` (the npm library); the CRUD
cohesion touches `value.js/api/` (the in-repo deployed backend). The two
surfaces are inhabit-disjoint in the file tree. A value.js-tranche
focused on `api/` does NOT entangle with the `src/` library lift; the
lift is fired by a separate (much lighter) value.js publish workflow.

---

## §6 — Boundary discipline (P3.C4 binding)

**This document is the brief that fourier-D would hand to the user.** It
does NOT cross the bound:

- ❌ Not authored into `value.js/**` (a `find ~/Programming/value.js -name
  "VALUE-JS-ASK*"` returns ZERO).
- ❌ Not authored into `/home/mbabb/Programming/palette-api/**` (the
  standalone palette-api host repo is out-of-bounds; the provenance
  reconcile is Wα-R3's surface).
- ✅ Authored in `fourier-analysis/docs/tranches/D/coordination/`.
- ✅ Recorded as fourier's offer to the user, not as value.js's plan.

The Wχ-P3.C4 boundary holds: fourier-D's autonomy stops at fourier
source; the value.js-side waves are the value.js host's surface, not
fourier-D's.

---

## §7 — Hand-off checklist (when the user re-mandates)

1. Open a value.js tranche (suggested: `value.js/docs/tranches/I-cohesion/`
   per the I-series naming convention sketched in `DA3 §5`).
2. Copy this `VALUE-JS-ASK.md` into the tranche's research substrate
   (NOT into `value.js/api/src/`; this doc stays in the docs tree).
3. Author I.W0 (open): baseline against this brief; pin the 53 cells; pin
   the v2.0.0 contract; verify the cohesion-as-contract-not-shared-code
   invariant (Wχ-P3).
4. Author I.W1–I.W4 per §2.1–§2.4 above. Each wave is a value.js source
   change + tests in `value.js/api/test/conformance/**`.
5. At I.W5 close: flip the value.js column of `B/coordination/CONFORMANCE-MATRIX.md
   §V2.1` from DEFERRED-TO-VALUE.JS to ADDRESSED (the value.js-tranche
   does this; fourier-D does NOT do it on value.js's behalf per Wχ-P3.C2).
6. (Optional, orthogonal) Author a value.js publish wave that adds
   `sampleToSVGPath` to `value.js/src/math.ts` + exports from
   `src/index.ts`; fourier-D consumes via a one-line `easings.ts` swap.

---

## §8 — Authority + citations

- `D.md §3 W5` — value.js-side execution is a value.js tranche
  (user-re-mandate-gated).
- `D/coordination/CRUD-COHESION.md §6` — disposition: D authors the
  fourier side + records the ask.
- `D/coordination/CRUD-COHESION.md §6.1` — the §10 three-way close-rule
  reinterpretation.
- `D/research/README.md R1` — the binding `palette_slug` FK contract clause
  (lifted verbatim in §3 above).
- `D/audit/challenge-P3.md` — Wχ-P3 KISS adversarial certification + the
  four conditions (P3.C1–C4) binding the v2.0.0 / matrix-flip / colour-lift
  / value.js-tranche carves.
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md §3, §4,
  §5` — the audit substrate (the 11-clause divergence inventory, the
  colour-lift orthogonality, the value.js-heavy alignment-tranche
  wave-set sketch).
- `B/coordination/CRUD-CONTRACT.md` v2.0.0 — the re-authored contract
  (D.W5 commit).
- `B/coordination/CONFORMANCE-MATRIX.md §V2` — the 87-cell dispositioning
  (D.W5 commit).
