# slides-F ↔ glass-ui ↔ keyframes — the coupling map

The glass-ui/slides session runs BOTH the new glass-ui tranche AND slides-F. This
file pins the three-way edges so the glass-ui tranche knows which items slides-F
*needs* (→ PRIORITY), what keyframes surface slides-F consumes (the spring leg),
and the slides deploy gate the RUN-BOARD must encode. Verified at audit against
live source — not the F plan's narration.

**Pins at audit** — slides `6a79d38` (`deck/feedback-coder`), glass-ui `8e4cb9f`
(`at-dock-convergence`), keyframes spring surface on `index.ts`. slides
`package.json` declares `@mkbabb/glass-ui: ^3.2.0` + `@mkbabb/keyframes.js: ^3.0.0`.

---

## § 0 — The standing truth: slides writes ZERO glass-ui

slides-F's nine slides waves (F.W0–W9) are file-disjoint from glass-ui and ship
first off `main`. Every glass-ui item slides-F wants is a COORDINATION SPEC the
glass-ui session owns. inv-16 holds: the slides arm and the glass-ui arm never
co-write. So the new glass-ui tranche is the *supply side* of the F coordination
contract — F's `FG.W-*` specs are its demand signal.

---

## § 1 — What slides-F NEEDS from glass-ui (→ PRIORITY items)

slides imports glass-ui at exactly nine subpaths across five files (verified, not
the leverage table):

| File | Subpath imports |
|---|---|
| `styles/index.css` | `@mkbabb/glass-ui/styles` + `@source .../dist` |
| `views/HomeView.vue` | `controls` (DarkModeToggle) |
| `deck/DeckView.vue` | `dock` (GlassDock, DockIconButton) · `button` (Button) |
| `deck/DeckSettings.vue` | `popover` · `separator` · `controls` · `dock` (DockIconButton) |
| `deck/DeckGate.vue` | `dialog` (Dialog, DialogContent, DialogTitle, DialogDescription) · `button` · `forms` (Input) |

The dock vocabulary slides consumes is **`GlassDock` + `DockIconButton` + the
`#collapsed` slot** (`position="inline" density="comfortable" start-collapsed
:collapse-delay` + `keepOpen()/release()` via `dockRef`). There is **no `<Role>Dock`
component in glass-ui** — that vocabulary does not exist on-branch; the dock base IS
`GlassDock` with its two-layer collapse (`#collapsed` summary ↔ expanded children).
If the new tranche intends a role-typed dock surface, it is a NET-NEW contract, not
an extant one slides already binds — treat as BOOK unless a 2nd consumer appears.

### The PRIORITY ladder (most-valuable-first for the user's live deck)

1. **FG.W-dockanim — the dock opacity-lockstep fix [P0, HEADLINE].** This is the
   single most valuable glass-ui item for perceived quality (the user's
   "not iOS-smooth" report, V02). **Verified on-branch state at `8e4cb9f`:**
   - AT.W6-dock-c SHIPPED the VT-curve half — `view-transition.css:61` runs
     `var(--dock-resize-spring, var(--spring-snappy))`, and `dock.css:26` defines
     `--dock-motion-resize: var(--duration-normal) var(--dock-resize-spring)`. The
     `--vt-ease` overshoot (Problem 1/3) is GONE.
   - **The opacity-desync half is STILL PENDING** — `dock.css:418` and `:436` still
     read `opacity var(--dock-motion-fast)` (0.2s) on `.dock-layer` /
     `.dock-layer-item-host`, while the container morphs at `--dock-motion-resize`
     (0.3s). The 100ms-apart settle (Problem 2, the STRUCTURAL desync) is **un-fixed
     on-branch.** This is a deferred item the new glass-ui tranche MUST fold.
   - **Fold-target:** swap `.dock-layer{,−item-host}` opacity to
     `--dock-motion-resize` and extend the matched `visibility` delay (`0s linear
     var(--duration-fast)` → `var(--duration-normal)`), per V02 Fix-2 Option A.
     File-disjoint from blob/WebGL/color. **Gate:** items + container settle within
     one frame of each other (a playwright timing probe, not a screenshot).
     This is AT-OWNED territory — it ships in glass-ui's dock files, slides only
     bumps the pin.

2. **FG.W-dialog — `DialogContent showClose?: boolean = true` [P1].** Retires the
   slides `.deck-gate .absolute.right-4.top-4` close-hide HACK (F-01) — a
   Tailwind-utility coupling that breaks if glass-ui re-lays-out DialogContent.
   DeckGate is consumer #1 (it suppresses the close-X for a non-dismissable gate);
   #2 = any wizard/confirm. **AT-clobber: MEDIUM** — AT-era DialogContent-adjacent
   chrome (the `variant`/`spring` axes) means DialogContent.vue must NOT be opened
   concurrently; strictly after the dock close, or with a coordinated insertion
   point. Default `true` keeps it non-breaking.

