# Glass-UI Self-Audit — Design Canon Symmetry

**Run:** 2026-06-01-constellation-ui · **Mode:** SELF-AUDIT
**Target:** `@mkbabb/glass-ui` v3.0.0 @ `21547de6` (its own `src/` + `demo/` audited against its own canon)
**Oracle:** `demo/stories/` + `demo/stories/manifest.ts` (drift *in the oracle* = the canon contradicts itself)

## Scope

Audited `src/components/ui/*` (224 `.vue`), `src/components/custom/*` (56 `.vue`), `src/styles/*` (20 sheets), and `demo/**` (146 `.vue`) against the canonical vocabulary in `tokens.css §0–§19`, `theme.css`, `typography.css`, `glass.css`, `utilities.css`, and `DESIGN.md §L1–§L5`.

**Headline:** the *component* layer is exceptionally token-disciplined — `transition: all` = 0, `rounded-full` = 0 (vs `rounded-pill` ×35), hardcoded `cubic-bezier` = 1 genuine site, ad-hoc heading sizes = 0, no `:deep()` against reka/radix internals. Drift concentrates in (a) three custom widgets that predate the token sweep (`BouncyToggle`, `TypewriterText`, `Aurora`, `MetricRow`), (b) a real **axis-7 partial-glass** pattern (7 sites compose `--glass-blur-*` by hand and miss the canonical a11y brackets), and (c) **the oracle itself drifting** — `demo/` teaches `rounded-full` (26 files) where components teach `rounded-pill`, and the demo's icon-button press idiom disagrees with the library's own `ConfiguratorRow`. The Configurator surface (the dispatch's flagged instance) collapses surface-tier × shape-geometry: it is a `glass-floating` "studio panel" wearing `rounded-card`, not `rounded-panel`.

A note on the dispatch's reference vocabulary: it names `.glass-{subtle,default,medium,elevated}`, `.glass-pill`, `.active-scale`, `.disabled-base`, `.code-badge`, `.inline-pill` — **none of these exist** in the current canon (0 defs each). The tier ladder was renamed `wash/quiet/resting/floating/overlay` (`DESIGN.md §L1`, `tokens.css §8`), press-scale moved to the `--scale-press*` token family + `.tap-squish`, and the badge/pill utilities to `.kbd`/`.metric-pill`/`.input-pill`. Replacements below cite the *live* names, verified by grep.

---

## Axis 1 — Token alignment

| # | Site(s) | Drift | Canonical replacement |
|---|---|---|---|
| 1.1 | `src/components/custom/tabs/BouncyToggle.vue:309` | `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` hardcoded — the *adjacent* line (310) correctly uses `color-mix(in srgb, var(--border) 30%, transparent)` | A `--shadow-*` rung (`tokens.css §7`) or `color-mix(in srgb, var(--foreground) N%, transparent)` per the §L1 recipe. Bakes a light-mode shadow the dark cascade can't unwind (also axis 7). |
| 1.2 | `src/components/custom/typewriter/TypewriterText.vue:238` | `.tw-char--interactive:hover { background-color: rgba(128,128,128,0.15) }` | `color-mix(in srgb, var(--foreground) 8%, transparent)` or `var(--muted)`. Mid-grey literal cannot retint per theme. |
| 1.3 | `src/components/custom/aurora/Aurora.vue:200` | `transition: opacity 600ms ease-out` — inline duration **and** easing | `var(--duration-*)` (`tokens.css §1`) + `var(--ease-out)` / `var(--ease-standard)` (`§2`). |
| 1.4 | `src/components/custom/metric-stack/MetricRow.vue:229,246` | `transition: color 220ms ease-out` (×2) | `var(--duration-normal)` + `var(--ease-out)`. |
| 1.5 | `src/components/custom/scrolling-text/ScrollingText.vue:104` | `cubic-bezier(0.45,0,0.55,1)` hand-rolled in `animation` shorthand (the only genuinely un-tokened bezier in `src/`) | A `--ease-*` token; if a sine-in-out is wanted it deserves a named token (gap below). |
| 1.6 | `BouncyToggle.vue:291,298,307,320,333`; `sortable-list/SortableList.vue:174` (`999px`); `tabs/UnderlineTabs.vue:106` (`0.25rem`); `ui/slider/Slider.vue:355` (`2px`) | hardcoded `border-radius` literals where a radius primitive/alias exists | `999px` → `var(--radius-pill)`; sub-pixel pill geometry → `--radius-{xs,sm}` primitives (`tokens.css §4`). BouncyToggle is the single worst hotspot (5 radius literals + 1.1 + 1.5-class bezel). |

*BouncyToggle.vue:141 `readToken("--ease-apple-spring", "cubic-bezier(...)")` and ContinuousTimeline.vue:770 `var(--ease-apple-spring, cubic-bezier(...))` are NOT drift — the bezier is a defensive fallback arg to a token read.*

## Axis 2 — Utility & @apply hygiene

| # | Site(s) | Drift | Canonical |
|---|---|---|---|
| 2.1 | `demo/stories/{compositions/empty-states.vue:99, compositions/dashboard.vue:115, aurora/PresetPickerRow.vue:46, compositions/hero.vue:177, foundations/intro.vue:65, foundations/icons.vue:84, foundations/shadows.vue:60, primitives/buttons.vue:134,151}` — **9 sites** | The signature **cartoon diagonal-lift** recipe `hover:-translate-x-px hover:-translate-y-px` + `shadow-cartoon` → `hover:shadow-cartoon-hover` is hand-rolled at every call site. No canonical class exists (`.hover-lift*` does *vertical* `translateY`+`--shadow-md/lg`, not the diagonal `-x/-y`+`--shadow-cartoon-hover`). | **Glass-ui gap** (below) — mint `.hover-cartoon` / `.lift-cartoon`. The oracle reinventing its own flagship interaction 9× is the strongest single signal in this audit. |

Component-side @apply hygiene is clean: utilities are authored in `utilities.css` and consumed by class; no consumer `@layer components` redefines a glass-ui layer.

## Axis 3 — Interactive consistency

| # | Site(s) | Drift | Canonical |
|---|---|---|---|
| 3.1 | `src/components/custom/configurator/ConfiguratorRow.vue:91` | icon-button uses `active:scale-[var(--scale-press,0.97)]` — the **generic** `--scale-press` (=0.96) with a *hand-typed* `0.97` fallback that is actually the value of a *different* token. The library's own oracle (`demo/configurator/PresetEditorField.vue:35`, `PresetEditor.vue:118`) uses `--scale-press-btn` (aliases `--scale-press-sm` = 0.97) for the identical icon-button affordance. | `active:scale-[var(--scale-press-btn)]`. `tokens.css:920-921` documents `--scale-press-btn` as "the button + slider recipes consume" it. Self-canon contradiction: component vs oracle disagree on the press token for one widget. |

Otherwise interactive primitives route through `<Button>`/`buttonVariants`, `.btn-pill`, `.interactive-item`, `.focus-ring`, `.tap-squish` — no bespoke hover/press transforms found in `ui/*`.

## Axis 4 — Variant orthogonality & rooting

| # | Site(s) | Drift | Canonical |
|---|---|---|---|
| 4.1 **(dispatch-flagged)** | `src/components/custom/configurator/Configurator.vue:94` | `containerClass` = `"configurator glass-floating rounded-card …"`. Surface-**tier** (`floating`) is correct (`manifest.ts:104` — "Studio-tier … floating glass substrate"), but the **shape geometry** is `rounded-card` (`--radius-2xl`, the *largest* primitive), while `--radius-panel` (`--radius-xl`) exists semantically for exactly this and is consumed 10× elsewhere in `src/`. The code comment even calls it a "studio panel." | `rounded-panel`. A floating *panel* should carry panel geometry — surface tier × shape geometry must stay orthogonal (`DESIGN.md` §Orthogonal variants). **This is the glass-ui-side root of the fourier ConfiguratorLayer's squared-edge / left→right move:** patch the radius axis here at the CVA/container root, not at the consumer leaf. |

`:deep()` discipline is clean: 7 sites in `src/components`, **all** against glass-ui's own internal classes (`.glass-carousel-item` in `GlassCarousel.vue:198-216`); 2 are comments noting prior `:deep()` reaches were *retired* (`ContinuousTimeline.vue:434,738`). Zero `:deep([data-reka*])` / radix-internal reaches. No ad-hoc styling on re-exported reka/shadcn roots.

## Axis 5 — Overlay & motion vocabulary

Strong. `transition: all` = 0 across `src/components` and `demo`. Component `@keyframes` are all domain-specific (`progress-*`, `skeleton-*`, `continuous-dot-*`, `card-*-shrink`, `scrolling-text-pan`) — **none** duplicate the canonical `dialog-in`/`floating-panel-in`/`fade-in`/`scale-in`/`slide-up`/`dock-in`/`shimmer`/`shake`. The only inline-duration motion not bracketed are 1.3/1.4 above (counted in axis 1). `ModalOverlay.vue`'s `scrim-breath` reference is a documented *consumer-supplied* animation hook, not an un-bracketed keyframe. No findings unique to this axis.

## Axis 6 — Typographic & structural hierarchy

Clean. Ad-hoc Tailwind heading sizes (`text-2xl..6xl`) in `src/components` = **0** (the single `text-4xl` hit at `MetricRow.vue:192` is a code comment describing the canonical `.text-title…text-4xl` clamp range). Headings route through `.text-{display-*,title,heading}` (`typography.css`). No mono/kbd reinvention — `.kbd` (`utilities.css:254`), `.section-label`, `.text-mono-*` are used. No structural-only forwarding wrappers found in the audited slice.

## Axis 7 — Accessibility resilience

| # | Site(s) | Drift | Canonical |
|---|---|---|---|
| 7.1 | `ui/slider/Slider.vue:237,255,331`; `custom/timeline/ContinuousTimeline.vue:446`; `custom/timeline/{ScrubberTimeline,SegmentedTimeline}.vue`; `ui/drawer/DrawerOverlay.vue`; `custom/expandable-container/ExpandableContainer.vue` — **7 sites** | **Reimplement a thin glass surface by hand**: `background: var(--surface-tint-6)` + `backdrop-filter: var(--glass-blur-{wash,quiet})` on a track/region element, *without* the `.glass-{wash,quiet}` class — therefore missing the canonical a11y brackets that class carries: `@media (prefers-reduced-transparency: reduce)` (`glass.css:226`), `@media (prefers-contrast: more)` (`:245`), `@supports not (backdrop-filter …)` (`:257`). `grep -c prefers-reduced-transparency` on `ContinuousTimeline.vue` / `Slider.vue` = 0. | These elements can't trivially take `.glass-wash` (they're sub-component tracks), so the honest fixes are either (a) a token-composable "glass track" recipe class, or (b) a shared `@media (prefers-reduced-transparency)` opaque-fallback the substrate exposes for partial-glass composers → **glass-ui gap** below. The blur *token* usage is correct discipline; the missing a11y bracket is the gap. |
| 7.2 | (cross-ref 1.1, 1.2) | `rgba(0,0,0,0.08)` shadow + `rgba(128,128,128,0.15)` hover bake a fixed luminance the dark cascade can't unwind. | `color-mix(… var(--foreground) N% …)`. |

