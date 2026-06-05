# KICKOFF — Session S2 (glass-ui + slides)

> Paste **both parts** below, verbatim, to start the glass-ui/slides session.
> PART 1 is the standard tranche-start prompt. PART 2 is the coordination
> addendum that scopes S2 to its two tranches and the constellation edges.
> This is the constellation **ROOT** session: glass-ui 3.3.0 publishes FIRST and
> unblocks everyone.

---

## PART 1 — standard tranche-start prompt (verbatim)

Begin and continue the current tranche. You must read any and all appurtenant documentation and adhere exactly to the plan, in particular regarding agent orchestration and deep parallelization. Do not edit items directly unless befitting and fully orchestrate the processes as team lead. Continue through this indefatigably: do not relinquish control back to me until you have completed the plan IN TOTALITY. NO quick solutions, NO workarounds: idiomatic, gestalt approaches.

---

## PART 2 — coordination addendum (the S2 charge)

You are **Session S2** of a three-session constellation run. You own **two
tranches** and write **two repos only** — glass-ui and slides. You are the
constellation **ROOT**: glass-ui 3.3.0 is the dependency everyone else consumes,
so it publishes FIRST.

### Your two tranches

**(a) glass-ui Tranche AU — FORMALIZE then EXECUTE.** A begotten spec lives at
`/Users/mkbabb/Programming/fourier-analysis/docs/constellation/tri-tranche-run/glass-ui-next/`
(authored under inv-16 in the fourier hub — it edits no glass-ui source). Your
**W0** is to FORMALIZE that spec into `glass-ui/docs/tranches/AU/` as a binding
tranche in glass-ui's own format (`AU.md` + `PROGRESS.md` + `waves/`), then
execute its waves on glass-ui's own clean checkout, gated on glass-ui's own green
CI (inv-27). Read first:

- `…/tri-tranche-run/glass-ui-next/CHARTER.md` — the thesis, the AU.W0–W10 wave
  table, the invariants (inv P1–P6, inv-27, inv-θ, inv-AT-color, inv-ε, the
  `<Role>Dock` vocabulary precept), the publish note.
- `…/tri-tranche-run/glass-ui-next/waves/AU.W0.md … AU.W10.md` — the per-wave
  specs.
- `…/tri-tranche-run/glass-ui-next/audit/{at-state,deferred-lineage,deferred-ledger,precept-prompt-recap,slides-coupling}.md`
  — the binding substrate (the W0b SOTA + C-synthesis are inherited; NO re-audit
  of the SOTA is owed).

**Re-ground at W0.** glass-ui is on branch `at-dock-convergence` at HEAD
`8e4cb9f`, version **3.2.0** (the published npm baseline; `3.3.0` is the
unpublished delta AU drives). `docs/tranches/` holds `… AR, AS, AT`; **no `AU/`
exists** — you create it. Treat the three landed dock commits
(`e906448`/`f0b0ffb`/`8e4cb9f`) as FACTS to RE-VERIFY on glass-ui's own
tranche-gated green CI (inv-27) — never inherit "the dock is done" from the
campaign record. Re-letter the `W6-dock-b` slot-ID collision (the touch-gate B′
SHIPPED; the a11y contract gets a fresh ID). Do NOT touch the dirty
`docs/precepts` submodule (USER-DOMAIN, inv-16′).

**(b) slides Tranche F — EXECUTE.** Read first:

- `/Users/mkbabb/Programming/slides/docs/tranches/F/PLAN.md` — the two-arm plan
  (slides arm F.W0–W9 off `main`; the glass-ui coordination arm `FG.W-*`).
- `/Users/mkbabb/Programming/slides/docs/tranches/F/COORDINATION.md` — the
  AU-hinge handoff ledger + the per-item AT-clobber risk table.
- `/Users/mkbabb/Programming/slides/docs/tranches/F/{LEDGER,GAPS}.md` +
  `…/F/waves/F.W0…F.W9*.md` + `…/F/waves/FG-glass-ui-arm.md`.
- The `…/F/audit/` corpus (16 `L*` + 6 `V*` lenses + `SYNTHESIS.md`) as needed.

slides writes ZERO glass-ui (inv-16) — every `FG.W-*` item is a glass-ui-AU wave
you execute in the glass-ui repo, NOT a slides wave. The slides arm (F.W0–F.W9)
is file-disjoint from glass-ui and ships first off `main`.

### Wave ordering — you are the ROOT; publish-blocking items FIRST

glass-ui **3.3.0 (AU.W10)** publishes FIRST and unblocks keyframes + slides.
Order AU so the publish surface lands early:

