# D1 — Title Demarcation & Section Labeling (control-pane audit)

**Dimension:** every control pane on every page — does each section/group have a clear,
present, properly-weighted TITLE that demarcates it? Title typography hierarchy; orphan
controls; cross-pane consistency.

**Verdict:** The workspace configurator (BasisSelector / ContourSettings / CoefficientsPanel)
has the *correct* canonical title treatment — glass-ui `ConfiguratorLayer label="…" sub="…"`,
the bold-serif label + dim sub-label. But that pattern is **not propagated**: the same panes
ship **five mutually-inconsistent title idioms** across the three control surfaces, two panes
have **no section title at all** (orphan walls), and `ImageUpload` — the *only* titled section
in the empty workspace — hand-rolls an `<h3>` that *mimics* the ConfiguratorLayer header but is
not one (so it can't dock into the layer stack and renders a different chip/icon treatment).
The fix is one canonical pattern: `ConfiguratorLayer label/sub` everywhere, label promoted to a
token-driven type rung. This converges with WC-layout R3 and WC-typo refinement #1.

---

## The five title idioms found (the inconsistency map)

| # | Idiom | Markup | Used by | Capture |
|---|-------|--------|---------|---------|
| A | **glass-ui `ConfiguratorLayer label/sub`** (CANONICAL) | `<ConfiguratorLayer label sub>` — `.d.ts:35-38` "label: large/semantic; sub: small/monospaced" | BasisSelector `:120`, ContourSettings `:190`, CoefficientsPanel (viz) `:14` | `_seed-workspace-configurator.png`: bold serif "Decomposition" + dim mono "basis & resolution"; "Contour", "Coefficients" |
| B | **fourier `CollapsibleSection title/subtitle`** | `<CollapsibleSection title subtitle>` → `cm-serif text-sm font-semibold` + `— sub` span + chevron (`CollapsibleSection.vue:39-41`) | FunctionInput "Function"/"f(x)" + "Controls"/"harmonics & display" (`:94,:176`), EqCoefficientsPanel "Coefficients"/"Fourier spectrum" (`:13`) | `equation-1280x800.png`: identical *look* to A, different component, wrapped in `cartoon-card` |
| C | **hand-rolled `<h3 cm-serif text-sm font-semibold>`** | `<h3 …>Image <span>— source input</span></h3>` (`ImageUpload.vue:44-48`) | ImageUpload (the source-input pane) | `workspace-1440x900.png`: the ONLY titled section in the empty state |
| D | **`<h3 class="config-card-title">` (serif text-lg, weight 400)** | larger/lighter serif + `config-card-desc` on its OWN line below (`MorphPhaseConfig.vue:3-4`, CSS `:120-132`) | MorphPhaseConfig × 3 (Settle Out / Morph / Settle In) | `morph-1440x900.png`: three cards, title scale ≠ every other pane |
| E | **plain `<span class="text-sm font-medium text-foreground">Equation</span>`** | sans-serif medium, NO serif, NO subtitle (`EquationPanel.vue:75`) | EquationPanel overlay | (overlay, not in static captures) |

Idioms A, B and C all *try* to land the same visual ("`cm-serif text-sm font-semibold` + dim
`— sub`") yet are three different components/elements; D and E diverge outright (different
scale, different face, no subtitle). One control system should have **one** title primitive.

---

## Findings

### D1-1 — Two viz panes are title-less walls in their *expanded* form, and the morph grid has NO collapsible titling (orphan controls) [P2]

**Observed:** In the workspace, `BasisSelector` and `ContourSettings` correctly title via
`ConfiguratorLayer` — but *inside* the body, the first group of controls is an **orphan with no
sub-heading**. `BasisSelector.vue:138-152` renders the Epicycles/Chebyshev/Legendre pill row
**directly under the layer label** with no "Basis" group heading; in `_seed-workspace-configurator.png`
the three pills float between "Decomposition — basis & resolution" and the "Harmonics" row with
nothing demarcating "these pills are the *basis* selector, the sliders below are *resolution*."
The `sub="basis & resolution"` promises two groups; the body shows one undifferentiated stack.
Worse, on the **morph page** (`morph-1440x900.png` / `morph-1280x800.png`) the three
`MorphPhaseConfig` cards DO have titles (D-idiom) but the `HarmonicLevelGrid` below them and the
Export/Reset row are **completely title-less** (`FourierMorphDemo.vue:58,70`) — at 1280 the
"Harmonic Levels" strip reads as a detached band with a tiny inline `Low/High` label and no
section heading tying it to the config cards above.

**Refinement:** Give every *group* a heading, not just every *pane*. In `BasisSelector`, wrap the
pill row in a `<ConfiguratorRow label="Basis">` (it already uses `ConfiguratorRow label` for
Harmonics/Sample Points — `:154,:181`), so the body reads Basis → Harmonics → Sample Points as
three labeled rows. On the morph page, the orphan `HarmonicLevelGrid` + Export row need real
section titles — fourier-local now via a `<ConfiguratorLayer label="Harmonic Levels" sub="…">`
once the morph route adopts the chassis (WC-layout R3), or a fourier-local `<h3>` matching the
canonical rung in the interim.

**Owner:** **fourier-local** (ConfiguratorRow wrap + morph section headings; no glass-ui change).

---

### D1-2 — `ImageUpload` hand-rolls the section title instead of being a `ConfiguratorLayer`; it is the only titled pane in the empty state and uses a different chip [P1]

**Observed:** `workspace-1440x900.png` (and the 1280/375 variants): the empty-workspace aside
shows exactly **one** titled box — "**Image** — source input" — and it is NOT a
`ConfiguratorLayer`. `ImageUpload.vue:37` is a bare `<div class="cartoon-card">`; its title is a
hand-rolled `<h3 class="cm-serif mb-3 text-sm font-semibold …">` with an `<ImagePlus>` icon
(`:44-48`). Every *other* pane in the same stack (`BasisSelector`, `ContourSettings`,
`CoefficientsPanel`) is a real `ConfiguratorLayer`. So the one pane the user *always* sees first
is the one outlier: different card chrome (`cartoon-card` vs the Configurator substrate),
different title element, an icon the ConfiguratorLayer header doesn't carry, and (critically) it
**cannot dock into the layer stack** — it floats as a separate card above the chassis (visible in
`_seed-workspace-configurator.png` where "Image — source input" sits above the
Decomposition/Contour/Coefficients ConfiguratorLayers with a visual seam). On mobile
(`workspace-375x667.png`) it sits *below* a large empty band, doubly orphaned.

**Refinement:** Convert `ImageUpload` to a `<ConfiguratorLayer label="Image" sub="source input"
:default-open="true">`, dropping the hand-rolled `<h3>` and the `cartoon-card` wrapper. The image
preview / drop-strip become the layer body. This makes the source-input pane the *first
ConfiguratorLayer* in the stack (uniform header, uniform divider, dockable) instead of a foreign
card. The `<ImagePlus>` icon, if kept, moves to the layer's title slot (consistent with the
canonical header), not a bespoke `<h3>` flex.

