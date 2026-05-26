# R2 — fourier-A refinement assay (round-three deep dive)

**Mode:** READ-ONLY refinement audit. No edits, no commits. **Date:** 2026-05-19.
**Charter:** Surface what still escapes A after H1–H6 hardening across 12 named dimensions; emit per-wave refinement proposals, candidate new sub-waves, and brittleness-window deltas.
**Inputs read:** `docs/tranches/A/A.md`, `waves/W{1..5}.md`, `PROGRESS.md`; audits `c-style-consumer.md`, `d-style-glassui.md`, `f-design-math-functionality.md`; hardening `h2-A-W2-W3.md`, `h3-A-W4-W5-W6.md`; entire `web/src` (depth ~3); `vite.config.ts`, `tsconfig.json`, `package.json`, `playwright.config.ts`; `dist/` artefacts (built 2026-05-18 23:02).

---

## §1 — Per-dimension audit verdict

### D1 Web performance — **MAJOR GAP, wave-worthy**

The production build is fat and the entry chunk is the worst offender. Measured at `web/dist/assets/`:

| Chunk | Raw | Gzip est. | Origin |
|---|---|---|---|
| `index-BHKA8vf9.js` (entry) | **907 KB** | ~368 KB | shared chunk including `App.vue`, `TooltipProvider`, `Toaster`, router, pinia, keyframes.js, `colors.ts`, glass-ui root barrel |
| `PaperView-DepJcZlN.js` | **469 KB** | ~117 KB | KaTeX + `latex-paper` virtual module + paper sections inlined |
| `Tooltip.vue_…-DGeZlDXf.js` | **268 KB** | ~80 KB | a shared chunk **named after a single glass-ui Tooltip wrapper** (`web/src/components/ui/tooltip/Tooltip.vue`) — strong sign that the root barrel `@mkbabb/glass-ui` import in `App.vue:4` (`{ TooltipProvider, Toaster }`) is pulling the full 44-subpath surface into a bundle Rollup names after its first export |
| `VisualizationView-…` | 92 KB | ~30 KB | OK |
| CSS `index-CQiVCMrZ.css` | **206 KB** | — | full Tailwind v4 inlined; no per-route split |

