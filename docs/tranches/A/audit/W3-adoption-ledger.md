# A.W3 — Primitive adoption ledger

Authored by agent **A.W3.c — Metric/readout primitive adoption** under tranche
A wave W3 of `fourier-analysis`. This artefact discharges constellation P12 —
the AB+1 primitive cohort glass-ui shipped two tranches back (the
`AnimatedDigit` + `Metric{Row,Stack,Cell,Badge}` + `StatusDot` + `Skeleton`
cohort) and which fourier-analysis had never adopted. The discharge applies
invariant 4 (substrate-with-consumer) in reverse: the substrate landed in
glass-ui at v2.0.0; the consumer-side wiring lands here.

The W0-challenge §2 row 8 amended the raw `fira-code`/`font-mono` count to
**82** hits across `web/src/**/*.{vue,ts}` (up from the H2 reading's 69). The
sites triage into three classes: tabular numeric readouts (replaced by the
AB+1 metric cohort), code-like decoration (numbers as typographic-affordance
glyphs — section numbers, slugs, hashes, code-input boxes — kept as
`fira-code`), and form inputs (numeric `<input>` controls — kept as
`fira-code`). The ledger names each site and its disposition, citing the
pre- and post-migration `file:line` so a reader can verify the substrate-
with-consumer invariant has closed.

A.W3.c's bounds are the readout cohort + the C4-residual composable folds.
The button cohort (W3.a + W3.b) and the `@keyframes` / motion cleanup (W3.d)
sit outside.

## W3.c — AB+1 primitive cohort adoption

| Primitive | Import | Consumer site (file:line pre → post) | Disposition | Citing commit |
|---|---|---|---|---|
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:38` → `:38` (entries stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:42` → `:42` (featured stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:46` → `:46` (saved stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:50` → `:50` (views stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:54` → `:54` (likes stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryAdminBanner.vue:58` → `:58` (storage stat) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/EquationPanel.vue:71` → energy-% readout | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/equation/InfoCard.vue:30` → energy-% readout | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/equation/EquationView.vue:290` → energy-% readout in tier info hover-card | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/AnimationControls.vue:69` → speed × readout (collapsed-summary) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/EditorToolsPanel.vue:53` → magnet radius readout | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/EditorControlsDock.vue:112` → magnet radius readout (popover) | adopted | A.W3.c.1 |
| `MetricBadge` | `@mkbabb/glass-ui` | `web/src/components/visualization/gallery/GalleryDraftsSection.vue:55` → drafts count | adopted | A.W3.c.1 |
| `AnimatedDigit` | `@mkbabb/glass-ui` | none — fourier's numeric readouts are all static-format (`.toFixed`-bound coefficient tables, single-snapshot stats); no live-damping counters of the speedtest gestalt | retired-with-rationale | A.W3.c.1 |
| `MetricRow` / `MetricStack` | `@mkbabb/glass-ui` | none — the coefficient tables (CoefficientsPanel, EqCoefficientsPanel) use a TransitionGroup of horizontal-bar rows with a colour spectrum + hover tooltip; the gestalt is a sparkline-bar list, not the icon|label|value subgrid `MetricRow` ships. MetricStack's audacious-poster register is wrong for this surface | kept-as-decorative | A.W3.c.1 |
| `MetricCell` | `@mkbabb/glass-ui` | none — no icon-on-label + stacked value + unit cards in fourier; the closest gestalt (GalleryAdminBanner stats) reads as a label-under-value pill cluster, better fit for `MetricBadge labelPosition="stacked"` | retired-with-rationale | A.W3.c.1 |
| `StatusDot` | `@mkbabb/glass-ui` | none — the gallery tier indicators use Crown/Bookmark icons (GalleryCard.vue:117-118) for semantic affordance, not a filled dot; the tier filter uses `<Select>` dropdowns (GallerySearchBar.vue:76-89), not a dot-+-label control. The dot vocabulary's "active/paused/idle/error" set has no fourier equivalent | retired-with-rationale | A.W3.c.1 |
| `Skeleton` | `@mkbabb/glass-ui` | none — fourier has no hand-rolled loading-shimmer rectangles; the loading states are spinner-based (`animate-spin` border-circles in EquationView.vue:221, ContourSettings, VisualizationView.vue:154) — that motion register lives in glass-ui's spinner vocabulary, not Skeleton's pulse/shimmer/breath surface-stand-in. The grep for `animate-pulse` finds three sites that pulse an icon during a state transition (CanvasControlsDock.vue:66, etc.) — those are icon-state-pulse, not surface-skeleton | retired-with-rationale | A.W3.c.1 |

### Kept-as-decorative sites — `fira-code` as code-like typographic affordance, not as a metric

These sites use `fira-code` for typographic-affordance reasons (the
monospace conveys "this is a code-like identifier" or "this is a numeric
input the user types into") rather than as a tabular-numeric metric. The
primitive cohort is the wrong target — the substrate ships a metric
register, not a code register. Each row stays as-is.

| Site (file:line) | Class | Why kept |
|---|---|---|
| `paper/PaperView.vue:335` | paper page indicator | decorative typography on the paper-reader overlay |
| `paper/MobileFloatingToc.vue:103,142,152` | section numbers | code-like ToC numbering glyph |
| `paper/PaperSidebar.vue:74,96,111` | section numbers | code-like ToC numbering glyph |
| `paper/search/PaperSearchDropdown.vue:51`, `paper/search/PaperSearchModal.vue:89,104,107,110` | search-result numbers + keyboard-shortcut hints | code-like keyboard glyph + ToC numbering |
| `visualization/ContourSettings.vue:308` | retry error message | text state, not a metric |
| `visualization/BasisSelector.vue:154,180` | `inline-number` input | numeric `<input>` control — `fira-code` for the user's typing affordance |
| `visualization/ImageUpload.vue:61,79` | "Image unavailable" / "Drop to replace" labels | text state, not a metric |
| `visualization/AnimationControls.vue` (collapsed summary `summary-speed`) | replaced (see table above) | — |
| `visualization/GlassTimeline.vue:63` | caret-value label | decorative micro-label drifting under the scrubber |
| `visualization/CoefficientsPanel.vue:52,64,77,88,90,92,94` | coefficient table | tabular-numeric, but a sparkline-bar list (see `MetricRow` retire-with-rationale above) |
| `visualization/EquationPanel.vue:100` | error text | text state, not a metric |
| `visualization/VisualizationView.vue:155,162` | loading/error text | text state, not a metric |
| `visualization/gallery/GalleryCard.vue:79,103,111` | image slug + view / like counts | code-like identifier glyph (`font-mono` retained for ID affordance) |
| `visualization/gallery/GalleryCardModal.vue:105,113,122,154` | slug + view / like / N-harmonics | code-like identifier glyph |
| `visualization/gallery/GallerySearchBar.vue:51` | search input | input control |
| `visualization/gallery/UserSlugBar.vue:89,125` | user slug + input | code-like identifier + input control |
| `visualization/gallery/GalleryDraftsSection.vue:81` | draft slug | code-like identifier |
| `visualization/gallery/AdminFlaggedPanel.vue:95` | snapshot hash / slug | code-like identifier |
| `visualization/gallery/AdminUserList.vue:155` | user slug | code-like identifier |
| `visualization/gallery/GalleryGrid.vue:62` | pagination ratio | replaced (see table above)? — kept; the `page / pages` is a navigation ratio, not a metric — see decorative-vs-metric note below |
| `ui/SliderControl.vue:76` | `inline-number` input | numeric input control |
| `equation/EqCoefficientsPanel.vue:44,56,69,79,81,83,85` | coefficient table | same gestalt as CoefficientsPanel — sparkline-bar list, not MetricRow |
| `equation/InfoCard.vue:30` | replaced | — |
| `equation/EquationView.vue:222,230,239,243` | loading / error / "Recomputing…" text | text state, not a metric |
| `equation/EquationView.vue:290` | replaced | — |
| `equation/FrequencyGraph.vue:193,195` | hover-tooltip values | decorative inside the popover (the popover is itself a metric scratchpad — value lives there) |
| `equation/FunctionInput.vue:102,119,130,199` | expression / domain `<input>` + N-eff hint | input controls + a tiny in-tooltip hint |
| `morph/HarmonicLevelGrid.vue:15,38` | `level-input` numeric `<input>` | input control |
| `morph/HarmonicLevelGrid.vue:272`, `morph/MorphShapePreview.vue:148`, `morph/FourierMorphDemo.vue:294,318` | `font-family: var(--font-mono)` in `<style>` blocks | CSS-level decoration, not a class on a metric |
| `morph/MorphPhaseConfig.vue:17,19` | `num-input` + unit | input control + its unit suffix |
| `layout/AppHeader.vue:80` | `@mbabb` handle | code-like identifier |

The `font-mono` survivor count after migration (verified via `grep -rE
'fira-code\b|font-mono\b' web/src --include='*.vue' --include='*.ts' | wc -l`)
is recorded post-commit in `PROGRESS.md`.

## W3.b — D5 `SliderControl.vue` variant prop residual

| Disposition | Notes |
|---|---|
| **(b) retired-with-rationale** | The `variant?: "timeline" \| "default"` prop on `web/src/components/ui/SliderControl.vue` is retired wholesale. Justification: `grep -rn 'SliderControl' web/src/ \| grep variant` returns ZERO matches — no consumer (in `ContourSettings.vue`, `BasisSelector.vue`, `EquationPanel.vue`, `FunctionInput.vue`, or anywhere else in the seven instantiations) passes the prop explicitly. The H1 reading's "(`timeline` vs `default`)" annotation in the original docblock already records that both branches map cosmetically to the same internal `<Slider variant="glass-scrubber">`; with zero consumer dependency, retaining the prop violates invariant 1 (KISS / DRY). The component now commits unconditionally to `<Slider variant="glass-scrubber">` and the docblock records the disposition. Carried out at `web/src/components/ui/SliderControl.vue`. Citing commit: A.W3.b.1. |

## W3.c — C4-residual composable folds (`useTouchGate`, `useResizeObserver`)

| Composable | fourier consumer | glass-ui canonical | Disposition |
|---|---|---|---|
| `useTouchGate` | none — `grep -rln 'useTouchGate' web/src` returns no fourier consumer | `@mkbabb/glass-ui` exports `useTouchGate(deactivateDelayMs?: number): TouchGateReturn` from the root barrel (`dist/index.d.ts:5850`) | retired-with-rationale — no fourier consumer ever wired it; glass-ui ships the canonical for any future consumer to import |
| `useResizeObserver` | none — `grep -rln 'useResizeObserver' web/src` returns no fourier consumer | `@mkbabb/glass-ui` exports `useResizeObserver<T>(target, callback, options?): UseResizeObserverControls` from the root barrel (`dist/index.d.ts:5600`) | retired-with-rationale — no fourier consumer ever wired it; glass-ui ships the canonical for any future consumer to import |

Both composables already live on the glass-ui side under the same names with
the same shape, so the H1 flag's discipline (invariant 7 — no silent
deferral) closes with the empty-consumer reading. No local-composable file
exists at `web/src/composables/` for either name (verified `ls
web/src/composables/`); no migration is owed.

## Footer — adoption count by primitive

| Primitive | Count |
|---|---|
| `MetricBadge` | 13 |
| `AnimatedDigit` | 0 (retired-with-rationale — no live-damping counters in fourier) |
| `MetricRow` / `MetricStack` | 0 (retired-with-rationale — coefficient gestalt is sparkline-bar, not subgrid metric row) |
| `MetricCell` | 0 (retired-with-rationale — no icon-on-label dashboard cards) |
| `StatusDot` | 0 (retired-with-rationale — tier vocabulary uses Crown/Bookmark + Select dropdowns) |
| `Skeleton` | 0 (retired-with-rationale — fourier's loading register is spinner, not surface-skeleton) |
| **Total adopted** | **13** |
| **Total retired-with-rationale** | **5 primitives** |
| **Kept-as-decorative `fira-code`/`font-mono` sites** | ≈55 (the residue after the 13 metric migrations + the 14 morph/SliderControl input-control sites) |

## W3.d — Motion-vocabulary cleanup

Agent: A.W3.d. Scope (W3.md §Scope item 4): `@keyframes` de-duplication,
`cubic-bezier` excision, `transition: all` cleanup. Source-of-truth tables:
glass-ui `src/styles/animations.css` (canonical keyframes), glass-ui
`src/styles/tokens.css` (`--ease-*` / `--motion-ease-*` tokens), glass-ui
`src/styles/transitions.css` (canonical Vue-Transition class recipes).

### `@keyframes` shadow deletions

| Row | File:line (pre) | Keyframe | Substrate source | Disposition |
|---|---|---|---|---|
| d.1 | `web/src/components/ui/CollapsibleSection.vue:63,67` | `collapsible-open`, `collapsible-close` | `@mkbabb/glass-ui/styles/animations.css` §"Collapsible (reka-ui)" | excised — substrate keyframes resolve via global cascade; PRM guard added |
| d.2 | `web/src/components/equation/ConvergencePlot.vue:390` | `tooltip-in` | `@mkbabb/glass-ui/styles/animations.css` §"Tooltip entrance" | excised — substrate keyframe resolves via global cascade; PRM guard added on `.curve-tooltip` |

### `@keyframes` retained (fourier-local, no glass-ui shadow)

| Row | File:line | Keyframe | Disposition |
|---|---|---|---|
| d.3 | `web/src/style.css:96` | `tab-slide-in` | documented local carry per W2.b CONSTELLATION row (glass-ui Tabs primitive does not yet ship this); PRM guard already present |
| d.4 | `web/src/components/visualization/ContourSettings.vue:359,363` | `adv-open`, `adv-close` | fourier-local advanced-collapsible variant; CONSTELLATION candidate (P-tranche) |
| d.5 | `web/src/components/visualization/ImageUpload.vue:160` | `rainbow-slide` | fourier-local gradient sweep; no glass-ui equivalent |
| d.6 | `web/src/components/visualization/AnimationControls.vue:175` | `rainbow-drift` | fourier-local play-button ambient; PRM guard added |
| d.7 | `web/src/components/visualization/ContourEditorCanvas.vue:327` | `golden-shimmer` | fourier-local drop-shadow filter (not a `gold-shimmer-slide` shadow — different gestalt) |
| d.8 | `web/src/components/visualization/gallery/GalleryGrid.vue:110` | `spin` | generic spin; glass-ui's `pulse-ring-spin` covers the gestalt conceptually but not by name |
| d.9 | `web/src/components/visualization/gallery/GalleryCard.vue:236` | `like-bounce` | fourier-local heart-bounce; PRM guard added; CONSTELLATION candidate |
| d.10 | `web/src/components/visualization/gallery/GalleryMarquee.vue:116,121` | `marquee-scroll-left`, `marquee-scroll-right` | fourier-local marquee |

### `cubic-bezier` → canonical-token replacements

Token mapping (per glass-ui `src/styles/tokens.css` §"Core cubic-bezier"):

- `cubic-bezier(0.4, 0, 0.2, 1)` → `var(--ease-standard)` (`--motion-ease-standard`)
- `cubic-bezier(0, 0, 0.2, 1)` → `var(--ease-out)` (`--motion-ease-out`)
- `cubic-bezier(0.4, 0, 1, 1)` → `var(--ease-in)` (`--motion-ease-in`)
- `cubic-bezier(0.16, 1, 0.3, 1)` → `var(--ease-out-expo)` (`--motion-ease-out-expo`)
- `cubic-bezier(0.22, 1, 0.36, 1)` → `var(--ease-out-expo)` (closest canonical; same family, no separate `easeOutQuart` token)
- `cubic-bezier(0.34, 1.56, 0.64, 1)` → `var(--ease-apple-spring)` (`--motion-ease-apple-spring`, overshoot)
- `cubic-bezier(0.22, 1.6, 0.36, 1)` → `var(--ease-apple-spring)` (closest canonical overshoot)

| Row | File:line | Pre | Post |
|---|---|---|---|
| d.11 | `equation/EquationView.vue:439,444` | `cubic-bezier(0.4, 0, 0.2, 1)` | `var(--ease-standard)` |
| d.12 | `equation/EquationView.vue:461` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` |
| d.13 | `layout/AppHeader.vue:265` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `var(--ease-apple-spring)` |
| d.14 | `paper/MobileFloatingToc.vue:361` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` |
| d.15 | `paper/PaperSearch.vue:228,365` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` |
| d.16 | `paper/PaperSearch.vue:375` | `cubic-bezier(0.4, 0, 1, 1)` | `var(--ease-in)` |
| d.17 | `paper/PaperSidebar.vue:223,224,253,254` | `cubic-bezier(0.16, 1, 0.3, 1)` (×4) | `var(--ease-out-expo)` (×4) |
| d.18 | `paper/PaperView.vue:416` | `cubic-bezier(0.22, 1, 0.36, 1)` | `var(--ease-out-expo)` |
| d.19 | `paper/PaperView.vue:502` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` (also `transition: all` → named properties) |
| d.20 | `paper/PaperView.vue:552,553,569` | `cubic-bezier(0.16, 1, 0.3, 1)` (×3) | `var(--ease-out-expo)` (×3) |
| d.21 | `visualization/ExportModal.vue:131` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `var(--ease-apple-spring)` |
| d.22 | `visualization/ExportModal.vue:191` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` |
| d.23 | `visualization/FullscreenViewer.vue:170` | `cubic-bezier(0.16, 1, 0.3, 1)` | `var(--ease-out-expo)` |
| d.24 | `visualization/VisualizationView.vue:392` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `var(--ease-apple-spring)` |
| d.25 | `visualization/VisualizationView.vue:400` | `cubic-bezier(0.4, 0, 0.2, 1)` | `var(--ease-standard)` (also `transition: all` → named properties) |
| d.26 | `visualization/VisualizationView.vue:421-423` | `cubic-bezier(0.22, 1, 0.36, 1)` (×3) | `var(--ease-out-expo)` (×3) |
| d.27 | `visualization/gallery/GalleryCard.vue:162` | `cubic-bezier(0.22, 1.6, 0.36, 1)` | `var(--ease-apple-spring)` |
| d.28 | `visualization/gallery/GalleryCard.vue:233` | `cubic-bezier(0.22, 1.6, 0.36, 1)` | `var(--ease-apple-spring)` (`like-bounce` animation timing) |
| d.29 | `visualization/gallery/GalleryCardModal.vue:230` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `var(--ease-apple-spring)` |
| d.30 | `visualization/gallery/GallerySearchBar.vue:178` | `cubic-bezier(0.22, 1.6, 0.36, 1)` | `var(--ease-apple-spring)` (also `transition: all` → named properties) |

### `transition: all` → named-properties cleanups

| Row | File:line | Properties enumerated |
|---|---|---|
| d.31 | `paper/MobileFloatingToc.vue:224` (`.floating-toc-search-btn`) | `color`, `background-color` |
| d.32 | `paper/MobileFloatingToc.vue:325` (`.floating-toc-item`) | `color`, `background-color` |
| d.33 | `paper/PaperSidebar.vue:192` (`.sidebar-top-btn`) | `color`, `border-color`, `background-color` |
| d.34 | `paper/PaperView.vue:502` (`.overlay-btn`) | `color`, `border-color`, `background-color`, `box-shadow`, `transform` |
| d.35 | `visualization/FullscreenViewer.vue:133` (`.fs-close`) | `color`, `background-color`, `border-color`, `transform` |
| d.36 | `visualization/ContourSettings.vue:447,450` (`.slide-down-*`) | `opacity`, `transform` |
| d.37 | `visualization/EasingPicker.vue:67` (`.easing-chip`) | `background-color`, `border-color` |
| d.38 | `visualization/EditorToolsPanel.vue:86` (`.tool-btn`) | `border-color`, `background-color`, `transform`, `box-shadow` |
| d.39 | `visualization/AnimationControls.vue:215` (`.icon-swap-*`) | `opacity`, `transform` |
| d.40 | `visualization/CoefficientsPanel.vue:123,126` (`.coeff-list-*`) | `opacity`, `transform` |
| d.41 | `equation/EqCoefficientsPanel.vue:115,116` (`.coeff-list-*`) | `opacity`, `transform` |
| d.42 | `equation/EquationView.vue:439,444` (`.pop-*` / `.slide-down-*`) | `opacity`, `transform` |
| d.43 | `equation/EquationModeToggle.vue:51` (`.eq-toggle-btn`) | `color`, `background-color` |
| d.44 | `equation/convergence/ConvergenceTimeline.vue:113` (`.play-btn`) | `color`, `background-color`, `border-color` |
| d.45 | `visualization/gallery/UserSlugBar.vue:150` (`.icon-swap-*`) | `opacity`, `transform` |
| d.46 | `visualization/VisualizationView.vue:400,401` (`.slide-down-*`) | `opacity`, `transform` |
| d.47 | `visualization/gallery/GallerySearchBar.vue:178,181` (`.filter-drawer-*`) | `opacity`, `transform` |

### Footer — pre/post counts

- `@keyframes` total in `web/src/`: **13 pre → 11 post** (2 shadow rules excised; the substrate keyframes still register via the global cascade so the rendered animation set is unchanged).
- `@keyframes` glass-ui canonical shadows: **3 pre → 0 post** (`collapsible-open`, `collapsible-close`, `tooltip-in`).
- `cubic-bezier` strings in `web/src/`: **29 pre → 0 post**.
- `transition: all` usages in `web/src/`: **26 pre → 0 post**.

Verification commands (post-commit):

```
$ grep -rnE '@keyframes (fade-in|scale-in|slide-up|collapsible-open|collapsible-close|tooltip-in)\b' web/src/
$ grep -rnE 'cubic-bezier' web/src/
$ grep -rnE 'transition:\s*all\b' web/src/
```

All three return zero matches. `vue-tsc -b --force` exits 0.
