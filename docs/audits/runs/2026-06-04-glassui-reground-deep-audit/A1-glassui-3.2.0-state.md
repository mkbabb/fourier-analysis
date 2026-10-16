# A1 — glass-ui 3.2.0 ACTUAL STATE (the load-bearing re-ground)

> Dimension A1 of the 2026-06-04 6-agent glass-ui-reground deep audit. Every claim
> cites the SIBLING'S ACTUAL SOURCE (`/Users/mkbabb/Programming/glass-ui`) at HEAD
> `06b35d9`, its CHANGELOG, and the AR/AS tranche records — then re-grounds each
> standing fourier glass-ui ASK against that reality.

## TL;DR — the gate has dissolved

fourier has spent J/K booking a cohort of glass-ui ASKS "gated on a future
glass-ui 3.2.0 release." **glass-ui already shipped 3.2.0** (`package.json:version
= 3.2.0`, glass-ui HEAD `06b35d9`; `CHANGELOG.md` §3.2.0). **`npm view
@mkbabb/glass-ui dist-tags` = `{ latest: '3.2.0' }`** — it is npm-installable
TODAY. fourier declares `"@mkbabb/glass-ui": "^3.1.0"` (`web/package.json:14`),
which a clean `npm install` resolves straight to 3.2.0. So **the gate is not a
release wait — it is a one-line caret bump + `npm install`**.

Of the 7 standing ASKS: **4 are DONE-in-sibling, 1 is PHANTOM-KILL, 2 are
genuinely ABSENT** (A-1 divider-rule, A-2 label/sub ladder hook). The 5
satisfied/dead asks collapse into a single **ADOPT-NOW** action (`^3.1.0 →
^3.2.0`). Only A-1 + A-2 remain real cross-repo asks — and they are small,
additive, and unblocking is NOT contingent on them (fourier can adopt 3.2.0 and
ship DEC-2 + dock-VT-unblock + inert + highlight without them).

### One correction to the directive's premise (verify-as-instructed)

The directive states "fourier's INSTALLED node_modules glass-ui = 3.2.0." **Not
in `web/`.** `web/node_modules/@mkbabb/glass-ui/package.json:version = 3.1.0`
(the lockfile-pinned install is still 3.1.0). The *registry* is 3.2.0 and the
*caret* permits it, but the working tree has NOT yet been reinstalled. ADOPT-NOW
must therefore be "bump caret AND `npm install` to re-resolve the lock," not a
no-op — a real (trivial) action item, not already-done in fourier's tree.

---

## Per-ASK verdicts (the re-ground table)

| ASK | Verdict | Evidence (glass-ui source / changelog) |
|---|---|---|
| (a) dock-VT `useId()` | **DONE-in-sibling** | shipped **3.1.1 / AR.W2** |
| (b) `asideSide` (DEC-2 controls-LEFT) | **DONE-in-sibling** | shipped **3.2.0** (in source) |
| (c) A-1 inter-row divider-rule | **ABSENT** | still `.instrument-rail`-only |
| (d) A-2 label/sub → text-title ladder hook | **ABSENT/PARTIAL** | hard-coded `text-sm`, no token hook |
| (e) `useTextHighlight` | **DONE-in-sibling** | shipped **3.2.0** (note: `/dom`, not `/motion-core`) |
| (f) a11y `inert` on collapsed `ConfiguratorLayer` | **DONE-in-sibling** | shipped **3.1.1 / AR.W2** |
| (g) P5 inner-rounding | **PHANTOM-KILL** | AR.W2 *removed* per-section radius by design |

---

### (a) dock-VT `useId()` — DONE-in-sibling (3.1.1, AR.W2). KILL the gate.

The duplicate `glass-dock-1` **cannot occur in 3.2.0**. The module/setup counter
is deleted; the mint derives from Vue's app-scoped `useId()`:

- `glass-ui/src/components/custom/dock/GlassDock.vue:137`
  `const dockId = \`glass-dock-${useId()}\`;`
- `:210` `"view-transition-name": dockId.replace(/[^a-zA-Z0-9_-]/g, "-")` (per-instance)
- `:200-201` comment now correctly names `useId()` as the app-scoped collision-free source
- `DockLayerGroup.vue:69` `const vtId = useId();` → `:73` `gl-dock-stack-${vtId…}` (the stack mint is also `useId()`-derived)
- CHANGELOG §3.1.1: *"`dockId` is now minted from `useId()` … a new `proof:vt-names` static gate makes the violation class structurally impossible."*
- AR.md §Goal: the `proof:vt-names` gate + a unit test mounting ≥2 docks asserting pairwise-distinct names ship as part of the headline.

