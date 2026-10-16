# D3 — Dividers, Horizontal Lines & Grouping Structure

**Audit dimension:** Are control-pane sections separated by proper horizontal lines / dividers, and is the grouping structurally clear? Is the divider the glass-ui canonical twin-line hairline groove (`bezel-line` / `instrument-rail[data-divider-rule]`) or a hand-rolled `border-b`? P5 squared-vs-rounded inner sections; inconsistent divider weight; missing dividers.

**Run:** 2026-06-04 · π visual-runtime baseline (`docs/tranches/J/audit/screenshots/before/`) · tranche-development, fold into J.W5 (WC design wave). NO implementation.

**Verdict:** The control panes have **no canonical divider in them anywhere.** The system ships a twin-line hairline groove (catch-light `rgb(255 255 255 / .10)` over under-shadow `rgb(0 0 0 / .12)`) as its one divider idiom — `instrument-chassis.css:226-279` says *"every divider in the system uses it"* — yet **zero fourier control panes consume it.** Workspace panes (`ConfiguratorLayer`/`ConfiguratorRow`) emit **no inter-row divider at all** (the row primitive sets only gap/padding — `glass-ui.css` `.configurator-row` rule), so Harmonics/Sample-Points read as one flush stack. The equation + morph panes don't use the configurator chassis at all and instead hand-roll a **single-line `border-t`** (`FunctionInput.vue:154`) or a single-line label divider (`ContourSettings.vue:256-262`), or nothing. Three different divider treatments across three routes, none of them the system primitive. P5 (squared `ConfiguratorLayer` inner sections) is real and glass-ui-owned — confirmed against `_seed-workspace-configurator.png`.

---

## Canonical reference (what "right" looks like)

The glass-ui divider primitive — the twin-line groove — is defined twice and is the *single* divider grammar:

- **`instrument-chassis.css:226-279`** — `.chassis-divider` / `.bezel-line.top` (`rgb(255 255 255 / .10)`) + `.bezel-line.bottom` (`rgb(0 0 0 / .12)`); dark `.06 / .18`. Header comment line 8-10: *"twin-line idiom is the chassis signature; **every divider in the system uses it**."*
- **`instrument-rail.css:68-116`** — `instrument-rail[data-divider-rule] > :not(:first-child)::before/::after` auto-grooves *between sibling children* with the same α-pair, "free of manual slotting."

Two consumption paths exist: (a) slot a `<ChassisDivider>` / `.chassis-divider` between groups, or (b) wrap a group stack in an `instrument-rail[data-divider-rule]` and get auto-grooves. fourier uses **neither**. Every divider fourier draws is a single 1px line in a foreground-mix color — visually a different, flatter idiom than the groove.

---

## Findings

