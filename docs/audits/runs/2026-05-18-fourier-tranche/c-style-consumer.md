# C — Style Audit (Consumer slice): `fourier-analysis/web`

**Target:** `/Users/mkbabb/Programming/fourier-analysis/web` · **Canon:** `glass-ui` v1.8.5
**Date:** 2026-05-18 · **Mode:** read-only

## Preamble

The consumer carries four hand-authored CSS files (`style.css` 8L, `styles/fourier-overrides.css` 354L, `styles/buttons.css` 216L, `styles/ios-fixes.css` 35L) layered atop `@import "@mkbabb/glass-ui/styles"`. The tranche intends to **abrogate `fourier-overrides.css` + `ios-fixes.css`** outright and streamline `buttons.css`/`style.css`.

The headline finding: **`fourier-overrides.css` is a stale fork of `glass-ui/tokens.css`.** Roughly 70% of its 354 lines re-declare tokens, palette stops, shadows, and utilities that glass-ui v1.8.5 already ships at byte-near-identical values — `--section-color-0..12`, `--viz-*`, `--accent-*`, `--tier-*`, `--success/--warning/--info`, `--shadow-cartoon*`, `--shadow-soft/elevated/modal`, `--type-admin-label`, `--type-micro`, and the `@utility text-micro / text-admin-label / cm-serif / fira-code / fourier-f` blocks all exist in canon. The consumer is shadowing the library with an older copy of itself. Worse, two forks have **diverged**: `fourier-f` (consumer drops the canonical italic + `--font-display` + variation-settings) and the neutral scale (consumer never adopts `--neutral-0..5`; its `--background/--muted/--card` are raw `hsl()` literals that no longer track the canonical perceptual ladder).

Separately, the consumer **barely consumes glass-ui's component layer**: 89 native `<button>` elements, **zero** `Button`/`buttonVariants` usage, zero `.btn-pill`/`.interactive-item`/`.focus-ring`/`.glass-{wash,quiet,resting,floating,card}` usage. `buttons.css` exists entirely because the consumer reinvented the button system instead of importing it.

---

## Per-rule disposition tables

Disposition key: **(i)** fold into owning component · **(ii)** glass-ui addition (token/utility/variant) · **(iii)** dead — delete.

### `style.css` (8 lines)

| Rule | Line | Disposition | Target |
|---|---|---|---|
| `@import "tailwindcss"` / `tw-animate-css` / `glass-ui/styles` | 1–3 | keep | entry file — not in scope for abrogation |
| `@import "./styles/fourier-overrides.css"` | 6 | **iii** | delete import after fold-out below |
| `@import "./styles/buttons.css"` | 7 | keep (slimmed) | retain only the genuinely-project slider; see below |
| `@import "./styles/ios-fixes.css"` | 8 | **iii** | delete import; rules fold per table below |

### `fourier-overrides.css` (354 lines)

