# A4 — The e2e / CI / inv-27 chronic (`glass-dock-1` duplicate view-transition-name)

**Auditor dimension:** A4 — the e2e gate, the pre-existing-red root cause, and inv-27 posture.
**Repo HEAD audited:** `9d7c387` (origin/master, NOT deployed).
**CI run audited:** `26913592291` — web ✓, api/tests ✓ (266), e2e ✗.
**Prior master run audited:** `26831216131` — e2e ✗, **byte-identical** failure (pre-existing).

---

## 1. Root cause — corrected and pinned to source

The briefing said the dock VT-name is minted by "a **module counter** `glass-dock-${++n}`." **That is wrong, and the correction matters for the fix.** The counter is declared INSIDE `setup()`, so it resets to `0` on every instance and `++n` deterministically yields `glass-dock-1` for the first (and only) dock of *each* GlassDock instance:

- `node_modules/@mkbabb/glass-ui/dist/dock.js:227` — `setup(e, { expose: t }) {`
- `dock.js:228` — `let n = 0, …` (counter is **setup-local**, not module-scoped)
- `dock.js:234` — `w = \`glass-dock-${++n}\`` → always `glass-dock-1` per instance
- `dock.js:253` — `"view-transition-name": w.replace(/[^a-zA-Z0-9_-]/g, "-")`

Because the counter is per-setup, two GlassDock instances do not "happen to overlap on 1" — they are each **independently and deterministically** `glass-dock-1`. There is no instance that ever mints `glass-dock-2`. The `props` block (`dock.js:202-226`: `collapseDelay, startCollapsed, fitContent, position, alwaysExpanded, wrap, variant, shape, orientation, density, containerName`) exposes **no** VT-name / id prop. A fourier consumer cannot pass a unique name. This is a hard upstream defect, not a misuse.

## 2. The collision condition (fourier side) — pinned

fourier mounts two docks that can be live simultaneously:

- `VisualizationView.vue:210` — `<CanvasControlsDock>` renders when `hasData || (isEditing && store.contour)`
- `VisualizationView.vue:238` — `<EditorControlsDock>` renders when `isEditing && store.contour`

When `isEditing && store.contour && hasData` are all true, **both** are mounted → both carry `view-transition-name: glass-dock-1`. Neither fourier component (`CanvasControlsDock.vue:41`, `EditorControlsDock.vue:56`) can override the name.

**Discriminating evidence that this is the two-dock co-mount, not a global glass-ui fault:** in the failing run, `gallery.spec.ts:118` "no console errors on gallery page" **PASSED** (the gallery mounts no workspace docks), while every workspace/CRUD-flow spec that drives the editor failed. So the warning is conditional on the two-dock workspace state, exactly as the mount predicates predict.

## 3. Why the warning is NOT merely cosmetic (the buried second bug)

The browser logs "Unexpected duplicate view-transition-name" **during a `startViewTransition` capture**. fourier opens exactly such a transition on `visualization`↔`workspace` route morphs:

- `router/index.ts:131-147` — `beforeResolve` calls `document.startViewTransition(...)` when `isVizMorph(to,from)` and VT is supported and PRM is off.
- `router/index.ts:20-26` — `isVizMorph` = both routes in `{visualization, workspace}`.

During that capture, two elements share `glass-dock-1`, so the spec **and the user** lose the dock's geometry-morph (the browser drops the duplicate-named snapshot). This is therefore TWO defects in one symptom: (a) the inv-27 red, and (b) a **silent broken dock morph in production** on viz↔workspace navigation while editing. The e2e probe is doing its job — it surfaced a real visual regression, not noise.

## 4. The failing probes — five hand-rolled, divergent filters (the deeper chronic)

The "no console errors" assertion is **not** one shared helper; it is re-implemented five times with subtly different allowlists:

