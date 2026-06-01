# keyframes.js — glass-ui design-canon audit

**Run:** 2026-06-01-constellation-ui
**Target:** `@mkbabb/keyframes.js` demo frontend — the glass-ui-consuming SFC slice under
`/Users/mkbabb/Programming/keyframes.js/demo/` (`app/`, `playground/`, `@/components/`, `@/styles/`,
plus the `easing/ spring/ cube/ square/ amiga/` scene demos). Located via `package.json`
`@mkbabb/glass-ui: file:../glass-ui` (devDep) + import scan. `dist/` build artifacts excluded.
**glass-ui consumed:** `@mkbabb/glass-ui@3.0.0`, source HEAD `21547de` (tranche AP). Imported via
11 entry subpaths (`@mkbabb/glass-ui`, `/forms`, `/dock`, `/icon-tooltip`, `/keyboard`, `/dark`,
`/controls`, `/status-dot`, `/labeled-field`, `/header-ribbon`, `/glass-panel`).

## Preamble — overall posture

This is the **reference consumer**: glass-ui's own canon documents three utilities as
"Consumed by keyframes.js" (`btn-interactive` utilities.css:804 "at 7 sites"; the `--font-stack-mono`
Fira-Code default; the `--type-prose` rung), and `demo/DESIGN.md` formally "Extends glass-ui
DESIGN.md". The two libraries are co-evolved, so this audit skews hard toward *bidirectional gaps*
(what the demo legitimately needs that glass-ui doesn't yet expose) over genuine drift.

Token discipline is exemplary by the usual axis-1 measures: **0** `transition: all` in chrome
(1 sole exception, below), **0** raw `cubic-bezier`/spring literals in chrome (the 7 `cubic-bezier`
string hits are the demo's *subject matter* — it is a CSS-timing-function editor), **0** `:deep()`
into reka internals, **0** numeric `z-index` in chrome (1 in 3D demo content), **0** raw hex/rgba in
chrome (all 11 hits are 3D-cube-face / three.js-light / SVG-viewBox *animation payloads*, not UI
surfaces), and 90+ direct `--type-*/--leading-*/--tracking-*` references. The findings below are the
residue.

A note that closes the largest would-be finding: the demo defines **0** `prefers-reduced-motion`
brackets, but glass-ui ships a **global** PRM rule (`utilities.css:839` —
`*:not([data-allow-motion]) { animation-duration:.01ms; animation-iteration-count:1; … }`) that
already neutralizes the demo's bespoke infinite decoratives (`idle-bob`, `liftDown`, `dotFade`) and
its scene/tabpanel transitions. So spatial motion **is** covered by inheritance — not drift.

---

## Axis 1 — Token alignment

| # | Site(s) | Finding | Canonical replacement |
|---|---------|---------|----------------------|
| 1.1 | `@/styles/utils.css:36` | `background: color-mix(in srgb, var(--foreground) 8%, transparent)` for `.tab-trigger-pill[data-state=active]` | `var(--surface-tint-8)` (tokens.css:363 — exact rung) |
| 1.2 | `@/styles/utils.css:33` | `color-mix(in srgb, var(--foreground) 5%, transparent)` for `.tab-trigger-pill` hover | near-miss: canon has `--surface-tint-4` / `--surface-tint-6` (tokens.css:361-362), not 5%. Snap to `--surface-tint-6` or propose a `-5` rung (see gaps) |
| 1.3 | `@/styles/utils.css:74`, `:129`; `app/scenes/EditorStartScreen` `opacity-50` (`EditorStartScreen.vue:28`) | hand-rolled `opacity: 0.5` / Tailwind `opacity-50` for the disabled/dim register | `--opacity-disabled` (tokens.css:922) / the generated `opacity-disabled` utility (theme.css:356). `.is-disabled` (utils.css:128) + `.btn-playback:disabled` (utils.css:73) both restate the value |

Not-drift (intentional): `--accent-red` color-mix tints in `.btn-playback-accent` (utils.css:58-63),
`--axis-{x,y,z}` / `--ppmycota-primary` / `--filter-brand-color` in `style.css`/`utils.css` are
project identity tokens the demo's own `## Token Overrides` ratifies. The CubeTarget/AmigaScene/
SquareScene/EasingCurveCanvas raw colors are animation/visualization payloads in their own coordinate
space, correctly using `--border`/`--muted-foreground`/`--foreground` for the *chrome* around them.

## Axis 2 — Utility & @apply hygiene

| # | Site(s) | Finding | Canonical replacement |
|---|---------|---------|----------------------|
| 2.1 | `@/styles/utils.css:16` (`.tab-trigger-base`) | `transition: all var(--duration-fast) var(--ease-standard)` — the sole `transition: all` in the codebase, and it *broadens* a transition the canonical `TabsTrigger` already declares with explicit props (`transition-[background-color,color,box-shadow,border-color]`, TabsTrigger.vue) | enumerate the changed properties (color/background/border-bottom-color), or drop it and lean on the canonical trigger's named transition |
| 2.2 | `@/styles/utils.css:128-131` (`.is-disabled`), used at `PlaybackRibbon.vue:3,54`, `AnimationVisualizer` | bespoke `{opacity:.5; pointer-events:none}` re-rolls the disabled half of `.interactive-item` (utilities.css:117) | no exact standalone canonical class exists → **glass-ui gap** (`.disabled-base`, below). Interim: read `--opacity-disabled` |
| 2.3 | `@/components/ui/menubar/*` (`MenubarItem/CheckboxItem/RadioItem`, 3 sites) | `data-[disabled]:opacity-50` literal | `data-[disabled]:opacity-disabled` (theme.css generates it). NB vendored shadcn-vue — upstream class; flag-only |

Not-drift: `.tab-trigger-{base,pill,underline}` and `.btn-playback*` are *named local utilities*
(not Tailwind soup) that compose cleanly onto canonical `<TabsTrigger>` / `<Button>` and are already
booked for upstreaming in `demo/DESIGN.md`. They are the bidirectional-gap mechanism working as
intended, not consumer-layer redefinition.

## Axis 3 — Interactive consistency

| # | Site(s) | Finding | Canonical replacement |
|---|---------|---------|----------------------|
| 3.1 | `@/styles/utils.css:71` (`.btn-playback:active`) | `transform: scale(var(--scale-press))` (0.96) on a *button* surface, where the canon's button press rung is `--scale-press-btn` (0.97, tokens.css:921 — "the slightly-softer value the button + slider recipes consume") | `var(--scale-press-btn)` |
| 3.2 | `PlaybackRibbon.vue:34-50` (Reverse button) | hand-spelled `h-8 w-full rounded-full gap-2 instrument-serif text-base btn-interactive` **+** inline `aria-pressed:bg-primary/10 aria-pressed:border-primary/40`, sitting beside its sibling Play button which uses the `btn-playback btn-playback-accent` named recipe. The inline `aria-pressed:*` duplicates `.btn-playback[aria-pressed=true]` (utils.css:78-81) verbatim | route both transport buttons through one recipe — either `.btn-playback` or a shared ribbon-button variant (see gap 3) |

Strength: `btn-playback`/`btn-interactive` are composed *onto* `<Button variant="outline">`, so the
four-state contract (focus-ring, disabled, `--scale-press-btn`) is inherited — the correct rooting.
No bespoke `<button>` chrome bypassing `<Button>` was found. Touch targets respect
`--dock-icon-height: 2.75rem` (the WCAG floor).

## Axis 4 — Variant orthogonality & rooting

No findings. **0** `:deep()` into reka internals; **0** ad-hoc styling patched onto shadcn-vue
re-export leaves (the asset/menu/dropdown surfaces all route through canonical `<Card>`,
`<DropdownMenu*>`, `<Button>`, `<Slider variant>`). The dispatch's Configurator note does **not
apply** — keyframes consumes no `<Configurator*>` (grep: 0 hits); the squared-edge/panel-radius
instance is a fourier concern, not present here.

## Axis 5 — Overlay & motion vocabulary

No drift. Bespoke motion (`App.vue` `.scene-*` transitions; `cube/CubeTarget.vue` `idle-bob`;
`AnimatedText.vue` `liftDown`/`dotFade`; `utils.css:135` tabpanel `enter`) all use named-property
transitions bracketed by token durations/easings (`--duration-*`, `--ease-*`) and are PRM-covered by
glass-ui's **global** `utilities.css:839` bracket (see preamble). The `scale(0.97)/scale(1.02)`
scene-swap endpoints are full-page Transition magic values with no governing press/hover token. Local
`@keyframes` are either UI decoratives (covered) or the editor's *authored output* (the thing the
tool produces) — not chrome duplicating `dialog-in`/`floating-panel-in`/`fade-in`/etc.

## Axis 6 — Typographic & structural hierarchy

| # | Site(s) | Finding | Canonical replacement |
|---|---------|---------|----------------------|
| 6.1 | `EditorStartScreen.vue:6,22,28` (`text-6xl lg:text-8xl`, `text-5xl`, `text-2xl`); + `EasingTarget:8`, `SpringTarget:7`, `CubeTarget:70`, `MatrixEditor:48`, `KeyframeCard:4`, `KeyframesEditor:84` — 16 `text-{xl..6xl}` on headings | display/heading hierarchy expressed in raw Tailwind size steps + local `.instrument-serif` rather than the golden-ratio `.text-{display-1..5,title,heading,subheading}` ladder (typography.css `@utility text-display-*`) | `.text-display-2`/`.text-title`/`.text-heading` — **conditionally** (see note) |

**Critical framing:** the demo's display face is **Instrument Serif** (`style.css` `@theme
--font-serif`), deliberately *not* glass-ui's canonical Fraunces (`--font-stack-display`, with WONK 1
/ SOFT 0 axes). The demo does **not** re-point `--font-stack-display`, so applying `.text-display-*`
verbatim would either pull in Fraunces (wrong identity) or require a font-stack override. Per the
project's "distinct/archaic styling is intentional" precept, the Instrument-Serif path is a
*sanctioned brand divergence* — the residue worth flagging is only the **size scale** bypassing the
φ-ladder, not the font. Cleanest reconciliation: a demo-local `.text-display-instrument` that pairs
`--font-serif` with the canon's φ-rung font-sizes/leading (so size hierarchy stays contractual while
the face stays Instrument).

Structural hierarchy is otherwise canon-true: asset/layer lists already use `<Card>/<CardContent>` +
`<Button>` + `<DropdownMenu>` (`AssetLayerPanel.vue` — the `demo/DESIGN.md` "card-based layouts" task
is effectively done), not spreadsheet `<div>` rows.

## Axis 7 — Accessibility resilience

No findings. The demo **reimplements no glass surface** — it consumes canonical tiers
(`.glass-card` at `EasingTarget.vue:4`, `<GlassPanel>` at `EasingCurveCanvas.vue:2`,
`<Slider variant="glass-scrubber">`), so the `prefers-reduced-transparency` / `prefers-contrast` /
`@supports not(backdrop-filter)` fallbacks live in glass-ui and apply for free. No `color-mix` bakes a
light-mode foreground into a dark-unwindable value (the two foreground color-mixes read live
`var(--foreground)`, which auto-darks).

---

## Glass-ui gaps (patterns the demo legitimately needs)

1. **`Menubar` component — MISSING entirely.** glass-ui ships no `ui/menubar` (verified:
   `ls components/ui | grep menubar` → none), forcing the demo to vendor a full 15-file shadcn-vue
   `@/components/ui/menubar/` tree (`Menubar*.vue`), consumed by `AnimationMenuBar.vue`. This drags in
   off-canon class literals (`data-[disabled]:opacity-50` ×3, `rounded-sm`, ad-hoc `text-sm`) that a
   canonical `<Menubar>` would absorb. **Placement:** `glass-ui/src/components/ui/menubar/`, modeled
   on the existing `dropdown-menu` + `context-menu` CVA roots (reka-ui `MenubarRoot`). Highest-value
   gap — removes an entire vendored subtree from the reference consumer.

2. **Tab-trigger shape variants — `pill` + `underline`.** glass-ui's `TabsTrigger.vue` is
   variant-less (one baked baseline). The demo carries `.tab-trigger-{base,pill,underline}`
   (utils.css:8-45) across 5 sites (`EasingScene:43`, `SpringScene:41`, `CubeScene:139`,
   `playground/App:8`, `AnimationControls:170`) and `demo/DESIGN.md` already books "upstream
   tab-trigger-* to glass-ui". **Placement:** a `variant: { pill | underline | ghost }` arm on a
   `tabsTriggerVariants` CVA in `ui/tabs/index.ts`, reading `--surface-tint-8` for the pill-active
   fill (closes drift 1.1 + 2.1 at the root).

3. **`.disabled-base` / `.active-scale` standalone utilities.** The four-state `.interactive-item`
   (utilities.css:97) and the press-only `.tap-squish` (utilities.css:138) exist, but there is **no**
   atomic disabled-only or active-scale-only class — so consumers hand-roll `{opacity:.5;
   pointer-events:none}` (`.is-disabled` utils.css:128, `.btn-playback:disabled` utils.css:73). A
   `@utility disabled-base { opacity: var(--opacity-disabled); pointer-events:none; cursor:not-allowed }`
   would absorb both. (The audit charter names `.disabled-base`/`.active-scale` as if canonical; they
   are not yet — book them.)

   Bonus token-rung: a `--surface-tint-5` rung (between the existing `-4` and `-6`) would snap
   drift 1.2; low priority — `-6` is an acceptable target today.

4. **Ribbon transport-button variant.** The string
   `h-8 … rounded-full gap-2 instrument-serif text-base btn-interactive` recurs at **8 sites**
   (`PlaybackRibbon:36`, `EasingScene:78`, `SpringScene:76,90`, `CubeScene:159,164`,
   `SpringSidebar:50`, + the `RIBBON_BUTTON_CLASS` const at `AnimationControlsGroup:240`). It is a de
   facto button size/shape (`size="ribbon"`: pill, h-8, gap-2). **Placement:** a `ribbon` rung on
   `buttonVariants.size` (button/index.ts) — though the `instrument-serif`/`text-base` half is
   demo-specific, so a *demo-local* shared constant is the lighter fix; the pill+h-8+gap geometry is
   the upstreamable kernel.

## Union candidates

- **Disabled-dim register, three vocabularies, one meaning.** The demo expresses "dimmed/disabled"
  three ways: glass-ui's own `disabled:opacity-disabled` (correct, used by `<Button>`), the demo's
  `.is-disabled {opacity:.5}` (utils.css:128), the vendored menubar's `data-[disabled]:opacity-50`,
  and bare `opacity-50` Tailwind (10 SFCs). **Canonical:** `--opacity-disabled` → the
  `opacity-disabled` utility everywhere; promote a `.disabled-base` class (gap 3) so the non-`<Button>`
  hosts (`.is-disabled`, `IconTooltip` wrappers) have a token-backed handle.

- **Press-scale rung on buttons.** `.btn-playback:active` uses `--scale-press` (0.96) while the canon
  button family + `btn-interactive`/`btn-pill` use `--scale-press-btn` (0.97). Both are tokens; they
  disagree on *which* rung a button press lands. **Canonical:** `--scale-press-btn` for every
  button-shaped surface (tokens.css:921 names it the button/slider value); reserve `--scale-press`
  (0.96) for the `.tap-squish` non-button idiom.

---

**Tally:** drift by axis — A1: 3 · A2: 3 · A3: 2 · A4: 0 · A5: 0 · A6: 1 · A7: 0 (= **9** drift rows,
all low-severity, several rooted in not-yet-upstreamed gaps). Glass-ui gaps: **4** (Menubar component;
tab-trigger pill/underline variants; `.disabled-base`/`.active-scale` + `--surface-tint-5`; ribbon
button size). Union candidates: **2** (disabled-dim register; button press-scale rung). Net: the
reference consumer is near-canon; the real signal is **library additions**, headlined by the missing
`Menubar` component.
