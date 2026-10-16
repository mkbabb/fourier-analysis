# D2 — Spacing, Rhythm & Density (Control-Pane Hierarchy Audit)

**Dimension:** intra-pane vertical rhythm, section-vs-control gap legibility, density, responsive rhythm, ad-hoc spacing vs a canonical scale.
**Run:** 2026-06-04-control-pane-hierarchy. **Baseline captures:** `docs/tranches/J/audit/screenshots/before/` (7 pages × 3 viewports + `_seed-workspace-configurator.png`).
**Folds into:** WC design wave (J.W5). **No implementation here** — findings + the canonical scale only.

---

## Verdict

The control panes are governed by **three mutually-inconsistent, hand-rolled spacing systems** — one per route family — and **none** of them is the canonical scale glass-ui 3.1.0 already ships (`--configurator-row-gap-*` / `--configurator-row-py-*`, tokens.css:953-961). The Configurator family (workspace) leaves `ConfiguratorRow` at the `comfortable` default and then *hand-rolls an extra `mb-1.5` value-row above every slider*, so a single row reads as two stacked bands with a void between the group title and its value (visible in `_seed-workspace-configurator.png`). The equation family runs a tight `space-y-3` + `text-sm` rhythm; the morph family runs a loose `text-base` + `mb-0.75rem/0.875rem` rhythm — two routes built to different metronomes. Across the panes I count **~30 ad-hoc `space-y-*`/`gap-*`/`mb-*`/`p-*` literals** and **5 distinct "gap between sections" values** (`gap-3`, `gap-0.75rem`, `0.875rem`, `gap-0.625rem`, `gap-1rem`), so grouping is *not* legible from rhythm alone — it is legible only because of borders. The fix is a single 6-step spacing scale, one section-gap token (2× the control-gap), and routing the workspace panes through the glass-ui density axis instead of the hand-rolled value-rows.

**Severity tally:** P1 ×3, P2 ×4, NIT ×2.

---

## The three competing systems (the root cause)

| Pane family | Section gap | Control gap | Label size | Pane padding | Source |
|---|---|---|---|---|---|
| **Workspace** (Configurator) | `gap-0.75rem` (`viz-panel-left`) | `ConfiguratorRow` `comfortable` (gap 6px / py 8px) **+ hand-rolled `mb-1.5`** | inherited | substrate | `VisualizationView.vue:367`, `BasisSelector.vue:156,183` |
| **Equation** (`cartoon-card` + CollapsibleSection) | `gap-3` / `space-y-3` (12px) | `space-y-3` (12px) | `text-sm` (14px) | `px-3 py-2` | `EquationView.vue:374`, `FunctionInput.vue:91,95,177` |
| **Morph** (`config-card`) | `gap-0.625rem` → `1rem` | `mb-0.75rem` (12px) | `text-base` (16px) | `0.75rem` → `1rem 1.25rem` | `FourierMorphDemo.vue:261,267`, `MorphPhaseConfig.vue:111,134,148` |

Three routes, three scales, three label sizes. The workspace's control-gap (6-8px) is **half** the equation's (12px) and the morph's labels are **2px larger** than the equation's. There is no shared `--space-*` term any of them read.

---

## Findings

### D2-1 — `ConfiguratorRow` value-row is hand-rolled above the slider, splitting one control into two bands with a void *(P1)*

**Observed:** In `_seed-workspace-configurator.png` (workspace, dark), the Decomposition pane shows **"Harmonics N"** then a large empty band, then **"200"** flushed right, then the slider, then **"Sample Points"** / void / **"1024"**. The value and its label sit ~24-32px apart with dead space between — the row reads as a title with an orphaned number, not a labeled slider. Same gap visible in `workspace-1280x800.png` (the basis pane is collapsed there but the row anatomy is identical when expanded).
**Source:** `BasisSelector.vue:155-167` wraps the number input in `<div class="mb-1.5 flex … justify-end">` *above* the `<Slider>`, **inside** a `ConfiguratorRow label="Harmonics" name="N"` that already renders the "Harmonics N" label on its own line. So the row's vertical extent = ConfiguratorRow label line + `mb-1.5` (6px) + number line + slider — a double-stacked band where the canonical pattern is *label-and-value on one line, slider below* (exactly what `SliderControl.vue:65-91` does: `slider-label` is `justify-between`, gap `0.25rem` to the track).
**Refinement:** Drop the bespoke value-row; render `Harmonics`/`Sample Points` through the **same `SliderControl` chassis** the rest of the app uses (label + inline numeric input on one `justify-between` line, `gap: 0.25rem` to the track) — or, if `ConfiguratorRow` must own the label, move the number input into the row's value slot inline with the label, not a `mb-1.5` band above the slider. Net: the row collapses from ~3 stacked bands to label+value+track, killing the void.
**Owner:** **fourier-local** — `BasisSelector.vue:154-206` is fourier's; `SliderControl.vue` is fourier's. No glass-ui lever needed.

