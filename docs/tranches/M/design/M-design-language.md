# M — the design-language spec (the four systems fourier ships)

**Tranche**: M (ordering ξ′) · **Authored**: 2026-06-16 · **Mode**: tranche development only — this is a design-language spec, NOT an implementation phase. No source edits. All file:line citations are read-only references.
**Spine doc**: this is the `design/M-design-language.md` named in `M.md §8` — the substance of the suffusion gestalt. It coheres with the `M.md §4` wave table (M.W5/W6/W7/W8), the `design-synth.json` merged verdict, and the `raw-findings.json` per-dimension corpus (C1–C7, B1–B6).
**Governing invariant**: **inv-33 — design-system-single-source** (`M.md §6`): exactly ONE platform source per axis — the glass-depth band (glass-ui ladder), value.js OKLCH colour, and the Configurator control-pane chassis. Every system below DELETES a bespoke duplicate as it lands the platform idiom; net code DECREASES. The standing ceiling is **audacious-not-gaudy** — proportion is a per-system rule, made concrete in §6.

---

## §0 — The re-grounding the spec is built on (load-bearing, verified at source)

Every prior fourier audit assumed a glass-ui 3.2.0 world. Reality, re-verified at the sibling repos this run:

| Fact | Stale premise | Verified live | Source |
|---|---|---|---|
| glass-ui | 3.2.0 | **4.0.0** (MAJOR over `^3.1.0`) | `npm view`; `web/package.json:glass-ui ^3.1.0` |
| keyframes.js | 3.0.0 | **4.2.0** (two majors over `^2.2.0`) | `web/package.json` |
| value.js | 0.10 | **0.12.0** (over `^0.10.0`) | `/value.js/package.json:version 0.12.0` |
| `glass-subtle` 4.0 successor | `glass-quiet` (~0.50α) — the in-flight dirty-tree rename | **`glass-wash` (~0.30α)** | glass-ui `styles/glass/ladder.css:9` (`wash ~0.30α … was 'subtle'`); `:11` (`quiet ~0.50α … the missing rung`) |
| `--font-serif` / CM | "degrades to Times" | **bound + self-hosted + preloaded** | `web/style.css:14`; `web/public/fonts.css`; `B6-11` |
| Fraunces | (intended display voice) | **vendored + fetched + ZERO `src/` consumers** | `web/public/fonts.css:43-63`; `grep -rln Fraunces web/src` = 0 |
| `/` route | (landing) | **no landing — redirects to `/paper`** (PaperView title page) | `web/src/router/index.ts:39-42`; `B1-01` |
| A-1/A-2/A-3 ConfiguratorLayer asks | BOOK-to-AT (carried I→J→K) | **SHIPPED at 4.0** — `dividers` prop, `.configurator-section-label`, `asideSide` | glass-ui `ConfiguratorLayer.vue:53`, `configurator.css`, `Configurator.vue:86`; `C1-01` |

The in-flight `glass-subtle→glass-quiet` rename in the working tree is **semantically wrong** — it over-weights every touched overlay a full rung. The correction (`→glass-wash`) lands atop the resolved 4.0 dep in M.W1, never standalone. This spec assumes the M.W1 bump has landed; every system below is **adopt + consume + delete**, not invent.

---

## §1 — THE GLASS DEPTH LADDER (M.W5)

### §1.1 — Current quarantined state

Glass is simultaneously **under-applied** (the primary content surfaces are paper "stickers," not glass) and **inconsistently hand-rolled** (raw `box-shadow`/`blur`/`color-mix` bolted onto or instead of rungs). Cited:

- The primary panels import NO glass-ui surface component — `grep` finds only `GlassTimeline`-local + `useClipboard`/`Checkbox`/`Collapsible`; no `Card`, `GlassPanel`, `Dialog` (`C3-05`). The workspace Image panel, all five equation panels, the morph cards are `.cartoon-card` stickers — flat 2px-border offset-shadow, zero translucency (`workspace-1440x900.png`, `equation-1440x900.png`).
- `glass-elevated` — a class glass-ui DELETED at 4.0 — is still live at `PaperSearchDropdown.vue:39` and `EquationView.vue:261` (the coeff popover). It resolves to nothing; both surfaces get NO glass material (`C3-02`).
- The rung choice is ad hoc per surface: floating-toc-bar=`glass-resting` but floating-toc-dropdown=`glass-floating`; eq-panel=`glass-quiet`; filter-panel=`glass-resting` (`GallerySearchBar.vue:80`); search-results=`glass-elevated`[dead]. **No documented depth model** (`C3-08`).
- Hand-rolled glass recipes bypass the ladder: `EquationPanel.vue:124` adds `box-shadow: 0 4px 16px rgba(0,0,0,0.08)` ON a surface that ALSO composes `glass-quiet` (double shadow); `PaperView.vue:592-597` `.mobile-toc-trigger` hand-rolls `color-mix + backdrop-filter: blur(8px)` — a re-implemented `glass-wash` (`C3-06`).
- Text-plate overlays (`ConvergenceLegend.vue:17`, `PaperView.vue:393` overlay-page) compose a bordered/rimmed rung over text, not the `veil-surface` register minted for exactly this (`C3-09`).
- The adaptive bright-bucket + specular catch-light are unused — no `--glass-backdrop`, no `.glass-specular-track`, no `--mouse-*` writes — so glass over the near-white math canvas reads inert and can wash out below AA (`C3-10`).

### §1.2 — The unified system: the frozen three-band depth ladder

