# Wχ.P4 — Invariant 18–20 Binding-Test (adversarial probe)

**Probe:** confirm each of the three Wave-1-augment invariants is MEASURABLE
(falsifiable by a test), not claim-only.
**Mode:** research-only. One deliverable file. No source/spec/coordination edits.
**Date:** 2026-05-26. **Working dir:** `/Users/mkbabb/Programming/fourier-analysis`.

Verdict in one line: **Inv18 accepted (split axe+grep), Inv19 accepted (falsifiable
via store-state signal), Inv20 accepted (grep-assertable). Overall P4 disposition:
ACCEPTED — all three invariants bind to a named, falsifiable test form.**

---

## §1 — Inv18 binding (UI surface conventions: a11y modal contract + dock naming + z-token ladder)

### Tooling inventory

| tool | installed? | evidence |
|---|---|---|
| `@axe-core/playwright` | **NO** | absent from `web/package.json` devDeps; `web/node_modules/@axe-core` does not exist |
| `@playwright/test` | **YES** | `web/package.json` devDep `^1.58.2`; `web/node_modules/.bin/playwright` present; `web/node_modules/@playwright/test` present |
| Playwright config / e2e dir | **YES** | `web/playwright.config.ts`; `web/e2e/` holds 5 specs (`workspace-flow`, `settings-persistence`, `contour-extraction`, `gallery`, `paper-performance`) |

So the axe **runner** (Playwright) is present, but the axe **engine bridge**
(`@axe-core/playwright`, which provides `injectAxe`/`checkA11y`) is **not yet
installed**. Inv18's axe clause is *testable in principle* but **not yet
executable** — it requires one devDep add (`@axe-core/playwright`, which pulls
`axe-core`). This is a one-line `npm i -D` gap, not a structural blocker.

### Keystone components (present y/n)

| keystone | file | present | a11y state |
|---|---|---|---|
| Workspace default | `web/src/components/visualization/VisualizationView.vue` | YES | n/a (page state) |
| ContourSettings open | `web/src/components/visualization/ContourSettings.vue` | YES | reka `Collapsible`/`Select` substrate (has a11y) |
| ExportModal open | `web/src/components/visualization/ExportModal.vue` | YES | **HIGH GAP — hand-rolled** |
| AnimationControls dropdown | `web/src/components/visualization/AnimationControls.vue` | YES | (dropdown via substrate) |

**ExportModal is the confirmed HIGH a11y gap.** It is a hand-rolled
`<Teleport to="body"> → <Transition name="modal"> → div.modal-backdrop →
div.modal-card`. It carries **none** of the Inv18 modal contract:

- no `role="dialog"`
- no `aria-modal="true"`
- no Esc handler (only `@click.self` backdrop dismiss)
- no focus-trap, no focus-return

`grep -rnE 'role="dialog"|aria-modal|@keydown.*[Ee]sc|focus-trap|trapFocus'
web/src/components/visualization/` returns **NONE**. By contrast
`GalleryView.vue` already consumes glass-ui `Dialog`/`DialogContent` (the W2
migration target for ExportModal — the substrate supplies the a11y contract
for free).

### z-token ladder clause — literal `z-[N]` audit

`grep -rnE 'z-\[[0-9]+\]' web/src/components/` finds exactly **one**:

- `web/src/components/visualization/EquationPanel.vue:114` —
  `@apply absolute z-[15] flex flex-col gap-2 p-2.5 rounded-xl;`

This is the L5 §4 ladder violation named in B.md §3 W2. (Note: ExportModal's
backdrop already correctly routes through `z-index: var(--z-modal)` —
`ExportModal.vue:79` — so the modal surface is *already* token-clean; the lone
violation is EquationPanel.)

### Test form per clause

| Inv18 clause | binding test form | falsifiable now? |
|---|---|---|
| modal carries `role=dialog`+`aria-modal`+Esc+focus-trap | **axe** (`injectAxe`+`checkA11y` at ExportModal-open state) — catches `role`/`aria-modal`; **+ grep** for Esc/focus-trap presence | needs `@axe-core/playwright` add; grep works now |
| dock naming (Dock/Panel/Modal) | **grep** on filenames (`CanvasControlsDock`, `EditorControlsDock`, `ExportModal`, `*Panel.vue`) | YES (grep, now) |
| no literal `z-[N]` in dock/overlay/modal | **grep** `z-\[[0-9]+\]` returns zero post-fix | YES (grep, now — currently 1 hit) |

