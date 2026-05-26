# Audit F — Design / Mathematics / Functionality of Admin & Consumer Views

Scope: Vue 3 consumer views (equation, morph, visualization, gallery, paper) and admin
views (`gallery/Admin*.vue`, `GalleryAdminBanner.vue`) plus the math behind them.
Read-only. Repo `/Users/mkbabb/Programming/fourier-analysis`.

---

## 1. Design audit

### 1a. Consumer views

Generally coherent. The equation and visualization views share a deliberate two-pane
grid idiom (`EquationView.vue:330-345`, `VisualizationView.vue:282-303`) with matching
breakpoints (360/400/440px left rail), a fade-out scrim on the scrolling left panel,
and a mobile `UnderlineTabs` controls/canvas toggle. `cartoon-card` is used consistently
as the surface primitive. Loading, error, empty, and recompute states all exist and are
distinct (`EquationView.vue:219-320`, `VisualizationView.vue:153-170`).

Glass-ui composition adherence is good at the component level: `UnderlineTabs`,
`HoverCard`, `Select`, `Collapsible`, `Dock`/`DockIconButton` are pulled from the
`@mkbabb/glass-ui` subpath surface, and the local `ui/select`, `ui/collapsible`,
`ui/GlassDock` etc. were correctly deleted (git status) once migrated — verified the
glass-ui root export does ship `Select*`/`Collapsible*`/`HoverCard*`.

Animation polish is strong on the consumer side: golden-shimmer stroke on the
convergence sum curve (`ConvergencePlot.vue:208-219`), epicycle hover scale-up, panel
crossfades, the harmonic-by-harmonic reveal in the convergence plot.

Minor consumer gaps:
- `FourierShapeExtractor.vue` (`/demo/shape-extractor`) is a raw, unstyled internal
  tool — inline-styled `<h1>`, bare `<button id="extract-btn">`, no design language at
  all. It is routed (`router/index.ts`) and reachable. It should either be removed from
  the router for production or gated.
- `MorphShapePreview` is a single full-width hero with no empty/error state — acceptable
  since shapes are static JSON, but there is no loading affordance if the JSON import
  ever fails.

### 1b. Admin views — the unloved afterthought

The admin views are visibly second-class relative to the consumer views.

- `AdminFlaggedPanel.vue` and `AdminUserList.vue` use raw Tailwind `rounded border`
  buttons, hand-rolled `Prev/Next` pagination (`AdminFlaggedPanel.vue:142-147`,
  `AdminUserList.vue:202-207`), a native `<select>` (`AdminUserList.vue:124-131`), and a
  native `confirm()` dialog for destructive actions (`AdminUserList.vue:77`,
  `AdminFlaggedPanel.vue:52`). The consumer side uses glass-ui `Select`, styled toggles,
  and `ConfirmDialog` is available in glass-ui (`./confirm-dialog` export) but unused
  here. The admin panels do not adopt `cartoon-card`, `glass-elevated`, or any of the
  shared surface primitives — they are bare `border bg-card/50` rows.
- Zero `aria-*`/`role` attributes across all three admin components (grep confirmed:
  `AdminUserList.vue` 0, `AdminFlaggedPanel.vue` 0, `GalleryAdminBanner.vue` 0). The
  consumer `ConvergenceTimeline.vue:74-77` and `AnimationControls.vue:97` do set
  `aria-*`. The destructive icon-only buttons (Suspend/Delete/Dismiss) carry only a
  `title=` tooltip, no accessible name.
- `GalleryAdminBanner.vue` is the most polished of the three (amber-bordered stat grid)
  but still has no skeleton for the `loading` state — when `loading` is true the entire
  stat grid simply vanishes (`v-if="stats && !loading"`, line 36), leaving an empty
  bordered box.
- The C4 audit-log feature is fully built on the backend (`admin.py:542-579`, response
  model `AuditListResponse`, frontend type `AuditEntry`/`AuditListResponse` in
  `types.ts:218-230`) but **there is no audit-log viewer component** and no tab for it
  in `GalleryView.vue:36-48` (only `users` and `flagged`). The admin view ships a dead
  half of its own feature set.

**Worst design gap:** the admin moderation surface is a different, lower-fidelity design
language than the rest of the app — native `confirm()`/`<select>`, hand-rolled
pagination, no glass-ui surfaces, no a11y — and the audit-log viewer is missing entirely
despite a complete backend.

---

## 2. Mathematics audit

### 2a. Epicycle / DFT reconstruction — verdict: CORRECT

`EpicycleChain.from_signal` (`epicycles.py:56-96`) takes the DFT via
`fourier_coefficients`, emits a DC term plus signed harmonics `±n`, sorts by amplitude.
`evaluate` sums `c_n e^{2πi n t}` (line 106). The API serializes each component as
`{"index": c.frequency, "coefficient": [re, im], amplitude, phase}`
(`computation.py:111-119`) — the `index`↔`frequency` field-name bug noted in memory is
correctly handled here: backend emits `index`, frontend `BasisComponent.index`
(`types.ts:1`) consumes it.

