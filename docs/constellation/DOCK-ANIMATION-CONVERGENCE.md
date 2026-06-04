# DOCK-ANIMATION-CONVERGENCE.md — the cross-repo dock + animation + design spec

**What this is.** The single binding specification for the constellation's
dock + animation + design-language convergence — the multi-repo body of work
that spans **keyframes.js** (the spring engine + its shop-window), **glass-ui**
(the dock base + the design system), **slides** (a spring/dock consumer), with
**value.js** booked and **fourier** the hub. It is the *index + the DAG + the
reconciliation verdict*, not a re-spec: each arm's detailed waves live in that
repo's own tranche docs; this manifest names them, binds the order, and records
the per-repo green-CI gate.

**Authored** 2026-06-04 by the orchestration lead under the user's explicit
**"drive all clean siblings"** authorization (the AskUserQuestion of
2026-06-04). This authorization **reverses the H.ε "book all — touch no
sibling" posture FOR THIS SPEC**: the lead now executes the cross-repo arms
directly (inv-16′ execute-mode) on each target's **own clean checkout**, gated
on the target's **own green CI**. value.js is the sole exception — its tree is
DIRTY, so inv-16′'s "never write a mid-flight sibling tree" holds and its arm is
BOOKED, not written.

**Path convention.** `HUB = /Users/mkbabb/Programming/fourier-analysis`. Sibling
repos are absolute under `/Users/mkbabb/Programming/<repo>`.

---

## §1 — Thesis (one convergent finding, independently reached)

keyframes.js **ships the iOS spring** — `SpringProgress` (the analytic SwiftUI
`.spring(response, dampingFraction)` solver), `springTimingFunction` /
`springLinearStops` (which emit the `--spring-*` CSS `linear()` tokens the whole
constellation consumes). The 2026-06-03 keyframes animation audit measured the
constellation's motion and found the engine **dogfooded half-way**: the dock's
most-seen morph plays a non-spring bezier (+27.5% overshoot, no settle) on the
native View-Transition path while the FLIP fallback rides the real spring;
scenes hard-cut; reduced-motion is honored nowhere; slides bundles the
`--spring-*` tokens but transitions with plain CSS.

**glass-ui's tranche-AT, authored independently, reached the SAME verdict** for
the dock: `AT.W1b-dock.md §W6-dock-c` names "the AQ.W6 VT-fork quiet-wrong
motion path — the native VT path runs `--vt-ease` (~+27.5% overshoot, no settle)
while the FLIP fallback runs `--spring-snappy`; an identity morph FEELS
different per engine," and prescribes the exact fix: mint
`--dock-resize-spring: var(--spring-snappy)`, **both paths consume it**, gated by
`proof:dock-motion-parity`. Two repos, two audits, one defect, one fix — the
convergence is the validation.

The constellation does not need a new animation system; it needs to **use the
one it ships**. This spec drives that to completion across every arm: the engine
is dogfooded in its own shop-window (keyframes C), the dock's VT-parity +
verification + a11y + clean-break land at the source (glass-ui AT dock slices),
the slide deck stops hand-rolling CSS motion (slides), and the design language
unforks (keyframes C.W2). The motion principle is SwiftUI's preset table
(`.smooth` 0.5/~0.85, `.snappy` ~0.35/~0.85, `.bouncy` 0.5/~0.7,
`.interactiveSpring` 0.15/0.86 → `response`/`dampingFraction`).

---

## §2 — The arms (per-repo perimeter + disposition)

