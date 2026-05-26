# L3 — Visualization stack audit (backend + frontend)

> *Wave B-audit-1, agent L3, authored 2026-05-26. READ-ONLY. HEAD `c7cfd82`.
> Builds on `docs/tranches/A/audit/W3.5-pipeline.md` (W3.5.d's pipeline
> inspection) and `docs/audits/runs/2026-05-18-fourier-tranche/f-design-math-functionality.md`.
> Cites file:line throughout; does not duplicate prior findings.*

## §0 — Goal + completion

**Goal.** Deep-inspect the upload → contour → coefficient → epicycle pipeline
end-to-end; surface residual defects beyond W3.5.d; classify by severity;
route B-territory items to their absorbing wave.

**Completion.** Eleven new defects identified across six stages (3 HIGH, 6
MEDIUM, 2 LOW); four items absorbed into B-waves; load-bearing finding
named at §7. No code touched.

## §1 — Substrate observed

Frontend ~3 950 LOC in `web/src/components/visualization/**`; backend ~1 920
LOC in `api/{routers,services}/**`; math library ~2 450 LOC in
`src/fourier_analysis/contours/**` plus the bases / epicycle modules. Reused
W3.5.d's data-flow inventory; cross-checked every cited file at the line
level. Cron + janitor + rate-limiter inspected per §4 brief.

## §2 — Data-flow graph

```
ImageUpload.vue
  │  drag/drop OR <input> click; POST FormData
  ▼
POST /api/images           (multipart) → store_image_asset
  │  Mongo.images insertOne {blob: Binary, thumbnail: Binary}
  │  client receives ImageMeta {image_slug, sha256, bytes}
  ▼
store.imageMeta (Pinia ref) → ContourSettings.vue immediate watcher
  │  fires runCompute() — extractContour then allSettled([epi, bases])
  ▼
POST /api/images/{slug}/extract-contour  (cache-keyed)
  │  Mongo.contours findOne {extraction_cache_key} → hit returns same shape
  │  miss: image_tempfile → computation.compute_contours → store_contour_asset
  ▼
ContourAsset {contour_hash, points:{x,y}, bbox, image_bounds}
  │
  ├── store.contour (shallowRef) → ContourEditorCanvas (SVG, magnet drag, VW simplify)
  │     │  onSave → store.saveContourPoints → POST /api/contours → new ContourAsset
  │     ⚠ HIGH: no auto-recompute fires after save (§3.4 D1)
  │
  └── parallel: POST /api/contours/{hash}/compute/{epicycles,bases}
        │  computation.{compute_epicycles, compute_bases} via submit_compute_job
        │  EpicycleChain.from_signal / build_animation_data
        ▼
        store.{epicycleData, basesData} (markRaw shallowRef)
        │
        ▼
        BasisCanvas.vue drawFrame (rAF-driven via anim.t watcher)
        │  useViewTransform → fourierPositionsAt → drawEpicycleCircles
        ⚠ HIGH: getViewTransform recomputes O(n) min/max per frame (§3.6 D5)
```

Transport: HTTP/JSON throughout (no websockets); IndexedDB persists drafts
(`draftStorage.ts`); module-scoped Map caches overlay HTMLImageElements
(`useImageOverlay.ts:9`).

## §3 — Stage inspections

### §3.1 — Image upload + ingestion

* **Shape.** Idiomatic FastAPI route with `UploadFile`; magic-bytes
  whitelist at `images.py:52-59`; sha256-keyed dedupe with race-safe
  `DuplicateKeyError` fallback at `image_storage.py:104-108`.
* **Defects.** None new beyond the `_image_response(doc)` mass-assignment
  unpacks DB shape directly — fine. The `programmatic fileInput.click()`
  call at `VisualizationView.vue:127` and `ImageUpload.vue:28` is a
  belt-and-braces dual entry but the second click handler at
  `VisualizationView.vue:221` (`@click="onCanvasClick"`) fires only when
  `!hasImage && !hasData`, so no double-prompt risk.
* **Perf.** AVIF thumbnail regenerated on every dedupe-hit
  (`image_storage.py:60-71`); cheap (~10 ms) but unnecessary churn. **LOW**.

