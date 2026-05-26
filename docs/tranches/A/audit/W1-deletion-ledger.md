# A.W1 — Deletion ledger

This document is the artefact-bearing close-condition for the W1 hard gate
(per `docs/tranches/A/waves/W1.md` §Scope item 5 and §Hard Gate item 4).
Each row attributes one of the thirty-one deletions in the glass-ui v2.0.0
migration cohort that fourier tranche A's W1 wave attributes and lands —
the same uncommitted refactor that sat across glass-ui's O, P, and Q
tranches under the perennial "working tree DIRTY" entry. The ledger
discharges the C1 chronic-deferral closure (the K-invariant-3 fourth-
recurrence remedy named in `A.md §1`) by binding every retirement to a
witnessed glass-ui or in-tree replacement, with the lone exception of
`BouncyToggle.vue` carrying `flagged-for-rework` pending W3 (the
Interactive-primitive adoption wave).

The eleven columns are the format mandated by `A.md §3` W1 row plus
`W1.md §Scope item 5`:

`path | kind | category | replacement_path | replacement_kind | consumer_import_site(s) | confirming_route(s) | verification_command | disposition | audit_source | commit_chunk`

The `disposition` column is typed: `verified-clean` /
`verified-with-route-evidence` / `flagged-for-rework` / `flagged-for-retire`.
The `commit_chunk` column cites the short hash of the commit that landed
the retirement; per the W1.a closure note, `web/src/style.css` was
absorbed into `A.W1.b` (`e904401`) rather than the W1.a.2 chunk named in
`W1.md §Scope item 3`, but every web-component retirement lands under
`A.W1.a.1` (`ffba307`) as planned.

## Ledger