---

### D2-2 — Workspace panes never opt into the density axis; the canonical row-gap scale ships unused *(P1)*

**Observed:** Across `workspace-1440x900.png` / `workspace-1280x800.png` / `_seed-workspace-configurator.png`, the `ConfiguratorRow` spacing is the silent `comfortable` default (gap 6px / py 8px, tokens.css:955,960). It is neither tuned for the 320-360px narrow rail (where `mobile`/`compact` would tighten) nor the breathing the user's edict asks for. The result on the wide rail is cramped rows; on the 375 stack (`workspace-375x667.png`) the same `comfortable` py makes the (empty-state) pane feel arbitrary.
**Source:** glass-ui ships a **4-rung density axis** — `--configurator-row-gap-{mobile,compact,comfortable,spacious}` + `--configurator-row-py-*` (tokens.css:953-961), bound via `<ConfiguratorRow>`'s `density` attribute. fourier passes **no density prop** at any of the 3 `ConfiguratorRow` sites (`BasisSelector.vue:154,181`) nor on `ConfiguratorLayer` (`BasisSelector.vue:120`, `ContourSettings.vue:190`, `CoefficientsPanel.vue:14`). The scale exists; fourier never reads it.
**Refinement:** Set `density="comfortable"` explicitly on desktop and `density="compact"` (gap 5px / py 6px) under the 360px rail via the route's responsive context — i.e., *consume the axis* rather than accept the implicit default, so the narrow authoring rail (DEC-2 moves it LEFT) tightens its rows and the wide rail breathes. This is the canonical lever for "consistent token-driven rhythm" and removes the temptation to hand-roll `mb-*` per row (see D2-1).
**Owner:** **fourier-local** to *adopt* the prop. If a 5th "studio" rung or per-pane override is wanted beyond the 4 shipped rungs, that is a **glass-ui-ASK** (K.W4) — but the 4 rungs already cover this need, so no ask is required.

---

### D2-3 — Three routes run three different section-vs-control gap scales; grouping is not legible from rhythm *(P1)*

**Observed:** Compare `equation-1440x900.png` (left rail: Function / Controls / Coefficients panes stacked with a tight 12px inter-pane gap, 12px intra-pane gap — **section gap == control gap**, so the only thing separating "a group" from "a control" is the card border) against `morph-1440x900.png` (the three Settle/Morph/Settle config-cards gapped at `1rem`, internal fields at `0.75rem`) and `_seed-workspace-configurator.png` (panes gapped `0.75rem`, rows `comfortable`). The **section gap equals (or is only marginally larger than) the control gap** in the equation rail specifically — at `equation-1440x900.png` the Function pane's "Presets" sub-group and the "Controls" pane's sliders read as one continuous wall when the card borders are subtle, because nothing in the *spacing* says "new section."
**Source:** Equation: `space-y-3` for both inter-pane (`FunctionInput.vue:91`) and intra-pane (`:95,:177`) — identical 12px. Morph: `config-grid gap 1rem` (`FourierMorphDemo.vue:267`) vs `config-field mb-0.75rem` (`MorphPhaseConfig.vue:135`) — 16px vs 12px, only a 4px delta. The rule "section gap ≈ 2× control gap" (so grouping is pre-attentively obvious) is **followed nowhere**.
**Refinement:** Adopt the canonical rule below: **control gap `--space-2` (8px); section gap `--space-4` (16px) = exactly 2×.** Apply the 2× ratio uniformly so a reader sees the group boundary from whitespace before reading a single label or noticing a border. This is the single highest-leverage rhythm fix for the user's "proper hierarchy + spacing demarcation" edict.
**Owner:** **fourier-local** — all three route stacks are fourier's CSS.

---

### D2-4 — Morph config-cards are over-loose; equation panes are cramped — opposite density failures from the same missing scale *(P2)*

