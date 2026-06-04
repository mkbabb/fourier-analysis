# A4 — DEPLOY + e2e CHRONICS, re-grounded against the SHIPPED glass-ui 3.2.0

**Dimension:** A4 — the deploy-of-record chronic + the e2e/glass-dock inv-27 chronic, re-verified
against the *actual* sibling state (glass-ui 3.2.0 published, not a future gate).
**Repos verified this session:** fourier-analysis (HEAD `2a251e6` = origin/master `9d7c387` + 5 unpushed
doc commits), glass-ui (`package.json` version `3.2.0`, tranches AQ→AR→AS), keyframes.js (`3.0.0`).
**Verdict:** the deploy chronic is REAL and unchanged. The e2e chronic's *gate has DISSOLVED*: every
glass-ui ask K.W4 booked as "gated on a future glass-ui 3.2.0 ship" is **already shipped and on npm
`latest`**. K.W4 is no longer a wait — it is a one-command ADOPT-NOW bump. This re-sequences the whole
deploy+e2e plan: **adopt 3.2.0 → CI greens → the inv-28 gate can finally pass → the 29-commit backlog
can land green.** The two corrections (3.2.0-is-out, P5-is-rejected) are both VERIFIED TRUE.

---

## 1. The load-bearing re-grounding: every K.W4 "gate" is dissolved (ADOPT-NOW)

The entire K-deploy / J-postimpl corpus was authored on the premise that glass-ui 3.2.0 is **unreleased**
— A4-e2e-ci-chronic.md:59 says "gate glass-ui 3.2.0 — **absent today**, verified"; SYNTHESIS.md:75 says
"once glass-ui ships 3.2.0"; K.md:33,§4-W4 repeats "once glass-ui ships 3.2.0 (inv-16′…)". **That premise
is now false.** Verified this session:

| Claim in fourier docs | Actual sibling state (verified) | Disposition |
|---|---|---|
| `glass-ui-dock-vt-name` "gated on glass-ui 3.2.0 (absent today)" (ADOPTION-ASKS.md:125, A4:59) | **SHIPPED in 3.1.1 (AR.W2)** — `GlassDock.vue:137` `dockId = glass-dock-${useId()}`; `DockLayerGroup.vue:69` `vtId = useId()`; module counter DELETED; `proof:vt-names` gate enforces it (AR FINAL:7). Also in published 3.2.0 (AS FINAL:103). | **ADOPT-NOW.** Kill the gate. |
| `glass-ui-P5-inner-rounding` "NOT satisfied until inner sections round" (ADOPTION-ASKS.md:124,148) | **REJECTED / close-as-designed.** AS FINAL:113-119: "Rounding is owned at the container-root clip (`Configurator.vue:130` `rounded-panel … overflow-hidden`); `779fed7` deliberately reverted the per-section `rounded-panel` after adversarial verification found it geometrically inert and divider-deforming. The fourier ledger's 'not satisfied until inner sections round' is a **misdiagnosis**." Matches the user's correction #2 verbatim ("the rounding is controlled by the container"). | **KILL** (phantom). |
| `asideSide` "does not exist at 3.1.0" (ADOPTION-ASKS.md:172) | **SHIPPED.** `Configurator.vue:85/101/162` (AS FINAL:110) — grid-column flip, no DOM reorder. + `asideWidth`, `scrollMode`, `density`. | **ADOPT-NOW.** |
| `glass-ui-a11y` `inert` "pending a glass-ui release" (ADOPTION-ASKS.md:117,133) | **SHIPPED in 3.1.1.** `ConfiguratorLayer.vue:144` `:inert="!internalOpen \|\| undefined"` (AS FINAL:107, AR FINAL:8). | **ADOPT-NOW.** |
| `useTextHighlight` (WC §G ask, K.md:33) | **SHIPPED.** real composable, multi-instance safe, on root barrel (CHANGELOG 3.2.0; `useTextHighlight.test.ts`). | **ADOPT-NOW.** |

fourier's `web/package.json:14` pins `"@mkbabb/glass-ui": "^3.1.0"` and `node_modules` has `3.1.0`
installed. `npm view @mkbabb/glass-ui dist-tags` → `{ latest: '3.2.0' }`. So **the fix is one
`npm install @mkbabb/glass-ui@^3.2.0` + lock-regen away** — not a wait on an upstream maintainer.

**This is the headline re-grounding:** K.W4 is not a SHIP/BOOK split "once glass-ui ships." It is a pure
fourier-local ADOPT-NOW bump against an already-published peer. inv-16 is irrelevant here (fourier holds
no lever over `dock.js`, true — but it does not NEED one; the lever was already pulled upstream and
released). The "glass-ui-maintainer-owned, fourier holds no lever, kill-date = the adoption commit"
framing is now just: **do the adoption commit.**