| Repo | Arm | Tree | Disposition | CI gate |
|---|---|---|---|---|
| **keyframes.js** | tranche **C** W1–W5 (close-honest · design-true · dogfood · engine-residuals · close) | clean (branch `tranche-c-impl`) | **DRIVING** (lead session) | `npm test` + `build:lib` + `proof:boundary` + demo-smoke + occlusion (HARD, both axes) + the C.W1 lighthouse/π/LoAF instruments |
| **glass-ui** | tranche-AT **dock slices** — W6-dock-{a,b,c} + W7-dock-{a,b,c} ONLY (file-disjoint from the blob/WebGL/color waves) | clean | **DRIVE** on branch `at-dock-convergence`, own CI | `proof:strict-templates` + dock a11y/state test + `proof:dock-motion-parity` + overflow grep gates + `proof:doc-consistency` + the AT gate matrix |
| **slides** | **spring-dogfood** — bump `keyframes.js ^2.2.0→^3.x` + `glass-ui ^3.1.0→^3.2.0`; deck transitions → `SpringProgress`/`--spring-*`; reduced-motion honored | **DOUBLE-DRIVEN** (active tranche-E) | **BOOK** — the dogfood landed as one clean commit (`29a781a`, locally green: typecheck + 12/12 vitest + 41 playwright) but slides has its OWN concurrent tranche-E session (dirty tree; `02b950b` stacked on top), so per inv-16′ (no double-driving) the lead BACKED OFF — no PR, no force-push. The slides owner integrates `29a781a`. | (owner's tranche-E CI) |
| **value.js** | dock-consumer alignment + any spring usage + the cascade-vjs caret/lock | **DIRTY** | **BOOK** (inv-16′: no dirty-tree write) — precise asks in §7 | (owner executes on a clean checkout) |
| **fourier** | the master spec (this doc) + the value.js/consumer bookings; fourier's own dock asks are SHIPPED-upstream (3.1.1/3.2.0) — its arm is tranche-J (not dock) | clean (hub) | **AUTHOR** (lead) | n/a (docs-only here; fourier-J has its own gate) |

**The consumer dock-rename / leverage-the-base** (keyframes `TopDock`→`ChromeDock`,
`AnimationMenuBar`→`TransportDock`; the `<Role>Dock` vocabulary;
delete the local `dock/index.ts` re-export; each hand-roll → a thin `<Role>Dock`
slot-filler over the glass-ui base) is **GATED on glass-ui's dock base landing**
and lands as a keyframes-C demo follow-on once unblocked — NOT a glass-ui write.

---

## §3 — The DAG (what runs when)

```
keyframes C:  W1 ─▶ (W2 ∥ W4) ─▶ W3 ─▶ W5            [lead session, independent]
glass-ui AT:  W6-dock-a ─▶ (W6-dock-b ∥ W6-dock-c) ─▶ W7-dock-{a,b,c}   [own CI]
slides:       caret-bump ─▶ deck-spring-dogfood ─▶ reduced-motion        [own CI]
                                   │
consumer-rename (keyframes) ◀──────┘ gated on glass-ui dock base + naming
value.js / fourier:  BOOK (§7) — owner executes
```

- **keyframes C** is fully independent of the others (its dogfood consumes the
  ALREADY-PUBLISHED engine surface it itself ships). It is the lead's primary
  arm and runs continuously.
- **glass-ui AT dock** is independent of keyframes C (glass-ui's `--spring-snappy`
  is already its own `springLinearStops()` output; the dock fix consumes it).
  `W6-dock-a` (`proof:strict-templates`) lands FIRST so the W6/W7 clean breaks
  typecheck-fail on regression (AT.W1b-dock.md §3).
- **slides** depends only on the PUBLISHED keyframes 3.x + glass-ui 3.2.0
  (caret bump) — independent of the in-flight arms.
- **The consumer-rename** is the one cross-arm edge: it consumes glass-ui's dock
  base + the `<Role>Dock` naming convention (§4), so it lands AFTER glass-ui's
  dock slices stabilize.
- The three drivable arms (keyframes/glass-ui/slides) are **repo-disjoint** →
  they parallelize across repos; within each, waves fan out to file-disjoint
  lanes (the established team-lead pattern). The lead bounds total concurrency to
  stay under the workflow rate ceiling.

---

## §4 — Reconciliation verdict (keyframes' dock-forward asks vs glass-ui-AT)

keyframes authored 7 dock-forward waves
(`keyframes.js/docs/tranches/B/asks/glass-ui-dock-forward.md`) + a
convergence/naming plan (`…/glass-ui-dock-convergence.md`). Reconciled against
glass-ui-AT's actual plan (`AT.W1b-dock.md`, the six W0b dock lenses):

| keyframes dock-forward ask | glass-ui-AT coverage | Verdict |
|---|---|---|
| **VT-parity spring** (the headline animation finding) | **W6-dock-c** — `--dock-resize-spring: var(--spring-snappy)`, both paths, `proof:dock-motion-parity` | **CONVERGENT — covered, drive AT.W6-dock-c** |
| binding silent-no-op guard (the "missing touch behavioural test") | **W6-dock-a** — `proof:strict-templates` (whole-library binding guard) | **covered — drive AT.W6-dock-a** |
| a11y contract (rail role, focus-visible, aria) | **W6-dock-b** — vitest a11y/state-machine contract + reka-ui Tabs rail | **covered — drive AT.W6-dock-b** |
| layer-transition de-fork | **W6-dock-c** (the same VT/FLIP de-fork) | **covered** |
| overflow / placement convergence | **W7-dock-a** — 3-prop accretion → one `overflow` enum (clean break) | **covered — drive AT.W7-dock-a** |
| trigger/badge + press/hover refinements | **W7-dock-b** — press canon, glass icon-hover, spring micro-feedback, rail-indicator | **covered — drive AT.W7-dock-b** |
| **WAVE-1 `dock:touch-gate` double-tap (P0)** | `useTouchGate` SHIPS + is tested; AT's 6-lens audit found "no SHIPPED dock bug" | **RESIDUAL — reconcile** (see below) |
| **`<Role>Dock` naming convergence** (ChromeDock/TransportDock/…) | not in AT (it is a *consumer* naming + glass-ui-docs convention) | **RESIDUAL — fold (consumer-side + a glass-ui-docs convention note)** |

**The two residuals — driven, not dropped:**

1. **The touch-gate double-tap.** keyframes' field report (memory
   `project_dock_doubleclick.md`: "glass-ui dock buttons require double-click;
   fix in glass-ui root") asserts a real consumer-observed defect; glass-ui-AT's
   dock audit concluded "no shipped bug." The animation hardening already
   REFUTED keyframes' proposed fix shape (A) and corrected it to **B′** (don't
   `preventDefault` the touchend — let the native compatibility click flow to the
   control + expand on it; no `elementFromPoint`, no synthetic dispatch). The
   AT.W6 dock arm **adds a behavioural touch test** that reproduces the
   collapsed-pill single-tap → expand path (the iOS Now-Playing mini-bar
   contract keyframes' live play button depends on) and proves B′ — turning the
   "no shipped bug" assertion into a *tested* invariant. If the test reproduces
   the double-tap, B′ is the fix; if it cannot, the audit's "no bug" verdict is
   confirmed *by instrument* (inv ε — verified, not asserted).
2. **The `<Role>Dock` vocabulary.** glass-ui ships the base (`GlassDock`); the
   consumers name their instances. The convergence is (a) a glass-ui-docs
   convention note recommending the `<Role>Dock` slot-filler pattern + ONE
   canonical `useDock*` name per folded composable, and (b) the consumer renames
   (keyframes, value.js, fourier) — each consumer-owned. Driven consumer-side in
   keyframes C; booked for value.js/fourier (§7).

No dock-forward ask is dropped: six are covered by AT's own convergent plan
(drive them), two are residuals driven as above.

---

## §5 — Green-CI gates (inv-27: green-means-green, per repo)

Each arm closes only on its OWN repo's green CI run id covering every job. No
cross-repo green claim. The publish leg of EVERY repo (changeset/version → tag →
release) is **user-domain, confirm-first** — identical to the standing A/B/AS
pattern. The lead drives to the green-CI gate and stages the release; the outward
publish runs only on explicit user authorization.

- **keyframes.js** — the library gate (glass-ui-free, `npm test` + `build:lib` +
  `proof:boundary`) + the demo gate (demo-smoke inv γ + occlusion inv δ HARD
  both-axes + the C.W1 lighthouse A11y=100/SEO + π + LoAF instruments).
- **glass-ui** — the AT gate matrix incl. `proof:strict-templates`,
  `proof:dock-motion-parity`, the dock a11y/state vitest, the overflow grep
  gates, `proof:doc-consistency`.
- **slides** — `vue-tsc --noEmit` + `vitest run` + the playwright audit.

---

## §6 — inv attestations

- **inv-16′ — execute-mode, named + ledgered.** This spec authorizes the lead to
  WRITE three sibling repos (keyframes/glass-ui/slides) on their own clean
  checkouts, gated on their own CI. Each is named here. The reversal of H.ε is
  scoped to THIS dock+animation convergence and explicitly user-authorized.
- **inv-16 — value.js held.** value.js's tree is dirty; it is BOOKED (§7), never
  written. The cascade-vjs / dock-consumer asks are the value.js maintainer's to
  execute on a clean checkout.
- **inv-26 — one contract source.** This spec lives once, in the hub; consumers
  read it. The per-repo waves are the executable detail, not duplicated here.
- **Authoring boundary.** This doc edited `fourier-analysis/docs/constellation/`
  only (fourier owns it). The sibling writes happen on each sibling's own branch,
  attested per-repo at each arm's commit.

---

## §7 — Bookings (owner-executed, not written this campaign)

- **value.js** (dirty tree): the dock-consumer alignment (adopt the `<Role>Dock`
  convention once glass-ui ships the docs note) + any deck/spring dogfood + the
  **cascade-vjs** caret/lock fix (`ADOPTION-ASKS.md` row). BOOK — value.js
  reconciles its tree first, then executes on a clean checkout.
- **fourier** (own arm = tranche-J): the dock asks are SHIPPED-upstream
  (`glass-ui-dock-vt-name` useId fix in 3.1.1; `glass-ui-a11y` inert in 3.1.1;
  `asideSide` in 3.2.0) → fourier's only act is the `^3.2.0` ADOPT-NOW bump in
  its own arm. No dock write needed.
- **glass-ui AT/3.3.0 self-booked** A-1 (inter-row divider opt-in) + A-2
  (label/sub → ladder token) remain glass-ui's own AT/3.3.0 items — not part of
  the dock slices this campaign drives.

---

## §8 — Provenance

- keyframes animation audit:
  `/Users/mkbabb/Programming/keyframes.js/docs/tranches/C/audit/animation/SUMMARY.md`
- keyframes dock-forward + convergence asks:
  `/Users/mkbabb/Programming/keyframes.js/docs/tranches/B/asks/glass-ui-dock-{forward,convergence}.md`
- glass-ui AT dock plan:
  `/Users/mkbabb/Programming/glass-ui/docs/tranches/AT/design/AT.W1b-dock.md`
- the cross-repo ledger this binds to:
  `HUB/docs/constellation/ADOPTION-ASKS.md`

End of DOCK-ANIMATION-CONVERGENCE.md.