---

## Glass-ui gaps (legitimate needs the library doesn't yet expose)

1. **`.hover-cartoon` / `.lift-cartoon` utility (HIGH — 9 call sites).** The diagonal cartoon lift `transform: translate(-1px,-1px); box-shadow: var(--shadow-cartoon-hover)` on hover, transition bound to `--duration-fast`+`--ease-out`, with `:not(:disabled)` guard — is the library's flagship "sticker" interaction yet has no class. It is hand-rolled at `demo/stories/{compositions/empty-states,compositions/dashboard,aurora/PresetPickerRow,compositions/hero,foundations/intro,foundations/icons,foundations/shadows,primitives/buttons}.vue` (9 sites). The tokens already exist (`--shadow-cartoon-hover` `tokens.css:440`); only the motion recipe is missing. **Placement:** `utilities.css` next to `.hover-lift*` (line ~466) + a `scale-on-hover`-style oracle story. Sibling to the existing `--scale-hover` recipe.

2. **Partial-glass a11y bracket for composers (MEDIUM — 7 sites).** A surface that needs only the *blur+tint* of a tier on a sub-element (slider track, timeline rail, drawer scrim) currently must rebuild it and silently drops the `prefers-reduced-transparency` / `prefers-contrast` / `@supports not(backdrop-filter)` fallbacks. **Placement:** expose either a `.glass-track` composable class or a documented `--glass-fallback-bg-*` token + a shared `@media` block in `glass.css` that any `--glass-blur-*` consumer can `@apply`/include, so composers inherit the §L5 degraded path. Cite `Slider.vue:237`, `ContinuousTimeline.vue:446`, `DrawerOverlay.vue`.