## 2. The e2e chronic, re-sequenced: the bump GREENS it directly — the bridge is unnecessary

A4-e2e-ci-chronic.md §7 designed an elaborate "legitimate bridge": consolidate the 5 divergent console
filters into `web/e2e/_probes.ts`, add a kill-dated **exact-string** allow-entry for
`Unexpected duplicate view-transition-name: glass-dock-1`, plus a **self-deleting satisfaction probe**.
That bridge was the correct call **IF 3.2.0 were unreleased**. It is not. Verified: `_probes.ts` does
NOT exist (`ls` → absent), no `glass-dock-1` filter exists in `web/e2e/` (grep → 0 hits) — so the bridge
was never built; it was only *authored*. **Do not build it.** The bump greens the suite at the source.

Re-grounded e2e plan (replaces A4 §8 Part B and SYNTHESIS W6's bridge fold):

1. **ADOPT-NOW bump** `^3.1.0 → ^3.2.0`, regen `package-lock.json` from the registry (not the dev
   symlinks — AR FINAL:26 confirms the registry resolves clean now). This alone kills the duplicate-VT
   warning at the root (`useId()`-minted names cannot collide), so the ~13 specs that tripped
   `expect(consoleErrors).toEqual([])` go green WITHOUT any allow-entry. The dock geometry-morph
   (the real prod regression, A4-2) is RESTORED, not merely tolerated.
2. **Un-`test.fixme` the two a11y keystones** — `visualization-crud.spec.ts:630` and
   `visualization-ux.spec.ts:110` are `test.fixme`'d "pending a glass-ui release (`inert`)". 3.2.0 ships
   `inert` (`ConfiguratorLayer.vue:144`), so the keystones flip to live `test()` and assert green.
   (This is the kill-date the H.W1 booking named, now executable.)
3. **The 5-filter `_probes.ts` consolidation (A4-4) STILL SHIPS** — but re-scoped: it is a DRY/NO-LEGACY
   cleanup (one shared helper instead of 5 drifting inline copies), NOT a bridge carrier. It no longer
   needs the dock-VT allow-entry or the self-deleting satisfaction probe (there is nothing to bridge).
   Net: less code than the authored design. This is a genuine elegance fold; keep it.
4. **The W6 "self-deleting satisfaction probe"** collapses into a plain assertion: a spec that mounts the
   editing workspace (both docks live) and asserts ZERO duplicate-VT warning. It is green from commit 1;
   it is the *evidence* that the adoption worked, not a `test.fixme` waiting to flip.

**Net e2e re-sequence:** the W6 "bridge → kill-date → satisfaction-probe" machinery is DECLINED-as-moot.
The bump is the fix. fourier CI goes green over `bump-sha+`, and — load-bearing for the deploy arm — the
inv-28 SPA `workflow_run` gate (`deploy-pages.yml`, H.W2) can finally fire because CI is finally green
(today it correctly skips on red, SYNTHESIS:99 run `26913966345` `skipped`).

## 3. The deploy chronic — RE-CONFIRMED unchanged, but UN-BLOCKED by the bump

The deploy chronic is NOT dissolved by the 3.2.0 news. I re-confirmed the A3 root cause and state:

- **Host distance:** `git rev-list --count f2fe447..9d7c387` = **29** (verified; +5 unpushed docs = 34 to
  local HEAD). G-close/H/I/J never landed. A3:5 stands.
- **No `green_ci_gate`, no `HEALTHCHECK`, no `service_healthy`:** grep of `scripts/deploy-hook.sh`,
  `api/Dockerfile`, `docker-compose.prod.yml` → **0 hits** for all three. The inv-28 API arm is still
  BOOKED-not-built; the cold-start is still gated on a blind 60s poll, not a health condition.
- **Root cause (A3 H2+H3):** lifespan `await connect_db()` (`api/main.py:42`) blocks startup, then
  synchronously builds ~30 indexes incl. the new J fork indexes (`database.py:97-109`) BEFORE
  `/api/health` answers, compounded by a 60s gate too tight for a 29-commit cold `WORKERS=1` start.
  inv-22 (`/→404`, nginx-direct) RULED OUT; J backend RULED OUT (prod viz=0 → migration is a no-op,
  AND migrations run after the gate). **All still accurate — no re-grounding changes the deploy root
  cause.** The deploy chronic is independent of glass-ui.

**BUT the sequencing changes.** Today the deploy chain is doubly blocked: (a) the cold-start fails the
health gate (A3 H2/H3), and (b) even if it didn't, the inv-28 API-arm green-CI gate K.W2 builds would
**refuse `9d7c387`** because CI is red on the dock-VT e2e (A3 Fold B:136-138 names exactly this:
"the current e2e-red `9d7c387` … would STILL trigger the webhook"). The 3.2.0 bump removes blocker (b):
once CI is green, the green-CI gate K.W2 builds can PASS instead of correctly-refusing. So:

> **The 3.2.0 bump is a hard PREDECESSOR of a clean deploy-of-record, not just of J's close.** The
> deploy can only land *green* (CI-green-gated, the whole point of inv-28) once CI is green, and CI is
> green only after the bump. The correct K-deploy wave order is therefore **bump FIRST (was K.W4), then
> the deploy spine (K.W1-W3) lands a green SHA.** The current K.md order (W1 land → … → W4 bump) lands
> a still-red SHA, which the W2 gate it builds in the same tranche would then refuse — an internal
> contradiction. **Re-sequence: W4-adopt becomes W1; the deploy spine follows.**

## 4. Is K-deploy still the right vehicle? YES — but re-shaped, and the "gated" framing is purged

K-deploy remains the correct vehicle: the deploy chronic is a real, months-class, infra/cross-repo
chronic that earns its own named tranche (the directive forbids dropping it into a data-model close —
SYNTHESIS:18). The 3.2.0-is-out reality does NOT collapse K-deploy into J; it **re-shapes K-deploy's
internal sequence and purges the false "gated-on-a-future-release" framing** from every wave. The
re-grounded K-deploy shape:

| Wave (re-grounded) | Was | Now | Disposition |
|---|---|---|---|
| **K.W1 — ADOPT glass-ui 3.2.0** (NEW first wave) | K.W4 "SHIP/BOOK, gated on glass-ui ship" | `^3.1.0→^3.2.0`, lock-regen, un-`test.fixme` a11y keystones, wire `asideSide`/`useTextHighlight` into J.W5, `_probes.ts` DRY cleanup (no bridge). **GREENS CI.** | **ADOPT-NOW** (moved to front) |
| **K.W2 — LAND the 29-commit backlog observed** | K.W1 | Unchanged root cause (HEALTHCHECK + `service_healthy`, observed bring-up, H5 pre-flight). Now lands a **green** SHA. | SHIP-as-wave |
| **K.W3 — inv-28 API-arm green-CI gate** | K.W2 | Unchanged; `green_ci_gate()` fail-closed. The bumped SHA is the FIRST it lets PASS (was: the first it'd block). | SHIP-as-wave |
| **K.W4 — silent-rollback paging sink** | K.W3 | Unchanged; off-host page + deploy-template backport. | SHIP-as-wave |
| **K.W5 — operator entrypoint** (dev.sh/deploy.sh) | K.W5 | Unchanged; `scripts/dev.sh` + `scripts/deploy.sh` exist (verified, dated Jun-3); ship WITH the spine. | FOLD |
| **K.W6/W7 — value.js-J peers + dispatch.sh** | K.W6/W7 | Unchanged inv-16′ asks. | BOOK |

The control-pane net-new asks **A-1 / A-2** (machined-groove divider opt-in; label/sub typography
ladder) are NOT in 3.2.0 — AS FINAL:139-157 name-forwards them to a **glass-ui successor (AT)**, not
3.2.0, because they fail the ≥1-release-boundary + ≥2-consumer test. So they stay BOOKED as glass-ui-AT
asks; the K.W1 bump does NOT satisfy them, and the K.md/ADOPTION-ASKS framing that lumped A-1/A-2 into
"K.W4's glass-ui-3.2.0 adoption bundle" (K.md:78, ADOPTION-ASKS:168-176) is now WRONG and must split:
A-3 `asideSide` = ADOPT-NOW (in 3.2.0); A-1/A-2 = BOOK-to-glass-ui-AT (a future release).

## 5. The corrections, propagated (what every fourier doc must now say)

The two corrections are verified TRUE and must be propagated into the new tranche's docs (this is a
tranche-development output; the *edits* below are the authored disposition, not executed here):

- **Correction #1 (3.2.0 is out, dock has `useId`):** purge every "gated on glass-ui 3.2.0 / once
  glass-ui ships / fourier holds no lever / kill-date = adoption commit" qualifier on `dock-vt-name`,
  `asideSide`, `useTextHighlight`, `glass-ui-a11y` from K.md §1/§4/§7/§8, SYNTHESIS §0/§3/§4, A4 §5-§8,
  ADOPTION-ASKS §7 rows. Replace with **ADOPT-NOW** and a single fourier-local bump wave. The dock-VT
  row in ADOPTION-ASKS.md:125 must move from "OPEN — gated on glass-ui 3.2.0" to
  "**SATISFIED-UPSTREAM (3.1.1/3.2.0), ADOPT in K.W1**."
- **Correction #2 (P5 rejected):** **KILL** `glass-ui-P5-inner-rounding` across ADOPTION-ASKS §7 row 124
  + §6 note 148, A4 §8 Part A, K.md §4-W4/§7/§8, SYNTHESIS:96, the control-pane audit's A-row, the
  grand-audit §F/:265. Do NOT re-book. Mark it CLOSED-AS-DESIGNED with the AS FINAL:113-119 +
  `779fed7` citation and the user's "rounding is controlled by the container" verdict. The "visual-
  evidence satisfaction test, NOT satisfied until inner sections round" acceptance shape is DELETED.

## 6. Adversarial caveats (where the re-grounding could be wrong)

- **The bump may surface NEW e2e reds.** Greening the dock-VT warning un-`test.fixme`s the a11y
  keystones AND restores the dock morph — both could expose latent failures (the morph now actually
  runs in the spec; the a11y keystones now actually assert). The re-grounded plan must treat K.W1 as a
  real CI-verification wave (run the suite, cite the green run id per inv-27), not a blind bump. If the
  bump reveals a *new* app-owned a11y/morph fault, that is a fourier-local fix in the same wave — NOT a
  new glass-ui ask.
- **keyframes major drift:** glass-ui 3.2.0 widened its keyframes peer to `^2.2.0 || ^3.0.0`
  (CHANGELOG); keyframes.js is now `3.0.0`; fourier pins `keyframes.js@^2.2.0` (`web/package.json:15`).
  The bump is satisfiable without touching keyframes (glass-ui consumes only the light static engines,
  unchanged across the 2.2.0→3.0.0 boundary, CHANGELOG), but the K.W1 wave should VERIFY the lock
  resolves a single keyframes copy (no dual-major) lest a duplicate-module-graph re-introduce a
  different VT/id collision class. Name this as a K.W1 acceptance check.
- **aurora/value.js peer externalization:** 3.2.0 externalized value.js from `aurora.js` and made it a
  peer (CHANGELOG). fourier pins `value.js@^0.10.0`. If fourier consumes `@mkbabb/glass-ui/aurora`, the
  bump may demand a value.js peer-version reconciliation. Verify fourier's aurora usage at K.W1 (likely
  none — fourier's web is canvas/KaTeX, not aurora-themed — but assert it).
- **The deploy root cause is NOT touched by any of this.** H2/H3 (lifespan-index-blocking + 60s gate)
  remain the true deploy blocker and need the HEALTHCHECK + `service_healthy` structural fix regardless.
  The 3.2.0 bump only removes the *CI-red* blocker on landing a *green* SHA; it does not make the
  cold-start fast. Do not let the "bump greens everything" framing obscure that the deploy spine
  (HEALTHCHECK, observed bring-up, fail-closed gate, paging) is still mandatory.

## 7. The re-grounded deploy+e2e plan (one paragraph)

**Bump first.** K-deploy's first wave is the fourier-local ADOPT-NOW of glass-ui `^3.2.0` (the dock-VT
`useId()` fix, `inert`, `asideSide`, `useTextHighlight` — all already published, AR.W2/AS); this greens
the e2e suite at the source (no bridge, no allow-entry, no self-deleting probe — those are DECLINED-as-
moot), un-`test.fixme`s the two a11y keystones, and ships the `_probes.ts` DRY cleanup as a pure
elegance fold. With CI green, the inv-28 SPA `workflow_run` gate fires and the API-arm `green_ci_gate()`
(built in the following wave) can PASS instead of correctly-refusing a red SHA. **Then land the deploy
spine:** observed bring-up of the green SHA behind a real container `HEALTHCHECK` + `depends_on:
condition: service_healthy` (the A3 H2/H3 structural fix, NOT a blind poll), the fail-closed API-arm
green-CI gate (inv-28 API half BUILT), and the off-host paging sink (the silent-rollback kill, backported
to the deploy template). The deploy root cause is unchanged and still mandatory; the bump only removes
the CI-red co-blocker. **KILL P5** everywhere (close-as-designed; container owns the rounding). A-1/A-2
stay BOOKED to a future glass-ui-AT (not in 3.2.0). K-deploy is still the right vehicle; it is just
re-sequenced (adopt → green → land) and stripped of every false "gated-on-a-future-release" qualifier.