Client `evaluateFourier` (`evaluators.ts:9-26`) and `fourierPositionsAt`
(`bases.ts:27-46`) both compute `Σ c_n·(cos+isin)` consistent with the Python
`evaluate`. The cumulative-position chain matches `EpicycleChain.positions_at`. Sorting
by descending amplitude means `maxCircles`/`maxTerms` truncation keeps the largest
phasors first — correct and the visually honest choice.

### 2b. Equation explorer — verdict: CORRECT

- Symbolic/spline coefficients: `c_n = (1/T)∫ f e^{-inωx} dx` (`integration.py:46-52`,
  `spline.py` IBP closed form). The spline path uses an exact integration-by-parts
  recurrence per cubic segment — sound.
- Trig grouping in `harmonics.ts:36-45`: `a_n = Re(c_n)+Re(c_{-n}) = 2Re(c_n)`,
  `b_n = -(Im(c_n)-Im(c_{-n})) = -2Im(c_n)`. For real `f`, `c_{-n}=conj(c_n)`, so this
  yields the standard `f = a_0 + Σ a_n cos(nωx) + b_n sin(nωx)` with the correct sign on
  `b_n`. The convergence-plot reconstruction (`ConvergencePlot.vue:134,149-153`) uses
  exactly this form — verified consistent.
- `effective_n` energy threshold: `compute_effective_n` (`simplification.py:68-98`) uses
  `threshold=0.9999`, groups energy by `|n|`, returns the smallest `k` capturing 99.99%
  of `Σ|c_n|²`, floored at 3. Matches memory's note. `energy_captured` is
  `kept_energy/total_energy` (line 62) — an honest Parseval-style energy fraction.
- Legendre Clenshaw recurrence (`evaluators.ts:84-90`): verified against
  `(k+1)P_{k+1}=(2k+1)xP_k - kP_{k-1}`; the final-step `s·b1 - b2/2 + c_0` correctly
  accounts for `β_1=-1/2`. Chebyshev Clenshaw (`evaluators.ts:50-57`) is the standard
  `s·b1 - b2 + c_0`. Both correct.

Honesty notes (minor, not errors):
- Backend integrates over `[a,b]` with `endpoint=False` (`equations.py:61`), so the
  plotted `original f(x)` polyline (`ConvergencePlot.vue:181-186`) connects `ox[0]` to
  `ox[N-1]`, which stops one sample short of the period end. Visually the original curve
  has a tiny unclosed gap at the right edge. Not a math error — a plotting truncation.
- `FrequencyGraph.vue` log-scale mode uses `log10(amplitude+1)` normalized by
  `log10(max+1)` (`FrequencyGraph.vue:36-49`). The `+1` offset is a presentation choice;
  bar heights are not a pure dB ratio. The axis is unlabeled ("Amplitude" appears only
  in the tooltip), so a viewer cannot tell linear from log without toggling — mildly
  misleading but not wrong.

### 2c. Chebyshev / Legendre fitting in the contour pipeline — verdict: CORRECT but
mislabeled in one place

The polynomial bases are evaluated correctly (2b). The real concern is **`math-worker.ts`**:
its non-Fourier branch sets `y[i] = t` with the literal comment
*"Placeholder; real use has separate x/y decompositions"* (`math-worker.ts:42-43`).
A polynomial trace with `y` set to the parameter `t` is not a meaningful curve. This is
mathematically dishonest output — but see Functionality §3, the worker is **dead code**,
so nothing actually renders it.

### 2d. Morph demo — verdict: CORRECT

Morphing operates on **pre-computed** partial-sum point arrays
(`svg-fourier.ts:125-154`), linearly interpolating between bracketing harmonic levels and
between shapes. No Fourier math is recomputed client-side; `interpolateAtHarmonicLevel`
and `lerpPoints` are straightforward and correct. The "low harmonics" morph stage is an
honest depiction of low-order Fourier truncation. Catmull-Rom path conversion
(`svg-fourier.ts:47-73`) uses correct wrapped modular indexing for closed paths.

**No genuine mathematical error reaches a rendered surface.** The single dishonest
computation (`math-worker.ts:42`) is unreachable dead code.

---

## 3. Functionality audit

### 3a. Visualization flow: upload → extract → compute → animate → save → gallery

Traced and largely wired:
- Upload: drag-drop (`VisualizationView.vue:138-150`) and mobile click-to-upload
  (`:124-133`) both call `store.uploadImage`.
- Extract → compute: `ContourSettings.runCompute` calls `extractContour` then
  `Promise.allSettled([computeEpicycles, computeBases])` (`ContourSettings.vue:122-129`),
  debounced 1s on settings change, with a `lastComputedKey` guard against redundant
  recompute. Transient errors surface a retry banner (`ContourSettings.vue:306-314`).
