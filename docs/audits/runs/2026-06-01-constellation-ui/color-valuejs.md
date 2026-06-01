# Style Audit — color-valuejs (color.babb.dev) vs glass-ui canon

**Target frontend:** `/Users/mkbabb/Programming/value.js/demo/color-picker/` (the deployed color.babb.dev app), with its component tree under `demo/@/components/custom/**`, re-export barrels under `demo/@/components/ui/**`, and demo-local styles under `demo/@/styles/{style,utils,animations}.css`. `demo/hero-lab/` is a **separate** hero-design playground app (its own `App.vue` + `vite` root) and is treated as out-of-scope for color.babb.dev drift (noted where its raw literals appear).

**glass-ui consumed:** `@mkbabb/glass-ui` **v3.0.0** via `file:../glass-ui` (repo HEAD `21547de`, tag `am-close-44-g21547de`). 61 import sites; the consumer correctly re-exports `Button/buttonVariants`, `Card`, `Dialog`, `Popover`, `Tooltip`, `DropdownMenu`, `Input` (from `/forms`), `DockIconButton` (from `/dock`), `useAurora` (from `/aurora`), etc.

**Headline:** This is a **disciplined** consumer — zero `transition: all` (CSS-property form), zero hand-rolled `cubic-bezier`/spring strings, zero inline `ms`/`s` duration literals, zero `:deep()` against reka internals (the only two mentions are comments documenting their *avoidance*), zero ad-hoc heading `text-{xl..5xl}` sizes, transitions consistently composed from `var(--duration-*)` + `var(--ease-*)`, a global `prefers-reduced-motion` guard, and heavy adoption of `text-mono-*` (39 files), semantic radius aliases (`rounded-input`/`-card`/`-panel`/`-button`/`-badge`/`-dialog`), and semantic z (`z-popover`/`z-dock`/`z-header`). The real drift is concentrated in three seams: **(1) two glass-tier class names that no longer exist in v3.0.0 and now render as silent no-ops**, **(2) the focus-ring + active/hover-scale recipe reinvented inline ~37+30 times instead of `.focus-ring` + `--scale-*`**, and **(3) a handful of hand-rolled glass header/blur surfaces.**

---