**Observed:** `morph-375x667.png` shows the Settle-Out config-card with generous voids: the "Shape degrades to low harmonics" description sits `0.875rem` below the title, then `0.75rem` to Duration, `0.375rem` to its input, `0.75rem` to Easing — the card reads *airy to the point of looking unfinished* on mobile, and the `text-base` (16px) labels dominate. Contrast `equation-375x667.png`: the Function pane's Expression input, Domain row, Compute button, and Presets are packed at `space-y-3` (12px) with `text-sm` labels — *tighter*, denser, and frankly more usable per vertical pixel. Two panes, opposite density, neither tuned to viewport.
**Source:** Morph: `config-card-desc margin-bottom 0.875rem` (`MorphPhaseConfig.vue:131`), `config-field margin-bottom 0.75rem` (`:135`), `config-label text-base` (`:150`). Equation: `space-y-3` + `text-sm` (`FunctionInput.vue:91-97`). The morph card never tightens its margins below 640px (`MorphPhaseConfig.vue:114-118` only *increases* padding at 640px).
**Refinement:** Pull both onto the canonical scale: descriptions `--space-2` (8px) below title, fields `--space-3` (12px) apart, labels to `text-sm` (14px) to match the equation/slider chassis. On mobile, *tighten* (not loosen) via the `compact` rung. The morph pane should lose ~30% of its vertical voids; the equation pane is close to right and becomes the reference rhythm.
**Owner:** **fourier-local** — `MorphPhaseConfig.vue` + `HarmonicLevelGrid.vue` + `FunctionInput.vue` are all fourier's.

---

### D2-5 — Inter-pane gap collapses inconsistently at 375; the rail rhythm is unstable across breakpoints *(P2)*

**Observed:** `equation-375x667.png`: the Function and Controls panes are gapped at `p-1 gap-1` (4px) on mobile (per `eq-grid` mobile rule) but the *intra*-pane `space-y-3` stays 12px — so on mobile the **gap between panes (4px) is smaller than the gap between controls inside a pane (12px)**, inverting the hierarchy: controls within a group are pushed further apart than the groups themselves. `morph-375x667.png` keeps `config-grid gap 0.625rem` (10px) between cards vs `0.75rem` (12px) inside — also inverted. `workspace-375x667.png` (empty state) can't show the stack but `viz-panel-left gap 0.75rem` is fixed across all breakpoints (`VisualizationView.vue:367`), so it doesn't collapse but also never tightens for the narrow column.
**Source:** `EquationView.vue:336` (`.eq-grid` mobile `gap-1`) vs `FunctionInput.vue:91` (`space-y-3`); `FourierMorphDemo.vue:261` (`gap 0.625rem`) vs `MorphPhaseConfig.vue:135` (`mb 0.75rem`).
**Refinement:** Make the **section gap always ≥ 2× the control gap at every breakpoint** (the D2-3 rule, enforced responsively): if controls tighten to `--space-2` on mobile, sections tighten to `--space-4` — never let the section gap drop below the control gap. Drive both from the same two tokens so the ratio is structurally guaranteed, not coincidental.
**Owner:** **fourier-local**.

---

### D2-6 — `ContourSettings` advanced grid + slider stack has no rhythm token; values are bespoke `0.625rem 0.75rem` *(P2)*

