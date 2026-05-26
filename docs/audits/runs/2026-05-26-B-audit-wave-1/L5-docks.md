# L5 — Docks audit (architecture + integration)

**Audit class:** B-wave-1 substrate sub-agent (L5). Read-only.
**Date:** 2026-05-26. **HEAD:** `c7cfd82`. **Auditor:** L5.

## §0 — Goal + completion criterion

**Goal.** Enumerate every dock-shaped surface in fourier; inspect glass-ui
primitive consumption, mobile/desktop affordances, accessibility, z-index
discipline, and consistency across docks; classify findings for B's
UX-coherence wave.

**Completion criterion.** Every dock listed with role + LOC + primitive
consumed; per-dock architectural row populated; consistency, a11y, leverage
gap rolled into a single severity-classified ledger with B-tranche
absorption mapping.

## §1 — Substrate observed

- **Glass-ui dock substrate** at `/Users/mkbabb/Programming/glass-ui/src/components/custom/dock/`: `GlassDock.vue` (325 LOC, horizontal/vertical/rail/instrument-strip variants, density axis), `DockIconButton`, `DockLayer`, `DockLayerGroup`, `DockDropdownTrigger`, `DockSelectTrigger`, `DockTabButton`; composables `useDockState` (3-state machine collapsed↔hover↔pinned + ref-counted keep-open), `dockContext` (typed-key DI, O.W2 canonical). `dock.css` is 1085 LOC. **No `useDockSnap` / `useDockResize` exist** — drag-to-move + snap-to-grid are not part of the substrate.
- **Glass-ui sidebar substrate** at `/Users/mkbabb/Programming/glass-ui/src/composables/sidebar/`: `useSidebarState<T>` (W3.5.c augmented to generic), `useTreeIndex<T>`, `useScrollTracker`, `useSidebarFollow`.
- **Glass-ui configurator substrate** at `.../components/custom/configurator/`: `Configurator.vue`, `ConfiguratorLayer.vue`, `ConfiguratorRow.vue`, `useConfiguratorState`, `density.ts` — the canonical "studio panel" stage + preset-picker + layered controls chassis. **Zero fourier adoption** (`rg Configurator fourier/web/src` → 0 hits).
- Prior audits: `d-style-glassui.md` (CR-2 closed, A− grade); `W3.5-sidebar.md` (paper sidebar migrated to `useSidebarState<T>` augmentation).

## §2 — Dock inventory

| # | Path | Role | Primitive | LOC | Desktop | Mobile |
|---|------|------|-----------|----:|---------|--------|
| D1 | `web/src/components/visualization/EditorControlsDock.vue` | Contour-editor playback dock (undo/redo/smooth/simplify/magnet/save) | `GlassDock` + `DockIconButton` + `HoverPopover` | 230 | floating bottom, expand-on-hover | floating bottom |
| D2 | `web/src/components/visualization/CanvasControlsDock.vue` | Canvas top-right view-toggle dock (fullscreen/edit/equation/publish) | `GlassDock` + `DockIconButton` + `HoverPopover` | 126 | top-right overlay | top-right overlay |
| D3 | `web/src/components/visualization/AnimationControls.vue` | Animation playback dock (play/pause/timeline/speed/easing/export) | `GlassDock` + `DockIconButton` + bespoke `play-btn` + custom `menu-popup` | 221 | floating bottom | floating bottom |
| D4 | `web/src/components/visualization/EditorToolsPanel.vue` | Editor refinement panel (Smooth/Simplify/Magnet) | `cartoon-card` + `CollapsibleSection` + `Button` | 121 | in-flow left panel | in-flow |
| D5 | `web/src/components/visualization/ContourSettings.vue` | Contour-extraction settings panel (strategy/blur/advanced) | `cartoon-card` + `CollapsibleSection` + `Collapsible` + `Select` | 464 | in-flow left panel | in-flow |
| D6 | `web/src/components/visualization/BasisSelector.vue` | Basis-selection + harmonics/points panel | `cartoon-card` + `CollapsibleSection` + `Slider` | 320 | in-flow left panel | in-flow |
| D7 | `web/src/components/visualization/CoefficientsPanel.vue` | Fourier-spectrum readout panel | `cartoon-card` + `CollapsibleSection` + bespoke list | 167 | in-flow left panel | in-flow |
| D8 | `web/src/components/visualization/EquationPanel.vue` | Floating equation overlay (KaTeX + notation pills) | bespoke `glass-subtle` div, `absolute` positioned | 128 | overlay z-`[15]` (HARDCODED) | overlay |
| D9 | `web/src/components/visualization/FullscreenViewer.vue` | Fullscreen modal hosting canvas + bottom dock | `Teleport` + bespoke backdrop + `AnimationControls` re-host | 190 | full-viewport | full-viewport |
| D10 | `web/src/components/visualization/ExportModal.vue` | Export-options modal (4 switches + Save) | `Teleport` + bespoke `.modal-card` | 147 | centered modal | centered modal |
| D11 | `web/src/components/equation/EqCoefficientsPanel.vue` | Equation-route coefficients readout (twin of D7) | `cartoon-card` + `CollapsibleSection` | 141 | in-flow left panel | in-flow |
| D12 | `web/src/components/paper/PaperSidebar.vue` | Desktop paper TOC | `useSidebarState<T>` + `Collapsible` | 282 | sticky aside | hidden (`lg:hidden` partner D13) |
| D13 | `web/src/components/paper/MobileFloatingToc.vue` | Mobile paper TOC dropdown | `useSidebarState<T>` + bespoke `v-if` dropdown + backdrop | 374 | hidden | sticky top + dropdown |
| D14 | `web/src/components/layout/AppHeader.vue` | Top nav dock (sticky header + dropdown + hover-card) | `DropdownMenu` + `HoverCard` (root barrel) | 340 | sticky top | sticky top |

