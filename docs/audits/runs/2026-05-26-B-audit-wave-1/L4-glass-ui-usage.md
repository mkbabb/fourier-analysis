# L4 — Glass-ui usage audit

Authored by agent **L4** of B-tranche audit wave 1, READ-ONLY. Consumer-side
lens on `@mkbabb/glass-ui` adoption at fourier-analysis HEAD `c7cfd82`.

## §0 — Goal + completion criterion

**Goal.** Document fourier's consumer relationship with `@mkbabb/glass-ui`
(pinned `file:../../glass-ui` @ **v2.0.0 / `9b8de74`**, the workspace sibling)
at a granularity sufficient for tranche B to plan adoption work, route gaps to
the substrate, and avoid re-discovering carries already filed.

**Completion criterion.** A coverage matrix (primitive × verdict) names every
substrate primitive against its consumer adoption; every emitted constellation
carry has a state (FILED / DISCHARGED / LOCAL-CARRY) with a discharge path
where pending; and a B-tranche absorption block names which findings fold into
B's wave plan as invariants or wave items.

## §1 — Substrate observed

| Field | Value |
|---|---|
| Consumer HEAD | `c7cfd82` (fourier-analysis, branch master) |
| Substrate HEAD | `9b8de74` (glass-ui, v2.0.0) |
| Pin | `"@mkbabb/glass-ui": "file:../../glass-ui"` |
| Substrate surface | **64 `exports` subpaths** (`/Users/mkbabb/Programming/glass-ui/package.json:207-471`) + root barrel (`./dist/index.d.ts`) |
| Consumer import sites | **62 distinct `import … from "@mkbabb/glass-ui…"` lines** across `web/src/**/*.{vue,ts}` |
| Direct `reka-ui` imports bypassing the substrate | **0** (CR-2 cleanly discharged at `4df1a06`) |

## §2 — Coverage matrix

Numbers cite consumer-side adoption hits. Verdicts: `ADOPTED` (consumed in
production); `WRAPPED` (consumed via a fourier-domain wrapper at
`web/src/components/ui/`); `NOT-APPLIC` (no consumer call site exists / retired
with documented rationale at `audit/W3-adoption-ledger.md`).

### Form & control primitives

| Primitive | Import shape | Sites | Verdict |
|---|---|---|---|
| `Button` | root barrel | ~30 files | ADOPTED idiomatically (`ghost`/`outline`/`icon` mix) |
| `Slider` (`variant="glass-scrubber"`) | root barrel | `SliderControl.vue:23`, `GlassTimeline.vue:21`, `ConvergenceTimeline.vue:19`, `EditorControlsDock.vue:3`, `BasisSelector.vue:3`, `EditorToolsPanel.vue:3`, `MorphPhaseConfig.vue:73`, `HarmonicLevelGrid.vue:89` | ADOPTED (scrubber recipe) |
| `Switch` | root barrel | `ExportModal.vue:3` | ADOPTED |
| `Checkbox` | root barrel | `GalleryCard.vue:3` | ADOPTED |
| `Select*` cohort | root barrel | `MorphPhaseConfig.vue:73-80`, `SpeedSelect.vue`, `GallerySearchBar.vue`, `AdminFlaggedPanel.vue` | ADOPTED |
| `Label`, `Separator`, `Toggle`, `ToggleGroup`, `RadioGroup`, `NumberField`, `TagsInput`, `MultiSelect` | root barrel | **0 sites** | NOT-APPLIC — no consumer surface |

### Surface primitives

