# fourier — glass-ui design-canon audit

**Run:** 2026-06-01-constellation-ui
**Target:** `fourier` frontend at `/Users/mkbabb/Programming/fourier-analysis/web` (src located at `web/src/` — `package.json` depends on `@mkbabb/glass-ui@^2.0.0`; holds `App.vue`, `src/components/**`, `src/style.css`).
**Consumed glass-ui revision:** installed `node_modules/@mkbabb/glass-ui@2.0.0`. The glass-ui working tree on disk is **`3.0.0`** (`21547de`). Both 2.0.0 and 3.0.0 ship the **same seven-tier glass vocabulary** (`glass-wash/quiet/resting/floating/overlay/dock/chassis`) and the same radius/shadow/z/duration token namespaces — so the findings below are version-stable. Where 2.0.0 and 3.0.0 differ is immaterial to the drift cited.
**Priority slice:** `VisualizationView.vue` + the `Configurator` / `ConfiguratorLayer` adoption (left→right panel move, squared edges). Audited in full; findings in Axis 4 + Axis 7 + the Glass-ui gaps section.

Canonical replacements were grep-verified against `/Users/mkbabb/Programming/glass-ui/src/styles/*` and `/src/components/**` before naming. `file:line` is consumer-relative to `web/src/` unless prefixed.

---

## Axis 1 — Token alignment

**1.1 — Phantom glass-tier classes (10 sites). HIGH.** Ten elements apply `glass-subtle` / `glass-medium` / `glass-elevated`, none of which exist as a utility in the consumed library (verified: `glass.css` in both the installed 2.0.0 dist and the 3.0.0 tree defines only `.glass-wash`, `.glass-quiet`, `.glass-resting`, `.glass-floating`, `.glass-overlay`; there is no consumer-local `@utility` shim). These classes are inert no-ops; each element silently relies on its sibling bespoke class for any surface.
- `paper/PaperView.vue:338` (`glass-subtle`), `paper/MobileFloatingToc.vue:110,117,133` (`glass-medium`), `paper/search/PaperSearchDropdown.vue:39` (`glass-elevated`), `visualization/EquationPanel.vue:70` (`glass-subtle`), `visualization/gallery/GallerySearchBar.vue:80` (`glass-medium`), `equation/EquationView.vue:260` (`glass-elevated`), `equation/EquationModeToggle.vue:9` (`glass-subtle`), `equation/convergence/ConvergenceLegend.vue:17` (`glass-subtle`).
- **Replace:** map onto the tier ladder — recessive inline chrome → `.glass-quiet`; transient floating panels/dropdowns/popovers (EquationPanel, PaperSearchDropdown, coeff-popover, GallerySearchBar filter, MobileFloatingToc dropdown) → `.glass-floating`. (Cf. DESIGN.md §L1 tier table.)

**1.2 — Hand-rolled elevation shadow where a semantic token exists (≥11 sites). HIGH.** `box-shadow: 0 Npx Npx rgba(0,0,0,0.NN)` literals reproduce the `--shadow-{sm,md,lg,xl}` recipe verbatim (`tokens.css:456-459`: `--shadow-sm = 0 2px 8px …6%`, `--shadow-md = 0 4px 16px …8%`, `--shadow-lg = 0 4px 20px …12%`, `--shadow-xl = 0 8px 24px …14%`):
- `0 4px 16px rgba(0,0,0,0.08)` → `var(--shadow-md)`: `visualization/EquationPanel.vue:124`, `paper/PaperSearch.vue:114`, `paper/MobileFloatingToc.vue:300`.
- `0 2px 8px rgba(0,0,0,0.08–0.1)` → `var(--shadow-sm)`: `paper/PaperView.vue:507`, `visualization/GlassTimeline.vue:116`.
- `0 4px 12px rgba(0,0,0,0.12)` → `var(--shadow-lg)`: `paper/PaperView.vue:520`, `equation/ConvergencePlot.vue:397`, `equation/EquationView.vue:464`, `equation/FrequencyGraph.vue:190` (arbitrary `shadow-[0_4px_12px_rgba(0,0,0,0.12)]`).
- `0 8px 40px … , 0 2px 8px …` → `var(--shadow-xl)` family: `paper/PaperSearch.vue:261-262`.
- **Replace:** the matching `--shadow-*` token (or `.shadow-cartoon-*` for the stamped variant).

