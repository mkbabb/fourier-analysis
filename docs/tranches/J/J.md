# J — the visualization REMIX tranche (CRUD + atom-diff provenance; the fork/version substrate fourier earns)

**Tranche letter**: J — fourier-analysis's successor to I (the constellation-modernization tranche). Where I asked *is the platform modern?* and adopted glass-ui's AQ substrate, J asks the question I left open: **the viz-server has a `fork_count` READ side with zero write side and no atom-diff — does it earn the fork/version/provenance substrate value.js already ships, and does the remix flow become a recorded, agent-legible diff?**
**Predecessor close**: I — `docs/tranches/I/FINAL.md` (CLOSED 2026-06-02). A–I all CLOSED GREEN (ordering λ′, `docs/tranches/CANONICAL-ORDERING.md §18`). I closed the modern-web themes (γ content-visibility, δ scroll-driven, ε View Transitions, θ image/privacy) and adopted glass-ui `^3.1.0` + keyframes `^2.2.0`; ~65% of the original I plan converged into glass-ui's AQ tranche (the de-dup the leverage principle predicted). I left the e2e/axe CI evidence booked-not-asserted and the ι tail (CSP propagation, `fetchLater()`, `scheduler.yield()`) booked.
**Authored**: 2026-06-02 — from the constellation audit `docs/constellation/next/audit/A3-fourier-valuejs.md` (the WAVE-D seed) and its CORE directive: spec the fourier visualization CRUD + REMIX API.
**Mode**: **direct** for the fourier-local waves (the CRUD/REMIX server work, scheduler.yield, content-visibility on the gallery grids, the e2e/axe evidence — fourier's own clean tree, strongly-gated by inv-27 green CI); **authored-now / executed-on-clean-checkout** under **inv-16′** for the cross-repo arm (value.js-J adopts the same atom-diff PATTERN; the constellation may be mid-flight — the value.js arm is a NAMED, ledgered, per-repo-green-CI-gated ask, NOT a silent sweep).
**Open**: NOT YET — J is AUTHORED only and awaits the user's "Begin," exactly as H and I did. Phase 0 (W0 audit intake) opens on authorization.

---

## §1 — Thesis

I made the platform modern; it did not touch the data model. The constellation audit (A3) found the asymmetry file:line — **fourier's viz-server has a remix READ side and no remix WRITE side.** `api/lib/crud/cursors.py:17,21` defines a `most-forked` sort over a `fork_count` field that is **never written and is not even on the `Visualization` model** — a phantom sort. There is no fork endpoint, no version collection, no provenance walk, no atom-diff. value.js's palette-server, by contrast, ships the whole fork+version+provenance machinery (`forkPalette`, `palette_versions`, `getProvenance`, `revert`) but **also** has no atom-diff: its `/provenance` answers "who did this descend from", never "what changed between this and its parent".

So the gap is two-sided and the close is symmetric: **fourier INHERITS the fork/version/provenance substrate value.js already proved; both repos GAIN the atom-diff layer.** The audit's KISS line is the spine — a viz's remixable state is a small, flat, content-addressable bag of named config atoms (`active_bases`, `n_harmonics`, two settings sub-objects, `palette_slug`); a diff is a per-atom set-difference; a remix is fork + a recorded atom-diff; provenance edges carry `{fromHash, toHash, atomDiff}`; the chain is single-parent LINEAR — no DAG, no merge, no rebase, no CRDT. The remix API is designed agent-legibly because a future WebMCP tool surface (Early-Preview; booked, not built) exposes it verbatim.

J also closes the two threads I left booked: the **highest remaining INP lever** (`scheduler.yield()` on the epicycle/gallery hot paths — named in I's ι tail, never executed) and the **e2e/axe CI evidence** I deferred to CI (inv-27 — no covering run, so no green claim). And it folds the `content-visibility` application gap the audit found (the gallery grid never adopted glass-ui's `.deferred-section` — one utility, an unapplied consumer) and the ι tail leaf (CSP/`fetchLater`).

J is governed by the same leverage discipline I was, narrowed to fourier's own surface: the CRUD/REMIX server is the CORE (the value, ≥2-consumer by construction); the perf/a11y waves are the leaf wins; the cross-repo value.js arm is the inv-16′ ask. It refuses the anti-patterns it was born to avoid — no DAG/merge/CRDT (the KISS guardrails are named in §9), no shared package (the atom-diff is a shared PATTERN, inv-16/inv-26), no phantom substrate (every endpoint names a real consumer, inv-15).

## §2 — Binding question

> The viz-server ships a `fork_count`/`most-forked` READ side with no write side, no version collection, no provenance, and no atom-diff. value.js ships fork+version+provenance but no atom-diff. **Which of the missing substrate does fourier EARN now (≥2-consumer-gated), what is the KISS atom-diff/remix/provenance shape both repos share as a PATTERN, and does the remix flow become a recorded, agent-legible diff — without inventing a DAG?**

The answer is the close: fourier earns the whole fork/version/provenance substrate (it is ≥2-consumer by the existing `most-forked` sort + the diff-viewer + the provenance breadcrumb); the shared shape is the 5-atom bag + the `{parent_hash, set_hash, atom_diff}` edge (`design/J.W1-crud-remix.md`); the remix becomes a recorded diff persisted on a new `VisualizationVersion` document; and the model stays single-parent linear (no DAG). The cross-repo `/diff` shape parity with value.js-J is verified at close.

## §3 — Goal criterion and completion criterion (paired)

**Goal criterion.** Land the visualization CRUD + REMIX API — the CORE (constellation WAVE D) — plus the consumer-backed leaf perf/a11y waves I left booked, sequenced by leverage:

- **CORE (W1 design → W2 IMPL)**: the atom-diff/remix/provenance spec (`design/J.W1-crud-remix.md`) then its implementation — the 5 config atoms, per-atom + set-hash, the `visualization_versions` collection with the diff-bearing edge, `POST /:slug/remix` (fork + recorded diff), `GET /:slug/{forks,provenance,diff?from=,versions}`, the `fork_count` write-side that makes the existing `most-forked` sort real. The atom-diff core is a shared PATTERN (`lib/crud/atomdiff.py`), authored once, adopted twice (value.js-J the twin).
- **PERF/INP (W3)**: `scheduler.yield()` on the epicycle/gallery hot paths (the highest remaining INP lever, named in I's ι tail) behind a feature-detected ≤20-LOC floor; a measured INP delta on the heaviest interaction.
- **CWV (W4)**: `content-visibility` on the gallery grids (the audit's unapplied `.deferred-section` consumer); a measured CWV delta.
- **EVIDENCE (W5)**: the e2e/axe CI evidence I left booked (the γ LCP/INP delta, the δ scroll-anchor pass, the new remix-flow e2e) executed against the Python backend in CI — the inv-27 green claim I could not make in-session.
- **TAIL (W6)**: the ι tail leaf — per-consumer CSP propagation of H.γ's recipe (already fourier-SOURCED) + `fetchLater()` analytics batching behind detection.

**Completion criterion (the evidence).** The close holds when:
- **CORE**: `POST /:slug/remix` creates a child with a recorded atom-diff, bumps the source `fork_count`, in one transaction (the value.js `forkPalette` shape, delete-race-closed); `GET /:slug/diff?from=` returns the `AtomOp[]` between two on-chain versions, idempotent + ETag-able; `/forks` + `/provenance` + `/versions` read clean; the `most-forked` cursor sort is write-backed (no phantom); single-parent linear provenance verified (no DAG primitive shipped); every error is RFC 9457 problem+json; fourier CI green (run id, inv-27).
- **PERF**: `scheduler.yield()` lands on the epicycle solve/morph + gallery render hot paths behind a feature-detected fallback (`scheduler.postTask` / `setTimeout` floor, ≤20 LOC); a MEASURED INP delta cited (not asserted); CI green.
- **CWV**: `content-visibility: auto` + `contain-intrinsic-size` on the gallery grid items (glass-ui `.deferred-section`, already-shipped utility); a measured CWV/render delta; CI green.
- **EVIDENCE**: e2e + axe run as part of a GREEN fourier CI run (not local-only, inv-27); the I-deferred γ LCP/INP + δ scroll-anchor evidence executed; the remix-flow e2e green.
- **TAIL**: the CSP propagation arm confirmed per-consumer (fourier's already shipped H.γ/I.θ); `fetchLater()` batched behind detection with the `sendBeacon` floor; security claims cite a verified header.
- **CROSS-REPO**: value.js-J adopts the atom-diff PATTERN as an inv-16′ ask (named, ledgered, per-repo-green-CI-gated); the `/diff?from=` response-shape parity between fourier + value.js verified.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate + the green CI run ids; CANONICAL-ORDERING → ordering μ′.

The §7 hard-gate list is the binding ledger.

## §4 — Wave sequence (mapped onto the canonical 6-wave modern-web spine)

The canonical modern-web spine is W1 perf/INP · W2 CWV/content-visibility · W3 forms/a11y · W4 CSS-platform · W5 motion/VT · W6 security/PWA. J maps onto it where a real, consumer-backed lever exists, and **REFUTES-in-the-record the spine waves with no fourier consumer** (§4.1). The CORE — the CRUD/REMIX API — is NOT a modern-web-spine wave (it is a data-model wave); it leads because it is the value, and the spine waves follow as the consumer-backed leaf wins.

The W0 audit + W1 design are **DEV** (planning); the **DEV/IMPL boundary** falls between W1 (the design doc, this tranche's planning output) and W2 (the first implementation wave).

| Wave | Disposition | Contents |
|---|---|---|
| **W0** | DEV | Open + audit intake. Re-confirm I close (A–I green, ordering λ′); intake A3's WAVE-D seed + the I-deferred ledger (e2e/axe CI evidence; the ι tail); confirm the value.js fork/version/provenance shape as the lift-source (file:line); seed the value.js-J inv-16′ ask; CANONICAL-ORDERING → ordering μ′. |
| **W1** | DEV | **CORE design** — the visualization CRUD + REMIX API spec (`design/J.W1-crud-remix.md`). The 5 config atoms, per-atom + set-hash, the `visualization_versions` collection + diff-bearing edge, the five endpoints, the shared `atomdiff` pattern, the migration, the test surface, the KISS guardrails. **This wave is the tranche's planning deliverable; the DEV/IMPL boundary closes here.** |
| ↑ DEV ────────────── IMPL ↓ | | **the DEV/IMPL boundary** — W0+W1 are planning; W2+ implement |
| **W2** | IMPL | **CORE implementation** (the value). The `Visualization` fork fields + `VisualizationVersion` collection + diff edge; `lib/crud/atomdiff.py`; `POST /:slug/remix` (fork + recorded diff, transaction-bound, delete-race-closed); `GET /:slug/{forks,provenance,diff?from=,versions}`; the `fork_count` write-side (the `most-forked` sort becomes real); the additive idempotent migration; the unit + integration + conformance test surface. |
| **W3** | IMPL | **PERF/INP** (spine W1) — `scheduler.yield()` on the epicycle solve/morph + gallery render hot paths behind a feature-detected ≤20-LOC floor (`scheduler.postTask` / `setTimeout`). The highest remaining INP lever (I's ι tail). A measured INP delta cited. |
| **W4** | IMPL | **CWV/content-visibility** (spine W2) — `content-visibility: auto` + `contain-intrinsic-size` on the gallery grid items via glass-ui's already-shipped `.deferred-section` (the audit's unapplied consumer). A measured CWV/render delta. |
| **W5** | IMPL | **EVIDENCE** (spine W3 forms/a11y + the I-deferred CI proof) — the e2e/axe CI evidence I left booked: the remix-flow e2e (create→remix→diff→provenance), the γ LCP/INP delta, the δ scroll-anchor pass, axe on the gallery + diff-viewer; all as part of a GREEN fourier CI run (inv-27 — the green claim I could not make in-session). |
| **W6** | IMPL | **SECURITY/TAIL** (spine W6) — the ι tail leaf: per-consumer CSP propagation of H.γ's recipe (already fourier-SOURCED, confirm intact post-remix-endpoints) + `fetchLater()` analytics batching behind detection (`sendBeacon` floor). |
| **W7** | DEV | Close — reconcile PROGRESS; `FINAL.md` (gate table, green run ids, the overfitting audit, the inv-16′ value.js-J ledger + `/diff` shape-parity verdict); CANONICAL-ORDERING → ordering μ′; 30-day stale-watch re-triggered. |

### §4.1 — Spine waves REFUTED (no fourier consumer)

The canonical spine has six waves; J lands four of them (W1 perf → W3; W2 CWV → W4; W3 forms/a11y → folded into W5 evidence; W6 security → W6). Two spine waves are **REFUTED-in-the-record** — fourier has no consumer-backed lever for them at HEAD:

- **Spine W4 — CSS-platform (anchor positioning, `@supports` overlay substrate, `field-sizing`, `base-select`):** REFUTED. This is glass-ui-rooted substrate (I.β KEYSTONE) that CONVERGED into glass-ui's AQ tranche per the I de-dup; fourier ADOPTS it via `glass-ui ^3.1.0`, it does not author it. There is no fourier-local CSS-platform lever left — the overlay/transform/forms substrate is glass-ui's, already consumed. Booking a fourier W4-CSS-platform wave would be inventing a wave for a feature with no fourier consumer (the audit's REFUTE rule). The one fourier-local CSS-platform leaf — `content-visibility` on the gallery grid — is the CWV wave (W4 above), not a separate anchor/forms wave.
- **Spine W5 — motion/View Transitions:** REFUTED. fourier already shipped its View Transitions arm in I.ε (`/w/`↔`/v/` route-morph via `startViewTransition`, `262c3d0`); the FLIP-engine retirements are glass-ui/keyframes-owned (I.ε / inv-30). There is no remaining fourier-local VT/motion lever. The remix-flow has no motion surface that earns a VT wave (a diff-viewer render is the highlight-ranges leaf under the CORE consumers, §5 of the design doc — not a motion wave). Booking one would be substrate-without-consumer.

This is the audit's discipline applied: map onto the spine where a real lever exists, refute the rest in the record rather than invent waves. The CORE (CRUD/REMIX) is the value; the four landed spine waves are its consumer-backed leaf wins.

## §5 — Inherited invariants

J inherits all prior invariants (`docs/tranches/INVARIANTS.md`, inv-1…30 + the named C/F/G/H/I additions, incl. inv-16′) unchanged. The load-bearing ones for J:

- **inv-14 — one converged entity per user-named noun, with a typed owner.** The remix child is a `Visualization` row with a required non-null `owner_slug` sourced from the session (never the body); an anonymous remix is a 401, never an orphan (the `visualizations.py:106-108` precedent).
- **inv-15 — domain-model-in-library, persistence-in-app + substrate-without-consumer-is-binary.** Every new endpoint names a real consumer (§5 of the design doc): the `most-forked` sort (existing), the diff-viewer, the provenance breadcrumb. The WebMCP tool surface is BOOKED, not built (Early-Preview) — named, not phantom.
- **inv-16 — shared-by-contract; per-language utility modules admitted, frameworks rejected.** The atom-diff is a shared PATTERN (`lib/crud/atomdiff.py` + `lib/crud/atomdiff.ts`), authored once, adopted twice. NO shared package, NO `BaseCRUDRouter`/framework-in-disguise (the Wχ.P1 certification holds — each router composes the helpers explicitly).
- **inv-16′ — authorized-cross-repo-sweep.** The value.js-J atom-diff adoption is a NAMED, ledgered ask in `docs/constellation/ADOPTION-ASKS.md`, its own commit, gated on value.js's own green CI (inv-27). fourier's write surface for the cross-repo arm is `fourier-analysis/docs/**` only.
- **inv-26 — single-contract-source (hand-typed-canonical, no codegen).** The remix/diff request+response shapes are hand-typed Pydantic; the web client's TS twin (`web/src/lib/types.ts`) is the single source for the visualization boundary. No OpenAPI→TS codegen revival (the H.δ decline holds — the raw-`Response` ETag/projection surface cannot be honestly codegen'd).
- **inv-27 — green-means-green.** Every "green" in the close cites a CI run id GREEN on EVERY job. The e2e/axe evidence wave (W5) lands the green claim I could not make in-session (no covering run = no claim).
- **inv-29 — progressive-enhancement-floor.** `scheduler.yield()` (W3) and `fetchLater()` (W6) ship behind feature-detection with the prior path as the floor (`scheduler.postTask`/`setTimeout`; `navigator.sendBeacon`) — ≤20-LOC fallback, no rip-out.
- **inv-30 — platform-over-library.** No new library; J prefers the platform primitive (`scheduler.yield`, `fetchLater`, `content-visibility`, CSS Custom Highlight for the diff render) behind the inv-29 floor.

J adds **no new invariant** — it is a data-model + leaf-perf tranche, not a discipline-authoring one. (If W2 surfaces a remix-specific invariant — e.g. "a remix must change ≥1 atom" as a named contract rather than a 422 — it is recorded in `INVARIANTS.md` at close as a fresh integer; the clean sequence would continue at 31. Provisionally NOT reserved.)

## §6 — Cross-repo perimeter (inv-16′)

J's executable spine is **fourier-local**: the CRUD/REMIX server, `scheduler.yield()`, the gallery `content-visibility`, the e2e/axe evidence, the CSP/`fetchLater` tail — all against fourier's own clean tree, gated by inv-27 green CI.

The **one cross-repo arm** is value.js-J: the atom-diff PATTERN adoption over `PaletteColor[]` atoms (`forkPalette` → `remixPalette` records the diff; `PaletteVersion` gains `atom_diff`; `GET /:slug/diff?from=`). It is:
- a NAMED, file-verified `ADOPTION-ASKS.md` entry (the value.js fork machinery already exists at `api/src/services/palette/forks.ts` — the ask is the diff layer, not the substrate);
- its own commit, gated on value.js's own green CI (inv-27);
- authored-now / executed-on-clean-checkout if the constellation is mid-flight (the H.ε BOOK-ALL posture) — NOT a silent sweep against a dirty tree (inv-16 held).

The `/diff?from=` response-shape parity between the two repos is verified at the J close (the audit's cross-repo `/diff` shape-parity check). The VAL-1 (OKLab aurora-LUT) / VAL-9 (`spring()→LinearStop[]` emitter) chronic deferrals are value.js-J's concern, NOT fourier-J's — they are ≥2-consumer-gated on glass-ui's AQ aurora/spring state and stay BOOKED-not-shipped until that gate is met (substrate-without-consumer is binary). fourier-J names them only to disclaim them: they are not a fourier residual.

## §7 — Hard gates (completion criterion)

- **inv-27 green-means-green**: every "green" cites a CI run id GREEN on EVERY job (fourier; and the value.js-J arm per its own repo's green CI).
- **CORE**: `POST /:slug/remix` (fork + recorded atom-diff, transaction-bound, delete-race-closed, no-op-remix → 422, idempotent); `GET /:slug/diff?from=` (on-chain `AtomOp[]`, idempotent, ETag-able, off-chain hash → 404); `/forks` + `/provenance` (≤50, cycle-guarded) + `/versions` read clean; `fork_count` write-backed (the `most-forked` sort non-phantom); single-parent linear (no DAG primitive); RFC 9457 problem+json on every error; the additive idempotent migration green; fourier CI green.
- **PERF**: `scheduler.yield()` on the epicycle/gallery hot paths behind a feature-detected ≤20-LOC floor; a MEASURED INP delta cited; CI green.
- **CWV**: `content-visibility` on the gallery grid (glass-ui `.deferred-section`); a measured CWV/render delta; CI green.
- **EVIDENCE**: e2e + axe + the remix-flow e2e + the I-deferred γ LCP/INP + δ scroll-anchor — all as part of a GREEN fourier CI run (inv-27).
- **TAIL**: CSP propagation confirmed intact post-remix-endpoints; `fetchLater()` behind detection with the `sendBeacon` floor; security claims cite a verified header.
- **CROSS-REPO**: value.js-J atom-diff ask booked (inv-16′); `/diff?from=` shape parity verified.
- **overfitting audit** (inv-15): every J artefact carries ≥2 consumers, a demo, or is not shipped. The 5 atoms + 5 endpoints each name a consumer; the WebMCP surface is booked-not-built.
- pytest green; vue-tsc + build green; e2e + axe green — all as part of a GREEN fourier CI run, not local-only (inv-27).

## §8 — Cross-tranche debt + explicit deferrals (folded)

**Folded into J:**
- the WAVE-D CRUD/REMIX gap (CORE — W1 design → W2 IMPL): fourier inherits fork/version/provenance, both repos gain atom-diff;
- the I-deferred **e2e/axe CI evidence** (γ LCP/INP delta, δ scroll-anchor pass) — booked-not-asserted at I close → W5 (executed against the Python backend in CI);
- the I ι-tail **`scheduler.yield()`** (named in I.ι, never executed — the highest remaining INP lever) → W3;
- the I ι-tail **CSP propagation + `fetchLater()`** → W6;
- the audit's **`content-visibility` application gap** (the gallery grid never adopted `.deferred-section`) → W4.

**Named-forward (BOOKED, not built):**
- **WebMCP tool surface** (`registerTool("remix-visualization")` + `("diff-visualizations", {readOnlyHint:true})`) — Early-Preview (Chromium 146 + flag). The remix/diff endpoints are authored agent-legibly NOW so the tool wrapper is thin LATER. A J-residual / WAVE-D adjacency, NOT a wave (the audit's G5 verdict).
- **CSS Custom Highlight diff render** (the audit's G6 `highlight-text-ranges`) — the diff-viewer consumer of `GET /diff`; rides the CORE consumer surface (§5 of the design doc), web-client-side, evidenced in W5's axe pass.

**Disclaimed (value.js-J's concern, NOT a fourier residual):**
- **VAL-1** (OKLab aurora-LUT) + **VAL-9** (`spring()→LinearStop[]` emitter) — chronic G→H→I deferrals, ≥2-consumer-gated on glass-ui's AQ aurora/spring state; stay BOOKED-not-shipped (substrate-without-consumer is binary). Named here only to disclaim: not a fourier-J residual.

**Declined (recorded, not deferred):**
- a DAG / merge / rebase / CRDT remix model — single-parent LINEAR only (the KISS line; `design/J.W1-crud-remix.md §9`); a multi-parent need is a DIFFERENT primitive in a DIFFERENT tranche;
- a cross-viz subject remix (changing `image_slug`/`contour_hash`) — that is a new visualization, not a descendant;
- a shared atom-diff PACKAGE — it is a shared PATTERN (inv-16), not a binary;
- an OpenAPI→TS codegen revival for the remix endpoints — the raw-`Response` ETag/projection surface cannot be honestly codegen'd (the H.δ decline holds, inv-26 satisfied by hand-typed-canonical).

## §9 — Brittleness window (provisional)

J plans NO brittleness window. The CORE (W2) is additive — new fields, a new collection, new endpoints; the migration is additive + idempotent (one `$set` per existing row, no destructive op). The leaf waves are each additive behind a feature gate (inv-29): `scheduler.yield()` (W3) reverts to its `setTimeout` floor; `content-visibility` (W4) is a CSS-only utility, revertible; the evidence wave (W5) ships only tests + CI; the tail (W6) is additive CSP/`fetchLater`. The cross-repo value.js arm is its own commit, per-repo-green-CI-gated, revertible independently (inv-16′). No host-disruptive op.

## §10 — Successor

J's successor is named at close, contingent on what W2 surfaces:
- if the WebMCP tool surface graduates from Early-Preview (Chromium 146 ships stable), a **K** tranche wraps the agent-legible remix/diff endpoints in `registerTool` calls — a thin wave, the audit's G5 graduated;
- if value.js-J's VAL-1/VAL-9 gates are met by glass-ui's AQ aurora/spring state, those chronic deferrals ship there (NOT fourier-J's concern);
- the CSS Custom Highlight diff render (G6) may earn its own polish pass if the W5 axe evidence flags it.

The 30-day stale-watch re-triggers at J close (the I-tranche discipline).

End of J.md.