**Count: 14 dock-shaped surfaces.**

## §3 — Per-dock architectural inspection

- **D1 EditorControlsDock** — `GlassDock` ✅; `:collapse-delay="2000" :start-collapsed="true" fit-content`; `HoverPopover keep-dock-open` for magnet + overlay clusters; `Slider variant="glass-scrubber"` retinted via `--track-color` (A.W2.c). Magnet popover and overlay-stack popover use `keep-dock-open` correctly. Per-action accent variants `is-amber`/`is-sky`/`is-rose`/`is-save` are unique to this dock (idiom not lifted into substrate).
- **D2 CanvasControlsDock** — `GlassDock` ✅; uses `dockRef.expanded` exposed via `defineExpose` (`VisualizationView.vue:233` reads `dockExpanded` to add `dock-centered` class — out-of-band coupling). HoverPopover `keep-dock-open`. The `view-dot` indicator is bespoke (could be `StatusDot`).
- **D3 AnimationControls** — `GlassDock` ✅ but hosts a **hand-rolled three-dot menu** (`.menu-popup`, `onClickOutside`, `Transition name="popup"`) instead of `DockDropdownTrigger`/`DropdownMenu`. Hand-rolled `.play-btn` (50+ LOC of rainbow-gradient CSS) is bespoke. Width hack `--animation-dock-max-width` is a cross-component CSS-var contract with FullscreenViewer (`FullscreenViewer.vue:171`).
- **D4 EditorToolsPanel** — pure `cartoon-card` in-flow; no `GlassDock`. Twin of D1 contents (`Smooth`/`Simplify`/`Magnet`) — **the same three operations live in two surfaces**, once as a floating dock (D1) and once as an in-flow panel (D4). Hard duplication.
- **D5 ContourSettings** — heaviest in-flow panel; nests `Collapsible` inside `CollapsibleSection` (mixed primitives — the outer is local wrapper, the inner is glass-ui). Hand-rolled `adv-open`/`adv-close` keyframes duplicate `CollapsibleContent`'s `--reka-collapsible-content-height` channel.
- **D6 BasisSelector** — `cartoon-card` + sliders; manual `aria-pressed` toggle pills; `Slider variant="glass-scrubber"` retint ✅.
- **D7 CoefficientsPanel** — `cartoon-card`; bespoke amplitude-bar TransitionGroup + hover tooltip via `.coeff-tooltip` CSS `:hover` (not a real tooltip primitive).
- **D8 EquationPanel** — overlay panel with **hardcoded `z-[15]`** (`EquationPanel.vue:114`) — the only ladder violation across the dock cohort. Bespoke close button + `MetricBadge` + `NotationPills` + KaTeX render. No focus management; no escape handling.
- **D9 FullscreenViewer** — `Teleport to="body"` + `var(--z-fullscreen)` ✅; uses `--animation-dock-max-width: 60rem` to widen the re-hosted D3 (cross-component contract). Local `onKeydown` listener for Esc ✅. **No focus trap**; the Minimize2 close button is the only focusable thing but tab can leak to background.
- **D10 ExportModal** — `Teleport` + `var(--z-modal)` ✅; `@click.self` backdrop dismiss; **no Esc handler**, **no focus trap**, no `role="dialog"`, no `aria-modal`. The Cancel/Save Button pair is keyboard-reachable but not autofocused.
- **D11 EqCoefficientsPanel** — verbatim twin of D7 minus FrequencyGraph (`rg`-verified). Hard duplication.
- **D12 PaperSidebar** — `useSidebarState<T>` ✅ (W3.5.c); `Collapsible` + `CollapsibleContent` ✅. Sticky aside with `--paper-scroll-viewport-height` clamp.
- **D13 MobileFloatingToc** — `useSidebarState<T>` ✅; hand-rolled `v-if` dropdown + `.floating-toc-backdrop` (`position: fixed; inset: 0`) + scroll-lock side-effect on `props.scrollContainer.style.overflow`. **No Esc handler**, **no focus return** after dismiss.
- **D14 AppHeader** — `DropdownMenu` + `HoverCard` from root barrel ✅; sticky + `z-[var(--z-overlay)]` ✅.

