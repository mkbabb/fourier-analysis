# J — π visual-runtime DELTA (before/after, per-page)

Per the screenshots edict (precepts `8ccf9f4`): the BEFORE baseline is captured at
J-open (against the pre-WC HEAD — controls still RIGHT, the W5 surfaces not yet
shipped); the AFTER lands at J.W8 close (against the integration HEAD). Each row
names the **intended** change so the close can distinguish it from an **unintended**
regression. Pages with no intended change MUST be pixel-stable (modulo non-determinism).

**Harness:** `web/e2e/visual-baseline.spec.ts` · **Open capture:** 2026-06-04,
HEAD `70cc791` · 7 pages × 3 viewports (375×667 / 1280×800 / 1440×900) · **occlusion
gate: 21/21 GREEN** (zero horizontal overflow on every page × viewport).

| Page | Intended change (J) | Open state (before) | Close verdict (after) |
|---|---|---|---|
| **workspace** (`/w`) | **DEC-2 controls → LEFT** (W5) + **compose-the-void** (W5) | controls pinned RIGHT (`Image — source input` panel ≈x=1040/w=400) over ~75% dead dot-grid stage + a tiny dashed dropzone center-left — the captured §A defect | _(W8)_ — controls LEFT (authoring rail) + a generous dropzone claiming the stage; the LEFT flip is a NAMED intended change, not a regression |
| **gallery** (`/gallery`) | W4 `content-visibility` (shipped) + W5 WC layout + the diff-viewer/publish surfaces (W5/W6, NEW) | the grid + tabs at baseline | _(W8)_ |
| **equation** (`/equation`) | W5 R3 `Configurator` chassis propagation | hand-rolled `.eq-grid` controls | _(W8)_ |
| **morph** (`/morph`) | W5 R3 `Configurator` propagation + §C PRM motion gate | `.config-grid` + the morph canvas | _(W8)_ |
| **home** (`/`) | W5 WC atmosphere (aurora field) — minor | baseline landing | _(W8)_ — near-stable; aurora is additive z-[-1] |
| **paper** (`/paper`) | **none — must be pixel-stable** (the regression guard) | the paper reader at baseline | _(W8)_ — any delta here is an UNINTENDED regression to investigate |
| **shape-extractor** (`/demo/shape-extractor`) | none / incidental | baseline | _(W8)_ — stable |

**New surfaces with no before-baseline** (they do not exist at J-open; first appear
at W5/W6, so their evidence is after-only): the **diff-viewer** (the `GET /:slug/diff`
CSS-Custom-Highlight consumer) and the **publish/visibility UI** (the `POST
/:slug/{publish,unpublish}` control). The W6 evidence wave captures these once the
inv-15 consumer gap is wired (the CORE's 7 endpoints currently have zero frontend
caller — see the 2026-06-04 post-impl audit).

**Seed:** `before/_seed-workspace-configurator.png` — the pre-existing P5-defect
capture (squared `ConfiguratorLayer` inner-section rounding), archived not deleted.
P5 is glass-ui-owned (`glass-ui-P5-inner-rounding`, K.W4); not satisfied until the
inner sections round.