The depth BAND, not local taste, picks the rung. Bound to the glass-ui 4.0 ladder (`styles/glass/ladder.css`, five rungs `wash ~0.30α / quiet ~0.50α / resting ~0.65α / floating ~0.80α / overlay ~0.95α`):

| BAND | Semantic role | Rung | Surfaces |
|---|---|---|---|
| **BAND 0** | bare math substrate (the backplate) | NO glass | the math canvas, the paper sheet, the grid/lattice |
| **BAND 1** | in-flow instrument panel | `glass-wash` (ambient) / `glass-resting` (focused-active) | Function/Controls/Coefficients, gallery filter, equation read-surface |
| **BAND 2** | lifted / anchored chrome | `glass-floating` (popover/dropdown/search-results/mobile-toc-dropdown) · `glass-overlay` (true modal-over-modal) | coeff popover, paper search dropdown, dialogs |

The text-plate axis is orthogonal: any text-bearing overlay composes **`veil-surface`** (`cards.css:78` — fill+blur with the box border AND rim STRIPPED), so the legend/overlay-page read as legibility plates, not framed boxes. The rung **owns the material** — no surface carries its own `box-shadow`/`backdrop-filter`/`background` on top of a rung.

The rung-vs-`glass-subtle` correction: the in-flight rename maps to `glass-wash` (the byte-faithful 4.0 successor at `ladder.css:9`), then each site is made INTENTIONAL per the band — ambient secondary chrome (legend, eq-toggle) → `glass-wash`; the equation read-surface → `glass-resting`. Authored off the `ladder.css` rename table, not a find/replace (`C3-01`).

The catch-light: on BAND 1 panels over the bright canvas, declare `--glass-backdrop: light` (engages the `@container style(--glass-backdrop: light)` adaptive-darken at `ladder.css`, lifting muted→ink for AA) and compose **`.glass-specular-track`** (`styles/glass-specular-track.css`) with `--mouse-x/--mouse-y` written on `pointermove` — the iOS-26 illuminate-from-within, the proportional pop. The ergonomic wiring (the `pointermove`→`--mouse-*` rAF-throttled binding) is the **§5 ask `useSpecular`** — fourier composes the CSS track now, consumes the composable when it ships.

### §1.3 — Surfaces mapped

- Workspace: Image/Decomposition panels = BAND 1 `glass-resting` (focused) over the BAND 0 canvas, catch-light wired; error/loading cards leave `cartoon-card` → BAND 1/2 glass (`B2-08`).
- Equation: the 5 panels = BAND 1; the coeff popover (`EquationView.vue:261`) + per-coefficient hover = BAND 2 `glass-floating veil-surface` (retires the dead `glass-elevated`).
- Gallery: filter drawer = BAND 1 `glass-resting`; the gallery cards keep the cartoon register as the DELIBERATE accent (see §6 proportion).
- Paper: the article + sidebar stay BAND 0 cartoon "sheet on a desk" (the deliberate metaphor, `B6-08`); the mobile TOC dropdown = BAND 2; overlay-page + legend = `veil-surface` text-plates.
- Morph: timeline + preview stage + level grid re-skin onto BAND 1 glass (the red stroke reads as floating, `B5-05`).

### §1.4 — Bespoke duplicates DELETED

- The **`.cartoon-card` @utility shim** (`web/style.css:98-111`, `@utility cartoon-card { @apply cartoon-surface }`) — a fourier-local re-bind of a class glass-ui removed at C.W5, carried since D.W4 across seven tranches. **DELETE.** glass-ui 4.0 ships `cartoon-surface` (`cards.css:33` — 2px border + `--shadow-cartoon-md` offset + hover-lift) AND `Card surface="cartoon"` natively. The **25 consumer sites across 15 files** (verified `grep -rn cartoon-card web/src`) migrate: structural cards → `<Card surface="cartoon">`; bare decoration divs → compose `cartoon-surface` directly. The standing no-shims directive is finally honoured (`C3-04`, `C1-09`).
- The local `GlassTimeline.vue`/`ConvergenceTimeline.vue`/`SliderControl.vue` wrappers around the phantom `glass-scrubber` variant → glass-ui's shipped `<GlassTimeline variant="scrubber">` (`C3-07`); the phantom variant itself is dropped in M.W1 (it coerces to `standard` already, `C3-03`).
- The hand-rolled `box-shadow`/`backdrop-filter`/`color-mix` glass recipes at `EquationPanel.vue:124`, `PaperView.vue:592-597`, `ConvergenceLegend.vue:63-79` — STRIPPED; the rung supplies the material (`C3-06`).
- `CanvasOverlayButton.vue` — dead component, 0 consumers — DELETE outright (`M.md §7`).

### §1.5 — Proportion rule

Glass for the floating instrument panels over the math grid; the cartoon-sticker register is the **deliberate accent for primary CTAs/hero cards only** — do NOT glassify everything, do NOT sticker everything. One material source per surface; the specular catch-light intensity is gated to 0 at rest and honours `prefers-reduced-motion`.

### §1.6 — Wave & invariant

**M.W5** (gates on M.W1). Codified by **inv-M1** (glass-depth-band, `design-synth.json`) folded into **inv-33**. Consumer: every panel + card.

---

## §2 — THE φ-TYPOGRAPHY LADDER (M.W6)

### §2.1 — Current quarantined state

Typography is the single most under-realized axis against "large and audacious." Cited:

