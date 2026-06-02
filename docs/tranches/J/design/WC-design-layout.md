# WC — Design refinement spec: Layout, spatial composition & glass-ui component idioms

**Lens**: Layout / spatial composition / component idioms.
**Scope**: REFINEMENT, not redesign. The app is stable and already built on glass-ui. This spec makes its glass-ui usage **more distinctive, more idiomatic, more performant** by reaching for primitives the app already ships-as-dependency but never uses, and by breaking the predictable two-column stack that repeats across every route.
**Grounding**: every recommendation cites a real `web/src/` file:line and the specific glass-ui lever.

---

## §0 — Diagnosis (what the spatial audit found)

Three structural facts drive this spec.

**Fact 1 — the app reinvents glass-ui's tier ladder as a flat shim.** `cartoon-card` appears at **21 sites across 14 files** (`grep -rn cartoon-card src --include="*.vue"`), and it is not even a glass-ui class — it is a **resurrected dead class** re-bound locally in `web/src/style.css:107-111` (`@utility cartoon-card { @apply cartoon-surface; … }`) after glass-ui retired it at C.W5. Meanwhile the actual glass-ui **5-rung glass ladder** (`.glass-wash → .glass-quiet → .glass-resting → .glass-floating → .glass-overlay`, per CLAUDE.md `glass.css`) is used **6 times total** (`glass-subtle` ×4, `glass-elevated` ×2 — and those two aren't even ladder rungs). The app flattens a system designed for *layered depth* into one undifferentiated 2px-border-plus-offset-shadow card. Every panel reads at the same z-altitude. This is the single biggest idiom gap.

**Fact 2 — the atmospheric/depth primitives are 100% unused.** `grep -rlE "aurora|InstrumentChassis|PaperBackdrop|MetricStack|MetricCell|GlassPanel|HeaderRibbon"` returns **nothing**. The app's background is a flat `bg-background … paper-texture` (`App.vue:24`). glass-ui ships `Aurora` (a standalone ≈16 KiB-gzip WebGL chunk via `@mkbabb/glass-ui/aurora`), `PaperBackdrop`, `GlassPanel`, and `InstrumentChassis` (bezel + groove dividers + region rules) — *exactly* the "atmospheric backgrounds + depth over flat fills" the methodology demands — and reaches for none of them. For a **Fourier visualizer**, an aurora field is not decoration; it is thematically on-the-nose (interfering waves).

**Fact 3 — every route is the same predictable stack.** `VisualizationView` (`.viz-configurator` `grid-template-columns: minmax(0,1fr) minmax(320px,360px)`, lines 322-329), `EquationView` (`.eq-grid` `grid-template-columns: 360px 1fr`, lines 339-350), and `MorphView` (`.config-grid` `repeat(3,1fr)`) are three variations on a symmetric two-column controls|canvas split. No asymmetry, no overlap beyond floating docks, no grid-breaking, no diagonal flow, no generous-negative-space moment. The composition is competent and *predictable* — the methodology's named failure mode.

The good news: **VisualizationView already proves the idiom** — it lifted its left stack into a real glass-ui `Configurator` chassis (`VisualizationView.vue:194`, `BasisSelector.vue:120` `ConfiguratorLayer`). The refinement is to **propagate that one good decision** to the other two routes, swap the flat shim for the real ladder, and add the atmospheric layer the whole app is missing.

---

## §1 — Aesthetic direction

**"Instrument plate on an interference field."** The app is a precision mathematical instrument (epicycle canvas, 97-page typeset paper, basis decomposition) floating over a living wave field. Two registers, held in tension:

- **The instrument** — crisp, machined, *Computer-Modern-typeset*. The existing `cm-serif` display face (`style.css:14`, the `ℱ` ligature logo at `AppHeader.vue:67`) is a genuinely distinctive, non-cliché choice — it is the typographic equivalent of the subject matter. **Lean into it harder**: it is the app's signature and it is currently used only at the logo + headings. The body face should stay the refined CM-Serif/`fira-code` pairing already in place (a characterful display + a monospace technical voice — exactly the methodology's "distinctive display + refined body" pairing, and *not* Inter/Roboto/Space-Grotesk).
- **The field** — an aurora of low, slow, interfering sinusoids behind the chrome, rendered once, GPU-composited, `prefers-reduced-motion`-gated. Dominant tone: deep ink/paper neutrals (the existing `--background`/`--card`). Sharp accent: the existing `--viz-amber` (`style.css:119-127`) — already the app's nav-glow and slider-fill accent; promote it to *the* singular accent so the palette is dominant-neutral + one sharp amber, not timid-and-even.

Depth is the through-line: the instrument panels sit on **distinct rungs of the glass ladder** over the aurora, casting the ladder's intrinsic shadows — replacing the current single-altitude flat-card look with real layered transparency.

---

## §2 — The refinements (each: surface → glass-ui lever)

### R1 — Retire `cartoon-card`; adopt the 5-rung glass ladder for panel altitude *(headline)*

**Surface**: the 21 `cartoon-card` sites (`style.css:107` shim + 14 consuming files: `EquationView.vue:230,239,243,251,308`; `FunctionInput.vue`; `EqCoefficientsPanel.vue`; `ContourPreview.vue`; `GalleryView.vue:312`; morph `MorphShapePreview/MorphPhaseConfig/HarmonicLevelGrid`; `gallery/GalleryCardModal.vue`; etc.).

**Lever**: glass-ui `.glass-wash / .glass-quiet / .glass-resting / .glass-floating / .glass-overlay` (`glass.css`) + the `.glass-card` recipe. Map by *z-intent*, not blanket-replace:

| Current `cartoon-card` role | New rung | Why |
|---|---|---|
| static reading surface (equation card, convergence plot, coeff panel) | `.glass-resting` (or `.glass-card`) | the panel "sits on" the page |
| floating/overlaid (coeff popover already `.glass-elevated` at `EquationView.vue:262`, the recompute status banner) | `.glass-floating` | reads above its siblings |
| modal scrim content (`GalleryCardModal`) | `.glass-overlay` | top of the stack |
| inline sub-cells (gallery selection cells, metric rows) | `.glass-quiet`/`.glass-wash` | recedes |

