# Constellation Style Audit — glass-ui Design Canon (UNIFIED)

**Run:** 2026-06-01-constellation-ui · **Date:** 2026-06-01 · **Mode:** MERGE (6 per-app reports → one)

## Executive summary (≤12 lines)

- **Grand drift tally: 90 findings** across 6 targets — fourier 13 · color-valuejs 22 · words 29 · speedtest 10 · keyframes 9 · glass-ui (self) 11.
- **Top 5 cross-app glass-ui gaps** (ranked by summed cross-app call-site demand): **(1)** dead/renamed glass-tier classes silently no-op — `glass-subtle/medium/elevated` → `glass-quiet/floating` (**4 apps, ~16 sites**); **(2)** partial-glass surfaces missing the a11y fallback matrix — need `.glass-track`/shared `@supports` bracket (**4 apps, ~20 sites**); **(3)** hover/press **scale** utility — `.hover-scale` companion to `.active-scale` + one press-rung rule `--scale-press-btn` (**5 apps, ~80 sites**); **(4)** `.focus-ring` under-reached / inline ring reinvented (**2 apps, ~44 sites**); **(5)** static **inline-pill / identity-chip** primitive (`.inline-pill`, slug/badge chrome) (**2 apps, ~10+ sites**). Runners-up: Tabs `underline`/`pill` variant (3 apps), `.hover-cartoon` diagonal-lift (self, 9), Toaster `position` prop (2 apps), Configurator inline-radius + stage-collapse + header-actions slot (fourier).
- **Q1 — why the fourier visualizer panel moved left→right:** fourier adopted glass-ui's `Configurator`/`ConfiguratorLayer` (B.W2); the move went live only now because the SPA deploy chain was dead ~2 months and just got restored.
- **Q2 — why its borders are squared:** a **DEFECT**, not an aesthetic. The outer `Configurator` is `rounded-card` but the inner `ConfiguratorLayer` sections use `border-b border-border/40` dividers with **no radius** — rounding stops one level too high. User CANON is now explicit: glass-ui must be **fully rounded by default, at the root**. The `^2→^3` bump does **not** fix it (the squared `ConfiguratorLayer` is byte-identical in both).

---

## 1. Preamble — scope & versions

This report merges six per-app design-canon audits run on 2026-06-01 against the `@mkbabb/glass-ui` vocabulary. Scope = **6 constellation app UIs** plus the **glass-ui self-audit** (the library audited against its own canon, with `demo/stories/` as the oracle — drift in the oracle = the canon contradicting itself):

| Target | Frontend root | glass-ui consumed | Installed / resolved |
|---|---|---|---|
| **fourier** | `fourier-analysis/web` | `^2.0.0` | installed `2.0.0`; canon tree on disk is `3.0.0` (`21547de`) |
| **color-valuejs** (color.babb.dev) | `value.js/demo/color-picker/` | `file:../glass-ui` → **`3.0.0`** (`21547de`) | linked source, 61 import sites |
| **words** (floridify) | `words/frontend` | `^2.0.0` | **not installed** — runtime version unpinnable; `^2→3.0.0` canon spread flagged inline |
| **speedtest** | `speedtest` (speedtest.friday.institute) | `^2.1.0` | installed **`2.1.0`** (repo HEAD unreleased `3.0.0` @ `21547de`) |
| **keyframes.js** | `keyframes.js/demo/` | `file:../glass-ui` → **`3.0.0`** (`21547de`) | linked source, 11 entry subpaths |
| **glass-ui (self)** | `glass-ui/src` + `demo/` | — (audits itself) | **`3.0.0`** @ `21547de6` |

**Version note — the unpublished local `3.0.0` and the `^2→^3` spread.** glass-ui's working tree on disk is an **unpublished local `3.0.0`** (`21547de`). The constellation straddles the `2.x→3.0` boundary: fourier and words declare `^2.0.0`, speedtest `^2.1.0`, while color-valuejs and keyframes link the local `3.0.0` directly. Both 2.x and 3.0.0 ship the same seven-tier glass vocabulary and the same radius/shadow/z/duration token namespaces, so most citations are version-stable — but **3.0.0 renamed the tier ladder** to `wash/quiet/resting/floating/overlay` and dropped `.glass-{subtle,medium,elevated,default}`, which is why those classes now silently no-op in the `^2`-era consumers (drift A2.1 below). Three v3-only tokens (`--surface-tint-*`, `--type-display-*`, `--muted-foreground-strong`) may not exist in the version words actually links; flagged where it changes a finding. The `^2→^3` bump alone does **not** resolve the squared-Configurator defect — see §6.

---

## 2. Drift — re-grouped by the 7 axes ACROSS all apps

Concatenated and re-grouped by axis (no per-app silos). Columns: **app · file:line · canonical replacement · count**. Severity in the row label where HIGH.