3. **`--scale-press` token-selection clarity (LOW).** `ConfiguratorRow.vue:91` chose the wrong press token (generic `--scale-press` 0.96 + literal `0.97` fallback) where the icon-button idiom wants `--scale-press-btn`. The token family is fine; the gap is a one-line `DESIGN.md`/`tokens.css §11` decision rule ("icon-button & button press → `--scale-press-btn`; whole-surface tap → `--scale-press`") so the choice isn't ambiguous. (Borderline gap vs. axis-3 drift — booked in both.)

4. **Named sine-in-out easing (LOW).** `ScrollingText.vue:104` needs a symmetric ease (`cubic-bezier(0.45,0,0.55,1)`) for its continuous pan; no `--ease-*` token covers it. Add `--ease-sine` to `tokens.css §2` if marquee/pan motion is to stay token-driven.

## Union candidates

1. **`rounded-full` vs `rounded-pill` — the oracle and the consumer slice disagree.** `src/components/*` is pure `rounded-pill`/`--radius-pill` (×35, `rounded-full` ×0), but **the demo oracle uses `rounded-full` in 26 files** (`rounded-pill` in only 6). Since `demo/stories/` is the teaching surface, it propagates `rounded-full` to consumers (including fourier). **Canonical:** `rounded-pill` (maps to `--radius-pill` via `theme.css:216`, which a consumer can retune; `rounded-full` is a hard `9999px` that ignores the token). Normalize the demo to `rounded-pill` so the oracle teaches the token-driven form. Same pattern, two vocabularies inside one repo.

2. **Press-scale token (cross-repo readiness).** `--scale-press` (0.96) vs `--scale-press-btn`/`--scale-press-sm` (0.97) — glass-ui *internally* disagrees (axis 3.1). Resolve to `--scale-press-btn` for button/icon affordances before consumers (fourier, value.js, keyframes) standardize, else each consumer picks a different rung.

---

**Tally:** Axis1 = 6 · Axis2 = 1 (9 sites) · Axis3 = 1 · Axis4 = 1 (dispatch-flagged Configurator) · Axis5 = 0 · Axis6 = 0 · Axis7 = 2 (8 sites) — **11 drift findings.** Glass-ui gaps = **4** (top: `.hover-cartoon` 9-site utility; partial-glass a11y bracket 7-site; `--scale-press` selection rule). Union candidates = **2** (`rounded-full`→`rounded-pill` oracle drift; press-scale token).