**Owner:** **fourier-local** (swap `ImageUpload`'s root for `ConfiguratorLayer`; no glass-ui
change — the primitive already accepts `label`/`sub`).

---

### D1-3 — Equation route duplicates the ConfiguratorLayer title look with a *different* component (`CollapsibleSection`) inside `cartoon-card`s [P2]

**Observed:** `equation-1280x800.png` / `equation-375x667.png`: the equation left rail shows
"**Function** — f(x)", "**Controls** — harmonics & display", "**Coefficients** — Fourier spectrum"
— visually near-identical to the workspace's ConfiguratorLayer headers (chevron + bold serif +
dim em-dash subtitle). But these are `CollapsibleSection` (`FunctionInput.vue:94,176`;
`EqCoefficientsPanel.vue:13`), a *fourier-local* wrapper (`CollapsibleSection.vue:39-41`) wrapped
in `cartoon-card`s — NOT `ConfiguratorLayer`s. The treatments only *coincidentally* match because
both hard-code `cm-serif text-sm font-semibold` + `— sub`. They will drift the moment either side
changes (and WC-typo #1 wants to promote BOTH to the type ladder — two places to change instead
of one). The equation route is the parallel of WC-layout R3: a hand-rolled controls stack that
the workspace already solved with the chassis.

**Refinement:** Migrate the equation left rail to `<Configurator>` + `<ConfiguratorLayer label sub>`
(per WC-layout R3), retiring `CollapsibleSection` + `cartoon-card` at these three sites. The
titles then come from the *same* primitive as the workspace, so a single typo change (rung
promotion) propagates everywhere. If full chassis adoption is deferred past W5, the interim move
is at minimum to route `CollapsibleSection`'s title span through the same token rung as
ConfiguratorLayer's label (see D1-6) so the two stay locked.

