# J · WC — Design refinement spec: Atmosphere, visual depth & a11y polish

> LENS: Atmosphere · visual depth · accessibility polish. SCOPE: refinement,
> not redesign. The app is stable, built on glass-ui 3.1.0. Every recommendation
> cites a real `web/src/` file:line and the specific glass-ui token/primitive to
> reach for. NO app-src edits in this tranche — spec only. This spec is the
> third leg of J.WC (layout + motion are the sibling specs); it deliberately
> overlaps R2 of the layout spec on the aurora question and resolves the
> aurora/no-aurora tension the motion spec (§5) flagged.

---

## 0 · Diagnosis — what the depth & a11y audit found

Five measured facts drive this spec.

**Fact 1 — the 5-rung glass ladder is unused; "glass" is hand-rolled.** The real
ladder (`.glass-wash → .glass-quiet → .glass-resting → .glass-floating →
.glass-overlay`, shipped in `dist/styles/glass.css`) appears at **zero** sites.
The six "glass-*" hits in `src/` are `glass-subtle` ×4 and `glass-elevated` ×2
(`PaperView.vue:393`, `EquationPanel.vue:70`, `EquationModeToggle.vue:9`,
`ConvergenceLegend.vue:17`, `PaperSearchDropdown.vue:39`, `EquationView.vue:261`)
— **app-local names that are NOT ladder rungs**. The actual translucency is
hand-rolled per-site: `.overlay-btn` (`PaperView.vue:591-597`) writes
`backdrop-filter: blur(8px)` + `background: color-mix(...92%...)` + a literal
`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`. There are **12 hand-rolled
`backdrop-blur`/`backdrop-filter` declarations** across `src/` reinventing what
one ladder rung supplies — each with its own blur radius, its own bg opacity,
its own raw-`rgba` shadow. No two agree, so depth reads as noise.

**Fact 2 — every panel sits at one z-altitude.** Combined with the layout spec's
finding (`cartoon-card` at 21 sites, one flat 2px-border + offset-stamp shadow),
the app collapses a system *designed for layered transparency* into a single
opaque plane. There is no recede (`.glass-wash`/`.glass-quiet`), no float
(`.glass-floating`), no top-of-stack (`.glass-overlay`). A search dropdown, an
inline toggle, and a modal overlay all read at the same depth.

**Fact 3 — atmospheric primitives are 100% unused.**
`grep -rlE "aurora|PaperBackdrop|InstrumentChassis|GlassPanel"` returns nothing.
`dist/` ships every one (`aurora.js`, `paper-backdrop.js`, `glass-panel.js`,
`instrument-chassis.js`). The background is a flat `bg-background … paper-texture`
(`App.vue:24`) — texture, but no field, no depth gradient.

**Fact 4 — `--border-soft` and the shadow-token ladder are bypassed.** glass-ui
ships `--border-soft` (`color-mix(in srgb, var(--border) 45%, transparent)`),
`--border-hairline`, and a `--shadow-{card,cartoon,soft,…}` set (`tokens.css`).
The app instead hand-rolls hairlines as Tailwind opacity literals —
`border-foreground/15`, `/12`, `/8`, `/5`, `border-border/50`
(`GalleryCard.vue:71`, `AppHeader.vue:97`, et al.) — **zero** `--border-soft`
references. Every hairline is a magic number; none is the token.