- Animate: `BasisCanvas.vue` renders epicycle/multi-basis frames off `anim.t`.
- Save/publish: `handlePublish` → `createSnapshot` → `gallery.publish`
  (`VisualizationView.vue:103-115`).

**Broken / half-wired:**
- `math-worker.ts` is **dead code** — no `new Worker(...)` reference exists anywhere in
  `web/src` (grep confirmed only the self-reference in `evaluators.ts:3` comment). The
  file claims to "precompute traces" but is never instantiated; trace precompute happens
  server-side (`compute_bases`) and in `BasisCanvas` directly. Dangling, and it carries
  the misleading `y=t` placeholder math (§2c).
- `ContourSettings.vue` defines `props.nHarmonics`/`nPoints` and an `n_classes`/
  `min_contour_length`/`ml_detail_threshold` field set in `ContourSettings` type
  (`types.ts:34-47`), but the UI exposes no control for `n_classes`,
  `min_contour_length`, or `max_contours=null` "All" beyond the slider. `ml_detail_threshold`
  is silently derived as `mlThreshold * 0.6` (`ContourSettings.vue:119`) with no UI — a
  hidden coupling, not broken but undiscoverable.

### 3b. Equation flow: function-input → compute → plot

Fully wired. `doCompute` (`EquationView.vue:89-126`) posts to `/api/equations/compute`,
caches by key, populates `result`/`displayLatex`/`effectiveN`; `doSimplify` re-renders on
notation/budget change (debounced 200ms). `ConvergencePlot` and `EqCoefficientsPanel`
render off the result. Auto-harmonics caps `vizHarmonics` at `effective_n`
(`EquationView.vue:51-53`). No breakage found.

Minor: the `FunctionInput` "compute" emit fires `doCompute(true)` (force) only via the
preset buttons and an explicit play button; expression edits rely on the user pressing
compute — there is no debounced auto-compute on expression change (intentional, given
symbolic-integration cost, but worth noting as a UX choice).

### 3c. Admin flow: flag → review → action

- `AdminFlaggedPanel.vue`: loads `/api/admin/flagged`, renders flag groups, Dismiss
  (`dismissFlags`) and Delete (`deleteEntry`) wired with toast feedback. Functional.
- `AdminUserList.vue`: search (debounced 300ms), sort, suspend/unsuspend/delete, prune-
  empty — all wired to `admin.py` endpoints. Functional.
- **Missing:** the C4 audit-log viewer. `admin.py:542` `/api/admin/audit` and the
  `AuditEntry`/`AuditListResponse` types exist, but no component consumes them and no tab
  is registered (`GalleryView.vue:36-48`). Every admin action logs an audit row
  (`log_audit`) that is unreadable from the UI. This is the most significant admin
  functionality gap.
- Batch endpoints `batch_gallery` / `batch_users` (`admin.py:362-451`) and the
  `BatchGalleryRequest`/`BatchUsersRequest` models exist but no UI offers multi-select +
  batch action — another half-wired backend feature with no consumer.

### 3d. Deleted/recreated components — verified clean

`FourierMorphDemo.vue` and `FourierShapeExtractor.vue` were deleted at repo root and
recreated under `components/morph/`. The router (`router/index.ts`) correctly points
`/morph` → `morph/FourierMorphDemo.vue` and `/demo/shape-extractor` →
`morph/FourierShapeExtractor.vue`. No dangling imports to the old root paths found
(grep clean). The `web/src/components/ui/select`, `ui/collapsible`, `ui/GlassDock`,
`ui/BouncyToggle`, `ui/ToastContainer`, `ui/UnderlineTabs`, and paper-search helpers were
deleted as part of the glass-ui v1.0 subpath migration; the glass-ui root export ships
the replacements. No dangling reference found.

### Broken / half-wired / missing ledger

| Item | Severity | Location |
|---|---|---|
| Audit-log viewer missing (backend complete, no UI/tab) | High | `admin.py:542`, `GalleryView.vue:36` |
| `math-worker.ts` dead code + dishonest `y=t` placeholder math | Medium | `math-worker.ts:42` |
| Batch admin endpoints have no multi-select UI | Medium | `admin.py:362-451` |
| Admin views: native `confirm()`, native `<select>`, hand-rolled pagination, no glass-ui | Medium | `AdminUserList.vue`, `AdminFlaggedPanel.vue` |
| Zero a11y attributes in all three admin components | Medium | `Admin*.vue`, `GalleryAdminBanner.vue` |
| `GalleryAdminBanner` stat grid vanishes (no skeleton) during `loading` | Low | `GalleryAdminBanner.vue:36` |
| `FourierShapeExtractor` unstyled internal tool reachable in prod router | Low | `router/index.ts`, `FourierShapeExtractor.vue` |
| FrequencyGraph axis unlabeled; log mode uses `log10(a+1)` un-annotated | Low | `FrequencyGraph.vue:36-49` |
| Convergence-plot original curve stops one sample short (`endpoint=False`) | Low | `ConvergencePlot.vue:181`, `equations.py:61` |
