# Control-pane design-hierarchy audit — SYNTHESIS

**Run**: `2026-06-04-control-pane-hierarchy`
**Edict** (user): *"Ensure proper hierarchy of design within our control panes, with proper title demarcation, spacing, horizontal lines, etc. Audit every page."*
**Auditors**: D1 (title demarcation), D2 (spacing/rhythm), D3 (dividers/grouping), D4 (cross-page idiom). Full reports alongside this file.
**Canonical output**: `docs/tranches/J/design/WC-design-hierarchy.md` — the new WC lens that folds into the WC design wave (J.W5 fourier-local / K.W4 glass-ui-ASK).
**Posture**: tranche-development. NO implementation, NO code edits. Spec only.

---

## Headline

**The control panes speak four dialects, but only one is the platform instrument — and the workspace already proves it.** From that single schism (workspace = real `Configurator`/`ConfiguratorLayer`; equation = hand-rolled `.eq-grid`+`cartoon-card`+`CollapsibleSection`; morph = hand-rolled `.config-grid`+serif `<h3>` cards; `ImageUpload` = an `<h3>` that mimics but is not a `ConfiguratorLayer`) flow all four observed failures the four auditors independently found. The fix is propagation, not invention: **one title primitive, one rhythm scale, one divider groove, one primary-action rule.**

## The four auditors converged (the convergence is the signal)

All four independently land on the same root cause and the same fix family. De-duplicated:

| What the edict asks | The failure (cross-auditor) | The one rule (WC-hierarchy) | Owner |
|---|---|---|---|
| **title demarcation** | 5 title idioms (D1-1..6, D4-3): canonical label/sub, `ImageUpload` `<h3>` mimic (`:43`), `CollapsibleSection` span (`:39`), morph `config-card-title` text-lg/400 (`:120`), `EquationPanel` sans-serif (`:75`). Morph's title is *heavier* than pane titles → inversion at 375. No section-title token. | **R1** — `ConfiguratorLayer label/sub` everywhere, bound to one `text-title` ladder rung | fourier-local + A-2 |
| **spacing** | 3 hand-rolled systems (D2-1..8); section gap ≈ control gap (equation 12/12); ratio inverts at 375 (eq-grid 4px panes vs 12px controls); shipped density axis unused | **R2** — one 6-step scale, section-gap = 2× control-gap, via the density axis | fourier-local |
| **horizontal lines** | ZERO platform grooves (D3-1..7, D1-7, D4-4); 4 off-system idioms (gradient bar / flat `border-t` / `.divider-line` / absent); workspace rows run flush | **R3** — the platform twin-line groove; never a hand-rolled hairline | mixed (slot=local, inter-row=A-1) |
| **hierarchy** | one altitude, one weight, no entry point (D4-2/5); empty-state void inverts hierarchy | **R4** — one chassis + one-amber-per-pane primary/secondary rule | mixed (rule=local, LEFT-aside=A-3) |

## The conflicts resolved (where the auditors disagreed or over-claimed)

1. **D3-1's "wrap in `instrument-rail[data-divider-rule]`" is wrong as stated.** Verified against source: `.configurator-layer` emits **no** divider rule and `.configurator-row` emits only gap/padding; the `data-divider-rule` auto-groove lives **only on `.instrument-rail`** (`instrument-rail.css:68`), a different chassis. You cannot retrofit it onto a `ConfiguratorLayer`. So the divider rule splits cleanly by owner:
   - **fourier-local TODAY**: the explicit-slot recipe `.chassis-divider--horizontal` + `bezel-line.top/.bottom` *does* ship (`instrument-chassis.css:228-278`) and fourier can slot it at genuine sub-section boundaries (FunctionInput `:154`, ContourSettings `:256`).
   - **glass-ui-ASK (A-1)**: the *automatic* inter-`ConfiguratorRow` groove needs glass-ui to add the opt-in to the Configurator chassis. fourier must NOT hand-roll a hairline between rows as a stopgap (NO-LEGACY).
2. **D1-6 vs D4-3 ("one title grammar") are the same finding** — merged into R1. `CollapsibleSection` is retired by chassis adoption, not shimmed in parallel.
3. **D2-2 (unused density) vs D2-3/5 (the 2× ratio) are two halves of one rule** — the ratio is *expressed through* the density axis, merged into R2.
4. **"Bind the title to the ladder" splits by reach** — fourier setting the utility on its own headers is local; a `ConfiguratorLayer` component-root token hook is A-2 (so fourier never reaches inside the component, inv-16).

## Verified ground truth (checked against source + node_modules, not assumed)

- glass-ui is **3.1.0** — neither the P5 inner-rounding fix nor an `asideSide` prop ship → both are genuine K.W4 asks.
- `ConfiguratorLayer` props are `label` (large/semantic) + `sub` (small/monospaced) — `.d.ts:35-38`. Confirms the canonical title pattern.
- `ConfiguratorRow`/`Configurator` `density` cascades, four rungs, `comfortable` = silent default — `.d.ts:44-53`, `tokens.css:953-961`. Confirms R2's lever ships unused.
- The twin-line groove (catch-light `rgb(255 255 255 / 0.10)` over under-shadow `rgb(0 0 0 / 0.12)`, dark-aware) ships at `instrument-rail.css:68-110` (auto, rail-only) and `instrument-chassis.css:228-278` (explicit `.chassis-divider`/`bezel-line`, slottable). Confirms R3's partition.
- `style.css` has **no** section-title token (only the `cartoon-card` shim `:107` + `--section-color-*` `:121-126`). Confirms Fact 2 (no single lever).

## The net-new glass-ui ADOPTION-ASKS this audit raises (K.W4)

| ID | Ask | Net-new vs known |
|---|---|---|
| **A-1** | `ConfiguratorLayer`/`ConfiguratorRow` inter-row **divider-rule** opt-in (the twin-line groove, today rail-only) | **net-new** |
| **A-2** | `ConfiguratorLayer` `label`/`sub` bound to the `text-title`/`text-heading` ladder at the component root (token hook) | **net-new** |
| **A-3** | `Configurator` `asideSide` prop (controls LEFT — the authoring rail, DEC-2) | net-new (confirms the DEC-2 gate) |
| **P5** | `ConfiguratorLayer` inner-section rounding | known (grand-audit `:265`); confirmed, not re-booked |

## What lands J.W5 (fourier-local, after WC-layout R3 lands the chassis)

H1–H10 in `WC-design-hierarchy.md §3`. Highest-leverage first moves: **H1** (`ImageUpload`→ConfiguratorLayer, the lone titled outlier in the empty state, P1), **H4** (kill the value-row void, P1), **H6** (the 2× rhythm scale, P1), **H9** (one-amber primary/secondary rule, P1). Net code decreases — five title idioms → one, three rhythms → one, four dividers → one.

## Evidence index

- `_seed-workspace-configurator.png` — P5 squared inner sections; flush ConfiguratorRows; the value-row void ("200"/"1024" orphaned); the gradient-bar-as-divider.
- `equation-1440x900.png` / `equation-375x667.png` — three flat cartoon-cards; the lone flat `border-t` above Presets; the 4px-vs-12px mobile inversion.
- `morph-1440x900.png` / `morph-375x667.png` — three equal cards, no dividers; the `text-lg` serif title heavier than workspace pane titles (inversion); over-loose airy rhythm.
- `workspace-1440x900.png` / `workspace-375x667.png` — the ~75% dead-stage empty-state void; controls pinned top-right (DEC-2 LEFT target).
