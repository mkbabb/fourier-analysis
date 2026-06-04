# WC — Design refinement spec: Control-pane hierarchy — title demarcation, rhythm, dividers & the one idiom

**Lens**: Hierarchy of the **control panes** — the configurator / settings / panel surfaces. Title demarcation, spacing rhythm, horizontal-line / divider rule, and the single cross-page control-pane idiom (primary/secondary altitude).
**Scope**: REFINEMENT, not redesign. The control panes are built; the workspace already proves the right chassis (`VisualizationView.vue:194` `Configurator` + `ConfiguratorLayer`). This spec makes the panes read as *one machined instrument with interchangeable faces* by propagating the one good decision the app already made and retiring the four bespoke dialects that grew up beside it.
**Grounding**: every refinement cites a real `web/src/` file:line, the glass-ui lever it consumes, and a before-capture under `docs/tranches/J/audit/screenshots/before/`.
**Lineage**: this lens is the synthesis of the four 2026-06-04 control-pane auditors (D1 title, D2 rhythm, D3 dividers, D4 cross-page; reports under `docs/audits/runs/2026-06-04-control-pane-hierarchy/`). It composes WITH — does not re-litigate — `WC-design-layout.md` R3 (chassis propagation) + `WC-design-typo-color.md` #1 (the type ladder). Where those name the *what*, this lens names the *control-pane hierarchy grammar* on top.

---

## §0 — Diagnosis (what the four auditors found, de-duplicated)

The four lenses converge on one root cause, refracted four ways. **The app speaks four control-pane dialects, but only one of them is the platform instrument.** The workspace consumes the real glass-ui `Configurator`/`ConfiguratorLayer`; equation hand-rolls `.eq-grid` + `cartoon-card` + `CollapsibleSection`; morph hand-rolls `.config-grid repeat(3,1fr)` + bare serif `<h3>` cards; and `ImageUpload` — the *only* titled pane in the empty workspace — hand-rolls an `<h3>` that mimics, but is not, a `ConfiguratorLayer`. From that one schism flow four observable failures.

**Fact 1 — FIVE mutually-inconsistent title idioms; the canonical one is never propagated.** The same group ("Coefficients — Fourier spectrum") renders three ways, and across the panes the section title is set five different ways:

| Idiom | Site | Treatment |
|---|---|---|
| **canonical** — `ConfiguratorLayer label/sub` | `BasisSelector.vue:120`, `CoefficientsPanel.vue:14` | serif label + monospaced em-dash sub, inline |
| hand-rolled `<h3>` mimic | `ImageUpload.vue:43` | `cm-serif text-sm font-semibold` — looks like the canonical, isn't |
| `CollapsibleSection` span | `CollapsibleSection.vue:39` (equation rail) | `cm-serif text-sm font-semibold` — coincidentally matches, drifts on any change |
| morph `config-card-title` | `MorphPhaseConfig.vue:120-125` | `var(--font-serif) text-lg font-weight:400`, desc **stacked** below — bigger, lighter, two-line |
| `EquationPanel` overlay | `EquationPanel.vue:75` | `text-sm font-medium text-foreground` — **sans-serif**, no sub, reads as a body label |

The fifth (morph) is the most damaging: at `morph-375x667.png` the `text-lg` serif "Settle Out" sub-section title is visually **heavier** than the workspace's own `text-sm` pane titles — hierarchy inverted, the secondary phase card out-shouts the primary Decomposition layer.

**Fact 2 — no token for the section-title rung; every title is a magic literal.** `text-sm font-semibold` is hard-coded at `CollapsibleSection.vue:39` + `ImageUpload.vue:43`; `text-lg font-weight:400` at `MorphPhaseConfig.vue:122-125`; `text-sm font-medium` at `EquationPanel.vue:75`. `style.css` carries **no** section-title token (only the `cartoon-card` shim at `:107` and the `--section-color-*` ramp at `:121-126`). `WC-typo #1` wants every header cascaded onto the glass-ui `text-title`/`text-heading` ladder — five hard-coded copies leave no single lever to do it.

