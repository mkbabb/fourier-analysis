# A.W3 — Button migration ledger

Authored by agent **A.W3.a — Button migration (equation + morph + paper + layout
surfaces)** under tranche A wave W3 of `fourier-analysis`. This artefact
records the native `<button>` → `<Button>` migration cohort, discharging
the fourth-recurrence anti-pattern catalogued at W3 scope item 1: the
reinvented button system (`buttons.css` plus the 89 native `<button>`s the
W0-challenge §2 row 7 audit named). Two parallel agents (W3.a here; W3.b for
visualization + ui) split the consumer tree by subtree; the wave-level
deletion of `buttons.css` is W3.b's terminal step once both sub-gates close.

The migration's mechanics: every interactive `<button>` lands as
`<Button variant="..." size="...">` from `@mkbabb/glass-ui`, with the variant
selected on the basis of the surface's gestalt — CTA (`default`), subtle
chrome (`ghost`), bordered toggle (`outline`), text-link (`link`), glass
overlay (`glass`), iconography size (`icon`). Redundant Tailwind chains the
variant already supplies (`hover:bg-*`, `active:scale-95`, `cursor-pointer`,
`focus-visible:ring-*`) retire at the migration site; bespoke active-state
treatments (notation-pill colour-mixing, preset-pill viz-fourier tint, the
`is-auto-active` golden accent on the wand toggle) survive as `<style>`-block
sidecars to the migrated `<Button>`. The cubic-bezier strings and `@keyframes`
audit C named are W3.d's lane and are not touched here.

## W3.a rows — equation / morph / paper / layout subtrees