| Spec | Probe site | Allowlist |
|---|---|---|
| `visualization-crud.spec.ts:438-485` (`instrument()`) + assert `:612` | richest | favicon, `ERR_CONNECTION_REFUSED`, 429, 404, 412, 401 + a response-side asset guard |
| `contour-extraction.spec.ts:140-165` | inline | favicon, 404, `ERR_CONNECTION_REFUSED` |
| `workspace-flow.spec.ts:195-202` | inline | favicon + … (divergent) |
| `gallery.spec.ts:130-137` | inline | favicon + … (divergent) |
| `paper-performance.spec.ts:262-267` | inline | favicon, 404 |

This is itself a NO-LEGACY / DRY violation: the same intent, five drifting copies. The mature `instrument()` helper already establishes the **codebase's own precedent for whitelisting NAMED benign console noise** (six categories at `:448-459`). The question "is whitelisting a tracked upstream warning forbidden?" is already answered by the repo: it whitelists 401/404/412/429 today.

## 5. The W6 / glass-ui-3.2.0 ADOPTION-ASK — specified precisely

The user decision (book to W6 / glass-ui 3.2.0, no fourier `!important` workaround) is correct and inv-16-honoring: fourier owns no lever over `dock.js`. But the ask was **never ledgered** — it does not appear in `ADOPTION-ASKS.md §7` (the J-era bookings: `valuejs-J-atomdiff`, `valuejs-J-publish`, `glass-ui-P5-inner-rounding`), nor in the WC grand-audit §F/§G owner matrix. It was discovered this session via CI and is currently an **un-booked** chronic. That is the gap to close in the next tranche.

**ADOPTION-ASK row to author (id: `glass-ui-dock-vt-name`), owner glass-ui, gate glass-ui 3.2.0:**