**Fact 3 — the section-gap ≈ the control-gap, so grouping reads only from borders, never from rhythm.** Three routes run three hand-rolled spacing systems, none reading glass-ui's shipped density axis: equation gaps panes AND controls at 12px (`FunctionInput.vue:91,95` — `space-y-3` at both levels), morph at 16px vs 12px (a 4px delta, `FourierMorphDemo.vue:267` vs `MorphPhaseConfig.vue:135`). The "section gap = 2× control gap" rule is honored nowhere — and at 375 the ratio **inverts**: `eq-grid` drops to 4px between panes while controls stay 12px inside them (`EquationView.vue:336` vs `FunctionInput.vue:91`). Meanwhile glass-ui's four-rung density axis (`tokens.css:953-961`, `ConfiguratorRow density`) ships **entirely unused** — fourier passes no `density` prop at `BasisSelector.vue:154,181`, `ContourSettings.vue:190`, `CoefficientsPanel.vue:14`.

**Fact 4 — ZERO instances of the platform divider; four off-system separator idioms coexist.** The glass-ui twin-line hairline groove (catch-light `rgb(255 255 255 / 0.10)` over under-shadow `rgb(0 0 0 / 0.12)` — the documented "one idiom every divider uses", `instrument-rail.css:68-110`, `instrument-chassis.css:228-278`) appears **nowhere** in the control panes. In its place: (a) the saturated teal→pink gradient bar under the workspace image reads as a divider but is heavier and squared (`_seed-workspace-configurator.png`, and it is P5); (b) `FunctionInput.vue:154` a flat `border-t border-border/40`; (c) `ContourSettings.vue:256-262` a hand-rolled `.divider-line` pair flanking an "Advanced" label; (d) absent everywhere else — workspace `ConfiguratorRow`s run *flush* (the row primitive emits only gap/padding, no rule). The eye gets four different boundary signals at four weights, none machined.

**The good news, restated from WC-layout §0**: the workspace already proves the idiom. This lens is the **propagation grammar** — what the title, the rhythm, and the rule must be once the chassis lands on all three routes.

---

## §1 — Aesthetic direction (the control-pane register)

**"One instrument face, machined the same way thrice."** A control pane is a *plate on the instrument* — it must read top-to-bottom as: pane title (the region label) → grouped controls (rows on the density grid) → a machined groove where one sub-region ends and the next begins. Never a loose stack of floating cards at one altitude; never a wall of flush rows the eye cannot parse.

Three registers, held in tension with the layout lens's "instrument plate on an interference field":

