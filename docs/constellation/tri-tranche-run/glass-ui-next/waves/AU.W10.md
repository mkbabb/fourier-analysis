# AU.W10 — close: overfitting audit + gates matrix + AU.FINAL + 3.3.0 publish

The terminal wave (CHARTER §3 W10, §6). AU drives to the 3.3.0 publish — the
constellation's ROOT dependency, the central hinge of the tri-tranche run. W10 runs
the overfitting audit (PROPS tallied), greens the full gate matrix, authors AU.FINAL
recording `inv-AT-color`, stages the 3.3.0 changeset, and drives to the green-CI
close. The outward publish leg is USER-DOMAIN, confirm-first (identical to A/B/AS/C).
This is where AU completes the AT tranche in totality — AT gets no FINAL; AU closes it
(`at-state.md §canonical next letter`).

## §Scope

1. **The overfitting audit (PROPS tallied, P3, CHARTER §3 W10).** The dock proved
   prop-accretion hides under component-legitimacy — the audit tallies PROPS not just
   components, across the WHOLE AU surface. Every new prop, subpath, composable, and
   gate names ≥2 distinct consumer contexts OR is correctness/hygiene OR is the
   user-ruled headline. The blob's ≥2 is value.js + the demo story (the injected seam
   is the proof it is not value.js-coupled — muster is NOT claimed as a firm 2nd, the
   honest record). Zero orphans pass.

2. **The full gates matrix green (inv-θ, P5, CHARTER §4).** `proof:all` over the
   COMPLETE AU gate fleet (18 gates) — `proof:dock-opacity-lockstep`,
   `proof:strict-templates`, `proof:peer-optional`, `proof:vueuse-free-root`,
   `proof:supportsPostTask-wired`, `proof:font-axes`, `proof:color-acyclic`,
   `proof:single-color-core`, `proof:webgl-substrate-single`,
   `proof:frostShader-deleted`, `proof:blob-value-free`, `proof:no-value-default`,
   `proof:webgl-golden`, `proof:blob-color-equivalence`, `proof:blob-space-gamma` (the
   two DEC-AT-7 per-stage seam gates from AU.W7 — the gamma lift + the equivalence
   stage), `proof:dock-a11y-contract`, `proof:dock-vocabulary`, `proof:au-w9-consumers`.
   Each registered in `gates.mjs` with its tag, `gates:verify-ci` green (the fleet
   manifest == the ci.yml matrix == release.yml filter, structurally). `git status`
   clean after `proof:all` (gate output routes to `.cache/gates/`).

3. **AU.FINAL — the close record.** AU.FINAL records:
   - **`inv-AT-color`** — one runtime-JS color source (value.js, via the `/color`
     leaf); the CSS token tier STAYS native (the §token-tier guard); the GLSL tier
     mirrors value.js on the GPU; the published graph is a DAG. Both `oklchToLinear` +
     `oklchToGammaRgb` ship.
   - **The DEC-AT-7 seam, closed** — the blob lift = GAMMA, the shader-quality stage =
     LINEAR (`linearToSrgb()`); the perceptual-uniformity claim HOLDS.
   - **The two-tier gate idiom** — every gate is a SOURCE-graph gate beneath a
     DIST-floor gate; every RED-at-HEAD gate (`proof:peer-optional`,
     `proof:vueuse-free-root`) greened born-green.
   - **The slot-ID collision reconciliation** — the touch-gate B′ recorded SHIPPED
     under its true identity; the a11y/state contract test shipped under its fresh AU
     ID (AU.W8). The collision is NOT inherited.
   - **The overfitting verdict** — every AU artefact clears the ≥2-consumer bar; the
     `useWebGLCanvas` substrate is net-deletion at its core (the before/after LOC
     proves the transposition, not a copy).
   - **The B-style overclaim reconciliation** — AT's plan read as if the blob shipped;
     HEAD said only the dock landed. AU audited its predecessor's CLAIMS, not just its
     code, and folded the corrections. The three landed dock commits are re-verified
     under AU's OWN green CI (they landed on PR #1, not a tranche-gated close — inv-27).