| Rule | Line | Disposition | Target |
|---|---|---|---|
| `@theme { --font-serif/-sans/-display/-mono }` | 14–19 | **iii** | duplicate of `tokens.css:22-30` (`--font-stack-*`) + `theme.css` bridge — already canon; delete |
| `:root` warm-cream palette (`--background`…`--ring`,`--shadow`) | 23–46 | **iii** | duplicate of `tokens.css:205-234`. Delete. **BUT** consumer must adopt `--neutral-0..5` rather than raw hsl — see Drift A1 |
| `--shadow-color`, `--glass-opacity-subtle`, `--glass-blur-default`, `--radius` | 42–45 | **iii** | `--shadow-color`/`--radius` are canon; `--glass-opacity-subtle`/`--glass-blur-default` are **dead** (v0.8.0 retired the 4-tier ladder — these names resolve to nothing in glass-ui). Delete |
| `.dark` palette block | 48–69 | **iii** | duplicate of `tokens.css:878-910`. Delete |
| `@custom-variant dark` | 72 | **iii** | `theme.css` already declares the dark variant (index.css §3). Delete |
| `--section-color-0..12` (light + dark) | 79–91, 135–148 | **iii** | byte-identical to `tokens.css:269-281` / `913-925`. Delete |
| `--accent-pink/-red`, `--section-heading` (light+dark) | 94–96, 151–153 | **iii** | identical to `tokens.css:284-286` / `927-929`. Delete |
| `--viz-fourier/-chebyshev/-legendre/-amber/-green` (light+dark) | 99–103, 156–160 | **iii** | identical to `tokens.css:291-295` / `931-935`. Delete |
| `--easing-accent` | 106 | **i** → **ii** | single-purpose; **glass-ui gap** — propose `--viz-easing` alias OR fold into EasingPicker.vue. Currently no canon home |
| `--tier-featured/-saved`, `--like/-success/-warning/-info/-delete` (light+dark) | 109–115, 163–169 | **iii** | identical to `tokens.css:298-304` / `950-956`. Delete |
| `--shadow-cartoon/-hover/-soft/-elevated/-modal` (light+dark) | 118–122, 172–176 | **iii** | identical to `tokens.css:318-324` / `966-972`. Delete |
| `--z-canvas-layer: 1`, `--z-canvas-overlay: 20` | 125–126 | **ii** | **glass-ui gap** — canvas-layer z-rungs. Propose `--z-canvas`/`--z-canvas-overlay` in tokens.css §3 (collides w/ `--z-content`/`--z-controls` values — see Union 1) |
| `--z-toast: 250` | 127 | **iii** | canon `--z-toast` is `160` (`tokens.css:163`); consumer override is drift. Delete, adopt canon |
| `--type-admin-label`, `--type-micro` | 130–131 | **iii** | identical to `typography.css:206-207`. Delete |
| `@theme --color-* mappings` (accent/section/tier/viz) | 182–200 | **i** | glass-ui's `theme.css` already bridges section/viz/accent tokens to Tailwind utilities. Verify coverage; any genuinely-missing alias → **ii**. Most are **iii** |
| `@layer base { * { @apply border-border } }` | 205–207 | **iii** | glass-ui ships the global border reset. Delete |
| `@layer base { html,body { bg/text/font } }` | 209–213 | **i** | fold to a single app shell rule (App.vue or a thin `style.css`) |
| `body { padding-bottom: env(safe-area-inset-bottom) }` | 215–217 | **i** | fold to App.vue root |
| `@utility text-micro` | 222–225 | **iii** | duplicate of `typography.css @utility text-micro`. Delete |
| `@utility text-admin-label` | 227–230 | **iii** | duplicate of `typography.css @utility text-admin-label`. Delete |
| `.cm-serif` | 232–234 | **iii** | duplicate of `typography.css @utility cm-serif`. Delete |
| `.fira-code` | 236–239 | **iii** | duplicate of `typography.css @utility fira-code`. Delete |
| `.fourier-f` | 243–249 | **iii** | `typography.css @utility fourier-f` is the canon — and **richer** (italic + `--font-display` + variation-settings). Consumer copy is a regression. Delete, adopt canon |
| `.ease-apple`, `.ease-apple-spring` | 253–258 | **iii** | `tokens.css:87-91` ships `--ease-apple`/`--ease-apple-spring`; **0 usages** of these classes in consumer. Dead. Delete |
| `@keyframes fade-in / scale-in / slide-up` | 262–275 | **iii** | `animations.css` ships `fade-in`; `pop`/`fade-slide` transitions cover scale/slide. Delete (see Drift E2) |
| `.animate-fade-in/-scale-in/-slide-up` | 277–287 | **iii** | only **1 usage** total (`animate-scale-in` in ImageUpload.vue:53). Replace that one site with `pop` transition or `.scale-on-hover`; delete classes |
| `[data-state=active][role=tabpanel]` + `@keyframes tab-slide-in` | 289–296 | **i** → **ii** | tab-panel entry animation. `UnderlineTabs` is a glass-ui component — **belongs on the library tab primitive**, not a consumer global selector. Propose patching `tabs` component |
| KaTeX `@font-face` swap block | 300–311 | **i** | genuinely project-specific (KaTeX is not a glass-ui concern). Fold to a dedicated `katex.css` or keep a minimal `style.css` |
| `.katex` / `.katex-display` sizing | 313–330 | **i** | project-specific KaTeX tuning — fold to `katex.css` |
| `::selection` color (light+dark) | 334–341 | **i** → **ii** | **glass-ui gap** — no canonical selection style. Propose adding to `glass-ui` base layer; until then fold to app shell |
| `@media (prefers-reduced-motion)` guard for `.animate-*` | 345–354 | **iii** | dies with the `.animate-*` classes. Delete |