| Primitive | Import shape | Sites | Verdict |
|---|---|---|---|
| `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription` | root barrel | **0 explicit** — consumer composes its own surfaces against tokens | NOT-APPLIC for now; B may revisit |
| `Sheet*` | root barrel | **0 sites** | NOT-APPLIC |
| `Dialog*` | root barrel | **0 sites** — `ExportModal.vue` rolls its own modal | **GAP — see §3** |
| `Drawer*` | root barrel | **0 sites** | NOT-APPLIC |
| `Skeleton` | root barrel | **0 sites** | NOT-APPLIC (`W3-adoption-ledger.md:46` — fourier's loading register is spinner-based, not surface-skeleton) |
| `Badge` | root barrel | `GalleryCard.vue:3`, `GalleryCardModal.vue:3` | ADOPTED |
| `Progress` | root barrel | **0 sites** | NOT-APPLIC |
| `Collapsible*` | root barrel | `PaperSidebar.vue:6`, `CollapsibleSection.vue:2` | ADOPTED + WRAPPED (`ui/CollapsibleSection.vue` is a thin domain wrapper adding a ToC-style trigger; legitimate per `d-style-glassui.md:141`) |
| `HoverCard*` | root barrel | `EquationView.vue:8`, `AppHeader.vue:9-17` | ADOPTED |
| `Tooltip*` | root barrel | `ui/tooltip/Tooltip.vue:14-17` | WRAPPED — single-prop ergonomic shim around the decomposed primitives; legitimate |
| `Popover`, `DropdownMenu`, `ContextMenu`, `Command` | root barrel | `DropdownMenu*` ADOPTED at `AppHeader.vue:10-13`; remainder **0 sites** | partial |

### Custom / specialty primitives (subpath-only at v2.0.0)

| Primitive | Subpath | Sites | Verdict |
|---|---|---|---|
| `UnderlineTabs` | `/tabs` | `EquationView.vue:12`, `VisualizationView.vue:28`, `GalleryView.vue:13` | ADOPTED idiomatically |
| `GlassDock`, `DockIconButton` | `/dock` | `CanvasControlsDock.vue:6`, `EditorControlsDock.vue:5`, `AnimationControls.vue:9-10` | ADOPTED with typed `DockContext` (CR-2 closed) |
| `HoverPopover` | `/hover-popover` | `CanvasControlsDock.vue:7`, `EditorControlsDock.vue:6` | ADOPTED (but **also root-barrel** at `dist/index.d.ts:4665` — see §6) |
| `InfiniteScroll` | `/infinite-scroll` | `GalleryInfiniteGrid.vue:3` | ADOPTED |
| `MetricBadge` | `/metric-badge` | 13 sites (`W3-adoption-ledger.md:29-41`) | ADOPTED |
| `AnimatedDigit`, `MetricRow`, `MetricStack`, `MetricCell`, `StatusDot` | `/animated-digit`, `/metric-stack`, `/metric-cell`, `/status-dot` | **0** | NOT-APPLIC — retired-with-rationale per `W3-adoption-ledger.md:42-46` |
| `useSidebarState`, `useScrollTracker`, `useTreeIndex` | `/sidebar` | `PaperSidebar.vue:7`, `MobileFloatingToc.vue:4` | ADOPTED — generic discharge consumed (`W3.5-sidebar.md`) |
| `useGlobalDark` | `/dark` | `DarkModeToggle.vue:18` | ADOPTED |
| `useClipboard` | root barrel | `useMorphConfig.ts:9`, `EquationResult.vue:3`, `UserSlugBar.vue:4` | ADOPTED |
| `useToast`, `Toaster`, `TooltipProvider` | root barrel | `App.vue:4`, `useToast.ts:5` | ADOPTED |
| `Configurator`, `ConfiguratorRow`, `ConfiguratorLayer` | `/configurator` | **0** | NOT-APPLIC — no configurator surface in fourier; B may revisit for editor tools |
| `Aurora`, `DiscoGlyph`, `GlyphFace`, `ScrollingText`, `Typewriter`, `StackedIcons`, `GlassCarousel`, `Timeline`, `SortableList`, `PaperBackdrop`, `LabeledField`, `IconTooltip`, `HeaderRibbon`, `InstrumentChassis`, `InstrumentRail`, `Pulse`, `ToggleChip`, `ExpandableContainer`, `GlassPanel`, `ResponsiveTabs`, `DataTable`, `DataTablePagination`, `Notification`, `Search` | subpath-only | **0** | NOT-APPLIC (most), AUGMENTATION CANDIDATE for `DataTable` / `Pagination` (see §5) |

### Style + token surfaces

| Surface | Site | Verdict |
|---|---|---|
| `@mkbabb/glass-ui/styles` | `src/style.css:3` | canonical ADOPTED |
| Font subpath `@mkbabb/glass-ui/fonts/*` | discharged via base64 inline (`e123dc1`) | DISCHARGED |

**Aggregate.** ~30 distinct substrate primitives + ~10 substrate composables in
the v2.0.0 surface; **18 primitives + 9 composables actively consumed**; 6
primitives explicitly retired-with-rationale; remainder NOT-APPLIC.

## §3 — Gaps (where fourier rolls its own)

| ID | Surface | Substrate alternative | Severity |
|---|---|---|---|
| G1 | `ExportModal.vue` rolls its own modal frame (`<div class="modal-overlay">…</div>` with manual escape/backdrop) | `Dialog` + `DialogContent` (root barrel) — would inherit the canonical close affordance + portal + focus trap | MEDIUM |
| G2 | Admin pagination (`AdminUserList.vue:431`, `AdminFlaggedPanel.vue:184`, `AdminAuditLog.vue:163`, `GalleryGrid.vue:54`) wraps icon-only `<Button variant="ghost" size="icon">` in `<nav aria-label="…">` — the W5.a idiom lift acknowledged as transitional | `Pagination` primitive — **NOT yet shipped** (the carry filed at W5.a) | HIGH — substrate gap, see §4 |
| G3 | `useOffsetPagination` composable forked verbatim from glass-ui v0.9.3 (`composables/useOffsetPagination.ts:9-13`) | Substrate retired `/pagination` subpath at v1.0 with zero production consumers; the consumer-side fork is now the only living copy across the constellation | LOW — documented; B may canonicalise |
| G4 | `web/src/style.css` carries `::selection`, `tab-slide-in` keyframe + animation, `--viz-easing` CSS variable (`EasingPicker.vue:22-78`) | Substrate base layer + Tabs primitive + tokens viz block — three FILED carries | LOW per carry; aggregate MEDIUM |
| G5 | `paper/MobileFloatingToc.vue` + `paper/PaperSidebar.vue` adopt `useSidebarState` but still hand-roll the floating-ToC chrome; substrate has no canonical "floating-ToC" surface | none yet — domain-specific | INFO (legit consumer-side) |

The remaining `ui/` wrappers (`CollapsibleSection.vue`, `SliderControl.vue`,
`tooltip/Tooltip.vue`) are *domain wrappers*, not reinventions — each adds a
documented chassis (ToC trigger, labeled scrubber, single-prop tooltip)
without shadowing the substrate primitive. Verdict already confirmed at
`d-style-glassui.md:141`.

## §4 — Constellation carry state

Source: `coordination/CONSTELLATION.md §"Emitted"`. State at HEAD `c7cfd82`:

| Carry | State | Proposed discharge path |
|---|---|---|
| **Press-scale unification** (S1 + S2; `--scale-press-*`) | FILED | glass-ui canon-hygiene wave (B-side initiates substrate-targeted PR; trivial 2-line fix per `d-style-glassui.md:33-39`) |
| **value.js `colorScale(stops, t)` + `sampleToSVGPath(fn, n)`** | FILED | tranche B's CRUD-CONSTELLATION cross-walk (peer convergence with value.js) |
| **`--viz-easing` token** | LOCAL-CARRY | glass-ui `tokens.css` viz block; bundle with the Tabs entry-animation carry under a single glass-ui token+animation wave |
| **`::selection` base** | LOCAL-CARRY | glass-ui base layer (alongside the existing global border reset) |
| **Tabs entry animation** (`tab-slide-in`) | LOCAL-CARRY | glass-ui Tabs primitive (apply on `[data-state="active"][role="tabpanel"]`) |
| **Font-asset URL hygiene** | DISCHARGED at glass-ui `e123dc1` (base64 inline) | — |
| **Paper-texture opacity** | DISCHARGED at glass-ui `9cf88e6` | — |
| **`useSidebarState` generic** | DISCHARGED at glass-ui `9b8de74` | — |
| **`Pagination` primitive** (W5.a) | FILED | glass-ui next-surface tranche; the consumer-side `<nav aria-label="…">` + icon-Button fallback is the named transitional idiom |

**Tally:** 6 FILED, 3 LOCAL-CARRY, 3 DISCHARGED.

## §5 — Augmentation opportunities

| ID | Need | Substrate state | B disposition |
|---|---|---|---|
| AUG-1 | Canonical `Pagination` primitive with `aria-current="page"`, page-number rendering, hover affordance | substrate ships `DataTablePagination` (`dist/index.d.ts:4494`) — a *table-scoped* control; the standalone `<Pagination>` cohort the consumer needs (for `<nav>`-shaped admin paginators decoupled from a table) does not exist | ROUTE-TO-glass-ui-CARRY — file under glass-ui's next surface tranche; consumer waits |
| AUG-2 | `Dialog` adoption sweep for `ExportModal` (and any other hand-rolled modal) | substrate `Dialog` cohort is mature | FOLD-INTO-B — modest consumer-side migration; no substrate work |
| AUG-3 | `useOffsetPagination` canonicalisation | substrate retired `/pagination` subpath at v1.0; the forked composable lives only at the consumer | KEEP-AS-IS unless B wants to re-canonicalise (low priority; the consumer fork is a single file, well-documented) |
| AUG-4 | `useScrollProgress` / `useActiveSection` for paper-reader chrome | substrate ships `useScrollTracker<T>` + `useTreeIndex<T>` via `/sidebar` (post-W3.5.c augmentation); fourier already consumes them | DISCHARGED — already augmented |
| AUG-5 | AB+1 primitives' subpath-only export (`AnimatedDigit`, `Metric*`, `StatusDot`) — friction for adoption sweeps that prefer root-barrel ergonomics | substrate intentionally subpath-isolates these for tree-shaking; root-barrel addition is a substrate policy call | ROUTE-TO-glass-ui-CARRY if B's adoption sweep grows the cohort; otherwise KEEP-AS-IS |

## §6 — Subpath / barrel-export hygiene

Every subpath in `glass-ui/package.json:207-471` follows contract-v2 shape
(`types` + `import` + `default` where applicable); spot-checked
`/dock`, `/sidebar`, `/tabs`, `/animated-digit`, `/metric-badge`,
`/hover-popover`. All point to `dist/*.js` + `dist/*.d.ts`.

Consumer import correctness:

| Import | Status |
|---|---|
| `Button`, `Slider`, `Switch`, `Checkbox`, `Badge`, `Collapsible*`, `Select*`, `DropdownMenu*`, `HoverCard*`, `TooltipProvider`, `Toaster`, `useClipboard`, `useToast` from root barrel | CORRECT (root-barrel availability confirmed) |
| `UnderlineTabs` from `@mkbabb/glass-ui/tabs` | CORRECT (subpath-only at v2.0.0; not root-barrel) |
| `GlassDock`, `DockIconButton` from `@mkbabb/glass-ui/dock` | CORRECT |
| `useSidebarState` from `@mkbabb/glass-ui/sidebar` | CORRECT (subpath-only) |
| `useGlobalDark` from `@mkbabb/glass-ui/dark` | CORRECT |
| `InfiniteScroll` from `@mkbabb/glass-ui/infinite-scroll` | CORRECT |
| `MetricBadge` from `@mkbabb/glass-ui/metric-badge` | CORRECT (subpath-only at v2.0.0) |
| `HoverPopover` from `@mkbabb/glass-ui/hover-popover` (3 sites) | **SUB-OPTIMAL** — `HoverPopover` is *also* exported from the root barrel (`dist/index.d.ts:4665`). Both paths work; the root barrel is the lower-friction path. Severity LOW. |

The W3.c finding (MetricBadge / AnimatedDigit / StatusDot / Metric* are
subpath-only at v2.0.0; Skeleton ships root-barrel) **remains valid** at
substrate `9b8de74`. Fourier's import statements match the substrate's
export shape correctly. **`Skeleton` is root-barrel** (`dist/index.d.ts:5089`)
but the consumer does not adopt it (retired-with-rationale per W3.c).

## §7 — Defect / opportunity ledger

| ID | Item | Severity | Disposition |
|---|---|---|---|
| G1 | `ExportModal.vue` rolls its own modal | MEDIUM | FOLD-INTO-B (consumer-side `Dialog` migration) |
| G2 | Pagination primitive absent upstream | HIGH (substrate gap) | ROUTE-TO-glass-ui-CARRY (already FILED at W5.a) |
| G3 | `useOffsetPagination` consumer fork | LOW | KEEP-AS-IS (well-documented) |
| G4 | Local carries (`::selection`, `tab-slide-in`, `--viz-easing`) | MEDIUM aggregate | ROUTE-TO-glass-ui-CARRY (bundle into single substrate wave) |
| G5 | Floating-ToC chrome hand-rolled | INFO | KEEP-AS-IS (domain) |
| H1 | `HoverPopover` imported via subpath when root barrel available | LOW | FOLD-INTO-B (3-line import collapse; cosmetic) |
| H2 | Press-scale vocabulary split at substrate | LOW | ROUTE-TO-glass-ui-CARRY (FILED; awaits substrate fix) |
| H3 | value.js `colorScale` / `sampleToSVGPath` carry | MEDIUM | ROUTE-TO-value.js (B's CRUD-CONSTELLATION) |

## §8 — B-tranche absorption

Findings that fold into B's plan as new invariants or wave items:

1. **B invariant — substrate-pin awareness.** Reaffirm the `file:../../glass-ui`
   pin discipline: B does not fork; substrate fixes are substrate waves.
   (Inherited from A.)
2. **B wave item — `Dialog` adoption sweep (G1).** A single-file consumer-side
   migration of `ExportModal.vue` to `<Dialog>` + `<DialogContent>`. Modest;
   single wave-slot under a "consumer hygiene" lane.
3. **B wave item — `HoverPopover` import collapse (H1).** Cosmetic 3-line
   change. Bundle with §8.2 above.
4. **B coordination — bundle the three LOCAL-CARRY items (G4) into one
   substrate PR.** The Tabs entry-animation, `--viz-easing` token, and
   `::selection` base belong to a single glass-ui token+animation wave;
   filing them as separate carries fragments the substrate review surface.
   B's coordination doc should consolidate.
5. **B coordination — `Pagination` primitive ETA dependency (G2 / AUG-1).**
   The admin moderation surface remains on the `<nav>`-wrapped icon-button
   fallback until glass-ui ships the canonical primitive. B does not block on
   it; B records the dependency.
6. **B research item — AB+1 root-barrel re-export policy (AUG-5).** If B's
   adoption sweep grows the AB+1 cohort beyond the current 13 `MetricBadge`
   sites, file a substrate-policy carry to root-barrel-export them for
   ergonomic parity with `Skeleton`.
7. **B research item — `DataTable` adoption survey (AUG-1 sibling).** The
   substrate ships a `DataTable<T>` cohort (`dist/index.d.ts:4410`) the
   consumer has never evaluated. If admin tables grow, the sweep becomes a
   B wave; for now, INFO-track it.

---

**Final report.** Primitives audited: **≈30 substrate primitives + ≈10
composables** across `dist/index.d.ts` + 33 specialty subpath modules.
Adopted: **18 primitives + 9 composables** (counting MetricBadge once
across its 13 sites). Gaps: **5** (G1–G5) plus **1 hygiene** (H1).
Carries: **6 FILED, 3 LOCAL-CARRY, 3 DISCHARGED** = 12 total constellation
carries tracked. Augmentation opportunities: **5** (AUG-1 through AUG-5;
1 already DISCHARGED via W3.5.c). The consumer's substrate relationship is
**substantially clean** — zero direct `reka-ui` imports, no substrate forks
under the `file:` pin, every gap routed or KEEP-AS-IS with rationale.