3. **FG.W-deck — the `/deck` subpath lift [P1, 5th carry, THE library headline].**
   slides self-documents the lift in-source: `useDeck.ts`, `DeckPager.vue`,
   `DeckSlide.vue`, `deckKeys.ts` each name `@mkbabb/glass-ui/deck` as the eventual
   home. The lift is git-mv + `--deck-pager-accent` neutralization + the neutral CSS
   slice — NOT a rewrite. **The sole blocker is the ≥2-consumer gate**, deferred
   A→E (now the 5th carry). The new glass-ui tranche must resolve it decisively:
   ratify slides' `_fixture/` deck as consumer #2 if it exercises
   `useDeck`+`handleDeckKey`+`DeckSlide` non-trivially, else commit a glass-ui demo
   `<Deck>` story (the demo-story-as-#2 precedent). File-disjoint from AT — zero
   clobber. **Do not carry a 6th time.**

4. **FG.W-card-badge — Card `surface="cartoon"` dark-arm + Badge `variant="accent"`
   [P1, each needs #2].** Card gains the dark-scheme stamp shadow + `--cartoon-stamp-x/y`
   direction token (deck keeps its lower-right 7×7 stamp as identity; glass-ui ships
   the upper-left neutral default). Badge gains `--badge-accent`/`--badge-accent-fg`
   mirroring `--success`/`--success-foreground` (deck overrides to `--ncsu-red`).
   Each needs a confirmed #2 (speedtest/value.js witness). File-disjoint, LOW risk.

5. **FG.W-motion — `useCountup` + `v-reveal`/`slideReveal` [P1, AT-DISJOINT].**
   Lift slides' two editorial-motion primitives to `composables/motion/`
   (`useCountup`) + `slideReveal.ts` + `reveal.css` (gated under
   `[data-reveal-gate]`). The figure VALUES stay slides-editorial; the MECHANISM is
   general. #2 = a motion demo story. **Schedulable NOW** — file-disjoint from the
   entire dock/blob/WebGL/color graph (the one glass-ui item not pin-gated).

**The version hinge:** items 2–4 unlock for slides only after the glass-ui tranche
**publishes a new minor** (F's specs say "3.3.0", but the new tranche owns the
SemVer — what matters is the published contract). slides then bumps
`^3.2.0 → ^<new>` and consumes. The one perceptual delta slides perceives on the
bump is `--scale-press-dock` 0.92→0.96 (befitting the compact summary pill) — but
this is an ALREADY-LANDED unpublished-delta token, NOT pending work: it shipped at
HEAD `8e4cb9f` (AT.W7-dock-b, `tokens.css:1004 = var(--scale-press) = 0.96`).
Published 3.2.0 (tag at `9031972`, an ancestor of HEAD) still carries 0.92, so
slides at published `^3.2.0`=0.92 receives 0.96 only when AU publishes the new
minor — the PUBLISH delivers an already-landed token, it is not an AU.W8
deliverable. slides uses no `wrap`/`overflow` dock prop, so AT's `overflow` enum
clean-break is a no-op migration for slides (zero breakage).

---

## § 2 — What keyframes surface slides-F CONSUMES (the spring leg)

slides dogfoods keyframes for ALL deck motion via a single seam: **`src/deck/deckSpring.ts`**.

- **Consumed exports (lazy `import("@mkbabb/keyframes.js")`):** `springLinearStops`
  + `springTimingFunction`. Both verified live in keyframes
  `src/animation/index.ts` (`springLinearStops.ts:46`, `springTimingFunction.ts:65`),
  alongside the `SpringProgress` class (`spring.ts:82`) — which slides does **NOT**
  consume (it uses the two pure-function spring helpers, not the stateful
  `SpringProgress` driver).
- **The one preset:** `DECK_SPRING = { response: 0.5, dampingFraction: 0.85 }` —
  SwiftUI `.smooth`. The SAME `springLinearStops()` family as glass-ui's `--spring-*`
  tokens, so the deck inherits the constellation's iOS curve rather than forking a
  third easing vocabulary.
- **Two faces of the one curve:**
  1. `installDeckSpring()` emits the CSS `linear()` and pins it to **`--spring-deck`**
     on `:root`. deck.css §3 (`deck.css:135` default `--spring-deck: var(--ease-out)`;
     `:233` consumes it in the slide-to-slide transition).
  2. `deckEase.fn` is the callable `TimingFunction` for the count-up rAF loop in
     `useDeckNav` (swapped in-place once the engine chunk resolves; CSS/cubic
     fallback if it fails).
- **Degradation contract:** lazy dynamic import → the spring never blocks first
  paint; a failed chunk keeps the monotone cubic-out fallback. No-op off-DOM
  (SSR/export tooling) and idempotent.

**Coupling note for the keyframes side:** the `--spring-deck` token slides pins is a
slides-LOCAL custom property (presets-in-consumer), NOT a glass-ui token — slides
generates its own `linear()` from keyframes' `springLinearStops()`. The keyframes
contract slides depends on is therefore narrow + stable: the two spring-helper
signatures (`{response, dampingFraction}` → CSS `linear()` string / `(t)→position`
fn). **Any keyframes change to those two signatures is a slides-breaking edge** —
the RUN-BOARD should treat the keyframes spring-helper surface as a frozen contract
for the duration of this run. `@mkbabb/keyframes.js: ^3.0.0` is the pin; no bump is
implied by the F plan (the spring helpers are stable on 3.x).

---

## § 3 — The slides deploy/CI shape (the slides-deploy gate)

slides does **NOT** use gh-pages. It ships to **Cloudflare Pages** (default host
`slides.friday.institute`), green-CI-gated, mirroring the constellation pattern.

### CI (`.github/workflows/ci.yml`)
- Trigger: push + PR to `main`, plus `workflow_dispatch`.
- One job `build`: `npm ci` → `npx vue-tsc --noEmit` (typecheck) → `npx vite build`.
- `concurrency` cancel-in-progress; `permissions: contents: read`. SPA shape — no
  library/backend jobs.

### Deploy (`.github/workflows/deploy-pages.yml`)
- Trigger: `workflow_run` on **CI completion** — ships ONLY when the same-SHA CI run
  is GREEN on `main` (`conclusion == 'success' && head_branch == 'main' && event ==
  'push'`), plus manual `workflow_dispatch`. **A red CI never reaches deploy.**
- Job: `npm ci` → `bash scripts/pages-deploy.sh`.
- Secrets (GH Actions repo secrets, same CF account as speedtest.friday.institute):
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_TIL_ACCESS_KEY` (the
  soft-gate key compiled into the bundle — friendly friction, not a secret),
  `CHROME: google-chrome` (the runner's pre-installed Chrome for best-effort PPTX
  export in `pages-deploy.sh` step 3b).
- Local path: `npm run deploy` → `scripts/deploy.sh [domain]` → `pages-deploy.sh` +
  `attach-domain.sh` (configurable domain, defaults to `slides.friday.institute`).

### The slides-deploy gate (for the RUN-BOARD)
> **slides deploys ⟺ slides CI green on `main`.** The slides pin-bump
> (`^3.2.0 → ^<new glass-ui>`) is gated by slides' own `vue-tsc --noEmit` +
> `vite build` + `deck.spec.ts` e2e + the glass-ui-binding-verification sweep
> (stale reka-ui props silently no-op — a version bump is exactly when to sweep).
> **The slides-deploy edge therefore depends on the glass-ui PUBLISH edge**, not the
> glass-ui branch state: slides cannot consume FG.W-dialog/-deck/-card-badge until
> the new glass-ui minor is on npm.

---

## § 4 — The constellation RUN-BOARD edges (derived)

| Edge | From | To | Gate | Type |
|---|---|---|---|---|
| E-dockanim | glass-ui dock opacity-lockstep fold | slides pin bump | items+container settle ≤1 frame | AT-owned · PRIORITY P0 |
| E-publish | glass-ui new-minor PUBLISH | slides pin bump | new minor on npm | hard hinge |
| E-dialog | glass-ui `showClose` (post-dock-close) | slides retire close-hack | DialogContent not co-edited w/ dock chrome | MEDIUM clobber |
| E-deck | glass-ui `/deck` lift | slides re-home `src/deck/` as thin wiring | ≥2-consumer RESOLVED (no 6th carry) | file-disjoint |
| E-cardbadge | glass-ui Card-dark + Badge-accent | slides adopt | ≥2 each (speedtest/value.js) | LOW clobber |
| E-motion | glass-ui `useCountup`+`v-reveal` | slides adopt | ≥2 (slides + demo story) | AT-DISJOINT · NOW |
| E-spring | keyframes spring-helper surface | slides deckSpring | signatures frozen | contract-freeze |
| E-deploy | slides CI green on `main` | slides Cloudflare Pages deploy | green CI gates deploy | terminal gate |

**Topology:** keyframes' spring helpers are an UPSTREAM frozen contract (no bump).
The glass-ui new minor is the central HINGE — its publish unlocks four of the five
slides consumptions. FG.W-motion is the one edge schedulable immediately
(AT-disjoint). The dock opacity-lockstep fix is the highest-value glass-ui PRIORITY
and is a still-pending fold (verified un-fixed on-branch at `8e4cb9f`). The
slides-deploy gate is terminal + Cloudflare-Pages-shaped, green-CI-gated — it
depends on the glass-ui publish edge, not the branch state.

## § 5 — One-line falsifiable findings

1. slides imports glass-ui at 9 subpaths / 5 files; dock vocabulary is
   `GlassDock`+`DockIconButton`+`#collapsed` — **no `<Role>Dock` exists** (`grep`
   verifiable). [PASS — verified]
2. The dock VT-curve fix (AT.W6-dock-c) IS on-branch (`view-transition.css:61`); the
   opacity-lockstep fix is NOT (`dock.css:418` still `--dock-motion-fast`). [PASS —
   verified, the fold-target]
3. slides consumes keyframes `springLinearStops`+`springTimingFunction` only (not
   `SpringProgress`); the pin is `^3.0.0`, no bump implied. [PASS — verified
   `deckSpring.ts:55`]
4. slides deploys to Cloudflare Pages via `workflow_run` green-CI gate, NOT
   gh-pages. [PASS — verified `deploy-pages.yml`]
