# M — PROGRESS

**Status**: AUTHORED 2026-06-16 (development only — no implementation ran). Awaits the user's "Begin." Ordering ξ′ (`CANONICAL-ORDERING.md §21`). M is the convergence-and-suffusion tranche; it discharges J (μ′, OPEN) + K-deploy (ν′, AUTHORED) and suffuses the design language + builds the motion CORE — J + K-deploy + M close together at M's close (`M.md §0`, foot-note).

**Substrate**: the 32-agent deep audit `docs/audits/runs/2026-06-16-M-deep-audit/` (303 findings, 32 critical, 82 chronic-flagged, 59 glass-ui asks; `plan-synth.json` + `design-synth.json` merged by the core model; `findings-index.txt` scannable index; `raw-findings.json` full corpus; `{A8-no-legacy-sweep,B1-home-design,B6-paper-design}.md` re-runs).

**Close-gate (PHYSICAL, `M.md §3/§12`)**: observed-green prod (host caught up to HEAD) + a live UI consumer per J endpoint + a single covering green inv-27 CI run + the design language demonstrably shipped. NOT a status claim — artefacts.

---

## Wave ledger

| Wave | Arm | Title | Status | Evidence owed |
|---|---|---|---|---|
| **M.W0** | — | Charter + re-ground sweep + ledger/numbering hygiene | `planned` | `npm view` re-verify (4.0.0/4.2.0/0.12.0); host backlog=44; `glass-wash` vs `glass-quiet` confirmed at `ladder.css`; A-1/A-2/A-3 re-verified at 4.0 source; inv-31/32/33/34 + inv-29-amend in `INVARIANTS.md §1`; `ADOPTION-ASKS` reconciled (C1 struck, value.js peers DONE-in-L flipped); RUN-BOARD 3.2.0/3.3.0 edges re-grounded |
| **M.W1** | B | The all-packages-latest bump (KEYSTONE) | **`executed-partial`** (branch `m/w1-bump-migration`; FINISH owed) | **W1a EXECUTED 2026-06-17** (uncommitted on the branch): glass-ui 4.0.0 + 4 peers `--no-save` · keyframes 4.3.0 · value.js 0.13.0 (**peer-INVALID vs glass-ui 4.0 `^0.10‖^0.11` — repin `^0.11`**) · vite 8 · vue-tsc 3 · vue-router 5 · pinia 3 · lucide 1 · katex 0.17; the UnderlineTabs→SegmentedTabs(`variant="underline"`) + MetricBadge `:amount→:value` + glass-scrubber→standard + DialogContent `surface="opaque"` + glass-subtle/quiet→glass-wash + glass-elevated→glass-floating migration. **FINISH owed (γ residue, `critique-hardening §2`):** the `--slider-scrub-*` retint (7 files, sliders inkless), `vue-tsc --noEmit` gate (TS2882 masked by `-b`), persist the 4 peers, import-path moves, Node-20 Actions v5, DELETE `CanvasOverlayButton`, repin value.js `^0.11`. **W1b (BB-gated):** glass-ui `^4.1.0` + value.js `^0.13` when BB publishes. |
| **M.W2** | A | Deploy spine I — readiness ≠ liveness | `planned` | container HEALTHCHECK + `depends_on: service_healthy`; `create_index` off the lifespan serving path; `/api/health` answers immediately; migrations resume on healthy gate |
| **M.W3** | A | Deploy spine II — fail-closed inv-28 API-arm gate | `planned` | `green_ci_gate()` querying `commits/<sha>/status` before reset; fails-closed without PAT (a red SHA demonstrably blocked); backported to `deploy/templates`; `deploy.sh` advisory gate reconciled |
| **M.W4** | A | Deploy spine III — kill silent-rollback + inv-31 | `planned` | `page()` on all 3 terminal states; verified delivery; backported; inv-31 authored; a known-green SHA flows → **host catches up to HEAD** |
| **M.W5** | B | Glass depth hierarchy + incongruence sweep | `planned` | 3-band ladder frozen + every surface mapped; `.cartoon-card` shim DELETED (22 sites); specular catch-light on BAND 1; C2 incongruences swept |
| **M.W6** | B | Audacious typography — φ-ladder + Fraunces + KaTeX hero | `planned` | `--font-serif` shadow-check; Fraunces activated as `--font-display`; φ-ladder on the paper hero + 7 page heads (gallery + equation gain `h1`); KaTeX ladder member; ℱ sans-clash fixed |
| **M.W7** | B | Colour pops + math/grid chrome from ONE OKLCH source | `planned` | ONE value.js OKLCH ramp; the 4 `spectrumColor` copies + 118-line parser + `STATIC.rainbow` twin DELETED; `--route-accent`; EpicycleSpinner; math-literate grid; ℱ signature |
| **M.W8** | B | Control-pane hierarchy + per-pane composition | `planned` | `.eq-grid`/`.config-grid` → Configurator; `asideSide=left`; `:dividers`; per-pane composition; `inert`/`useTextHighlight`/native-popover adopted |
| **M.W9** | B | Unified mathematical motion architecture (CORE) | `planned` | zero rAF animation call-sites; `useFourierPlayhead` shared; convergence-reveal signature; scroll-driven + VT adopted; 3 PRM gaps closed |
| **M.W10** | A+B | Wire the inv-15 consumer gap + data-model transpose + scroll heroes | `planned` | 7 `api.ts` methods + `/v/:slug` host + diff-viewer/provenance/forks/remix; publish re-pointed onto the verb; phantom version chain DELETED; W2-fix integrity; the home/landing hero (§4.1 user decision) + once-disciplined scroll reveals |
| **M.W11** | join | EVIDENCE — green inv-27 run + measured CWV/INP + axe | `planned` | ONE covering green CI run (remix/publish e2e, un-`fixme`'d keystones, axe, measured CWV/INP, no `set_hash==''`, no console-bridge) |
| **M.W12** | A+B | Tail hygiene + cohort parity + book-with-kill-dates | `planned` | CSP/`fetchLater`; Python parity probe; operator entrypoint; adoption asks 1–7 + `dispatch.sh` re-verified-live with terminal dispositions; L-webmcp re-affirmed |
| **M.W13** | — | Close | `planned` | `FINAL.md` + the J and K-deploy close ledgers cite every artefact; `CANONICAL-ORDERING → ordering ξ′` |

**Dependency arms** (`M.md §4`): Arm A (infra, bump-independent) = W2→W3→W4. Arm B (product, bump-gated) = W1 → {W5,W6,W7,W9 parallel} → W8 (deps W5) → W10 (deps W9+W8). Critical path: **W0 → W1 → W9 → W10 → W11 → W12 → W13**; W2→W3→W4 parallel; arms join at W11.

## Design substrate (authored at W0/W1)

- `design/M-design-language.md` — the glass depth ladder + φ-typography ladder + icon-rainbow OKLCH colour system + math/grid chrome (the §8 suffusion).
- `design/M-motion-architecture.md` — the three-layer architecture + `useFourierPlayhead` + convergence-reveal signature + scroll-driven/View-Transition adoption (the §9 motion CORE).
- `design/M-bump-migration.md` — the multi-major breaking-change migration map (the §4 W1 keystone; the 11 used glass-ui subpaths, the ~25-site surface, the `glass-wash` correction).

## Amendment (2026-06-17) — critique-hardening (`M-AMENDMENT-critique-hardening.md`)

The 32-agent live-critique audit (`docs/audits/runs/2026-06-17-M-critique-audit/`) hardened M against the user's 8 critiques of the bumped instance. **The M plan is RIGHT, the M.W1 bump STANDS, the work is correct-at-root.** Folded: **4 new invariants inv-35..38** (glass-fidelity / geometry-continuity / control-affordance / render-verified-design-gate) + an inv-34 signature-everywhere clause — nothing previously bound *rendered* fidelity, which is how the tree passed migration gates while compositing opaque/square/underline/washed/right-pinned. The 8 critiques: **6 fourier-owned** (β/γ — folded into M.W5 [glass ladder+rounding+focus-ring+menu], M.W7 [contrast-floored idle accent-tone], M.W8 [`asideSide=left` + drop the underline prop → glass-pill default + desktop-tab gating]) and **2 glass-ui-owned** (α — booked to glass-ui BB `W-CROSSREPO-ASKS`: the overlay-band over-darken `ladder.css:200-204`, the absent rounded glass focus-ring; `ADOPTION-ASKS §12`). **Headline correction:** the M.W1 `variant="underline"` was backwards as a design call → reverse to glass pill (M.W8). **M.W1 FINISH residue** booked (slider retint, `vue-tsc --noEmit`, peers, import-paths, Actions). **Binding open decision:** the entire design surface (W5–W9) + value.js 0.13 + the e2e-green close are **W1b-gated on glass-ui BB publishing 4.1.0** — only W0/W1a/W2–W4 proceed now (`critique-hardening §6`).

## Amendment (2026-06-16) — `M-AMENDMENT-latest-and-BB.md`

Three user directives folded post-authoring: (1) **the landing IS the paper** (§4.1 RESOLVED — the hero grafts onto PaperView in place, no `/` route); (2) **all packages to latest** (M.W1 widened — keyframes 4.3.0, value.js 0.13.0 [`sampleColorRamp` shipped], + framework majors vite 8 / vue-tsc 3 / vue-router 5 / pinia 3 / lucide 1.0, katex 0.17); (3) **glass-ui tranche BB is the active upstream** (M's glass-ui target is `^4.1.0`, GATED on glass-ui BB's fold-all close+publish — the first hard upstream edge; M's asks route to BB's `W-CROSSREPO-ASKS`; M consumes BB primitives `W-LIQUIDHOVER`/`W-PAPER-GRID-TEXTURE`/`W-BORDER-PROGRESS`/`W-ON-GLASS-FG`; glass-ui BB executes under the glass-ui arm, inv-16).

## Open decisions (surfaced for the user)

- **§4.1 — the home/landing host**: RESOLVED 2026-06-16 — the landing IS the paper; the hero grafts onto PaperView in place (no `/` route).
- **glass-ui BB execution arm**: glass-ui BB (64 waves → 4.1.0) is the glass-ui arm's domain; M consumes its output. Confirm whether BB has a live execution session or the user wants it driven — M.W1b's glass-ui leg + the e2e-green close-gate wait on BB's publish.
- **The inv-28 PAT** (`§11.3`): operator-owned, unprovisioned; the gate fails-closed without it.
- **The inv-31 sink** (`§11.4`): which watched sink (ntfy/Discord/Slack) — operator decision before `page()`.

## Notes

- Authored docs-only this session; **NOT pushed** (a push re-triggers the deploy webhook — and the chain is the very thing M.W2–W4 repairs; release is the user's call at execution).
- The working tree's in-flight `glass-subtle→glass-quiet` rename is LEFT UNTOUCHED — M.W1 corrects it to `glass-wash` and commits it atop the resolved 4.0 dep (`M.md §11.2`; the rename is incoherent before the bump).
- inv-32 (version-currency) is M's structural answer to the I→J→K book-rot that produced this whole re-ground; future tranches re-verify sibling versions at their own W0.
