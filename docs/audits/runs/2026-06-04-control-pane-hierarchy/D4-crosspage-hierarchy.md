# D4 — Cross-page visual hierarchy & control-pane idiom consistency

**Dimension**: D4 — cross-page consistency of the control-pane chassis + the primary/secondary hierarchy rule.
**Method**: π visual-runtime baseline (`docs/tranches/J/audit/screenshots/before/`, 7 pages × 3 viewports) read against the real control-pane source. Tranche-development only — folds into J.W5 (WC design wave). No edits.

---

## Verdict (one line)

**The app speaks three different control-pane dialects** — workspace uses the real glass-ui `Configurator`/`ConfiguratorLayer` instrument (caret + cm-serif title + em-dash sub + groove divider), equation hand-rolls `.eq-grid` + `cartoon-card` + `CollapsibleSection`, morph hand-rolls `.config-grid` + bare serif `<h3>` cards with no caret and no sub — and within those three there is **no consistent primary-vs-secondary weight rule**, so on every page "everything is the same weight" and nothing claims the eye first. The single fix is **one chassis (`Configurator`) + one section-title grammar (`label`/`sub`/caret/groove) + one primary-action rule** across all three control surfaces.

---

## The three idioms, side by side (the R3 propagation gap, made concrete at the title level)

The clearest proof is the **literally identical "Coefficients — Fourier spectrum" control group**, which exists in two pages rendered three different ways:

| Surface | Chassis | Section title markup | Caret? | Sub-label | Divider between groups |
|---|---|---|---|---|---|
| **workspace** (`CoefficientsPanel.vue:14`) | `Configurator` → `ConfiguratorLayer label="Coefficients" sub="Fourier spectrum"` | substrate cm-serif title + `— sub` | yes (substrate) | yes (`sub`) | glass-ui groove (substrate) |
| **equation** (`EqCoefficientsPanel.vue:12-13`) | `cartoon-card px-3 py-2` → `CollapsibleSection title="Coefficients" subtitle="Fourier spectrum"` | `cm-serif text-sm font-semibold` + `— subtitle` (`CollapsibleSection.vue:39-40`) | yes (chevron) | yes (`subtitle`) | hand-rolled `border-t border-border/40` (`FunctionInput.vue:154`) |
| **morph** (`HarmonicLevelGrid.vue:2-3`) | `cartoon-card levels-card` → bare `<h3 class="card-title">Harmonic Levels</h3>` | serif `<h3>`, no em-dash | **no** | **none** | none (margin only) |

Three different demarcation systems for the same logical surface. This is the headline cross-page defect: the app does not read as "one instrument with interchangeable faces" — it reads as three apps that happen to share a header.

---

## Findings

### D4-1 (P1) — Three bespoke control-pane chassis; the `Configurator` instrument was never propagated

