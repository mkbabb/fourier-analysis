# A — constellation coordination

fourier-analysis is a **consumer node** in the glass-ui constellation. It consumes
`@mkbabb/glass-ui` (`file:../../glass-ui`, v1.8.5), `@mkbabb/value.js` (^0.4.6),
`@mkbabb/keyframes.js`, and `@mkbabb/latex-paper`. It is not a substrate library and
authors no substrate waves; it absorbs published primitives and files gaps upstream.

This document is the coordination artefact at `docs/precepts/instructions/tranche/SPEC.md §"Document Set"` — the cross-repo race-surface declaration for the glass-ui constellation. The sibling tranche (tranche B — the *CRUD / identity convergence* tranche, cross-repo with `@mkbabb/value.js`) carries its own coordination doc at `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`.

## Goal criterion

A's coordination posture succeeds when the glass-ui consumer-node relationship is documented honestly: every inherited carry has a known A-side disposition (landed / verified-discharged / addressed-in-named-wave), every emitted carry names its upstream destination, and no fourier-side fork of glass-ui source is introduced under the `file:` pin. The aim is to leave behind a coordination record the next constellation audit can read without re-discovering fourier-analysis's role.

## Completion criterion

This document closes at W6 (the close wave) with both **Emitted** rows updated to their landed-or-filed disposition, and every **Inherited** row marked LANDED or VERIFIED-DISCHARGED with a citing commit.

## Node identity

| Field | Value |
|---|---|
| Repo | `/Users/mkbabb/Programming/fourier-analysis` (web surface `web/`) |
| Constellation role | consumer node — successor to glass-ui's P-tranche CR-2 cross-walk / P.W5 Lane B |
| glass-ui pin | `file:../../glass-ui` @ v1.8.5 (`7e2e385`) |
| Prior constellation footprint | glass-ui M.W0 + M.W1 Lane C (the v1.0 subpath migration, `301a95e`); P CR-2 cross-walk (`4df1a06`) |
| First own tranche | A (this document set) |

## Inherited from the glass-ui stream

| Constellation ID | Item | A disposition |
|---|---|---|
| M.W0 / M.W1-C | v1.0 subpath-surface migration | LANDED `301a95e` — A verifies clean at W0 (the *Open, challenge, hygiene, numerical-test repair* wave) |
| P CR-2 / P.W5-Lane-B | dock typed-context, `useClipboard`, HoverCard re-import, GlassScrubber adoption | LANDED `4df1a06` — discharged per audit `d-style-glassui.md`; A re-confirms at W0, no further work |
| P12 | the AB+1 primitive-adoption cohort (`AnimatedDigit`, `Metric*`) | UNADDRESSED at A open — A.W3 (the *Interactive-primitive adoption* wave) lands it |

## Emitted to the glass-ui stream

A surfaces several cross-repo carries. None is a fourier-side fix; all are filed for the relevant upstream's next tranche.