| File (pre) | File (post) | variant | size | asChild? | rationale | citing commit |
|---|---|---|---|---|---|---|
| `equation/EqCoefficientsPanel.vue:92` | `equation/EqCoefficientsPanel.vue:92` | `ghost` | `sm` | — | "Show more/less" disclosure inside coefficient table; ghost-+-sm matches the muted-foreground gestalt | A.W3.a.1 |
| `equation/EquationResult.vue:37` | `equation/EquationResult.vue:37` | `glass` | `icon` | — | copy-LaTeX overlay button atop the rendered KaTeX; `glass` matches the panel-overlay aesthetic | A.W3.a.1 |
| `equation/EquationView.vue:274` | `equation/EquationView.vue:274` | `glass` | `icon` | — | info-anchor `HoverCardTrigger as-child` — circle-i overlay on the equation card | A.W3.a.1 |
| `equation/EquationModeToggle.vue:9` | `equation/EquationModeToggle.vue:9` | `ghost` | `sm` | — | sigma/expanded tab-style toggle inside `.eq-toggle` glass-subtle pill capsule; ghost surfaces the muted-foreground default + the golden `.is-active` accent | A.W3.a.1 |
| `equation/EquationModeToggle.vue:17` | `equation/EquationModeToggle.vue:17` | `ghost` | `sm` | — | same — second of the two-button toggle pair | A.W3.a.1 |
| `equation/FunctionInput.vue:138` | `equation/FunctionInput.vue:138` | `default` | `sm` | — | full-width "Compute" CTA — primary action of the panel | A.W3.a.1 |
| `equation/FunctionInput.vue:151` | `equation/FunctionInput.vue:151` | `outline` | `sm` | — | preset pill (one per preset); outline-+-sm rounds to a pill via `.preset-pill { border-radius: 9999px }`; `.is-active` ports the viz-fourier tint | A.W3.a.1 |
| `equation/FunctionInput.vue:184` | `equation/FunctionInput.vue:184` | `glass` | `icon` | — | Wand2 auto-harmonics toggle (Parseval); `.is-auto-active` ports the golden accent | A.W3.a.1 |
| `equation/NotationPills.vue:16` | `equation/NotationPills.vue:16` | `outline` | `sm` | — | notation mode pill (trig/exp/cos/sin) — outline-+-sm with `.notation-pill { border-radius: 9999px }` and `.notation-active` per-pill colour-mix | A.W3.a.1 |
| `equation/convergence/ConvergenceTimeline.vue:60` | `equation/convergence/ConvergenceTimeline.vue:60` | `glass` | `icon` | — | play/pause toggle adjacent to the glass-scrubber slider; circular glass affordance matches the scrubber's substrate | A.W3.a.1 |
| `morph/HarmonicLevelGrid.vue:54` | `morph/HarmonicLevelGrid.vue:54` | `outline` | `default` | — | grid-cell preview button (one per harmonic level); outline surfaces the bordered card, the `.active` + `.is-bound` modifiers paint the accent-red/blue rings | A.W3.a.1 |
| `morph/FourierMorphDemo.vue:71` | `morph/FourierMorphDemo.vue:71` | `default` | `default` | — | "Export" CTA (clipboard copy); the consumer-side `.btn-export` style carries the brand-specific inverted-fg paint | A.W3.a.1 |
| `morph/FourierMorphDemo.vue:75` | `morph/FourierMorphDemo.vue:75` | `outline` | `default` | — | "Reset" secondary action — outline mirrors the default + ghost-pair convention | A.W3.a.1 |
| `morph/FourierShapeExtractor.vue:125` | `morph/FourierShapeExtractor.vue:125` | `default` | `default` | — | internal dev-tool "Extract Shape Contours" CTA | A.W3.a.1 |
| `paper/PaperView.vue:308` | `paper/PaperView.vue:308` | `link` | `sm` | — | mobile-only inline ToC link — `link` variant matches the underline-on-hover paper-reader idiom | A.W3.a.1 |
| `paper/PaperView.vue:340` | `paper/PaperView.vue:340` | `glass` | `icon` | — | bottom-overlay "back" navigation button with badge count; glass-+-icon matches the page-indicator chrome | A.W3.a.1 |
| `paper/PaperSidebar.vue:56` | `paper/PaperSidebar.vue:56` | `ghost` | `icon` | — | sidebar "scroll to top" chevron button | A.W3.a.1 |
| `paper/PaperSidebar.vue:67` | `paper/PaperSidebar.vue:67` | `ghost` | (default) | — | sidebar section ToC entry — ghost lets the `.sidebar-link` colour-mix paint the active state | A.W3.a.1 |
| `paper/PaperSidebar.vue:87` | `paper/PaperSidebar.vue:87` | `ghost` | (default) | — | sidebar sub-section ToC entry — same pattern | A.W3.a.1 |
| `paper/PaperSidebar.vue:103` | `paper/PaperSidebar.vue:103` | `ghost` | (default) | — | sidebar sub-sub-section ToC entry — same pattern | A.W3.a.1 |
| `paper/MobileFloatingToc.vue:96` | `paper/MobileFloatingToc.vue:96` | `ghost` | `icon` | — | "Close search" X button in the floating ToC search bar | A.W3.a.1 |
| `paper/MobileFloatingToc.vue:101` | `paper/MobileFloatingToc.vue:101` | `ghost` | (default) | — | floating ToC bar — title + chevron disclosure trigger | A.W3.a.1 |
| `paper/MobileFloatingToc.vue:120` | `paper/MobileFloatingToc.vue:120` | `ghost` | (default) | — | "Scroll to top" entry in the floating ToC dropdown | A.W3.a.1 |
| `paper/MobileFloatingToc.vue:131` | `paper/MobileFloatingToc.vue:131` | `ghost` | (default) | — | root section entry in floating ToC dropdown | A.W3.a.1 |
| `paper/MobileFloatingToc.vue:146` | `paper/MobileFloatingToc.vue:146` | `ghost` | (default) | — | sub-section entry in floating ToC dropdown | A.W3.a.1 |
| `paper/search/PaperSearchInput.vue:46` | `paper/search/PaperSearchInput.vue:46` | `ghost` | `icon` | — | search-input expand/collapse Maximize2/Minimize2 toggle | A.W3.a.1 |
| `paper/search/PaperSearchInput.vue:55` | `paper/search/PaperSearchInput.vue:55` | `ghost` | `icon` | — | search-input clear (X) button | A.W3.a.1 |
| `paper/search/PaperSearchDropdown.vue:40` | `paper/search/PaperSearchDropdown.vue:40` | `ghost` | (default) | — | inline search-result row — ghost permits the `.is-selected` highlight | A.W3.a.1 |
| `paper/search/PaperSearchModal.vue:60` | `paper/search/PaperSearchModal.vue:60` | `ghost` | `icon` | — | modal collapse (Minimize2) button | A.W3.a.1 |
| `paper/search/PaperSearchModal.vue:67` | `paper/search/PaperSearchModal.vue:67` | `ghost` | `icon` | — | modal close (X) button | A.W3.a.1 |
| `paper/search/PaperSearchModal.vue:78` | `paper/search/PaperSearchModal.vue:78` | `ghost` | (default) | — | modal search-result row — same pattern as the inline dropdown | A.W3.a.1 |
| `layout/AppHeader.vue:101` | `layout/AppHeader.vue:101` | `ghost` | (default) | as-child via `<DropdownMenuTrigger as-child>` | nav-trigger pill in the header — icon + label + chevron; ghost surfaces the header's quiet chrome | A.W3.a.1 |