### §3.2 — Contour extraction (backend)

* **Shape.** Cache-keyed via `extraction_cache_key` (sha256 +
  settings JSON); pipeline routes to `extract_contours` → tour →
  resample_arc_length → store_contour_asset.
* **Defects.**
  - `images.py:248` — `resample_arc_length(path, cs.n_points)` is invoked
    *after* `build_contour_tour([complex_contours])`, with `cs.n_points`
    sourced from the `ExtractContourRequest`'s contour_settings; the
    field default in `defaults.ts`/`shared.py` should match — if a client
    omits `n_points` whilst sending custom `n_harmonics`, the resample
    silently collapses to 1024 with no warning. **LOW (contract drift)**.
  - `pipeline.py:39-44` — `0.08` / `0.04` edge-density thresholds and
    `0.15` / `0.25` / `0.35` structure-fraction values are unannotated
    magic numbers. **LOW (hygiene)**.

### §3.3 — Contour storage

* **Shape.** Per-document upsert on `contour_hash`; bbox + image_bounds
  inlined; `extraction_cache_key` indexed for hit lookup.
* **Defects.**
  - `image_storage.py:165-178` — `compute_contour_hash` orders by
    coordinate pairs (W4.b's repair, confirmed live). Sound.
  - `image_storage.py:223` — `set_on_insert` filters out
    `last_accessed_at`, but the `$set` block re-writes the same field
    every upsert. The `result` variable is unused (`image_storage.py:224`).
    **LOW (dead var)**.
* **B-territory.** The asset doc embeds the full image blob as inline
  `Binary` (`image_storage.py:97`). With `max_upload_mb=10` and the
  16 MB BSON document limit, headroom is 6 MB; thumbnail Binary eats
  another ~50–200 KB. Migrate to GridFS or external object storage.
  **B.W2 — visualization-entity restructure**.

### §3.4 — Contour editor (frontend)

* **Shape.** SVG-based editor; `Point2D[]` flat list; closed Catmull-Rom
  spline via `closedSplinePath`; history stack via `useContourHistory`
  (deep-copy snapshots); pointer-capture drag via `usePointDrag` with
  magnet falloff `1 - offset/(radius+1)`.
* **Defects.**
  - **D1 (HIGH, correctness).** `workspace.saveContourPoints`
    (`stores/workspace.ts:230-249`) clears `epicycleData` and `basesData`
    but does NOT trigger a recompute, and the `ContourSettings.vue`
    auto-compute watcher (`ContourSettings.vue:138-147`) keys on
    `[strategy, blur, ..., nHarmonics, nPoints]` — none of which change
    on a save. Result: after the user saves an edited contour, the
    canvas stays blank until they perturb a setting or click Retry.
    Single observation: after saving the editor's points, the new
    `contour_hash` differs from the prior; no automatic settle.
    **Disposition: FIX-IN-A-RESIDUAL** (one-line in `saveContourPoints`:
    after `markRaw(result)`, fire `Promise.allSettled([computeEpicycles,
    computeBases])`).
  - **D2 (MEDIUM, perf).** `ContourEditorCanvas.vue:268-278` renders
    `<circle v-for="(pt, i) in points" :key="i">` for n=1024 SVG
    elements; every drag tick reactivity invalidates the full list. SVG
    is the wrong substrate above n≈300. **B.W2 — port editor to canvas**.
  - **D3 (MEDIUM, correctness).** `usePointDrag.ts:31-49` uses the
    initial `dragStartIdx` for the entire drag, applying magnet falloff
    relative to that fixed centre. If the user drags off-screen and back
    the deltas accumulate but `dragPrevPt` is updated at line 51 so the
    *next* tick's delta is small. Acceptable; flag as **LOW
    (semantic-only)**: the magnet is "drag from this anchor with
    incremental delta," not "drag a region of N points cohesively."
  - **D4 (LOW, UX).** The "Reset to extraction" button re-zips the
    initial `props.contour.points` (`ContourEditorCanvas.vue:201-203`)
    but never re-fetches from server, so it resets to the *initial*
    server contour at component mount, not the latest server-side
    extraction. Acceptable if the contour prop is reactive.

### §3.5 — Coefficient computation

* **Shape.** `submit_compute_job` wraps `asyncio.to_thread` with
  semaphore + timeout (`computation.py:29-53`). Idiomatic.
* **Defects.**
  - `computation.py:111-119` — Backend ships `index` field per W4.b
    (matches `BasisComponent.index` on frontend); confirmed.
  - `computation.py:121` — `np.linspace(0, 1, 3000, endpoint=False)` —
    confirmed W5.d closed-original-curve discipline.
  - `epicycles.py:54` — `EpicycleChain.__init__` sorts components by
    descending amplitude; the DC term `frequency=0` lands first and is
    drawn as a stationary disc of radius `|c_0|` (potentially the size
    of the figure). Frontend `drawEpicycleCircles`
    (`epicycles.ts:153-200`) renders it as a normal circle. **MEDIUM
    (cosmetic)**: the giant stationary DC circle dominates the visual.
    A graceful suppression at `nVis === 0` or `frequency === 0` is
    warranted. **FOLD-INTO-B.W4** (colors/visual lift).
  - `bases_evaluation.py:149` — `eps = 0.03` for polynomial-basis
    endpoint shrinkage is magic; defensible (Runge-phenomenon margin)
    but unannotated. **LOW (hygiene)**.

### §3.6 — Epicycle / basis render

* **D5 (HIGH, perf).** `useViewTransform.ts:21-24` calls
  `Math.min(...xs)`, `Math.max(...xs)` etc. on the full path each
  call; `getViewTransform` is invoked from `drawFrame` once per rAF tick
  (~60 fps). For default `n_points=1024` this is ~4 × 1024 ≈ 4 100 ops
  per frame, plus the variadic-spread allocates an arguments array of
  length 1024 four times per frame. At n_points=10 000 the spread
  approaches Chrome's argument-count limit (~64 k on V8) — a hard
  ceiling. Cache once when `epicycleData` / `basesData` identity changes.
  **FIX-IN-A-RESIDUAL** (memoize on path-identity).
* **D6 (MEDIUM, perf).** `BasisCanvas.vue` watcher at lines 417-422 fires
  on every change of `anim.t`, `anim.easedT`, `showGhost`,
  `showImageOverlay`. Vue's reactivity correctly batches these via the
  next-tick effect queue, but `easedT` is a `computed` derived from `t` —
  so each rAF tick triggers TWO reactive notifications. Harmless dedupe
  by Vue, but the watcher could key on `t` only. **LOW (micro-perf)**.
* **D7 (MEDIUM, correctness).** `drawMultiBasesFrame` at
  `BasisCanvas.vue:271-274` uses `(sumsForBasis as any)?.[level] ??
  (sumsForBasis as any)?.[String(level)]` — the `as any` defeats type
  safety because backend JSON keys are stringified ints whilst the
  pre-`build_animation_data` dict was typed `dict[int, ...]`. The
  bracket lookup is fragile; the type is `Record<string, {x, y}>`.
  Tighten the type, drop the cast. **FOLD-INTO-B.W1** (CRUD contract).
* DPR confirmed correct: `useCanvasSetup.ts:31` is
  `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`; matches the memory note.

## §4 — Visualization-side dock audit

* `EditorControlsDock.vue` — wraps `@mkbabb/glass-ui/dock` `GlassDock` +
  `DockIconButton`; collapsed-summary slot, expanded full-controls,
  `HoverPopover` nesting for magnet slider + overlay toggles. Idiomatic
  glass-ui adoption; per-button `--btn-hover-color` retint hooks.
* `EditorToolsPanel.vue` — NOT a dock; a `cartoon-card` with full-row
  Buttons (smooth / simplify / magnet). The pattern is correct for a
  panel-style affordance. No dock primitive used. Coexists with
  `EditorControlsDock` on desktop (dock = bottom overlay; panel = left
  column). Duplication of "smooth" / "simplify" / "magnet" affordances
  is intentional per the responsive grid: dock for stage interaction,
  panel for compositional configuration.
* `CanvasControlsDock.vue` — `GlassDock` + `DockIconButton` +
  `HoverPopover`; exposes `dockExpanded` via `defineExpose`. The parent
  (`VisualizationView.vue:75-76`) consumes `dockExpanded` to centre the
  dock when expanded. Idiomatic.
* No other dock-shaped components in `visualization/`.
* **All three are correctly hosted on glass-ui's `GlassDock`
  primitive** post the glass-ui v1.0 subpath migration. The duplicated
  overlay-toggle popover in `EditorControlsDock` (eye/overlay)
  vs. `CanvasControlsDock` (eye/overlay) is a minor DRY smell —
  **B.W2** (lift a shared `<OverlayTogglePopover>` mini-component).

## §5 — Backend audit

* **Rate-limiter** (`rate_limiter.py`). In-process `OrderedDict` keyed
  by hashed IP; sliding-window prune on every check; LRU eviction at
  `MAX_ENTRIES=50_000`. Single-replica safe; Option A documented in
  module docstring is **not** present — the file has no explicit
  single-replica note. **LOW (documentation gap)** — add a one-line note
  at module head. Compute endpoints (`require_compute_limit`) apply to
  ALL callers including admins; no auth-token bypass observed at
  `routers/contours.py:36,48` or `routers/equations.py:31,136`.
  Reasonable.
* **Cron / janitor** (`janitor.py`). `pinned: bool` inversion confirmed
  live at `janitor.py:66-77`. The `_recompute_pin_flags` at lines
  181-276 uses `update_many({}, {pinned: false})` to reset, then
  `$merge` to re-pin. **MEDIUM (correctness window)**: between reset
  and $merge completion there exists a window where every contour is
  `pinned=false`; if a second janitor were to invoke `delete_many`
  during this window, it would purge pinned data. The 6-hour
  `asyncio.sleep` makes concurrent invocation impossible in a single
  replica — Option A holds. Flag for **B.W2** documentation alongside
  the multi-replica disposition.
* **Image-blob storage**. Confirmed inline `Binary` storage per §3.3;
  storage-budget enforcement at `janitor.py:91-118` evicts oldest
  unpinned images server-side. The `total_bytes` aggregation at line 87
  scans the entire `images` collection — O(n) on every janitor cycle;
  acceptable at small scale but accumulates as the gallery grows.
  **B.W2** — migration path to GridFS / object-store with a `bytes_used`
  delta accumulator avoids the periodic full scan.

## §6 — Frontend canvas correctness

* **DPR.** Confirmed: `useCanvasSetup.ts:31` uses
  `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`; export path
  (`BasisCanvas.vue:439`) mirrors the same transform on the offscreen
  canvas. ✓
* **Auto-play discipline.** `useWorkspaceLoader.ts:104-128` —
  `anim.reset(); anim.play()` on first data arrival; subsequent compute
  results call `anim.play()` only if not already playing. ✓
* **rAF loop.** `animation.ts:33-58` — single rAF id, ping-pong via
  cycle parity, restart on speed change at line 102-107. Clean.
* **Coordinate system.** `epicycles.ts:32-53` samples 33 t-values to
  compute the stable bbox — adequate. The bbox is recomputed only when
  `epicycleData` identity changes (`BasisCanvas.vue:381` / line 404).
* **`endpoint=False` discipline.** Backend `computation.py:121` and
  `bases_evaluation.py:55,185` all use `endpoint=False`; the frontend
  consumes `eval_points` as closed-loop. ✓ (W5.d landed.)

## §7 — Defect ledger

| ID | Stage | Severity | Defect | Disposition |
|----|-------|----------|--------|-------------|
| D1 | Editor → store | **HIGH** | `saveContourPoints` clears data but no auto-recompute fires; canvas stays blank until user perturbs a slider | **FIX-IN-A-RESIDUAL** |
| D5 | Render | **HIGH** | `useViewTransform` calls `Math.{min,max}(...xs)` per frame; spread-allocates 4·n_points args/frame; hard ceiling at n≈64 k | **FIX-IN-A-RESIDUAL** |
| B1 | Storage | HIGH (latent) | Image blob inline in Mongo doc; 16 MB BSON ceiling; aggregation scan on every janitor cycle | **FOLD-INTO-B.W2** |
| D2 | Editor | MEDIUM | SVG `<circle v-for>` for n=1024 nodes; reactivity invalidates full list per drag tick | **FOLD-INTO-B.W2** |
| D6 | Render | MEDIUM | Watcher keys on both `t` and `easedT`; dual notifications per rAF tick | KEEP-AS-IS (Vue de-dupes) |
| D7 | Render contract | MEDIUM | `(sumsForBasis as any)?.[level] ?? [String(level)]` — type-defeating cast across the int-vs-string-key seam | **FOLD-INTO-B.W1** |
| D8 | Bases | MEDIUM | DC term frequency=0 renders as static disc of radius `|c_0|`; dominates visual | **FOLD-INTO-B.W4** (colors / visual) |
| J1 | Janitor | MEDIUM | Reset-then-$merge pin-flag window; single-replica only | KEEP-AS-IS (Option A); doc in B.W2 |
| R1 | Rate-limiter | LOW | Module-level single-replica posture undocumented in `rate_limiter.py` head | FIX-IN-A-RESIDUAL (one-line doc) |
| D3 | Drag | LOW | Magnet falloff anchors at drag-start; cosmetic divergence from "cohesive region" semantics | KEEP-AS-IS |
| D4 | Editor | LOW | "Reset to extraction" uses initial prop, not server re-fetch | KEEP-AS-IS |
| C1 | Cache | LOW | AVIF thumbnail regenerated on every sha256 dedupe-hit | KEEP-AS-IS |
| C2 | Pipeline | LOW | Magic numbers in `pipeline.py:39-44` (edge-density thresholds, structure-fractions) | KEEP-AS-IS (annotate later) |
| C3 | Storage | LOW | `image_storage.py:223` dead `result` variable | KEEP-AS-IS |
| C4 | Backend contract | LOW | `n_points` field default drift between `ExtractContourRequest` and frontend `defaults.ts` | KEEP-AS-IS |

**Totals.** 3 HIGH, 6 MEDIUM, 6 LOW. **4 absorb into B-waves**
(B1→B.W2, D2→B.W2, D7→B.W1, D8→B.W4); 2 fix-in-A-residual (D1, D5);
1 doc-only fix (R1); the rest KEEP-AS-IS.

**Load-bearing finding.** D1 — `saveContourPoints` clears compute
results without firing recompute, so the manual-edit-then-save UX path
silently breaks the canvas until the user perturbs a control. The
auto-compute seam in `ContourSettings.vue` cannot rescue it because the
watcher keys on settings, not on `store.contour` identity.

## §8 — B-tranche absorption table

| Defect | B wave | Scope item |
|--------|--------|------------|
| B1 (image-blob inline) | **B.W2** | visualization-entity restructure → GridFS / object-store migration; `bytes_used` delta accumulator |
| D2 (SVG editor n=1024) | **B.W2** | port `ContourEditorCanvas` from SVG to canvas2d; share the same DPR seam as `BasisCanvas` |
| D7 (int-vs-string keys) | **B.W1** | CRUD contract → tighten `AnimationData.partial_sums` type to `Record<string, {x,y}>`; drop the `as any` |
| D8 (DC term static disc) | **B.W4** | visual / colors lift → suppress DC in `drawEpicycleCircles` or render as centre-marker; coordinate with palette work |
| J1 (janitor pin window) | **B.W2** | document Option A single-replica posture alongside storage migration; later, atomicise via two-pass `$set` keyed on lock-token |

## §9 — Notes on prior audits

W3.5.d's five-defect fix-list (heap-driven VW; single-pass epicycle;
auto-compute dedupe; nHarmonics reset gating; dead substrate excision)
is **all confirmed live** in HEAD `c7cfd82`. The four B/C-routed items
from W3.5.d (levels-derivation drift, `--reload` ERR_EMPTY_RESPONSE,
onnxruntime log flood, `style.css` `@import` resolver) remain unchanged
and are not duplicated in this ledger — they are L5 / infra concerns.