| Carry | Target | Detail |
|---|---|---|
| A → glass-ui press-scale | glass-ui | three primitives express the press affordance three ways (`button/index.ts:9` token, `toggle/index.ts:33` bare `active:scale-95`, `ConfiguratorRow.vue:91` hardcoded fallback). Unify on `--scale-press*`. Audit `d-style-glassui.md` rows S1 + S2. |
| A → value.js color / path | value.js | value.js 0.4.6 lacks `colorScale(stops, t)` (a palette primitive) and a generic `sampleToSVGPath(fn, n)`. A.W4 (the *Scaling, KISS and correctness pass* wave) converges onto value.js's existing colour surface and files these two additions. |
| A → glass-ui `--viz-easing` | glass-ui `tokens.css` (viz-token block, alongside `--viz-fourier / -chebyshev / -legendre / -amber / -green`) | the viz-easing accent colour. 4 in-tree consumers at `EasingPicker.vue:22,67,68,78`. Until upstream ships it, the carry lives as a scoped CSS variable on `.easing-section` in `EasingPicker.vue`. Filed at A.W2.b. |
| A → glass-ui `::selection` base | glass-ui base layer (alongside the global border reset shipped by canon) | a canonical `::selection` palette. Consumer's local carry is `::selection { color-mix(--primary 12%/20%, transparent) }` in light + dark. Until upstream lands it, the rule lives in `web/src/style.css @layer base`. Filed at A.W2.b. |
| A → glass-ui Tabs entry animation | glass-ui Tabs primitive (UnderlineTabs / Tabs panel slot) | the tab-panel entry slide animation (`[data-state="active"][role="tabpanel"] { animation: tab-slide-in 0.18s }`) belongs on the upstream primitive. 3 in-tree consumers via `UnderlineTabs` (`EquationView.vue`, `VisualizationView.vue`, `GalleryView.vue`). Until upstream lands it, the rule lives in `web/src/style.css` as a documented local carry alongside its PRM guard. Filed at A.W2.b. |
| A → glass-ui font-asset URL hygiene | glass-ui build pipeline | glass-ui v2.0.0's built `dist/` references its own `src/fonts/fira-code/*.woff2` URLs — i.e. the font-asset URLs survived from source into the published artefact. Under cross-repo dev-resolution contract-v2 (which struck the sibling-`src/` `fs.allow` widening), the consumer can no longer reach those URLs over the `/@fs/` channel; the result is a 403 on first paint with graceful fallback to the consumer's preloaded Google-Fonts Fira Code. The upstream fix is to either bundle the woff2 assets into `dist/fonts/` and rewrite the URLs to a `dist/`-relative form, or to inline them as `url(data:font/woff2;base64,...)` in the published CSS. **DISCHARGED at glass-ui `e123dc1`** — Option B (base64 inline data URIs) adopted; Option A (`dist/fonts/` bundling with relative URLs) carried a structural blocker on Vite's symlink-realpath axis for CSS `url()` resolution. Filed at A.W2.d, discharged at A.W2.f. |
| A → glass-ui paper-texture opacity | glass-ui `tokens.css` `--paper-clean-texture` / `--paper-aged-texture` | glass-ui v2.0.0's `--paper-clean-texture` and `--paper-aged-texture` data URIs heretofore baked `opacity='1'` into the rect element, producing an overt grainy field at every consumer of `.paper-texture` — surfaced at fourier as broken UX after the W2.a token-de-fork (the paper view body rendering with visible grain in light, a beige tone-cast distorting warm section-heading colours in dark). The fourier-original pin at `4df1a06:web/src/style.css:53-54` carried the canonical subtle values `opacity='0.04'` (clean) / `opacity='0.06'` (aged); restoring them at upstream is the substrate fix. SVG `opacity` is a presentation attribute that does not resolve CSS vars, so the subtle value must be inlined at the URI source — Option A (rewrite upstream URIs) was the smallest correct intervention; Option B (CSS-var tunability) is structurally impossible without rewriting the texture-application channel at every consumer. **DISCHARGED at glass-ui `9cf88e6`**. Filed and discharged at A.W3.5.ab; full discharge artefact at `audit/W3.5-paper-refine.md`. |
| A → glass-ui `useSidebarState` generic | glass-ui `composables/sidebar/useSidebarState.ts` | glass-ui's canonical sidebar-state composable was heretofore hard-pinned to `sections: SidebarSection[]` (i.e. trees whose children live under `node.children`) — asymmetric with its sibling composables `useTreeIndex<T>` and `useScrollTracker<T>`, both of which were already generic over `T extends TreeNode` with a `getChildren` override. fourier-analysis's `PaperSectionData` stores children under `subsections`, so the consumer could not adopt the composable without coercing the domain type — a non-starter under the *fix at root* discipline. The augmentation: make `useSidebarState` generic over `T extends TreeNode`; accept optional `getChildren` forwarded into the inner `useTreeIndex<T>`; widen `activeId` / `activeRootId` to `MaybeRefOrGetter<string | null>` (which also discharges the cross-package `@vue/reactivity` patch-version skew at the call site — 3.5.30 in consumer vs. 3.5.34 in glass-ui — via `toValue` internally); surface a new `GenericSidebarState<T>` return type from the typed overload. The prior `SidebarSection` overload is preserved verbatim, so in-tree consumers in glass-ui's demos remain typesafe with no source-level changes. **DISCHARGED at glass-ui as part of this seam**. Filed and discharged at A.W3.5.c; consumer half adopts in `PaperSidebar.vue` + `MobileFloatingToc.vue`, additionally retiring the hand-rolled `grid-template-rows: 0fr → 1fr` collapse shim for glass-ui's `Collapsible` + `CollapsibleContent` primitives. Full discharge artefact at `audit/W3.5-sidebar.md`. |

## Sibling constellation — the CRUD cohort (tranche B)

A second constellation binds fourier-analysis to `@mkbabb/value.js` as a *peer* rather than a substrate relationship. Both repos are structural twins — a Vue demo over a MongoDB-backed API with a slug system, sessions, admin moderation, and a cleanup cron — and each has independently built the same CRUD facility in a different language (fourier in Python / FastAPI; value.js in Node / Express, the `palette-api`). The convergence of those two facilities is **tranche B** (the *CRUD / identity convergence* tranche), research-first and cross-repo. Its binding document is `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`. A hands B the carry at W6 close; A does not begin B's work.

## Coordination protocol

- A does not edit glass-ui or value.js source. The `file:` pin means a local glass-ui change is visible immediately, but A's invariants forbid it — substrate fixes are the substrate repo's waves.
- If a W3 or W4 gate is blocked by a genuine glass-ui or value.js gap, the scope-reveal protocol (`docs/precepts/instructions/tranche/SPEC.md §"Scope Reveal"`) applies: absorb with a named local carry; do not fork the substrate.
- This file is updated at A close (W6) with the disposition of both emitted carries.