| # | path | kind | category | replacement_path | replacement_kind | consumer_import_site(s) | confirming_route(s) | verification_command | disposition | audit_source | commit_chunk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `web/src/components/FourierMorphDemo.vue` | `.vue` | directory-relocation | `web/src/components/morph/FourierMorphDemo.vue` | relocated-file | `web/src/router/index.ts:44` (dynamic import) | `/morph` | `git grep -nE "morph/FourierMorphDemo" web/src` | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 2 | `web/src/components/FourierShapeExtractor.vue` | `.vue` | directory-relocation | `web/src/components/morph/FourierShapeExtractor.vue` | relocated-file | `web/src/router/index.ts:49` (dynamic import) | `/demo/shape-extractor` | `git grep -nE "morph/FourierShapeExtractor" web/src` | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 3 | `web/src/components/layout/composables/useHoverCard.ts` | `.ts` | directory-relocation | `@mkbabb/glass-ui` root barrel — `HoverCard`/`HoverCardTrigger`/`HoverCardContent` | npm-package-subpath | `web/src/components/layout/AppHeader.vue:14-16`; `web/src/components/equation/EquationView.vue:8` | `/` (header), `/equation` (tier hover-card) | `git grep -nE "useHoverCard" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2`; `d-style-glassui.md Part 2c "reka-ui HoverCard"` | `ffba307` |
| 4 | `web/src/components/paper/paperSearchIndex.ts` | `.ts` | module-fold | `web/src/components/paper/search/paperSearchIndex.ts` | relocated-file | `web/src/components/paper/search/usePaperSearch.ts:12`; `web/src/components/paper/search/searchHelpers.ts:5-6`; `web/src/components/paper/search/index.ts:2-3` | `/paper` (search modal) | `git grep -nE "from .*paper/paperSearchIndex" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 5 | `web/src/components/paper/usePaperSearch.ts` | `.ts` | module-fold | `web/src/components/paper/search/usePaperSearch.ts` | relocated-file | `web/src/components/paper/PaperView.vue:18,110`; `web/src/components/paper/MobileFloatingToc.vue:6`; `web/src/components/paper/PaperSearch.vue:5`; `web/src/components/paper/PaperSidebar.vue:5` | `/paper` (search dropdown + modal + sidebar TOC) | `git grep -nE "from .*paper/usePaperSearch[^/]" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 6 | `web/src/components/ui/BouncyToggle.vue` | `.vue` | glass-ui-shadow-copy | (none — no extant glass-ui-equivalent in consumer tree) | unconsumed-retirement | (none — zero surviving consumers verified at retirement) | (none — no rendering site at present) | `git grep -nE "BouncyToggle" web/src` (zero hits required) | flagged-for-rework | `W0-challenge.md §2 row 3`; `h1-A-W0-W1.md §2.1 P4`; `a-plan-archaeology.md §3.1 D9` | `ffba307` |
| 7 | `web/src/components/ui/GlassDock.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui/dock` — `GlassDock`, `DockIconButton` | npm-package-subpath | `web/src/components/visualization/AnimationControls.vue:9,57,118`; `CanvasControlsDock.vue:6,28,35,96`; `EditorControlsDock.vue:2,47,161` | `/visualize`, `/w/:imageSlug?` (animation dock + canvas dock + editor dock) | `git grep -nE "from .*ui/GlassDock" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2`; `d-style-glassui.md Part 2b "/dock"` | `ffba307` |
| 8 | `web/src/components/ui/ToastContainer.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `Toaster` + `useToast` | npm-package-subpath | `web/src/App.vue:4,30`; `web/src/composables/useToast.ts:3,31` (the in-tree shim wraps `glassUseToast`) | `/` (every route — root-mounted) | `git grep -nE "ToastContainer" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 9 | `web/src/components/ui/UnderlineTabs.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui/tabs` — `UnderlineTabs` | npm-package-subpath | `web/src/components/equation/EquationView.vue:11,186`; `web/src/components/visualization/GalleryView.vue:12,145`; `web/src/components/visualization/VisualizationView.vue:28,176` | `/equation`, `/gallery`, `/visualize` | `git grep -nE "from .*ui/UnderlineTabs" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2`; `d-style-glassui.md Part 2b "/tabs"` | `ffba307` |
| 10 | `web/src/components/ui/collapsible/Collapsible.vue` | `.vue` | glass-ui-shadow-copy | `web/src/components/ui/CollapsibleSection.vue` (in-tree wrapper around `@mkbabb/glass-ui` `Collapsible*`) | relocated-file + npm-package-subpath | `web/src/components/visualization/BasisSelector.vue:3`; `ContourSettings.vue:7`; `EditorToolsPanel.vue:4`; `CoefficientsPanel.vue:5`; `ContourPreview.vue:4`; `equation/FunctionInput.vue:6`; `equation/EqCoefficientsPanel.vue:4` | `/visualize`, `/equation` (every collapsible config section) | `git grep -nE "from .*ui/collapsible/Collapsible[^S]" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 11 | `web/src/components/ui/collapsible/index.ts` | `.ts` (index-barrel) | glass-ui-shadow-copy | `web/src/components/ui/CollapsibleSection.vue` (barrel collapsed to direct component import) | inlined-into-component | (none — every consumer now imports `CollapsibleSection.vue` directly) | n/a (barrel) | `git grep -nE "from .*ui/collapsible" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 12 | `web/src/components/ui/select/Select.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `Select` family | npm-package-subpath | (none extant — re-export retired, see row 22 for barrel close) | n/a (primitive retirement; `SpeedSelect.vue` uses a native `<select>` chassis) | `git grep -nE "from .*ui/select" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 13 | `web/src/components/ui/select/SelectContent.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectContent` | npm-package-subpath | (none extant — barrel-only re-export) | n/a | `git grep -nE "SelectContent" web/src` (only the deleted file should match) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 14 | `web/src/components/ui/select/SelectGroup.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectGroup` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectGroup" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 15 | `web/src/components/ui/select/SelectItem.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectItem` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectItem" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 16 | `web/src/components/ui/select/SelectLabel.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectLabel` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectLabel" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 17 | `web/src/components/ui/select/SelectScrollDownButton.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectScrollDownButton` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectScrollDownButton" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 18 | `web/src/components/ui/select/SelectScrollUpButton.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectScrollUpButton` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectScrollUpButton" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 19 | `web/src/components/ui/select/SelectSeparator.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectSeparator` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectSeparator" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 20 | `web/src/components/ui/select/SelectTrigger.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectTrigger` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectTrigger" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 21 | `web/src/components/ui/select/SelectValue.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `SelectValue` | npm-package-subpath | (none extant) | n/a | `git grep -nE "SelectValue" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 22 | `web/src/components/ui/select/index.ts` | `.ts` (index-barrel) | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel (every Select primitive ships there directly) | npm-package-subpath | (none — barrel re-export retired wholesale) | n/a (barrel) | `git grep -nE "from .*ui/select" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 23 | `web/src/components/ui/slider/Slider.vue` | `.vue` | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `Slider` (`variant="glass-scrubber"` carries the scrubber substrate from glass-ui W3 Lane A) | npm-package-subpath | `web/src/components/visualization/GlassTimeline.vue:21`; `web/src/components/equation/convergence/ConvergenceTimeline.vue:19` (the `SliderControl.vue` in-tree wrapper also routes through the root-barrel `Slider`) | `/visualize` (epicycle timeline), `/equation` (convergence timeline) | `git grep -nE "from .*ui/slider/Slider" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2`; `d-style-glassui.md Part 2c "GlassScrubber substrate"` | `ffba307` |
| 24 | `web/src/components/ui/slider/index.ts` | `.ts` (index-barrel) | glass-ui-shadow-copy | `@mkbabb/glass-ui` root barrel — `Slider` directly | npm-package-subpath | (none — barrel re-export retired) | n/a (barrel) | `git grep -nE "from .*ui/slider" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 25 | `web/src/components/visualization/DockPopover.vue` | `.vue` | directory-relocation | (folded — popover behaviour absorbed into `@mkbabb/glass-ui/dock`'s `DockIconButton` slot patterns) | inlined-into-component | (none — zero surviving import sites verified) | n/a (no rendering site at present; the absorbed behaviour renders at every `GlassDock` consumer) | `git grep -nE "DockPopover" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 26 | `web/src/components/visualization/lib/dock-buttons.css` | `.css` | module-fold | (folded — recipe absorbed into `@mkbabb/glass-ui/dock` `DockIconButton` default styling) | inlined-into-component | (none — zero surviving `@import` references verified) | n/a | `git grep -nE "dock-buttons\\.css" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |
| 27 | `web/src/composables/useAdminAuth.ts` | `.ts` | auth-store-replacement | `web/src/stores/auth.ts` — `useAuthStore` (Pinia) `adminLogin` / `adminLogout` / `getAdminToken` / `isAdminAuthenticated` | pinia-store | `web/src/stores/gallery.ts:5,104,114,120,133,145,185,198`; `web/src/components/visualization/gallery/AdminFlaggedPanel.vue:4,11`; `gallery/AdminUserList.vue:4,10` | `/gallery` (admin actions: tier, delete, publish, flag, user-list) | `git grep -nE "useAdminAuth" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 28 | `web/src/composables/useDockState.ts` | `.ts` | module-fold | (folded — dock state ownership migrated into `@mkbabb/glass-ui/dock` `DockContext` per CR-2 cross-walk at `4df1a06`) | inlined-into-component | (none — zero surviving import sites verified) | n/a | `git grep -nE "useDockState" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2`; `d-style-glassui.md Part 2c "CR-2 dock typed-context"` | `ffba307` |
| 29 | `web/src/composables/useSession.ts` | `.ts` | auth-store-replacement | `web/src/stores/auth.ts` — `useAuthStore` (Pinia) `ensureSession` / `clearSession` / `sessionToken` | pinia-store | (consumed transitively via `useAuthStore` at the call sites enumerated in row 27) | `/` (every route — session restored at store creation) | `git grep -nE "useSession[^A-Za-z]" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 30 | `web/src/composables/useUserAuth.ts` | `.ts` | auth-store-replacement | `web/src/stores/auth.ts` — `useAuthStore` (Pinia) `register` / `login` / `logout` / `ensureUser` / `userSlug` / `isLoggedIn` | pinia-store | `web/src/components/visualization/GalleryView.vue:7,27`; `web/src/components/visualization/gallery/UserSlugBar.vue:5,9`; `gallery/AdminFlaggedPanel.vue:4,11`; `gallery/AdminUserList.vue:4,10` | `/gallery` (user slug bar + admin gated UI) | `git grep -nE "useUserAuth" web/src` (zero hits expected) | verified-with-route-evidence | `W0-challenge.md §2 row 2` | `ffba307` |
| 31 | `web/src/lib/utils.ts` | `.ts` | glass-ui-shadow-copy | (retired — the `cn(...)` `clsx`+`tailwind-merge` helper has zero surviving call sites in fourier; glass-ui consumers do not need it) | unconsumed-retirement | (none — zero surviving import sites verified) | n/a | `git grep -nE "from .*lib/utils[\"']" web/src` (zero hits expected) | verified-clean | `W0-challenge.md §2 row 2` | `ffba307` |

## Summary — disposition tally

| Disposition | Count | Rows |
|---|---|---|
| `verified-clean` | 17 | 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 28, 31 |
| `verified-with-route-evidence` | 13 | 1, 2, 3, 4, 5, 7, 8, 9, 10, 23, 27, 29, 30 |
| `flagged-for-rework` | 1 | 6 (`BouncyToggle.vue`) |
| `flagged-for-retire` | 0 | (none) |
| **Total** | **31** | |

The four-bucket taxonomy from `W0-challenge.md §2 row 2` discharges
exactly: 20 glass-ui-shadow-copy + 4 directory-relocation + 4 module-fold
+ 3 auth-store-replacement = 31. The lone `flagged-for-rework` row is
`BouncyToggle.vue` (row 6) per the H1 hardening finding — its disposition
falls to W3 (the Interactive-primitive adoption wave); no glass-ui-side
substrate carries the bouncy-toggle affordance at v2.0.0 / `5e79443`.

## Commit chunks referenced

| Chunk | Hash | Subject |
|---|---|---|
| `A.W1.a.1` | `ffba307` | `feat(A.W1.a.1): land web migration cohort — deletions + rewires` |
| `A.W1.a.2` (absorbed by A.W1.b) | `e904401` | `feat(A.W1.b): land api admin/auth/gallery feature cohort` (style.css decomposition rode the W1.b commit; see W1.a closure log for the scope-collision note) |
| `A.W1.c` | `e02c4cf` | `feat(A.W1.c): land docker/nginx/env-example infra cohort` |

The W1.a sub-gate (per `W1.md §"A.W1.a — Web migration cohort"`) closes
on this ledger plus the green post-cohort build state (`vue-tsc -b
--force` exit 0; `npm run build` exit 0 — re-verified at HEAD post-
`ffba307`). The W1 hard gate (per `W1.md §"Hard gate"`) closes once
every wave's commits are recorded in `PROGRESS.md`; this ledger is the
deletion-proof artefact named in `W1.md §"Hard gate"` item 4.