**Fact 5 — a11y has the right bones but two structural gaps.**
*Strong already*: 60 `aria-label`/`-labelledby` bindings, `role="status"` on
recompute banners (`EquationView`-region), a `role="list"`/`listitem` TOC,
`role="toolbar"` docks, `role="dialog"` modals, and four `:focus-visible` rings
carried in `style.css:136-143`. *The gaps*: (a) **`forced-colors` mode is
unhandled app-wide** — glass-ui's own `utilities.css:976` ships a
`@media (forced-colors: active)` outline restore for `.focus-ring`/`.glass-btn`,
but the app's bespoke focus rings (the 12 hand-rolled blur surfaces, the
`.overlay-btn`, the gallery card) are **box-shadow-based**, and Windows High
Contrast STRIPS `box-shadow` — so keyboard focus *vanishes* on every hand-rolled
surface (a WCAG 2.4.7 failure the app's own custom CSS introduces). (b) the
landmark set is thin: `App.vue:26` has one `<main>` but **no `<nav>` wrapping the
top tab set** (`AppHeader.vue` is a `<header>` with a bare `DropdownMenu`, no nav
landmark), so the primary route-nav is not a landmark.

The thesis: **the app has the *texture* of depth (paper grain, cartoon shadow)
but none of the *system* of depth (the ladder), and it hand-rolls translucency +
hairlines + focus the library already tokenizes — which is also where its only
real a11y regressions live.** The fix is to route depth through the ladder/tokens
and let the library's forced-colors discipline come along for free.

---

## 1 · Aesthetic direction — "frosted instrument glass over a wave field"

The app is a precision instrument (epicycle canvas, 97-page typeset paper, basis
decomposition) on a warm-cream academic substrate. The atmospheric register that
fits — and that the methodology demands (atmosphere + depth over flat fills) — is
**frosted optical glass**: the panels are not opaque cards stamped on paper, they
are *frosted instrument covers* you read the field through. Two registers held in
tension, identical to the layout/motion specs so the three compose:

- **The instrument** — crisp Computer-Modern-typeset chrome (`style.css:14` CM
  Serif, the `ℱ` mark at `AppHeader.vue:68`, Fira Code technical voice). Keep it
  exactly. Distinctive, non-cliché, the typographic equivalent of the subject.
- **The atmosphere** — a single low, slow interference field behind the chrome,
  and panels that float over it on **distinct ladder rungs** so depth is read as
  *graded translucency*, not as N disagreeing blur radii. Dominant tone: the deep
  ink/paper neutrals already in `--background`/`--card`. Sharp accent: the
  existing `--viz-amber` (`style.css:119-127`), already the nav-glow
  (`AppHeader.vue:197`) — promote it to *the* one accent. Dominant-neutral + one
  sharp amber: the methodology's "dominant tones + sharp accents," not
  timid-and-even.

Depth becomes a *vocabulary* (five named rungs) instead of an *accident* (twelve
hand-rolled blurs). That is the whole atmosphere move.

---

## 2 · THE HEADLINE — replace the 12 hand-rolled blurs with the ladder; one field behind

**Surface:** the 12 `backdrop-blur`/`backdrop-filter` declarations + the
`glass-subtle`/`glass-elevated` app-local classes — `PaperView.vue:393,591-597`
(`.overlay-page`/`.overlay-btn`), `EquationPanel.vue:70`,
`EquationModeToggle.vue:9`, `ConvergenceLegend.vue:17`,
`PaperSearchDropdown.vue:39`, `EquationView.vue:261` (`.coeff-popover`),
`AppHeader.vue:54` (the sticky `backdrop-blur-md` header).

**Lever — map each hand-rolled surface to its ladder rung by z-intent:**

| Hand-rolled surface | Rung | Why |
|---|---|---|
| sticky app header (`AppHeader.vue:54`) | `.glass-wash` | recedes, frames, never competes |
| inline toggles / legends (`EquationModeToggle`, `ConvergenceLegend`) | `.glass-quiet` | on-surface, low contrast |
| the equation reading panel (`EquationPanel.vue:70`) | `.glass-resting` | "sits on" the page |
| popovers / search results (`coeff-popover`, `PaperSearchDropdown`) | `.glass-floating` | reads above siblings |
| paper overlay page + its back-button (`PaperView.vue:393,591`) | `.glass-overlay` | top of the stack |

Each rung supplies its own `--glass-bg-*` + `--glass-blur-*` + ladder shadow as
**one class** — deleting the per-site `backdrop-filter` + `color-mix` bg + raw
`rgba` `box-shadow` triplet at every one of the 12 sites. The depth grades
correctly (wash < quiet < resting < floating < overlay) instead of disagreeing,
and the raw-`rgba` shadows (which `forced-colors` strips, Fact 5a) are replaced
by the ladder's tokenized shadows.

**The field (resolving the aurora question):** mount **one** atmospheric layer
behind `<main>` (`App.vue:26`), fixed, `z-[-1]`, `prefers-reduced-motion`-gated.
The motion spec (§5) argued *against* `Aurora` on payload/identity grounds; this
spec agrees for the default and routes the choice by surface:

- **`/visualize`, `/equation`, `/morph`** — where the canvas already implies
  motion — may opt into `@mkbabb/glass-ui/aurora` (`Aurora` + `useAurora`), a
  standalone ≈16 KiB-gzip WebGL chunk the root barrel does NOT transitively reach
  (so paper/gallery never pay for it if lazily mounted), tuned to deep-neutral +
  amber nuclei via `useConfiguratorState<AuroraConfig>` seeded from
  `DEFAULT_AURORA_CONFIG`. Interfering sinusoids behind a Fourier visualizer are
  thematically literal, not decorative.
- **`/paper`, `/gallery`** — the reading + browsing surfaces — use
  `@mkbabb/glass-ui/paper-backdrop` (`PaperBackdrop`, lighter, paper-native,
  no WebGL), preserving the warm-academic identity the motion spec defends.

Either way the stack becomes **field (aurora|paper-backdrop) → grain
(`paper-texture`, kept) → frosted panels (ladder)** — the three-layer depth the
methodology asks for, every layer already shipped, no new dependency.

---

## 3 · TOP REFINEMENTS (each: surface → glass-ui lever)

### R1 — Route every hairline through `--border-soft` *(token discipline + depth)*
**Surface:** the magic-number hairlines — `border-foreground/15` `/12` `/8` `/5`,
`border-border/50` (`GalleryCard.vue:71`, `AppHeader.vue:97,237`,
`HoverCard` separator, et al.).
**Lever:** `--border-soft` (`color-mix(in srgb, var(--border) 45%, transparent)`)
and `--border-hairline` (`tokens.css`). Replace the opacity literals with the
token (`border-color: var(--border-soft)`). One source of truth, dark-mode-aware,
and the hairline weight grades *with* the ladder instead of fighting it. The
`.header-divider` (`AppHeader.vue:237`, a `color-mix(...18%...)` literal) and the
`<hr>` at `:97` are the cleanest first swaps.

### R2 — `GlassPanel` substrate for the route control columns *(depth, idiom)*
**Surface:** the route control columns — the equation left stack, the morph
config grid, the viz configurator's container chrome — currently bare flex/grid
divs (and the layout spec's R3 lifts their *contents* into `Configurator`).
**Lever:** `@mkbabb/glass-ui/glass-panel` (`GlassPanel` — the substrate wrapper).
Wrap each control column in a `GlassPanel` at `.glass-quiet`/`.glass-resting`
tier so the controls sit on a *receding frosted substrate*, with the canvas/stage
floating *above* it on `.glass-floating`. This is the depth gradient between
"controls you set" and "result you read" — currently both are the same flat
plane. Composes cleanly under the layout spec's `Configurator` move (Configurator
inside, GlassPanel as the frame).

### R3 — `forced-colors` focus restore on every bespoke surface *(a11y — WCAG 2.4.7)*
**Surface:** the box-shadow focus rings the app hand-rolls — `.overlay-btn`
(`PaperView.vue:591`), the gallery card ring (`style.css:139`), and every one of
the 12 hand-rolled blur surfaces from §2 that carry a box-shadow focus.
**Lever:** the **headline §2 ladder swap already fixes most of this for free** —
`.glass-btn`/`.focus-ring` are inside glass-ui's `@media (forced-colors: active)`
outline restore (`utilities.css:976-982`), so any surface that becomes a ladder
rung inherits a real `outline: 2px solid Highlight` under High Contrast. For the
residual bespoke rings the ladder doesn't cover, add the *same* media block to
`style.css` (mirror `utilities.css:976`): under `forced-colors: active`, give the
`.sidebar-link`/`.gallery-card`/`.overlay-btn` focus states an
`outline: 2px solid Highlight` (outline survives forced-colors; box-shadow does
not). This closes the only a11y *regression* the app's own CSS introduces.

### R4 — Landmark the primary navigation + the route regions *(a11y — landmarks)*
**Surface:** `AppHeader.vue:54` (a `<header>` whose route-switcher is a bare
`DropdownMenu`, no `<nav>`), `App.vue:26` (one `<main>`, no per-route
`aria-label`).
**Lever:** wrap the tab/dropdown route-switcher in a `<nav aria-label="Primary">`
(native landmark, zero glass-ui cost) so assistive tech can jump to the primary
nav — currently it is undiscoverable as a landmark. Give `<main>` (or each route
root) an `aria-label` keyed to the active route (`AppHeader.vue:34` already
computes `activeTabData.label`) so the main region announces *which* tool is
mounted. Pairs with the existing strong `role` set (Fact 5) to complete the
landmark map; the paper route's `<article>`/`<header>` (`PaperView.vue:351-352`)
already models the pattern.

### R5 — Coarse-target floor on the canvas docks + gallery affordances *(a11y — targets)*
**Surface:** the dense canvas interactive surfaces — `CanvasControlsDock`,
`EditorControlsDock` (no `data-density`/coarse sizing found), the gallery card
select/like buttons (`GalleryCard.vue:92,140`), the 2rem `.overlay-btn`
(`PaperView.vue:591` — **32px, below the 44px coarse floor**).
**Lever:** glass-ui's dock primitives ship a `[data-density]` coarse 44px floor
(CLAUDE.md DockIconButton R0G-6); where the app uses glass-ui `Button`
`size="icon"` inside docks, set the dock `data-density="comfortable"` so coarse
pointers hit the 44px target. For the bespoke `.overlay-btn` (a hand-rolled
2rem/32px circle), bump to `min-h-11 min-w-11` (44px) under `@media (pointer:
coarse)` — the methodology's coarse-target a11y line, and the WCAG 2.5.5 floor
the current 32px misses on touch.

---

## 4 · Performance + accessibility ledger

- **Net CSS *decreases*.** §2 deletes 12 hand-rolled blur triplets + raw-`rgba`
  shadows in favor of single ladder classes; R1 deletes ~6 magic-number hairlines
  for one token. Less local CSS, more system fidelity.
- **One composited field, not N blurs.** The ladder's `backdrop-filter` is the
  same GPU op the app already runs 12×; consolidating to graded rungs does not add
  cost. The aurora (viz routes only) is one lazily-mounted, PRM-gated WebGL chunk
  the root barrel never reaches.
- **Reduced motion + forced colors are *gained*, not added.** The ladder + the
  `forced-colors` restore (R3) come from glass-ui's own discipline
  (`utilities.css:976`); adopting them *removes* the app's silent
  forced-colors focus regression rather than adding surface.
- **No new dependencies.** `aurora`, `paper-backdrop`, `glass-panel`, the ladder,
  `--border-soft`, the forced-colors block all ship in `@mkbabb/glass-ui@3.1.0`
  (`dist/`). Zero install.

---

## 5 · Sequencing & cost

1. **§2 ladder swap** — highest depth payoff, mechanical, deletes 12 hand-rolled
   blurs, and *incidentally fixes most of R3* (forced-colors focus). Do first.
2. **R1** (`--border-soft`) — trivial, token-discipline, parallel-safe.
3. **R3** (residual forced-colors restore) — the a11y close; cheap once §2 lands.
4. **R4** (landmarks) — native HTML, zero glass-ui cost, high a11y payoff.
5. **R5** (coarse targets) — touch-a11y floor.
6. **§2 field** (aurora on viz / paper-backdrop on reading routes) — the visual
   statement; isolated chunk, low blast radius. Do behind the ladder swap.

---

## 6 · Explicit non-goals (refinement discipline)

- **No palette overhaul.** Amber + neutrals already present (`style.css:119-127`);
  the fix is *promoting amber to the one accent*, not new hues.
- **No new fonts.** CM-Serif + Fira-Code is the distinctive pairing; keep it.
- **No surface-look redesign.** The cartoon shadow + cream paper identity stays;
  this spec adds graded *translucency on top of* it (ladder over paper), it does
  not replace the paper register.
- **No canvas/render-pipeline changes.** This lens is atmosphere/depth/a11y only.
- **No aurora on the paper/gallery reading routes** — `PaperBackdrop` there;
  reserve the WebGL field for the motion-implying canvas routes (resolves the
  motion spec §5 tension rather than contradicting it).
