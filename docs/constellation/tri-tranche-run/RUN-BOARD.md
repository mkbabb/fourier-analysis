# RUN-BOARD — tri-tranche run

The live blackboard. Three sessions read + update it. Each drives its own
tranche(s) to its OWN green CI (inv-27 green-means-green per repo) and updates its
row at every milestone. At a blocked edge a session CIRCLES BACK to gate-free
waves or HEARTBEAT-POLLS the real gate (e.g. `npm view @mkbabb/glass-ui version`
for E1) — it does NOT idle. The cross-session unblocks are USER-DOMAIN
(confirm-first), driven in dependency order: **glass-ui 3.3.0 → {keyframes demo
deploy, slides-F deploy} → feedback-coder hand-off**.

Pins at author: glass-ui published `3.2.0`, branch `at-dock-convergence` @ `8e4cb9f`
(3.2.0 unpublished delta) · keyframes published `3.0.0`, branch `tranche-d-dev` ·
slides `6a79d38` (`@mkbabb/glass-ui ^3.2.0`, `@mkbabb/keyframes.js ^3.0.0`) ·
feedback-coder branch `tranche-l`.

---

## 1 — SESSION TABLE

| # | Session | Tranche(s) | Current wave | Status | Last-updated |
|---|---|---|---|---|---|
| **S1** | keyframes-D | keyframes D | D.W1–W4 GREEN+committed+REVIEW-HARDENED · W6 changeset cut · W5+close gated on E1 | **GREEN-CI (gate-free waves)** — branch `tranche-d-impl`: W4 engine [a0303fe], W1+W2+W3 demo [905a8c3], D changeset [8ff893f], + adversarial-review hardening [0063553] (a 5-agent read-only review found 13 real drifts the gates missed — a rAF-gate scrub-stale regression, a Tab-char drift, a nextFrame re-entrancy hang, leaf-tail casing/size over-migration — all fixed). 335 tests · tsc 0 · demo builds · all 7 proof gates PASS. REMAINING: W5 (dock+mask+occlusion+pin→^3.3.0) + W6 FINAL — HARD-gated on **E1 (glass-ui 3.3.0 on npm)**; heartbeat-polling. Publish leg (B+C+D) user-domain, owner Mike Babb | 2026-06-05 |
| **S2** | glass-ui + slides | glass-ui AU · slides F | AU.W0–W6 DONE (keystone+correctness+Fraunces+/color leaf+**useWebGLCanvas substrate**) · slides F.W0–W4 DONE | **IMPL** — AU.W0–W6 green+committed (typecheck 0 · 636 tests · 28 gates; the WebGL substrate now shared by aurora [refactored, −110 LOC] + the consumer-#2 assert, frostShader deleted, the capture-path GPU render verified). User ruled FULL-HEADLINE-then-publish. REMAINING AU.W7 blob trio + OKLCh GLSL + 8-assert CPU-equivalence (the headline, teed up — substrate + /color leaf ready, value.js demo is the lift source) → W8 dock reka-Tabs a11y → W9 lean folds+slides-supply → W10 close+3.3.0. slides F.W5–W9 deferred behind the publish. Publish leg confirm-first | 2026-06-05 |
| **S3** | feedback-coder | feedback-coder L | L.W0 done · L.W1–W5 pending | **LIVE** — on `tranche-l`; ML boundary-tagger (NOT a UI tranche — gate-free; inbox hand-off only) | 2026-06-05 |

Status vocabulary: `DEV-AUTHORED` → `IMPL-Wn` → `GREEN-CI` → `READY-TO-PUBLISH`
→ `PUBLISHED` → `DEPLOYED`. (S3 carries `LIVE` — it self-paces its own ML tranche;
it never enters this publish chain.)

**S3 note (verified against live source):** feedback-coder Tranche L is the
fine-tuned local boundary-tagger build (PyTorch-MPS / HF / DISRPT segmentation) —
`grep -rinE "slides|glass-ui|keyframes"` over `tranches/L/` = **0**. L does NOT
consume the slides framework / glass-ui / keyframes. The brief's "new set of
slides" framing does not match HEAD — L is NLP/ML, gate-free from the UI publish
chain. S3 gets an **inbox hand-off only** (E3); we NEVER write it.

---

## 2 — DEPENDENCY-EDGE TABLE

Consumer → producer. The published artifact is what crosses the edge. Gate flips
BLOCKED → CLEARED when the artifact lands (the real check, not a narration).

| Edge | Consumer → Producer | Published artifact (the gate) | Real check | State |
|---|---|---|---|---|
| **E1** [ROOT HINGE] | keyframes D.W5 + slides-F (pin bump · dock items · deploy) → **glass-ui AU.W10** | **glass-ui `3.3.0` on npm** | `npm view @mkbabb/glass-ui version` ≥ 3.3.0 | **BLOCKED** (published 3.2.0) |
| **E1b** [circle-back] | keyframes D.W5 role-typed `<Role>Dock` BASE leverage → **glass-ui AU.W8** | a role-typed dock base component (NET-NEW; BOOK until 2nd consumer) | role-typed base ships in glass-ui AND keyframes is its 2nd consumer | **BLOCKED** (base is BOOK; reciprocal — may never fire) |
| **E2** | slides-F deploy (Cloudflare Pages, `slides.friday.institute`, green-CI via `workflow_run`) → **E1** | depends on glass-ui `3.3.0` published (not branch state) | E1 CLEARED + slides CI green on `main` | **BLOCKED** (gates on E1) |
| **E3** [conditional] | feedback-coder L deploy → **E2** | IFF L consumes slides framework / glass-ui / keyframes | — | **RESOLVED-FALSE** — L is ML/NLP, consumes none; **inbox hand-off only** |
| **E-spring** [frozen] | slides-F `deckSpring.ts` → keyframes spring surface | `springLinearStops` + `springTimingFunction` (`^3.0.0`) | signatures unchanged (`{response,dampingFraction}`→`linear()` / `(t)→pos`) | **FROZEN** — no keyframes publish gates slides; any sig change = slides-breaking |

**Notes (reconciled vs live source):**
- E1b does NOT gate keyframes D.W5's local renames (`ChromeDock`/`TransportDock`),
  mask-removal, `dock/index.ts` deletion, or square/mobile occlusion — those gate
  on **E1 only** (the published correctness surface: dock base + touch-gate B′ in
  3.3.0). E1b gates only the reciprocal role-typed BASE component leverage.
- keyframes LIBRARY legs are **GATE-FREE** (`proof:boundary` — the library is
  glass-ui/value-free; heavy engine reaches value.js only via dynamic
  `loadAnimationEngine()`). Only keyframes' DEMO/dock legs (D.W5) gate on E1.
- AU's wave ordering puts the slides-F-blocking + publish-blocking items FIRST:
  **AU.W2** (P0 dock opacity-lockstep) → **AU.W3** (keystone + correctness fold,
  publish-blocking) → … → **AU.W10** (close + stage 3.3.0 changeset). `FG.W-motion`
  (the one AT-disjoint slides edge) is schedulable in any AU wave, pin-free.

---

## 3 — PUBLISH LEDGER (USER-DOMAIN — confirm-first, in dependency order)

The irreversible legs (`npm publish`, release-tag push, production deploy). Agents
stage to READY-TO-PUBLISH (CI green, changesets staged); the user drives each step.

- [ ] **1. glass-ui 3.3.0 → npm** — owner: **S2 (glass-ui)** — the ROOT publish.
  Unblocks E1 → {keyframes demo deploy, slides-F deploy} + value.js K.W3 blob
  rewrite (name-forward). AU.W10 stages the 3.3.0 changeset; user finalizes SemVer
  tier + runs `changeset version` → tag → `release.yml`.
- [ ] **2a. keyframes demo deploy** — owner: **S1 (keyframes)** — gated on (1).
  After 3.3.0 on npm: D.W5 bumps `file:../glass-ui` → `^3.3.0`, CI green, then the
  demo (gh-pages) deploys. keyframes lib changesets (stacked B `3.1.0` + C `major`
  + D `major`) are a SEPARATE user-domain leg, version owner NAMED at D.W6.
- [ ] **2b. slides-F deploy** — owner: **S2 (slides)** — gated on (1).
  After 3.3.0 on npm: slides bumps `^3.2.0 → ^3.3.0`, sweeps stale reka-ui props,
  CI green on `main` → Cloudflare Pages (`slides.friday.institute`) via
  `workflow_run`. Consumes `FG.W-dialog/-deck/-card-badge` post-bump.
- [ ] **3. feedback-coder hand-off** — owner: **S3 (feedback-coder)** — INBOX ONLY.
  E3 resolved-FALSE (L is ML/NLP, no UI consumption). No deploy gate; we deliver an
  inbox hand-off, never a write. (Re-open IFF a future L wave consumes the slides
  framework / glass-ui / keyframes — none does at HEAD.)

Order: **(1) → {(2a), (2b)} → (3)**. (2a)/(2b) are parallel once (1) lands.

---

## 4 — UPDATE PROTOCOL

Terse. Every session edits THIS file at every milestone. House style: C-tranche
terse + em-dashes.

1. **Edit your own row** in §1 at each milestone: advance `current wave`, flip
   `status` along the vocabulary (`DEV-AUTHORED → IMPL-Wn → GREEN-CI →
   READY-TO-PUBLISH → PUBLISHED → DEPLOYED`), stamp `last-updated` (ISO date).
   Touch ONLY your row (inv-16 — you write only your repo).
2. **Flip an edge** in §2 BLOCKED → CLEARED only when the REAL check passes (run
   the literal command — `npm view @mkbabb/glass-ui version` for E1; CI run id +
   `head_branch==main` for E2/E-deploy). Cite the evidence (npm version, green
   run id) in the row. No flip on a narration.
3. **Check a PUBLISH-LEDGER box** in §3 only AFTER the user runs the irreversible
   leg AND the artifact is verified live. The box is the user's confirm-first act;
   a session may stage to READY-TO-PUBLISH and request it, never check it itself.
4. **At a BLOCKED edge:** either (a) CIRCLE BACK — drop to a gate-free wave and
   return, or (b) HEARTBEAT-POLL — wake periodically (ScheduleWakeup `/loop`
   dynamic mode, or CronCreate), re-read this board + re-check the real gate,
   proceed when CLEARED. Never idle on a gate; never bypass confirm-first.
5. **Keep it terse + scannable.** This is a living document, not a log — overwrite
   stale state, don't append narration. The tables ARE the source of truth.
