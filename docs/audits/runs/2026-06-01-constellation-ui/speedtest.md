# Style audit — speedtest vs glass-ui design canon

**Run:** 2026-06-01-constellation-ui
**Target:** `/Users/mkbabb/Programming/speedtest` (speedtest.friday.institute)
**Frontend slice:** `src/` (48 SFCs) + top-level `styles/` (consumer token/cascade layer) + `src/assets/styles/pane-slide.css`
**glass-ui consumed:** declared `@mkbabb/glass-ui@^2.1.0`; **installed `2.1.0`** (repo HEAD is the unreleased `3.0.0` @ `21547de`). Token canon cited below from the 3.0.0 repo source (`src/styles/*.css`); every cited token was verified present in the installed `2.1.0` `node_modules/@mkbabb/glass-ui/dist/styles/tokens.css` — the structural namespace matches, so the citations hold for what the consumer actually links. Where I name a 3.0.0-only token I say so.

## Scope verdict

This is an **exemplary consumer** — among the cleanest possible. The headline numbers: **0** `:deep()` selectors (the five `:deep` grep hits are all comments documenting its *absence*), **0** `transition: all`, **0** raw `cubic-bezier()`/`linear()` literals in styles (only comments referencing `--spring-snappy`), **0** ad-hoc `hover:scale`/`active:scale`, **0** ad-hoc focus rings, **0** `bg-black/N` scrims, **0** raw `color-mix(var(--foreground) N%)` (all routed through `--surface-tint-*`), **0** arbitrary `text-[…]` sizes. Typography is canon: `text-small`×52, `text-heading`×14, `section-label`×13, `text-display`/`-2`/`-3`, `text-mono-*`, plus `<Button>`/buttonVariants ×31, `glass-*` tiers, `tap-squish`×8, `divider-h-tapered`×7. 16 `prefers-reduced-motion` brackets. The consumer `styles/style.css` and `styles/tokens.css` document every divergence with DDR-style rationale and explicit single-source-of-truth contracts.

Drift is therefore **narrow and concentrated** — almost entirely in the **dashboard map skeleton/empty-state pair**, which deliberately mirrors the MapLibre `dataviz-light/dark` basemap palette and so steps *outside* the warm-cream cascade. A few micro-drifts elsewhere. The richer output of this audit is the **bidirectional gap analysis**: speedtest surfaces three legitimate glass-ui additions and one strong union candidate (`pane-slide`).

---

## Axis 1 — Token alignment

**1.1 Cool slate-blue palette bypasses `--neutral-{0..5}` / `--muted-foreground` (map pair).** `MapSkeleton.vue` and `MapEmptyHint.vue` hard-code a cool slate register that does not step the warm hue-48 neutral scale and bakes light-mode values the dark cascade only partially unwinds:
- `MapSkeleton.vue:124` `background: rgba(238, 242, 247, 1)` + `:132` dark `rgba(22, 26, 32, 1)`; SVG stops `:76-82,86` (`rgba(120,140,165,…)`, `rgba(245,247,250,1)`…); caption colors `:179,186,190,194` (`rgba(71,85,105,.85)`, `rgba(100,116,139,.65)`, …).
- `MapEmptyHint.vue:169,189,197` `color: var(--muted-foreground, #64748b)` — the **`#64748b` fallback is slate, not warm-neutral**; the live value resolves to `--muted-foreground` (correct) but the literal fallback is off-cascade. `:93` `#ffffff` and `:174` `#161a20` pin the SVG pin-eye.

These are **half legitimate / half drift**. The basemap-matching fills (the topo SVG, the skeleton wash) are a real gap — there is no glass-ui "matches the dataviz basemap" surface token (see Gap G1). But the `#64748b` *fallbacks behind `var(--muted-foreground)`* and the caption rgbas should resolve through `--muted-foreground` / `--muted-foreground-strong` (3.0.0) rather than restating a slate literal. **Count: 2 files, ~12 literal sites.**

**1.2 `--meter-background-color` / `--meter-dial-color` hand-roll a foreground tint.** `styles/tokens.css:258` `--meter-background-color: rgb(0 0 0 / 0.12)` (light) / `:535` `rgb(255 255 255 / 0.15)` (dark); `:259` `--meter-dial-color: color-mix(in srgb, var(--foreground) 40%, transparent)` (the dial one IS canonical — `--surface-tint-40`). The `rgb(0 0 0 / .12)`/`rgb(255 255 255 / .15)` pair is a light/dark-forked literal where the recipe is `color-mix(in srgb, var(--foreground) 12%, transparent)` = **`--surface-tint-12`** (auto-darks, no dark fork needed). Note the comment justifies *splitting* the canvas-track from the CSS-track responsibility, but the CSS-track value itself is still a hand-rolled tint. **Count: 2 sites.**