- The φ-display ladder is **entirely unused**: `grep` finds zero consumers of `text-display*`/`text-hero`/`text-title` anywhere in `web/src`. The largest heading in the app is the paper H1 at `PaperView.vue:354` (`cm-serif text-4xl … md:text-[3.25rem]` ≈ 52px); `.demo-title` is `text-2xl` (`FourierMorphDemo.vue:214`); every heading is a raw ad-hoc Tailwind rung (`C6-F3`).
- **Fraunces is vendored, fetched, and dead** (`web/public/fonts.css:43-63` declares latin + italic woff2; `grep -rln Fraunces web/src` = 0 consumers). The only display glyph (`.fourier-f`) reads glass-ui's `--font-display` = Plus Jakarta Sans (a geometric sans) — the WRONG voice for an editorial-mathematical journal (`C6-F2`).
- **No hero register anywhere**: gallery + equation pages have NO `<h1>` at all (`gallery-1280x800.png`, `equation-1280x800.png`); the most audacious type on any screen is an incidental KaTeX formula (`C6-F4`).
- KaTeX sizing is a hand-tuned em-stack divorced from the ladder: `web/style.css:71` `.katex-display > .katex { font-size: 1.1em }` — a fixed multiplier, no `--type-*` relation (`C6-F6`).
- The **ℱ-glyph sans-clash**: `PaperView.vue:356` `<span class="fourier-f">ℱ</span>ourier Analysis` sits inside an `h1.cm-serif` (Computer Modern). `.fourier-f` reads `--font-display` (glass-ui `typography/utilities.css:77`) = Plus Jakarta Sans — a SANS ℱ dropped into a SERIF headline, reading as a glitch (`B1-04`, `B6-09`).
- Mono micro-labels are hand-rolled magic sizes (`AdminAuditLog.vue:134` `font-mono text-[0.65rem]`) instead of `text-admin-label` (`C6-F5`); canvas-drawn font literals (`labels.ts:50` `bold 44px 'Computer Modern Serif'`) are a parallel hardcoded type system that won't follow the rebrand (`C6-F8`).

### §2.2 — The unified system: the φ-ladder, Fraunces as display voice, KaTeX as a first-class member

The glass-ui 4.0 φ-ladder is the ONE type system (verified `styles/typography/semantic.css`): `text-display-audacious` (peak 352px), `text-hero` (poster register, `--text-hero-{size,leading,tracking}` knobs), `text-display-mega/-5/-4/-3/-2`, `text-display` (=`--type-display-1`), `text-title`/`text-heading`/`text-subheading`, plus `.text-pane-title` (container-query responsive, `typography/utilities.css:92`) and `text-admin-label`/`text-mono-caption`. fourier consumes NONE.

- **CM body voice**: confirm the 4.0 bump does not shadow the chain. `.cm-serif` reads `--font-serif-math` (`typography/utilities.css:65-67`) with a bare `serif` fallback; fourier sets `--font-sans` (`style.css:14`) but the live chain resolves through `--font-serif` and CM is self-hosted + preloaded (`B6-11` — the prior "degrades to Times" claim is corrected; the risk is the bump shadowing the token). M.W6 binds `--font-serif-math: "Computer Modern Serif", …` explicitly through the library's own contract and asserts the token chain post-bump.
- **Fraunces as the display voice**: activate the vendored-dead payload AS `--font-display`. Override glass-ui's Plus-Jakarta default at the consumer boundary — `--font-stack-display: "Fraunces", "Computer Modern Serif", serif` (glass-ui bridges it at `theme/bridges.css:67` `--font-display: var(--font-stack-display)`), driving `font-optical-sizing: auto` + a WONK/SOFT register. Fraunces headlines over a Computer-Modern body is the genuine display↔body pairing the ladder provisions (`C6-F2`, `B1-05`).
- **The ladder applied**: paper hero → `text-display-2`/`text-display-3` (φ-fluid, Fraunces, `text-wrap: balance` retires the hardcoded `<br/>` at `PaperView.vue:356`); the 7 page heads adopt `text-title`/`.text-pane-title` — **gallery + equation gain an `h1`** (an eyebrow+title pair: `.section-label` mono small-caps over `text-display-1`); `.demo-title` → `text-display-1` (`C6-F3`, `C6-F4`).
- **KaTeX as a first-class ladder member**: bind `.katex-display > .katex { font-size: var(--type-title) }` (or a dedicated `--type-math-display` rung) so the centered equation grows with the φ-display clamp and reads as the deliberate hero on the equation route; inline `.katex` stays at `1.02em` to track body (`C6-F6`, `B4-01`).
- **The ℱ-glyph clash fix**: re-point `.fourier-f` at a serif display axis (Fraunces italic) so it harmonizes with the CM-Serif headline; once the whole paper title IS the Fraunces display face, the `<span class="fourier-f">` ornament can be retired into the display line (`B1-04`, `C6-F3`). Reconcile the two ℱ sizes (`typography/utilities.css:77` 1.35em vs `PaperArticleWindow.vue:208` 1.1em) onto a shared `--fourier-f-size` knob (`B6-09`).
- Mono micro-labels → `text-admin-label`/`text-mono-caption` (`C6-F5`); canvas font literals read the resolved `--font-serif-math`/`--font-mono` once into a canvas-font helper (`C6-F8`).

### §2.3 — Surfaces mapped

paper hero (`text-display-2`+Fraunces+KaTeX-hero) · all 7 page heads (gallery+equation gain `h1`) · the morph telemetry readout (oversized mono digits, `B5-06`) · KaTeX display math · the canvas labels (via the resolved-face helper).