```
AU.W0 (formalize + re-ground)
  → AU.W1 (design slices)
  → AU.W2  [slides-F P0 HEADLINE]  dock opacity-lockstep fold
  → AU.W3  [3.3.0-publish-blocking] proof:strict-templates KEYSTONE (FIRST) + correctness fold
  → AU.W4  Fraunces @font-face ship (lean + slipped)
  → AU.W5  /color runtime-JS leaf
  → AU.W6  useWebGLCanvas substrate + aurora refactor (DELETE frostShader.ts)
  → AU.W7  the blob trio (the headline)
  → AU.W8  the AU dock-design headline (reka-ui Tabs rail + dock a11y contract + the <Role>Dock vocabulary)
  → AU.W9  control-pane + dark-ergonomics + lean folds
  → AU.W10 close + stage the 3.3.0 changeset → READY-TO-PUBLISH
```

- **AU.W2 first** — the dock opacity-lockstep fix is slides-F's P0 (the V02 "not
  iOS-smooth" report): swap `.dock-layer{,-item-host}` opacity from
  `--dock-motion-fast` (0.2s) to `--dock-motion-resize` (0.3s), extend the matched
  `visibility` delay; HARD gate is a **playwright timing probe** (items + container
  settle ≤1 frame), NOT a screenshot. This is AT-OWNED dock.css territory; slides
  only bumps the pin.
- **AU.W3 keystone** — `proof:strict-templates` lands FIRST (library-wide
  `checkUnknownProps:true` across all three tsconfigs), THEN re-verify the landed
  clean breaks typecheck-green under it. It is the publish-quality gate.

`FG.W-motion` (slides' `useCountup` + `v-reveal`/`slideReveal` → glass-ui
`composables/motion/`) is **AT-disjoint** — schedulable in ANY AU wave, even
before 3.3.0. The slides arm F.W0–F.W9 runs in parallel off `main` from the
start (zero AU dependency).

### The dependency edges (the constellation, reconciled + verified)

You sit at the ROOT. The edges that touch you:

- **E1 [ROOT HINGE]** — glass-ui **3.3.0 publish** (AU.W10, npm) GATES → keyframes
  D.W5 demo (the published `^3.3.0` pin) **+** slides-F dock items **+** slides-F
  deploy. You OWN this unlock. **USER-DOMAIN (confirm-first):** you stage the
  changeset and post READY-TO-PUBLISH; the user runs `npm publish`.