**Observed:** Not directly visible in the captures (the Contour pane is `:default-open="false"`, collapsed in `_seed-workspace-configurator.png` at the bottom edge), but the source shows the densest hand-rolled cluster in the app: the Advanced grid is `gap: 0.625rem 0.75rem` with `padding-top: 0.625rem` (`ContourSettings.vue:380-382`), the SliderControls between the Strategy select and the Advanced divider have no inter-control gap token (they rely on the `ConfiguratorLayer`'s implicit stacking), and the retry banner adds `margin-top: 0.5rem` (`:413`). Five different spacing literals in one pane (`0.625rem`, `0.75rem`, `0.5rem`, `0.25rem` advanced-divider margin `:329`, `0.125rem`).
**Source:** `ContourSettings.vue:377-382` (`advanced-grid`), `:325-330` (`advanced-divider`), `:407-418` (`retry-banner`).
**Refinement:** Replace the bespoke `0.625rem/0.75rem` grid gaps with `--space-2`/`--space-3`; route the advanced-divider through the platform **`data-divider-rule` twin-line groove** (instrument-rail.css:74-90) rather than the hand-rolled `.divider-line` 1px bars (`ContourSettings.vue:331-335`) — that both fixes the rhythm *and* the divider weight (a D1 concern, noted here for the spacing it controls). The slider stack inherits the canonical control-gap once the panes adopt the density axis (D2-2).
**Owner:** **fourier-local** for the gap tokens; the `divider-rule` groove is a **platform primitive fourier consumes** (NO-LEGACY — prefer it over the `.divider-line` hand-roll), no glass-ui change required to use it.

---

### D2-7 — `cartoon-card` panes have asymmetric `px-3 py-2` padding — horizontal breathing ≠ vertical *(NIT)*

**Observed:** `equation-1440x900.png` / `equation-1280x800.png`: the Function/Controls/Coefficients cards use `px-3 py-2` (12px horizontal, 8px vertical), so content sits closer to the top/bottom edges than the sides — the asymmetry is subtle but reads as slightly "squashed" vertically, and it differs from the morph cards' symmetric `0.75rem` / `1rem 1.25rem` (`MorphPhaseConfig.vue:111,116`).
**Source:** `FunctionInput.vue:93,175` (`px-3 py-2`), vs `MorphPhaseConfig.vue:110-118`.
**Refinement:** Standardize pane padding to a single symmetric token (`--space-3` = 12px all sides, or `--space-4` at ≥640px) so every pane edge breathes equally. Composes with the P5 inner-rounding fix (the squared `ConfiguratorLayer` inner sections, glass-ui-owned K.W4) — once the inner sections round, even padding makes the rounded inset read correctly.
**Owner:** **fourier-local** for the padding token. (The squared-inner-section P5 itself is **glass-ui-ASK**, K.W4 — do not `!important`-override it.)

---

### D2-8 — `HarmonicLevelGrid` level-rows + preview grid use a third independent `0.5rem/0.75rem` rhythm *(NIT)*

**Observed:** `morph-1440x900.png` (bottom strip): the Harmonic Levels card stacks Low/High slider rows at `gap 0.5rem` then the preview grid at `gap 0.5rem` with `margin-bottom 0.75rem` between the controls block and the grid — yet another bespoke pair (`0.5rem`/`0.75rem`) distinct from both the config-card (`0.75rem`) and the equation (`12px`) rhythms.
**Source:** `HarmonicLevelGrid.vue:159-164` (`levels-controls gap 0.5rem`, `margin-bottom 0.75rem`), `:218-226` (`grid gap 0.5rem`).
**Refinement:** Fold onto the canonical scale: control gap `--space-2`, the controls→preview separation `--space-4` (it *is* a section boundary, so it earns the 2× section gap). This makes the grid read as a distinct sub-section from the sliders via rhythm, not just position.
**Owner:** **fourier-local**.

---

## The canonical spacing scale (the deliverable)

A **6-step scale**, fourier-local tokens declared once in `style.css` (mirroring the math of glass-ui's `--configurator-row-*` rungs so the two never fight), consumed everywhere:

```css
:root {
  --space-1: 0.25rem;  /*  4px — inline gap (label↔value, icon↔text)              */
  --space-2: 0.5rem;   /*  8px — CONTROL GAP: between sibling controls in a group */
  --space-3: 0.75rem;  /* 12px — pane inner padding; field stacks                 */
  --space-4: 1rem;     /* 16px — SECTION GAP: between groups/panes (== 2×control)  */
  --space-5: 1.5rem;   /* 24px — major region break                              */
  --space-6: 2rem;     /* 32px — page-level rhythm                               */
}
```

**The section-vs-control gap rule (so grouping reads from rhythm alone):**

> **control gap = `--space-2` (8px); section gap = `--space-4` (16px) = exactly 2× control gap, at *every* breakpoint.**
> A reader must be able to see the group boundary from whitespace *before* reading a label or registering a border. The 2× ratio is the threshold where the gestalt "proximity" grouping fires pre-attentively. On mobile, both halve proportionally (`compact` rung) — the *ratio* is invariant, never the absolute value.

**Mapping to glass-ui (so fourier never re-rolls what the platform ships):**
- Workspace `ConfiguratorRow` → opt into the **density axis** (`comfortable` desktop ≈ our `--space-2`/`py --space-3`; `compact` mobile) — tokens.css:953-961. Stop hand-rolling `mb-1.5` value-rows (D2-1).
- Section dividers → the **`data-divider-rule` twin-line groove** (instrument-rail.css:74-90), not hand-rolled 1px bars — this is where rhythm and demarcation (D1) meet.
- Inner-section rounding (P5) stays a **glass-ui-ASK** (K.W4); spacing must not paper over it with overrides.

**Net effect:** ~30 ad-hoc literals collapse to 6 tokens + the 2 density rungs; three route metronomes become one; the user's "proper hierarchy, title demarcation, spacing, horizontal lines" reads from rhythm first, borders second.