> GlassDock mints `view-transition-name: glass-dock-1` for every instance via a **setup-local** counter (`dist/dock.js:228,234,253`) — two co-mounted docks always collide. The browser logs "Unexpected duplicate view-transition-name: glass-dock-1" during any `startViewTransition` capture and drops the dock morph. **Fix at the component root:** derive the VT-name from a stable per-instance identity, NOT a setup-local `++n`. The idiomatic platform fix is `view-transition-name` ← `useId()` (Vue's SSR-safe unique id — already imported in `dock.js:6` as `P`), optionally overridable by a new public prop `viewTransitionName?: string` so consumers can pin a semantic name. Acceptance: two `<GlassDock>` instances on one page emit two distinct `view-transition-name`s; no duplicate-VT console warning under a route VT capture; the dock geometry-morph survives. This is a glass-ui-owned primitive (consumer holds no lever, inv-16). Per-repo-green-CI-gated (inv-16′).

This is the **only** correct fix. The alternative — fourier wrapping each dock in a parent with its own VT-name — does not help, because the duplicate is on the *child* dock element, not the wrapper; and a fourier `!important` cannot rename a `view-transition-name` that glass-ui sets via an inline style binding keyed off `w`.

## 6. Is e2e the right gate? Is "green-means-green" honestly serviceable?

**Yes, e2e is the right gate, and §3 proves it** — it caught a real broken dock morph that unit/build gates cannot see. The problem is not the gate; it is the **brittleness coupling**: a single shared `expect(consoleErrors).toEqual([])` lets ONE upstream warning red ~13 specs across the whole suite, and the five divergent inline filters mean the suite cannot express "this specific warning is known, tracked, and gated on a named fix" in one place.

inv-27 (green-means-green) is honestly serviceable ONLY if "green" can distinguish a NEW app fault from a NAMED, kill-dated, upstream-owned warning. Today it cannot — so the suite has been red since before this session (`26831216131`) and stays red, which is the **exact inv-27 corrosion** the invariant exists to prevent: a perpetually-red suite trains the team to ignore red. A red that never goes green is as useless as a green that lies.

## 7. Whitelist-with-kill-date — legitimate bridge or forbidden workaround?

**Legitimate bridge, under three binding conditions** — and it is materially different from a `!important` workaround:

1. A `!important` workaround would *hide the real defect in production* (force a CSS override masking the broken morph). A scoped probe-allowlist does NOT touch app behavior — the dock morph stays honestly broken until glass-ui fixes it; only the *test assertion* tolerates the one NAMED string. The product is not lied to; only the gate is told "this specific known thing is tracked elsewhere."
2. The repo already does exactly this for 401/404/412/429 (`visualization-crud.spec.ts:448-459`). Whitelisting `Unexpected duplicate view-transition-name: glass-dock-1` is the same class of act, not a new sin.
3. It MUST be (a) an **exact-string** match (not a substring like `view-transition` that would also swallow a future fourier-introduced VT bug), (b) tied to the `glass-ui-dock-vt-name` ADOPTION-ASK with a **kill-date = the glass-ui 3.2.0 adoption commit**, and (c) **self-deleting**: a satisfaction assertion that FAILS once glass-ui ships the fix (so the allowlist cannot outlive its cause). Without (c) it degenerates into a perpetual punt — the thing J's §7 chronic gate forbids.

The honest distinction: a workaround changes the *product* to make a test pass; this bridge changes the *test's knowledge of a tracked external defect* and is engineered to expire. That is the inv-15 "name-it-don't-bury-it" discipline applied to the gate itself.

## 8. Terminal disposition

**The e2e gate: KEEP — it is load-bearing and correct (it caught a real prod morph regression). Do NOT weaken it.**

**The chronic, two-part terminal verdict (next tranche, design-only):**

- **Part A — `glass-ui-dock-vt-name` ADOPTION-ASK → BOOK-with-kill-date.** Author it into `ADOPTION-ASKS.md §7` (it is absent today — the booking gap). Owner glass-ui; gate glass-ui 3.2.0; kill-date = the glass-ui-3.2.0 adoption commit in fourier. Exact spec per §5. This is the *real* fix; no fourier-local code change ships.
- **Part B — the e2e-gate bridge → SHIP-as-wave (W6 instrumented-gate consolidation).** W6 already exists to discharge the e2e/axe inv-27 proof (`J.md:69`, WC §F `:304`). Fold THREE things into it, design-only:
  1. **Consolidate** the five divergent inline console filters (§4) into the one `instrument()` helper (lift it to `web/e2e/_probes.ts`); kill the four hand-rolled copies (NO-LEGACY / DRY).
  2. Add an **exact-string, kill-dated** allow-entry for `Unexpected duplicate view-transition-name: glass-dock-1`, cross-referenced to the `glass-ui-dock-vt-name` ask (§7 conditions).
  3. Add a **self-deleting satisfaction probe**: a test that asserts the workspace+editor state produces NO duplicate-VT warning — `test.fixme`'d/expected-red until glass-ui 3.2.0 lands, then it flips green and the allow-entry is removed in the same adopt commit (the kill-date made executable, mirroring the H.W1 `glass-ui-a11y` `test.fixme` baseline pattern).

**Net:** the suite goes green NOW (bridge), the real fix is owned and kill-dated (glass-ui 3.2.0), and the bridge is structurally incapable of becoming a perpetual punt (the satisfaction probe forces its removal). Zero perpetual punts; inv-27 restored to honesty; inv-16 held (no fourier write to `dock.js`); inv-28 SPA deploy unblocks the moment CI is green.

---

### Cross-cutting notes for the synth

- The dock-VT chronic is the **gating dependency** for inv-28: `deploy-pages.yml` correctly skipped (run `26913966345`, status `skipped`) because CI is red. Discharging this chronic is what lets G/H/I/J's SPA finally deploy of-record.
- This chronic shares glass-ui-3.2.0 as a gate with the *already-booked* `glass-ui-P5-inner-rounding` and the WC §G `asideSide`/`useTextHighlight` asks (`J.md` PROGRESS `:86`). The next tranche should bundle ALL glass-ui-3.2.0 asks into ONE adoption wave so fourier consumes the release once, not piecemeal.
- The setup-local-counter correction (§1) is important for the synth: the fix is `useId()`, not "make the module counter increment correctly" — a module counter would still be order-dependent and SSR-fragile.