## §4 — Consistency audit

- **Naming drift.** Three docks named `*Dock.vue` (D1 D2, D3 indirectly), three named `*Panel.vue` (D4 D5 D7 D8 D11), one named `*Settings.vue` (D5), one `*Controls.vue` (D3) — same shape, four labels.
- **Surface drift.** Floating docks (D1 D2 D3) use `GlassDock`; in-flow panels (D4–D7, D11) use `cartoon-card`; overlay panels (D8 D10) and modals (D9 D10) roll their own. Three different background idioms (`GlassDock` plate, `cartoon-card`, `glass-subtle`+absolute, `.modal-card`).
- **Section-toggle drift.** In-flow panels uniformly wrap content in `CollapsibleSection` (local wrapper). D5 additionally nests `Collapsible` for an "Advanced" sub-section with hand-rolled keyframes that duplicate the substrate's already-shipped `data-state` animation.
- **Reset-affordance drift.** D5 and D6 each carry a `.reset-icon-btn` block, byte-similar; D3 has none, D1 has none. The reset glyph is `RotateCcw` in both.
- **Coefficients duplication.** D7 (`web/.../visualization/CoefficientsPanel.vue`) and D11 (`web/.../equation/EqCoefficientsPanel.vue`) are 95%-identical hand-rolled spectrum readouts — the only structural difference is D7's `FrequencyGraph` import.
- **EditorTools duplication.** D1 (floating) and D4 (in-flow) both expose Smooth/Simplify/Magnet — the latter is dead-code-suspect or vestigial after D1's contour-editor adoption.
- **Configurator gap.** Zero fourier files consume `Configurator`/`ConfiguratorRow`/`useConfiguratorState`. The in-flow left-panel stack (D4+D5+D6+D7 inside `viz-panel-left`) is the canonical Configurator shape (stage + preset row + layered controls) but rolled by hand.
- **Z-index discipline.** All docks but D8 (`z-[15]` literal) use the `--z-*` token ladder; D9 uses `calc(var(--z-fullscreen) + 10)` for its close button (small magic number).
- **Glass-ui `useSidebarState<T>` generic precedent.** Established at W3.5.c for paper TOCs. The visualization left-panel stack has no equivalent "section-expand-state" composable, so each panel rolls its own via `CollapsibleSection`'s local `default-open`.

## §5 — Accessibility findings

| # | Site | Severity | Finding |
|---|------|---------:|---------|
| A1 | D10 ExportModal | **HIGH** | No `role="dialog"`, no `aria-modal="true"`, no Esc handler, no focus trap, no autofocus on first focusable. |
| A2 | D9 FullscreenViewer | MED | Esc handler ✅; no focus trap, no `role="dialog"`, focus can tab into the background after open. |
| A3 | D8 EquationPanel | MED | Overlay panel with no Esc handler; close button has no `aria-label`. |
| A4 | D13 MobileFloatingToc | MED | Dropdown has no Esc handler; focus does not return to the trigger after dismiss; mutates `scrollContainer.style.overflow` as a side-effect (works but is implicit). |
| A5 | D12 PaperSidebar | LOW | `<aside>` has no `aria-label="Table of contents"`. |
| A6 | D3 AnimationControls | LOW | Hand-rolled menu has `:aria-expanded` ✅ but no `role="menu"`/`role="menuitem"` (substrate `DropdownMenu` provides these). |
| A7 | D1/D2/D3 docks | LOW | None expose a "keyboard shortcut to pin" (`Cmd+K`-style) or surface that they are pinnable. |
| A8 | D7/D11 CoefficientsPanel | LOW | Hover-tooltip is CSS-`:hover`-only — invisible to keyboard users; no `Tooltip` primitive. |

**8 a11y gaps total (1 HIGH, 3 MED, 4 LOW).**