**1.3 — `--radius-pill` minted as `9999px` literal (14 sites). MEDIUM.** `border-radius: 9999px` where `--radius-pill: 9999px` (`tokens.css:276`) is the named token:
`visualization/AnimationControls.vue:146,162,172`, `visualization/CanvasControlsDock.vue:127`, `visualization/FullscreenViewer.vue:187`, `visualization/SpeedSelect.vue:57,68`, `equation/EquationModeToggle.vue:36`, `equation/NotationPills.vue:38`, `equation/FunctionInput.vue:238`, `layout/AppHeader.vue:257`. **Replace:** `var(--radius-pill)` (or the Tailwind `rounded-pill` alias in markup).

**1.4 — Other literal radii bypassing primitives/aliases (~30 of 58 total `border-radius:` literals). LOW-MEDIUM.** `0.75rem`/`0.5rem`/`0.375rem`/`0.25rem`/`8px`/`3px` scattered across `paper/*`, `morph/*`, `visualization/ContourSettings.vue:394,413,433`, `visualization/BasisSelector.vue:303`, etc. **Replace:** `--radius-md` (6px), `--radius-lg`/`--radius` (10px), `--radius-xl` (12px), `--radius-2xl` (16px) primitives, or the semantic alias when the element is a card/panel/input/button (`--radius-input` for `SelectTrigger`-adjacent fields, etc.).

> Clean: **zero** hand-rolled `cubic-bezier()` strings anywhere (all easing flows through `var(--ease-*)`; A.W3.d hardening verified). Color/opacity recipe `color-mix(in srgb, var(--foreground) N%, transparent)` is used idiomatically where present.

---

## Axis 2 — Utility & @apply hygiene

**2.1 — Consumer redefines a removed library class (`cartoon-card` shim). MEDIUM (deliberate, but cross-repo-owed).** `style.css:107-111` re-mints `@utility cartoon-card { @apply cartoon-surface; … }` because glass-ui removed the `.cartoon-card` recipe at C.W5 (`cards.css:2`), keeping only `cartoon-surface`. Consumed at **14 sites / 13 files**. This is a documented, KISS local shim, not accidental drift — but it is a consumer `@utility` standing in for a deleted library export. **Disposition:** keep as-is OR (canonical) migrate the 14 sites to `.cartoon-surface` + the `--border`/`--card` defaults and delete the shim. Booked as a glass-ui union candidate below.

**2.2 — Literal `transition: all` — NONE.** All 14 grep hits are *comments* (`/* … no transition: all */`, the A.W3.d ledger). Genuinely clean; every transition lists named properties.

---

## Axis 3 — Interactive consistency

