# The value.js letter (2026-07-02, cross-repo input — the R-tranche fourier-N uplift asks FN-1..FN-7)

**Relayed from**: the value.js R-tranche pass-2/pass-3 convergence fleet — canonical evidence
`value.js/docs/tranches/R/audit/pass2/SYNTHESIS-v2.md` §5 (the CRUD-union **LEAVE** verdict) +
§6 (this uplift plan) + `dispatch-homes.md` PART A (the Q9 home resolution). Verified live
against fourier-analysis at HEAD and value.js `tranche-q` @ `e80b359` (value.js 1.2.0).

**Standing** (paired-authorship precedent: glass-ui `23abb7de`, keyframes `6a7ef8f`, N-era).
**fourier owns execution + lettering** — these are net-new **N candidates**, not a mandate;
fourier's head tranche M is deploy/design-only, so the CRUD-twin currency work has no home yet.
value.js authored this charter under its sanctioned docs-only cross-repo grant; **value.js
writes no fourier code** (inv-16 — the foreign-repo fence; fourier consumes/decides its own
tree). The fourier lead reviews, amends, re-letters (these need not be "N"; the number is
fourier's to assign), and owns the fold. **Tranche development only — NO implementation.**

**The pairing.** These items pair with **value.js R.W6** (the "twin-tie" wave). value.js R.W6's
own deliverables are all **value.js-tree-local** (5 inline wire-envelope fixture rows in
`value.js/api/test/conformance/diff.test.ts`, read locally; an in-tree contract-of-record note;
the recorded contract-currency invariant) — R.W6 **gates on nothing outside fourier or value.js
crossing the seam**. The two items that touch fourier's tree — **FN-5** (the twin-currency
invariant, mirror of value.js's R.W6 invariant), **FN-6** (fourier's own fixture reader), and
**FN-7** (the doc-relocation co-decision + the `CONSTELLATION.md` pointer) — are fourier-tree
writes fourier owns; value.js's in-tree note holds the binding in the interim, so **none of them
gate either repo's close**.

Every FN anchor below is re-grepped against the live fourier tree this pass; file:line cited.

---

## §0 — Why these exist (the CRUD-union verdict, one paragraph)

value.js R weighed the two CRUD backends (value.js TS/Hono `api/` ↔ fourier Python/FastAPI
`api/`) and resolved **LEAVE**: leave the code, keep the contract current, tighten the twin-tie.
Extract is impossible and was deliberately rejected on both sides (cross-language; fourier
`inv-16` "shared by contract, frameworks rejected" + `inv-26` "no codegen"; a shared package for
a ~145-LoC pure function is contrivance). Converge already happened where it matters — the union
EXISTS as the shared contract corpus (CRUD-CONTRACT v2.0.0 + SCHEMA + the CONFORMANCE-MATRIX +
`J-diff-shape.md`); the twins are wire-identical today; **zero copy-pasted code to de-duplicate**.
The one live risk is silent **twin-drift**, and it closes for the price of the R.W6 fixture rows
+ the paired contract-currency invariants (value.js R.W6 inv ↔ **FN-5**). That is the whole
reason this letter exists.

**Byte-parity across the twins is struck permanently** (do not attempt it): Python/JS float-repr
(`1.0`↔`"1"`) + negative zero are irreducible, and the set-hash constructions differ
*structurally* (value.js 64-hex pipe-join vs fourier's construction — demonstrated to differ on
identical inputs). `J-diff-shape.md` §6 is BINDING: each repo's probe binds to the **shape doc**,
never cross-asserts the sibling's output. The fixture asserts **shape**; each repo's `atomValues`
payload is asserted per-repo only.

---

## §1 — The three divergences are NOT drift (record, do not "unify")

value.js R inspected the twins and found three structural divergences that are **legitimate
per-repo design choices**, not drift. Recorded here so a future currency sweep does not
mistakenly try to unify them:

1. **Cascade/layering** — value.js's api is a typed-error boundary (`ApiError`); fourier renders
   RFC 9457 `application/problem+json` (`routers/visualizations.py:16-17`; `main.py:114`). Two
   correct idioms for the same wire contract.
2. **Transaction posture** — value.js wraps cross-collection writes in `services.withTransaction`
   (replica-set); fourier's create/fork uses content-addressed idempotent inserts
   (`DuplicateKeyError → pass`, `routers/visualizations.py:147-148`) rather than a replica-set
   txn. Different infra assumptions, both defensible (see FN-1).
3. **Index-lead order** — value.js leads its hot compound indexes with the `deletedAt` equality
   prefix (`value.js/api/src/db.ts:51-53`); fourier's gallery cursor sorts do not yet (see FN-2).

**What crosses the seam is knowledge, not code:**