**`fourier-overrides.css` tally:** ~24 rules **iii (delete)** · ~7 rules **i (fold)** · ~4 **ii (glass-ui addition)**. The file is **abrogatable**.

### `buttons.css` (216 lines)

| Rule | Line | Disposition | Target |
|---|---|---|---|
| `input[type=range]:not(.styled-slider)` base + thumb + hover/active | 11–42 | **ii** | **glass-ui gap** — no canonical native-range-input style. glass-ui ships `<Slider>` (reka-ui) but no bare `input[type=range]` recipe. Propose a `.range-input` utility, or migrate consumers to `<Slider>` |
| `.styled-slider` track + thumb + moz pseudo-elements | 46–123 | **ii** | **glass-ui gap** — progress-fill range slider w/ `--slider-color`/`--progress` vars. Strong custom-component / utility candidate; cite AnimationControls, BasisSelector, ContourSettings. Propose `<RangeSlider>` or `.range-slider-styled` |
| `.btn-icon-admin` | 128–154 | **iii** | reinvents `.glass-btn` (`glass.css:125`) at a smaller size. Replace usages w/ `.glass-btn` + `--size-icon-btn` override, or `<Button variant="glass" size="icon">`. Delete |
| `.btn-solid` | 156–183 | **iii** | reinvents `buttonVariants` `variant="default"`. Replace w/ `<Button>`. Delete |
| `.btn-ghost` | 185–209 | **iii** | reinvents `buttonVariants` `variant="ghost"`/`outline`. Replace w/ `<Button variant="ghost">`. Delete |
| `.basis-pill` | 211–215 | **i** | 3-line tinted-pill recipe via `--pill-c`. Fold into BasisSelector.vue scoped CSS (single owner) |
| `@layer components` wrapper around consumer rules | 127 | note | consumer redefining glass-ui's `components` layer — axis-2 violation; resolved when block empties |

**`buttons.css` tally:** 3 rules **iii (delete — adopt Button/glass-btn)** · 1 **i (fold)** · 2 **ii (glass-ui gap — slider)**. File slims to a slider-only stub pending the glass-ui slider addition.

### `ios-fixes.css` (35 lines)

| Rule | Line | Disposition | Target |
|---|---|---|---|
| `html { font-size: 1.125rem }` + `@media(min-width:768px)` down to 1rem | 10–20 | **ii** | **glass-ui gap** — responsive root font-size. Not in canon. Propose a `--font-size-root` token + base rule, or fold to app shell. Cross-walk with `.ios input { font-size: max(1rem,1em) }` already in `utilities.css:159` |
| `@media(max-width:640px) .paper-article pre/code` font shrink | 24–34 | **i** | project-specific (`.paper-article` is a consumer class). Fold into PaperArticleWindow.vue / PaperView.vue scoped CSS |

**`ios-fixes.css` tally:** 1 rule **ii** · 1 rule **i**. File is **abrogatable**.

---

## Drift findings (7 axes)

### Axis 1 — Token alignment