**Implication for the e2e CHRONIC.** The CI-red on the pre-existing
`glass-dock-1` duplicate-view-transition-name (fourier's two co-mounted docks)
is **fixed at the source in 3.1.1+**. fourier's e2e unblock is therefore an
**ADOPT-NOW bump**, not a future wait — and the J.md §230 kill-dated
self-deleting "bridge" engineered to keep the suite green while the upstream is
owned is now **moot**: the upstream is shipped. The honest J close that "waits on
the upstream" (J.md:230 TOP RISK 1) is **unblocked by bumping the caret + `npm
install`**.

### (b) `asideSide` — DONE-in-sibling (3.2.0). Satisfies DEC-2. KILL the gate.

The prop exists in full, matching ASK-AS-asideSide / A-3 to the letter:

- `Configurator.vue:32` `export type ConfiguratorAsideSide = "left" | "right";`
- `:85` `asideSide?: ConfiguratorAsideSide;`  `:101` default `"right"`
- **Mechanism = grid-column placement + border-side swap, NO DOM reorder** — exactly the a11y-safe flip DEC-2 mandated:
  - `:136` base `lg:grid-cols-[minmax(0,1fr)_minmax(var(--configurator-aside-min,280px),var(--configurator-aside-max,360px))]`
  - `:162-166` `asideColumnClass` → `left` swaps to `lg:col-start-1 lg:row-start-1`; stage to `lg:col-start-2`
  - `:171-172` `asideBorderClass` → `left` flips `lg:border-r lg:border-l-0`
  - `:27-29` + `:82-83` docstring: *"the flip is grid-column placement + border-side only, no source reorder — no a11y regression. DOM/tab order stays stage→aside."*
- The `asideWidth` token band ALSO shipped: `:85-94` `asideWidth?: string | readonly [min, max]` projecting `--configurator-aside-min/max` (`:146-153`). So fourier can **DELETE** the 3 breakpoint `grid-template-columns` overrides (`VisualizationView.vue:322,326,329` per J.md:174) AND stop overriding tracks.

**DEC-2 (`aside-side="left"`) is satisfiable today** by setting one prop on the
existing `^3.2.0`. The glass-ui default stays `'right'` (`:101`) — no
constellation-wide flip, exactly as J.md scoped it.

### (c) A-1 inter-row divider-rule — **ABSENT in 3.2.0. Real remaining ask.**

The auto-groove `data-divider-rule` is **still `.instrument-rail`-only**; the
Configurator chassis emits no inter-row divider:

- `instrument-rail.css:74,83,92,101,110,114` — every `data-divider-rule` selector
  is scoped to `.instrument-rail[data-divider-rule]`. Grep for `data-divider-rule`
  under `src/components/custom/configurator/` and `src/styles/` returns **only**
  the instrument-rail rules.
- `ConfiguratorLayer.vue:100` emits only `border-b border-border/40 last:border-b-0`
  (a flat hairline between LAYERS, not the twin-line machined groove between ROWS).
- `ConfiguratorRow.vue` emits only gap/padding (no divider), confirming
  `WC-design-hierarchy.md:104`'s diagnosis still holds at 3.2.0.

**Verdict: A-1 survives as a genuine glass-ui ASK** (BOOK-with-kill-date, owner
glass-ui). It is NOT in the dissolved set. fourier must NOT hand-roll a hairline
(NO-LEGACY); until A-1, intra-layer separation rides rhythm + explicit
`.chassis-divider`. This is small (a `data-divider-rule` opt-in on
`ConfiguratorLayer`/`ConfiguratorRow` mirroring the instrument-rail recipe) and
does NOT block ADOPT-NOW.

### (d) A-2 label/sub → text-title ladder hook — **ABSENT/PARTIAL. Real remaining ask.**

`ConfiguratorLayer` still hard-codes the title typography rather than binding it
to the `text-title`/`text-heading` ladder:

- `ConfiguratorLayer.vue:118` `<span class="text-sm font-semibold text-foreground">{{ label }}</span>` — a magic literal, NOT a ladder token / CSS-var hook.
- `:121` the `sub` is `text-micro font-mono text-muted-foreground/70` — a mono-micro rung, reasonable, but still not a *retunable token hook* a consumer can re-rung from the root.

So the "one rung change restyles every section title" lever A-2 asks for does
NOT exist at 3.2.0. **Verdict: A-2 survives** (BOOK-with-kill-date, owner
glass-ui). Like A-1 it is additive and non-blocking for ADOPT-NOW (fourier sets
the ladder utility on its OWN headers fourier-local; only the component-internal
token hook is the ask).

### (e) `useTextHighlight` — DONE-in-sibling (3.2.0). KILL the gate. **Note the subpath drift.**

The composable is real, exported, and multi-instance-safe:

- `src/composables/dom/useTextHighlight.ts:129` `export function useTextHighlight(name: string): UseTextHighlightControls`
- API (`:35-52`): `{ set(ranges), setFromMatches(container, query, matcher?), clear(), readonly supported }`; `HighlightMatcher` type (`:28-33`); default case-insensitive substring scan.
- Multi-instance safety (`:54-92`): a per-name `Contributor` registry — surfaces sharing a name multiplex ranges under one `CSS.highlights` entry; the last contributor tear-down deletes the entry (no stale paint). CHANGELOG §3.2.0 names this: *"now multi-instance safe."*
- Test fixture present: `src/composables/__tests__/useTextHighlight.test.ts`.

**Correction to fourier's doc:** `J.WC-frontend-grand-audit.md:197,282` say glass-ui
should author `useTextHighlight` **"on `/motion-core`."** It actually ships on
**`/dom`** (`src/composables/dom/index.ts:33` `export * from "./useTextHighlight"`;
CHANGELOG §3.2.0: *"`@mkbabb/glass-ui/dom`"*). fourier's E2 equation-hover + G6
diff-viewer consumer must import from `@mkbabb/glass-ui/dom`, not `/motion-core`.
The `supported` flag gives the inv-29 progressive-enhancement floor for free.

### (f) a11y `inert` on collapsed `ConfiguratorLayer` — DONE-in-sibling (3.1.1, AR.W2).

- `ConfiguratorLayer.vue:144` `:inert="!internalOpen || undefined"` on the
  collapsible region (`:140-147`), plus `:143` `:aria-hidden="!internalOpen"`.
- `:139` comment: *"inert pulls the collapsed subtree from tab order + a11y
  tree—the aria-hidden-focus closure."*
- CHANGELOG §3.1.1: *"`ConfiguratorLayer` applies `inert` to its collapsed body
  (closes an `aria-hidden-focus` violation)."*

The `aria-hidden-focus` violation is closed at the source. KILL any standing
`glass-ui-a11y inert` ask as DONE-in-sibling.

### (g) P5 inner-rounding — **PHANTOM-KILL. The user's correction is confirmed at the source.**

The user's correction — *"inner rounding is rejected — the rounding is
controlled by the container"* — is EXACTLY what glass-ui already implemented as a
deliberate fix in AR.W2:

- `Configurator.vue:130` `"configurator glass-floating rounded-panel border border-border/60 overflow-hidden"` — the container owns the radius (`rounded-panel`) + the clip (`overflow-hidden`); `:122-129` comment: *"ConfiguratorLayer sections inherit a rounded outer clip."*
- `ConfiguratorLayer.vue:98` comment: *"No per-section radius: rounding is owned at the container root clip … a per-section radius only deforms the hairline on a transparent border-only element."*
- CHANGELOG §3.1.1: *"the per-section `rounded-panel` that deformed the inner `border-b` dividers is removed — rounding is owned by the container clip."*

So the "fix" fourier carried as `glass-ui-P5-inner-rounding` is a **phantom**:
there is nothing for glass-ui to add — adding per-section radius is precisely the
defect AR.W2 *removed*. The inner sections are square-cornered **by design**; the
container's `rounded-panel + overflow-hidden` clips the outer corners. **KILL P5**
everywhere it is booked in fourier (ADOPTION-ASKS §7 `:124`; grand-audit §F/:265;
control-pane audit / WC-design-hierarchy A-row + `:153,:163`; K.W4; the J chronic
ledger J.md §8; DELTA.md:32; constellation-adoption-2026-06-02.md:171;
A5-prompt-precept-coverage.md:21). Do NOT re-book. The "NOT marked satisfied until
the inner sections round" acceptance criterion is itself the phantom — the inner
sections are CORRECTLY square.

---

## What dissolves into ADOPT-NOW vs what genuinely remains

**ADOPT-NOW (`web/package.json:14` `^3.1.0 → ^3.2.0` + `npm install`):** kills 5
asks at once — dock-VT useId (a), asideSide/DEC-2/A-3 (b), useTextHighlight (e),
inert (f), and P5 (g, by being a phantom). This single bump:
- unblocks the **e2e CHRONIC** (the `glass-dock-1` collision is source-fixed),
- enables **DEC-2 controls-LEFT** via `aside-side="left"` + deleting the 3 grid overrides,
- gives **E2/G6** the `useTextHighlight` consumer (from `/dom`),
- closes the **inert a11y** violation,
- moots the J.md:230 kill-dated self-deleting e2e bridge.

**GENUINELY REMAINING glass-ui asks (small, additive, NON-blocking):**
- **A-1** inter-row `data-divider-rule` opt-in on `ConfiguratorLayer`/`ConfiguratorRow` — ABSENT (still instrument-rail-only). BOOK-with-kill-date, owner glass-ui.
- **A-2** `ConfiguratorLayer` `label`/`sub` token hook onto the `text-title` ladder — ABSENT (hard-coded `text-sm`). BOOK-with-kill-date, owner glass-ui.

Neither A-1 nor A-2 blocks the ADOPT-NOW bump or the e2e unblock; fourier ships
the divider via rhythm + explicit `.chassis-divider` and the title ladder
fourier-local until they land.

## Net structural correction to the forward plan

K.W4's "glass-ui-3.2.0 adoption wave gated on a future release" is **the wrong
frame**: 3.2.0 is published and npm-`latest`. The forward action is a one-line
caret bump + reinstall in J's own scope (it unblocks J.W6's e2e close), NOT a
K-deploy-sequenced wait. K-deploy should still own the babb.dev API deploy
chronic, but it must NOT gate fourier's glass-ui adoption — that adoption is
ADOPT-NOW and belongs at the head of the next fourier wave, ahead of (and
independent of) the deploy spine.