This gives the app **four distinct altitudes** where it currently has one. Delete the `style.css:107-111` shim at the end (no backwards-compat alias — per the repo's no-legacy posture). Net: less local CSS, real depth, idiomatic.

### R2 — Add the aurora field behind the chrome *(atmosphere/depth)*

**Surface**: `App.vue:24` — `<div class="h-dvh … bg-background … paper-texture">` is a flat fill.

**Lever**: `@mkbabb/glass-ui/aurora` (`Aurora` + `useAurora`). Mount one `<Aurora>` as a fixed `z-[-1]` field behind `<main>`, tuned to the app's palette via `useConfiguratorState<AuroraConfig>` (CLAUDE.md: aurora chrome consumes `useConfiguratorState<AuroraConfig>` with `cloneMode='per-preset'`) seeded from `DEFAULT_AURORA_CONFIG` and re-tinted to deep-neutral + amber nuclei. It is a standalone ≈16 KiB-gzip chunk that the root barrel does NOT transitively reach (CLAUDE.md subpath-sizes note), so it costs nothing to non-viz routes if lazily mounted. Gate behind `prefers-reduced-motion` (the app already respects PRM throughout, e.g. `VisualizationView.vue:310`). **Keep `paper-texture` as a grain overlay on top** — aurora (field) + paper-grain (texture) + glass panels (instrument) is the three-layer depth stack the methodology asks for, and every layer already ships.

**Variant**: if a full WebGL field is too much for the paper-reading route, use `PaperBackdrop` there instead (lighter, paper-native) and reserve `Aurora` for `/visualize`, `/equation`, `/morph` where the canvas already implies motion.

### R3 — Propagate the `Configurator` chassis to Equation + Morph routes *(idiom consistency + grid-break)*

**Surface**: `EquationView.vue:194-216` (`.eq-grid` + raw `.eq-panel-left` flex stack of `FunctionInput` + `EqCoefficientsPanel`) and `MorphView` `.config-grid repeat(3,1fr)` (`FourierMorphDemo.vue:258`) both hand-roll the controls stack that `VisualizationView` already solved with `Configurator`/`ConfiguratorLayer` (`VisualizationView.vue:194`, `BasisSelector.vue:120`).

**Lever**: wrap each route's left controls in `<Configurator>` and lift each control group into a `<ConfiguratorLayer label sub>` with `<ConfiguratorRow>` for labeled fields (exactly the `BasisSelector.vue:120-206` pattern). One chassis, three routes — the app reads as a *single instrument with interchangeable faces* instead of three bespoke layouts. Removes ~60 lines of per-route grid CSS per file.

### R4 — Break the symmetric split: asymmetric stage with an overlapping instrument rail *(unexpected composition)*

**Surface**: the three routes' symmetric `1fr | 360px` two-column grids (`§0 Fact 3`).

**Lever**: `InstrumentChassis` + `RegionDivider` (`@mkbabb/glass-ui/instrument-chassis`, currently unused). Re-cast the canvas/result stage as an `InstrumentChassis` with a *bezel* and *groove dividers* between regions, and let the controls dock **overlap the chassis edge** rather than sit beside it in a clean column (the `CanvasControlsDock` floating anchor at `VisualizationView.vue:210` already does this for one dock — generalize the move). Concretely: shift the controls aside to a **narrower rail that the stage bezel under-laps**, with the stage given the dominant golden-ratio share (≈1.618:1, honoring the design system's golden-ratio identity) instead of the round `360px`. This is asymmetry + overlap + the system's own √φ proportion — grid-breaking that is *on-brand* rather than arbitrary.

### R5 — Promote amber to the singular accent + one orchestrated page-load stagger *(color discipline + high-impact motion)*

**Surface**: accent color is applied ad-hoc (`--viz-amber` nav glow `AppHeader.vue:197`, slider fills `BasisSelector.vue:176`, but tier badges in `EquationView.vue:285-291` invent their own per-tier colors). Page load is a scatter of per-component `slide-down`/`fade`/`panel-swap` transitions (`VisualizationView.vue:426-440`, `EquationView.vue:444-452`).

**Lever**: (a) **Color** — route per-tier/per-section accents through the existing `--viz-amber`/`--section-color-*` token set as the *one* sharp accent over dominant neutrals; stop minting inline `color-mix` accents (`EquationView.vue:286-290`). (b) **Motion** — replace the scattered per-panel transitions with **one** `useStaggerReveal` / `useStagger` orchestration (glass-ui `composables/motion/`, root-barrel-reachable, currently unused) so each route's panels cascade in on mount as a single composed gesture — the methodology's "one orchestrated staggered page-load beats scattered micro-interactions." The `ConfiguratorLayer`s from R3 are the natural stagger targets.

---

## §3 — Sequencing & cost

1. **R1** (ladder swap) — highest idiom payoff, mechanical, deletes local CSS. Do first.
2. **R3** (Configurator propagation) — unlocks R4/R5 stagger targets; medium effort.
3. **R2** (aurora) — high visual payoff, isolated chunk, low blast radius. Parallel-safe.
4. **R5** (accent + stagger) — polish pass once R3 lands the layers.
5. **R4** (asymmetric chassis) — boldest, highest effort; the composition statement. Do last, behind the others.

Every lever is a primitive glass-ui **already ships and the app already depends on** — net code is expected to *decrease* (shim + per-route grid CSS deleted) while depth, distinctiveness, and idiom-fidelity increase. No new dependencies; performance improves (one composited aurora + the ladder's GPU-friendly transforms replace N hand-rolled card shadows).

---

## §4 — Out of scope

- No new fonts (CM-Serif + fira-code is already the distinctive pairing; the fix is *more* of it, not different).
- No palette overhaul (amber + neutrals already present; the fix is *discipline*, not new hues).
- No canvas/render-pipeline changes (this lens is layout/composition only).
- The CRUD/remix backend (J.W1) is orthogonal; this spec touches only `web/src/` chrome.