4. **The 3.3.0 changeset + the publish (USER-DOMAIN, confirm-first, P4, CHARTER §6).**
   ONE changeset rendering AU's whole published surface (the dock completion +
   correctness fold + Fraunces + `/color` leaf + substrate + blob trio + dock-design +
   control-pane + dark/drawer/size + slides-supply). The SemVer tier accounts for the
   rail-aria break's version call (AU.W8 — minor-vs-major). The publish leg
   (`changeset version` → tag → `release.yml`) is the irreversible step: agents/
   sub-drivers NEVER run it (`precept-prompt-recap.md §P4` — the boundary is
   irreversibility). AU stages the changeset + the green CI; the publish owner
   finalizes the SemVer + drives the publish.

5. **The cross-repo name-forward (inv-16, CHARTER §6).** value.js K.W3 (delete the demo
   blob impls, import the published `/goo-blob` + `/watercolor-dot`, supply its OWN
   `ColorResolver`) UNBLOCKS on this publish — value.js's arm, name-forward, NOT an AU
   edit (`deferred-lineage.md §8` #57). slides-F's four publish-gated consumptions +
   the pin bump unlock on the 3.3.0 npm publish — the slides-deploy edge depends on the
   PUBLISH edge, not the branch state (`slides-coupling.md §3`). The cascade-gui
   lockfile regen (#62) folds opportunistically as the publish touches the lockfile. AU
   writes only glass-ui.

## §HARD gate

Per CHARTER §3 W10: **the overfitting audit returns zero orphans; `git status` clean
after `proof:all`; `gates:verify-ci` green; `FINAL.md` cites a green run id per wave;
the 3.3.0 changeset staged.** Made `proof:au-final`, registered `gates.mjs` (tag
`release`), fail-closed:

- **(a) the full matrix is green over a clean tree.** `proof:all` (the COMPLETE AU
  fleet) PASS; `git status` clean; `gates:verify-ci` green. Reddens on any RED gate or
  a dirty tree.
- **(b) the overfitting audit returns zero orphans.** A machine-readable tally
  (component × prop × subpath × composable, each ↦ its ≥2 consumers or its
  correctness/headline tag) emits zero un-justified entries. The blob's ≥2 is value.js
  + demo story; muster NOT counted. Reddens on any orphan.
- **(c) every MET gate cites a re-runnable instrument's passing run (inv ε).** Every
  "done" in AU.FINAL resolves to a checked-in instrument shown to PASS — NOT a
  narration, NOT a campaign record (P4, the C-tranche discipline). The three landed
  dock commits re-verified under AU's OWN green CI. Reddens on any narrated-MET gate.
- **(d) the changeset is staged + the publish is NOT auto-run.** The 3.3.0 changeset is
  staged + the green CI exists; the gate does NOT execute the irreversible leg. Success
  is "ready + confirm-first," not "published" (P4).
- **(e) the DEC-AT-7 seam is closed by instrument.** `proof:blob-space-gamma` (the
  lift) AND `proof:blob-color-equivalence` (the shader-quality stage, with
  `linearToSrgb()` present) both PASS — the blob is gamma-correct AND perceptually
  uniform. Reddens if either half is absent.

inv ε: AU.FINAL's defining move is the C-tranche discipline — it audits its OWN
predecessor's CLAIMS, not just its code, and folds the corrections. Every MET gate is a
passing instrument, not an assertion.

## §The constellation unlock

E-publish (`slides-coupling.md §4`, CHARTER §6) resolves here: once 3.3.0 is on npm,
value.js K.W3 unblocks (its own arm, inv-16) AND slides bumps `^3.2.0 → ^3.3.0` and
consumes FG.W-dialog/-deck/-card-badge. AU is the honest single owner of the 3.3.0
surface — the AT tranche AT did not close, AU closes.

## §No-legacy

AU.FINAL records the no-legacy ledger: `frostShader.ts` DELETED, the 1×1-canvas probe
DELETED, the dead `optionalPeerDependencies` field DELETED, the dead `ValueJs` UMD
global DELETED, `DockTabButton` RETIRED, the per-button rail background RETIRED, the
hand-rolled rail ARIA REPLACED by reka-ui. A grep for any retired symbol's name outside
its deletion commit returns 0 (the P1 falsifiable). Zero compatibility aliases ship past
their one-minor P1 budget.