**Owner:** **fourier-local** (component swap is fourier's; the title *rung* it should land on is
the glass-ui ladder — see D1-6).

---

### D1-4 — `EquationPanel` overlay title is sans-serif, weightless, and subtitle-less — breaks the title voice entirely [P2]

**Observed:** `EquationPanel.vue:75` titles the overlay with `<span class="text-sm font-medium
text-foreground">Equation</span>` — sans-serif (CM-Serif is the title face everywhere else),
`font-medium` (every other title is `font-semibold`/serif), and **no subtitle**. It reads as a
body label, not a section title; against the four serif-bold idioms above it looks like a
different app's component. (Not in the static before-captures since it is a transient overlay,
but it is a control pane with a title, so it is in-scope for "every pane.")

**Refinement:** Bring the overlay header into the title voice: serif + the canonical title rung +
an em-dash subtitle ("Equation — simplified Fourier"), matching the ConfiguratorLayer label
treatment. If the overlay is ever folded into the chassis it should become a ConfiguratorLayer
header outright; until then, mirror the canonical class set so the voice is uniform.

**Owner:** **fourier-local** (a fourier overlay component; class/markup change only).

---

### D1-5 — Morph `config-card-title` is a third title SCALE (serif text-lg weight-400 + subtitle on its own line) — inconsistent weight/size/layout vs every other pane [P2]

**Observed:** `morph-1440x900.png` / `morph-375x667.png` / `morph-1280x800.png`: the three phase
cards ("Settle Out", "Morph", "Settle In") title via `<h3 class="config-card-title">` =
`font-serif text-lg font-weight:400` with the description on a **separate line below**
(`MorphPhaseConfig.vue:3-4`; CSS `:120-132`). Every other pane's title is `text-sm font-semibold`
with the subtitle **inline** after an em-dash. So morph titles are simultaneously *bigger*
(text-lg vs text-sm), *lighter* (400 vs 600), and *stacked* (desc below vs `— sub` inline). On the
375 capture the morph card titles visually out-rank the page's own panes elsewhere, inverting the
hierarchy (a sub-section card title looks heavier than a workspace pane title). Three scales for
the same semantic level.

**Refinement:** Re-cast each `MorphPhaseConfig` as a `<ConfiguratorLayer label sub>` (per
WC-layout R3) so "Settle Out" / "Shape degrades to low harmonics" land on the canonical
label/sub rung — same size, weight, and inline-subtitle layout as the workspace. Retire
`config-card-title` / `config-card-desc`. The 3-up `config-grid` becomes three ConfiguratorLayers
(or a Configurator-internal grouping).

**Owner:** **fourier-local** (morph components are fourier's; ConfiguratorLayer is already
available).

---

### D1-6 — There is NO token for the section-title type rung; every title hard-codes `text-sm font-semibold` (or worse), so "promote to the ladder" has no single lever [P2 / standing]

**Observed:** The title size/weight is a magic literal at every site: `cm-serif text-sm
font-semibold tracking-tight` in CollapsibleSection (`:39`) and ImageUpload (`:44`); `text-lg
font-weight:400` in morph (`MorphPhaseConfig.vue:122-125`); `text-sm font-medium` in EquationPanel
(`:75`). `style.css` carries no section-title token (only the `cartoon-card` shim at `:107` and
the `--section-color-*` ramp at `:121-126`). WC-typo refinement #1 already prescribes cascading
glass-ui's `text-title`/`text-heading` ladder utilities onto these headers in place of the ad-hoc
`text-sm font-semibold cm-serif`. With five hard-coded copies there is no single place to do it.