## §6 — Glass-ui leverage gap analysis

| # | Surface | Carry | Direction |
|---|---------|-------|-----------|
| G1 | D3 AnimationControls hand-rolled three-dot menu | Substitute `DockDropdownTrigger` + `DropdownMenuContent` | consumer-side wire |
| G2 | D3 hand-rolled `play-btn` + rainbow gradient | Either lift into glass-ui as a `RainbowPlayButton` or accept as one-off (bespoke is fine; the recipe is opulent and uniquely fourier) | KEEP-AS-IS or upstream |
| G3 | D5 hand-rolled `adv-open`/`adv-close` keyframes | Already-shipped: `CollapsibleContent` w/ `data-state` animation already in the file's outer block — extend to inner Advanced section | consumer-side wire |
| G4 | D8 EquationPanel rolls `glass-subtle` overlay | Substitute `HoverPopover` or `Popover` (anchored to canvas trigger); or compose `GlassDock variant="rail"` if persistent | consumer-side wire |
| G5 | D10 ExportModal hand-rolled modal chassis | Substitute glass-ui `Dialog` primitive (or compose with reka-ui `Dialog` via glass-ui re-export); pickup `role="dialog"` + focus trap for free | consumer-side wire + possible glass-ui Dialog re-export gap |
| G6 | D4+D5+D6+D7 left-panel stack | Substitute `Configurator` + `ConfiguratorLayer` + `ConfiguratorRow`; lift the stage (BasisCanvas) into `Configurator`'s stage slot | architectural — high-effort, high-coherence |
| G7 | D2 `view-dot` indicator | Substitute `StatusDot` (already noted in d-style-glassui audit as 0-adoption) | consumer-side wire |
| G8 | D1+D2+D3 dock-state coordination | No substrate composable for "multiple docks at the same anchor" (the bottom-overlay has D3 and D1 conditionally swapping). A `useDockGroup` shipping mutual-exclusion or smart-stacking would be a constellation carry — **not yet warranted** (only one site). | KEEP-AS-IS |
| G9 | D5/D6 `.reset-icon-btn` duplicate | Extract `ResetIconButton` (consumer-local) or lift `<Button variant="reset">` to glass-ui | consumer-side extraction; library carry not warranted (2 sites) |
| G10 | D7+D11 coefficients spectrum readout | Extract shared `CoefficientsSpectrum.vue` (consumer-side); already-shipped `MetricRow`/`MetricStack`/`AnimatedDigit` would substantially reduce the bespoke shimmer | consumer-side dedup + AnimatedDigit/MetricRow adoption |
| G11 | D9 FullscreenViewer focus management | No substrate composable for "fullscreen modal with focus trap" — could be a `useFullscreenTrap` constellation carry, but a one-line `focus-trap-vue` import or a single inline-focus-trap discharges it | consumer-side wire |

**11 leverage gaps total** (8 consumer-side wires, 1 architectural Configurator-adoption, 1 KEEP-AS-IS, 1 possible glass-ui Dialog re-export).

## §7 — Defect / opportunity ledger

