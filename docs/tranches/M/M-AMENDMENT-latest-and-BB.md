# M — AMENDMENT: landing-is-the-paper · all-packages-latest · glass-ui-BB-is-the-upstream

**USER-DIRECTED 2026-06-16 (post-authoring; folds into `M.md`).** Three directives, verbatim intent:
1. *"the landing page IS the paper."* — resolves the `M.md §4.1` open decision.
2. *"We must use the latest version of all packages, including glass-ui &c."* — widens `M.md §4` M.W1 from the three constellation siblings to the WHOLE dependency tree at latest.
3. *"glass-ui's tranche BB is to be executed."* — names the active glass-ui upstream; fourier-M's glass-ui target becomes BB's `4.1.0` output, M's asks route to BB, and M consumes BB's cross-repo primitives.

This amendment supersedes the `4.0.0`/`4.2.0`/`0.12.0` version prose in `M.md §0/§4/§5` and `M-bump-migration.md §1` where it conflicts; the authored records stand, re-grounded here (the inv-32 discipline, applied to M itself one day after authoring — the version frontier moved).

---

## §1 — The landing IS the paper (`M.md §4.1` RESOLVED → option (a))

The `/` route's redirect-to-`/paper` is **intentional, not a defect to route around**: the PaperView title page IS the product's front door. The §4.1 decision is **resolved to option (a)** — M grafts the contained mathematical hero (the epicycle/convergence band, Fraunces display title, the OKLCH section palette, the keyframes-spring entrance) onto the **PaperView header IN PLACE**; **no dedicated `/` landing route is added**, and the redirect logic is untouched. B1-01's "front door is a greyscale document, not a hero" is discharged by enriching the paper title page itself, not by relocating it. M.W10's "home/landing hero" is therefore unambiguously the **paper hero** (it merges with the M.W6 paper-hero typography + the M.W9 hero entrance — one surface, dressed once). The open decision in `PROGRESS.md` is closed.

## §2 — All packages to latest (the corrected M.W1 scope)

M.W1 bumps the WHOLE tree to latest, not just the three siblings — inv-32 (version-currency) now governs every dependency, not only constellation peers. The frontier moved past the authored targets: keyframes is **4.3.0** (not 4.2.0), value.js is **0.13.0** (not 0.12.0), and "all packages" pulls **five more majors** across the framework stack. The breaking surface is correspondingly larger and the M.W1 MIGRATION sweep widens to match.

| Package | Current pin | Latest | Bump | Note |
|---|---|---|---|---|
| `@mkbabb/glass-ui` | `^3.1.0` | **4.1.0** (BB target) | **MAJOR, BB-GATED** | ships at glass-ui BB close (§3); NOT 4.0.0 |
| `@mkbabb/keyframes.js` | `^2.2.0` | **4.3.0** | **TWO majors** | the light tier (`RAFPlayback`/`NumericAnimation`/`Sequence`) — value.js-free, direct dep |
| `@mkbabb/value.js` | `^0.10.0` | **0.13.0** | minor×3 | **`sampleColorRamp` SHIPS at 0.13** (`mix.ts:83`) — the M.W7 interim-risk dissolves |
| `@mkbabb/latex-paper` | `^0.2.1` | 0.2.1 | current | the paper renderer (the landing, §1) — already latest |
| `@mkbabb/pencil-boil` | `latest` | 0.4.1 | pin it | glass-ui BB found it "an optional peer STATICALLY imported, masked by sibling node_modules" — fourier must pin + verify the import is not a build blocker (the exact masked-build-blocker class) |
| `vite` | `^7.0` | **8.0.16** | **MAJOR** | vite 8 — re-verify the plugin-vue + tailwind/postcss pipeline |
| `vue-tsc` | `^2.0` | **3.3.5** | **MAJOR** | vue-tsc 3 — the typecheck gate; re-verify `vue-tsc -b` |
| `vue-router` | `^4.5` | **5.1.0** | **MAJOR** | vue-router 5 — touches the router (incl. the `/`→`/paper` redirect, §1) |
| `pinia` | `^2.3` | **3.0.4** | **MAJOR** | pinia 3 — touches every store (`gallery`, `animation` — the motion-CORE STATE atom at M.W9) |
| `lucide-vue-next` | `latest` | **1.0.0** | **MAJOR** | lucide 1.0 — icon API; pin it |
| `katex` | `^0.16` | **0.17.0** | minor | the math renderer (the paper hero + ladder, M.W6) |
| `@vueuse/core` | `^14.0` | 14.3.0 | caret | covered |
| `reka-ui` | `^2.0` | 2.9.10 | caret | glass-ui's headless base; covered |
| `tailwindcss` / `@tailwindcss/postcss` | `^4.1` | 4.3.1 | caret | covered |
| `@playwright/test` / `@axe-core/playwright` | `^1.58`/`^4.10` | 1.61 / 4.11 | caret | the e2e + axe gates (M.W11) |
| (cva, clsx, tailwind-merge, @types/node, @vitejs/plugin-vue, tw-animate-css, vue) | various | latest | caret | covered |