- **E1b [circle-back, INBOUND]** — keyframes D.W5's leverage of a glass-ui-side
  role-typed **base COMPONENT** gates on **AU.W8**. Per the `<Role>Dock` precept:
  ship the **docs convention** (the `ChromeDock`/`TransportDock`/`CanvasDock`/
  `ToolDock` role vocabulary, documented ONCE in glass-ui's dock README) + the
  **base renames** (`useTouchGate→useDockTouchGate` co-located + aliased;
  `DockTabButton` RETIRE — 0 consumers — deletion surface
  `src/components/custom/dock/DockTabButton.vue`, its export at
  `…/dock/index.ts:5`, the `dock.css:877/947` comment refs). A role-typed base
  **component** is **BOOK until a 2nd consumer appears** — the named candidate is
  keyframes D.W5; it adopts the vocabulary as LOCAL renames now and only circles
  back IF a role-typed base ships AND keyframes is its 2nd consumer. Do NOT ship a
  role-typed component speculatively.
- **E2 [OUTBOUND]** — slides-F **deploy** (Cloudflare Pages →
  `slides.friday.institute`, via `deploy-pages.yml` `workflow_run` on green
  `ci.yml` off `main`) GATES on **E1** (glass-ui 3.3.0 published, so the pin bump
  `^3.2.0 → ^3.3.0` + the four publish-gated consumptions land). **USER-DOMAIN
  (confirm-first):** the production deploy is the user's leg.
- **E3 [conditional, INBOX-ONLY]** — feedback-coder's S3 work gates on E2 only IF
  it consumes the slides framework / glass-ui / keyframes. **Verified NULL:**
  feedback-coder Tranche L (`docs/tranches/L/`) is a fine-tuned local boundary
  tagger (ML) — zero slides/glass-ui/keyframes consumption. So E3 does not bind
  this run; S3 gets an inbox hand-off only. We NEVER write feedback-coder (inv-16).
- **keyframes spring leg — FROZEN, not a gate.** slides consumes keyframes
  `springLinearStops` + `springTimingFunction` only (pin `^3.0.0`, no bump). No
  keyframes publish gates slides. You owe nothing here; the RUN-BOARD just records
  it.

### The publish-gated slides consumptions (post-AU.W3 publish)

Once 3.3.0 is on npm, slides bumps `^3.2.0 → ^3.3.0` and these unlock — fold them
into AU as the publish surface admits, then consume in slides:

- `FG.W-dialog` — `DialogContent showClose?: boolean = true` (retires slides'
  F-01 close-hide hack). **MEDIUM clobber** — do NOT open `DialogContent.vue`
  concurrently with the AU dock-chrome waves; strictly post-AU.W8 or coordinate
  the insertion point.
- `FG.W-deck` — the `/deck` subpath lift (the 5th carry). Resolve the
  ≥2-consumer gate DECISIVELY in F: ratify slides' `_fixture/` deck as #2 OR ship
  a glass-ui demo `<Deck>` story. Do NOT carry it a 6th time.
- `FG.W-card-badge` — Card `surface="cartoon"` dark-arm + Badge
  `variant="accent"`; each needs a confirmed #2.

### The protocol (inv-27 + the RUN-BOARD)

1. **Drive each tranche to its OWN green CI per repo (inv-27 — green-means-green).**
   No wave closes on a campaign-record or narration; every "done" cites that repo's
   green CI run id covering every job. Every new AU gate registers in `gates.mjs`
   with its `{local,ci,release,sibling}` tag (`gates:verify-ci` green) — never
   hand-listed in `ci.yml`.
2. **REGISTER + UPDATE the RUN-BOARD** at
   `/Users/mkbabb/Programming/fourier-analysis/docs/constellation/tri-tranche-run/RUN-BOARD.md`
   (and read `…/tri-tranche-run/COORDINATION.md`). If either does not yet exist,
   CREATE it as your first board act — it is the shared cross-session ledger. Post
   a line at EVERY milestone: wave done · CI green · READY-TO-PUBLISH ·
   published · deployed.
3. **At a blocked edge, do NOT idle.** Either (a) CIRCLE BACK to gate-free waves
   (the slides arm F.W0–F.W9, `FG.W-motion`, and every AU wave up to the publish
   are gate-free for you — you are the root), or (b) HEARTBEAT-POLL: wake
   periodically (ScheduleWakeup in `/loop` dynamic mode, or CronCreate) to re-read
   the RUN-BOARD and re-check the real gate, proceeding when it clears. As the
   root you have almost no inbound gate to wait on — your work is overwhelmingly
   autonomous up to READY-TO-PUBLISH.
4. **USER-DOMAIN legs (confirm-first) — the boundary is irreversibility.** You take
   everything up to READY-TO-PUBLISH autonomously (CI green, changesets staged).
   You NEVER run an irreversible release/deploy step — `npm publish`, a release-tag
   push, a `gh release`/`workflow` dispatch, or the production Cloudflare-Pages
   deploy. Stage the changeset, post READY-TO-PUBLISH on the board, and the user
   drives the publish in dependency order:
   **glass-ui 3.3.0 → {keyframes demo deploy, slides-F deploy} → feedback-coder.**

### Invariants you carry

- **inv-16 — write ONLY glass-ui + slides.** Never keyframes, never
  feedback-coder, never the fourier hub source. Cross-repo items are name-forward
  only.
- **inv-16′** — do not touch the dirty `docs/precepts` submodule in-flight.
- **inv-27 / inv-θ** — green-means-green for both the test fleet and the GATE
  fleet; `git status` clean after `proof:all`; `gates:verify-ci` fails closed on
  drift.
- **inv P1–P6** — no legacy (every clean break carries no alias; `frostShader.ts`
  DELETED with a file-absence + import-graph gate, NOT a name-grep);
  transposition-desirable (each is net-deletion-or-neutral, ≥2-consumer proven);
  substrate-with-consumer (wire before retire; the blob ships on value.js + a demo
  story; muster's interest is survey, not a firm #2); fail-closed-green gates (no
  "API exists", no source-string runtime gate, no silent `console.warn`).
- **inv-AT-color** — SETTLED: ONE runtime-JS color source (value.js via `/color`);
  CSS token tier stays native (guarded); the published graph is a DAG. EXECUTE the
  leaf; do not re-decide it.

### The success condition

The green-CI **3.3.0** surface — every AU wave verified on glass-ui's own green CI,
the 3.3.0 changeset staged, READY-TO-PUBLISH posted on the RUN-BOARD — AND the
slides arm F.W0–F.W9 green on `main` with the publish-gated consumptions staged
behind the pin bump. The user drives the confirm-first publish + deploy; that
unlock cascades to keyframes D.W5 and slides-F deploy.
