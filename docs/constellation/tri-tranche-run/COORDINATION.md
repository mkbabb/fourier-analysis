# tri-tranche-run — COORDINATION

The mechanism by which three autonomous sessions know about each other, gate,
wait, and drive to a fully-deployed end-state. Authored under inv-16 (fourier
owns `docs/constellation/`); this file is the shared **blackboard** — every fact
cites live source, verified at author-time (`npm view @mkbabb/glass-ui version` =
**3.2.0**; glass-ui HEAD `8e4cb9f`; slides `^3.2.0`/`^3.0.0` pins; keyframes pins
`file:../glass-ui` + self `3.0.0`; feedback-coder branch `tranche-l`).

This doc is **state + protocol**, not narration. It pairs with the live
RUN-BOARD (§7) the sessions write at each milestone. Terse, precise, executable.

---

## §1 — The three sessions

| Id | Session | Tranche(s) | Writes (inv-16) | Deploy leg |
|---|---|---|---|---|
| **S1** | keyframes-D (THIS) | keyframes.js `docs/tranches/D/` | **keyframes.js ONLY** | demo → **gh-pages** (`npm run gh-pages`) |
| **S2** | glass-ui/slides | glass-ui **AU** (begotten from `glass-ui-next/CHARTER.md`, formalized into `glass-ui/docs/tranches/AU/` as its W0) **AND** slides **F** (`slides/docs/tranches/F/`) | **glass-ui + slides** | glass-ui → npm; slides → **Cloudflare Pages** (`slides.friday.institute`, `deploy-pages.yml`) |
| **S3** | feedback-coder | feedback-coder `docs/tranches/L/` (branch `tranche-l`, LIVE) | **feedback-coder ONLY** (we NEVER write it) | (see §4 E3 — **inbox hand-off only**) |

S1/S3 are single-repo; S2 is dual-repo and owns the **root publish**.

---

## §2 — The dependency DAG

The constellation splits cleanly into **library legs** (gate-free) and
**demo/deck legs** (gated). Only a leg that consumes a sibling's *published
surface* gates. A library that publishes nothing-downstream-blocking is free.

```
                        ┌──────────────────────────────────────────┐
                        │  glass-ui AU.W10 → PUBLISH @mkbabb/glass-ui 3.3.0  │  ROOT HINGE
                        │  (npm; USER-DOMAIN confirm-first)         │
                        └───────────────┬──────────────────────────┘
                                        │ E1  (npm view ≥ 3.3.0)
                ┌───────────────────────┼────────────────────────────┐
                │                       │                            │
                ▼ E1                    ▼ E1                         ▼ E1b (separate, ↑AU.W8)
   ┌────────────────────────┐  ┌──────────────────────┐   ┌───────────────────────────┐
   │ keyframes D.W5         │  │ slides-F: dock items │   │ keyframes D.W5 <Role>Dock │
   │ demo: ^3.3.0 pin +     │  │ + pin bump ^3.2→^3.3 │   │ BASE-component leverage   │
   │ renames + mask-removal │  └──────────┬───────────┘   │ (BOOK until 2nd consumer) │
   │ + dock/index.ts delete │             │ E2            └───────────────────────────┘
   │ + square occlusion fix │             ▼ (CF Pages, green-CI)
   └───────────┬────────────┘  ┌──────────────────────┐
               │               │ slides-F DEPLOY      │
               ▼ (gh-pages)    │ slides.friday.inst.  │
   ┌────────────────────────┐  └──────────┬───────────┘
   │ keyframes demo DEPLOY  │             │ E3 (CONDITIONAL — NOT WIRED, see §4)
   │ (gh-pages)             │             ▼
   └────────────────────────┘  ┌──────────────────────┐
                               │ feedback-coder slides│  ← inbox hand-off only
                               │ deploy (IF consumes) │
                               └──────────────────────┘

   GATE-FREE (no edge in or out of the publish graph):
   ┌──────────────────────────────────────────────────────────────────────┐
   │ keyframes LIBRARY legs (D.W1 demo-decomp, D.W2 styling, D.W3          │
   │   brittleness, D.W4 engine) — proof:boundary: the library is          │
   │   glass-ui-free + value.js-DOM-free in its hot path. NO sibling pin.  │
   │ slides-F W0–W9 library/deck waves — file-disjoint from glass-ui,      │
   │   ship FIRST off main (inv-16; slides writes ZERO glass-ui).          │
   │ glass-ui AU.W0–W9 — internal; the PUBLISH (W10) is the only edge.     │
   │ keyframes spring surface — FROZEN ^3.0.0 (springLinearStops +         │
   │   springTimingFunction); slides consumes it, but NO keyframes publish │
   │   gates slides (E-spring is a contract-freeze, not a publish edge).   │
   └──────────────────────────────────────────────────────────────────────┘
```

