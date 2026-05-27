# D — progress log

Updated at every wave boundary. Reconciled against reality at W7 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-D — the
production-deployment, design-refinement, backend-convergence-completion, and
cross-repo-cohesion tranche — so the close ceremony can reconcile claim against
artefact without archaeology.

## Completion criterion

Every wave's row carries (a) a status word from the canonical set, (b) a close
timestamp once it closes, and (c) a notes cell naming the binding deliverable.
At W7 close every row reconciles against `FINAL.md`'s gate table.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open · baseline · research dispatch* | planned | — | C confirmed closed; prod-state baseline (the `8818ae5` pre-A gap, dirty tree, empty DB, missing `image_blobs` volume); design-debt + backend-legacy catalogs; δ research dispatched; §8 window ratified |
| Wα — *Research (CRUD cohesion + deploy-safety)* | planned | — | R1 CRUD-CONTRACT v2.0.0 design + fourier↔value.js clause map; R2 prod-deploy-safety on the shared host (dirty-tree reconcile, secret extraction, migration-with-deploy ordering, rollback); optional R3 value.js alignment-tranche shape |
| Wχ — *Challenge* | planned | — | P1 co-tenant blast radius (floridify/palette-api untouched); P2 migration-with-deploy atomic + rollback-safe on real data; P3 cohesion is KISS (no shared framework, inv-16); P4 β stays refinement / γ deletes only dead code |
| W1 — *Prod deploy: A/B/C to production* | provisional | — | thread α — dirty-tree reconcile + secret extraction; deploy-hook wired; hook perms 0664→0600; `image_blobs` volume; the FIRST real A/B/C→prod deploy + migration-in-cutover; recorded commit-to-deploy + rollback transcripts |
| W2 — *Verified-TLS cutover + precepts promotion* | provisional | — | thread α — `gen-mongo-certs.sh` host-run; the `infra/tls.md §9` 3-site diff; live verified-cert ping; the staged precepts promoted into the submodule |
| W3 — *Backend NO-legacy symmetry + transpositions* | provisional | — | thread γ — backend `snapshot_hash` band → slug (flags field+index, 9 admin sites); dead `gallery` stratum deleted; image asset typed (retires the dict shim that caused C9/C10) |
| W4 — *Design refinement* | provisional | — | thread β — `.cartoon-card` resurrected (1 shim → 14 components); upload IA → one dropzone; gallery orphans resolved; light-mode contrast sweep; `:focus-visible` rings; axe light-mode clean. ∥ W3 (web vs api) |
| W5 — *CRUD-CONTRACT v2.0.0 + cohesion* | provisional | — | thread δ — contract v2.0.0 (2 relaxations); fourier flips DEFERRED cells vs live palette-api; value.js alignment ask recorded; colour-lift consume iff published. value.js-side = a value.js tranche (user-gated) |
| W6 — *Test integrity* | provisional | — | thread ε — cross-env Playwright matrix (2 apps × local/dev/prod, prod non-mutating); CI Mongo retires `@requires_mongo` skips; `COMPUTE_RATE_LIMIT` harness |
| W7 — *Close* | provisional | — | reconcile PROGRESS; FINAL cites commits + gates; coordination updated; §8 window restored; CANONICAL-ORDERING → ordering ε |

## Log

### 2026-05-27 — tranche authored (10-lane D-development audit)

**WHAT.** Following the C close, the user directed a deep 6-agent parallel audit
of the original plan + all changes herein, devising the path forward, with: NO
quick solutions / NO workarounds / idiomatic-gestalt / architectural-transpositions
DESIRABLE / NO legacy code; fold deferred + chronic items; recap ALL prompts;
**tranche development only**; **prod SSH available — integrate + deploy all of the
above**; a further **4-agent design wave (frontend-design plugin)** analysing every
screen; a **cross-repo palette/visualization CRUD cohesion** pass auditing value.js;
and **Playwright validation of both apps across local/dev/prod**.

The audit ran as 6 lanes `DA1`–`DA6` + 4 design lanes `design/DA-design-A1..A4` +
a live `validation-matrix.md` (screens captured) at
`docs/audits/runs/2026-05-27-D-audit/` (1,477 + 285 L + the matrix).

**Pivotal finding (DA4).** None of A/B/C is in production — prod serves pre-A
`8818ae5` (2026-03-28) from a dirty host tree (inline plaintext Mongo password),
empty DB, never webhook-deployed; the `image_blobs` `external:true` volume is
absent (a naive deploy would fail). With prod SSH now available, C's host residuals
become D's headline deliverables.

**Other findings folded:** (DA1) C's NO-legacy discharge was frontend-only — the
backend still speaks `snapshot_hash` (flags field+index, 9 admin sites) + a dead
`gallery` collection stratum + the untyped image-asset dict shim that caused
C9/C10 → thread γ. (DA3) value.js ships a live deployed `palette-api` v2.0.0,
divergent on ~11 contract clauses; fourier's `palette_slug` is a live FK into it →
thread δ (value.js-heavy, user-gated). (Design) `.cartoon-card` is a dead class
applied by 14 components; triple upload affordance; gallery orphans; light-mode
contrast cluster; missing focus rings → thread β. (DA5) 39 directives, 0 outstanding.

**Wave set**: five threads (α prod-deploy, β design, γ backend-symmetry, δ CRUD
cohesion, ε test integrity) across W0→Wα→Wχ→W1-W7. Three new invariants by name
(production parity; code-and-migration-together; token-system-single-source).
`CANONICAL-ORDERING` reconciled to ordering ε.

**Prompt disposition (DA5):** 39 directives — 34 addressed/held, 0 partial, 5
routed-to-D, 0 OUTSTANDING.

### Next action

None until the user authorises D.W0. At that point dispatch D.W0 (prod-state
baseline + design/legacy catalogs + δ research dispatch) then Wα (CRUD-contract +
deploy-safety research) → Wχ (four probes) — the research-first gate governs δ +
the deploy-safety before any prod change or implementation wave. **This was tranche
development only; no implementation ran** (the design analysis + Playwright pass
were read-only observation feeding the plan, per the user's "observe now, fold
findings" direction).