- **Page/viewport**: `workspace-1440x900.png` (real `Configurator` aside, seen fully in `_seed-workspace-configurator.png` — collapsible `Decomposition`/`Contour`/`Coefficients` layers with caret + monospace sub + groove); `equation-1440x900.png` (a stack of three offset `cartoon-card` panels — `Function`, `Controls`, `Coefficients`); `morph-1440x900.png` (three flat `config-grid` cards + a `Harmonic Levels` card). All three at 1280 and 375 confirm the divergence.
- **Observed**: workspace consumes the glass-ui `Configurator` (`VisualizationView.vue:194`) with `ConfiguratorLayer` children (`ContourSettings.vue:190`, `BasisSelector.vue:120`, `CoefficientsPanel.vue:14`). Equation hand-rolls `.eq-grid` (`EquationView.vue:194`, CSS `:335-350`) and wraps each group in `cartoon-card` (`FunctionInput.vue:93,175`). Morph hand-rolls `.config-grid repeat(3,1fr)` (`FourierMorphDemo.vue:25`, CSS `:258-269`) with `MorphPhaseConfig` cards (`MorphPhaseConfig.vue:2` `cartoon-card config-card`). In the captures the chassis difference is visible at a glance: workspace panels share a continuous layered substrate with hairline grooves between layers; equation panels are three discrete shadowed cards with gaps; morph panels are a 3-up row of equal flat cards. (Matches WC-design-layout R3, `docs/tranches/J/design/WC-design-layout.md:59-63`.)
- **Severity**: P1 — this is the dimension's keystone; it is the root cause of D4-2 and D4-3.
- **Refinement**: propagate the `Configurator` chassis to equation and morph. Wrap each route's controls in `<Configurator>`; lift each control group (`Function`, `Controls`, `Coefficients`; `Settle Out`/`Morph`/`Settle In`, `Harmonic Levels`) into a `<ConfiguratorLayer label sub>` with `<ConfiguratorRow>` for labeled fields — exactly the `BasisSelector.vue:120-207` pattern. Deletes ~60 lines of per-route grid CSS per file and the `cartoon-card` wrappers. **One chassis, three routes.**
- **Owner**: **fourier-local** (consume the primitive the app already ships and already proves on workspace; no glass-ui change needed). Note: this composes with **DEC-2** (aside moves LEFT) — propagating the chassis first means all three routes inherit the `asideSide` lever in one place once K.W4 lands it.

### D4-2 (P1) — No primary-vs-secondary weight hierarchy on any pane: everything is one altitude, one weight