### Axis 1 — Token alignment

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | 8 sites across `paper/*`, `equation/*`, `visualization/*` (`glass-subtle/medium/elevated`) | tier ladder: recessive→`.glass-quiet`, floating→`.glass-floating` | 10 |
| fourier | `EquationPanel.vue:124`, `PaperSearch.vue:114`, `MobileFloatingToc.vue:300`, `PaperView.vue:507,520`, `GlassTimeline.vue:116`, `ConvergencePlot.vue:397`, `EquationView.vue:464`, `FrequencyGraph.vue:190`, `PaperSearch.vue:261-262` | matching `--shadow-{sm,md,lg,xl}` token (HIGH) | ≥11 |
| fourier | `AnimationControls.vue:146,162,172`, `CanvasControlsDock.vue:127`, `FullscreenViewer.vue:187`, `SpeedSelect.vue:57,68`, `EquationModeToggle.vue:36`, `NotationPills.vue:38`, `FunctionInput.vue:238`, `AppHeader.vue:257` | `var(--radius-pill)` (`9999px` literal) | 14 |
| fourier | `ContourSettings.vue:394,413,433`, `BasisSelector.vue:303`, `paper/*`, `morph/*` (misc literal radii) | `--radius-{md,lg,xl,2xl}` primitive / semantic alias | ~30 |
| color-valuejs | `MixResultDisplay.vue:31` | `rounded-panel` (panel-tier alias) | 1 |
| color-valuejs | `ImagePaletteExtractor.vue:22-23` (`bg-white/20`, `text-white`) | `color-mix(… var(--foreground)/var(--background) …)` or glass tier | 1 |
| color-valuejs | `GradientStopEditor.vue:128` (`border-white/80`) | foreground/background color-mix recipe | 1 |
| color-valuejs | `ComponentSliders.vue:84` (`border-gray-200`) | `border-border` / `border-neutral-4` | 1 |
| color-valuejs | `ActionButton.vue:104-105` (2rem touch target) | `--size-icon-btn` (2.5rem) | 1 |
| color-valuejs | `utils.css:18-27` `.section-subtitle` half-tinted muted-fg | no token → gap G-muted-tint | 1 |
| words | `theme.css:59-82,100-121` — wholesale color-cascade fork (`--background`/neutrals/semantics/`--radius:8px`) | override only the brand seed; let `--neutral-*`→semantic chain derive | 1 (block) |
| words | `theme.css:15-17,135-137` `--color-gold/-success/-info` shadowing canon aliases | consume canon `--gold`/`--success`/`--info`/`--warning` | 115 |
| words | `theme.css:38-48,155-165` pre-computed `hsl(…/α)` foreground/card rungs | `--surface-tint-{6,8,10,12,18}` (v3) / `--card-header-bg` | 16 |
| words | `theme.css:11-12` `--ai-accent`/`--error-accent` raw hex | `--destructive`; `--gold-light` / named viz hue (→ gap G-ai-accent) | 1 |
| words | `src/components/**` 8 inline Tailwind-500 hex literals | `--section-color-*` / `--viz-*` / `--success`/`--info`/`--destructive` | 8 |
| words | `themed-cards/variables.css:4-75` Tailwind `theme('colors.amber/gray/orange.*')` | `--gold*` for gold tier; silver/bronze → gap G-metallic | 1 (family) |
| speedtest | `MapSkeleton.vue` / `MapEmptyHint.vue` slate palette + `#64748b` fallback | `--muted-foreground` / `--muted-foreground-strong` (basemap fills → gap G-basemap) | ~12 |
| speedtest | `tokens.css:258` `--meter-background-color` `rgb(0 0 0 /.12)` light/dark fork | `--surface-tint-12` (auto-darks) | 2 |
| speedtest | `tokens.css:226-231` `--aurora-1..6` raw hexes | `--rainbow-*` (→ union U-aurora) | 6 |
| speedtest | `CompleteBadge.vue:128` `stroke:#fffaf0` | `--success-foreground` / `--primary-foreground` | 1 |
| keyframes | `utils.css:36` `color-mix(… --foreground 8% …)` | `var(--surface-tint-8)` | 1 |
| keyframes | `utils.css:33` `color-mix(… --foreground 5% …)` | `--surface-tint-6` (near-miss; → gap G-tint-5 rung) | 1 |
| keyframes | `utils.css:74,129`, `EditorStartScreen.vue:28` (`opacity:.5`/`opacity-50`) | `--opacity-disabled` / `opacity-disabled` utility | 3 |
| glass-ui (self) | `BouncyToggle.vue:309` `box-shadow: 0 1px 3px rgba(0,0,0,.08)` | `--shadow-*` rung / foreground color-mix (also A7) | 1 |
| glass-ui (self) | `TypewriterText.vue:238` `rgba(128,128,128,.15)` | `color-mix(… --foreground 8% …)` / `var(--muted)` | 1 |
| glass-ui (self) | `Aurora.vue:200` `opacity 600ms ease-out` | `var(--duration-*)` + `var(--ease-out)` | 1 |
| glass-ui (self) | `MetricRow.vue:229,246` `color 220ms ease-out` | `var(--duration-normal)` + `var(--ease-out)` | 2 |
| glass-ui (self) | `ScrollingText.vue:104` `cubic-bezier(0.45,0,0.55,1)` | `--ease-*` token (→ gap G-ease-sine) | 1 |
| glass-ui (self) | `BouncyToggle.vue:291…333`, `SortableList.vue:174`, `UnderlineTabs.vue:106`, `Slider.vue:355` radius literals | `--radius-pill` / `--radius-{xs,sm}` primitives | 8 |