**3.1 — `<Button>` adoption is strong.** 37 `<Button>` consumers; bespoke `<button>` count is low (8, mostly inside primitives' own slots). `BasisSelector.vue` / `ContourSettings.vue` reset + toggle affordances correctly use `<Button variant="ghost|outline">` with `aria-pressed`/`aria-label`. No drift to flag here.

**3.2 — Literal transition durations + bare `ease` (≈38 decls). MEDIUM.** Many transitions hardcode `0.15s`/`0.12s`/`0.1s`/`0.2s`/`0.3s` with a bare `ease`/`ease-out` rather than `var(--duration-*)` + `var(--ease-*)` (`tokens.css:50-57` defines `--duration-instant .1s / -fast .2s / -normal .3s / -slow .45s`). Representative: `paper/PaperSearch.vue:55,94,129,360`, `visualization/EasingPicker.vue:93`, `visualization/ContourSettings.vue:344,395,442`, `paper/MobileFloatingToc.vue:287`, `visualization/ContourEditorCanvas.vue:311,320`, `visualization/ImageUpload.vue:168,171`. The micro-durations below `0.1s` (e.g. `0.12s`) have no exact token and are reasonable literals; the `0.2s/0.3s` ones should bind `--duration-fast`/`--duration-normal`. **Replace:** named property + `var(--duration-fast|normal)` + `var(--ease-standard)`.

---

## Axis 4 — Variant orthogonality & rooting  *(priority slice)*

**4.1 — Configurator radius geometry: `rounded-card` is wrong for the inline-workspace adoption. HIGH (the dispatch's flagged instance).** `Configurator.vue:94` hard-codes `glass-floating rounded-card` (`--radius-card` = `--radius-2xl` = 16px) — correct for its designed role (storybook manifest: *"Studio-tier … floating glass substrate"*). In fourier it is repurposed as the **full-viewport workspace chassis** (`VisualizationView.vue:194`, `.viz-configurator { flex:1 }`) — a flush, full-height, inline (non-floating) surface, not a transient studio specimen. As an inline workspace it wants the squarer **`--radius-panel`** (`--radius-xl` = 12px); that mismatch is the "squared edges" instance noted in the dispatch. The consumer currently cannot square it without `:deep()` because `Configurator` exposes no `radius`/`tier`/`shape` prop. **Verdict:** the Configurator surface *should* carry `--radius-panel` in this inline mode → see Glass-ui gap **G1**.

**4.2 — `:deep()` into a glass-ui grid cell (`.configurator-stage`). MEDIUM — a missing-behavior signal.** `VisualizationView.vue:328` reaches `.viz-configurator :deep(.configurator-stage) { flex: 1 1 0%; min-height: 0; }` to fix a mobile flex-collapse: glass-ui's stage cell is `position: relative` and (when the desktop grid drops to the mobile flex column) collapses to 0px height because the canvas inside is `position: absolute`. The companion `.viz-panel-right` comment (`:357-371`) re-confirms the same `.configurator-stage` collapse on desktop. This `:deep()` patches library layout from the leaf → signals a missing token/behavior on glass-ui's side → Glass-ui gap **G2**. (The other 17 `:deep()` hits target KaTeX `.katex*`, own `.canvas-container`/`.editor-shell`, `mark`, `svg`, `code`/`pre` — i.e. third-party/own DOM, not reka-ui internals → not drift.)

**4.3 — `ConfiguratorLayer` reset affordance pushed into the body (2 sites). MEDIUM — missing slot.** `BasisSelector.vue:120-135` and `ContourSettings.vue:189-204` both carry the identical comment *"ConfiguratorLayer has no header-actions slot, so the affordance lives at the top of the layer body"* and inject a reset `<Button>` with negative-margin hacks (`-mt-1 -mb-1`). The primitive's trigger row (`ConfiguratorLayer.vue:102-129`) has no actions slot. → Glass-ui gap **G3**.

> No collapse of surface-tier × intent × shape into one vocabulary observed elsewhere; shadcn/reka re-exports (`Select`, `DropdownMenu`, `Dialog`, `Slider`, `GlassDock`) are consumed as components, not re-styled at the leaf (the `:deep(.katex*)` cases are content-typesetting, not CVA-root patching).

---

## Axis 5 — Overlay & motion vocabulary

**5.1 — Floating panels not composing the canonical floating tier (overlaps Axis 1.1). MEDIUM.** The overlay panels — `EquationPanel.vue` (`.eq-panel`, an absolute overlay at `--z-controls` with hand-rolled `box-shadow` + dead `glass-subtle`), `PaperSearchDropdown.vue` (`glass-elevated`), `EquationView.vue:260` coeff-popover (`glass-elevated`), `GallerySearchBar` filter panel (`glass-medium`) — should resolve to `.glass-floating` + the canonical floating composition (`--z-popover`/`--z-overlay` + `floating-panel-in`), not a no-op tier class plus a literal shadow. (`EquationPanel` sits at `--z-controls` = 20, below `--z-popover` = 130, despite being a transient floating overlay.)

**5.2 — Local `@keyframes tab-slide-in` carry. LOW (documented).** `style.css:83-90` ships a `tab-slide-in` keyframe for `[data-state="active"][role="tabpanel"]`, bracketed by `prefers-reduced-motion` (`:92-96`). Comment notes it is "pending glass-ui's Tabs primitive shipping this." This is a small, a11y-bracketed, documented carry — not a duplicate of `dialog-in`/`fade-in`/etc. Disposition: upstream onto the Tabs primitive (union candidate U2).

**5.3 — Spatial motion mostly bracketed.** 9 files carry `prefers-reduced-motion`. The Vue `<Transition>` choreography in `VisualizationView.vue:410-424` uses `var(--ease-*)` tokens for every named transition (panel-swap, slide-down, fade) — clean. Spot-gaps: confirm `controls-dock-anchor` left↔center slide (`:434-443`, a spatial transform) is reduced-motion-bracketed (currently it is not).

---

## Axis 6 — Typographic & structural hierarchy

**6.1 — Zero adoption of the semantic type scale. LOW-MEDIUM.** No usage of `.text-display-*`, `.text-title`, `.text-heading`, `.text-subheading`, `.text-body`, `.text-prose`, `.text-mono-*`, `.section-label`, `.kbd`, `.code-badge` anywhere in the consumer. Headings ride ad-hoc Tailwind (`text-2xl/3xl/4xl` appears 3×; mostly `text-sm font-semibold`-style inline). The display scale (Fraunces axes, golden-ratio `--type-*`) is unused. Low severity because the brand fork deliberately remaps `--font-sans → Computer Modern Serif` (`style.css:14`) and the headings are modest, but the structural hierarchy primitives (`.text-title`/`.text-heading`) would replace the scattered `text-sm font-semibold` idiom.

**6.2 — `fira-code` is canonical — NOT drift.** The 49 `fira-code` uses initially read as a reinvented mono cascade, but `fira-code` is a shipped glass-ui `@utility` (`glass-ui/src/styles/typography.css:392`; installed dist `:479`). Legitimate. Note only: glass-ui additionally ships richer `.text-mono-{caption,small,prose,micro}` semantic variants for size+leading-locked mono — optional upgrade, not required.

---

## Axis 7 — Accessibility resilience

**7.1 — Reimplemented glass surfaces missing the a11y fallback bracket (3 sites). HIGH.** glass-ui's `.glass-*` tiers ship the full degraded-fallback set in `glass.css:226` (`prefers-reduced-transparency: reduce`), `:245` (`prefers-contrast: more`), `:255-257` (`@supports not (backdrop-filter…)`). These three consumer surfaces **reimplement** `backdrop-filter` from scratch and carry **none** of those brackets:
- `visualization/AnimationControls.vue:151-156` — `.play-btn` hand-rolls the full six-layer glass composite (`backdrop-filter: blur(12px) saturate(1.4)`, `border: 1px solid rgba(255,255,255,0.25)`, inset catch-light + drop shadow, `#fff` text) **inside** an otherwise-canonical `<GlassDock>` (`:127`). The rainbow `::before` gradient is intentional brand flourish, but the surrounding glass should compose `.glass-dock`/`.glass-btn` so the fallbacks come for free.
- `paper/PaperSearch.vue:248-249` and `paper/PaperView.vue:503-504` — raw `backdrop-filter: blur(6–8px)` surfaces with no `@supports`/reduced-transparency fallback.
- **Replace:** compose the canonical tier (`.glass-floating`/`.glass-dock`) instead of a bespoke `backdrop-filter` block; the a11y brackets then inherit.

**7.2 — No light-mode foreground baked into a dark-unwindable value observed** in the audited `color-mix(... var(--foreground) …)` sites (they reference live `--foreground`, which the dark cascade overrides). The one explicit light/dark split (`--viz-amber` in `style.css:119-127`) is correctly forked per mode. Clean.

---

## Glass-ui gaps (patterns fourier legitimately needs that glass-ui doesn't expose)

**G1 — `Configurator` needs a non-floating / inline `radius` (or `tier`/`variant`) prop. HIGH.** `Configurator.vue:94` hard-codes `glass-floating rounded-card`. fourier's full-viewport workspace adoption (`VisualizationView.vue:194`) wants `--radius-panel` + an inline (non-elevated) tier, with no escape hatch short of `:deep()`. **Proposal:** add a `variant: "studio" | "inline"` (or `radius` / `surface` prop) on `Configurator` — `studio` keeps `glass-floating rounded-card`; `inline` yields `glass-quiet rounded-panel` for embedded workspace chassis. Placement: `components/custom/configurator/Configurator.vue` `containerClass` CVA. Rationale: the primitive is documented as studio-tier, but is being (reasonably) reused as a workspace shell; orthogonalize surface-tier×shape from the one baked vocabulary.

**G2 — `Configurator` stage cell collapses to 0px when the grid drops to the mobile flex column. HIGH.** Forces `VisualizationView.vue:328` `:deep(.configurator-stage){ flex:1 1 0%; min-height:0 }` and the desktop `.viz-panel-right` height hack (`:357-371`). The `.configurator-stage` cell (`Configurator.vue:117`) is `position:relative` with no intrinsic height; an absolutely-positioned child (a canvas) collapses it. **Proposal:** in `Configurator.vue`, give `.configurator-stage` `min-height:0` + (in the mobile flex fallback) `flex:1 1 0%` so a fill-the-cell stage lays out without consumer `:deep()`. Cited at 2 consumer sites. Placement: the `.configurator-stage` class + the `lg:` grid/flex breakpoint in `Configurator.vue`.

**G3 — `ConfiguratorLayer` needs a header-actions / trigger slot. MEDIUM.** Two consumers (`BasisSelector.vue:120`, `ContourSettings.vue:189`) document the absence verbatim and push a reset `<Button>` into the body with negative-margin hacks. **Proposal:** add a `#header-actions` (or `#trigger-end`) slot to `ConfiguratorLayer.vue`'s trigger row (`:116-129`, before/after the chevron) so per-layer affordances (reset, lock, info) sit in the header. Repeated ≥2× across files = a real slot gap.

**G4 — Semantic-radius Tailwind aliases under-reached because consumers default to primitives.** `rounded-full` (32×), `rounded-lg` (17×), `rounded-md` (10×), `rounded-xl` (4×) dominate; semantic `rounded-{card,panel,input,button,badge,pill}` barely used (`rounded-pill` 2×). Not strictly a *gap* (the aliases exist), but the ergonomics suggest glass-ui could document/lint the alias-over-primitive rule; the elevation-shadow literal recipe (Axis 1.2) likewise wants a documented "always use `--shadow-*`" precept enforced in the consumer-contract audit.

---

## Union candidates (same pattern, both libraries, different vocabulary)

**U1 — `cartoon-card` ↔ `cartoon-surface`.** glass-ui deleted `.cartoon-card` (C.W5) keeping `.cartoon-surface`; fourier resurrects `.cartoon-card` as a local `@utility` shim (`style.css:107`) at 14 sites. Canonical: settle on **`.cartoon-surface`** as the one name — either re-export a thin `.cartoon-card` alias from glass-ui (so consumers need no shim) or migrate fourier's 14 sites and delete the shim. (Already booked as a fourier coordination ask per the `style.css:98-106` comment.)

**U2 — Tab-panel entry animation.** fourier carries `@keyframes tab-slide-in` + the `[data-state="active"][role="tabpanel"]` rule locally (`style.css:79-96`) targeting glass-ui's own `UnderlineTabs` data-attribute, explicitly "pending glass-ui's Tabs primitive shipping this." Canonical: ship the panel-enter animation on the `UnderlineTabs`/`BouncyTabs` primitive (reduced-motion-bracketed) and retire the consumer carry.

---

## Tally

Drift by axis — **A1:** 4 (phantom glass tiers; shadow literals; `9999px`→`--radius-pill`; misc literal radii) · **A2:** 1 active (the `cartoon-card` shim; `transition:all` = 0) · **A3:** 1 (literal durations + bare `ease`) · **A4:** 3 (Configurator radius; `:deep(.configurator-stage)`; missing `ConfiguratorLayer` header slot) · **A5:** 2 (floating panels off-tier; local tab keyframe — low) · **A6:** 1 (semantic type scale unused; `fira-code` cleared as canonical) · **A7:** 1 (3 reimplemented-glass surfaces missing a11y fallbacks). **Glass-ui gaps:** 4 (G1 Configurator inline radius/tier · G2 stage-cell collapse · G3 ConfiguratorLayer header slot · G4 alias-over-primitive ergonomics). **Union candidates:** 2 (U1 cartoon-card/surface · U2 tab-panel entry). **Highest-impact:** A1.1 phantom glass-tier classes (10 inert sites), A1.2 shadow-token literals (≥11), A7.1 + G1/G2/G3 on the Configurator priority slice.