- **Page/viewport**: `equation-1440x900.png` / `morph-1440x900.png` (1440 + 1280 + 375).
- **Observed**: within each pane every group is rendered at the **same z-altitude and same title weight**, so nothing is the obvious primary control. On equation, `Function` (the thing you must edit to do anything), `Controls` (secondary tuning), and `Coefficients` (a read-only inspector) are three identical `cartoon-card`s with identical `CollapsibleSection` titles — the `Compute` primary action is a `Button size="sm" w-full` (`FunctionInput.vue:143-151`) that carries the same visual weight as the secondary `Presets` pills below it. On morph, `Settle Out`/`Morph`/`Settle In` are three identical equal-width cards (`config-grid repeat(3,1fr)`, `FourierMorphDemo.vue:266`) with no indication that the middle `Morph` phase is the conceptual primary; the destructive-ish `Reset` and the primary `Export` sit as a centered pair with `Export` only distinguished by fill (`FourierMorphDemo.vue:70-79`). The eye has no entry point — it scans top-to-bottom because nothing pulls it. (This is the methodology's named "everything the same weight" failure; WC-design-layout §0 Fact-1 diagnoses the flat-altitude cause, `:13`.)
- **Severity**: P1.
- **Refinement**: adopt a **two-tier hierarchy rule** and apply it identically on all three panes:
  - **Primary group** = the authoring input (equation `Function`; morph the `Morph` phase + the `Export` action; workspace `Image` source + `Decomposition`). Render `:default-open="true"`, give it the highest glass rung (`.glass-resting`/`.glass-card` per WC R1) and the one sharp **amber** accent on its primary action button. There is exactly **one** primary action per pane and it is the only amber-filled control.
  - **Secondary groups** = tuning + read-only inspectors (`Controls`, `Coefficients`, `Contour`, the `Settle` phases). Render `:default-open="false"` where non-essential (`Coefficients` already is — `:13`/`CoefficientsPanel.vue:14`), recede to a lower glass rung (`.glass-quiet`), and never carry the amber fill.
- **Owner**: **fourier-local** (default-open flags, rung classes, and a single amber-primary rule are all fourier component/CSS levers). Depends on D4-1 landing the `ConfiguratorLayer` targets first.

### D4-3 (P1) — Three different section-title grammars (caret / no-caret, sub / no-sub, serif h3 / substrate title)

- **Page/viewport**: `equation-375x667.png` (the `Function — f(x)` collapsible title with caret + em-dash sub), `morph-375x667.png` (`Settle Out` serif title + a plain description line, no caret, no sub), `_seed-workspace-configurator.png` (`Decomposition  basis & resolution` substrate title + caret + monospace sub).
- **Observed**: three title systems coexist. (1) `CollapsibleSection` (`CollapsibleSection.vue:36-41`): chevron + `cm-serif text-sm font-semibold` + `— subtitle` in muted small — used by equation. (2) `ConfiguratorLayer label/sub` (substrate): caret + substrate title + monospace `sub` — used by workspace. (3) `MorphPhaseConfig` (`MorphPhaseConfig.vue:3-4`): a serif `<h3 class="config-card-title">` (`text-lg`, `:120-126`) + a separate `<p class="config-card-desc">` description (`:128-132`), **no caret, not collapsible, no em-dash sub** — and `HarmonicLevelGrid` (`HarmonicLevelGrid.vue:3`) uses yet a fourth `<h3 class="card-title">` with no description at all. So "the title of a control group" demarcates four different ways depending on which file you are in. The morph `<h3>` titles are also visually *heavier* (`text-lg` serif) than the equation/workspace collapsible titles (`text-sm`), which inverts the hierarchy — morph's secondary phase cards out-shout the workspace's primary `Decomposition` layer.
- **Severity**: P1 — directly the edict's "proper title demarcation".
- **Refinement**: make `ConfiguratorLayer label/sub` (caret + title + em-dash/monospace sub + glass-ui groove divider) the **single section-title grammar** across all panes. Convert `MorphPhaseConfig`'s `<h3>` + `<p>` into a layer `label="Settle Out" sub="degrades to low harmonics"`; convert `HarmonicLevelGrid`'s bare `<h3>` into `label="Harmonic Levels" sub="…"`. Retire `CollapsibleSection` on the equation route in favour of `ConfiguratorLayer` (they are near-isomorphic — both are chevron + serif-title + em-dash sub — so this collapses two implementations into the platform one; inv-15/NO-LEGACY).
- **Owner**: **fourier-local** for the markup swap. **glass-ui-ASK** only for the **P5 inner-section rounding** (`ConfiguratorLayer` squared inner sections, `_seed-workspace-configurator.png`) — once all three panes route through `ConfiguratorLayer`, the P5 defect's blast radius triples, which *raises the priority* of the glass-ui 3.2.0 / K.W4 fix but does not block the fourier-local consolidation. No `!important` workaround.

### D4-4 (P2) — Inconsistent group dividers: glass-ui groove vs hand-rolled `border-t`/`divider-line` vs none

- **Page/viewport**: `equation-1440x900.png` (a thin `border-t` rule above `Presets`), `_seed-workspace-configurator.png` (the `Advanced` twin-line-ish hand-rolled divider inside Contour), `morph-1440x900.png` (no dividers — pure margin gaps between the 3 phase cards).
- **Observed**: between sub-groups the app draws (a) a glass-ui substrate groove (workspace layer boundaries), (b) a hand-rolled `border-t border-border/40` (`FunctionInput.vue:154`, the Presets divider), (c) a hand-rolled `.divider-line` flex-hairline with an inline `Advanced` label (`ContourSettings.vue:256-263`, CSS `:325-335`), and (d) nothing at all (morph phase cards, separated by `config-grid gap` only). Four divider treatments. The platform already ships the canonical one: the `instrument-rail.css` `data-divider-rule` **twin-line hairline groove** (`node_modules/@mkbabb/glass-ui/dist/styles/instrument-rail.css:68-92`) — a bezel-line α-pair that reads as a machined groove, not a flat 1px line.
- **Severity**: P2.
- **Refinement**: route all intra-pane sub-group dividers through the glass-ui groove (the `data-divider-rule` twin-line, or the `ConfiguratorLayer`'s intrinsic layer divider). Replace `FunctionInput.vue:154` `border-t` and `ContourSettings.vue:256-263` `.divider-line`/`.advanced-divider` with the substrate groove; give morph phase groups the same groove instead of bare gaps. One divider, everywhere.
- **Owner**: **fourier-local** (consume the substrate divider; delete the hand-rolled `.divider-line`/`border-t`). NO-LEGACY: prefer the `divider-rule` groove over the hand-rolled `border-b`.

### D4-5 (P2) — Empty-state void undermines the controls-as-authoring-rail hierarchy (DEC-2 readiness)

- **Page/viewport**: `workspace-1440x900.png` — ~75% of the viewport is a dead grid stage with a small dashed dropzone floating dead-center, while the only live control (the `Image — source input` pane) is a lone card pinned top-**right**. `workspace-375x667.png` shows the mobile inversion: the stage collapses and the `Image` pane sits at the *bottom* under an empty grey expanse.
- **Observed**: with no image, the hierarchy is upside-down — the primary action (upload) is split into a tiny top-right pane AND a dead-center dropzone, with the dominant visual real estate (the stage) doing nothing. The eye lands on emptiness, not on the one thing to do. This is the §A keystone void defect, and it directly fights the DEC-2 intent (controls move LEFT to become an authoring rail). Right now the control pane is a thin right-hand sliver, not a rail; nothing about the empty-state hierarchy says "start here, on the left."
- **Severity**: P2 (the void itself is §A-owned; the D4 angle is that the *hierarchy* doesn't yet support a LEFT authoring rail).
- **Refinement**: when controls move LEFT (DEC-2, gated on glass-ui `asideSide`, K.W4), make the empty-state `Image`/`Decomposition` layer the **primary** rung (amber-accented `ConfiguratorLayer label="Image" sub="source input"` opened by default) and let the stage host a single generous dropzone — so the empty-state hierarchy reads left-rail-primary → stage-secondary, matching the populated state. The §A void-fix composes the dropzone WITH controls-left; D4's contribution is the primary/secondary rule that makes the rail the eye's entry point.
- **Owner**: **mixed** — the `asideSide` LEFT move is **glass-ui-ASK** (K.W4); the empty-state primary-rung styling + generous dropzone is **fourier-local** (J.W5, composed onto §A's void-fix).

### D4-6 (NIT) — Page-level header treatment also diverges (morph has a serif page title; workspace/equation have none)

- **Page/viewport**: `morph-1440x900.png` (a large serif `Fourier Morph` H1 + subtitle, `FourierMorphDemo.vue:5-8`, CSS `:214-233`) vs `workspace-1440x900.png` / `equation-1440x900.png` (no page title at all — the controls begin immediately under the app header).
- **Observed**: morph is the only control surface with a page-level title block. This is a minor cross-page inconsistency in the top-of-pane hierarchy: two routes drop straight into controls, one introduces itself with a serif headline. Not wrong, but it means the "what page am I on / what's primary" cue is present on one route and absent on two.
- **Severity**: NIT.
- **Refinement**: pick one convention. Either give every control route a consistent compact header band (route label + one-line sub, in the same `cm-serif` voice), or drop morph's oversized `demo-header` to match the chassis-internal title hierarchy. Recommend the former — a thin route-header ribbon is cheap and makes the three routes read as faces of one instrument.
- **Owner**: **fourier-local**.

---

## The ONE rule (the deliverable)

**Chassis**: every control surface (workspace, equation, morph) is a single `<Configurator>` whose groups are `<ConfiguratorLayer label sub>` with `<ConfiguratorRow>` fields. No `cartoon-card` panel wrappers, no bespoke `.eq-grid`/`.config-grid`, no `CollapsibleSection`, no bare `<h3>` titles, no hand-rolled dividers. The glass-ui groove (`data-divider-rule`) is the only divider.

**Hierarchy (two tiers, one amber)**:
1. **Primary** = the authoring input + the one primary action. Highest glass rung, `:default-open`, and the **single amber-filled control** on the pane (equation `Compute`; morph `Export`; workspace `Image` upload / `Decomposition`).
2. **Secondary** = tuning + read-only inspectors. Lower glass rung (`.glass-quiet`), collapsed-by-default where non-essential, never amber.

One chassis, one title grammar, one divider, one primary-per-pane. That is the cross-page idiom.
