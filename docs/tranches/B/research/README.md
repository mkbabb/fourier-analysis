# B — Research wave scope (Wα)

Six parallel read-only lanes. Each lane writes one deliverable under this directory. The
challenge wave (Wχ) adversarially tests every lane's findings against artefacts before
B's implementation waves are hardened.

Dispatch style: per `docs/precepts/instructions/tranche/AGENT_DISPATCH_TEMPLATE.md` and
`RESEARCH.md`. Read-only — no edits, no commits.

## Lane R1 — fourier CRUD surface, deeply

**Deliverable**: `research/R1-fourier-crud.md`.

Map every CRUD path in fourier — `api/routers/{snapshots,gallery,sessions,images,compute,contours,equations,admin}.py`, `api/services/{database,image_storage,janitor,rate_limiter}.py`, `api/models/**`, `api/slugs.py`, `api/dependencies.py` — and the frontend stores `web/src/stores/{gallery,workspace,animation,auth}.ts`, `web/src/lib/{api,draftStorage}.ts`. For each entity (image, contour, snapshot, gallery entry, session, draft, user) produce a row: identity scheme, slug-or-not, ownership, soft-or-hard delete, who reads/writes, what the janitor touches.

The five-identity-scheme finding from audit `e-crud-slug-valuejs.md` is the starting hypothesis — confirm or correct it, name every collision and every owner-less path, and propose the precise shape of the converged `visualization` entity (fields, indexes, slug derivation, owner contract, visibility states).

## Lane R2 — value.js CRUD surface, library and api

**Deliverable**: `research/R2-valuejs-surface.md`.

Two halves.

*Library (`~/Programming/value.js/src/`):* enumerate the colour/palette surface — `index.ts`, `parsing`, `transform`, `quantize`, `units`, `utils.ts`, `easing.ts`. Confirm what exists for palette domain operations (construct from stops, validate, interpolate, serialize, gamut-map). Confirm the two named gaps from audit `e-…md`: `colorScale(stops, t)` and a generic `sampleToSVGPath(fn, n)`. Propose the exact shape of a `Palette` type that satisfies invariants 14 and 15.

*API (`~/Programming/value.js/api/src/`):* read `routes/{palettes,colors,sessions,admin}.ts`, `slugWords.ts`, `migrate-slugs.ts`, `hash.ts`, `cron.ts`, `db.ts`, `types.ts`, `middleware.ts`. Map the palette CRUD lifecycle; identify the slug algorithm, the ownership/session model, the soft-delete posture, the cron behaviour. The screenshots in `value.js/*.png` (`my-palettes-dark.png`, `palette-save-button.png`) name live flows — locate them in the code.

## Lane R3 — the shared optimum (the architecture-decision lane)

**Deliverable**: `research/R3-shared-optimum.md`.

This is the lane whose answer determines B's plan shape. The question: across a Python/FastAPI and a Node/Express backend, **what is the shared optimum for the CRUD facility?** Survey the precedent and produce a decision tree with KISS as the load-bearing rule:

1. *Pure contract* — a written spec both backends implement; no shared code; zero coupling at runtime. Default position. Sufficient for: slug algorithm, soft-delete semantics, ownership rules, session model, admin moderation shape, cron policy.
2. *Shared data* — language-agnostic data files (the slug word-list `slugWords.ts` / `slugs.py`) extracted to a shared location. Sufficient for: anything that is data, not code.
3. *Shared library* — a third package both repos consume. Justified only when (1) and (2) fail and the duplication is large, behaviour-load-bearing, and stable. Default position: rejected by invariant 16.
4. *Shared service* — a third coordinating process. Rejected by invariant 16 as superfluous cloud unless research surfaces an existing requirement that demands it.

Cite precedent: the precepts submodule (`~/Programming/precepts`) is itself a shared-spec precedent; glass-ui composables (`useWindowedStore`, `useSortable`) are shared-code precedent at the frontend layer; no @mkbabb backend is shared today.

### R3 deliverable shape (H4 hardening — load-bearing)

R3 must emit a **1-row-per-target disposition table** that becomes the literal substrate for `CRUD-CONTRACT.md §9` and the §10 conformance matrix. The table:

| Target | Rationale | Admit-rule passed? | Disposition (contract / data / library / service) | Conformance assertion |
|---|---|---|---|---|

One row per: slug algorithm, slug word-list, identity (slug ↔ id ↔ hash), ownership rules, visibility states, soft-delete semantics, session model, admin actions, cron/TTL policy, hash policy, migration discipline. R3 cannot ship narrative; the table is the deliverable.

The **"shared data" admit-rule** binds with three concrete tests (any failure → reject the row out of *data* and into *contract*):

1. **Size** — the data fits in a single file ≤ 10 KB *or* a single npm/PyPI package with no runtime dependencies.
2. **Drift-correctness** — divergence between the two repos' copies is a *correctness* bug (slug-generation collisions), not a stylistic preference. Drift between fourier and value.js word-lists changes which slugs are generated; the cohort cannot tolerate it.
3. **Language-agnostic** — the data is consumable from both Python and Node without a parser or transpiler beyond standard JSON/YAML/TSV.

R3's recommendation is binding on B.W1's contract authoring.

## Lane R4 — scaling, KISS bounds, and the image-blob question

**Deliverable**: `research/R4-scaling-bounds.md`.

The persistence story that scales without contrivance (invariant 12). For the converged `visualization` entity:

- Soft-delete + TTL/cron policy — when does a soft-deleted visualization become hard-deleted; how is restoration possible; what does the cron query look like *without* the unbounded `$nin` pattern A.W4 retired.
- Ownership and anonymous publish — fourier today admits anonymous publish (audit `e-…md`: produces `user_slug: None` orphans); decide the contract.
- Single-replica honesty — fourier's rate-limiter and `_suspended_cache` are process-local; A.W4 makes the constraint explicit. B inherits that constraint; assess whether the `visualization` entity needs anything different.
- Image-blob scope decision — image + thumbnail blobs are inline in Mongo docs today, with a `storage_budget_gb` eviction band-aid. Two options: (a) admit the redesign to B's scope (with its own sub-research and challenge), or (b) defer to tranche C. Recommend with rationale; the default is (b).

## Lane R5 — migration safety

**Deliverable**: `research/R5-migration.md`.

Move existing fourier snapshot/gallery data and value.js palette data to the converged model without loss (invariant 17). Decide:

- Clean cutover (the brittleness window in B.md §8) or dual-read window? The latter is the very legacy code the invariants forbid unless research proves a clean cutover is impossible.
- Backfill verification: count-before / count-after, spot-check N random docs, schema-validate every migrated doc.
- Reversibility: is a rollback script possible, or is the migration one-way with a verified completeness proof?
- value.js precedent: `value.js/api/src/migrate-slugs.ts` and `migrate-oklab.ts` are extant data-migration scripts. Read them; extract the @mkbabb migration idiom; converge on it.

## Lane R6 — constellation timing

**Deliverable**: `research/R6-timing.md`.

value.js is mid its own tranche A (planning-only at 2026-05-18; demo un-break, NOT CRUD). B's W2 lane (value.js's palette facility) cannot open until value.js's CRUD peer tranche opens, which cannot open until value.js-A closes. Map:

- value.js-A's wave schedule, current status, and projected close.
- The sequence — fourier-A close → fourier-B open → (B.W0..Wχ proceed) → value.js-A close → value.js-CRUD-tranche open → (B.W2 unblocks).
- Risk: value.js-A is read-only-augmented-from-six-lane-audit; its close timing is uncertain.
- Mitigation: B.W1 (the contract) and B.W3 (fourier entity + migration) do **not** depend on value.js's lane and can proceed; B.W4 (convergence wiring onto value.js's new facility) is the only fourier wave that hard-blocks on the cross-repo lane.

## Output

Each lane writes its `research/R{N}-*.md` deliverable. The challenge wave (Wχ) reads all six, runs adversarial probes (read every cited `file:line`, run the cited grep, re-derive the cited count), and emits `audit/challenge.md`. The implementation waves W1–W5 are then re-synthesized into hardened `waves/W*.md` specs.