**The split, stated:** glass-ui is the constellation root — it publishes FIRST,
and everyone consumes its published surface. keyframes' **library** is gate-free
(it imports no glass-ui); only keyframes' **demo** (D.W5) gates on E1. slides'
**framework/deck** waves are gate-free; only its **dock items + deploy** gate on
E1/E2. keyframes' spring helpers are an UPSTREAM frozen contract slides consumes
with **no bump** — not a gate.

---

## §3 — Edges in detail

### E1 — ROOT HINGE [glass-ui 3.3.0 publish]

- **From:** glass-ui AU.W10 (stages the 3.3.0 changeset, drives to green CI, the
  confirm-first publish).
- **Gates:** keyframes **D.W5** (the demo's published `^3.3.0` pin) · slides-F
  **dock items** (the four publish-gated consumptions: `FG.W-dialog`,
  `FG.W-deck`, `FG.W-card-badge`, + the `^3.2.0 → ^3.3.0` pin bump) · slides-F
  **deploy** (E2 transitively).
- **Gate-check command (the real gate, not a narration):**
  ```sh
  npm view @mkbabb/glass-ui version   # CLEARS when output ≥ 3.3.0
  ```
  At author-time this returns **3.2.0** → E1 is **OPEN (blocked)**. A scriptable
  form for a poll loop:
  ```sh
  npx semver -r '>=3.3.0' "$(npm view @mkbabb/glass-ui version)" >/dev/null \
    && echo E1-CLEAR || echo E1-BLOCKED
  ```
- **Domain:** the publish itself is **USER-DOMAIN, confirm-first** (irreversible:
  `changeset version` → tag → `release.yml` / `npm publish`). S2 drives glass-ui
  to READY-TO-PUBLISH (CI green, 3.3.0 changeset staged) autonomously; the user
  runs the publish.
- **Consume published-not-branches:** keyframes D.W5 moves its `file:../glass-ui`
  pin to a published `^3.3.0` — it pins the **package on npm**, never the
  `at-dock-convergence` branch. slides bumps `^3.2.0 → ^3.3.0` against npm.

### E1b — CIRCLE-BACK [keyframes `<Role>Dock` BASE-component leverage]

- **From:** glass-ui **AU.W8** (the dock-design headline — ships a role-typed
  base component only IF a 2nd consumer appears; otherwise BOOK).
- **Gates:** ONLY keyframes D.W5's *role-typed-base-component leverage* sub-goal.
- **NOT gated by E1b (gated only by E1):** keyframes D.W5's **local renames**
  (`TopDock`→`ChromeDock`, `AnimationMenuBar`→`TransportDock` — adopting the AU.W8
  docs role-*vocabulary*, each still composing the published primitives
  `GlassDock`/`DockLayer`/`DockLayerGroup`/`DockIconButton`/`DockSelectTrigger`),
  the **mask-removal** (`always-expanded="isMobile"` double-tap mask), the
  **`dock/index.ts` deletion**, and the **square/mobile occlusion fix**. These
  are the published-correctness surface — they need only E1.
- **Resolution:** the role-typed BASE COMPONENT is net-new; glass-ui BOOKs it
  until a 2nd consumer. keyframes D.W5 is the **named candidate 2nd consumer**.
  This is a reciprocal cross-session edge: keyframes adopts the role-vocabulary
  as **local renames now** (E1-gated), and circles back to slot-fill over a
  role-typed base ONLY IF AU.W8 ships one AND keyframes is its confirmed #2.
  Otherwise the base stays BOOK and keyframes' local renames are the terminal
  state.
- **Gate-check:** read this RUN-BOARD's `AU.W8` row — does it record a **shipped
  role-typed base component** (not just the docs convention + base renames)? If
  no, E1b stays BOOK; keyframes proceeds on local renames alone.

### E2 — slides-F DEPLOY

- **From:** slides-F CI green on `main`.
- **Gates:** the slides Cloudflare Pages production deploy (`slides.friday.institute`).
- **Depends on E1** (the glass-ui PUBLISH edge, not the branch state): slides
  cannot consume `FG.W-dialog`/`-deck`/`-card-badge` or bump the pin until 3.3.0
  is on npm; the bumped pin must then pass slides' own
  `vue-tsc --noEmit` + `vite build` + `deck.spec.ts` + the glass-ui-binding sweep.
- **Gate-check (two faces):**
  1. slides CI green on `main` (the deploy precondition — `deploy-pages.yml`
     fires on `workflow_run` of CI when `conclusion == 'success' && head_branch ==
     'main' && event == 'push'`). A red CI never reaches deploy.
     ```sh
     gh run list -R mkbabb/slides --workflow ci.yml --branch main \
       --limit 1 --json conclusion -q '.[0].conclusion'   # want: success
     ```
  2. the Cloudflare Pages deploy state (the production URL serves the new SHA):
     ```sh
     gh run list -R mkbabb/slides --workflow deploy-pages.yml \
       --limit 1 --json conclusion,headSha -q '.[0]'      # want: success @ main SHA
     curl -sI https://slides.friday.institute | head -1   # want: 200
     ```
- **Domain:** the production deploy that needs the **fresh 3.3.0** is
  **USER-DOMAIN, confirm-first** (it ships only after the user publishes glass-ui
  3.3.0 and the pin-bump lands green). slides drives to READY (CI green on the
  bumped pin) autonomously.

### E3 — feedback-coder slides [CONDITIONAL — verified NOT WIRED]

- **Spec:** feedback-coder's "new slides" deploy gates on E2 **IF** those slides
  consume the slides framework / glass-ui / keyframes — TBD by reading the live
  tranche.
- **Resolution (verified against `feedback-coder/docs/tranches/L/L.md` @
  `tranche-l`, `package.json`):** the LIVE feedback-coder tranche-L is a
  **fine-tuned local discourse-boundary tagger** — a Python/PyTorch-MPS ML
  pipeline (DISRPT/GUM/STAC corpora, `boundary_f1(tol=1)`, HF
  `AutoModelForTokenClassification`). It declares **zero `@mkbabb/*`
  dependencies**, no Vue, no slides/glass-ui/keyframes consumption. **E3 is NOT
  WIRED** — the "new set of slides" framing does not match the live tranche.
- **Consequence:** E3 collapses to an **inbox hand-off only** — when E2 deploys,
  S2 drops a note in feedback-coder's inbox (the blackboard cross-link in §7); no
  code-edge, no gate, no wait. If a *future* feedback-coder tranche stands up
  actual slides consuming the framework, E3 wires then and re-reads this file.
- **Gate-check (for the future-wired case only):**
  ```sh
  grep -E '@mkbabb/(slides|glass-ui|keyframes)' \
    /Users/mkbabb/Programming/feedback-coder/package.json   # empty today → unwired
  ```

### E-spring — keyframes ↔ slides [FROZEN CONTRACT, not a publish edge]

slides consumes keyframes `springLinearStops` + `springTimingFunction` only (not
`SpringProgress`), pinned `^3.0.0`. The two helper signatures are a **frozen
contract** for this run — S1 (keyframes-D) MUST NOT change them (D §inv, design
decision 6). This is a constraint on S1, not a gate on slides; **no keyframes
publish gates slides**. The RUN-BOARD records the freeze; no wait.

---

## §4 — WAIT-OR-CIRCLE-BACK protocol + the heartbeat

Each session drives its tranche(s) to its **own green CI** autonomously (inv-27,
green-means-green per repo). The waves are ordered so blocked edges are rare and
late: gate-free legs run first, the gated leg (D.W5 / slides dock items) runs
last.

At a blocked edge a session chooses **(a) CIRCLE BACK** or **(b) HEARTBEAT-POLL**:

**(a) CIRCLE BACK (preferred while gate-free work remains).** Leave the blocked
wave parked, advance a gate-free wave, return when the gate clears. For S1: D.W5
is the only E1-gated wave — D.W1/W2/W3 (demo) ∥ D.W4 (engine) are all gate-free
and run to completion first. Only when those are green and D.W5 is the sole
remainder does S1 switch to heartbeat. For S2: slides-F W0–W9 + glass-ui AU.W0–W9
are all gate-free; the dock items + the publish are the tail. For S3: fully
gate-free (E3 unwired).

**(b) HEARTBEAT-POLL (when idle-waiting on a publish with no gate-free work
left).** Wake periodically, re-read this RUN-BOARD + check the **real gate**
(§3's command), proceed when it clears.

- **Mechanism:** `ScheduleWakeup` in `/loop` **dynamic mode** (the model
  self-paces the cadence), or `CronCreate` for a fixed wall-clock tick.
- **Cadence:** short while actively converging; **long fallback 1200–1800 s
  (20–30 min)** when purely idle-waiting on a publish — a publish is a
  human-latency event, so a tight poll wastes turns. Each wake:
  1. re-read this file's RUN-BOARD (§7).
  2. run the gate-check command (e.g. `npm view @mkbabb/glass-ui version` for E1).
  3. CLEAR → unpark the wave, execute, update the RUN-BOARD; STILL-BLOCKED →
     re-schedule the next wake at the fallback cadence.
- **Every session UPDATES the RUN-BOARD at each milestone** — wave done, CI
  green, ready-to-publish, published, deployed. The board is the only
  cross-session channel (inv-16: no session writes another's repo, so state
  flows through the blackboard, never through a sibling commit).

---

## §5 — The autonomy boundary

**Fully autonomous, no confirmation, up to READY-TO-PUBLISH** — and the deploy of
any leg that needs **no fresh publish**:

- all DEV + IMPL waves to each repo's **own green CI** (inv-27);
- staging changesets (glass-ui 3.3.0; keyframes stacked B `3.1.0` + C major + D
  major; slides as applicable);
- the keyframes **demo gh-pages deploy** is gh-pages-on-green and needs no fresh
  sibling publish *for the gate-free library demo*; the **D.W5 published-pin
  demo** is the leg that waits on E1 (it needs glass-ui 3.3.0 on npm first).

**USER-DOMAIN, confirm-first** (the irreversibility boundary — agents NEVER run
`npm publish`, a release-tag push, or `gh release`/`workflow` dispatch):

- the **glass-ui 3.3.0 npm publish** (E1 root hinge);
- the **slides-F production deploy** that consumes the fresh 3.3.0 (E2);
- the **keyframes demo deploy** on the fresh `^3.3.0` pin (D.W5);
- any **feedback-coder slides deploy** (E3) IF it ever wires.

**Driven in dependency order** (the explicit cross-session unblock chain the user
walks):

```
1. glass-ui 3.3.0 → npm                  (E1 clears)
        │
        ├─► 2a. keyframes demo deploy     (D.W5 pin → ^3.3.0, gh-pages)
        └─► 2b. slides-F deploy           (pin bump → CF Pages, E2)
                     │
                     └─► 3. feedback-coder slides   (E3 — IF wired; today: inbox note only)
```

Everything *up to* each arrow is autonomous (CI green, changesets staged, pins
prepared on a branch). The arrow itself — the publish, the fresh-pin deploy — is
the user's confirm-first act.

---

## §6 — Invariant boundaries

- **inv-16 — each session writes ONLY its own repo(s).** S1 → keyframes.js. S2 →
  glass-ui + slides. S3 → feedback-coder. **No session ever commits to a
  sibling.** Cross-repo items are name-forward (a sibling's published surface is
  consumed, never co-written). The **RUN-BOARD (this file, in the fourier hub) is
  the shared blackboard** — the sole cross-session state channel. fourier owns
  `docs/constellation/`; this file edits no sibling tree.
- **inv-27 — green-means-green per repo.** Each session's "done" cites its OWN
  green CI run id covering every job. No wave closes on a campaign-record or a
  cross-session narration. A session's gate-clear is verified by the real
  command (§3), never by reading a sibling's claim.
- **The blackboard is append-mostly.** A session edits ONLY its own RUN-BOARD
  rows + the gate-state cells it owns; it READS every other row. Conflicting
  writes are impossible because row-ownership partitions by session.

---

## §7 — The RUN-BOARD (the live blackboard)

Each session updates its own rows at every milestone. States: `PLANNED` ·
`IN-PROGRESS` · `CI-GREEN` · `READY-TO-PUBLISH` / `READY-TO-DEPLOY` ·
`PUBLISHED` / `DEPLOYED` · `BLOCKED(Ex)` · `BOOK`.

### Sessions

| Session | Repo(s) | Branch | Status | Last update |
|---|---|---|---|---|
| S1 keyframes-D | keyframes.js | master | D authored + hardened; **awaits IMPL authorization** | author-time |
| S2 glass-ui/slides | glass-ui · slides | (AU branch) · main | AU = CHARTER (pre-W0 formalize); slides-F planned | author-time |
| S3 feedback-coder | feedback-coder | tranche-l | L = ML tagger (NOT slides; **E3 unwired**) | author-time |

### Edges

| Edge | Gate-check | State @ author-time | Domain |
|---|---|---|---|
| **E1** glass-ui 3.3.0 publish | `npm view @mkbabb/glass-ui version` ≥ 3.3.0 | **BLOCKED** (= 3.2.0) | user (confirm-first) |
| **E1b** role-typed dock base | RUN-BOARD `AU.W8` ships role-typed base + keyframes #2 | **BOOK** (no 2nd consumer) | auto (circle-back) |
| **E2** slides-F deploy | slides CI green @ main + CF Pages 200 | **BLOCKED on E1** | user (confirm-first) |
| **E3** feedback-coder slides | `grep @mkbabb/(slides\|glass-ui\|keyframes) feedback-coder/package.json` | **NOT WIRED** (inbox note only) | n/a |
| **E-spring** keyframes↔slides | `springLinearStops`/`springTimingFunction` signatures unchanged | **FROZEN** (^3.0.0, no bump) | auto (S1 constraint) |

### Milestones (each session appends; newest at top)

| When | Session | Milestone | Evidence (run id / npm ver / URL) |
|---|---|---|---|
| author-time | — | board initialized; E1 blocked (glass-ui 3.2.0) | `npm view` = 3.2.0 |

### Cross-links (the inbox hand-offs)

- **S2 → feedback-coder inbox** on E2 DEPLOYED: drop a note that
  `slides.friday.institute` shipped the new minor (informational; E3 unwired, no
  action owed).
- **S2 → value.js inbox** on E1 PUBLISHED: glass-ui 3.3.0 unblocks value.js K.W3
  (the `/goo-blob` + `/watercolor-dot` consumption — value.js's arm, name-forward).

---

## §8 — END-STATE definition

The tri-tranche run is COMPLETE when all hold simultaneously:

1. **glass-ui 3.3.0 PUBLISHED** on npm (`npm view @mkbabb/glass-ui version` ≥
   3.3.0); AU.W0–W10 closed, `AU.FINAL` cites a green run id per wave;
   `gates:verify-ci` green.
2. **keyframes demo DEPLOYED** (gh-pages) on the published `^3.3.0` pin; D.W1–W6
   closed; the local dock renames + mask-removal + `dock/index.ts` deletion +
   square/mobile occlusion fix landed; `proof:idioms` / `proof:zero-alloc` /
   `proof:localized` / `proof:boundary` green; the stacked B/C/D changesets cut
   (publish user-domain); E1b resolved (role-typed base slot-filled IFF AU.W8
   shipped one, else the local renames are terminal).
3. **slides-F DEPLOYED** to `slides.friday.institute` (Cloudflare Pages, green CI
   on `main`); the pin bumped `^3.2.0 → ^3.3.0`; the four publish-gated
   consumptions landed; F.W0–W9 closed.
4. **feedback-coder** — the inbox note delivered; **no deploy gate owed** (E3
   unwired). (Re-evaluate only if a future feedback-coder tranche consumes the
   slides framework.)
5. **All tranche items closed** — every wave's hard gate verified, every deferred
   ledger entry dispositioned, zero un-dispositioned punts (P-Inv 28). The
   RUN-BOARD shows every session `DEPLOYED`/`PUBLISHED` and every edge `CLEAR`.