- **A1 — neutral scale never adopted.** `fourier-overrides.css:25-39` declares `--background/--muted/--card/--border/--secondary/--accent` as raw `hsl()` literals; glass-ui canon (`tokens.css:205-227`) derives every one from `--neutral-0..5`. The consumer's values are close but no longer step the canonical perceptual ladder, and dark mode (`:48-69`) re-forks again. **Fix:** delete the palette block; inherit canon.
- **A2 — raw `rgba()` in scoped styles, 29 sites.** `PaperView.vue:485,492`, `PaperSearch.vue:114,260-261`, `MobileFloatingToc.vue:278`, `EquationPanel.vue:113`, `GlassTimeline.vue:116`, `CoefficientsPanel.vue:157`, `EqCoefficientsPanel.vue:135`, `ConvergencePlot.vue:384`, `EquationView.vue:460` all hardcode `0 Npx Mpx rgba(0,0,0,0.0X)` drop shadows. Canon: `--shadow-sm/md/lg/xl` (`tokens.css:333-338`). `FunctionInput.vue:253-254`, `ConvergenceLegend.vue:79`, `EquationView.vue:417` hardcode `rgba(240,182,50,…)` — that is `--viz-amber`/`--warning`; use `color-mix(in srgb, var(--viz-amber) N%, transparent)`.
- **A3 — inline `color-mix(... --foreground N% ...)`, 58 sites.** Canon ships the `--surface-tint-{4..70}` rungs (`tokens.css:242-257`) precisely for these. e.g. `AnimationControls.vue:177-179` (`8%`,`25%`,`35%`), `buttons.css:137,190,212-213`. Replace with `var(--surface-tint-8)` etc.
- **A4 — hand-rolled cubic-bezier strings, ~20 distinct sites.** `cubic-bezier(0.16,1,0.3,1)` recurs ≥10× — that is canon `--ease-out-expo` (`tokens.css:79`). `cubic-bezier(0.4,0,0.2,1)` = `--ease-standard`. `cubic-bezier(0.34,1.56,0.64,1)` is a bounce with no canon match → see Glass-ui gaps. `cubic-bezier(0.175,0.885,0.32,1.275)` in `buttons.css:30` = `--ease-apple-spring`.

### Axis 2 — Utility & `@apply` hygiene

- **B1 — consumer `@layer components` redefines glass-ui's layer.** `buttons.css:127` and `fourier-overrides.css:76,204` open `@layer base`/`@layer components` that glass-ui owns. Per axis-2 this is a structural violation; resolves when the rules are folded/deleted.
- **B2 — `transition: all`, 11 scoped-CSS sites.** `PaperView.vue:486`, `PaperSidebar.vue:192`, `ContourSettings.vue:447,450`, `EasingPicker.vue:61`, `FullscreenViewer.vue:133`, `MobileFloatingToc.vue:224,325`, `AnimationControls.vue:215`, `EditorToolsPanel.vue:76`, `BasisSelector.vue:243` + ~6 `transition-all` Tailwind sites. Enumerate the animated properties; canon `.interactive-item`/`.hover-lift*` already scope `transition` to the right property list.
- **B3 — canonical utilities entirely unused.** Zero usages of `.btn-pill`, `.interactive-item`, `.focus-ring`, `.hover-lift*`, `.glass-{wash,quiet,resting,floating,card}`, `.section-label`, `.divider-h*`. The consumer hand-rolls all of these in scoped CSS (e.g. `AnimationControls.vue:182-210` menu-popup + menu-item is `.glass-floating` + `.interactive-item`).

### Axis 3 — Interactive consistency