Root causes verified by grep:
- `App.vue:4` imports `{ TooltipProvider, Toaster }` from the **root barrel** `@mkbabb/glass-ui`. Rollup cannot tree-shake reka-ui's Tooltip/Toast tree-of-modules through a barrel re-export the way it can through `@mkbabb/glass-ui/tooltip` or `/toast` subpaths (44 are published per audit D §2b).
- `web/dist/index.html` carries **zero `<link rel="modulepreload">`** for code-split routes — first paint of `/paper` parses entry + downloads PaperView serially.
- `web/vite.config.ts:6-61` has **no `build.rollupOptions.output.manualChunks`** strategy; vendor chunks aren't separated (Vue + Pinia + Vue-Router + reka-ui + lucide all land in `index-*.js`).
- 32 distinct `lucide-vue-next` import sites (`grep -rn 'lucide-vue-next' web/src | wc -l → 32`) — tree-shakes well at named-import grain, but no audit confirms zero accidental star-imports.
- KaTeX CSS is **render-blocking** (`index.html:20-24`) and loaded from CDN — TTFB-coupled.
- 4 sites import `katex` directly with `katex.renderToString` (`EquationResult.vue:5`, `ConvergencePlot.vue:6`, `EquationPanel.vue:11`, `useCoeffHover.ts:7`) — every equation surface includes the full KaTeX runtime, but only `PaperView` uses the paginated `useKatex` from `latex-paper`. KaTeX itself is ~280 KB minified — this likely duplicates inside both `EquationView` and `PaperView` chunks.
- The `latex-paper` virtual module (`virtual:paper-content`, `web/src/lib/paperContent.ts:7`) inlines all 3100 lines of TeX-derived content at build time into `PaperView-*.js`; no service worker caches it across visits.
- Image lazy loading: 4 of 6 `<img>` sites use `loading="lazy"` (`PaperArticleWindow.vue:67`, `GalleryCard.vue:72`, `GalleryDraftsSection.vue:77`). `ImageUpload.vue:63` (the user's just-uploaded preview) and `AppHeader.vue:70` (logo) skip it — defensible. No `decoding="async"` anywhere, no `fetchpriority="high"` on the LCP image.

**Verdict:** A.W4 §4 deletes 2 KB of dead code (`logo.ts`, `math-worker.ts`) while a 907 KB entry chunk sits unaddressed in the same wave. This is invariant-12-shaped ("scale without contrivance") but the *consumer-side* scale lever (bundle-size and route-level chunking) is wholly absent from A. **Recommend a new sub-wave A.W4.d or a dedicated A.W7** (see §3).

### D2 A11y comprehensiveness (consumer views) — **MAJOR GAP, sub-wave-worthy**

A.W5 scope hard-codes the admin a11y lift (3 `confirm()`, 1 `<select>`, 0 `aria-*`) but **the consumer views also have systemic a11y gaps unscoped anywhere in A**:

| File / surface | Gap | Evidence |
|---|---|---|
| `web/src/components/equation/EquationModeToggle.vue:9-22` | Two-button toggle has no `aria-pressed`/`aria-checked`; no `role="radiogroup"`; only `title=` for label | `role=`/`aria-` grep returns 0 hits in file |
| `web/src/components/equation/FrequencyGraph.vue:168` | Canvas with click+hover interaction has **no `role="img"`, no `aria-label`, no fallback content** — visualization invisible to AT | confirmed |
| `web/src/components/visualization/BasisCanvas.vue:483` | Same — bare `<canvas>` with no a11y; the epicycle is the headline visualization | confirmed |
| `web/src/components/visualization/ContourEditorCanvas.vue` | SVG editor — interactive control points have no `role="slider"`/`aria-grabbed`/keyboard alternative | drag-only |
| `web/src/components/equation/ConvergencePlot.vue:325` | Plot canvas — no `role`/`aria-label` | confirmed |
| `web/src/components/equation/FunctionInput.vue` | Single `@keydown.enter="emit('compute')"` (line 100). Preset chips — no `aria-pressed` for active state, no keyboard cycling | confirmed |
| `web/src/components/morph/FourierMorphDemo.vue` | Zero `aria-*`/`role`/`tabindex` (grep clean) — the morph stage controls are unreachable by keyboard | confirmed |
| `web/src/components/paper/PaperView.vue` | Article wrapped in `<article>` but the mobile inline TOC (`:305-319`) lists section buttons with no `aria-current="location"` for the active section; no `role="navigation"` on the sidebar | confirmed |
| `web/src/components/paper/MobileFloatingToc.vue` | Search trigger `floating-toc-search-btn` is a `<span>` with `@click.stop` — not focusable, not a button (`:107`) | confirmed |

Per-component aria/role hit counts (`grep -cn 'aria-\|role=' …`) — most consumer files return **0** or **1 (a single sloppy `title=` plus no semantic role)**.

**Verdict:** A.W5's admin a11y lift is scoped narrowly. The consumer surfaces — the *headline* visualizations — are equally a11y-hostile. The canvas surfaces especially are inherently a11y-opaque and need an explicit strategy (description in adjacent `<figcaption>`, keyboard alternatives for hover, table fallback for FrequencyGraph). **Sub-wave or expansion of A.W5 required.**

### D3 Paper integration — **MEDIUM GAP**

The paper integrates well at the structural level (`useVirtualSectionWindow` keeps mounts ≤18, e2e `paper-performance.spec.ts` validates), but:
- **KaTeX duplication** — `import katex from "katex"` at `EquationPanel.vue:11`, `EquationResult.vue:5`, `ConvergencePlot.vue:6`, `useCoeffHover.ts:7` runs KaTeX from the equation route, while `PaperView.vue:11` runs `useKatex` from `@mkbabb/latex-paper/vue` (its own KaTeX wrapper). Two KaTeX runtime bindings live in two chunks; macros shared (`PaperView.vue:25-35`) versus the equation route's anonymous macros (none — direct `renderToString(latex)`).
- **No KaTeX font preload.** `index.html:20-24` only preloads CM serif, not the KaTeX `KaTeX_Math-Italic`/`KaTeX_Main-*` glyph fonts. First math paint downloads 12+ font files synchronously.
- **MathJax compatibility** — out of scope for A, but worth noting: the paper-search index (`paperSearchIndex.ts:258`) stores `rawTex` strings but only KaTeX renders them; no MathJax fallback for AT users that can read MathJax accessibility tree.
- **`PaperSearch` ranking** — `searchIndex` (`paperSearchIndex.ts`, ~258 LOC) uses VSCode-style fuzzy match; no field-weight bias for theorem titles vs body text. A search for "Fourier" returns equal score for the section heading and a corpus mention — section-heading boost would be a 5-line fix.
- **MobileFloatingToc** scroll lock at `:25-29` is correct (iOS), but the search-trigger `<span>` (line 107) is not focusable and the dropdown items don't roving-tabindex (every item is `tabindex="0"` or default).

### D4 3D / canvas viz performance — **MEDIUM GAP**

The `useCanvasSetup` composable (`web/src/components/visualization/composables/useCanvasSetup.ts`) is correct: DPR-aware (`:21,31`), uses `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` not cumulative `ctx.scale()` (memory bug noted as historic), `ResizeObserver` disconnect on unmount (`:44-46`). The `BasisCanvas.vue:384-389` and `:400-405` correctly handle the race where `surface.value` is null when an early watcher fires.

Remaining gaps:
- **`animation.ts:55-73` manual rAF loop does not respect `prefers-reduced-motion`** — no media-query short-circuit; `play()` always starts. Memory notes this animates infinitely. PRM-sensitive users get continuous motion.
- **No frame-budget cap.** The `BasisCanvas.vue` render watcher (`:411-416`) fires every `anim.t` update and redraws the whole frame — no `>16ms` skip, no `IdleDeadline` budget. On a mid-range mobile a 200-circle epicycle plus image overlay drops frames.
- **`exportFrame` (`:419-470`) creates a new full-resolution offscreen canvas every export call** — for an animated GIF export (none yet, but the function exists) this would balloon memory.
- **No `OffscreenCanvas` migration plan.** All 3 canvases (`BasisCanvas`, `ConvergencePlot`, `FrequencyGraph`) draw on the main thread; `BasisCanvas` precomputes a 3000-point trail (`trail.precompute`) on every epicycle data change. A real worker (see D12) plus `OffscreenCanvas` would unblock the equation route during compute.
- **No `requestIdleCallback` / `requestVideoFrameCallback`** for the trail rendering — `setTimeout(…, 0)` patterns absent (which is correct), but the trail-redraw scaling on `golden-shimmer` (continuously animating filter) is unbounded.

### D5 Build / dev toolchain — **MEDIUM GAP**

`tsconfig.json` (20 lines, verified) sets `strict: true` but **omits**: `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`. The Clenshaw evaluators (`web/src/lib/evaluators.ts:18,37-46,75-78`) all rely on `components[i]` indexing without optional-chaining — with `noUncheckedIndexedAccess` enabled these would be flagged. Math invariant 8 names "numerical correctness precedes UI polish" — *type-level* numerical-correctness signal (silent out-of-bounds returns `undefined`) is currently silent.

`vite.config.ts`:
- No `build.sourcemap` — production source maps off; debugging shipped issues requires a re-build.
- No `build.rollupOptions.output.manualChunks` (see D1).
- No `build.target` override; defaults to `modules` baseline. Acceptable.
- `server.fs.allow: ["../../.."]` (`:51-53`) — wide; needed for the cross-repo dev contract. Documented in comment (`:45-50`). Not a defect.
- `appType: "spa"` (`:42`) — no SSR / no prerender. The paper route is a static-content surface that *would* prerender well and shave 1MB off the route's first-paint cost; out of A's scope but should be named as B/C-tranche debt.

`package.json` build command: `vue-tsc -b && vite build` — incremental project references on (good). `tsconfig.tsbuildinfo` was historically tracked (memory notes); A.W0 untracks it.

**No `eslint`, no `prettier`, no `vitest`** in devDeps. Lint is via `vue-tsc` only.

### D6 Test coverage — **MAJOR GAP**

The repo has 59 pytest tests for the Python lib (per memory), and 5 Playwright e2e specs (`web/e2e/{contour-extraction,gallery,paper-performance,settings-persistence,workspace-flow}.spec.ts`). **`web/src/lib/` has zero unit tests**:
- `evaluators.ts` (Clenshaw recurrences for Fourier/Chebyshev/Legendre, 91 LOC of dense numerical code) — untested
- `bases.ts` (`fourierPositionsAt`, the epicycle cumulative sum) — untested
- `svg-fourier.ts`, `svg-contours.ts`, `contourEditing.ts` — untested
- `harmonics.ts` (`groupTrigHarmonics`, the `a_n = 2 Re(c_n)` / `b_n = -2 Im(c_n)` derivation that the paper *cites*) — untested
- `paperSearchIndex.ts` (`searchIndex` fuzzy scorer) — untested
- the equation `composables/` directory — untested

The pytest `tests/test_bases.py::TestEvaluatePartialSum` failures (the brittleness window) test the *Python* evaluator. A's invariant 8 ("numerical correctness precedes UI polish") is unenforced on the **client-side numerical code that actually renders the visualizations**. The TS Clenshaw recurrences in `evaluators.ts` could regress silently and only an e2e visual diff would catch it.

`@vitest/*` is not in `devDependencies`. CI: no `.github/workflows` checked.

### D7 Mobile UX — **MEDIUM GAP**

- `MobileFloatingToc.vue` has tiny touch targets — `floating-toc-search-btn` is `padding: 0.25rem` (`:221`) = ~16px tap area; `floating-toc-search-close` (`:248`) same. **Well below WCAG 2.1 AA 44×44 px.**
- `MobileFloatingToc.vue:107` — the search-btn is a `<span>` not a `<button>` — no focus ring, no keyboard, no accessible name (only `title=`).
- Safe-area-insets: `PaperView.vue:467` includes `env(safe-area-inset-bottom)`, `fourier-overrides.css:215-217` includes a body-level pad. Coverage is partial; the dock/timeline surfaces in visualization view do not bracket their absolute positioning with safe-area insets.
- Gestures: `MobileFloatingToc.vue:283` sets `touch-action: pan-y` on the dropdown scroll — correct. `BasisCanvas.vue` has no `touch-action` on the canvas — vertical scroll over the canvas conflicts with hover-driven scale-up animation triggers.
- Mobile inline TOC at `PaperView.vue:305-319` lists every section flat — for a 97-page paper with N=30+ sections, this is a long unsegmented list with no collapse affordance.
- `FourierShapeExtractor.vue` (`/demo/shape-extractor` route, `router/index.ts:47-50`) ships unstyled to mobile production users — bare `style="padding: 2rem"` and inline SVGs. The audit F flagged this; A.W1's deletion ledger does not address it; it should be gated or removed.

### D8 Math correctness beyond W5 — **MEDIUM GAP (one extra finding)**

Audit F named two nits; W5 captures both. The **third correctness item missed by A**:
- **`api/services/computation.py:121`** — the epicycle reconstruction `trace = chain.evaluate(ts)` uses `ts = np.linspace(0, 1, 3000, endpoint=False)`. This is the *same* off-by-one as the equation `ConvergencePlot` (`equations.py:61`) but for the **visualization view's epicycle trace path**. The trace renders as a polyline in `BasisCanvas`; its last segment never closes the period. W5 §4 fixes `equations.py:61` but does not touch `computation.py:121`. The contour the user traces in the visualization view will likewise have a hairline gap at the period close.

Additional smaller findings in `web/src/lib/evaluators.ts` and `lib/bases.ts`:
- `evaluators.ts:84-90` (Legendre Clenshaw) — the recurrence `((2*k+1)*s*b1)/(k+1) - ((k+1)*b2)/(k+2) + coeffs[k]` is correct (verified against `(k+1)P_{k+1}=(2k+1)xP_k - kP_{k-1}` with α_k=(2k+1)/(k+1), β_{k+1}=(k+1)/(k+2)). The **final-step `s*b1 - b2/2 + coeffs[0]`** correctly uses β_1=1/2. **Verdict: correct, but completely untested** (D6).
- `harmonics.ts:41-42` — `a_n = Re(c_n)+Re(c_{-n})`, `b_n = -(Im(c_n)-Im(c_{-n}))`. For real signals (`c_{-n} = conj(c_n)`), reduces to `a_n = 2 Re(c_n)`, `b_n = -2 Im(c_n)`. **Sign convention matches** `paper/fourier_paper.tex` (per audit F). **But:** for non-real signals (which the backend can emit via complex-valued symbolic input), this silently produces a non-self-adjoint reconstruction; the code does not assert reality. **Document or guard.**
- `FrequencyGraph.vue:48` — `Math.log10(amplitude + 1)` with `amplitude < 0` is undefined; the backend asserts `amplitude = |c_n| ≥ 0` but the type is `number` not `NonNegative`. **Minor honesty nit.**

### D9 Animation / motion design — **MEDIUM GAP**

- **`animation.ts:55-73`** is a manual rAF ping-pong loop. No PRM respect (D4 above). Speed-change restart at `:124-129` is sound.
- **`keyframes.js` `Animation` constructed at `:36-48`** is *unused* — `createAnim()` creates it, but `startLoop()` (the actually-used path at `:55-73`) re-implements timing manually. Memory notes "uses manual rAF loop (not keyframes.js) for reliable infinite cycling". The `keyframes.js` `Animation` is dead code in `animation.ts` (allocated, never started, never read). Either remove the import and the `createAnim()` function, or use it. Dead code, invariant 4.
- **`useFourierMorph.ts:121`** also instantiates `keyframes.js` `Animation` — verify this one is alive (`grep` shows the `addFrame` callback runs).
- **14 `@keyframes` total** in `web/src` (per H2): 7 should die in W2/W3, 7 are project-unique. **Of the 7 surviving**, only `GalleryCard.vue::like-bounce` brackets `prefers-reduced-motion`; the others (`rainbow-drift`, `golden-shimmer`, `marquee-scroll-*`, `rainbow-slide`) animate continuously without PRM guard. Audit C E3 flagged this; the H2 wave allocation marks all 7 "keep with PRM bracket" but **W3.d** only requires "no `@keyframes` duplicates a glass-ui canonical animation name; no `transition: all`" — the PRM-bracket requirement is in scope-bullet 4 but not in the hard-gate condition. **Tighten W3.d's hard gate.**
- **27 `transition: all` sites across 22 files** (per H2 §7) — audit C said 11; H2 corrected to 27. W3.d hard-gate condition 4 ("no `transition: all` in `web/src/`") is correct but the count under-states the cleanup ambition. Naming the count explicitly would prevent silent partial-discharge.

### D10 Glass-ui consumption depth — **LOW-MEDIUM GAP**

Per audit D, fourier consumes 8 of 44 glass-ui subpaths (root, `/styles`, `/dock`, `/tabs`, `/hover-popover`, `/infinite-scroll`, `/dark`, plus root-barrel hits for `TooltipProvider`/`Toaster`/`Slider`/`Collapsible*`/`HoverCard*`). At the **idiom** depth:
- **Composables not adopted.** Glass-ui ships `useGlobalDark`, `useClipboard`, `useOptionalDockContext` (all adopted), but also surface-relevant ones: `useFocusTrap`, `useFloating`, `useKeyboardShortcuts` (if present in glass-ui's exports — audit D's count is 44 subpaths; the composable subset within that is not enumerated here, but a quick grep on glass-ui's `package.json` exports would yield it). Fourier's local `useTouchGate`/`useResizeObserver` mention in H1 doc — neither file actually exists in the consumer tree (`grep` returns 0 hits). H1 named them as "carried debt" but the consumer never had them; W3 scope-bullet 6 should either delete the line or, if these are *glass-ui* exports that fourier consumes, cite the glass-ui paths.
- **Slot/variant adoption.** `<UnderlineTabs>` used 3× in tabs idiom — correct. `<Slider variant="glass-scrubber">` adopted (H2 verified). `<HoverCard>` adopted from root barrel (audit D §2c). No use of `<HoverCard.Portal>` slot. Per audit D, the migration is **substantially complete**; the remaining adoption is the AB+1 metric-primitives (W3 scope).
- **Variants beyond `glass-scrubber`** — `<Slider>` ships multiple variants (per H2 §1.3); fourier only adopts one. Per W3.5 fold (D5 residual), `SliderControl.vue:86` adopts `glass-scrubber`; the `variant` prop residual that H1 flagged needs explicit reconciliation per H2 §1.3.

**Verdict:** fourier consumes glass-ui at *component-import* depth well; **composable-idiom** depth has 1–2 missed adoptions; **variant** depth is one off (the `SliderControl.vue` variant prop). All folded into W3 already; A is on the right path.

### D11 TypeScript strictness drift — **MEDIUM GAP**

`grep ': any\b' web/src/{stores,composables,components}` returns **20+ hits**:
- `stores/gallery.ts` — `catch (e: any)` at `:47, 70, 94, 108, 139, 151, 165, 190, 208` (9 sites)
- `stores/workspace.ts` — `catch (e: any)` at `:108, 163, 199, 221, 243, 268, 297, 314` (8 sites)
- `stores/animation.ts:44` — `(_vars: any, time: number)` (keyframes.js callback)
- `composables/useFourierMorph.ts:121` — same
- `composables/useMorphConfig.ts:82` — `(config as any)[field]`
- `components/visualization/GalleryView.vue:133`, `VisualizationView.vue:110`, `gallery/UserSlugBar.vue:40,54`, `gallery/AdminFlaggedPanel.vue:46`, `gallery/AdminUserList.vue:60,71,83,95` — `catch (e: any)`
- `paper/search/paperSearchIndex.ts:258` — `{ figure?: any } | { code?: any }` in a discriminated union
- `BasisCanvas.vue:437` — `(s as any).ctx = offCtx;` — **legitimately load-bearing** (the canvas surface type does not permit ctx swap; this is the export hack)

**Verdict:** the `catch (e: any)` cluster (17 sites) is the canonical pattern for "I want to log an unknown error message and continue"; it should be `catch (e: unknown)` with a discriminator. Not load-bearing, but the *quantity* indicates copy-paste rather than considered handling. A.W4's scaling pass would be the natural place to type these correctly; W5's admin lift could batch the admin-side ones. Currently neither wave includes it.

Zero `@ts-expect-error`, zero `@ts-ignore`, zero `// eslint-disable` — **clean** at the suppression-comment level.

### D12 Worker / parallelism — **MEDIUM GAP, decision-shaped**

`web/src/lib/math-worker.ts` is dead code (verified — `grep -rn 'new Worker\|math-worker' web/src` returns only a stale doc-comment at `evaluators.ts:3` and the file's self-reference). Audit F flagged its `y = t` placeholder math as dishonest; W4 deletes the file (correct).

**But A does not address whether a real worker should exist.** The compute pipeline:
- `ContourSettings.vue:122-128` — extract → compute (epicycles + bases) via two `Promise.allSettled` HTTP round-trips to FastAPI.
- `BasisCanvas.vue` precomputes a 3000-point trail (`trail.precompute`) on every epicycle data change — main-thread blocking on data arrival.
- `FrequencyGraph.vue:52-114` redraws on every `props.components` change — main-thread CPU.

Tightening targets where a **real worker** would help:
1. Trail precomputation (3000 points × N harmonics) — should be off-main-thread.
2. The `ConvergencePlot.vue:134` per-harmonic curve generation (`xGrid.map((x) => h.a_n * Math.cos(h.k * omega * x) + ...)`) for each harmonic — same.
3. FFT for the equation explorer — currently server-side; could be client-side with a wasm FFT for sub-100ms recompute on coefficient drag.

The W4 deletion of `math-worker.ts` is correct (the file's math was wrong and there was no consumer). The *decision* of "no worker needed" or "worker needed and not yet built" should be **named** somewhere in A — either in W4's archaeology or in the cross-tranche debt §8 — so that future tranches do not silently re-introduce the same dead-code pattern. Currently A simply deletes and moves on.

---

## §2 — Refinement proposals per wave

### W1 — Attribute & land the migration cohort

Minor; the wave is well-specified. One tightening:
- **W1.a sub-gate** should add: "browser-loaded `/demo/shape-extractor` route is either deleted from `router/index.ts:47-50`, gated behind `import.meta.env.DEV`, or scheduled for retirement in `audit/W1-deletion-ledger.md`." The unstyled tool ships to production users today; A invariant 5 (no overfitting) plus audit F's flag warrant action at the moment of attribution.

### W2 — Override-stylesheet abrogation

Three additions:
- **W2.b fold scope** should explicitly name the `body { padding-bottom: env(safe-area-inset-bottom) }` rule (`fourier-overrides.css:215-217`) as folding to `App.vue` *plus* a sweep of absolutely-positioned bottom-aligned dock surfaces (e.g. `AnimationControls.vue`, `VisualizationView` mobile tabs) — the current rule only handles `<body>` level, but the dock floats above it. Cross-ref D7.
- **W2 hard gate** add condition 6: "no surviving `@keyframes` outside of `web/src/styles/` and per-component `<style>` blocks duplicates a glass-ui canonical animation **name**". (Currently the gate names the import sites only; the per-component duplicates `spin` in `GalleryGrid.vue:110` would slip through.)
- **W2.c** add `--font-size-root` decision: per H2's 3-gap reconciliation, this is one of the surviving glass-ui gaps. Name the local-carry location (App.vue or a residual `style.css` block) explicitly; don't leave the placement to the W2 implementer.

### W3 — Interactive-primitive adoption

Three additions (the most consequential refinements):
- **PRM bracket as hard gate.** Promote scope-bullet 4 ("Eliminate duplicate `@keyframes`") into a hard-gate condition: "every surviving `@keyframes` is bracketed under `@media (prefers-reduced-motion: reduce)`". The 7 cosmetic animations (per H2 §4) currently animate continuously; the discharge of the duplicates does not by itself satisfy E3 from audit C.
- **`animation.ts` PRM short-circuit.** Add a scope bullet: "`web/src/stores/animation.ts:82-86` `play()` must respect `prefers-reduced-motion`; either disable auto-play under PRM or render single frames." The current loop is the spine of every visualization animation.
- **Dead-code in `animation.ts`**. Add a scope bullet: "The `keyframes.js` `Animation` instance in `animation.ts:36-48` is allocated but never read by the active `startLoop()` (`:55-73`). Either remove `createAnim()` and the `keyframes.js` import, or wire `startLoop()` through `Animation`. Invariant 4 violation; the import is paid (3 KB) for no use." This is parallel to W4's `math-worker.ts` deletion in spirit.
- **TypeScript strictness sweep, scoped.** Add a scope bullet: "promote `catch (e: any)` (17 sites: `stores/gallery.ts`, `stores/workspace.ts`, admin views) to `catch (e: unknown)` with a typed discriminator; this is part of the same primitive-adoption discipline as the button migration." Not load-bearing, but A.W3 is the cleanest place to batch it.

### W4 — Scaling, KISS & correctness pass

Four additions:
- **`computation.py:121` endpoint=False fix.** Adds a 6th correctness item parallel to the contour-hash bug — see §1 D8. The epicycle trace polyline does not close. The fix mirrors W5's `equations.py:61` correction. Move this to W4 (correctness, no UI) and leave only the `FrequencyGraph` axis label + `ConvergencePlot` legend tweak in W5.d. Rationale: invariant 8 says correctness precedes polish, and this is a backend-side math fix, not a label/legend nit — it belongs with the contour-hash fix.
- **`WORKERS=4` rate-limiter rider.** The Dockerfile (`api/Dockerfile:24`) sets `ENV WORKERS=4` and prod CMD launches `uvicorn --workers ${WORKERS}` (`:25`). H3's recommended "Option A — single-replica documented honestly" misses that **single-replica with 4 uvicorn workers = 4 independent rate-limit buckets per IP** — the documented constraint must address worker count, not just replica count. Either set `WORKERS=1` in prod, document the 4× rate-budget multiplier, or move the bucket to a shared store. W4.a's deploy-note artefact should explicitly name this.
- **Bundle-size sub-wave** (see §3 candidate W4.d / new W7).
- **`endpoint=False` audit table.** Add a verification artefact: "audit each of the 9 `endpoint=False` sites in `api/` and `src/` (`grep` list captured) and classify each as (a) integration over `[a,b)` — keep, (b) visualization sample grid — fix to `endpoint=True`. Capture the classification table in `audit/W4-endpoint-audit.md`." Without this, future regressions of the same off-by-one will recur silently.

### W5 — Admin parity & functionality close

Five additions:
- **Consumer-view a11y, sub-wave A.W5.e.** The current spec scopes a11y only to admin (Suspend/Delete buttons, list rows). The headline visualization canvases (`BasisCanvas`, `ConvergencePlot`, `FrequencyGraph`) and the `EquationModeToggle` are equally a11y-deficient (§1 D2 table). Either add an A.W5.e agent unit ("consumer a11y baseline") or carve a new sub-wave **A.W5.e — Consumer-view a11y baseline** explicitly. Scope:
  - Canvases: `role="img"` + `aria-label` describing what is rendered + adjacent `<figcaption>` with the current state in prose (e.g. "Epicycle reconstruction at t=0.42, 80 harmonics");
  - `EquationModeToggle.vue` → `<Toggle>` or `role="radiogroup"` with `aria-checked`;
  - Mobile floating TOC: `<span>` search trigger → `<button>` with `aria-label`;
  - Touch-target minimum 44×44 enforcement on `MobileFloatingToc.vue:217-258`.
  - Hard-gate: axe-core via Playwright spec passes on `/equation`, `/morph`, `/visualize`, `/paper` (not just admin).
- **`computation.py:121` removal**: see W4 addition; W5.d shrinks to just the FrequencyGraph axis label.
- **`GalleryAdminBanner.vue:36` skeleton**: audit F flagged the stat grid vanishes during `loading`. W5.a scope mentions `Skeleton` adoption via W3, but doesn't pin this site. Name `GalleryAdminBanner.vue` explicitly in W5.a's sub-gate.
- **Equation keyboard nav**: `FunctionInput.vue:100` has a single `@keydown.enter="emit('compute')"`. Add: "preset chips support `ArrowLeft`/`ArrowRight` cycling and Enter activates current chip; `Tab` reaches every interactive element; focus visible". Cite `EquationView.vue` for the full surface.
- **Paper-search ranking**: 5-line section-heading boost in `paperSearchIndex.ts` (multiply score by 2 for `type === 'section'` matches). Low-cost, high-impact for the paper route. Place in W5 (functionality close).

### W6 — Close

One addition:
- **`LESSONS-LEARNED.md` for K-invariant-3 fourth recurrence.** H3 §4 recommends this as optional; given the chronic four-tranche pattern (glass-ui V → AB → AB+1 → fourier), the recurrence-breaking story is exactly what `LESSONS-LEARNED.md` exists for. Promote to required artefact.

---

## §3 — Candidate new waves / sub-waves

### A.W7 — Web performance and bundle hygiene (proposal: **NEW WAVE**)

**Charter:** discharge D1 in a dedicated wave; the entry chunk is 907 KB raw / 368 KB gz, paper chunk 469 KB / 117 KB gz, and there is no `manualChunks` strategy. Current A waves all touch *correctness* and *idiom*; bundle size has no owner.

**Scope:**
1. Replace root-barrel `import { TooltipProvider, Toaster } from "@mkbabb/glass-ui"` in `App.vue:4` with subpath imports (`@mkbabb/glass-ui/tooltip` etc., if available; otherwise file as a glass-ui gap to publish the subpaths). Target: drop the 268 KB `Tooltip.vue_…` chunk to ~30 KB.
2. Add `vite.config.ts` `build.rollupOptions.output.manualChunks` for: `vendor-vue` (vue + vue-router + pinia), `vendor-glass-ui` (the `@mkbabb/glass-ui` surface used by the app shell), `vendor-katex` (katex + KaTeX runtime), `vendor-lucide` (lucide-vue-next icon set). Target: entry chunk 907 KB → ~250 KB.
3. Add `<link rel="modulepreload">` for the code-split route a user is most likely to visit next (heuristic: from `/paper` preload `/visualize`; from `/visualize` preload `/equation`). Vite emits these automatically when routes are static — verify they appear in `dist/index.html` (current `dist/index.html` carries zero such hints — confirmed).
4. Add KaTeX font preload to `web/index.html` for the 3 most-used glyphs (`KaTeX_Main-Regular`, `KaTeX_Math-Italic`, `KaTeX_Size1-Regular`).
5. Investigate single-KaTeX-instance pattern: hoist `katex` to a singleton in `web/src/lib/katex.ts` so `EquationPanel.vue`/`EquationResult.vue`/`ConvergencePlot.vue`/`useCoeffHover.ts` share one runtime. Likely deduplicates KaTeX inside the equation chunk versus the paper chunk.
6. Service worker for the paper assets (`assets/`, KaTeX fonts, paper PNGs). The paper route is the most-likely entry point per `router/index.ts` (default redirect target). A small service worker that caches `/assets/*` + KaTeX fonts is a high-ROI cache; KISS-aligned (no PWA install, just a runtime cache). Optional — surface a decision in the W7 challenge.
7. Image `decoding="async"` on gallery cards; `fetchpriority="high"` on the LCP gallery hero image.

**Agents:** 3 parallel.
**Hard gate:** entry chunk ≤ 350 KB raw (or ≤ 110 KB gz); PaperView chunk ≤ 250 KB raw (or ≤ 80 KB gz); the `Tooltip.vue_…` chunk replaced by a sub-100-KB tooltip chunk; `dist/index.html` carries `modulepreload` for at least the route currently navigated; Lighthouse performance score on `/paper` ≥85 (mobile, simulated 4G). Capture before/after bundle analysis (`vite-bundle-visualizer` or `rollup-plugin-visualizer`).

**Dependencies:** W2 (style abrogation reduces CSS), W3 (primitive adoption may swap heavy `Tooltip` wrappers for lighter glass-ui components).

**Why a new wave, not folded into W4:** W4 is "scaling, KISS & correctness" at the *backend* level — janitor, rate-limiter, contour hash. Bundle-size is a separate concern with separate evidence (rollup analysis artefact) and a separate failure mode (cold-start latency, not server-side scaling). Folding it into W4 would dilute both. **Recommend opening as A.W7** (after W6 — but actually since W6 is close ceremony, more naturally as **A.W5.5 inserted between W5 and W6** if A is to remain a 7-wave plan, or as a fresh tranche-A wave if the count can expand).

Alternatively, fold as **A.W4.d agent unit** if a new wave is judged out-of-thesis. The cleanest plan is W7 because the evidence shape and dependencies differ; the smaller plan is W4.d.

### A.W5.e — Consumer-view a11y baseline (proposal: **NEW SUB-WAVE WITHIN W5**)

Already detailed in §2 W5 refinements. Carving as a fourth agent unit (alongside W5.a/b/c/d) is the lightest-touch path; if scope exceeds one agent's bandwidth, promote to its own wave **A.W6.5 / A.W8** but the design-language gap is small enough to fit in W5.

### A.W3.5 / W3 amendment — Vitest unit coverage for `web/src/lib`

Not large enough for a wave, but large enough that the *absence* of a named home is a defect. Two options:
- **Fold into W3** — adopt vitest as a tooling step, ship 1 spec per file in `lib/{evaluators,bases,harmonics,svg-fourier}.ts`. Test the Clenshaw recurrences against the paper's worked examples; test the harmonic grouping against a known signal. Hard-gate add: "`vitest run` green; `web/src/lib/evaluators.ts`, `bases.ts`, `harmonics.ts` each have at least one regression-pass spec."
- **Defer to tranche C** with a named ticket. Acceptable but invariant 8 ("numerical correctness precedes UI polish") pushes for the former.

---

## §4 — Updated brittleness-window candidates

A.md §9 currently declares one brittleness window: the two pre-existing `test_bases.py::TestEvaluatePartialSum::{test_chebyshev,test_legendre}` failures, restoration W0.

Candidate additional windows revealed by R2:

| # | Window | Evidence | Restoration |
|---|---|---|---|
| BW-2 | Entry-chunk size 907 KB raw / 368 KB gz exceeds a typical-app baseline (~200 KB gz). No regression test exists; the bundle could grow silently. | `dist/assets/index-BHKA8vf9.js` measured 2026-05-18 | **A.W7** (or A.W4.d if folded). Adopt `rollup-plugin-visualizer` or a CI bundle-size gate (`size-limit`) at close. |
| BW-3 | Zero unit tests for `web/src/lib/`. Math invariant 8 unenforced on TS evaluator code. | `grep` of `test/`, `__tests__/`, `*.spec.ts` outside `e2e/` returns nothing | **A.W3** (fold) or new tranche-C-Q ticket. |
| BW-4 | 4-worker uvicorn × single-replica = 4× rate-limit budget. H3's "single-replica documented honestly" is **incomplete**. | `api/Dockerfile:24-25` `WORKERS=4` | **A.W4.a** (amend deploy-note + either set `WORKERS=1` or document the multiplier). |
| BW-5 | The visualization canvas surfaces (`BasisCanvas`, `ConvergencePlot`, `FrequencyGraph`, `ContourEditorCanvas`) have zero a11y semantics. axe-core scan on `/visualize` would fail today. | grep verified | **A.W5.e** (new sub-wave). |
| BW-6 | `animation.ts:82 play()` ignores `prefers-reduced-motion`. The audit-C E3 flag stands. | direct read | **A.W3** scope-bullet (proposed in §2). |
| BW-7 | `keyframes.js` `Animation` allocated in `animation.ts:30-52` but never read — dead code parallel to `math-worker.ts`. | direct read | **A.W3** or **A.W4** dead-code sweep. |
| BW-8 | `api/services/computation.py:121` mirrors the `ConvergencePlot` endpoint=False off-by-one for the epicycle trace. | direct read | **A.W4.b** (proposed in §2). |
| BW-9 | `FourierShapeExtractor` reachable at `/demo/shape-extractor` in production with no design language and no gating. | `router/index.ts:47-50` | **A.W1.a** sub-gate (proposed in §2). |

Of these, **BW-4, BW-6, BW-8, BW-9 are correctness/scaling-shaped** and belong in W3/W4 by invariant ordering; **BW-2, BW-3, BW-5 are wave-shaped** and warrant either A.W7 (bundle) or A.W5.e (consumer a11y) or vitest fold (W3).

---

## §5 — Tally

- **5 dimensions where A has substantial gaps:** D1 (bundle size), D2 (consumer a11y), D6 (unit-test coverage of `web/src/lib`), D4 (canvas perf + PRM), D9 (motion design — PRM, dead `keyframes.js` allocation, undercounted `transition: all`).
- **3 dimensions where A has minor / fold-able gaps:** D3 (KaTeX duplication, paper-search ranking, mobile TOC `<span>` triggers), D8 (one missed math-honesty site at `computation.py:121`), D11 (TS strictness — `: any` cluster).
- **2 dimensions where A is sound:** D5 (build/dev toolchain — tsconfig is `strict: true`, vue-tsc clean, no eslint debt because no eslint), D10 (glass-ui consumption — A− per audit D, the remaining adoption is W3 metric primitives), D7 (mobile UX — partial safe-area coverage, fixable in W2/W5).
- **1 dimension where A has a decision-shaped gap:** D12 (worker / parallelism — `math-worker.ts` correctly deleted, but the *future* of client-side parallelism is unnamed).

**Newly proposed wave:** **A.W7 — Web performance and bundle hygiene** (entry 907 KB → ≤ 350 KB, paper 469 KB → ≤ 250 KB, modulepreload added, KaTeX deduplicated, optional service worker for paper assets). Alternative: fold as A.W4.d agent unit.

**Newly proposed sub-wave:** **A.W5.e — Consumer-view a11y baseline** (canvas `role="img"` + `<figcaption>` patterns, `EquationModeToggle` semantics, mobile floating TOC focusability, 44×44 touch targets, axe-core spec across consumer routes). Alternative: fold as W5 fourth agent unit.

**Tightest refinements per wave that R2 recommends:**

- **W2:** name the `--font-size-root` local-carry location explicitly; add per-component `@keyframes` to hard gate (not just `styles/` imports).
- **W3:** promote PRM bracket to hard gate; address `animation.ts` PRM and `keyframes.js` dead allocation; batch the `catch (e: any)` cleanup.
- **W4:** add `computation.py:121` endpoint=False fix (the missed math nit); the deploy-note must address `WORKERS=4` not just replicas; add the `endpoint=False` audit table artefact.
- **W5:** add the consumer-view a11y carve (or new W5.e unit); paper-search section-heading boost; `GalleryAdminBanner` skeleton; equation preset-chip keyboard nav.

The plan as-hardened is **structurally sound and dispatchable**. The R2 refinements are *additive* — none invalidate the existing W0–W6 structure. The single judgment call A must make is whether bundle-size (D1) is in-tranche scope (W7 or W4.d) or out-of-tranche debt (file to a future fourier tranche). R2 recommends in-tranche, given that 907 KB on a paper-reading user's first paint is the *kind* of user-facing scaling gap invariant 12 names.