**Inv18 is split-measurable: the modal-a11y clause is axe-measurable (once the
devDep lands), the dock-naming and z-token clauses are grep-measurable now.**
Both forms are legitimate; neither clause is claim-only.

---

## §2 — Inv19 binding (auto-recompute discipline)

### The live watcher shape

`ContourSettings.vue:138-147` — the auto-compute watcher is `watchDebounced`
keyed on:

```
() => [strategy.value, blurSigma.value, minContourArea.value, maxContours.value,
       smoothContours.value, mlThreshold.value, props.nHarmonics, props.nPoints]
```

It keys on **SETTINGS values**, **NOT on `store.contour` identity**. Confirmed
Wα R1 finding. The store object `store.contour` does not appear in any
auto-compute dependency array.

### The save-then-recompute seam (the broken edge)

`workspace.ts:230-250` — `saveContourPoints(points)`:

1. `contour.value = markRaw(result)` → **contour identity DOES change**
2. `epicycleData.value = null`
3. `basesData.value = null`
4. `scheduleDraftSave()` — and **returns. No recompute is launched.**

Because the recompute watcher does not observe `store.contour`, the identity
change in step 1 fires **nothing**. With `epicycleData`/`basesData` nulled
(steps 2–3), `BasisCanvas.drawFrame()` (`BasisCanvas.vue:91-96`) falls through
to `drawPlaceholderFrame` — **the canvas goes blank and stays blank**. This is
exactly the "manual-edit-then-save leaves the canvas blank" failure Inv19
forbids.

### The observable signal a Playwright spec can assert on

There **are** observable signals — Inv19 is **not** unfalsifiable:

1. **Store-state signal (primary).** After `saveContourPoints`, a conformant
   implementation drives `store.epicycleData` (and/or `store.basesData`) from
   `null` → non-null within one recompute pass. Caveat: the Pinia store is
   **not** exposed on `window` (no `window.__`/`expose`/`globalThis` hooks
   exist — grep returns none), so a spec cannot read the store ref directly.
   The spec instead asserts via the **API seam** — the existing specs already
   do this (`workspace-flow.spec.ts:135` `page.evaluate` → compute-epicycles
   endpoint returns `n_components > 0`). After-save, the spec asserts a fresh
   epicycle/bases payload exists for the new `contour_hash`.

2. **DOM/canvas-visibility signal (sufficient for the blank-canvas clause).**
   The existing specs assert `page.locator("canvas").first()` is `toBeVisible`
   with non-zero `boundingBox` after compute (`workspace-flow.spec.ts:25-32`).
   For Inv19 the blank-canvas failure is observable as: post-save, the canvas
   either disappears or renders only the placeholder. A spec can capture a
   pre-save `canvas.screenshot()` and assert the post-save frame is **not** the
   placeholder (pixel-diff, or `getImageData` non-empty via
   `page.evaluate`/`canvas.toDataURL`).

3. **Timing clause ("within one rAF / ~16ms, no control perturbation").** The
   "no control perturbation" half is directly assertable: the spec reads the
   slider/input values before and after save and asserts they are unchanged
   (`settings-persistence.spec.ts` already reads `toHaveValue` on harmonics/
   blur/points inputs). The "single-pass" half is assertable by counting
   compute requests via `page.route`/network capture — exactly one
   extract-or-recompute cycle, not a settings-triggered second pass.

### Falsifiable verdict

**Inv19 is FALSIFIABLE — YES.** A Playwright spec can: (a) upload + extract,
(b) open the editor and call save (drag a point or invoke
`saveContourPoints`), (c) assert the canvas re-renders a real frame (not the
placeholder) AND the control values are unmodified, within a bounded wait.
A red baseline exists today: against the current code the spec **fails** (canvas
stays blank), so the test genuinely binds.

**Required instrumentation (minor, to make the store-state signal cleaner):**
expose the workspace store on `window` under test (e.g. a `__store` test hook
gated on `import.meta.env`) so the spec can assert `epicycleData !== null`
directly rather than re-deriving through the API. This is a *convenience*
upgrade, not a precondition — the canvas-pixel + control-value signals already
make Inv19 falsifiable without it.