- **fourier ADOPTS the `deletedAt`-leading index lesson** — value.js measured the shape win
  (`db.ts:45-53`: the three `{deletedAt:1, visibility:1, …}` compounds replace bare
  `{createdAt}`/`{voteCount,createdAt}`/`{forkCount,createdAt}` sorts that forced the planner to
  filter `deletedAt`/`visibility` in memory; **net-zero index count for a strictly better shape**).
  This is **FN-2**.
- **value.js OPTIONALLY adopts `canonical_digest`** — the reciprocal crossing: if fourier's
  digest primitive proves cleaner and parity holds, value.js takes it into its own `hash.ts`
  (value.js has no `canonical_digest` today; grep = 0). One-primitive, non-binding — recorded so
  the crossing is bidirectional, not a one-way ask.

---

## §2 — The FN charter (net-new N candidates; fourier owns shape + scheduling)

Verbatim-faithful to `SYNTHESIS-v2.md §6`, with each anchor re-verified against the live tree.

| # | Item | Shape | Live anchor (verified 2026-07-02) |
|---|---|---|---|
| **FN-1** | Heal the **create/fork non-atomic root-version window** via read-time/startup recompute (KISS, no replica-set dep) — **or** record the accepted gap as an invariant | small | `routers/visualizations.py:219-220` |
| **FN-2** | Adopt **`deletedAt`-leading compound indexes** for gallery cursor sorts (the value.js `db.ts` lesson) | small | value.js `api/src/db.ts:51-53` (the pattern) |
| **FN-3** | *Optional*: a thin `repositories/visualization.py` seam — a **boundary, not a framework** — over the **14× direct `get_db()`** in the viz router | optional | `routers/visualizations.py` (14×: `:69,174,255,303,360,410,440,506,633,699,742,814,867` + the `:60` module note) |
| **FN-4** | Unify `problem+json` construction under **one** FastAPI exception handler (raise typed exceptions; centralize the RFC 9457 rendering) | low | `main.py:114` (catch-all) + inline `errors.problem(...)` per route, e.g. `routers/visualizations.py:537` |
| **FN-5** | Extend **`inv-32`'s spirit** to the CRUD twins: any `atomdiff.py` / version-shape / URN-catalog change re-verifies the value.js twin + updates the CONFORMANCE-MATRIX (**pairs with value.js's R.W6 invariant**) | invariant | `INVARIANTS.md:69` (M-Inv 32, version-currency + re-verify-at-W0 discipline) |
| **FN-6** | Wire **fourier's own reader** for the wire-envelope shape fixture (value.js's rows are in-tree **in value.js**; fourier **vendors its copy** — recommended, symmetric isolation — or chooses otherwise; fourier-owned, guarded by FN-5) | small | `api/tests/conformance/test_diff_shape.py` (fourier's existing probe) |
| **FN-7** | **Co-decide the contract-doc neutral home** (relocation of `J-diff-shape.md`) **AND author the `CONSTELLATION.md` pointer** naming it the bilateral contract-of-record (**both fourier-tree writes**) | coordination | doc: `docs/tranches/J/design/J-diff-shape.md`; index: `docs/constellation/CONSTELLATION.md` |

### FN-1 — the create/fork non-atomic root-version window (detail, since it's the load-bearing one)

`create_visualization._insert` (`routers/visualizations.py:187`) performs **two sequential,
un-transactioned awaits**: `await db.visualizations.insert_one(insert_doc)`
(`:219`) then `await _write_root_version(…)` (`:220`). A crash between them leaves a
`visualization` row with **no depth-0 root `VisualizationVersion`** — the chain seed missing.
The same two-await shape recurs in `remix_visualization._insert` (the fork path, `:561`).

**The cure is cheap precisely because the root-version insert is already crash-safe:**
`_write_root_version` (`:110-150`) content-addresses the `_id` as `f"{viz_slug}:{set_hash}"` and
swallows `DuplicateKeyError → pass` (`:147-148`) — a re-insert of the same (viz, atoms) is an
idempotent no-op (the WAVE-D §11 property). So a **read-time or startup recompute** that
re-derives any missing root version from the live `visualization` doc closes the window with **no
replica-set dependency** (honoring divergence #2). If fourier judges the window acceptable
instead, **record it as an invariant** — either disposition satisfies FN-1.

### FN-5 — sequencing rider: author FN-5 BEFORE fourier M.W10 closes

**FN-5 should be authored before or with fourier M.W10** (the version-shape
transpose). M.W10 (`M.md:88`) is exactly the change FN-5 guards: it DELETEs the
phantom within-viz version chain, makes the `/diff` `to`-param real, and
recomputes `atom_diff` on migration — a direct touch of the version shape + the
`atomdiff` surface the twin-currency invariant re-verifies. If M.W10 lands
before FN-5 exists, the version-shape change ships with no guard demanding the
value.js twin + CONFORMANCE-MATRIX be re-verified. **Until FN-5 lands, value.js's
in-tree contract-of-record note + the shape-only fixture rows (R.W6) are the
interim protection**: a resulting envelope mismatch would be *caught* by
value.js's `diff.test.ts` shape rows (a loud conformance failure), not silently
merged — but that is a backstop, not the guard. Author FN-5 as the matched pair
of value.js's R.W6 invariant (§2 above) at or before M.W10 so the seam is
protected at the moment the shape moves, not after.

*(Anchor: fourier `M.md:88` M.W10 version-shape transpose · value.js
`docs/tranches/R/audit/coordination/COORDINATION-ANALYSIS.md §3.2` E12/G3 —
the FN-5-before-M.W10 ordering, said out loud.)*

### Named carry riding this charter (fourier-owned, NOT an FN item)

**R8-18** — the CONFORMANCE-MATRIX corrections + the fourier-web pin bump (the fourier-owned row
of `value.js/docs/tranches/R/audit/pass2/SYNTHESIS-v2.md §10`). Named here so the carry travels
with the document fourier will actually execute from; fourier schedules it, and it carries no
value.js gate.

---

## §3 — The Q9 home resolution (context fourier needs for FN-6 / FN-7)

value.js R resolved the two "where does it live" questions on a **verified decisive fact**:
value.js's api conformance suite has **ZERO cross-repo filesystem reads** — it binds to the
contract by *transcription* (`value.js/api/test/conformance/diff.test.ts:5-6` cites
`J-diff-shape.md` §3/§4 in its **docstring**, and re-encodes §3/§4's rules as `expect(...)`
assertions; it never `readFile`s a sibling path). That frames both fourier-facing decisions:

- **The wire-envelope FIXTURE** → value.js lands its **5 rows in-tree in value.js**, read locally
  (inline rows in `diff.test.ts`, adjacent to the assertions that transcribe §3/§4). value.js
  reads **only its own copy** and **never reads from fourier's tree**. This is the isolation-safe
  form of the SYNTHESIS §5 / FN-6 default. **fourier's reader is fourier's call** (FN-6): vendor a
  copy (recommended — preserves fourier's own CI isolation, symmetric with value.js's choice) or
  choose otherwise. Currency is held by the **paired contract-currency invariants** (value.js
  R.W6 inv ↔ FN-5), **not** a shared fixture file. Duplication-with-invariant-guard is the
  constellation's existing, working pattern for the contract itself — it is **not** drift.
  The 5 rows (from proto §6, transcribed vs §3/§4): `changed-scalar` · `added-before-absent`
  (added has only `after`) · `removed-after-absent` (removed has only `before`) ·
  `identical-empty-ops` (`ops:[]` never null; `identical:true`) · `reorder-degrades-to-changed`
  (no `moved` op — the closed triple).
- **The contract DOC** → **leave `J-diff-shape.md` physically where it is**
  (`docs/tranches/J/design/J-diff-shape.md`). value.js's own R.W6 deliverable is an **in-tree
  contract-of-record note** (in the value.js R docs) naming §3/§4 as binding, backed by the
  existing `diff.test.ts:5-6` docstring — held **within value.js's tree**, zero cross-repo cost.
  The **`CONSTELLATION.md` pointer** that elevates the doc as the bilateral contract-of-record is
  a **fourier-tree write** (the file exists only at `docs/constellation/CONSTELLATION.md` — value.js
  cannot author it without breaching the read-only-main-trees precept), so it **books to FN-7
  alongside the relocation**: the same asymmetry logic that defers a bilateral doc's neutral-home
  move defers the pointer that names it. **Neither the pointer nor the relocation gates R.W6**;
  the in-tree note makes both non-urgent.

---

## §4 — Fold routing (fourier's call)

The asks fold smallest-first: **FN-2**/**FN-4** are one-file riders; **FN-1** is a small
read-time/startup recompute (or an invariant record); **FN-3** is an optional boundary lift;
**FN-5** is one invariant (the mirror of value.js's R.W6 invariant — the two must be authored as
a matched pair or neither protects the seam); **FN-6** is fourier wiring its own reader against
its existing `test_diff_shape.py`; **FN-7** is the one coordination item (the doc-relocation
co-decision + the `CONSTELLATION.md` pointer, both fourier-tree writes, landing where the doc
lands). None blocks value.js R.W6 (value.js's deliverables are all value.js-tree-local); FN-5/FN-6
are the currency mechanism the twin-tie leans on, FN-7 is bookkeeping the in-tree note de-urgents.

Authored by the value.js R fleet under its sanctioned docs-only cross-repo grant; value.js writes
no fourier code (inv-16); the fourier lead reviews, amends, assigns the tranche letter, and owns
the fold. **Do NOT commit on value.js's behalf; the orchestrator commits.**