| # | Finding | Severity | Disposition |
|---|---------|---------:|-------------|
| F1 | D8 EquationPanel `z-[15]` hardcoded | LOW | FOLD-INTO-B (single-line fix in B's coherence pass; route through `var(--z-controls)` or `var(--z-overlay)`) |
| F2 | D10 ExportModal a11y gap (A1) | **HIGH** | FOLD-INTO-B (replace with glass-ui Dialog substitute OR add `role="dialog"` + `aria-modal` + Esc + focus trap inline) |
| F3 | D9 FullscreenViewer focus trap gap (A2) | MED | FOLD-INTO-B |
| F4 | D8 EquationPanel Esc + aria-label gap (A3) | MED | FOLD-INTO-B |
| F5 | D13 MobileFloatingToc Esc + focus-return gap (A4) | MED | FOLD-INTO-B |
| F6 | D5 ContourSettings nested Collapsible + duplicate keyframes (G3) | LOW | FOLD-INTO-B |
| F7 | D7+D11 Coefficients panels 95% duplicated (G10) | MED | FOLD-INTO-B (extract `CoefficientsSpectrum.vue`) |
| F8 | D1+D4 EditorTools content duplicated (Smooth/Simplify/Magnet in two surfaces) | MED | FOLD-INTO-B (decide canonical home — likely retire D4 EditorToolsPanel or repurpose) |
| F9 | D4–D7 in-flow panel stack does not consume Configurator (G6) | MED | FOLD-INTO-B (architectural — UX-coherence wave) |
| F10 | D3 AnimationControls hand-rolled menu (G1) | LOW | FOLD-INTO-B |
| F11 | D3 AnimationControls `--animation-dock-max-width` cross-component CSS-var contract w/ D9 | LOW | FOLD-INTO-B (document as invariant OR replace with prop) |
| F12 | D2 dockRef.expanded read by VisualizationView via defineExpose for `dock-centered` class | LOW | FOLD-INTO-B (out-of-band coupling — extract to `useDockState` consumer or refactor) |
| F13 | Naming drift across dock-shaped surfaces (Dock/Panel/Controls/Settings) | LOW | FOLD-INTO-B (B's coherence wave should standardise) |
| F14 | No `useDockSnap` / `useDockResize` / drag-to-move in substrate | INFO | KEEP-AS-IS (no fourier consumer needs it; not warranted yet) |
| F15 | D3 hand-rolled `play-btn` rainbow gradient | INFO | KEEP-AS-IS (opulent fourier-only register; not reuse-shaped) |
| F16 | Glass-ui Dialog re-export gap (G5) | LOW | ROUTE-TO-glass-ui-AUGMENTATION — verify `Dialog` is subpath-exported; if not, file glass-ui carry |
| F17 | StatusDot / AnimatedDigit / MetricRow non-adoption (d-style §2a still standing) | LOW | FOLD-INTO-B (already on the books from prior audit) |

**Tally: 17 ledger items.** 1 HIGH, 5 MED, 8 LOW, 2 INFO, 1 routes to glass-ui.

## §8 — B-tranche absorption

The following findings should **fold into tranche B's UX-coherence wave** as
new invariants / wave items:

- **B-inv-1 (a11y).** Every modal / floating overlay carries `role="dialog"`
  (or equivalent), `aria-modal="true"` on modal surfaces, an Esc handler,
  and a focus trap. Discharges F2 F3 F4 F5. (4 dispositions.)
- **B-inv-2 (z-index).** No literal `z-[N]` in dock / overlay / modal
  surfaces; all route through `--z-*` tokens. Discharges F1.
- **B-inv-3 (dock naming).** The repository's dock-shaped surfaces adopt a
  consistent naming idiom (Dock for floating, Panel for in-flow, Modal for
  blocking). Discharges F13.
- **B-wave-item-α (Configurator adoption).** The visualization-route left
  panel stack (D4+D5+D6+D7) migrates to `Configurator` + `ConfiguratorLayer`
  + `ConfiguratorRow`, lifting BasisCanvas into the stage slot. Discharges
  F9 plus implicit naming + duplicated `.reset-icon-btn` issues. **High
  effort, high coherence win.**
- **B-wave-item-β (Coefficients dedup).** Extract
  `web/src/components/shared/CoefficientsSpectrum.vue` consumed by both
  visualization (D7) and equation (D11) routes; concurrently wire
  AnimatedDigit + MetricRow per d-style §2a. Discharges F7 + F17.
- **B-wave-item-γ (EditorTools rationalisation).** Decide canonical home for
  Smooth/Simplify/Magnet — keep D1 floating dock; retire D4 in-flow panel
  OR fold D4 into ContourSettings as an Advanced sub-section. Discharges F8.
- **B-wave-item-δ (D5 ContourSettings refactor).** Replace hand-rolled
  `adv-open`/`adv-close` keyframes with already-imported `CollapsibleContent`
  `data-state` channel. Discharges F6.
- **B-wave-item-ε (D3 AnimationControls cleanup).** Substitute
  `DockDropdownTrigger` + `DropdownMenuContent` for the hand-rolled
  `.menu-popup`; convert `--animation-dock-max-width` cross-component
  contract to a typed prop. Discharges F10 + F11. Keep `play-btn` (F15).
- **Constellation carry (single).** Verify glass-ui's `Dialog` is
  subpath-exported; if not, file a glass-ui-side augmentation (`/dialog`
  subpath + `useDialogFocus` composable). Routes F16. **One carry; no other
  substrate gap warranted at this revision.**

**B-tranche absorption count: 8 (3 invariants + 5 wave items).** One
glass-ui carry routed.

---

## Final tally

- **Docks audited:** 14.
- **Consistency-drift findings:** 6 (naming, surface, section-toggle,
  reset-affordance, coefficients duplication, editortools duplication).
- **A11y gaps:** 8 (1 HIGH, 3 MED, 4 LOW).
- **Glass-ui leverage gaps:** 11 (8 consumer-wire, 1 architectural,
  1 keep-as-is, 1 routes to glass-ui).
- **B-tranche absorptions:** 8 (3 invariants + 5 wave items) + 1 glass-ui
  carry.