- **C1 — 89 native `<button>`, zero `<Button>`.** The consumer never adopts `buttonVariants`. Every button reinvents hover/press/disabled/focus. `buttons.css` `.btn-solid`/`.btn-ghost`/`.btn-icon-admin` are the codified form of this drift.
- **C2 — ad-hoc focus rings, 16 scoped-style sites** using `outline: 2px solid …` instead of `.focus-ring` / `var(--focus-ring-shadow)`. `AnimationControls.vue:170` even uses `outline: 2px solid rgba(255,255,255,0.6)` — a hardcoded white that the dark cascade cannot unwind.
- **C3 — bespoke press transforms.** `play-btn:active { transform: scale(0.93) }` (`AnimationControls.vue:169`), `icon-swap` scale `0.7` etc. — canon `--scale-press` = `0.95`, ladder `--scale-press-{xs..lg}`.

### Axis 4 — Variant orthogonality & rooting

- **D1 — `:deep()` against KaTeX, 14 sites** (`EquationPanel.vue:116-120`, `EquationView.vue:398-415`, `EquationResult.vue:68-80`, `ConvergencePlot`, etc.). KaTeX is third-party, not reka-ui, so these are legitimate — but they cluster: a shared `.katex-host` recipe would deduplicate. No glass-ui slot-prop gap here.
- **D2 — no `:deep()` against reka-ui internals** — good. The consumer does not currently fight glass-ui component internals (it mostly avoids them entirely, which is its own problem — see C1).

### Axis 5 — Overlay & motion vocabulary

- **E1 — `@keyframes` duplicating canon, 12 scoped-CSS sites.** `GalleryGrid.vue:110 @keyframes spin` (canon ships `spin`), `CollapsibleSection.vue:63-67 collapsible-open/close` (glass-ui `Collapsible` ships its own), `ConvergencePlot.vue:390 tooltip-in` (= `pop`/`dropdown` transition), `ContourSettings.vue:359-363 adv-open/close`. `fourier-overrides.css:262-296` keyframes are the global form.
- **E2 — bespoke Vue Transition classes instead of `transitions.css`.** `VisualizationView.vue:400-401 slide-down`, `AnimationControls.vue:213-216 popup`/`icon-swap`, `EquationView.vue` `pop`/`expand-pop`. Canon ships `fade`, `fade-slide`, `pop`, `dialog-scale`, `dropdown`, `tab-fade`, `pane-swap`. The consumer's `.popup-*` ≈ `.dropdown-*`; `.slide-down` ≈ `pane-swap`.
- **E3 — reduced-motion coverage gap.** 10 components use `animation:`; only 2 bracket it under `prefers-reduced-motion`. The custom keyframes (marquee, rainbow-drift, golden-shimmer, like-bounce) animate transform/position with no PRM guard.
- **E4 — floating surfaces hand-composed.** `AnimationControls.vue:182-194 .menu-popup` sets `background: var(--card)` + manual border + `var(--shadow-elevated)` + `z-index: var(--z-popover)` — should be `.glass-floating` + `--z-popover` + `dropdown` transition.

### Axis 6 — Typographic & structural hierarchy

- **F1 — semantic type scale unused.** Zero usages of `.text-{display-*,title,heading,subheading,body,prose,small,caption}`. Headings use ad-hoc Tailwind `text-2xl`/`text-lg` etc. The golden-ratio scale (`typography.css:212-227`) is bypassed wholesale.
- **F2 — `fourier-f` regression.** Consumer's `.fourier-f` (`fourier-overrides.css:243`) omits the canonical `font-style: italic`, `--font-display`, and `font-variation-settings` from `typography.css @utility fourier-f`. 5 usages — adopting canon is a visual upgrade.

### Axis 7 — Accessibility resilience

- **G1 — custom glass surfaces miss PRT/contrast/`@supports` fallbacks.** `AnimationControls.vue:142-143 .play-btn` uses raw `backdrop-filter: blur(12px) saturate(1.4)` with no `prefers-reduced-transparency` / `@supports not (backdrop-filter)` fallback. `glass.css` provides all three for the canonical tiers; the hand-rolled play-button bypasses them. Same for `.btn-icon-admin` (`buttons.css:139`) and `.input-bar`-style surfaces.
- **G2 — light-baked foreground in `color-mix`/`rgba`.** `AnimationControls.vue:140-170` bakes `rgba(255,255,255,…)` borders/highlights — fixed white the `.dark` cascade cannot unwind. Canon `--glass-highlight`/`--glass-specular` flip per theme.

