# D — cross-repo palette/visualization CRUD cohesion (the value.js ask)

**Status**: research-first (Wα-R1); the value.js side is user-re-mandate-gated. **Authored**: 2026-05-27 (the D-development audit, `docs/audits/runs/2026-05-27-D-audit/{DA3,SYNTHESIS §4}.md`). **Authority**: this doc records the cross-repo ask; the disposition is `D.md §3 W5` + `§7`.

## §1 — What this is

The user's directive: "recap our original palette/visualization CRUD API for both herein and value.js — we must get both repos up to a cohesive spec. Audit value.js, too." The B thesis ("one identity model across fourier AND value.js") was landed fourier-unilaterally; value.js-C (the cohort peer) was RETIRED. D resumes the cohesion — now grounded in a **live, deployed** target.

## §2 — The ground truth (DA3)

- **value.js ships `palette-api` v2.0.0** — in-repo at `value.js/api/` (Hono + MongoDB + Zod, ~70 `.ts` files, its own `Dockerfile`/`compose.yaml`), **deployed + healthy on prod** (`palette-api-api-1`, HTTP 200). Distinct from the npm library `@mkbabb/value.js` v0.10.0 (`value.js/src/`).
- It is **richer** than fourier's CRUD (version history, forks, votes, proposed-names, an 8-route admin tree) but **divergent on ~11 contract clauses**: a top-level `id` field (`value.js/api/.../format/palette.ts:59` — direct C1.3 violation), client-supplied non-4-word slugs, a single 4-state `status` instead of 3-state `visibility`+`tier`, **hard cascade delete with no soft-delete/grace/restore**, an admin `feature` toggle (not the contract's idempotent setter), and **none** of the SOTA envelopes (no problem+json, ETag/If-Match, RateLimit, Idempotency-Key).
- **The link is live**: fourier's `visualization.palette_slug` (`api/models/visualization.py:119`) is a dangling slug-FK into value.js's palette noun. "One identity model" is concrete, not academic.
- Root cause of the divergence: value.js's D.W2 backend (service+repository+errors+events+DI, `626b107`) won by parallel evolution over the C-planned `api/src/crud/` shape — it is contract-*adjacent*, not contract-*adopted*.

## §3 — The cohesion shape (two KISS relaxations)

`CRUD-CONTRACT v2.0.0` re-ratified jointly, with two relaxations so cohesion does NOT force value.js to abandon its idiom (the B trap — inv-16 — forbids a shared framework/codegen):

1. **§2 admits user-supplied slugs** — the original §2 over-specified to fourier's `coolname`/4-word accident; value.js's human-named palettes are legitimate. Cohesion binds slug *identity* (one human-readable slug, unique, no hash), not the word-count.
2. **§0 binds behaviour, not module layout** — value.js keeps its service+repository+events architecture; the contract binds the observable CRUD behaviour (identity, visibility, soft-delete, the SOTA envelopes), not fourier's `api/lib/crud/` file shape.

## §4 — The two sides

- **fourier (light — D.W5)**: it already conforms. Re-author the contract to v2.0.0; flip the ~88 DEFERRED conformance-matrix cells against the live `palette-api`; record the ask here. No fourier CRUD code change.
- **value.js (heavy — a value.js tranche, user-re-mandate-gated)**: the `status`→`visibility`+`tier` split; add soft-delete + grace + restore + the index; adopt the four SOTA envelopes **in value.js's own service+repository idiom** (not fourier's layout); hide the top-level `id`; rename the admin toggle to the idempotent setter; author a conformance suite. CA3's sketched wave-set applies iff the user mandates the full alignment.

## §5 — The colour-lift (orthogonal sub-item)

The inverted δ edge from C (`coordination/COLOUR-LIFT.md`) — value.js publishes `sampleToSVGPath` in `src/math.ts`, fourier consumes in `easings.ts` — is **orthogonal** to this backend cohesion (it is `value.js/src/`, the library; the cohesion is `value.js/api/`, the service). It rides as a bounded D.W5 sub-item, fired iff value.js publishes; else it stays a named residual (value.js v0.10.0 does not export it).

## §6 — Disposition

D authors the **fourier side** (the contract v2.0.0 + the matrix disposition) and **records the value.js ask** here. The value.js-side execution is a **value.js tranche** the user must re-mandate (value.js-I's thesis is open; this is the candidate host). fourier-D does not author value.js's tranche. The `palette_slug` FK contract (what fourier guarantees about the slug it stores, what value.js guarantees about resolving it) is the one binding cross-repo artefact Wα-R1 produces.

### §6.1 — The v2.0.0 §10 close-rule reinterpretation (H3 finding)

The v1.0.0 contract's §10 close rule was a literal binary "both columns PASS." v2.0.0 reinterprets it as a **three-way dispositioning**: every DEFERRED cell is named as **ADDRESSED** (value.js already conforms today — flip to PASS), **DEFERRED-TO-VALUE.JS** (the cohort-reopen path; a value.js alignment-tranche resolves it; recorded here as the cross-repo ask), or **RETIRED-AS-OVER-SPEC** (the clause was over-specified to fourier's accident — relaxed per the two KISS relaxations of §3). The close rule becomes "every cell named with one of the three dispositions; DEFERRED-TO-VALUE.JS is the cohort-reopen path, not a fail." This is what makes cohesion KISS-honest without forcing a shared framework (inv-16).