---

## §3 — Inv20 binding (Visvalingam-Whyatt + epicycle-render perf budget)

### The live spread location

`web/src/components/visualization/composables/useViewTransform.ts:21-24`:

```
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
```

Four variadic spreads. `getViewTransform(s)` is **not** memoized — it
recomputes on every call.

### Confirmation it is on the per-frame path

`getViewTransform` is called from `BasisCanvas.vue:99` inside `drawFrame()`.
`drawFrame()` is driven by the render watcher at `BasisCanvas.vue:417-422`:

```
watch([() => anim.t, () => anim.easedT, () => props.showGhost, ...],
      () => { if (surface.value) drawFrame(); });
```

`anim.t` is updated **every rAF tick** by the manual loop in
`animation.ts:37-50` (`tick(now)` → `t.value = ...` → `requestAnimationFrame(tick)`).
Therefore the four `Math.min(...xs)` / `Math.max(...xs)` spreads execute
**once per animation frame (~60 fps)** over the full path array `xs`/`ys` —
the exact O(n)-per-frame spread Inv20 forbids. (`BasisCanvas.vue:449` is a
second call site, but on the one-shot export path, not per-frame.)

### Test form

**Grep-assertable — YES.** The B.md spec wording ("a benchmark OR a
grep-assertion that `useViewTransform` does not spread on the full path per
frame") admits the grep form, and it is sufficient: the W2 fix moves the bbox
computation into a `computed`/`shallowRef` memoized on `epicycleData` /
`basesData` **identity**, so the spread executes once at identity change, not
per tick. The binding assertion is:

```
grep -nE 'Math\.(min|max)\(\.\.\.' web/src/components/visualization/composables/useViewTransform.ts
# pre-fix: 4 hits (lines 21-24)   post-fix: must be 0 on the per-frame getter
```

A runtime benchmark is **not required** — once the spread is hoisted inside a
`computed` keyed on data identity, the grep proves the per-frame path is
spread-free. (A complementary unit test could assert the bbox memo recomputes
only when `epicycleData`/`basesData` identity changes, but the grep alone binds
the invariant.)

---

## §4 — DISPOSITION

| Invariant | disposition | test form bound | notes |
|---|---|---|---|
| **18 — UI surface conventions** | **ACCEPTED** | modal-a11y → axe (`injectAxe`/`checkA11y`); dock-naming + z-token → grep | axe runner present; **`@axe-core/playwright` devDep must be added** (one-line gap) before the axe clause executes. Grep clauses fire now. Live state: 1 `z-[15]` violation (EquationPanel), ExportModal lacks the modal contract. |
| **19 — auto-recompute discipline** | **ACCEPTED** | Playwright e2e at the save-then-recompute seam | FALSIFIABLE: observable via canvas-not-placeholder + unchanged control values + single compute pass. Optional `window.__store` test hook sharpens the assertion but is not required. Red baseline exists today. |
| **20 — render-perf budget** | **ACCEPTED** | grep-assertion (`Math\.(min\|max)\(\.\.\.` → 0 on the per-frame getter) | Spread confirmed at `useViewTransform.ts:21-24`, confirmed on the per-rAF `drawFrame` path. Grep suffices once the bbox is hoisted into an identity-keyed `computed`. |

### Overall P4 disposition

**ACCEPTED.** All three invariants bind to a named, falsifiable test form, and
each has a demonstrable red baseline against the current code (ExportModal a11y
fails axe; save-then-recompute leaves the canvas blank; `useViewTransform`
spreads per frame). None is claim-only or unfalsifiable.

**Two non-blocking caveats the W2 implementer must discharge:**

1. **Inv18 axe clause requires a devDep add** — `@axe-core/playwright` is not
   installed. Until it lands, the modal-a11y clause is *specified* but not
   *executable*; the dock-naming and z-token clauses are grep-measurable today.
2. **Inv19's cleanest signal wants a test-only store hook** — the Pinia store
   is not exposed to `page.evaluate`. The invariant is falsifiable without it
   (via canvas-pixel + control-value signals), but a `window.__store` hook
   gated on the test build would let the spec assert `epicycleData !== null`
   directly.
