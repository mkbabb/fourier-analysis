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

## Sibling constellation — the CRUD cohort (tranche B)

A second constellation binds fourier-analysis to `@mkbabb/value.js` as a *peer* rather than a substrate relationship. Both repos are structural twins — a Vue demo over a MongoDB-backed API with a slug system, sessions, admin moderation, and a cleanup cron — and each has independently built the same CRUD facility in a different language (fourier in Python / FastAPI; value.js in Node / Express, the `palette-api`). The convergence of those two facilities is **tranche B** (the *CRUD / identity convergence* tranche), research-first and cross-repo. Its binding document is `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`. A hands B the carry at W6 close; A does not begin B's work.

## Coordination protocol

- A does not edit glass-ui or value.js source. The `file:` pin means a local glass-ui change is visible immediately, but A's invariants forbid it — substrate fixes are the substrate repo's waves.
- If a W3 or W4 gate is blocked by a genuine glass-ui or value.js gap, the scope-reveal protocol (`docs/precepts/instructions/tranche/SPEC.md §"Scope Reveal"`) applies: absorb with a named local carry; do not fork the substrate.
- This file is updated at A close (W6) with the disposition of both emitted carries.