**1.3 `--aurora-1..6` raw hexes bypass `--rainbow-*`.** `styles/tokens.css:226-231` declares the aurora palette as Tailwind-flavoured hexes (`#c084fc`, `#60a5fa`, `#f472b6`, `#34d399`, `#fbbf24`, `#a78bfa`). These are a *documentation mirror* of the canvas OKLCH config (`src/config/auroraConfig.ts:63-68`), and the live aurora is driven by that JS config, not the CSS tokens — so this is low-severity. But the six hues overlap glass-ui's `--rainbow-{violet,blue,…}` family without referencing it (see Union U2). **Count: 6 declarations (1 file).**

**1.4 `CompleteBadge.vue:128` `stroke: #fffaf0`.** The completion check glyph is a raw warm-white = the `--neutral-0` light value (`hsl(48 12% 98%)`). On the gold disc the canonical token is **`--success-foreground`** (3.0.0; = `--neutral-0`) or `--primary-foreground`. **Count: 1.**

---

## Axis 2 — Utility & @apply hygiene

**2.1 `pane-slide-left/right` mirrored variants use raw `rotate(±2deg)`.** `src/assets/styles/pane-slide.css:98,102` hard-code `rotate(-2deg)`/`rotate(2deg)` while the forward/back arcs in the same file correctly read the `--pane-slide-rotate` (`:60,63`) / `--pane-slide-rotate-back` (`:77,80`) tokens declared at `:46-47`. Internal inconsistency: the mirrored pair should also read `--pane-slide-rotate`. (Note: these variants have no consumer today — parked for value.js dual-pane parity.) **Count: 2 sites.**

Otherwise clean. The one consumer `@layer components` block (`pane-slide.css:44`) does **not** redefine glass-ui's layer — it declares two private rotation tokens + four transition contracts, all composing glass-ui tokens. `styles/style.css:49` `@layer base` is the canonical `border-border`/`bg-background`/`text-foreground` apply. No Tailwind-soup with a canonical-class equivalent was found.

---

## Axis 3 — Interactive consistency

**Clean.** No ad-hoc hover/press/disabled/focus. Press feedback routes through `.tap-squish` (×8) and `<Button>`/buttonVariants (×31). No bespoke `hover:scale`/`active:scale` literals (the `--scale-hover*`/`--scale-press*` contract is honored via the primitives). No missing focus-visible patterns surfaced; no sub-`--size-icon-btn` touch targets in raw CSS.

---

## Axis 4 — Variant orthogonality & rooting

**4.1 The dispatch's "squared ConfiguratorLayer edges / left→right panel move" instance is NOT present in speedtest** — that is the *fourier* visualizer's Configurator. speedtest's only Configurator consumer is `AppSettingsButton.vue`, which carries **no** radius/`:deep()`/squared-edge override. I verified: no `radius-panel`/`rounded-none`/`ConfiguratorLayer` overrides anywhere in `src`.

**4.2 `App.vue:515-521` `border-radius: 0` + `backdrop-filter: none` is correct, not drift.** This is the `<InstrumentChassis variant="glass">` *crush* (the dial route): the consumer deliberately zeroes the chassis plate/border/shadow/blur/radius so the chassis reads as a transparent cascade pipe the meter card sits in front of. The `border-radius: 0` zeroes a surface with no visible edge (transparent bg, no border) — there is no `--radius-panel` to apply here. The override is scoped to `.app-chassis-spine[data-variant="glass"]` (a glass-ui-published data-attr, not a reka internal) and lives in a non-scoped block precisely to avoid `:deep()`. The companion `[data-variant="spine"]` branch is explicitly left untouched so the housing recipe paints. This is textbook patch-at-the-published-contract.

**4.3 `App.vue:556 ol.z-toast { … !important }`** re-anchors the `<Toaster>` viewport top-center because glass-ui hardcodes it bottom-right (overlapping the inline dock). This targets glass-ui's *published* `.z-toast` utility on a `<Teleport to="html">`'d element (out of scope tree), not a reka internal — but it is a real ergonomic gap (see Gap G3). **Count: 1 consumer override (justified).**

---

## Axis 5 — Overlay & motion vocabulary

**5.1 `ResultsTable.vue:250` raw `180ms`.** `transition: transform 180ms var(--motion-ease-decel), box-shadow 180ms var(--motion-ease-decel)` — the easing is tokenized but the duration is a raw literal; nearest tokens are `--duration-fast` (0.2s/200ms) and `--duration-instant` (0.1s). No exact 180ms token exists, so this is a 20ms-off micro-drift (or a Gap if 180ms is intentional canon — but it appears at one site only). **Count: 1.**

**5.2 `ResultStack.vue:359` bare `ease-out` keyword.** `transition: opacity var(--motion-duration-staged) ease-out, transform … var(--motion-ease-overshoot)` — the opacity arm uses the CSS `ease-out` keyword instead of `var(--ease-out)`. The transform arm is tokenized. **Count: 1.**