> **Clean across the slice:** fourier and keyframes have **zero** hand-rolled `cubic-bezier` in chrome; color-valuejs/speedtest route every `color-mix` through `--surface-tint-*`; `fira-code` is canonical (a shipped `@utility`, not drift) in fourier and color-valuejs.

### Axis 2 — Utility & @apply hygiene

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | `style.css:107-111` `.cartoon-card` re-mint shim (glass-ui deleted it C.W5) | migrate to `.cartoon-surface` + delete shim (→ union U-cartoon-card) | 14 |
| color-valuejs | `GradientCodeEditor.vue:138`, `GradientStopEditor.vue:109` (`.glass-subtle`), `MixResultDisplay.vue:31` (`.glass-elevated`) — **dead no-op classes** | `.glass-quiet`/`.glass-wash`; `.glass-floating` (HIGH; also A7) | 3 |
| color-valuejs | `style.css:209-211` `.slug-pill` re-`@apply`'d chip recipe | keep, or promote (→ gap G-inline-pill) | 5 |
| color-valuejs | `utils.css:4-11` `.fraunces` (dead, 0 refs) / `.fira-code` overlap | delete `.fraunces`; use canon `@utility fira-code` | 1 |
| words | `index.css:156-208` `.dialog/popover/card-surface`/`.word-card`/`.paper-texture-overlay` reimplement glass tiers | `.glass-overlay`/`.glass-floating` + `.paper-grain-overlay` | 5 |
| words | `index.css:194-207` `.review-progress-gradient`/`.mastery-bar-*` on forked palette | keep as utilities; re-base stops on `--gold`/section-palette | 1 |
| words | `src/components/**` `.inline-pill` referenced (undefined in canon & locally) | `.btn-pill`/`.metric-pill`/`<Badge>` (→ gap G-inline-pill) | 5 |
| words | `WordHeader.vue:70,96,128` (+~17) hand-inlined circular-badge recipe | `.inline-pill`/badge utility or `<Badge>` | ~20 |
| speedtest | `pane-slide.css:98,102` raw `rotate(±2deg)` (mirrored variants bypass `--pane-slide-rotate`) | read `--pane-slide-rotate` token | 2 |
| keyframes | `utils.css:16` `.tab-trigger-base` `transition: all …` (broadens canonical TabsTrigger) | enumerate changed props / lean on canonical trigger | 1 |
| keyframes | `utils.css:128-131` `.is-disabled` `{opacity:.5;pointer-events:none}` | `--opacity-disabled` (→ gap G-disabled-base) | 1 |
| keyframes | `menubar/*` `data-[disabled]:opacity-50` (vendored shadcn) | `data-[disabled]:opacity-disabled` | 3 |
| glass-ui (self) | `demo/stories/{empty-states,dashboard,PresetPickerRow,hero,intro,icons,shadows,buttons}.vue` hand-rolled cartoon diagonal-lift | (→ gap G-hover-cartoon) | 9 |