---

## Glass-ui gaps (library should grow these)

1. **Styled progress-fill range slider.** `buttons.css:46-123 .styled-slider` — a `--slider-color`/`--progress`-driven gradient track with hidden-until-hover thumb, used by AnimationControls, BasisSelector, ContourSettings, GlassTimeline, ConvergenceTimeline (≥5 sites). glass-ui ships `<Slider>` (reka-ui) but no equivalent "scrubber" surface. **Propose:** a `<GlassScrubber>`/`<RangeSlider>` custom component or a `.range-slider` utility in `glass.css`. Highest-value gap.
2. **Native `input[type=range]` recipe.** `buttons.css:11-42` — even the *un*-styled range gets a 30-line consumer recipe. **Propose:** `.range-input` utility, or push consumers fully onto `<Slider>`.
3. **Responsive root font-size.** `ios-fixes.css:10-20` lifts root to `1.125rem` on mobile, `1rem` ≥768px. No canonical token. **Propose:** `--font-size-root` token + a base rule in `typography.css`/`theme.css`. ≥1 consumer needs it; likely cross-cutting.
4. **`::selection` style.** `fourier-overrides.css:334-341` — `color-mix(--primary 12/20%, transparent)`. glass-ui base layer has no selection rule. **Propose:** add to a glass-ui base/reset.
5. **Bounce easing token.** `cubic-bezier(0.34,1.56,0.64,1)` recurs (`EquationView.vue:392`, `MobileFloatingToc.vue:265`) for "expand-pop" overshoot. Canon `--spring-bouncy` is a `linear()` and `--ease-apple-spring` is `(0.175,0.885,0.32,1.275)` — neither matches. **Propose:** `--ease-overshoot` cubic-bezier token, OR steer consumers to `--spring-bouncy`.

Secondary: tab-panel entry animation belongs on the `tabs` primitive (`fourier-overrides.css:289`); `--easing-accent` (viz easing color) and canvas-layer z-rungs (`--z-canvas*`) want canonical homes.

## Union candidates

1. **Z-index canvas layers.** Consumer `--z-canvas-layer:1` / `--z-canvas-overlay:20` collide numerically with canon `--z-content:10` / `--z-controls:20`. Same concept, divergent vocabulary. **Canonical:** map consumer canvas layers onto `--z-content`/`--z-controls`, or add explicit `--z-canvas`/`--z-canvas-overlay` rungs to `tokens.css §3` so both libraries name them.
2. **`--z-toast`.** Consumer `250` vs canon `160`. Same token, different value — consumer should drop the override and adopt canon `160`.
3. **Apple easings.** Consumer `.ease-apple`/`.ease-apple-spring` classes vs canon `--ease-apple`/`--ease-apple-spring` tokens — same curves, consumer should consume the tokens (its classes have 0 usages anyway).
4. **`fourier-f` / `cm-serif` / `fira-code`.** Both libraries define them; glass-ui's are richer. Canonical = glass-ui's `@utility` forms.

---

## Tally

`fourier-overrides.css` ≈ **24 delete / 7 fold / 4 glass-ui-addition** → abrogatable. `ios-fixes.css` = **1 fold / 1 glass-ui-addition** → abrogatable. `buttons.css` = **3 delete / 1 fold / 2 glass-ui-addition** → slims to a slider stub. `style.css` keeps imports only. Drift clusters: 89 native buttons w/ zero `Button` adoption · 58 inline foreground `color-mix` · 29 raw `rgba` shadows · ~20 hand-rolled cubic-beziers · 12 duplicate `@keyframes` · stale token fork across ~24 rules.