### §2.4 — Bespoke duplicates DELETED

- Every magic Tailwind heading literal (`text-4xl`/`md:text-[3.25rem]`/`text-2xl`) → a φ-rung (`C6-F3`).
- The hand-rolled `font-mono text-[0.65rem] uppercase tracking-*` micro-label sites → `text-admin-label` (`C6-F5`).
- The inline `'Computer Modern Serif', Georgia, serif` stack in `EquationModeToggle.vue` → the `cm-serif` utility (`B4-11`); the canvas literal font strings → the resolved-face helper (`C6-F8`).
- If Fraunces is declined, the dead `@font-face` + woff2 DELETE to stop the orphan fetch — but the directive argues KEEP + wire (`B1-05` open question 2).

### §2.5 — Proportion rule

**One audacious moment per surface, not every heading** (the home title / paper hero — `B1-06`). The hero entrance is ONE PRM-gated char-stagger (`useStaggerReveal` / `.char-stagger`, glass-ui `typography/utilities.css`) on the title only — never the body (reading primacy). KaTeX grows to the display register; body metrics (line-height 1.8) stay untouched (`B6-12`).

### §2.6 — Wave & asks

**M.W6** (gates on M.W1). The JS partner to the shipped `.char-stagger` CSS is the **§5 ask `useCharStagger`/`SplitChars`**; the serif-display-tier intent is booked as the `--font-display-serif` design-intent ask. Consumer: the paper + every page head.

---

## §3 — THE ICON-RAINBOW OKLCH COLOUR SYSTEM (M.W7)

### §3.1 — Current quarantined state

The icon palette IS audacious but quarantined; the chrome is near-monochrome cream with exactly ONE pop (the dark-mode gear). Cited:

- The brand mark is six-colour: `web/public/favicon.svg` declares the R-O-Y-G-B-V epicycle gradient **`#ff4444 #ff8800 #ffcc00 #44bb44 #4488ff #8844ff`**. That chroma reaches exactly one surface — the equation n=1..8 legend (`C7-1`).
- The `(1-x)*300` magenta→red sRGB-HSL ramp is **hand-rolled and duplicated in four files**: `transforms.ts:3-6` (`spectrumColor`), `CoefficientsSpectrum.vue:47-48`, `FrequencyGraph.vue:42-43`, and `harmonics.ts:86-87`. sRGB-HSL has non-perceptual lightness, isn't gamut-managed, and has zero relation to the favicon (`C7-3`).
- A **118-line bespoke colour parser** in `web/src/lib/colors.ts` (the file is 117 lines): `cssVarToHex` (`:22`), `hslToHex` (`:56`), `rgbToHex` (`:70`) hand-parse CSS vars — while value.js, already a dependency, ships the colour authority but only `easeInOutSine` is imported (`C7-4`).
- The **`STATIC.rainbow` twin** (`colors.ts:11-18`) is a Tailwind-400 softer set (`#f87171 #fbbf24 #34d399 #60a5fa #c084fc #f472b6`) — different hues from the favicon (magenta-pink not violet, no orange). Two separately-edited rainbows both claim to be "the icon palette"; drift guaranteed (`C7-8`).
- The nav active state flattens all five distinctly-iconed routes onto one `--viz-amber` (`AppHeader.vue:197-198`, `:341-346`) (`C7-2`); the `--viz-amber` light-mode override (`style.css:113-126`) is a D.W4 axe-contrast patch carried D→I.

### §3.2 — The unified system: ONE value.js OKLCH ramp from the favicon's six stops

The favicon stops are the canonical palette; ONE OKLCH ramp is generated once at boot from them via value.js 0.12 (verified exports at `/value.js/src/index.ts:158` `mixColorsN`; `units/color/contrast.ts:90` `safeAccentColor`, `:74` `needsContrastAdjustment`; `units/color/dispatch.ts:164` `color2`, `:348` `interpolateHue`):

- `--icon-ramp-0..5` = `mixColorsN([...six favicon stops], weights, 'oklch', 'longer')` — perceptually-even, gamut-mapped, IDENTICAL to the brand mark. Exported reactively from `colors.ts` the way `VIZ_COLORS` already is.
- A single `harmonicColor(i, total, alpha?)` samples that ramp — imported at the four `spectrumColor` sites, unifying the canvas epicycle hues, the chart legend, and the coefficient spectrum so the visualizer's circles and the frequency graph share the favicon's colours (`C7-3`).
- **Per-route `--route-accent`**: each route maps to one ramp stop (paper=ramp[0] red, visualize=ramp[1] orange, gallery=ramp[2] amber, equation=ramp[3] green, morph=ramp[4] blue, violet ramp[5] reserved for the dark-toggle/logo). The nav active icon + drop-shadow + dropdown is-active tint drive off `--route-accent` (`C7-2`).
- **Contrast-floored by construction**: each accent is clamped against the cream background via `safeAccentColor`/`needsContrastAdjustment` — the same guard that forced the manual `--viz-amber` darken, now systematic (`C7-2`, `C7-4`). The `--viz-amber` local override (`style.css:113-126`) is booked UPSTREAM with a kill-date (the rebaseline folds into glass-ui so all consumers inherit; the local `:root` patch deletes on adopt — `M.md §10`, `chronic_fold`).
- Notation/tier/energy hues source from value.js: the trig/exp/polar pill tints + the energy/tier ramp become value.js triads/interpolated scales (`B4-04`, `B4-05`); the gallery `--tier-featured`/`--tier-saved` tokens (already bridged) surface as proportioned card pops (`C7-6`).