## Axis 1 — Token alignment

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| 1.1 | `MixResultDisplay.vue:31` | `rounded-xl` on a result *panel* surface | `rounded-panel` (both → `--radius-xl`; semantic alias is the rule for a panel tier) — `tokens.css §Radius` |
| 1.2 | `image-palette-extractor/ImagePaletteExtractor.vue:22-23` | `bg-white/20 hover:bg-white/40` + `text-white` raw white literal on a capture button (note: over a video frame, so a fixed white is defensible, but it bakes light-only color the dark cascade can't unwind) | `color-mix(in srgb, var(--foreground)/var(--background) N%, transparent)` recipe, or a glass tier (`tokens.css §Surface-tint`) |
| 1.3 | `gradient/GradientStopEditor.vue:128` | `border-white/80` raw white on a gradient stop ring | foreground/background color-mix recipe |
| 1.4 | `color-picker/controls/ComponentSliders.vue:84` | `border-gray-200` — a non-neutral Tailwind gray that does not step the `--neutral-{0..5}` body ladder | `border-border` / `border-neutral-4` (`tokens.css §Color/neutral`) |
| 1.5 | `color-picker/controls/ActionButton.vue:104-105` | `.action-button-wrapper { width: 2rem; height: 2rem }` literal touch target | `--size-icon-btn` (2.5rem) — also an axis-3 touch-target concern |
| 1.6 | `utils.css:18-27` `.section-subtitle` `color: color-mix(... var(--muted-foreground) 50% ...)` | half-tinted muted-foreground baked inline (recurs as `section-subtitle` consumer class) | no named token exists → see **Glass-ui gaps G1** |

> Not flagged (verified correct): all `transition:` declarations in custom `<style>` blocks read `var(--duration-*)` + `var(--ease-*)` (e.g. `GradientCodeEditor.vue:141`, `WatercolorDot.vue:70`, `ImageEyedropper.vue:241`), `--shadow-cartoon`/`--shadow-card` overrides in `style.css:78-81` route through the cartoon token language by design, and the demo-local layout tokens (`--dock-*`, `--app-padding-x`) are documented project overrides.

## Axis 2 — Utility & @apply hygiene

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| **2.1 (HIGH)** | `gradient/GradientCodeEditor.vue:138`, `gradient/GradientStopEditor.vue:109` (`.glass-subtle`); `mix/MixResultDisplay.vue:31` (`.glass-elevated`) | **Dead classes.** v3.0.0 ships the tier ladder `.glass-{wash,quiet,resting,floating,overlay}` + `.glass-{card,pill,btn}` (verified in the resolved `node_modules/@mkbabb/glass-ui/src/styles/glass.css` and `dist/glass-ui.css`). `.glass-subtle`/`.glass-elevated`/`.glass-default`/`.glass-medium` exist **only** in glass-ui historical CHANGELOG/docs — they are NOT defined utilities. These three surfaces therefore render with **no background, no border, no backdrop-filter, no shadow** (silent no-op). | `.glass-subtle` → `.glass-quiet` or `.glass-wash`; `.glass-elevated` → `.glass-floating` (`glass.css:40,56,64`). This is also an Axis-7 finding (no glass + no fallback). |
| 2.2 | `style.css:209-211` `.slug-pill { @apply text-mono-small font-bold px-2 py-0.5 rounded-full border }` | A 5-site repeated chip recipe re-`@apply`'d in the consumer; glass-ui ships `.inline-pill`/`.code-badge`/`.kbd` and a `--radius-badge` shape but no exact "slug chip" | keep as consumer utility, OR promote — see **Glass-ui gaps G2** |
| 2.3 | `utils.css:4-11` `.fraunces` / `.fira-code` font-family helpers | `.fraunces` is defined but referenced **0×** in components (dead); `.fira-code` overlaps glass-ui's `@utility fira-code`. `.fraunces` also omits the WONK/SOFT axes (see Axis 6) | delete `.fraunces`; use `@utility fira-code` from canon or the `text-mono-*` family |

## Axis 3 — Interactive consistency

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| **3.1 (HIGH)** | 37 inline occurrences of `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring[/40]` across ~15 files (e.g. `MixSourceSelector.vue:133,144`, `ActionButton.vue:14`, `EditDrawer.vue:27`, `GradientCodeEditor.vue:138`, `ComponentSliders.vue:84`, `GradientStopEditor.vue:124`) | The `.focus-ring` recipe (`--focus-ring` token, `tokens.css:925-928`) hand-rolled inline. The consumer *does* use `.focus-ring` correctly in only 2 files (`SearchFilterBar.vue:76`, `ProfileSection.vue:42,83`) — proving the canon class is available and adopted-elsewhere, so the 37 inline reinventions are pure drift. | `.focus-ring` (and drop the redundant `focus-visible:ring-2 focus-visible:ring-primary` that `ProfileSection.vue:83` stacks *on top of* `.focus-ring`) |
| **3.2 (HIGH)** | 30 occurrences of `hover:scale-110` / `active:scale-95` / `hover:scale-125` / `active:scale-90` across 12 files (e.g. `PaletteCardSwatches.vue:14,44,51,58`, `CurrentPaletteEditor.vue:45-83`, `EditDrawer.vue:27,44`, `PaletteSlugBar.vue:72,83`) | Bespoke Tailwind scale literals where the canon defines `--scale-hover` (1.08), `--scale-press` (0.96), `--scale-press-sm` (0.97) plus the `.active-scale` utility. `scale-95`=0.95 ≠ the canon press value (0.96/0.97); `scale-110`=1.10 ≠ `--scale-hover` (1.08). | `.active-scale` for press; `transform: scale(var(--scale-hover))` for hover, or a glass-ui hover-scale utility (see **Union U1**) |
| 3.3 | `watercolor-dot/WatercolorDot.vue:83,91` | `:hover { transform: scale(1.06) }` / `:active { transform: scale(0.97) }` — CSS-block bespoke scale | `var(--scale-hover)` (1.08) / `var(--scale-press-sm)` (0.97) |
| 3.4 | `color-picker/controls/ActionButton.vue:104-105,113` | 2rem touch target (< `--size-icon-btn` 2.5rem) + `:hover { transform: scale(1.2) }` (an intentional larger emphasis, but still a magic number) | `--size-icon-btn`; tokenize the emphasis scale or accept as a documented one-off |
| 3.5 | `color-picker/controls/ColorInput.vue:317,320` | `:hover scale(1.1)` / `:active scale(0.95)` (with `translateY(-50%)` keep) | `--scale-hover` / `--scale-press-sm` composed with the translate |

## Axis 4 — Variant orthogonality & rooting

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| 4.1 | `style.css:196-199` `.underline-tabs button[role="tab"][data-state="active"]` | A consumer-side override of a reka-ui Tabs attribute selector — the file's own MARKER comment states it is "retired once glass-ui ships a Tabs `underline` variant." This is the textbook "missing variant at the CVA root" signal. | Add an `underline` variant to glass-ui's `Tabs` CVA — see **Glass-ui gaps G3** |
| 4.2 | `style.css:85-86` `--select-font`/`--dropdown-menu-font: var(--font-mono)` | Consumer overrides glass-ui Select/Dropdown trigger font via project tokens (the clean rooting path — patches at the token, not the leaf). **Not drift** — recorded as the *correct* pattern other axes should imitate. | — |

> The dispatch-flagged "squared ConfiguratorLayer edges / left→right panel move / `--radius-panel`" instance is **fourier-specific** and has **no analogue in value.js** (`grep -ri configurator` → only `ConfigSliderPane.vue`/`AuroraPane.vue`, no squared-edge surface). Nothing to flag here for this target.

## Axis 5 — Overlay & motion vocabulary

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| 5.1 | `animations.css:7-22` `@keyframes edit-drawer-in` (+ mobile media override); used at `EditDrawer.vue:112` | A custom translateX(-100%)+translateY(-50%) slide-entrance that partially overlaps glass-ui's `floating-panel-in` / `slide-up` geometry. The translateY(-50%) vertical-centering is the genuinely-bespoke part, so a clean swap isn't 1:1 — but the *desktop* slide overlaps canon. | Compose `floating-panel-in` (`glass-ui/animations.css`) for the slide; keep the centering as a transform-origin/position concern. Low priority. |
| 5.2 | `ImageEyedropper.vue:289` `swatch-pop`, `ActionButton.vue:123-130` `action-pulse`/`action-spin`, `ColorInput.vue:294,367` `input-mode-flash`/`crown-appear`, `PaletteCard.vue:353` `golden-text-shimmer` | Component-local micro-event keyframes; `golden-text-shimmer` duplicates canon `shimmer`/`gold-shimmer-slide`, the scale-pulses partially duplicate `scale-in`. | Mostly legitimate micro-events; `golden-text-shimmer` → canon `gold-shimmer-slide` if the gradient sweep matches. |

> Spatial-motion `prefers-reduced-motion` bracketing is satisfied **centrally** by `animations.css:32-60` (global guard + a deliberate overlay-fade carve-out), so per-component absence of the guard is **not** a finding. `z`+tier+Transition composition for Dialog/Popover/Tooltip/HoverCard/DropdownMenu flows through the glass-ui re-exports (the `ui/*/index.ts` barrels), which carry the canonical overlay vocabulary internally — not reimplemented here.

## Axis 6 — Typographic & structural hierarchy

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| 6.1 | `MixResultDisplay.vue:32`, `EditDrawer.vue:5`, `PaletteCardMenu.vue:127` | Manual section-label reinvention: `uppercase tracking-wide[r] text-muted-foreground` on `font-display`/`text-mono-small`/`text-mono-caption` spans — exactly the `.section-label` recipe (`font-mono` + `--type-caption` + `uppercase` + `--type-tracking-caps` + `--muted-foreground`, `typography.css:433-439`) | `.section-label` (the consumer already uses it correctly in 8 files) |
| 6.2 | `style.css:28-29` `--font-display: "Fraunces", serif` + `.fraunces` helper (`utils.css:4-7`) | Display font alias omits the canonical `font-variation-settings: "WONK" 1, "SOFT" 0` that `.text-display-*` apply (`typography.css:98,158`). Any element styled `font-display` (48 Tailwind-class sites) instead of `.text-display-*` renders Fraunces **without** its ornamental axes. | Use `.text-display-{2..5}`/`text-heading` for display headings; reserve the bare `font-display` family key only where a `.text-display-*` size doesn't fit, and add the variation-settings there |
| 6.3 | `font-display` used as a Tailwind class **48×** | Many are legitimate (display font on a sized heading), but where it labels captions/results it bypasses `.section-label`/`.text-display-*` | audit-on-touch; pair with 6.1/6.2 |

## Axis 7 — Accessibility resilience

| # | Site(s) | Drift | Canonical replacement |
|---|---------|-------|----------------------|
| **7.1** | `gradient/GradientCodeEditor.vue:138`, `gradient/GradientStopEditor.vue:109`, `mix/MixResultDisplay.vue:31` | The dead `.glass-subtle`/`.glass-elevated` classes (2.1) mean these surfaces have **no** `@supports not(backdrop-filter)` / `prefers-reduced-transparency` / `prefers-contrast:more` fallback — because they have no glass at all. Switching to a canonical tier (2.1) fixes this automatically (the tiers ship the fallback matrix). | adopt `.glass-quiet`/`.glass-floating` |
| 7.2 | `panes/PaneHeader.vue:2` (`backdrop-blur-md bg-card/60`), `image-palette-extractor/ImageEyedropper.vue:3` (`bg-card/75 backdrop-blur-sm`), `ImagePaletteExtractor.vue:22` (`backdrop-blur-sm`) | Hand-rolled glass surfaces (Tailwind blur over a translucent `bg-card/N`) that **reimplement** a glass effect without the canonical fallback matrix. These are thin/decorative (not modal chrome), so the severity is moderate, but a sticky pane header reading `bg-card/60` collapses to a near-invisible wash under `prefers-reduced-transparency`. | `.glass-quiet` (header/bar weight) — or, if the canon lacks a "header/bar" tier, see **Glass-ui gaps G4** |
| — | `color-picker/visual/{PointerDebugOverlay,DebugEventLog}.vue` raw `rgba()`/`#hex` (≈22 literals) | **Not flagged as drift.** These are dev-only debug overlays gated behind `v-if="debug.state.enabled"` (`PointerDebugOverlay.vue:4`) and never ship to users. `SpectrumCanvas.vue:234-235` rgba is Canvas-2D `fillStyle` (must be string, not CSS var). `hero-lab/**` rgba is the separate playground app. | (no action) |

---

## Glass-ui gaps (patterns the target legitimately needs)

- **G1 — Muted-foreground tint rungs.** `utils.css:21` and the `--shadow-color`/various `color-mix(... var(--muted-foreground) 50% ...)` half-tints are hand-recipied. The canon ships `--surface-tint-*` (foreground-over-transparent) and a foreground-tint ladder, but **no `--muted-foreground` opacity ladder**. The consumer needs a dimmed-caption rung. *Propose:* add `--muted-foreground-50` (or a `--caption-subtle` semantic alias) to `tokens.css §Color/neutral`, mirroring the `--muted-foreground-strong` (`--neutral-6`) rung that already exists. Call sites: `utils.css:18-27` `.section-subtitle` (consumed by gradient/mix/generate control bars).

- **G2 — Slug/identity chip primitive.** `style.css:209-211 .slug-pill` (`text-mono-small font-bold px-2 py-0.5 rounded-full border`, per-instance `color`/`border-color` via `:style`) is repeated across dock menus, the admin users panel, and the slug bar (≥5 sites per the comment). The canon has `.code-badge`/`.kbd`/`.inline-pill` + `--radius-badge` but no colored identity chip. *Propose:* a `.identity-pill` (or `Badge` `variant="slug"`) in glass-ui `cards.css`/`Badge` CVA that reads a `--pill-tint` custom property.

- **G3 — Tabs `underline` variant.** `style.css:196-199` overrides a reka Tabs `[data-state="active"]` attribute selector to draw an active underline; the file itself flags this as awaiting a glass-ui `Tabs` `underline` variant. *Propose:* add `variant: { underline }` to glass-ui's `Tabs`/`TabsTrigger` CVA root (`components/ui/tabs`), driven by a `--tabs-underline-color` token, so the consumer drops the `:deep`-style attribute override.

- **G4 — Header/bar glass tier.** `PaneHeader.vue:2` needs a sticky-header glass at the `--z-header` weight; the closest canon tier is `.glass-quiet` (resting weight). If the visual intent (a *bar*, not a panel) reads differently from `.glass-quiet`, *propose* a `.glass-bar` tier (or document `.glass-quiet` as the header idiom in `DESIGN.md`). Call sites: `PaneHeader.vue:2` (9 sibling panes), `ImageEyedropper.vue:3`.

---

## Union candidates (same pattern, both libraries, different vocabulary)

- **U1 — hover/press scale utility.** The consumer reinvents `hover:scale-110`/`active:scale-95` 30× (Axis 3.2) while glass-ui defines `--scale-hover`/`--scale-press*` tokens + `.active-scale` but **no `.hover-scale` utility companion** to `.active-scale`. *Canonical:* glass-ui should ship a `.hover-scale` (`@utility`, `transform: scale(var(--scale-hover))` on `:hover`, reduced-motion-safe) to pair with `.active-scale`; both libraries then use one named class instead of Tailwind scale literals. The fourier visualizer almost certainly has the same `active:scale-95` pattern — worth a constellation-wide sweep.

- **U2 — focus-ring spelling.** Both the consumer's 37 inline `focus-visible:ring-2 ring-ring` strings and any glass-ui leaf that spells the ring manually should collapse onto the single `.focus-ring` class / `--focus-ring` token (`tokens.css:925-928`). Canonical = `.focus-ring`; the audit should confirm glass-ui's own components don't also hand-roll it.

---

**Tally:** Axis 1: 6 · Axis 2: 3 · Axis 3: 5 · Axis 4: 1 (+1 correct-pattern note) · Axis 5: 2 · Axis 6: 3 · Axis 7: 2 (debug/canvas/hero-lab literals excluded) = **22 drift rows** (2 HIGH in Axis 2/3: dead glass-tier classes + the 37×/30× focus-ring/scale reinventions). Glass-ui gaps: **4** (G1–G4). Union candidates: **2** (U1–U2). Net: a high-discipline consumer whose drift is concentrated, fixable, and partly caused by **two glass-tier class names that were renamed out of glass-ui v3.0.0** and now silently no-op.