**5.3 `SurveyWizard.vue:68` `backdrop-blur-md` (Tailwind raw blur) on the sticky `<CardHeader shrink>`.** This is a sticky-header backdrop, not a glass tier; glass-ui's canonical sticky-header recipe is `--card-header-bg` (which `<CardHeader shrink>` already reads for its tint). The `backdrop-blur-md` bypasses the `--glass-blur-*-radius` token family. Low severity — it's a header, not a reimplemented glass surface. The accompanying `z-[1]` is a local stacking context (sibling ordering), correctly NOT a `--z-*` tier. **Count: 1.**

Otherwise strong: motion is pervasively token-driven; the `pane-slide` idiom composes `--duration-slow`/`--spring-snappy`/`--ease-out`; the `--phase-color` cross-fade (`styles/tokens.css:519`) uses `--motion-duration-phase-handoff` + `--motion-ease-phase-standard` and is `prefers-reduced-motion`-bracketed (`:523`). No custom `@keyframes` duplicating dialog-in/floating-panel-in/fade-in/etc. were found. All spatial motion is PRM-bracketed (16 brackets).

The `z-index: 0/1` literals at `CompleteBadge.vue:102`, `MeterColumn.vue:338,346`, `SpeedtestResults.vue:441`, `ThankYou.vue:119` are all **intra-component sibling ordering** within a component's own stacking context — `--z-*` (cross-surface overlay tiers) correctly does not apply. Not drift.

---

## Axis 6 — Typographic & structural hierarchy

**6.1 Three `font-family: "Plus Jakarta Sans", system-ui, sans-serif` hard-codes bypass `--font-sans` / `--font-brand-sans`.** `MapSkeleton.vue:175,183`, `MapEmptyHint.vue:184` (and `ThankYou.vue` carries it too). The consumer's `styles/tokens.css:56-57` declares `--font-brand-sans-canonical`/`--font-brand-sans` = Plus Jakarta and `styles/style.css:41-43` aliases `--font-sans/display/serif` from it (the global cascade), and `<html data-typography-preset="brand-uniform-sans">` activates glass-ui's preset. So `var(--font-sans)` / `var(--font-brand-sans)` resolve to exactly this family **globally** — these three SFCs restate the literal instead of reading the token. (The `index.html:123` inline-shell copy is legitimately a literal — it must paint before the token sheet loads, and is documented as a strict subset.) **Count: 3 SFC sites.**

**6.2 `MapSkeleton.vue:176` `font-size: 1.125rem` / `:184` `0.875rem`.** Raw sizes on the LCP-fallback caption where `text-body`/`text-small` (or `--type-*` rungs) exist. The component comments justify "honest weight for LCP", but the *sizes* could read `--type-body`/`--type-small`. Low severity (LCP-critical, pre-sheet element). **Count: 2.**

Otherwise the typographic hierarchy is **fully canon** (see Scope verdict counts). Notably `styles/tokens.css:431-435` documents the deliberate `text-hero` knob-threading and `SurveyWizard.vue:70-84` carries a DDR reversing a `text-display-2/3` lift back to `.text-title` because "only the live hero NUMBER earns `display-*`" — the consumer actively *enforces* the rung discipline.

---

## Axis 7 — Accessibility resilience

**N/A — no drift.** The consumer **reimplements no glass surfaces** (it uses canonical `.glass-wash`/`.glass-floating`/`.glass-card` tiers + the chassis primitive), so the "missing `prefers-reduced-transparency` / `prefers-contrast` / `@supports not(backdrop-filter)` fallback" axis does not fire — those fallbacks live in glass-ui's own tiers. The one near-miss, `SurveyWizard.vue:68` `backdrop-blur-md` (Axis 5.3), is a header backdrop with an opaque-ish sticky surface beneath, not a content-bearing glass plate — no transparency-fallback obligation. The WCAG phase-label discipline (`styles/tokens.css:140-143,453-455,543-546`) deriving `--chart-*-label` from the four `--phase-*` bases (light: mix-toward-black; dark: mix-toward-white) is a model of color-mix that the dark cascade *can* unwind — the opposite of the anti-pattern. No light-mode foreground baked into a dark-unrecoverable value was found.

---

## Glass-ui gaps (patterns speedtest legitimately needs that glass-ui doesn't expose)