### §3.3 — Surfaces mapped

every accent, swatch, spinner-tint, grid-token · the nav (per-route) · the morph stroke (colour encodes morph state, `C7-5`) · gallery tier flags · hover/focus pops (`color-mix(in oklch, var(--route-accent) ≤8%, transparent)`, `C7-7`).

### §3.4 — Bespoke duplicates DELETED

- The **4 `spectrumColor` copies** (`transforms.ts`, `CoefficientsSpectrum.vue`, `FrequencyGraph.vue`, `harmonics.ts`) → ONE `harmonicColor` (`C7-3`).
- The **118-line parser** (`colors.ts:22-74` `cssVarToHex`/`hslToHex`/`rgbToHex`) → value.js `color2()` (`C7-4`).
- The **`STATIC.rainbow` twin** (`colors.ts:11-18`) → the favicon-derived OKLCH ramp; two computed renditions (display = raw stops, soft = each pulled toward L≈0.7/C×0.7 in OKLCH), zero hand-maintained twin (`C7-8`).
- The hardcoded `#60a5fa` (`HarmonicLevelGrid.vue:203,257`) and Tailwind `text-red-N`/`#ccc` literals → tokens (`C2-11`, `B5-08`).

### §3.5 — Proportion rule

Pops are keyed off the ramp but **bounded**: hover/focus tints ≤8% mix, chapter accents are small chips/rules (not full-bleed fills), chroma lives in the active artifact (the morph stroke, the convergence legend) while controls stay calm. value.js `sampleColorRamp` (the ideal ramp primitive) is **ratified for 0.13.0 but NOT published** (verified absent from `/value.js/src/units/color`); M.W7 uses `mixColorsN` equal-weight as the interim and books `sampleColorRamp` with a hard kill-date = the 0.13.0 publish (`M.md §11` risk 6).

### §3.6 — Wave & invariant

**M.W7** (gates on M.W1). Codified by **inv-M2** (one-colour-source) folded into **inv-33**. The reusable contrast-floored tonal-accent recipe is the **§5 ask `accent-tone`** (fourier re-derives this `color-mix` ~57×). Consumer: every accent, swatch, spinner, grid.

---

## §4 — THE MATH / GRID CHROME (M.W7)

### §4.1 — Current quarantined state

The math motif is strong where it is CONTENT but absent from the CHROME; the grid vocabulary is split across four incoherent implementations. Cited:

- **Five pre-computed per-page Fourier-path assets are orphaned**: `web/src/assets/fourier-paths/{equation,gallery,morph,paper,visualize}.json` exist (verified) but `grep` shows importers ONLY for `sun.json`+`moon.json` (the DarkModeToggle + morph demo). The five route-named decompositions sit unused with the render machinery (`svg-fourier.ts`, `FourierMorphSvg.vue`, `useFourierMorph.ts`) already proven (`C5-1`).
- **Eight duplicated generic border-spin spinners** (`animate-spin rounded-full border-2 border-t-transparent`) at `VisualizationView.vue`, `EquationView.vue` (×2), `EquationPanel.vue`, `GalleryInfiniteGrid.vue`, `AdminAuditLog.vue`, `AdminFlaggedPanel.vue`, `AdminUserList.vue` (verified 8 files) — a featureless ring to represent computing a Fourier decomposition, where the motif literally IS rotating circles (`C5-2`, `C2-03`).
- The grid is split-brain: `placeholder.ts:8-20` (pixel-space 40px line-grid, dead background noise), `grid.ts:29` (live coordinate grid at hardcoded `rgba(150,150,150,0.09)`, mode-blind, near-invisible on cream), `ContourEditorCanvas.vue:292-296` (CSS grid 28px @5%, imperceptible), `GalleryCard.vue:239-251` (16px @4%, sub-perceptible). Three arbitrary pitches (40/28/16px), no shared token (`C4-G1`, `C4-G2`, `C4-G6`).
- `ConvergencePlot`'s grid (`equation/lib/grid.ts`) duplicates the `niceStep` logic of `canvas-drawing/grid.ts:9-14` — two independent "nice step" + "draw grid lines" implementations, the C4-G2 defect doubled (`C4-G8`).
- No dot-lattice / tick-mark mathematical identity at any intersection; the ℱ signature is applied inconsistently (paper has it, morph + others don't — `C5-6`, `B1-04`).

### §4.2 — The unified system: the ℱ/epicycle signature + the math-literate grid

- **The ℱ/epicycle signature**: ONE decorative primitive `EpicycleSignature.vue` takes a `FourierShape` and renders it as a faint large single-stroke ambient watermark (opacity ~0.04–0.08, one per surface, corner/background chrome, never over interactive content), driven off the route name — **consuming the 5 dead per-page assets** with zero new infra; the optional draw-on-enter trace is PRM-gated to the static floor (`C5-1`). The `.fourier-f` signature applies consistently to every route head (`C5-6`).
- **ONE `EpicycleSpinner.vue`**: 2–3 nested rotating circles (the favicon's own concentric-epicycle vocabulary) at differing radii/phase, stroked in the viz palette, PRM → static glyph; the two compute-bound loaders optionally trace a converging partial-sum stroke. **Replaces all 8 spinner sites** (`C5-2`).
- **The math-literate grid**: extend `resolveVizColors()` (`colors.ts:90`) to resolve `--foreground`/`--muted-foreground`, making the grid mode-aware; add **π-tick annotations** at ±π, ±2π, ±½π when the domain is π-rational (reuse `FunctionInput`'s `formatDomain` π-detection); draw a **dot-lattice** (filled 1.5px circles) at mathematically significant intersections (the DFT evaluation points — the dots ARE the sampling grid, not arbitrary pixel divisions) (`C4-G2`, `C4-G7`, `B4-12`). The ConvergencePlot grid draws dots at `(n, amplitude_n)` evaluation points (`C4-G7`).
- **One grid-pitch token**: `--grid-pitch: 24px` at root (divisible by 8, between the current extremes); `ContourEditorCanvas` adopts it directly, `GalleryCard` uses `calc(var(--grid-pitch) * 0.75)`; opacities raised to the 8–10% perceptibility floor (`C4-G4`, `C4-G6`).

### §4.3 — Surfaces mapped

every empty state (gallery/workspace/admin get the epicycle motif as hero glyph, `C5-3`) · every loading spinner · every coordinate grid + the ConvergencePlot · every route head (the ℱ signature) · the HarmonicLevelGrid (true CSS grid, harmonic hues, `C4-G9`, `B5-04`).

### §4.4 — Bespoke duplicates DELETED

- The **8 generic spinner divs** → ONE `EpicycleSpinner` (`C5-2`).
- The **split-brain grid modules** consolidate to a shared `lib/canvas/grid.ts` exporting `niceStep()` + `drawCartesianGrid()`; both `BasisCanvas` and `ConvergencePlot` import it (net code decrease, the token fix applies once — `C4-G8`).
- The bare `placeholder.ts` line-grid is retired into the live `drawGrid()` with a synthetic identity `ViewTransform`, collapsing two grid implementations to one and killing the load-time identity break (`C4-G3`); the empty state becomes an intentional phase-plane diagram (unit circle + Re/Im axes, `C4-G1`).
- The three arbitrary pitches → `--grid-pitch` (`C4-G6`); the hand-rolled inline-SVG info icon (`EquationView.vue:275-278`) → the imported Lucide `Info` or an ℱ glyph (`C5-7`).

### §4.5 — Proportion rule

**Signature, not noise**: the epicycle watermark is opacity ≤0.08, one per surface, never over interactive content; the dot-lattice marks only mathematically significant positions; the section math-glyphs (∑/ℱ) prefix only load-bearing titles, sized to cap-height (`C5-4`). The ambient app-level lattice (if shipped) is opacity ≤0.04 — felt-not-seen (`C5-5`).

### §4.6 — Wave

**M.W7** (gates on M.W1). Consumer: every accent, swatch, spinner, grid, route head.

---

## §5 — THE CONTROL-PANE HIERARCHY (M.W8)

### §5.1 — Current quarantined state — the four-dialect schism

The control panes speak FIVE dialects against ONE platform instrument; the schism is structural — two of three control routes never consume the Configurator chassis. Cited:

- **Only `visualization/*` consumes the chassis** (`VisualizationView.vue:28`, `BasisSelector.vue:5`, `CoefficientsPanel.vue:4`, `ContourSettings.vue:19`). The equation route hand-rolls **`.eq-grid`** (`EquationView.vue:194,335-350`, `grid-template-columns: 360px/1fr` with breakpoint overrides) wrapping `cartoon-card`+`CollapsibleSection` panes; the morph route hand-rolls **`.config-grid`** (`FourierMorphDemo.vue:25,258`, `repeat(3,1fr)`) wrapping three `config-card`s (`C1-02`).
- **Five title idioms**: the canonical `.configurator-section-label` (workspace) vs `ImageUpload.vue:44` `<h3 class="cm-serif text-sm font-semibold">` vs `CollapsibleSection.vue:39` (same) vs `MorphPhaseConfig.vue` `config-card-title` (font-serif `text-lg` weight 400 — a SUB-section that out-shouts a PANE title) vs `EquationPanel.vue:75` `text-sm font-medium` sans. The hierarchy is inverted (`C1-03`, `C1-04`).
- **No unified spacing rhythm** — three hand-rolled `space-y`/`mb`/`gap` systems; the shipped density axis sits entirely unused (no pane passes `density` to any Configurator); section-gap ≈ control-gap so grouping reads only from borders (`C1-05`).
- **ZERO platform dividers**; four off-system separator idioms coexist, including a hand-rolled `.divider-line` INSIDE a ConfiguratorLayer (`ContourSettings.vue:256-262`) — a no-legacy violation in spirit (`C1-07`).
- The `BasisSelector` value-row void: `200`/`1024` numerals float in a bespoke `mb-1.5 justify-end` band ABOVE the slider, orphaned from the control (`BasisSelector.vue:155-167`, `C1-06`); the workspace controls pin aside-RIGHT over the dead stage via three `grid-template-columns` overrides (`VisualizationView.vue:322-329`, `B2-01`); amber (the highest pop) is applied ad hoc via `!important` (`FunctionInput.vue:251-253`) not one-per-pane (`C1-08`).
- The dead `glass-elevated` (§1) + the `cartoon-card` shim are the legacy substrate the dialects ride on (`C1-09`).

### §5.2 — The unified system: ONE Configurator + ConfiguratorLayer instrument

Every control pane is a glass-ui 4.0 `Configurator` + stacked `ConfiguratorLayer`s — verified all the prior asks SHIPPED (`Configurator.vue:86` `asideSide`, `:95` `asideWidth`, `:79` `density`; `ConfiguratorLayer.vue:41` `label`, `:43` `sub`, `:53` `dividers`; `configurator.css` `.configurator-section-label`):

- **Migrate `.eq-grid` + `.config-grid` onto the chassis** — the gestalt root fix from which the rest falls out mechanically. Equation: one Configurator in the left rail, `ConfiguratorLayer label="Function" sub="f(x)"` / `label="Controls"` / `label="Coefficients"`. Morph: one Configurator, three `ConfiguratorLayer`s (Settle Out / Morph / Settle In) (`C1-02`).
- **Title demarcation on the ladder**: every title becomes `<ConfiguratorLayer label sub>`, inheriting `.configurator-section-label` (=`--type-subheading` 20.4px/600), retunable from `--configurator-section-{size,weight}` — one rung, one face (the former A-2 ask, satisfied) (`C1-03`).
- **Density as the ONE rhythm lever**: `density="comfortable"` on desktop Configurators, `density="compact"` on the ~360px rail (or drive `--density` via the shipped `@container style(--density)` companion — zero markup). Sub-section gaps use the `--space-phi-*` ladder glass-ui actually ships (NOT the prior `--space-2`/`--space-4` arithmetic scale, which does not exist in 4.0). Deletes the per-pane `mb-*`/`gap` literals (`C1-05`).
- **`:dividers` for grooves**: pass `:dividers` on the ConfiguratorLayer (the 4.0 prop, the former A-1 ask) for the dark-adaptive `--configurator-divider` inter-row rule; for explicit sub-section boundaries use `.chassis-divider--horizontal` + `bezel-line` (`C1-07`).
- **`asideSide="left"` for DEC-2**: flip the workspace to the LEFT authoring-rail (the former A-3 ask, SHIPPED), DELETE the three `grid-template-columns` overrides (`VisualizationView.vue:322-329`) and the mobile `:deep` stage patch — let the chassis own the geometry (`B2-01`, `B2-04`).
- **One-amber-per-pane**: the two-tier altitude rule — PRIMARY group (the authoring input + the ONE amber-filled control, `:default-open`, highest rung) vs SECONDARY (tuning/inspectors, `:default-open=false`, `glass-wash`, never amber). Exactly one amber control per pane (equation→Compute, morph→Export, workspace→Image); retire the `!important` amber (`C1-08`).
- Per-pane composition: workspace compose-the-void DOM dropzone hero (retires the canvas-painted `placeholder.ts`, `B2-02`); gallery card 3-tier hierarchy + working empty-state CTA (`B3-02`, `B3-03`); equation Compute-button glass treatment + legend de-occlusion + f(x) coherence (`B4-06`, `B4-08`, `B4-09`); morph timeline + spring-native easing + glass reskin (`B5-03`, `B5-05`). Adopt the `inert` a11y + `useTextHighlight` (`/motion`) + native-popover overlay primitives (`D1` cluster).

### §5.3 — Surfaces mapped

equation / morph / workspace / gallery panes.

### §5.4 — Bespoke duplicates DELETED

- `.eq-grid` panel CSS + `.config-grid` + `config-card`/`config-card-title`/`config-card-desc` (`C1-02`).
- **`CollapsibleSection.vue`** (3 sites — `ContourPreview`, `EqCoefficientsPanel`, `FunctionInput`) → ConfiguratorLayer; the `ImageUpload.vue:37-48` `<h3>` mimic → `<ConfiguratorLayer label="Image" sub="source input">` (`C1-03`, `C1-04`, `B2-03`).
- The 3 `grid-template-columns` overrides + the mobile `:deep` stage patch (`B2-01`, `B2-04`); the hand-rolled `.advanced-divider`/`.divider-line` + `FunctionInput.vue:154` `border-t` (`C1-07`); the `BasisSelector` bespoke value-band + `.inline-number` CSS (`C1-06`).

### §5.5 — Proportion rule

Two-tier altitude, one-amber-per-pane — amber stays the single primary signal per pane; density is the rhythm, not hand-tuned magic numbers; the groove is machined (the platform divider), never a flat hairline.

### §5.6 — Wave & asks

**M.W8** (gates on M.W5's glass ladder). The A-1/A-2/A-3 carries are STRUCK (shipped — `chronic_fold`); the remaining asks are the **§5 ask `ConfiguratorLayer header trailing/actions slot`** (a right-aligned reset inside `@click.stop` — retires the parallel `CollapsibleSection` kept solely for its actions slot) and the **`DockIconButton active/pressed` toggle** (`is-active` has no backing paint at 7 dock sites). Consumer: equation/morph/workspace/gallery panes.

---

## §6 — PROPORTION & THE INVARIANT

### §6.1 — How inv-33 binds the four systems

**inv-33 (design-system-single-source)** is the load-bearing thread: it names exactly ONE platform source per axis, and each system above is that source replacing a quarantined duplicate. The four systems are not four independent design decisions — they are four faces of the same act, **suffuse-the-platform-idiom-while-deleting-the-bespoke-fork**:

- **glass-depth band** (§1) — one ladder, the rung owns the material → inv-M1.
- **value.js OKLCH colour** (§3) — one ramp from the favicon, contrast-floored by construction → inv-M2.
- **Configurator control panes** (§5) — one chassis, the title/rhythm/groove inherit → the C1 hierarchy.
- The typography ladder (§2) and the math/grid chrome (§4) ride the same discipline: one φ-ladder (Fraunces+KaTeX), one ℱ/epicycle signature, one grid-pitch token.

Every system **DELETES a bespoke duplicate as it lands the platform idiom — the suffusion and the no-legacy excision are the same act** (`M.md §8`). Net code DECREASES on conformance: the `.cartoon-card` shim (25 sites), the 4 `spectrumColor` copies + 118-line parser + `STATIC.rainbow` twin, the 8 spinners, the `.eq-grid`/`.config-grid`/`CollapsibleSection` dialects, the dead `glass-elevated`/`glass-scrubber` classes all EXIT. inv-33 composes with **inv-30 (platform-over-library, hardened)** — no resurrected dead classes, no phantom variant strings, no parallel re-implementations of shipped primitives.

### §6.2 — "Audacious but not gaudy" made concrete per system

The standing ceiling is a per-system bound, not a slogan (governed by **inv-34 — motion-proportion floor**: PRM-honoured, INP-safe, proportion-ceilinged):

| System | The audacious move | The gaudy ceiling it stays under |
|---|---|---|
| **Glass (§1)** | the specular catch-light illuminating BAND 1 panels over the bright canvas | glass ONLY on the floating instrument panels; the cartoon-sticker is the deliberate accent for CTAs/hero cards, not every surface; one material source per surface; catch-light = 0 at rest, PRM-gated |
| **Typography (§2)** | the Fraunces display hero + KaTeX grown to `--type-title` | ONE audacious moment per surface (the hero), never every heading; the body stays CM at reading metrics; one PRM-gated char-stagger, title-only |
| **Colour (§3)** | per-route `--route-accent` from the icon rainbow; the morph stroke encoding state | hover/focus pops ≤8% mix; chapter accents are chips/rules not fills; chroma lives in the active artifact, controls stay calm; every accent contrast-floored by `safeAccentColor` |
| **Math/grid chrome (§4)** | the per-route epicycle watermark + the EpicycleSpinner + the π-tick dot-lattice | watermark opacity ≤0.08, one per surface, never over interactive content; dots mark only significant positions; ambient lattice ≤0.04 — signature, not noise |
| **Control panes (§5)** | one-amber-per-pane primary signal; the DEC-2 left authoring rail | exactly ONE amber control per pane; density is the rhythm lever (no magic-number gaps); the groove is the machined platform divider |

The proportion rule is itself single-sourced: it is **inv-34** at the engine layer (every motion/colour-pop PRM-collapses to its static terminal state and stays INP-safe) plus the per-system ceilings above. Audacious is the suffusion onto the surfaces that matter; not-gaudy is the discipline that the platform idiom — not local taste — sets the bound.

---

## §7 — The glass-ui asks this spec depends on (booked, never written — inv-16)

fourier consumes glass-ui; it never writes it. Each design system above references its asks by name (booked to `docs/constellation/ADOPTION-ASKS.md` at M.W0, full table at `M.md §10`):

| System | Ask | What |
|---|---|---|
| §1 glass | **`useSpecular`** | pointer-anchored catch-light composable (the `--mouse-*`→`.glass-specular-track` wiring) — fourier composes the CSS track now, consumes the composable on ship |
| §2 type | **`useCharStagger`/`SplitChars`** | the JS partner to the shipped `.char-stagger` CSS (per-glyph split + accessible full-text label) |
| §2 type | **`--font-display-serif` intent** | confirm whether `--font-display` is consumer-overridable for a serif brand, or a distinct serif display slot should exist |
| §3 colour | **`accent-tone`** | a contrast-floored 3-channel tonal accent (`--accent-fill`/`--accent-edge`/`--accent-ink`) from ONE `--tone` (fourier re-derives this ~57×; it IS the colour-pop system) |
| §3 colour | **`--viz-amber` upstream rebaseline** | fold the 3.54:1→4.6:1 contrast fix into glass-ui so all consumers inherit; the local `:root` override deletes on adopt (book-with-kill-date) |
| §4 chrome | **`convergence-reveal` preset** | the canonical "partial-sum settle" motion grammar (shared with the motion-architecture spec) |
| §5 panes | **`ConfiguratorLayer header trailing/actions slot`** | a right-aligned reset inside `@click.stop` — retires the parallel `CollapsibleSection` |
| §5 panes | **`DockIconButton active/pressed` toggle** | an `active?: boolean` prop stamping `aria-pressed`+`data-active` (7 dock sites hand-roll `is-active` with no backing paint) |
| §1/§5 | **`canvas-anchored-overlay`** | a virtual anchor for the 4.0 top-layer popover over `<canvas>` (the coefficient + convergence hovers) |

The A-1/A-2/A-3 ConfiguratorLayer asks are **STRUCK** — all three SHIPPED at glass-ui 4.0 (`dividers`, `.configurator-section-label`, `asideSide`); they become pure fourier-local adoptions in M.W5/W8, never re-booked (`C1-01`, `chronic_fold`).

---

**Coherence note.** This spec is the design substance for M.W5 (glass), M.W6 (typography), M.W7 (colour + math/grid chrome), M.W8 (control panes) — all gating on the M.W1 multi-major bump. The motion substance (the unified `useFourierPlayhead`, the convergence-reveal signature, scroll-driven/View-Transition adoption) is the sibling `design/M-motion-architecture.md` (`M.md §9`). Together they discharge the §0 chronic: the design language authored across five J WC docs and shipped nowhere is, in M, shipped — as four single-sourced systems that delete more than they add.