### Justified residue (kept native `<button>`)

| File:line | Rationale |
|---|---|
| `morph/MorphShapePreview.vue:4` | the `morph-button` IS the cartoon-card SVG frame around `<FourierMorphSvg>`; the visual gestalt is a Memphis-sticker card with the shape morphing inside, hover-lifted, scale-pressed. The Button variants' default chrome would compete with the cartoon-card border + offset-stamp shadow; the bespoke `.morph-button` rule in the local `<style>` block IS the variant. Retire-with-rationale per W3 invariant 1 (KISS / DRY — a styling need that already routes through a `cartoon-card` utility never gets a buttonVariants prop on top of it). |
| `layout/DarkModeToggle.vue:2` | the `sun-moon-toggle` is a "naked" wrapper around a 5rem morphing-SVG icon; the button's chrome is a circular transparent host (no border, no background, no padding) so the SVG path IS the button. `<Button variant="ghost" size="icon">` would impose a 1.5px border + colour-mix background that the visual register explicitly forbids. Retire-with-rationale; the focus-visible outline survives via the local `<style>` block. |

## W3.b rows — visualization / ui subtrees

Note on the two H2-named `<Button as="label">` sites: the working-tree state
at the W3.b commit (`HEAD = cd019b4`) had already retired those wrapper
labels in favour of a programmatic `fileInput.click()` from an outer
dropzone (`ImageUpload.vue`, lines 27–29 + 119–125) and a canvas-click
forwarder (`VisualizationView.vue`, line 220 hosts a bare `<input
type="file" hidden>` driven by `onCanvasClick`). The `as="label"` pattern
the W0 challenge audit predicted is therefore moot; the H2 hardening had
already discharged it via the dropzone refactor. No `<Button as="label">`
rows appear in this section.