**G1 — Dataviz-basemap skeleton surface tokens (top priority).** `MapSkeleton.vue` + `MapEmptyHint.vue` hard-code a cool slate-blue register (`rgba(238,242,247,1)`/`rgba(22,26,32,1)` wash; `rgba(120,140,165,…)` hairlines; slate caption rgbas) **on purpose** — to tonally match the MapLibre `dataviz-light`/`dataviz-dark` base tiles so the skeleton→canvas cross-fade reads as one progression. glass-ui ships `--skeleton-breath-duration` (timing) but **no skeleton/basemap color surface**. Token hard-coded across ≥10 sites in 2 files. **Propose:** a `--skeleton-{base,line,caption}` rung family (light+dark) in `tokens.css §12`-adjacent, OR a `--surface-dataviz-{base,line}` pair for map/chart-canvas skeletons. Rationale: any consumer painting a basemap/chart skeleton needs the same "neutral that matches a data-canvas, not the warm page" register that the warm `--neutral-*` scale intentionally is *not*.

**G2 — Project sans semantic for non-display body text.** The map/thankyou captions want "the project's brand sans" and reach for the literal `"Plus Jakarta Sans"` (Axis 6.1). `--font-sans`/`--font-brand-sans` exist and resolve correctly — so this is mostly a *consumer-discipline* fix (read the token). But the recurrence (4 SFCs) suggests glass-ui could publish a thin `@utility font-brand-sans` / `.text-brand-sans` (parallel to `cm-serif`/`fira-code`/`fourier-f` which already exist as `@utility` in typography.css) so a consumer writes `class="font-brand-sans"` instead of a CSS `font-family` literal. Cite: `typography.css:357-378` already has the `@utility` pattern. ≥4 sites.

**G3 — `<Toaster>` viewport `position` prop.** glass-ui hardcodes the reka `<ToastViewport>` to bottom-right on desktop, overlapping inline bottom-docks; speedtest must `!important`-re-anchor it (`App.vue:556`). Documented in-code as a known publisher gap ("glass-ui exposes no `position` prop on the Toaster"). **Propose:** a `position`/`anchor` prop (or `--toast-viewport-{inset-block,inset-inline}` tokens) on `Toaster`. Any inline-dock consumer hits this. ≥1 site, but architecturally shared across the constellation (every dock+toast app).

---

## Union candidates (same pattern, both libraries, different vocabulary)

**U1 — `pane-slide` page-turn transition family (strong; already flagged for promotion in-code).** `src/assets/styles/pane-slide.css` is adopted **verbatim from value.js** (`color-picker/App.vue:244-281`, per its own header `:5-9`) and the file explicitly states: *"Promotion candidate: at W6 … absorb into glass-ui's transitions.css once value.js's own pane-left/pane-right also refactor to consume from the publisher."* It composes only glass-ui tokens (`--duration-slow`, `--duration-normal`, `--spring-snappy`, `--ease-out`) plus two private rotation tokens. **Propose canonical:** lift the four directional contracts (`pane-slide`, `-back`, `-left`, `-right`) into glass-ui `transitions.css` alongside `dialog-scale`/`fade-slide`/`dock-in`, with `--pane-slide-rotate{,-back}` promoted to `tokens.css`. Cite both: speedtest `pane-slide.css:44-132` + value.js `color-picker/App.vue:244-281`. This is the cleanest union in the run — both consumers already converge on the identical vocabulary.

**U2 — Aurora brand palette vs `--rainbow-*`.** speedtest's `--aurora-1..6` (`styles/tokens.css:226-231`: violet/blue/pink/emerald/amber/violet) is a six-hue background-blob palette overlapping glass-ui's `--rainbow-{violet,blue,…}` / `--rainbow-pastel-*` families by intent but not reference, and it is mirrored in OKLCH at `src/config/auroraConfig.ts:63-68`. glass-ui's `<Aurora>` takes its palette via canvas config/prop, not tokens — so there is no shared CSS vocabulary today. **Propose canonical:** either (a) an `<Aurora palette="rainbow">` preset that reads `--rainbow-*`, or (b) a documented `--aurora-{1..6}` token contract in glass-ui that `<Aurora>`'s shader consumes, so consumers retune the brand background through one named channel. Lower confidence than U1 (the aurora is genuinely brand-specific), but the duplicated 6-hue list across CSS + JS config is a real seam.

---

## Tally

**Drift:** Axis 1 = 4 findings (~21 sites) · Axis 2 = 1 (2 sites) · Axis 3 = 0 · Axis 4 = 0 (the dispatch's Configurator/squared-edge instance is fourier's, not speedtest's; the two App.vue overrides are justified) · Axis 5 = 3 (3 sites) · Axis 6 = 2 (5 sites) · Axis 7 = 0. **Total: 10 drift findings.** · **Glass-ui gaps: 3** (G1 basemap-skeleton tokens, G2 brand-sans utility, G3 Toaster position prop). · **Union candidates: 2** (U1 pane-slide → strong, U2 aurora-palette → softer). Verdict: model consumer; drift is narrow and concentrated in the dashboard-map basemap-mirroring pair, most of which is a legitimate library gap (G1) rather than carelessness.