### D3-1 (P1) — Workspace `ConfiguratorRow`s run flush: no divider between Harmonics / Sample Points / Strategy / sliders
**Page/viewport:** `_seed-workspace-configurator.png` (workspace, dark, post-upload); `workspace-1440x900.png` empty-state.
**Observed:** In the expanded "Decomposition — basis & resolution" layer the rows "Harmonics N" and "Sample Points" sit directly on top of each other with only vertical gap — no horizontal line — and read as one undifferentiated control wall (`_seed-workspace-configurator.png`, mid-right). Same in ContourSettings (Strategy → ML Threshold → Blur Sigma sliders). Root cause: `ConfiguratorRow` emits **only** `gap`/`padding-block` per density (`glass-ui.css` `.configurator-row[data-density=*]` rules; tokens `--configurator-row-gap-*`/`-py-*` in `tokens.css`) — there is **no border or `::before` divider** on the row primitive. The consumer stacks rows (`BasisSelector.vue:154,181`; `ContourSettings.vue:209`) expecting visual separation the primitive never draws.
**Refinement:** Wrap the row stack inside each `ConfiguratorLayer` in an `instrument-rail[data-divider-rule]` (or, if the configurator chassis can't host the rail, slot a `.chassis-divider--horizontal` between consecutive `ConfiguratorRow`s) so adjacent rows are separated by the twin-line groove. The cleanest fix is a glass-ui-side `data-divider-rule` opt-in on `ConfiguratorLayer`/the row group; absent that, fourier can slot `<ChassisDivider orientation="horizontal" />` (the documented public primitive, `instrument-chassis.css:282`) between rows at W5.
**Owner:** **mixed** — fourier-local can slot `.chassis-divider` between rows today (consumes the primitive, no `!important`); the *clean* fix (a `data-divider-rule` prop on `ConfiguratorRow`/`ConfiguratorLayer` so rows auto-groove) is a **glass-ui-ASK** for 3.2.0 / K.W4. Prefer the ASK; slot the primitive as the interim fourier-local move.

### D3-2 (P1) — Equation panes hand-roll a single-line `border-t`, not the twin-line groove (NO-LEGACY violation)
**Page/viewport:** `equation-375x667.png` (visible thin gray rule above "Presets"); `equation-1440x900.png` (same rule in the Function card).
**Observed:** The only internal divider in the entire equation left rail is `FunctionInput.vue:154` — `<div class="border-t border-border/40 pt-3">` above the Presets group. It renders as a **single flat 1px line** in `--border @ 40%` — categorically a different idiom from the system groove (no catch-light/under-shadow pair). On `equation-375x667` it reads as a slightly-too-faint hairline that doesn't match any other line in the app. Everything else in the card (Expression → Domain → Compute) and the entire "Controls" card (Harmonics → Display terms → Notation, `FunctionInput.vue:177-225`, just `space-y-3`) has **no divider at all**.
**Refinement:** Replace the `border-t border-border/40` at `FunctionInput.vue:154` with a slotted `.chassis-divider--horizontal` (twin-line groove). Add the same groove between the Controls card's sub-groups (after the Harmonics+auto row, after Display terms, before Notation) so the three labeled sub-controls don't read as one stack. This is the NO-LEGACY swap: hand-rolled `border-b/-t` → the platform primitive.
**Owner:** **fourier-local** — fourier owns `FunctionInput.vue`; consuming `.chassis-divider` (imported from `@mkbabb/glass-ui/instrument-chassis`) is a fourier component change shippable at W5.

### D3-3 (P1) — Equation + morph routes don't consume the Configurator chassis at all → cards separated by gaps, not structure (grouping invisible)
**Page/viewport:** `equation-1440x900.png` (three free-floating `.cartoon-card`s in the left rail); `morph-1440x900.png` + `morph-375x667.png` (Settle-Out / Morph / Settle-In cards float on gaps).
**Observed:** `EquationView.vue:197-215` stacks `FunctionInput` + `EqCoefficientsPanel` in a raw `.eq-panel-left` flex column with `gap-3`; each child is a bespoke `.cartoon-card` (`FunctionInput.vue:93,175`; `EqCoefficientsPanel.vue:12`) wrapping a fourier-local `CollapsibleSection` (which itself draws **no divider** between its header trigger and body — `CollapsibleSection.vue:34-50`). Morph is identical: `MorphPhaseConfig.vue:2` is a `.cartoon-card config-card` with title + desc then `config-field` groups separated only by `margin-bottom: .75rem` (`MorphPhaseConfig.vue:134-140`) — no dividers; the three phase cards are separated only by grid gap. The result on `equation-1440` and `morph-1440`: the panes read as **loose floating cards**, not a single instrument with demarcated regions. The workspace already proves the right idiom (`VisualizationView.vue:194` `<Configurator>` + `ConfiguratorLayer`); equation/morph diverge.
**Refinement:** (Composes with grand-audit R3.) Lift each equation/morph control group into a `ConfiguratorLayer label sub` inside one `<Configurator>` per route — then D3-1's groove fix applies uniformly to all three routes. As a divider-only interim if the chassis lift slips past W5: slot `.chassis-divider--horizontal` between the stacked `.cartoon-card`s and inside `CollapsibleSection` (between header and content) so the grouping is at least legibly demarcated.
**Owner:** **fourier-local** — `EquationView.vue` / `MorphPhaseConfig.vue` / `CollapsibleSection.vue` are fourier-owned; both the chassis lift and the interim groove-slotting are fourier changes. (The chassis lift is grand-audit R3, also fourier-local.)

### D3-4 (P1) — P5: squared `ConfiguratorLayer` inner sections (no inner rounding)
**Page/viewport:** `_seed-workspace-configurator.png` — the "Image — source input" inner panel, the gradient progress bar, and the "Decomposition" expanded body all show **sharp 90° inner corners** against the rounded outer card.
**Observed:** The literal user-reported defect. `ConfiguratorLayer` emits **no border/radius CSS of its own** (there is no `.configurator-layer` rule in `glass-ui.css` — only `.configurator-row` density rules exist), so inner sections inherit no inner-radius and render squared while the outer `.cartoon-card`/chassis shell is rounded. fourier holds no lever on the layer's internal markup (inv-16). Confirmed glass-ui-owned per grand-audit `J.WC-frontend-grand-audit.md:265` ("P5 — `ConfiguratorLayer` INNER-section rounding … glass-ui-owned").
**Refinement:** glass-ui ships the inner-rounding token/recipe so `ConfiguratorLayer` inner sections round at the component root; fourier adopts `^3.2.x` and re-captures (before/after visual evidence at W5). **NO `!important` workaround** of the glass-ui internal (forbidden, NO-LEGACY).
**Owner:** **glass-ui-ASK** — BOOKED → glass-ui, SHIP-on-adopt at W5 (consistent with grand-audit §F / `:308`). Not satisfied until fourier's inner sections actually round under the π-lane re-capture.

### D3-5 (P2) — Inconsistent divider weight/idiom across panes (one flat line, one label-divider, one saturated gradient bar, vs the absent groove)
**Page/viewport:** `_seed-workspace-configurator.png` (the teal→pink gradient bar under the uploaded image acts as a divider but is heavy/saturated + squared); `equation-375x667.png` (`border-t` faint flat line); `ContourSettings` "Advanced" label-divider.
**Observed:** Four different separator treatments coexist, none the canonical groove: (a) the **saturated gradient progress/separator bar** under the image in the workspace configurator — reads as a divider but is far heavier and squared (P5) vs every other line; (b) `FunctionInput.vue:154` single flat `border-t border-border/40`; (c) `ContourSettings.vue:256-262,325-335` `advanced-divider`/`divider-line` — a single 1px `--foreground @ 10%` line flanking an "Advanced" label (the *only* label-bearing internal divider, but still single-line not groove); (d) the absent divider everywhere else. The eye gets three different "this is a boundary" signals at three different weights.
**Refinement:** Standardize on the twin-line groove (`.chassis-divider` / `data-divider-rule`) for **all** intra-pane boundaries; keep the "Advanced" label pattern but rebuild its `divider-line`s from `bezel-line.top`/`.bottom` so the flanking lines are the groove. Decouple the gradient bar's *progress* role from its *separator* role (it should not read as the section divider).
**Owner:** **fourier-local** for (b)+(c) (swap `border-t`/`divider-line` → `bezel-line` pair) and the gradient-bar decoupling; the squared gradient bar's corners are P5-adjacent (**glass-ui-ASK** if the bar is a layer-internal).

### D3-6 (P2) — Mobile: dividers/grouping degrade further (cards lose even gap structure; flush sub-controls dominate)
**Page/viewport:** `morph-375x667.png` (Settle-Out card: Duration row and Easing select run flush, no divider, title+desc then two fields with no boundary); `equation-375x667.png` (Controls card's Harmonics/Display/Notation flush); `workspace-375x667.png` (narrow, single-column stack).
**Observed:** The edict notes "mobile hierarchy often breaks differently." On `morph-375` the `config-field` groups (`MorphPhaseConfig.vue:134`) collapse to a tighter stack where Duration and Easing have **no separating line** and the title/desc no longer reads as a distinct region from the fields. On `equation-375` the three "Controls" sub-groups are visually one block. Because there's no divider at *any* breakpoint, the narrower mobile column makes the flush-stack ambiguity worse (less whitespace to imply grouping).
**Refinement:** The grooves added in D3-1/D3-2/D3-3 must be present at mobile too (the `instrument-chassis.css:289-335` reflow already rotates grooves for mobile — the primitive handles the breakpoint; the hand-rolled lines do not). Ensure the groove between Duration/Easing and between Controls sub-groups renders at `375` — i.e. don't gate the divider behind a `min-width` media query.
**Owner:** **fourier-local** — same surfaces as D3-2/D3-3; the fix is to slot the primitive (which is breakpoint-aware) instead of a fixed hairline.

### D3-7 (NIT) — `ConvergenceLegend` / `EasingPicker` / `BasisSelector` / gallery `border-b` are hand-rolled, off-system lines
**Page/viewport:** `equation-1440x900.png` (legend), `gallery-1440x900.png` (card frames).
**Observed:** Scattered hand-rolled single lines outside the main control panes: `ConvergenceLegend.vue:28,66` `legend-divider`; `EasingPicker.vue:51` `border-bottom: 1px … --border 50%`; `BasisSelector.vue:217,227` `border-bottom` (input underline — acceptable as an affordance, not a section divider); `GalleryCard.vue:98` / `GalleryCardModal.vue:77` `border-b border-foreground/8`; `GalleryDraftsSection.vue:70` `border-t border-foreground/5`; `AnimationControls.vue:115` `border-b border-border/50`. None are the groove. These are lower-stakes (frames/legends/underlines, not control-pane section boundaries) but they perpetuate the off-system idiom.
**Refinement:** Where these act as *section* separators (legend divider, drafts-section `border-t`, animation-controls speed-group `border-b`), migrate to `bezel-line`/`.chassis-divider`. Leave input/tab underlines (`BasisSelector` `inline-number`, `EasingPicker` trigger) as affordance borders — they are not section dividers and the groove would be wrong there.
**Owner:** **fourier-local** — all fourier-owned components; low priority, batch with the W5 divider sweep.

---

## Ownership roll-up

| Finding | Severity | Owner | Lever |
|---|---|---|---|
| D3-1 flush ConfiguratorRows | P1 | mixed | glass-ui-ASK (`data-divider-rule` on row group, K.W4) + interim fourier-local `.chassis-divider` slot |
| D3-2 equation `border-t` not groove | P1 | fourier-local | swap `FunctionInput.vue:154` → `.chassis-divider` |
| D3-3 equation/morph not on chassis | P1 | fourier-local | chassis lift (grand-audit R3) + interim groove slotting |
| D3-4 P5 squared inner sections | P1 | glass-ui-ASK | BOOKED → glass-ui, ship-on-adopt W5 (no `!important`) |
| D3-5 inconsistent divider idiom | P2 | fourier-local (+ P5-adjacent gradient bar) | standardize on `bezel-line` groove |
| D3-6 mobile grouping degrades | P2 | fourier-local | slot breakpoint-aware primitive |
| D3-7 scattered off-system `border-b` | NIT | fourier-local | migrate section borders to groove |

**Headline for J.W5:** fourier has a system-canonical divider (the twin-line groove, `instrument-chassis.css:226-279` / `instrument-rail.css:68-116`) and uses it in **zero** control panes. The single highest-leverage divider move is to make the `ConfiguratorLayer` row stacks groove between rows (D3-1) and migrate the equation/morph routes onto the same chassis (D3-3) so one groove idiom governs all three routes — then the lone hand-rolled `border-t` (D3-2) and scattered lines (D3-5/D3-7) are deleted in the same sweep. P5 (D3-4) is the one true glass-ui-ASK; everything else fourier can ship at W5.