- **The title is the bezel-engraving** — serif label + monospaced em-dash sub, one rung, one face (CM-Serif, per `WC-typo #1`'s promotion of the ladder). It announces the region; it never competes with the page hero, and a *sub*-section title never out-weighs a *pane* title (the morph inversion is the cardinal sin).
- **The rhythm is the machinist's grid** — a single 6-step scale where the section boundary is legible from whitespace *before any label or rule is read*. Control gap and section gap are not two numbers a designer tunes per route; they are one ratio (2×) driven from two tokens, structural at every breakpoint.
- **The rule is the groove, not the scratch** — every intra-pane boundary is the platform twin-line groove (catch-light over under-shadow, reading as a machined channel), never a hand-rolled flat 1px line. NO-LEGACY: the groove ships; fourier consumes it; fourier does not draw its own hairline beside it.

---

## §2 — The canonical patterns (the four rules the panes must obey)

Each rule states the **one** pattern, its consuming surfaces, the glass-ui lever, and the owner partition. The partition is load-bearing: **fourier consumes glass-ui primitives; it never hand-rolls them and never `!important`-overrides a glass-ui internal** (the forbidden P5 workaround — inv-16, NO-LEGACY).

### R1 — TITLE: one primitive, one rung — `ConfiguratorLayer label/sub`, bound to a token *(headline; fourier-local + one glass-ui-ASK)*

**The pattern.** Every control pane is titled by exactly one primitive: `<ConfiguratorLayer label="…" sub="…">` — `label` is the large/semantic serif region name (`.d.ts:35-36`), `sub` is the small/monospaced em-dash clause (`.d.ts:37-38`). No pane hand-rolls an `<h3>`; no pane invents a third scale; no sub-section title out-weighs a pane title.

**Surfaces → fix.**

| Surface | Today | Refinement | Owner |
|---|---|---|---|
| `ImageUpload.vue:43` hand-rolled `<h3>` | bare cartoon-card, the lone titled pane in the empty state, floats above the chassis with a seam | convert to `<ConfiguratorLayer label="Image" sub="source input" :default-open>`; drop the `<h3>` + cartoon-card; the ImagePlus icon (if kept) moves into the canonical title slot | **fourier-local** |
| `MorphPhaseConfig.vue:3-4,120-132` `config-card-title` (text-lg/400, stacked desc) | a third, *heavier* title scale that inverts hierarchy at 375 | re-cast each phase card as `<ConfiguratorLayer label="Settle Out" sub="shape degrades to low harmonics">`; retire `config-card-title`/`config-card-desc` | **fourier-local** |
| `CollapsibleSection.vue:39` (equation rail: Function / Controls / Coefficients) | a fourier-local wrapper that *coincidentally* matches; drifts on any change | migrate the equation rail to `Configurator` + `ConfiguratorLayer` (WC-layout R3); retire `CollapsibleSection` at the three sites | **fourier-local** |
| `EquationPanel.vue:75` overlay "Equation" | sans-serif `font-medium`, no sub — reads as a body label | bring into the title voice: serif + the title rung + an em-dash sub ("Equation — simplified Fourier") | **fourier-local** |
| `BasisSelector.vue:138` basis pill row | renders directly under the layer label with no group heading, though `sub` promises two groups | wrap the pill row in `<ConfiguratorRow label="Basis">` (the pattern it already uses at `:154,:181` for Harmonics/Sample Points) so the body reads Basis → Harmonics → Sample Points | **fourier-local** |

**The ONE rung (the missing lever).** Today the title size/weight is a magic literal at every site and `style.css` has no section-title token (Fact 2). The fix is to bind the `ConfiguratorLayer` `label` to the glass-ui `text-title`/`text-heading` ladder utility and the `sub` to the mono micro-rung (`WC-typo #1`), so **one token change restyles every section title**. fourier consuming the ladder on its own headers is fourier-local; but if the cascade needs `ConfiguratorLayer` to *expose* its label/sub typography as a token hook (rather than fourier reaching inside the component), that hook is a **glass-ui-ASK** — see ADOPTION-ASK A-2.

> **Resolution of the D1/D4 overlap**: D1-6 and D4-3 both call for "one title grammar"; they are the same finding. The canonical grammar is `ConfiguratorLayer label/sub` + the ladder rung. `CollapsibleSection` is retired by chassis adoption (WC-layout R3), not shimmed in parallel.

### R2 — RHYTHM: one 6-step scale, section-gap = 2× control-gap, via the density axis *(fourier-local)*

**The pattern.** Control panes use one spacing scale; the *group boundary is visible from whitespace alone*. Two tokens drive the whole pane:

- **control gap** = `--space-2` (8px) — between rows inside a group.
- **section gap** = `--space-4` (16px) — between groups / sub-sections — **exactly 2× the control gap, at every breakpoint**.

Because the ratio is structural (one token is 2× the other), it cannot invert on mobile: if controls tighten under the compact rung, sections tighten proportionally and never fall below the control gap (kills the `eq-grid` 4px-vs-12px inversion, `EquationView.vue:336`).

**Adopt the shipped density axis instead of hand-rolling `mb-*`.** glass-ui ships a four-rung axis (`--configurator-row-gap/py-{mobile,compact,comfortable,spacious}`, `tokens.css:953-961`) cascaded `Configurator → ConfiguratorRow` (`density` prop, `.d.ts:44-53`; `comfortable` = the silent default). fourier passes **no** density today, so every row sits at the implicit `comfortable` and the temptation is to hand-roll per-row margins. Set `density="comfortable"` on desktop and `"compact"` under the ~360px rail, from the route context. The four shipped rungs cover the need — **no glass-ui change required.**

**Surfaces → fix (all fourier-local).**

| Surface | Today | Refinement |
|---|---|---|
| `BasisSelector.vue:155-167` value-row | a bespoke `mb-1.5 flex justify-end` band *above* the slider splits one control into two bands with a ~24-32px void; "200"/"1024" read as orphaned numbers (`_seed-workspace-configurator.png`) | drop the bespoke value-row; render Harmonics/Sample Points through the `SliderControl` chassis (label + inline numeric on one `justify-between` line, `SliderControl.vue:65-91`) or move the input into `ConfiguratorRow`'s value slot — collapses ~3 bands to label+value+track |
| equation rail `FunctionInput.vue:91,95,177` | `space-y-3` at *both* section and control level → grouping invisible | control gap `--space-2`, section gap `--space-4` |
| morph `FourierMorphDemo.vue:267` / `MorphPhaseConfig.vue:135` | cards 16px vs fields 12px (4px delta); cards over-loose, `text-base` labels | descriptions `--space-2` below title, fields `--space-3` apart, labels to `text-sm` to match the slider chassis; tighten (not loosen) on mobile via the compact rung |
| `ContourSettings.vue:380-382,413` | five bespoke literals in one pane (0.625/0.75/0.5/0.25/0.125rem) | replace grid gaps with `--space-2`/`--space-3`; slider stack inherits control-gap via the density axis |
| `HarmonicLevelGrid.vue:159-226` | a third independent 0.5/0.75rem rhythm | control gap `--space-2`; the controls→preview separation `--space-4` (it is a section boundary, earns the 2×) |

> **Resolution of the D2 internal overlap**: D2-3/D2-5 (gap ratio + mobile inversion) and D2-2 (unused density axis) are two halves of one rule — the 2× ratio is *expressed through* the density axis, not alongside it. D2-1 (value-row void) is the highest-severity instance and leads.

### R3 — DIVIDER: one rule — the platform twin-line groove, never a hand-rolled hairline *(mixed: fourier-local at slot sites, glass-ui-ASK for the inter-row case)*

**The pattern.** Every intra-pane boundary that needs a rule is the glass-ui twin-line groove — a catch-light hairline over an under-shadow hairline, reading as a machined channel, dark-mode-aware (`instrument-rail.css:68-116`, `instrument-chassis.css:228-278`). fourier never draws a flat `border-t`/`border-b`/`.divider-line` beside it (NO-LEGACY).

**The partition is sharp, and the auditors slightly over-claimed it — here is the truth.** The groove ships two ways, and only one is consumable today:

1. **Explicit-slot groove — SHIPS NOW, fourier-local.** `.chassis-divider--horizontal` with `<span class="bezel-line top"/><span class="bezel-line bottom"/>` is a documented public recipe (`instrument-chassis.css:228,236,252,275-276`). fourier can slot it between stacked elements **today** with no glass-ui change. This covers the *explicit* divider sites:
   - `FunctionInput.vue:154` `border-t border-border/40` → slotted `.chassis-divider--horizontal` (the only divider in the equation rail) — **fourier-local**.
   - `ContourSettings.vue:256-262` `.advanced-divider`/`.divider-line` → keep the "Advanced" label pattern, rebuild the lines from `bezel-line.top`/`.bottom` — **fourier-local**.
   - The scattered off-system separators that act as section rules — `ConvergenceLegend.vue:28,66`, `GalleryDraftsSection.vue:70` `border-t`, `AnimationControls.vue:115` `border-b` — migrate to `.chassis-divider`/`bezel-line`. *Leave input/tab underlines* (`BasisSelector.vue:217,227`, `EasingPicker.vue:51`) as affordance borders — the groove would be wrong there. — **fourier-local**.

2. **Implicit inter-row groove — DOES NOT SHIP, glass-ui-ASK.** The workspace `ConfiguratorRow`s run flush because **`.configurator-layer` emits no divider rule and `.configurator-row` emits only gap/padding** (confirmed: grep for a `.configurator-layer` divider/border returns nothing). The auto-groove `data-divider-rule` lives **only on `.instrument-rail`** (`instrument-rail.css:68`), not on the Configurator chassis. So the cleanest fix — "adjacent `ConfiguratorRow`s auto-groove" — requires glass-ui to add a `data-divider-rule` (or equivalent) opt-in to `ConfiguratorLayer`/`ConfiguratorRow`. That is **glass-ui-ASK A-1**. fourier must NOT hand-roll a hairline between rows as a stopgap (NO-LEGACY); until A-1 lands, intra-layer separation comes from rhythm (R2) and the explicit `.chassis-divider` at genuine sub-section boundaries.

> **Resolution of the D3/D1-7/D4-4 overlap and the over-claim**: D3-1 proposed "wrap the row stack in `instrument-rail[data-divider-rule]` *or* slot a `.chassis-divider`". The first half is wrong as stated — you cannot retrofit `.instrument-rail`'s sibling-rule onto a `ConfiguratorLayer` without restructuring the chassis, and that restructuring is glass-ui's to make (A-1). The *correct* fourier-local move today is the explicit `.chassis-divider--horizontal` slot at real sub-section boundaries; the *auto* inter-row groove is the ASK. This lens splits D3-1 into the two owners accordingly.

### R4 — IDIOM + HIERARCHY: one chassis, one primary-action rule *(mixed)*

**The pattern.** All three control routes consume the one chassis (`Configurator` + `ConfiguratorLayer` + `ConfiguratorRow`, per WC-layout R3 — referenced, not re-litigated). On top of the shared chassis, **every pane obeys one two-tier altitude rule** so the eye has an entry point (today every group reads at one altitude, one weight — `equation-1440x900.png`, `morph-1440x900.png` are flat walls of equal cards):

- **PRIMARY group** = the authoring input + the one primary action. `:default-open`, the highest glass rung (`.glass-resting`/`.glass-card`, WC-layout R1), and **the ONLY amber-filled control on the pane** (equation → Compute; morph → Export; workspace → Image/Decomposition). Exactly one primary per pane.
- **SECONDARY group** = tuning + read-only inspectors. `:default-open=false` where non-essential, a lower rung (`.glass-quiet`), **never amber**.

This rule is what makes the empty-state void (the §A keystone, `workspace-1440x900.png` ~75% dead stage) resolvable: when the controls move LEFT (DEC-2, gated on glass-ui `asideSide`, K.W4), the empty-state Image/Decomposition layer becomes the PRIMARY rung (amber, open) and the stage hosts one generous dropzone — empty-state reads *left-rail-primary → stage-secondary*, matching the populated state. D4 supplies the primary/secondary rule; §A's void-fix supplies the placement; they compose.

**Owner**: the chassis propagation + the two-tier rule are **fourier-local** (fourier wires its own `:default-open`, rung classes, and the single amber control). The LEFT-aside move depends on glass-ui's `asideSide` prop, which **does not exist at 3.1.0** (confirmed) — that is **glass-ui-ASK A-3** (DEC-2 / K.W4). So R4 is **mixed**: the hierarchy rule lands J.W5 fourier-local; the LEFT placement gates on A-3.

> **Resolution of D4-2/D4-5 overlap**: one rule, two manifestations (populated panes + empty state). Stated once here.

---

## §3 — The owner ledger (fourier-local J.W5 vs glass-ui-ASK K.W4)

**fourier consumes; it does not hand-roll or `!important`-override.** Every row below is partitioned so the J.W5 work touches only fourier surfaces and the K.W4 work is a clean glass-ui ADOPTION-ASK.

### Lands J.W5 — fourier-local (consumes 3.1.0 primitives that already ship)

| ID | Refinement | Surfaces | Severity |
|---|---|---|---|
| H1 | `ImageUpload` → `ConfiguratorLayer label="Image" sub="source input"`; drop the hand-rolled `<h3>` | `ImageUpload.vue:37,43` | **P1** |
| H2 | Wrap the BasisSelector pill row in `<ConfiguratorRow label="Basis">` | `BasisSelector.vue:138` | P2 |
| H3 | `EquationPanel` overlay title → serif + title rung + em-dash sub | `EquationPanel.vue:75` | P2 |
| H4 | Drop the `BasisSelector` bespoke value-row; render via `SliderControl` / `ConfiguratorRow` value slot | `BasisSelector.vue:155-167` | **P1** |
| H5 | Set `density` on the Configurator/rows ("comfortable" desktop, "compact" rail) | `BasisSelector.vue:154,181`, `ContourSettings.vue:190`, `CoefficientsPanel.vue:14` | **P1** |
| H6 | Adopt the 2× scale: control gap `--space-2`, section gap `--space-4`, at every breakpoint | `FunctionInput.vue:91,95,177`; `EquationView.vue:336`; `MorphPhaseConfig.vue:135`; `HarmonicLevelGrid.vue:159-226` | **P1** |
| H7 | Replace `ContourSettings` five bespoke literals with `--space-2`/`--space-3` | `ContourSettings.vue:380-382,413` | P2 |
| H8 | Swap explicit hand-rolled dividers for `.chassis-divider--horizontal` + `bezel-line` | `FunctionInput.vue:154`; `ContourSettings.vue:256-262`; `ConvergenceLegend.vue:28,66`; `GalleryDraftsSection.vue:70`; `AnimationControls.vue:115` | **P1**/NIT |
| H9 | Two-tier altitude rule: one `:default-open` PRIMARY + one amber control per pane; secondary on a lower rung | all panes (`VisualizationView`, `EquationView`, `FunctionInput.vue:143`, `FourierMorphDemo.vue:70`) | **P1** |
| H10 | Standardize pane padding to one symmetric token (`--space-3`, `--space-4` ≥640px) | `FunctionInput.vue:93,175`; `MorphPhaseConfig.vue:110-118` | NIT |

> H1, H3, the morph/equation title re-casts, and the chassis propagation that carries them are *gated on WC-layout R3* (Configurator on equation + morph) — they land together as one J.W5 chassis pass, not piecemeal. The bind-title-to-the-ladder rung (H1's "one rung") is fourier-local where fourier sets the utility on its own headers; the component-internal token hook is A-2 below.

### Lands K.W4 — glass-ui-ASK (gated on glass-ui 3.2.0; fourier ADOPTS + re-captures)

| ID | Ask | Why it cannot be fourier-local | Satisfaction test |
|---|---|---|---|
| **A-1** | `ConfiguratorLayer`/`ConfiguratorRow` exposes an inter-row **divider-rule** opt-in (the `data-divider-rule` twin-line groove, today on `.instrument-rail` only) | `.configurator-layer` emits no divider and `.configurator-row` emits only gap/padding (confirmed by grep); fourier cannot retrofit `.instrument-rail`'s sibling-rule onto the Configurator chassis, and hand-rolling a hairline between rows is the forbidden NO-LEGACY workaround | adjacent `ConfiguratorRow`s render the machined groove (not flush, not a flat line) at every breakpoint — before/after capture at W5 |
| **A-2** | `ConfiguratorLayer` `label`/`sub` typography is bound to the glass-ui `text-title`/`text-heading` ladder at the component root (a token hook), so one rung change restyles every section title | fourier reaching inside `ConfiguratorLayer` to restyle its label is an internal override (inv-16); the rung must live at the component root | one ladder-token change visibly restyles every pane title across all three routes |
| **A-3** | `Configurator` ships an `asideSide` prop (controls to the LEFT — the authoring rail) | the prop does not exist at 3.1.0 (confirmed); DEC-2's LEFT move has no lever without it | the configurator aside renders LEFT, gating the §A void-fix |
| **P5** | `ConfiguratorLayer` **inner sections round** at the component root (the literal user defect: squared inner sections, `_seed-workspace-configurator.png`) | no `.configurator-layer` rule exists in glass-ui.css; inner sections inherit no inner-radius; fourier holds no lever (inv-16); **NO `!important` workaround** | the "Image — source input" inner panel + the Decomposition body render rounded inner corners against the rounded outer card — before/after at W5 |

> P5 is carried forward from the grand-audit (`J.WC-frontend-grand-audit.md:265`) with its existing terminal disposition (BOOK → glass-ui, SHIP-on-adopt at W5). This lens does not re-book it; it confirms the owner partition and adds A-1/A-2/A-3 as the net-new asks this control-pane audit raises.

---

## §4 — Sequencing (within J.W5, after WC-layout R3 lands the chassis)

1. **R1 titles** (H1, H2, H3 + the morph/equation re-casts) — highest demarcation payoff, mechanical once the chassis is present. The edict's "proper title demarcation" is discharged here.
2. **R2 rhythm** (H4, H5, H6, H7) — the 2× scale + density axis; "proper spacing" discharged. H4 (the value-row void) is the most visible single fix.
3. **R3 dividers** (H8) — the explicit-slot groove swaps; "horizontal lines" discharged for the explicit sites. The inter-row auto-groove waits on A-1.
4. **R4 hierarchy** (H9, H10) — the one-amber-per-pane primary/secondary rule; "proper hierarchy" discharged. The LEFT-aside void-fix waits on A-3.
5. **Adopt 3.2.0** (A-1, A-2, A-3, P5) at the W5 adoption point; re-capture before/after per the π-lane.

Net code is expected to **decrease** — the five title idioms collapse to one primitive, three spacing systems to one scale, four divider treatments to one groove, and the per-route grid CSS retires with the chassis propagation (WC-layout R3). Every lever is a glass-ui primitive the app already ships-as-dependency; the K.W4 asks add three opt-ins to the Configurator chassis plus the P5 inner-rounding fix.

---

## §5 — Out of scope (do not let this lens grow)

- **No redesign** of the control flow, the verbs, or the canvas — this is hierarchy refinement of existing panes.
- **No new title face** — CM-Serif stays the title voice; the fix is *one rung* (`WC-typo #1`), not a new font.
- **No hand-rolled groove, no `!important`** — the divider is the platform groove or it waits for A-1; fourier never draws a flat hairline beside the chassis (NO-LEGACY, inv-16).
- **No backend/data change** — `web/src/` chrome only.

## §6 — How this lens threads the WC wave

This is the **control-pane hierarchy grammar** sitting on top of `WC-design-layout.md` (which says *which chassis* and *which altitude ladder*) and `WC-design-typo-color.md` (which says *which type rung*). Where those name the *components*, this names the **title-demarcation, rhythm, divider, and primary/secondary rules** the panes must obey once those components are in place. It lands ON the CORE's surfaces the same way: the gallery/diff/publish controls (J.W1, J.W1c) inherit the one title grammar, the 2× rhythm, the groove, and the one-amber rule — so the features ship *inside* a demarcated instrument, not a flat wall of cards. The four control-pane auditors' full reports are the evidentiary base (`docs/audits/runs/2026-06-04-control-pane-hierarchy/`).