**Refinement (the canonical title-demarcation pattern):**
1. **One primitive:** `ConfiguratorLayer label="…" sub="…"` is the section-title contract for
   *every* control pane (label = large/semantic, sub = small/monospaced — its own `.d.ts:35-38`).
   ImageUpload (D1-2), the equation rail (D1-3), the morph cards (D1-5) all converge onto it;
   `CollapsibleSection` is retired or becomes a thin shim over ConfiguratorLayer's header.
2. **One rung:** the ConfiguratorLayer label binds to a glass-ui ladder utility (`text-title` /
   `text-heading` per WC-typo #1), the `sub` to the mono micro-label rung — so a single token
   change restyles every section title app-wide. No more `text-sm font-semibold` literals.
3. **One divider:** each ConfiguratorLayer already supplies its own header rule; the hand-rolled
   `border-t border-border/40` pseudo-dividers in FunctionInput (`:154`) and the bespoke
   `.divider-line` in ContourSettings (`:331-335`) defer to the platform `data-divider-rule`
   groove (`instrument-rail.css`) for *intra-pane* group separation — see D1-7.

**Owner:** **mixed.** The single primitive + the divider deference is **fourier-local** (swap
components). The *label rung itself* (whether ConfiguratorLayer's label should render at
`text-title` by default, or whether fourier passes a class) is a **glass-ui-ASK** if it requires
changing the primitive's default header type scale; fourier can land it locally now by passing the
ladder class to the label slot without any `!important` override of glass-ui internals.

---

### D1-7 — Intra-pane group separators are hand-rolled `border-t` / `.divider-line` instead of the platform groove — title-less pseudo-sections [NIT]

**Observed:** Where a pane *does* split into sub-groups, the split is a hand-rolled hairline with
a bare field-label, not a titled sub-section: FunctionInput's "Presets" sits behind
`border-t border-border/40 pt-3` with only a `<label text-sm font-medium text-muted-foreground>`
(`FunctionInput.vue:154-155`) — a pseudo-section heading at *field-label* weight, so the divider
implies "new group" but the label doesn't read as a group title; "Notation" (`:222`) has the same
field-label with **no** divider at all (inconsistent). ContourSettings rolls its own
`.advanced-divider` / `.divider-line` (`:256-262`, CSS `:325-335`) for the Advanced collapsible.
None use the glass-ui `data-divider-rule` twin-line groove / `bezel-line`
(`instrument-rail.css`).

**Refinement:** For real sub-sections (Presets, Notation, Advanced), either promote to a labeled
`ConfiguratorRow`/nested group with a proper sub-heading rung, or — where only a rule is needed —
use the platform `data-divider-rule` groove instead of `border-t`/`.divider-line` (NO-LEGACY:
prefer the primitive's hairline over a hand-rolled border). Make "Presets" and "Notation"
demarcate consistently (both get the same separator, or neither).

**Owner:** **fourier-local** (swap hand-rolled borders for the platform divider; group labeling is
fourier markup).

---

## Cross-reference

- **WC-layout R3** (`WC-design-layout.md:61-63`) independently flags EquationView + MorphView as
  hand-rolled controls stacks that should adopt `Configurator`/`ConfiguratorLayer label sub` — D1-3
  and D1-5 are the *title-demarcation* face of that same move.
- **WC-typo refinement #1** (`WC-design-typo-color.md`) prescribes cascading `text-title`/
  `text-heading` onto CollapsibleSection / equation headers, replacing ad-hoc `text-sm font-semibold
  cm-serif` — D1-6 is the token lever that makes it a one-place change.
- **P5 (glass-ui-owned, K.W4):** orthogonal (inner-section *rounding*, not titling) but co-located
  on the ConfiguratorLayer — both improvements land on the same primitive at the chassis adoption.

## Canonical pattern (one-line)

`ConfiguratorLayer label="<Section>" sub="<token/desc>"` for **every** control pane; label bound to
the glass-ui title ladder rung, sub to the mono micro-rung; `ConfiguratorRow label` for every
field/group inside; platform `data-divider-rule` groove for intra-pane rules. No hand-rolled `<h3>`,
no `CollapsibleSection` duplication, no `config-card-title` third scale, no sans-serif `<span>` title.