**The framework-major surface is the new load-bearing risk** (beyond the glass-ui/keyframes ones M.md §11 already names): vite 8 (build pipeline), vue-tsc 3 (the typecheck gate that every wave's green-CI cites), vue-router 5 (routing + the redirect), pinia 3 (every store, including the M.W9 motion STATE atom), lucide 1.0 (icons). M.W1's discipline holds — a full MIGRATION sweep + a cited green CI run (inv-27), not a blind bump — but the sweep now spans the framework stack, and the M.W1 row must run `vue-tsc 3` + `vite 8 build` + the e2e suite green before the bump lands. Sequencing: the non-glass-ui majors (keyframes/value.js/vite/vue-tsc/vue-router/pinia/lucide/katex) can stage as one atomic changeset NOW (all published); the glass-ui `^4.1.0` leg is **BB-gated** (§3) and lands when BB publishes — so M.W1 may split into **W1a** (all-packages-except-glass-ui, ungated) → **W1b** (the glass-ui `^4.1.0` leg, on BB publish), or wait for BB and do W1 atomically. W1a greens nothing at the dock-VT source (that needs glass-ui ≥3.1.1, which 4.1.0 carries), so the e2e-green close-gate still waits on W1b.

## §3 — glass-ui BB is the active upstream (the routing + the consumed primitives)

`glass-ui/docs/tranches/BB/` is the active glass-ui successor (branch `tranche/BB`, **64 waves**: Integrity · Performance · Consolidation + the cross-repo PRIMITIVES band + the liquid-glass + deep-SOTA + WebGPU-viz bands). **Version strategy (USER-DECIDED 2026-06-16, `BB.md §4`): fold all → ONE `4.1.0` cut at the BB close; NO interim `4.0.1`; master CI stays RED until the BB close.** So:

- **fourier-M's glass-ui target is `^4.1.0` (BB's output), GATED on glass-ui BB close + publish.** This is a NEW cross-repo dependency edge — the first hard upstream gate M carries: `M.W1b (glass-ui ^4.1.0) ← glass-ui BB publishes 4.1.0`. inv-32 records it with the re-verification (`npm view @mkbabb/glass-ui version` ≥ 4.1.0) as the real check, not a stale gate-prose.
- **glass-ui BB is executed by the glass-ui arm, NOT by fourier** (inv-16 — fourier writes only `fourier-analysis/**` + `deploy/**`; BB is a 64-wave glass-ui tranche with its own `EXECUTION-DAG.md` + orchestration, the RUN-BOARD S2 lineage). fourier's role is CONSUMER: it books its asks in its OWN `ADOPTION-ASKS.md` and the cross-repo handoff into BB's `W-CROSSREPO-ASKS` / `coordination/cross-repo-inbound.md` is glass-ui-side. (fourier is NOT yet in BB's `cross-repo-inbound` — the handoff is a glass-ui-arm intake, surfaced to the user.)
- **M's booked asks route to glass-ui BB's `W-CROSSREPO-ASKS` band** (`BB-AMENDMENT-crossrepo.md`) — the same band that drives the speedtest AW v2.1 + slides primitives. fourier's 10 asks (`ADOPTION-ASKS.md §11`) are the fourier-side intake for that band; BB decides build/meet/retire per its no-re-book discipline.

**BB primitives fourier CONSUMES (de-dup — these are already in BB's scope; M consumes, does NOT re-ask):**

| BB wave | What it ships | fourier-M consumer |
|---|---|---|
| `W-LIQUIDHOVER` | the tier-root specular auto-arm (`--mouse-x/y` auto-written; `useSpecularTracking` already ships) | **STRIKES the M `useSpecular` ask** — M.W5 consumes the auto-arm for the BAND-1-over-canvas catch-light (zero per-consumer wiring) |
| `W-PAPER-GRID-TEXTURE` | a `--paper-grid-texture` peer so document-register cards opt their interior into the math/grid line-field | M.W7 math/grid chrome + the **paper** (the landing, §1) opts the reader ground into the brand grid |
| `W-BORDER-PROGRESS` | progress painted as the element BORDER (masked conic ring, value.js OKLCH fill, `coverage` prop) | M.W6/B6-06 — the paper reading-progress indicator (today a 2px primary-only bar) consumes it |
| `W-ON-GLASS-FG` | a muted-foreground register whose contrast target is the composited GLASS FILL (+ `--input-on-glass`) | M.W5 — fourier's BAND-1 glass over the bright math canvas needs exactly this contrast register |
| `W-SCROLL-CARD` | the compositor-safe scroll-shrink card family (CLS-fixed) | M.W9/W10 — the gallery cards + the paper scroll surfaces |
| value.js peer-range (`W-PEER-SPINE`) | glass-ui 4.1.0 admits value.js `^0.12/^0.13` + the kf `^4` floor | M's single-copy lock aligns at glass-ui 4.1.0 + keyframes 4.3 + value.js 0.13 |

**Still genuinely net-new (NOT in BB's named scope — these stay fourier→BB asks, `ADOPTION-ASKS.md §11`):** `glass-ui-accent-tone`, `glass-ui-atomdiff-viewer`, `glass-ui-configuratorlayer-actions-slot`, `glass-ui-dockiconbutton-active`, `glass-ui-splitchars`, `glass-ui-canvas-anchored-overlay`, `glass-ui-scroll-reveal-once`, `glass-ui-convergence-reveal-preset`, `glass-ui-tier-staleness-gate`, `glass-ui-viz-amber-rebaseline`. These are the fourier intake for BB's `W-CROSSREPO-ASKS`; whether BB builds/meets/retires each is BB's call (M consumes whatever lands at 4.1.0; anything deferred rides a later glass-ui cut with a kill-date, never a fourier `!important` workaround).

## §4 — Dissolved risks + confirmed corrections

- **M.md §11 risk #6 (sampleColorRamp not published) — DISSOLVED.** value.js 0.13.0 ships `sampleColorRamp` (`value.js/src/units/color/mix.ts:83`, exported `index.ts:158`). M.W7 uses it directly for the icon-rainbow OKLCH N-stop ramp; the `mixColorsN` interim + the kill-date booking are struck.
- **`useSpecular` ask — STRIKES to W-LIQUIDHOVER** (§3) — `useSpecularTracking` ships and BB's `W-LIQUIDHOVER` completes the tier-root auto-arm; M consumes, does not ask.
- **`useTextHighlight` path — `/motion-core`** (source-verified; `ADOPTION-ASKS §11`) — unchanged by this amendment, reaffirmed.
- **pencil-boil static-import (NEW watch)** — glass-ui BB hit a build blocker where `@mkbabb/pencil-boil` (an optional peer) was statically imported and masked by sibling `node_modules`. fourier pins `@mkbabb/pencil-boil` (currently `latest`) to `0.4.1` and verifies its import path is not a fourier build blocker under the same masked-by-siblings condition (the M.W1 sweep checks it).

## §5 — The updated dependency edge + sequencing (inv-32)

```
glass-ui BB (64 waves, the glass-ui arm)  ──publishes 4.1.0──▶  fourier-M.W1b (glass-ui ^4.1.0 leg)  ──▶ greens e2e at source + the design/motion consume
fourier-M.W1a (keyframes 4.3 / value.js 0.13 / vite 8 / vue-tsc 3 / vue-router 5 / pinia 3 / lucide 1 / katex 0.17)  ── ungated, all published ──▶ can stage NOW
```

The all-packages bump splits along the BB gate: **W1a** (everything published today) stages as one atomic changeset on M's own clean tree; **W1b** (the glass-ui `^4.1.0` leg) lands when BB publishes — and only W1b carries the e2e-green-at-source unblock (dock-VT `useId`, which 4.1.0 carries), so M's e2e close-gate + the J consumer-wire (M.W10) wait on BB. inv-32's re-verification check for the gate is `npm view @mkbabb/glass-ui version ≥ 4.1.0`, run at M.W1b's open — not a stale gate-prose.

## §6 — inv-16 attestation

This amendment authored `fourier-analysis/docs/**` only; READ glass-ui's `tranches/BB/**` (read-only, inv-16) to ground the version target + the consumed primitives + the routing band; edited NO glass-ui tree, NO sibling source, NO host state, NO `package.json` (the bump is M.W1 execution, not authoring). Every glass-ui-BB claim cites BB's own committed artifact (`BB.md §4` version strategy, `BB-AMENDMENT-crossrepo.md` the PRIMITIVES band, `BB.md §1` the wave-set; branch `tranche/BB` HEAD `d75193db`). glass-ui BB execution is the glass-ui arm's domain; fourier-M is its consumer. Provenance: the live `npm view` sweep + the glass-ui BB read, 2026-06-16.
