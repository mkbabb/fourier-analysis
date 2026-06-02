# J — the visualization REMIX tranche (CRUD + atom-diff provenance; the fork/version substrate fourier earns)

**Tranche letter**: J — fourier-analysis's successor to I (the constellation-modernization tranche). Where I asked *is the platform modern?* and adopted glass-ui's AQ substrate, J asks the question I left open: **the viz-server has a `fork_count` READ side with zero write side and no atom-diff — does it earn the fork/version/provenance substrate value.js already ships, and does the remix flow become a recorded, agent-legible diff?**
**Predecessor close**: I — `docs/tranches/I/FINAL.md` (CLOSED 2026-06-02). A–I all CLOSED (ordering λ′, `docs/tranches/CANONICAL-ORDERING.md §18`) — with I's e2e/axe evidence **honestly deferred to J.W6 per inv-27** (I closed on a documented deferral, no covering green CI run for the e2e arm; that gap is the thing J's EVIDENCE wave exists to repair — so "GREEN" is not asserted over it). I closed the modern-web themes (γ content-visibility, δ scroll-driven, ε View Transitions, θ image/privacy) and adopted glass-ui `^3.1.0` + keyframes `^2.2.0`; ~65% of the original I plan converged into glass-ui's AQ tranche (the de-dup the leverage principle predicted). I left the e2e/axe CI evidence booked-not-asserted and the ι tail (CSP propagation, `fetchLater()`, `scheduler.yield()`) booked.
**Authored**: 2026-06-02 — from the constellation audit `glass-ui:docs/constellation/next/audit/A3-fourier-valuejs.md` (the WAVE-D seed; **the seed lives in the glass-ui hub repo — it is repo-qualified, NOT copied/forked**, the same way INVARIANTS.md qualifies glass-ui precepts) and its CORE directive: spec the fourier visualization CRUD + REMIX API. **Deep-audit-refined 2026-06-02** (`docs/audits/runs/2026-06-02-J-deep-audit/`): the 6-agent + synthesis fold sharpened W0/W1 (evidence-chain + the chronic ledger) and W2 (the P0 standalone-Mongo transaction re-expression `design/J.W1-crud-remix.md §11`, the canonical `/diff` shape doc `design/J-diff-shape.md`, the publish-visibility CORE facet `design/J.W1c-publish-visibility.md`), and PROMOTED WAVE-C to a declared design wave.
**Mode**: **direct** for the fourier-local waves (the CRUD/REMIX server work, scheduler.yield, content-visibility on the gallery grids, the e2e/axe evidence — fourier's own clean tree, strongly-gated by inv-27 green CI); **authored-now / executed-on-clean-checkout** under **inv-16′** for the cross-repo arm (value.js-J adopts the same atom-diff PATTERN; the constellation may be mid-flight — the value.js arm is a NAMED, ledgered, per-repo-green-CI-gated ask, NOT a silent sweep).
**Open**: NOT YET — J is AUTHORED only and awaits the user's "Begin," exactly as H and I did. Phase 0 (W0 audit intake) opens on authorization.

---

## §1 — Thesis

I made the platform modern; it did not touch the data model. The constellation audit (A3) found the asymmetry file:line — **fourier's viz-server has a remix READ side and no remix WRITE side.** `api/lib/crud/cursors.py:21` maps a `most-forked` sort onto a `fork_count` field that is **never written and is not even on the `Visualization` model** — a phantom sort. There is no fork endpoint, no version collection, no provenance walk, no atom-diff. value.js's palette-server, by contrast, ships the whole fork+version+provenance machinery (`forkPalette`, `palette_versions`, `getProvenance`, `revert`) but **also** has no atom-diff: its `/provenance` answers "who did this descend from", never "what changed between this and its parent".

The deep-audit fold (2026-06-02) widened the CORE to its **second CRUD half**: a viz/palette has two distinct mutation intents the data model must keep categorically apart — **remix** (fork → a NEW row, a recorded atom-diff, a provenance edge) and **publish** (an idempotent in-place visibility flag-flip on the SAME row — never a duplicate). The publish-visibility facet (`design/J.W1c-publish-visibility.md`) is a CORE-W1 sibling of the remix spec: `POST /:slug/{publish,unpublish}` two-ways (private↔public), structurally anti-duplicating (its only write verb is `$set` on `{slug}`), and the first live caller of the twice-dead `visibility_illegal_transition` guard (`errors.py:59`). Remix creates the row; publish flips its flag; the two compose (remix-then-publish) but never conflate.

So the gap is two-sided and the close is symmetric: **fourier INHERITS the fork/version/provenance substrate value.js already proved; both repos GAIN the atom-diff layer.** The audit's KISS line is the spine — a viz's remixable state is a small, flat, content-addressable bag of named config atoms (`active_bases`, `n_harmonics`, two settings sub-objects, `palette_slug`); a diff is a per-atom set-difference; a remix is fork + a recorded atom-diff; provenance edges carry `{fromHash, toHash, atomDiff}`; the chain is single-parent LINEAR — no DAG, no merge, no rebase, no CRDT. The remix API is designed agent-legibly because a future WebMCP tool surface (Early-Preview; booked, not built) exposes it verbatim.

J also closes the two threads I left booked: the **highest remaining INP lever** (`scheduler.yield()` on the epicycle/gallery hot paths — named in I's ι tail, never executed) and the **e2e/axe CI evidence** I deferred to CI (inv-27 — no covering run, so no green claim). And it folds the `content-visibility` application gap the audit found (the gallery grid never adopted glass-ui's `.deferred-section` — one utility, an unapplied consumer) and the ι tail leaf (CSP/`fetchLater`).

J is governed by the same leverage discipline I was, narrowed to fourier's own surface: the CRUD/REMIX server is the CORE (the value, ≥2-consumer by construction); the perf/a11y waves are the leaf wins; the cross-repo value.js arm is the inv-16′ ask. It refuses the anti-patterns it was born to avoid — no DAG/merge/CRDT (the KISS guardrails are named in §9), no shared package (the atom-diff is a shared PATTERN, inv-16/inv-26), no phantom substrate (every endpoint names a real consumer, inv-15).

## §2 — Binding question

> The viz-server ships a `fork_count`/`most-forked` READ side with no write side, no version collection, no provenance, and no atom-diff. value.js ships fork+version+provenance but no atom-diff. **Which of the missing substrate does fourier EARN now (≥2-consumer-gated), what is the KISS atom-diff/remix/provenance shape both repos share as a PATTERN, and does the remix flow become a recorded, agent-legible diff — without inventing a DAG?**

The answer is the close: fourier earns the whole fork/version/provenance substrate (it is ≥2-consumer by the existing `most-forked` sort + the diff-viewer + the provenance breadcrumb); the shared shape is the 5-atom bag + the `{parent_hash, set_hash, atom_diff}` edge (`design/J.W1-crud-remix.md`); the remix becomes a recorded diff persisted on a new `VisualizationVersion` document; and the model stays single-parent linear (no DAG). The cross-repo `/diff` shape parity with value.js-J is verified at close.

## §3 — Goal criterion and completion criterion (paired)

**Goal criterion.** Land the visualization CRUD + REMIX API — the CORE (constellation WAVE D) — plus the consumer-backed leaf perf/a11y waves I left booked, sequenced by leverage:

- **CORE (W1 design → W2 IMPL)** — the data-model, in two halves:
  - *remix half* (`design/J.W1-crud-remix.md`): the 5 config atoms, per-atom + set-hash, the `visualization_versions` collection with the diff-bearing edge, `POST /:slug/remix` (fork + recorded diff), `GET /:slug/{forks,provenance,diff?from=,versions}`, the `fork_count` write-side that makes the existing `most-forked` sort real. The atom-diff core is a shared PATTERN, canonically named **`atomdiff`** (`api/lib/crud/atomdiff.py` + value.js `lib/crud/atomdiff.ts`), authored once, adopted twice (value.js-J the twin), both binding to the canonical repo-neutral `/diff` envelope `design/J-diff-shape.md`.
  - *publish half* (`design/J.W1c-publish-visibility.md`): `POST /:slug/{publish,unpublish}` — the idempotent in-place visibility flag-flip (private↔public), no-duplicate-by-construction, the guard's first live caller. Symmetric with the value.js peer (booked as an inv-16′ ask).
- **PERF/INP (W3)**: `scheduler.yield()` on the epicycle/gallery hot paths (the highest remaining INP lever, named in I's ι tail) behind a feature-detected ≤20-LOC floor; a measured INP delta on the heaviest interaction.
- **CWV (W4)**: `content-visibility` on the gallery grids (the audit's unapplied `.deferred-section` consumer); a measured CWV delta.
- **WC design-refinement (W5)**: the promoted 4-lens design wave landing on the CORE UI surfaces (gallery, diff-viewer, publish UI); symmetric with value.js-J's WC; retires the `cartoon-card` dead-class shim.
- **EVIDENCE (W6)**: the e2e/axe CI evidence I left booked (the γ LCP/INP delta, the δ scroll-anchor pass, the new remix-flow e2e + the publish-flow e2e) executed against the Python backend in CI — the inv-27 green claim I could not make in-session.
- **TAIL (W7)**: the ι tail leaf — per-consumer CSP propagation of H.γ's recipe (already fourier-SOURCED) + `fetchLater()` analytics batching behind detection.

**Completion criterion (the evidence).** The close holds when:
- **CORE (remix)**: `POST /:slug/remix` creates a child with a recorded atom-diff and bumps the source `fork_count` via an **ordered, idempotent, content-addressed write sequence** (`design/J.W1-crud-remix.md §11` — topology-honest, NO Mongo transaction; standalone-Mongo-safe; delete-race-guarded; the conditional-last `fork_count $inc` self-heals); `GET /:slug/diff?from=` returns the canonical `ops` envelope (`design/J-diff-shape.md`) between two on-chain versions, idempotent + ETag-able; `/forks` + `/provenance` (within-viz version chain) + the cross-viz `fork_of` breadcrumb walk + `/versions` (bounded ≤50, no cursor) read clean; the `most-forked` cursor sort is write-backed (no phantom); single-parent linear provenance verified (no DAG primitive shipped); `canonical_digest` is the one serializer (`§12`); every error is RFC 9457 problem+json; fourier CI green (run id, inv-27).
- **CORE (publish)**: `POST /:slug/publish` flips a private (`draft`) row to `public` in place — SAME slug/`_id`/`content_hash`/provenance, 0 new rows (the anti-duplication guarantee); re-publishing an already-public row is a 200 no-op; `unpublish` is the symmetric contract-legal flip (`public→unlisted`, never the forbidden `public→draft`); owner-gated (inv-14, anon→401); the `visibility_illegal_transition` guard reaches its first live call; fourier CI green.
- **PERF**: `scheduler.yield()` lands on the epicycle solve/morph + gallery render hot paths behind a feature-detected fallback (`scheduler.postTask` / `setTimeout` floor, ≤20 LOC); a MEASURED INP delta cited (not asserted); CI green.
- **CWV**: `content-visibility: auto` + `contain-intrinsic-size` on the gallery grid items (glass-ui `.deferred-section`, already-shipped utility); a measured CWV/render delta; CI green.
- **EVIDENCE**: e2e + axe run as part of a GREEN fourier CI run (not local-only, inv-27); the I-deferred γ LCP/INP + δ scroll-anchor evidence executed; the remix-flow e2e green.
- **TAIL**: the CSP propagation arm confirmed per-consumer (fourier's already shipped H.γ/I.θ); `fetchLater()` batched behind detection with the `sendBeacon` floor; security claims cite a verified header.
- **CROSS-REPO**: value.js-J adopts the atom-diff PATTERN as an inv-16′ ask (named, ledgered, per-repo-green-CI-gated); the `/diff?from=` response-shape parity between fourier + value.js verified.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate + the green CI run ids; CANONICAL-ORDERING → ordering μ′.

The §7 hard-gate list is the binding ledger.

## §4 — Wave sequence (CORE + consumer-backed leaf wins + close)

J is a **data-model tranche**, not a modern-web modernization tranche — so the deep-audit fold (`docs/audits/runs/2026-06-02-J-deep-audit/` A1/Q5) **dropped the vestigial 6-wave modern-web spine mapping J inherited from I**. That spine was the right frame for I (a modernization tranche); forcing a data-model tranche onto it produced a CSS-platform "category-shuffle" (it re-slotted `content-visibility` into the CWV slot, then declared the slot empty). J is honestly presented as: **the CORE (the value — remix + publish) leads; consumer-backed leaf wins follow; the promoted WC design-refinement wave dresses the CORE's UI surfaces; the close reconciles.** What J does NOT do (no fourier-local lever) is named in §4.1 rather than dressed as a refuted spine wave.

The W0 audit + W1 design are **DEV** (planning); the **DEV/IMPL boundary** falls between W1 (the design docs, this tranche's planning output) and W2 (the first implementation wave).

| Wave | Disposition | Contents |
|---|---|---|
| **W0** | DEV | Open + audit intake + **evidence-chain hygiene + chronic ledger** (the deep-audit fold). Re-confirm I close (A–I closed, ordering λ′; I's e2e/axe honestly deferred to J.W6); repo-qualify the `glass-ui:`A3 WAVE-D seed; write `CANONICAL-ORDERING §19 / ordering μ′` (done — the chain head); seed the three discrete inv-16′ ADOPTION-ASKS rows (`valuejs-J-atomdiff`, `valuejs-J-publish`, `glass-ui-P5-inner-rounding` — done, `docs/constellation/ADOPTION-ASKS.md §7`); record the chronic ledger with terminal verdicts (§8 — KILL C1, KILL VAL-9, BOOK VAL-1 with a kill-date, force CH-6's terminal verdict). |
| **W1** | DEV | **CORE design — both halves + the canonical contracts.** (a) the remix spec `design/J.W1-crud-remix.md` (5 config atoms, per-atom + set-hash, `visualization_versions` + diff edge, the five endpoints, the `atomdiff` PATTERN, the KISS guardrails) **with the deep-audit amendments §11 (topology-honest remix), §12 (`canonical_digest`), §13 (the contract-gap gate)**; (b) the publish-visibility spec `design/J.W1c-publish-visibility.md`; (c) the canonical repo-neutral `/diff` envelope `design/J-diff-shape.md` (both repos bind to it — the parity probe asserts each impl against the doc, not against each other); (d) ratify the **WC design-refinement** spec set (`design/WC-design-*.md`). **This wave is the tranche's planning deliverable; the DEV/IMPL boundary closes here.** |
| ↑ DEV ────────────── IMPL ↓ | | **the DEV/IMPL boundary** — W0+W1 are planning; W2+ implement |
| **W2** | IMPL | **CORE implementation** (the value, both halves). `canonical_digest` first (`§12`); the `Visualization` fork fields + `VisualizationVersion` collection + diff edge; `api/lib/crud/atomdiff.py`; `POST /:slug/remix` (the ordered idempotent content-addressed write sequence, `§11` — NO transaction); the publish/unpublish verb pair (`J.W1c`); `GET /:slug/{forks,provenance,diff?from=,versions}` + the cross-viz `fork_of` breadcrumb walk; the `fork_count` write-side; the `§13` contract gaps (palette_slug FK, bounded `/versions`, hand-typed response twins, …); the additive idempotent migration; unit + integration + conformance. |
| **W3** | IMPL | **PERF/INP** — `scheduler.yield()` on the epicycle solve/morph + gallery render hot paths behind a feature-detected ≤20-LOC floor (`scheduler.postTask` / `setTimeout`). The highest remaining INP lever (I's ι tail). A measured INP delta cited. |
| **W4** | IMPL | **CWV** — `content-visibility: auto` + `contain-intrinsic-size` on the gallery grid items via glass-ui's already-shipped `.deferred-section` (the audit's unapplied consumer). A measured CWV/render delta. |
| **W5** | IMPL | **WC — frontend-design refinement** (the PROMOTED wave; symmetric with value.js-J's WC). The 4 lenses (`design/WC-design-{typo-color,layout,motion,atmosphere-a11y}.md`) landing on the surfaces the CORE renders on — **the gallery grid, the diff-viewer, the publish/visibility UI**. Threads into the CORE (it dresses what W2 builds; A6-5 — fourier's WC is rewired to thread J.W1 the way value.js's does, not declare it "orthogonal"). Brings the `cartoon-card` dead-class shim home (`web/src/style.css:98-108` — a resurrected retired class, D.W4 artifact; retired here, NO-LEGACY). |
| **W6** | IMPL | **EVIDENCE** — the I-deferred e2e/axe CI proof: the remix-flow e2e (create→remix→diff→provenance), the **publish-flow e2e** (publish→public-listed→unpublish→delisted, no-duplicate), the γ LCP/INP delta, the δ scroll-anchor pass, axe on the gallery + diff-viewer + the WC-refined UI; all as part of a GREEN fourier CI run (inv-27 — the green claim I could not make in-session). |
| **W7** | IMPL | **SECURITY/TAIL** — the ι tail leaf: per-consumer CSP propagation of H.γ's recipe (already fourier-SOURCED, confirm intact post-remix/publish-endpoints) + `fetchLater()` analytics batching behind detection (`sendBeacon` floor). |
| **W8** | DEV | Close — reconcile PROGRESS; `FINAL.md` (gate table, green run ids, the overfitting audit, the inv-16′ value.js-J ledger + the `/diff` shape-parity verdict against `J-diff-shape.md` + the publish-envelope-parity verdict + the chronic-resolution block); CANONICAL-ORDERING → ordering μ′ (now written §19); 30-day stale-watch re-triggered (ADOPTION-ASKS §3/§4 the canonical owner of the inherited coordination chronics). |

### §4.1 — What J does NOT do (no fourier-local lever) — recorded, not dressed as a refuted wave

J deliberately does not author two capability areas, because fourier has no consumer-backed lever for them at HEAD. Recorded plainly (the deep-audit A1/Q3 correction — these are not "refuted spine waves", they are simply not fourier-local work):

- **CSS-platform overlay/forms substrate (anchor positioning, `@supports` overlay, `field-sizing`, `base-select`):** glass-ui-rooted (I.β KEYSTONE) — CONVERGED into glass-ui's AQ tranche per the I de-dup; fourier ADOPTS it via `glass-ui ^3.1.0`, it does not author it. There is no fourier-local anchor/forms lever. (The one fourier-local CSS-platform leaf — `content-visibility` on the gallery grid — IS landed, as the CWV wave W4; that is an honest re-slot, not a refute.)
- **Motion / View Transitions:** fourier already shipped its VT arm in I.ε (`/w/`↔`/v/` route-morph via `startViewTransition`, `262c3d0`); the FLIP-engine retirements are glass-ui/keyframes-owned (I.ε / inv-30). The remix/diff/publish flows have no route-morph surface that earns a VT wave (the diff-viewer is a CSS-Custom-Highlight leaf under the CORE consumers, §5 of the remix spec — and its visual polish is the WC wave, W5, not a motion wave). The WC design-refinement's `motion` lens (`design/WC-design-motion.md`) covers the in-place micro-motion the UI does earn — orchestrated via glass-ui/keyframes, not a fourier VT engine.

## §5 — Inherited invariants

J inherits all prior invariants (`docs/tranches/INVARIANTS.md`, inv-1…30 + the named C/F/G/H/I additions, incl. inv-16′) unchanged. The load-bearing ones for J:

- **inv-14 — one converged entity per user-named noun, with a typed owner.** The remix child is a `Visualization` row with a required non-null `owner_slug` sourced from the session (never the body); an anonymous remix is a 401, never an orphan (the `visualizations.py:106-108` precedent).
- **inv-15 — domain-model-in-library, persistence-in-app + substrate-without-consumer-is-binary.** Every new endpoint names a real consumer (§5 of the design doc): the `most-forked` sort (existing), the diff-viewer, the provenance breadcrumb. The WebMCP tool surface is BOOKED, not built (Early-Preview) — named, not phantom.
- **inv-16 — shared-by-contract; per-language utility modules admitted, frameworks rejected.** The atom-diff is a shared PATTERN (`lib/crud/atomdiff.py` + `lib/crud/atomdiff.ts`), authored once, adopted twice. NO shared package, NO `BaseCRUDRouter`/framework-in-disguise (the Wχ.P1 certification holds — each router composes the helpers explicitly).
- **inv-16′ — authorized-cross-repo-sweep.** The value.js-J atom-diff adoption is a NAMED, ledgered ask in `docs/constellation/ADOPTION-ASKS.md`, its own commit, gated on value.js's own green CI (inv-27). fourier's write surface for the cross-repo arm is `fourier-analysis/docs/**` only.
- **inv-26 — single-contract-source (hand-typed-canonical, no codegen).** The remix/diff request+response shapes are hand-typed Pydantic; the web client's TS twin (`web/src/lib/types.ts`) is the single source for the visualization boundary. No OpenAPI→TS codegen revival (the H.δ decline holds — the raw-`Response` ETag/projection surface cannot be honestly codegen'd).
- **inv-27 — green-means-green.** Every "green" in the close cites a CI run id GREEN on EVERY job. The e2e/axe evidence wave (W6) lands the green claim I could not make in-session (no covering run = no claim).
- **inv-29 — progressive-enhancement-floor.** `scheduler.yield()` (W3) and `fetchLater()` (W7) ship behind feature-detection with the prior path as the floor (`scheduler.postTask`/`setTimeout`; `navigator.sendBeacon`) — ≤20-LOC fallback, no rip-out.
- **inv-30 — platform-over-library.** No new library; J prefers the platform primitive (`scheduler.yield`, `fetchLater`, `content-visibility`, CSS Custom Highlight for the diff render) behind the inv-29 floor.

J adds **no new invariant** — it is a data-model + leaf-perf tranche, not a discipline-authoring one. (If W2 surfaces a remix-specific invariant — e.g. "a remix must change ≥1 atom" as a named contract rather than a 422 — it is recorded in `INVARIANTS.md` at close as a fresh integer; the clean sequence would continue at 31. Provisionally NOT reserved.)

## §6 — Cross-repo perimeter (inv-16′)

J's executable spine is **fourier-local**: the CRUD/REMIX server, `scheduler.yield()`, the gallery `content-visibility`, the e2e/axe evidence, the CSP/`fetchLater` tail — all against fourier's own clean tree, gated by inv-27 green CI.

The cross-repo arm is value.js-J, now **two ledgered asks** (`docs/constellation/ADOPTION-ASKS.md §4/§7` — seeded by the deep-audit fold; the entries the J plan previously *claimed* but lacked, the A6-3 honesty gap, are now real):
- **`valuejs-J-atomdiff`** — the atom-diff PATTERN over `PaletteColor[]` atoms (`forkPalette`→`remixPalette` records the diff; `PaletteVersion` gains `atom_diff`; `GET /:slug/diff?from=`; the canonical-named `lib/crud/atomdiff.ts` twin). The value.js fork machinery already exists (`api/src/services/palette/forks.ts`) — the ask is the diff layer, not the substrate; it binds to the canonical `design/J-diff-shape.md` envelope so the `/diff` shape is byte-isomorphic at the parity probe.
- **`valuejs-J-publish`** — the symmetric publish-visibility peer of `design/J.W1c-publish-visibility.md`: `POST /:slug/{publish,unpublish}` idempotent in-place flag-flip, the first live caller of value.js's dead inv-I-2 guard, **AND in the same change the [P0] fix it names** — `listPalettes` (`crud-list.ts:85`) is MISSING the `visibility="public"` filter, so private/unlisted palettes currently leak into the public browse list; the filter clause MUST land with the publish verb (inv-15 name-the-consumer).

Each is its own commit, gated on value.js's own green CI (inv-27), authored-now / executed-on-clean-checkout (the H.ε BOOK-ALL posture) — NOT a silent sweep against a mid-flight tree (inv-16 held). The cross-repo **`/diff` envelope parity** (against `J-diff-shape.md`, not against each other) **and the publish-response-envelope parity** are verified at the J close.

**Chronic deferrals — terminal verdicts (deep-audit A3/A4; the user's no-perpetual-punt demand):** the VAL-9 (`spring()→LinearStop[]` emitter) and VAL-1 (OKLab aurora-LUT) carries are value.js-J's concern, NOT fourier-J's — fourier disclaims them legitimately (both live entirely in value.js source; the consumers are value.js↔glass-ui↔keyframes, never fourier). The fold converts them from open books to terminal verdicts at value.js-J.W0: **VAL-9 → KILL** (keyframes.js already owns the emitter and glass-ui already consumes it from there — lifting to value.js inverts a dependency for zero de-dup gain; the ≥2-consumer gate is structurally unmeetable); **VAL-1 → BOOK with a hard kill-date** (ship IFF glass-ui's `deriveAurora()` + a 2nd consumer are live at the W0 re-check, else KILL at close — the conversion math stays in `oklab.ts`). The **CH-6** 6-tranche glass-ui-primitive carry (value.js's worst chronic) is flagged here as a **cohort-health item**: it must get a terminal verdict (KILL-as-moot / RE-EXPRESS-as-inv-16′-ask / SHIP) at value.js-J.W0, not a 7th book. fourier-J names these only to disclaim/flag them — they are not fourier residuals.

## §7 — Hard gates (completion criterion)

- **inv-27 green-means-green**: every "green" cites a CI run id GREEN on EVERY job (fourier; and the value.js-J arm per its own repo's green CI).
- **CORE (remix)**: `POST /:slug/remix` (fork + recorded atom-diff via the **ordered idempotent content-addressed write sequence**, `design/J.W1-crud-remix.md §11` — NO Mongo transaction, standalone-Mongo-safe, delete-race-guarded, conditional-last `fork_count $inc`, no-op-remix → 422 `urn:contract:remix-noop`, Idempotency-Key idempotent); `GET /:slug/diff?from=` (the canonical `ops` envelope `design/J-diff-shape.md`, idempotent, ETag-able, off-chain hash → 404); `/forks` + `/provenance` (within-viz chain, ≤50, cycle-guarded) + the cross-viz `fork_of` breadcrumb walk + `/versions` (bounded ≤50, no cursor) read clean; `fork_count` write-backed (the `most-forked` sort non-phantom); single-parent linear (no DAG primitive); `canonical_digest` the one serializer (`§12`); hand-typed Pydantic response twins (inv-26, no codegen); RFC 9457 problem+json on every error; the additive idempotent migration (with its `MIGRATIONS` registry entry) green; fourier CI green.
- **CORE (publish)**: `POST /:slug/{publish,unpublish}` flips visibility in place on the SAME `{slug}` row (0 new rows — anti-duplication structural); idempotent same-row no-op when already at target; `unpublish` targets the contract-legal not-public state (fourier `unlisted`, never the forbidden `public→draft`); owner-gated (inv-14, anon→401, non-owner→403); If-Match ETag-guarded (428/412); the `visibility_illegal_transition` guard reaches its first live call; the public-view filter is the named consumer (inv-15); fourier CI green.
- **PERF**: `scheduler.yield()` on the epicycle/gallery hot paths behind a feature-detected ≤20-LOC floor; a MEASURED INP delta cited; CI green.
- **CWV**: `content-visibility` on the gallery grid (glass-ui `.deferred-section`); a measured CWV/render delta; CI green.
- **WC (design-refinement)**: the 4 lenses land on the gallery/diff-viewer/publish UI; the `cartoon-card` dead-class shim retired (NO-LEGACY); axe-clean; CI green.
- **EVIDENCE**: e2e + axe + the remix-flow e2e + the **publish-flow e2e** + the I-deferred γ LCP/INP + δ scroll-anchor — all as part of a GREEN fourier CI run (inv-27).
- **TAIL**: CSP propagation confirmed intact post-remix/publish-endpoints; `fetchLater()` behind detection with the `sendBeacon` floor; security claims cite a verified header.
- **CROSS-REPO**: the two value.js-J asks booked (inv-16′, `ADOPTION-ASKS §7`); the `/diff` envelope parity (against `J-diff-shape.md`) + the publish-response-envelope parity verified.
- **overfitting audit** (inv-15): every J artefact carries ≥2 consumers, a demo, or is not shipped. The 5 atoms + the remix/publish endpoints each name a consumer; the WebMCP surface is booked-not-built.
- **chronic-resolution gate**: every chronic carried into J exits with a terminal verdict or a NAMED hard external gate (§8 — zero perpetual punts).
- pytest green; vue-tsc + build green; e2e + axe green — all as part of a GREEN fourier CI run, not local-only (inv-27).

## §8 — Cross-tranche debt + explicit deferrals (folded)

**Folded into J:**
- the WAVE-D CRUD/REMIX gap (CORE — W1 design → W2 IMPL): fourier inherits fork/version/provenance, both repos gain atom-diff;
- the **publish-visibility** CRUD facet (`design/J.W1c-publish-visibility.md`, the deep-audit fold) — the second CORE half; W1 design → W2 IMPL;
- the **WC frontend-design refinement** (the promoted wave) — the 4-lens aesthetic answer to P3, landing on the CORE UI surfaces → W5;
- the I-deferred **e2e/axe CI evidence** (γ LCP/INP delta, δ scroll-anchor pass) — booked-not-asserted at I close → W6 (executed against the Python backend in CI);
- the I ι-tail **`scheduler.yield()`** (named in I.ι, never executed — the highest remaining INP lever) → W3;
- the I ι-tail **CSP propagation + `fetchLater()`** → W7;
- the audit's **`content-visibility` application gap** (the gallery grid never adopted `.deferred-section`) → W4.

**Killed / recorded (chronic resolution — the deep-audit A4 verdicts; a chronic dropped without a record is the anti-pattern):**
- **C1 colour-lift** (`sampleToSVGPath` consume-ask, a 3-tranche fourier chronic B→C→D→G) — **KILLED + recorded**. fourier's `easings.ts` is byte-identical and self-sufficient; there is no fourier consumer that needs the value.js export (inv-15). The two-repo deadlock with value.js's PARKED supply (V-9) dissolves: nothing is owed. (Previously dropped silently by J — now recorded as killed.)
- **`cartoon-card` dead-class shim** (`web/src/style.css:98-108`, a D.W4 artifact, 14 consuming sites — a resurrected retired class) — **retired in the WC wave (W5)**, NO-LEGACY honored. It no longer rides J's docs without a home.
- **F-5 4th hand-type island** (`web/src/lib/equation/types.ts`) — a one-line inv-26 re-confirm at W1 (distinct equation-domain contract, not an inv-26 boundary duplicate), then dropped from the ledger.

**Named-forward (BOOKED, not built):**
- **WebMCP tool surface** (`registerTool("remix-visualization")` + `("diff-visualizations", {readOnlyHint:true})` + `("publish-visualization")`) — Early-Preview (Chromium 146 + flag). The remix/diff/publish endpoints are authored agent-legibly NOW so the tool wrapper is thin LATER — **the named successor K** (a thin wave when Chromium 146 ships stable). NOT a J wave (the audit's G5 verdict).
- **CSS Custom Highlight diff render** (the audit's G6 `highlight-text-ranges`) — the diff-viewer consumer of `GET /diff`; rides the CORE consumer surface (§5 of the remix spec) + the WC diff-viewer lens, web-client-side, evidenced in W6's axe pass.

**Disclaimed (value.js-J's concern, terminal verdicts at value.js-J.W0 — NOT a fourier residual):**
- **VAL-9** (`spring()→LinearStop[]` emitter) — chronic G→H→I→J; **KILL** (keyframes.js already owns the emitter, glass-ui already consumes it from there; lifting to value.js inverts a dependency for zero de-dup gain — the ≥2-consumer gate is structurally unmeetable).
- **VAL-1** (OKLab aurora-LUT) — chronic G→H→I→J; **BOOK with a hard kill-date** (ship IFF glass-ui's `deriveAurora()` + a 2nd consumer are live at the value.js-J.W0 re-check, else KILL at close; the conversion math stays in `oklab.ts`).
- both ≥2-consumer-gated on glass-ui's AQ aurora/spring state; named here only to disclaim — fourier holds no lever (inv-16).

**Declined (recorded, not deferred):**
- a DAG / merge / rebase / CRDT remix model — single-parent LINEAR only (the KISS line; `design/J.W1-crud-remix.md §9`); a multi-parent need is a DIFFERENT primitive in a DIFFERENT tranche;
- a cross-viz subject remix (changing `image_slug`/`contour_hash`) — that is a new visualization, not a descendant;
- a save-as / publish-as-copy path — publish is in-place only (`design/J.W1c §4`); duplication is remix's job (the bright line);
- a shared atom-diff PACKAGE — it is a shared PATTERN (inv-16, canonically named `atomdiff`), not a binary;
- a Mongo replica-set infra wave for cross-collection ACID — declined; the remix is re-expressed as ordered idempotent content-addressed writes instead (`§11`);
- an OpenAPI→TS codegen revival for the remix endpoints — the raw-`Response` ETag/projection surface cannot be honestly codegen'd (the H.δ decline holds, inv-26 satisfied by hand-typed-canonical).

**Coordination chronics (inv-16, maintainer-owned — `ADOPTION-ASKS §3/§4` is the canonical owner; J §10 re-triggers the 30-day stale-watch over them):** `dispatch.sh` retirement (gated on the 4th migration — Ask 3), the 7 cross-repo adoption asks (triaged: escalate Ask 3; the CH-8 palette-api→color volume rename reclassified out of the fourier stale-watch into the operator runbook). fourier holds no lever — booked, not folded.

## §9 — Brittleness window (provisional)

J plans NO brittleness window. The CORE (W2) is additive — new fork fields, a new version collection, new remix/publish endpoints; the migration is additive + idempotent (one `$set` per existing row, no destructive op); the publish facet writes the EXISTING `visibility` field (zero schema change, `design/J.W1c §7.1`). The leaf waves are each additive behind a feature gate (inv-29): `scheduler.yield()` (W3) reverts to its `setTimeout` floor; `content-visibility` (W4) is a CSS-only utility, revertible; the WC design-refinement (W5) is chrome-only (`web/src/`) and retires the `cartoon-card` shim without a behavioral change; the evidence wave (W6) ships only tests + CI; the tail (W7) is additive CSP/`fetchLater`. The cross-repo value.js arm is two independent commits, per-repo-green-CI-gated, revertible independently (inv-16′). No host-disruptive op.

## §10 — Successor

J's successor is named at close, contingent on what W2 surfaces:
- if the WebMCP tool surface graduates from Early-Preview (Chromium 146 ships stable), a **K** tranche wraps the agent-legible remix/diff endpoints in `registerTool` calls — a thin wave, the audit's G5 graduated;
- if value.js-J's VAL-1/VAL-9 gates are met by glass-ui's AQ aurora/spring state, those chronic deferrals ship there (NOT fourier-J's concern);
- the CSS Custom Highlight diff render (G6) may earn its own polish pass if the W6 axe evidence flags it (its visual home is the WC diff-viewer lens, W5).

The 30-day stale-watch re-triggers at J close (the I-tranche discipline).

End of J.md.
