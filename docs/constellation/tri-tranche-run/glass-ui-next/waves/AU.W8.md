# AU.W8 — the AU dock-design headline (the C5-named successor)

The dock-design gestalt (CHARTER §3 W8, §4 dock-vocabulary). AT's C5 audit SPLIT the
dock-DESIGN gestalt out to a successor AU, with AT's dock-CORRECTNESS as its
prerequisite — and the prerequisite LANDED (`e906448`/`f0b0ffb`/`8e4cb9f`;
strict-templates, the one correctness item still open, lands AU.W3). So AU's gating
condition is met (`deferred-lineage.md §2`). This wave is `proof:strict-templates`-
guarded (AU.W3 landed it first), and the rail-touching edits are ONE atomic
`GlassDock.vue`/`DockLayerGroup.vue` pass (no double-touch — the AT mistake where
overflow landed alone and the rail did not). The dock-DESIGN split is GESTALT-driven,
NOT overfitting-driven (C5-6 — the dock IS ≥2-consumed, 4 repos).

## §Scope (ONE atomic edit set)

1. **The reka-ui `Tabs` rail (DEC-AT-9, #11, `precept-prompt-recap.md §3.3`).** The
   idiomatic fix the campaign deferred. Adopt `TabsRoot/List/Trigger/Content` —
   APG-Tabs canon, free roving tabindex, no fourth boilerplate ARIA copy. The rail
   becomes `role="tablist"`; triggers `role="tab"` + `aria-selected` (NOT
   `aria-pressed`); `aria-controls`→`role="tabpanel"`. The SHORTCUT (hand-rolling the
   ARIA) is REFUSED — adopt the reka-ui primitive, matching the dock's existing reka-ui
   idiom.

2. **The dock a11y + state-machine contract test (the re-lettered original
   `W6-dock-b`, under its FRESH AU ID, `precept-prompt-recap.md §0 (consequence 1) + §3
   (item 1)`).** A behavioural
   mounted-dock test (the touch-gate refutation's lesson: a behavioural test, not a
   prose a11y assertion — CHARTER §4 inv-ε): tablist/tab/aria-selected, roving tabindex
   (Home/End/Arrow), focus-visible, the keep-open contract (`keepOpen()/release()` —
   the contract slides binds via `dockRef`, `slides-coupling.md §1`). This is the
   contract the original `W6-dock-b` always owed and never shipped.

3. **The travelling rail-indicator (the sliding pill, #11).** Layered ON the reka-Tabs
   rail as part of the same atomic edit — the per-button background is RETIRED (no
   alias, P1) for one `--dock-rail-indicator-*` travelling element animated on the
   convergent `--dock-resize-spring` (`e906448`), unifying the dock's motion vocabulary.

4. **Spring-fidelity unification + micro-feedback (#12).** B3 found the dock's motion
   fidelity non-uniform. AU adds spring-fidelity unification, glass icon-hover, and
   `will-change` hygiene on the rail-indicator + collapse morph. Press-scale is ALREADY
   canonical at HEAD — `tokens.css:1004 --scale-press-dock: var(--scale-press)` (=0.96),
   landed by AT.W7-dock-b (`8e4cb9f`); the comment at `tokens.css:998-1003` records the
   prior hard-coded 0.92 → the canonical `--scale-press` swap. So AU.W8 does NOT
   re-canonize the press scale (inherited as FACT per AU.W0). The 0.92→0.96 token is
   already on-branch — published v3.2.0 still carries 0.92, so slides at `^3.2.0`
   receives 0.96 only when AU publishes (the PUBLISH delivering an already-landed token,
   AU.W10), NOT AU.W8 work (`slides-coupling.md §1`).

5. **The `<Role>Dock` docs vocabulary + base renames (ASK-7, CHARTER §4
   dock-vocabulary).** glass-ui owns the docs-convention half: ONE role vocabulary
   (`ChromeDock`/`TransportDock`/`CanvasDock`/`ToolDock`) documented ONCE in the dock
   README (the source of truth) + the canonical `useDock*` renames
   (`useTouchGate→useDockTouchGate` co-located + aliased) + `DockTabButton` RETIRE (0
   consumers confirmed; the export at `src/components/custom/dock/index.ts:5`). **`<Role>Dock`
   is a DOCS-VOCABULARY + base-rename deliverable, NOT a net-new component** — slides
   binds `GlassDock`+`DockIconButton`+`#collapsed` and no `<Role>Dock` component exists
   on-branch (`slides-coupling.md §0, §5 #1`); a role-typed component surface is BOOK
   until a 2nd consumer appears (CHARTER §4 honest caveat). **The candidate 2nd consumer
   is named:** keyframes D.W5 circles back to this wave — keyframes-demo composes
   `GlassDock`+`DockLayerGroup`+`DockIconButton`+`DockSelectTrigger` today
   (`TopDock.vue:117`, `AnimationMenuBar.vue:17`) and adopts the AU.W8 role-vocabulary as
   LOCAL renames (`ChromeDock`/`TransportDock`) now; IF this wave ever ships a role-typed
   base component AND keyframes is its 2nd consumer, that is the named cross-session edge
   keyframes D.W5 circles back to (the role-typed base stays BOOK until then). slides
   binds the same base, no role-typed component. The consumer renames are each
   consumer's arm (inv-16).

## §HARD gate

Per CHARTER §3 W8: **the dock a11y/state contract test green (tablist/tab/aria-selected,
roving tabindex, focus-visible, keep-open); the rail-aria break is AU's own minor-fix
version call, kept out of the additive surface.** Registered `gates.mjs`:

1. **`proof:dock-a11y-contract`** (the re-lettered contract test) — the behavioural
   mounted-dock test (`GlassDock.a11y-contract.test.ts`): `role="tablist"` on the rail,
   `role="tab"` + `aria-selected` (and the ABSENCE of `aria-pressed`) on triggers,
   `aria-controls`→`role="tabpanel"`, roving tabindex under Arrow/Home/End,
   focus-visible on keyboard nav, the `keepOpen()/release()` contract holds the
   collapse. **bite-check:** restoring `aria-pressed` (the hand-rolled shape) OR
   removing the roving-tabindex handler reddens it. This is the gate the original
   `W6-dock-b` always owed.

2. **`proof:dock-vocabulary`** (ASK-7) — three falsifiable clauses, each biting on the
   REAL rename/retirement CHARTER §4 orders (NOT phantom names):
   - **The composable rename.** `grep -rn "useTouchGate\b" src/ = 0` OUTSIDE
     `useDockTouchGate.ts`'s deprecation-alias line, AND `useDockTouchGate` is the
     co-located canonical export (the live source is `useTouchGate.ts:60`, exported
     `composables/dom/index.ts:26`, re-exported `src/index.ts:152`). **bite-inject:**
     reverting the rename (restoring a bare `useTouchGate` call site) reddens the
     source-graph tier. A grep-for-absence over names that never existed
     (`useExclusiveSelect`/`usePopupMutex`/`useDockLayers` — `git log --all -S` = 0) is
     born-GREEN by construction (inv-ε) and is REJECTED.
   - **The `DockTabButton` retirement (scoped to live code, P1).** `grep -rn
     "DockTabButton" src/ --include='*.ts' --include='*.vue' = 0` (the component file
     `src/components/custom/dock/DockTabButton.vue` + the export
     `src/components/custom/dock/index.ts:5` deleted) AND zero `DockTabButton` in
     `*.css` after the comment cleanup is folded into the retirement scope (the
     no-legacy P1 deletion MUST include the two stale CSS-comment refs at
     `dock.css:877`/`:947`). A bare `grep "DockTabButton" src/ = 0` stays RED on those
     comments even after a correct retirement (unsatisfiable as written) — REJECTED.
   - **The dock README (a falsifiable instrument step, not prose).** A dock README file
     EXISTS (`src/components/custom/dock/README.md` — absent at HEAD, so born-RED) AND a
     parse confirms it enumerates all four role names
     (`ChromeDock`/`TransportDock`/`CanvasDock`/`ToolDock`) AND the canonical
     `useDockTouchGate` name. **bite-inject:** deleting a role name from the README
     reddens it.

inv ε for both: each gate's PASS is its instrument's passing run + a named bite-inject.
NO prose a11y assertion substitutes for the behavioural test (the touch-gate refutation
is the binding lesson, CHARTER §4 inv-ε).

## §Atomicity invariant

Items 1-3 (reka-Tabs rail + a11y contract + travelling indicator) are ONE edit set
over `GlassDock.vue`/`DockLayerGroup.vue` — the W1b §3 atomic pass. They do NOT ship
across separate commits that each half-touch the rail (the AT mistake). The
`proof:dock-a11y-contract` gate covers the WHOLE rail after the single pass; a partial
rail reddens it.

## §The version call

The rail-aria break (`aria-pressed`→`aria-selected`) is consumer-visible — it is AU's
own minor-vs-major SemVer call (`deferred-lineage.md §2` #11; kept OUT of AT's
additive-3.3.0 by C5-4). AU records the tier in the AU.W10 changeset; the publish owner
finalizes it (CHARTER §6).

## §No-legacy

`DockTabButton` DELETED (P1; 0 consumers) — the complete deletion surface is the
component file `src/components/custom/dock/DockTabButton.vue`, the export at
`src/components/custom/dock/index.ts:5`, AND the two stale CSS-comment refs at
`dock.css:877`/`:947` (the comment cleanup folds into the retirement so the
live-code-scoped grep can green). The per-button rail background REPLACED by the
travelling indicator, not flagged. The hand-rolled rail ARIA REPLACED by reka-ui, not
aliased. The `useTouchGate→useDockTouchGate` rename carries at most ONE minor alias
(P1-bounded); each consumer's rename is its own arm (inv-16).