| File (pre) | File (post) | variant | size | asChild? | rationale | citing commit |
|---|---|---|---|---|---|---|
| `visualization/ContourSettings.vue:190` | same | `ghost` | `icon` | — | reset-icon-btn — Reset to defaults gizmo in the contour panel header; ghost-+-icon matches the muted-foreground rest state, the `.is-default` opacity gate survives as a sidecar | A.W3.b.1 |
| `visualization/ContourSettings.vue:309` | same | `destructive` | `sm` | — | retry-btn — Retry CTA inside the transient-error banner; destructive variant matches the banner's destructive tint, the local hook softens to a 10 %-tinted plate | A.W3.b.1 |
| `visualization/BasisSelector.vue:122` | same | `ghost` | `icon` | — | reset-icon-btn — Reset to defaults gizmo (mirrors ContourSettings) | A.W3.b.1 |
| `visualization/EasingPicker.vue:12` | same | `ghost` | `sm` | — | easing-chip — toggle pill inside the easing grid; `aria-pressed` drives the `--easing-accent` tint; legacy `.is-active` class retained for cascade-compat with W3.d's transition rules | A.W3.b.1 |
| `visualization/FullscreenViewer.vue:54` | same | `glass` | `icon` | — | fs-close — Minimize2 glass overlay at the fullscreen-frame top-right; glass-+-icon matches the canvas-overlay aesthetic, the local hook pins position + the 9999 px corner | A.W3.b.1 |
| `visualization/EquationPanel.vue:78` | same | `ghost` | `icon` | — | equation-panel close X; ghost-+-icon with a 1.5 rem chassis matches the muted-foreground rest state | A.W3.b.1 |
| `visualization/EditorToolsPanel.vue:29` | same | `outline` | (default) | — | tool-btn — "Smooth" card chassis (icon + title + description, full-row); outline ships the bordered card surface, the `.tool-btn` hook widens to a multi-line body + lift-on-hover idiom keyed by `--tool-color` | A.W3.b.1 |
| `visualization/EditorToolsPanel.vue:37` | same | `outline` | (default) | — | tool-btn — "Simplify" card chassis (same recipe as above) | A.W3.b.1 |
| `visualization/AnimationControls.vue:110` | same | `ghost` | `sm` | — | menu-item — "Export" entry in the three-dot dropdown; ghost-+-sm with `justify-start` + nowrap gives the menu pattern's left-aligned chassis | A.W3.b.1 |
| `visualization/CoefficientsPanel.vue:101` | same | `ghost` | `sm` | — | "Show more / less" disclosure inside the coefficient table; mirrors equation-panel's EqCoefficientsPanel recipe | A.W3.b.1 |
| `visualization/ExportModal.vue:37` | same | `glass` | `icon` | — | modal close X; glass-+-icon matches the modal-overlay chrome | A.W3.b.1 |
| `visualization/CanvasOverlayButton.vue:8` | same | `glass` | `icon` | — | naked wrapper component forwarding `active` as `aria-pressed`; `<Button variant="glass" size="icon">` IS the surface | A.W3.b.1 |
| `visualization/VisualizationView.vue:165` | same | `outline` | (default) | — | "Start fresh" recovery CTA in the workspace error state; outline-+-default matches the cartoon-card secondary action gestalt | A.W3.b.1 |
| `visualization/gallery/GalleryCard.vue:105` | same | `ghost` | `sm` | — | like-btn — heart + count stat counter; ghost-+-sm with h-auto + p-0 narrows to a counter row; `aria-pressed` drives the `--like` tint; `.liked` legacy class kept for W3.d's `@keyframes like-bounce` cascade | A.W3.b.1 |
| `visualization/gallery/GalleryCardModal.vue:76` | same | `glass` | `icon` | — | modal close X overlay; glass-+-icon matches the modal-overlay chrome | A.W3.b.1 |
| `visualization/gallery/GalleryCardModal.vue:116` | same | `ghost` | `sm` | — | like-btn (modal variant) — same recipe as GalleryCard | A.W3.b.1 |
| `visualization/gallery/GalleryCardModal.vue:162` | same | `outline` | `sm` | — | tier-btn — "Featured" admin toggle; `aria-pressed` drives the foreground-tint plate | A.W3.b.1 |
| `visualization/gallery/GalleryCardModal.vue:170` | same | `outline` | `sm` | — | tier-btn — "Saved" admin toggle (same recipe) | A.W3.b.1 |
| `visualization/gallery/GalleryCardModal.vue:180` | same | `outline` | `lg` | — | callout-btn — "Open Visualizer" CTA at the modal footer; outline-+-lg with the bespoke cartoon-card foreground/3 plate | A.W3.b.1 |
| `visualization/gallery/GalleryGrid.vue:55` | same | `outline` | `icon` | — | page-btn — pagination prev arrow; gallery-side (non-admin) pagination is migrated to `<Button>` but NOT lifted to glass-ui Pagination — that lift is W5's territory | A.W3.b.1 |
| `visualization/gallery/GalleryGrid.vue:65` | same | `outline` | `icon` | — | page-btn — pagination next arrow (same recipe) | A.W3.b.1 |
| `visualization/gallery/GallerySearchBar.vue:54` | same | `ghost` | `icon` | — | search-input clear X | A.W3.b.1 |
| `visualization/gallery/GallerySearchBar.vue:62` | same | `ghost` | `icon` | — | filter-toggle — SlidersHorizontal opens the filter drawer; `aria-pressed` reflects `showFilters || hasActiveFilters` | A.W3.b.1 |
| `visualization/gallery/GallerySearchBar.vue:107` | same | `outline` | `sm` | — | basis-pill-btn — basis-filter pill (one per basis); outline-+-sm with the `--pill-c` tint recipe (mirrors BasisSelector's `.basis-toggle`) | A.W3.b.1 |
| `visualization/gallery/GalleryAdminBanner.vue:28` | same | `outline` | `sm` | — | Logout button in the admin-mode banner header | A.W3.b.1 |
| `visualization/gallery/GalleryDraftsSection.vue:50` | same | `ghost` | (default) | — | drafts-header — collapsible disclosure trigger for "My Drafts"; ghost rules over a muted/30 plate, rounded-none preserves the full-bleed header | A.W3.b.1 |
| `visualization/gallery/GalleryDraftsSection.vue:88` | same | `outline` | `sm` | — | "Publish" CTA per draft row | A.W3.b.1 |
| `visualization/gallery/UserSlugBar.vue:90` | same | `ghost` | `icon` | — | Copy slug button — the `<Check>/<Copy>` icon swap surfaces via the slot transition | A.W3.b.1 |
| `visualization/gallery/UserSlugBar.vue:100` | same | `ghost` | `icon` | — | Log out button (size-5 rounded-full) | A.W3.b.1 |
| `visualization/gallery/UserSlugBar.vue:111` | same | `ghost` | `sm` | — | Log in trigger (collapsed) — opens the slug-entry form | A.W3.b.1 |
| `visualization/gallery/UserSlugBar.vue:128` | same | `outline` | `icon` | — | LogIn submit (slug-entry form) | A.W3.b.1 |
| `visualization/gallery/UserSlugBar.vue:135` | same | `outline` | `icon` | — | Generate new slug (Dices) | A.W3.b.1 |
| `visualization/gallery/AdminUserList.vue:132` | same | `outline` | `sm` | — | "Prune empty" admin action — amber-tint applied as scoped colour override | A.W3.b.1 |
| `visualization/gallery/AdminUserList.vue:168` | same | `ghost` | `icon` | — | Suspend user (Ban icon) — amber hover tint | A.W3.b.1 |
| `visualization/gallery/AdminUserList.vue:176` | same | `ghost` | `icon` | — | Unsuspend user (UserCheck icon) — green hover tint | A.W3.b.1 |
| `visualization/gallery/AdminUserList.vue:184` | same | `ghost` | `icon` | — | Delete user (Trash2 icon) — red hover tint | A.W3.b.1 |
| `visualization/gallery/AdminFlaggedPanel.vue:118` | same | `ghost` | `icon` | — | Dismiss flags (XCircle icon) — green hover tint | A.W3.b.1 |
| `visualization/gallery/AdminFlaggedPanel.vue:125` | same | `ghost` | `icon` | — | Delete entry (Trash2 icon) — red hover tint | A.W3.b.1 |

### Justified residue (kept native `<button>`)

| File:line | Rationale |
|---|---|
| `visualization/AnimationControls.vue:62` + `:77` (`.play-btn` / `.play-btn--mini`) | The play / pause button is a bespoke rainbow-glass ornament — the `::before` rainbow-drift conic, the `::after` highlight, the white-on-glass affordance, and the inset-shadow stack. Replacing the chassis with `<Button variant="glass">` would compete with the per-instance white border and the `.is-playing` rainbow-drift keyframe. The animation surface is the sole site of this gestalt in the consumer tree; the local rule IS the variant. Retire-with-rationale per W3 invariant 1 (KISS / DRY — a single-site bespoke ornament does not get a buttonVariants prop bolted on top). |
| `visualization/gallery/AdminFlaggedPanel.vue:148` + `:150` (Prev/Next pagination) | Admin-view pagination structure is W5's territory (the lift to glass-ui Pagination); per the W3.b file-bounds discipline, "you do NOT lift hand-rolled pagination → glass-ui Pagination — those are W5". The native `<button>` survives until W5 lands the Pagination primitive. |
| `visualization/gallery/AdminUserList.vue:212` + `:214` (Prev/Next pagination) | Same as above — admin pagination is W5's lift, not W3.b's button migration. |

## Footer — count by subtree (W3.b)

| Subtree | Migrated | Residue (justified) |
|---|---|---|
| visualization (non-gallery) | 13 | 2 (`AnimationControls.vue` play-btn ×2) |
| visualization/gallery | 23 | 4 (AdminFlaggedPanel pagination ×2, AdminUserList pagination ×2) |
| ui | 0 | 0 |
| **Total (W3.b)** | **36** | **6** |

Verification: `grep -rnE '<button\b' web/src/components/{visualization,ui}/` returns exactly the six justified-residue rows above and nothing else.

`buttons.css` deletion: already discharged by W2.e (per the `A.W2.e — buttons.css abrogation` commit `1f655a1`); no further deletion required from W3.b.

## Footer — count by subtree (W3.a)

| Subtree | Migrated | Residue (justified) |
|---|---|---|
| equation | 10 | 0 |
| morph | 4 | 1 (`MorphShapePreview.vue:4`) |
| paper | 17 | 0 |
| layout | 1 | 1 (`DarkModeToggle.vue:2`) |
| **Total (W3.a)** | **32** | **2** |

Verification: `git grep -rn '<button' web/src/components/{equation,morph,paper,layout}/` returns the two justified-residue rows and nothing else.