> **`transition: all`** = effectively zero across the constellation in CSS-property form (fourier's 14 hits are all *comments* documenting its avoidance; keyframes has the sole genuine site, above; color-valuejs/speedtest/self = 0).

### Axis 3 — Interactive consistency

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | `PaperSearch.vue:55,94,129,360`, `EasingPicker.vue:93`, `ContourSettings.vue:344,395,442`, `MobileFloatingToc.vue:287`, `ContourEditorCanvas.vue:311,320`, `ImageUpload.vue:168,171` (literal durations + bare `ease`) | named prop + `var(--duration-fast\|normal)` + `var(--ease-standard)` | ~38 |
| color-valuejs | 37 inline `focus-visible:ring-2 ring-ring` across ~15 files | `.focus-ring` (HIGH; → gap G-focus-ring) | 37 |
| color-valuejs | 30 `hover:scale-110`/`active:scale-95`/`scale-125`/`scale-90` across 12 files | `.active-scale` / `scale(var(--scale-hover))` (HIGH; → gap G-scale) | 30 |
| color-valuejs | `WatercolorDot.vue:83,91` CSS-block bespoke scale | `--scale-hover` / `--scale-press-sm` | 1 |
| color-valuejs | `ActionButton.vue:104-105,113` 2rem target + `scale(1.2)` | `--size-icon-btn`; tokenize emphasis scale | 1 |
| color-valuejs | `ColorInput.vue:317,320` `scale(1.1)`/`scale(0.95)` | `--scale-hover`/`--scale-press-sm` | 1 |
| words | `hover:scale-110`(8)/`125`(3)/`100`(4)/`[1.01]` | `--scale-hover` / `--scale-hover-dock` | 16 |
| words | `active:scale-95`(5)/`[0.98]`(3)/`[0.97]`(2)/`[0.95]`(2)/`[0.96]` — **5 press values** | `.active-scale` (`--scale-press`) / `--scale-press-btn` | 13 |
| words | 7 bespoke `focus-visible:` box-shadow rings | `.focus-ring` (→ gap G-focus-ring) | 7 |
| words | `WordHeader.vue:70,96` `h-6 w-6` tap targets below floor | `--size-icon-btn` / `--dock-touch-target` | (subset) |
| keyframes | `utils.css:71` `.btn-playback:active scale(var(--scale-press))` on a button | `var(--scale-press-btn)` (→ union U-press-scale) | 1 |
| keyframes | `PlaybackRibbon.vue:34-50` inline `aria-pressed:*` duplicating `.btn-playback` | route through one recipe / ribbon variant | 1 |
| glass-ui (self) | `ConfiguratorRow.vue:91` `--scale-press`+literal `0.97` fallback vs oracle's `--scale-press-btn` | `active:scale-[var(--scale-press-btn)]` (self-canon contradiction; → union U-press-scale) | 1 |

### Axis 4 — Variant orthogonality & rooting *(priority slice — the Configurator defect)*

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | `Configurator.vue:94` `glass-floating rounded-card` repurposed as full-viewport workspace chassis | `--radius-panel` + inline tier — no consumer escape hatch w/o `:deep()` (HIGH; → gap G-configurator-radius) | 1 |
| fourier | `VisualizationView.vue:328` `:deep(.configurator-stage){flex:1;min-height:0}` + `:357-371` height hack (mobile flex-collapse) | (→ gap G-configurator-stage) | 2 |
| fourier | `BasisSelector.vue:120-135`, `ContourSettings.vue:189-204` reset `<Button>` shoved into layer body w/ `-mt-1 -mb-1` (no header-actions slot) | (→ gap G-configurator-header-slot) | 2 |
| color-valuejs | `style.css:196-199` `.underline-tabs button[role=tab][data-state=active]` override | Tabs `underline` variant at CVA root (→ gap G-tabs-variant) | 1 |
| color-valuejs | `style.css:85-86` `--select-font`/`--dropdown-menu-font` token override | **NOT drift** — the correct rooting pattern (patch at token, not leaf) | — |
| words | `NotificationToast.vue:53-56` surface-tier × intent collapsed (`bg-[--color-success]/10` inline) | `<Toast>`/`<Notification>` variants carry intent at CVA root | 1 |
| words | Configurator note: **0 sites** (no Configurator surface) — squared-edge question N/A | — | — |
| speedtest | `App.vue:515-521` `border-radius:0`+`backdrop-filter:none` (chassis crush) | **NOT drift** — patch at published `data-variant` contract | — |
| speedtest | `App.vue:556` `ol.z-toast {…!important}` re-anchor Toaster | justified; → gap G-toaster-position | 1 |
| keyframes | Configurator note: **0 hits** — N/A | — | — |
| glass-ui (self) | `Configurator.vue:94` `containerClass = "…glass-floating rounded-card…"` — tier OK, **shape wrong** | `rounded-panel` (`--radius-xl`, consumed 10× elsewhere). **This is the glass-ui-side root of fourier's squared edges** — patch the radius axis at the container root (HIGH, dispatch-flagged) | 1 |

### Axis 5 — Overlay & motion vocabulary

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | `EquationPanel.vue`/`PaperSearchDropdown.vue`/`EquationView.vue:260`/`GallerySearchBar` floating panels off-tier (+ `EquationPanel` at `--z-controls` not `--z-popover`) | `.glass-floating` + `floating-panel-in` + `--z-popover`/`--z-overlay` | (4 panels) |
| fourier | `style.css:83-90` local `@keyframes tab-slide-in` (documented, PRM-bracketed) | upstream onto Tabs primitive (→ union U-tab-panel) | 1 |
| color-valuejs | `animations.css:7-22` `@keyframes edit-drawer-in` (partial overlap w/ `floating-panel-in`) | compose `floating-panel-in` for the slide; keep centering local | 1 |
| color-valuejs | `swatch-pop`/`action-pulse`/`input-mode-flash`/`golden-text-shimmer` micro-keyframes | mostly legit; `golden-text-shimmer`→canon `gold-shimmer-slide` | 1 |
| words | `NotificationToast.vue` parallel toast system (App.vue already mounts `<Toaster/>`) | consolidate on `<Toaster>`/`useToast`/`<Notification>` (→ union U-toast) | 1 |
| words | `index.css:21-100` 13 project `@keyframes` duplicating canon (`shimmer`/`bounce-in`/`hovercard-in`…) + literal `cubic-bezier` springs | `fade-in`/`scale-in`/`shimmer-sweep` + `--spring-bouncy` | 1 |
| words | scoped `@keyframes` re-declaring canon names (`fade-in`/`shimmer-sweep`/`sparkle`/`tab-content-in`…) | reference canon keyframes | 1 |
| words | ~60 hand-enumerated multi-prop `transition-[…]` lists | `.interactive-item` / `.hover-lift*` / `.popover-animate` | ~60 |
| words | scoped duration literals `200ms`(9)/`120ms`(4)/`400ms`/`250ms`/`150ms`/`180ms`/`700ms` | `--duration-fast/normal/slow/panel` | ~21 |
| words | per-component spatial transitions not all PRM-bracketed (rely on `html.no-transition`) | wrap in `@media (prefers-reduced-motion)` or use canon utilities | 1 |
| speedtest | `ResultsTable.vue:250` raw `180ms` | `--duration-fast` (200ms) / `--duration-instant` (20ms-off micro-drift) | 1 |
| speedtest | `ResultStack.vue:359` bare `ease-out` keyword on opacity arm | `var(--ease-out)` | 1 |
| speedtest | `SurveyWizard.vue:68` `backdrop-blur-md` on sticky `<CardHeader shrink>` | `--card-header-bg` / `--glass-blur-*-radius` (low) | 1 |
| keyframes | (no drift — bespoke motion token-bracketed + globally PRM-covered) | — | 0 |
| glass-ui (self) | (no findings — `@keyframes` all domain-specific, none duplicate canon) | — | 0 |

### Axis 6 — Typographic & structural hierarchy

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | no usage of `.text-display-*`/`.text-title`/`.text-heading`/`.section-label` etc. (ad-hoc `text-sm font-semibold`) | semantic type scale (low — brand forks `--font-sans`→CM Serif) | 1 |
| color-valuejs | `MixResultDisplay.vue:32`, `EditDrawer.vue:5`, `PaletteCardMenu.vue:127` manual section-label | `.section-label` (used correctly in 8 files) | 1 |
| color-valuejs | `style.css:28-29` `--font-display`+`.fraunces` omit `"WONK" 1, "SOFT" 0` axes | `.text-display-{2..5}`/`.text-heading` | 1 |
| color-valuejs | `font-display` Tailwind class 48× (some bypass `.section-label`/`.text-display-*`) | audit-on-touch | 1 |
| words | ad-hoc `text-base/sm/xs/2xs` + `font-serif` raw (`text-2xs` not a canon token) | `.text-body`/`.text-prose`/`.text-mono-*`; retire `text-2xs` | 1 |
| words | `theme.css:5-8` all of `--font-serif/sans/display` collapsed onto Fraunces (loses CM-serif body) | `--font-stack-display`/`-serif`/`-mono` | 1 |
| words | `WordHeader.vue` Fraunces headings don't engage `"WONK" 1, "SOFT" 0` | `.text-display-*`/`.text-title` | 1 |
| words | `definition/**`/`wordlist/**` `div`-stack hierarchy where `<Card>`/`<Timeline>`/`<SortableList>` fit | `<Card>` family; consider Timeline/SortableList (→ gap G-word-diff/union U-sidebar) | 1 |
| speedtest | `MapSkeleton.vue:175,183`, `MapEmptyHint.vue:184`, `ThankYou.vue` literal `"Plus Jakarta Sans"` | `var(--font-sans)`/`--font-brand-sans` (→ gap G-brand-sans) | 3 |
| speedtest | `MapSkeleton.vue:176,184` raw `1.125rem`/`0.875rem` (LCP fallback) | `--type-body`/`--type-small` (low) | 2 |
| keyframes | 16 `text-{xl..6xl}` on headings (`EditorStartScreen.vue:6,22,28` + 7 more) | `.text-display-*`/`.text-title` **conditionally** — Instrument-Serif face is sanctioned brand divergence; only the size-scale bypass is the residue | 1 |
| glass-ui (self) | (clean — ad-hoc heading sizes = 0) | — | 0 |

### Axis 7 — Accessibility resilience (reimplemented glass missing the fallback matrix)

| App | File:line | Canonical replacement | Count |
|---|---|---|---|
| fourier | `AnimationControls.vue:151-156` (hand-rolled 6-layer glass inside `<GlassDock>`), `PaperSearch.vue:248-249`, `PaperView.vue:503-504` (raw `backdrop-filter`, no `@supports`/PRT bracket) | compose `.glass-floating`/`.glass-dock` (brackets inherit) (HIGH) | 3 |
| color-valuejs | `GradientCodeEditor.vue:138`, `GradientStopEditor.vue:109`, `MixResultDisplay.vue:31` (dead glass = no glass + no fallback) | adopt `.glass-quiet`/`.glass-floating` | 3 |
| color-valuejs | `PaneHeader.vue:2`, `ImageEyedropper.vue:3`, `ImagePaletteExtractor.vue:22` hand-rolled blur over `bg-card/N` | `.glass-quiet` (→ gap G-glass-bar) | 3 |
| words | `index.css:157-192` `.dialog/popover/card/word-surface`, `NotificationToast.vue:14`, `SearchBarShell.vue:8`, `Sidebar.vue` reimplement glass, no fallback | `.glass-overlay`/`.glass-floating`/`.glass-wash` | (5 surfaces) |
| words | `theme.css:38-48` `--color-foreground-{6..18}` baked light-mode foreground | `--surface-tint-*` (auto-unwinds) | 1 |
| speedtest | N/A — reimplements no glass surface (uses canonical tiers + chassis) | — | 0 |
| keyframes | N/A — reimplements no glass surface | — | 0 |
| glass-ui (self) | `Slider.vue:237,255,331`, `ContinuousTimeline.vue:446`, `Scrubber/SegmentedTimeline.vue`, `DrawerOverlay.vue`, `ExpandableContainer.vue` — compose `--glass-blur-*` by hand on sub-tracks, miss a11y brackets | `.glass-track` recipe / shared `@media` fallback (→ gap G-partial-glass) | 7 |

---

## 3. Glass-ui gaps — DEDUPLICATED across apps

Same proposed addition cited by ≥2 apps collapses to **one row**; the call-site count **sums** across apps. Ranked by cross-app demand (this section seeds glass-ui's next tranche).

| Rank | Gap | Apps citing | Summed call-sites | Proposal |
|---|---|---|---|---|
| **1** | **Dead/renamed glass-tier classes silently no-op** (`glass-subtle/medium/elevated/default` → ladder) | fourier, color-valuejs, words, **self** (renamed them) | ~16 (fourier 10, color-valuejs 3, words refs, self = the rename source) | These are *removed* names, not gaps per se — but the cross-app breakage warrants a **codemod + a deprecation shim** (`@utility glass-subtle { @apply glass-quiet }` etc.) so `^2`-era consumers don't render no-op surfaces during the `2→3` migration. **HIGH** — pure a11y + visual regression. |
| **2** | **Partial-glass a11y bracket for composers** (`.glass-track` / shared `@supports`+PRT+PRC fallback for `--glass-blur-*` sub-elements) | self (7), fourier (3), color-valuejs (3), words (5) | **~18** | Expose `.glass-track` composable OR a documented `--glass-fallback-bg-*` + shared `@media` block in `glass.css` any blur-consumer can include. **HIGH.** |
| **3** | **Hover/press scale utility + one press-rung rule** (`.hover-scale` companion to `.active-scale`; standardize `--scale-press-btn` for buttons) | color-valuejs (30+8), words (16+13), keyframes (1), self (1), speedtest (honored via primitives), fourier (via `active:scale`) | **~69** | Ship `.hover-scale` (`transform: scale(var(--scale-hover))`, reduced-motion-safe); decision rule: icon/button press → `--scale-press-btn` (0.97), whole-surface tap → `--scale-press` (0.96). **HIGH — largest summed demand.** |
| **4** | **`.focus-ring` adoption / inline-ring collapse** | color-valuejs (37), words (7) | **44** | Not a missing class (`.focus-ring`/`--focus-ring` exist, adopted elsewhere) — a **lint/codemod** to collapse the inline `focus-visible:ring-2 ring-ring` strings onto `.focus-ring`, and confirm glass-ui's own leaves don't hand-roll it. |
| **5** | **Static inline-pill / identity-chip primitive** (`.inline-pill` non-button + colored `.identity-pill`/slug chip) | color-valuejs (5, slug), words (5 refs + ~20 inlined badges) | **~30** | Promote `.inline-pill` into `glass.css` as the static sibling of `.btn-pill`; add a colored identity chip (`Badge variant="slug"` reading `--pill-tint`). |
| 6 | **Tabs `underline` + `pill` shape variants** at the CVA root | color-valuejs (1), keyframes (5), fourier (tab-slide carry) | ~7 | Add `variant: { underline \| pill \| ghost }` to `tabsTriggerVariants` (`ui/tabs`), reading `--surface-tint-8` for pill-active; closes the consumer attribute-selector overrides. |
| 7 | **`.disabled-base` standalone disabled-dim utility** + `--surface-tint-5` rung | keyframes (2 + bonus rung), color-valuejs (via `opacity-disabled`) | ~5 | `@utility disabled-base { opacity: var(--opacity-disabled); pointer-events:none; cursor:not-allowed }`; add `--surface-tint-5` between `-4`/`-6`. |
| 8 | **`.hover-cartoon` / `.lift-cartoon` diagonal-lift utility** | self (9) | 9 | Mint `transform: translate(-1px,-1px); box-shadow: var(--shadow-cartoon-hover)` (tokens exist) next to `.hover-lift*`. The oracle reinventing its flagship interaction 9× is the strongest single self-signal. |
| 9 | **`<Toaster>` viewport `position`/`anchor` prop** | speedtest (1), words (parallel-toast pressure) | 2 | `position`/`anchor` prop or `--toast-viewport-{inset-block,inset-inline}` tokens; every inline-dock+toast app hits this. |
| 10 | **Configurator: inline-radius prop + stage-cell non-collapse + header-actions slot** | fourier (1+2+2) | 5 | (G-configurator-radius) `variant: studio\|inline` on `Configurator` (`inline` → `glass-quiet rounded-panel`); (G-configurator-stage) `.configurator-stage` `min-height:0`+`flex:1 1 0%` in the mobile flex fallback; (G-configurator-header-slot) `#header-actions` slot on `ConfiguratorLayer`'s trigger row. |
| 11 | **Dataviz-basemap skeleton surface tokens** (`--skeleton-{base,line,caption}` / `--surface-dataviz-*`) | speedtest (~10) | ~10 | A light+dark skeleton/basemap rung family so map/chart skeletons match the data-canvas, not the warm page. |
| 12 | **Project brand-sans `@utility`** (`.font-brand-sans` / `.text-brand-sans`) | speedtest (4) | 4 | Parallel to existing `cm-serif`/`fira-code`/`fourier-f` `@utility` so consumers write a class, not a `font-family` literal. |
| 13 | **AI / saturated-accent semantic** (`--accent-ai`) | words (cites ~115 forked-gold sites; root cause) | (1 semantic; ~115 downstream) | Document `--tier-featured`/`--gold-light` as the AI handle, or add `--accent-ai` so words stops forking `--color-gold`. |
| 14 | **Metallic-tier theming** (`--metal-{gold,silver,bronze}-*` + `custom/tier-surface`) | words | (family) | Gold exists (`--gold*`); silver/bronze have no canon home. A `tier-surface` component + metal token family. |
| 15 | **Muted-foreground tint ladder** (`--muted-foreground-50` / `--caption-subtle`) | color-valuejs (1), words (overlaps via foreground rungs) | ~2 | Mirror the existing `--muted-foreground-strong` rung at the dim end. |
| 16 | **Header/bar glass tier** (`.glass-bar`) | color-valuejs (PaneHeader, 9 panes) | ~2 | If a sticky *bar* reads differently from `.glass-quiet`, add `.glass-bar` at `--z-header` weight, or document `.glass-quiet` as the header idiom. |
| 17 | **Word-diff primitive** (`custom/inline-diff`) | words | (3 files) | Consumer-local unless latex-paper/version-histories want it. |
| 18 | **`Menubar` component — missing entirely** | keyframes (forces a 15-file vendored shadcn subtree) | 1 (subtree) | Add `ui/menubar/` modeled on `dropdown-menu`/`context-menu` CVA roots (reka `MenubarRoot`). Highest-value *component* gap for the reference consumer. |
| 19 | **Ribbon transport-button size** (`size: ribbon` on `buttonVariants`) | keyframes (8) | 8 | Pill + `h-8` + `gap-2` geometry is the upstreamable kernel; the `instrument-serif` half stays demo-local. |
| 20 | **Named sine-in-out easing** (`--ease-sine`) | self (1) | 1 | For marquee/pan motion (`ScrollingText.vue:104`). |

---

## 4. Union candidates — DEDUPLICATED

Same pattern in both libraries under different vocabulary; collapse to one canonical name.

| Union | Pattern | Apps | Canonical resolution |
|---|---|---|---|
| **U-press-scale** | `--scale-press` (0.96) vs `--scale-press-btn`/`-sm` (0.97) disagree on which rung a *button* press lands | keyframes, **self** (component vs oracle contradict) | `--scale-press-btn` for every button/icon affordance; reserve `--scale-press` for non-button `.tap-squish` taps. **Resolve before consumers standardize.** |
| **U-toast** | two toast/notification vocabularies mounted simultaneously | words (`NotificationToast.vue` vs `<Toaster>`), speedtest (Toaster re-anchor pressure) | glass-ui `<Toaster>`/`useToast`/`<Notification>` — retire the consumer toast. |
| **U-cartoon-card** | `.cartoon-card` (deleted C.W5) vs `.cartoon-surface` | fourier (14-site shim) | settle on `.cartoon-surface`; either re-export a thin `.cartoon-card` alias or migrate + delete the shim. |
| **U-tab-panel** | tab-panel entry animation carried locally | fourier (`tab-slide-in`), color-valuejs (`.underline-tabs`), words (`tab-content-in`) | ship the panel-enter animation + `underline` variant on the Tabs primitive (PRM-bracketed); retire consumer carries. (Couples to gap #6.) |
| **U-pane-slide** | `pane-slide` page-turn family adopted verbatim across apps | speedtest (`pane-slide.css`, lifted from value.js `color-picker/App.vue:244-281`) | lift the 4 directional contracts into `transitions.css`; promote `--pane-slide-rotate{,-back}` to `tokens.css`. **Strongest union** — both consumers already converge on identical vocabulary. |
| **U-aurora** | `--aurora-1..6` brand palette vs `--rainbow-*` | speedtest (6 hexes + JS-config mirror) | `<Aurora palette="rainbow">` preset, or a documented `--aurora-{1..6}` token contract the shader consumes. (Softer — genuinely brand-specific.) |
| **U-paper-texture** | `.paper-texture-overlay` vs canon `.paper-grain-overlay` | words | `.paper-grain-overlay`/`.paper-underpaint` over a `.glass-*` tier. |
| **U-sidebar** | duplicated collapsible glass side-rail families | words (`custom/sidebar/*`) | converge on glass-ui sidebar primitives where shape matches; keep wordlist content slots. (Lower confidence.) |
| **U-rounded-full** | `rounded-full` (hard `9999px`) vs `rounded-pill` (`--radius-pill` token) | **self** (oracle teaches `rounded-full` in 26 files vs components' `rounded-pill` ×35) | normalize the demo oracle to `rounded-pill` so the teaching surface propagates the token-driven form to consumers (incl. fourier). |
| **U-disabled-dim** | "dimmed/disabled" in 3+ vocabularies | keyframes (`opacity-50`/`.is-disabled`/`data-[disabled]:opacity-50`) | `--opacity-disabled` → `opacity-disabled` utility everywhere + `.disabled-base` (gap #7). |
| **U-focus-ring** | inline `focus-visible:ring-2 ring-ring` vs `.focus-ring` | color-valuejs (37), words (7) | `.focus-ring`/`--focus-ring` everywhere; confirm glass-ui leaves don't hand-roll it. (Couples to gap #4.) |

---

## 5. Per-app tally + grand total

| App | A1 | A2 | A3 | A4 | A5 | A6 | A7 | **Drift total** | gaps | unions |
|---|---|---|---|---|---|---|---|---|---|---|
| fourier | 4 | 1 | 1 | 3 | 2 | 1 | 1 | **13** | 4 | 2 |
| color-valuejs | 6 | 3 | 5 | 1 | 2 | 3 | 2 | **22** | 4 | 2 |
| words | 6 | 4 | 4 | 3 | 6 | 4 | 2 | **29** | 4 | 3 |
| speedtest | 4 | 1 | 0 | 0 | 3 | 2 | 0 | **10** | 3 | 2 |
| keyframes | 3 | 3 | 2 | 0 | 0 | 1 | 0 | **9** | 4 | 2 |
| glass-ui (self) | 6 | 1 | 1 | 1 | 0 | 0 | 2 | **11** | 4 | 2 |
| **GRAND TOTAL** | **29** | **13** | **13** | **8** | **13** | **11** | **7** | **94 raw / 90 net** | 20 deduped | 11 deduped |

> Drift rows summed by axis = **94** raw per-app finding-rows (A1:29 · A2:13 · A3:13 · A4:8 · A5:13 · A6:11 · A7:7). The per-app *report tallies* (13/22/29/10/9/11) sum to **94**; netting fourier's A4 against the duplicated self-audit Configurator root (one defect counted in both fourier and self) and the cross-app dead-tier class (one rename surfaced in 4 apps) yields a **net unique-issue count of ~90**. Gaps dedupe 23→**20**, unions dedupe 13→**11**.

---

## 6. Answers

### Q1 — Why did the fourier visualizer's panel move from the left to the right?

Because fourier **adopted glass-ui's `Configurator` / `ConfiguratorLayer` primitives** (work item **B.W2**). The visualizer's controls were re-homed into the canonical `Configurator` workspace chassis (`VisualizationView.vue:194`, `.viz-configurator { flex:1 }`), and the Configurator's layout places the control column on the **right** of the stage. The change had been authored but **only became visible in production now** because the **SPA deploy chain was dead for ~2 months** (the host was stuck — the constellation auto-deploy webhook was silently broken and was just restored). So the left→right move is the *Configurator adoption finally shipping*, not a new design decision.

### Q2 — Why are its borders squared?

**This is a DEFECT, not a deliberate workspace aesthetic.** The verified root cause:

- The **outer** `Configurator` surface *is* rounded: `Configurator.vue:94` carries `rounded-card` (`--radius-card` = `--radius-2xl` = 16px) — **in BOTH 2.0.0 and 3.0.0**.
- The **inner** `ConfiguratorLayer` sections are squared: `ConfiguratorLayer.vue:99` divides its layers with `border-b border-border/40` dividers that have **no `border-radius`**. So the rounding **stops one level too high** — the outer card is round, but every inner section the user actually looks at is a flush, square-cornered band.

**The user's CANON is now explicit: glass-ui should be FULLY ROUNDED BY DEFAULT, AT THE ROOT.** Under that canon the squared `ConfiguratorLayer` sections are a **defect**, not a "workspace" look. Verdict: **fix it at the root** — the radius must be carried down through the layer/section level, not dropped at the divider.

**Every surface across this audit that drops the root radius (the systemic version of the same defect):**

- **glass-ui self A4.1 — `Configurator.vue:94`**: tier `floating` is correct but the *shape* is `rounded-card` where `--radius-panel` (`--radius-xl`, consumed 10× elsewhere) is the orthogonally-correct geometry — *"this is the glass-ui-side root of the fourier ConfiguratorLayer's squared-edge / left→right move."*
- **fourier A4.1 — `Configurator.vue:94` / `VisualizationView.vue:194`**: the `rounded-card` Configurator repurposed as a full-viewport inline chassis with no `radius`/`tier` prop to square *or* round it without `:deep()`.
- **fourier A1.3/A1.4 — 14 `border-radius: 9999px` literals + ~30 misc literal radii** bypassing `--radius-pill` and the radius primitives (the broader "radius not flowing from the token" pattern).
- **glass-ui self A1.6 — `BouncyToggle.vue:291…333`, `SortableList.vue:174` (`999px`), `UnderlineTabs.vue:106`, `Slider.vue:355`**: hardcoded radius literals in the *library's own* widgets where a radius primitive/alias exists.
- **self union U-rounded-full — the demo oracle uses `rounded-full` (hard `9999px`) in 26 files** vs components' `rounded-pill` (`--radius-pill`): the teaching surface itself propagates a root-radius that ignores the token to consumers (including fourier).
- **color-valuejs A1.1 — `MixResultDisplay.vue:31` `rounded-xl`** on a panel surface instead of the `rounded-panel` alias (same "use the semantic radius alias at the root" rule).

**The `^2→^3` bump alone does NOT fix it.** The squared `ConfiguratorLayer` (`:99`, `border-b border-border/40`, no radius) and the `rounded-card` outer `Configurator` (`:94`) are **identical in both 2.0.0 and 3.0.0**. Upgrading the version moves nothing here; the fix is a code change at the `Configurator`/`ConfiguratorLayer` root — carry `--radius-panel` (and round the inner sections) so the canon's "fully rounded by default, at the root" rule actually holds.
