# CONSTELLATION.md — the single orchestration manifest

**What this is.** The one durable source of constellation-coordination truth. Every session — the orchestration lead (fourier) and every repo arm — re-grounds from THIS file after a compaction, then executes its arm. It is the index, not a duplicate: the contracts live in their design docs, the ledger in `ADOPTION-ASKS.md`, the order in `CANONICAL-ORDERING.md`; this manifest names them and binds the roster to its boundaries.

**Authored** 2026-06-02 (fourier the hub; written under inv-16 — fourier owns `docs/constellation/`). Reconcile against reality whenever a member's tranche head moves.

**The one-line model.** A loose federation of independent tranche-streams, plus **one synchronized cohort** (fourier-J ↔ value.js-J, with glass-ui as the shared hub). `inv-16` (write-only-your-own-repo) is what makes the streams collision-free; you may run as many sessions as you have repos.

**Path convention (load-bearing — this manifest is read by sessions in OTHER repos).** References to **your own repo** are relative to your cwd (e.g. `docs/tranches/...`). References into the **fourier hub** (this manifest, the cohort contracts, the ledger, the audits) are **absolute** under `HUB = /Users/mkbabb/Programming/fourier-analysis/`. The §5 re-ground command and every cross-repo path in §3/§4/§8 are absolute so a non-fourier session resolves them verbatim. The manifest itself is `/Users/mkbabb/Programming/fourier-analysis/docs/constellation/CONSTELLATION.md`.

---

## §1 — The roster (verified 2026-06-02; cohort heads RE-GROUND 2026-06-04 — see §9)

> **⚠ Re-ground 2026-06-04 (§9): every cohort head below MOVED.** glass-ui SHIPPED **3.2.0** (tranches AQ→AR→AS; `06b35d9`, npm `latest=3.2.0`); value.js ran J→K→**L CLOSED** (`66dcd68`); keyframes SHIPPED **3.0.0** (`c66e6f3`). The "J authored / awaits Begin / g.w5 release wave" cells are STALE — read them with §9's correction. The deploy spine is the live outlier: STUCK at `f2fe447`, 29 commits behind.

| Repo | Identity | Tranche head | State | Tier | Write boundary | Deploy |
|---|---|---|---|---|---|---|
| **fourier-analysis** | the paper + viz-server (FastAPI/Vue) | **J authored** (`7bbaa51`, 1 unpushed); 2026-06-04: J authored + executed (W2 CORE), K-deploy authored | clean | **Cohort lead** | `fourier-analysis/**` + `deploy/**` | push → webhook |
| **value.js** | palette / color-api (Hono) | ~~J authored~~ → **J EXECUTED+GREEN → K CLOSED → L CLOSED** (`66dcd68`, 2026-06-04) | branch `docs/constellation-grand-audit-2026-06-03`, dirty (precepts) | **Cohort twin** | `value.js/**` | own chain |
| **glass-ui** | shared design system (reka-ui) | ~~lineage→V; `g.w5` release wave~~ → **3.2.0 PUBLISHED** (AQ→AR→AS; `06b35d9`) | clean | **Cohort hub / publisher** | `glass-ui/**` | npm publish |
| **speedtest** | speedtest.friday.institute | tranche-AT, WAVE-C (`f4b95e54`) | dirty ×157 (heavy) | Independent sibling | `speedtest/**` | own chain |
| **keyframes.js** | `@mkbabb/keyframes.js` engine | ~~A authored~~ → **3.0.0 PUBLISHED** (tranche B; `c66e6f3`) | clean | Supplier → glass-ui | `keyframes.js/**` | npm publish |
| **words / Floridify** | dictionary app (`floridify-workspace`) | A, WAVE-C (`83da49e`) | dirty ×21 | Independent | `words/**` | own chain |
| **muster** | CSP / sudoku (csp-wasm) | **A–K**, WAVE-C (`f5d476e`) | dirty ×87 (heavy) | Independent | `muster/**` | own chain |
| **deploy** | the deploy spine (deploy.babb.dev) | — (no tranches); **babb.dev API host STUCK at `f2fe447`, 29 behind** (the live chronic) | clean repo (`3c3fbd2`) | Infrastructure | `deploy/**` (fourier-owned) | — |

Ordering letters differ by lineage and do NOT cross: fourier = Greek (`μ′` = J head → `ν′` = K-deploy, `CANONICAL-ORDERING §19/§20`); value.js = its own A–L; glass-ui = uppercase→AS; speedtest = tranche-AT; muster = A–K; words = A; keyframes = A→B. There is no global letter; the only cross-repo synchronization is the §3 cohort (now re-grounded, §9).

---

## §2 — The boundary law (what makes parallelism safe)

1. **inv-16 — write only your own repo.** Each session's commits touch ONLY its boundary cell (§1). fourier additionally owns `deploy/**`. This single rule is the parallelism guarantee: N sessions, zero write-collisions.
2. **inv-26 — one contract source.** Cross-repo contracts live in **one** place (fourier) and are *read* by consumers — never copied, never codegen'd. Edit the contract once; consumers re-read.
3. **inv-16′ — authorized cross-repo sweep, never silent.** A cross-repo arm is NAMED + ledgered in `ADOPTION-ASKS.md`, executed on the target's **own clean checkout**, gated on the target's **own green CI**. **Never write a mid-flight (dirty) sibling tree** — it entangles uncommitted work. The heavy-dirty repos (muster ×87, speedtest ×157, words ×21) reconcile their tree *first*.
4. **inv-27 — green-means-green, per repo.** Every "done" cites that repo's own green CI run id covering every job. No cross-repo green claim.

---

## §3 — The cohort (the only synchronized work) — RE-GROUND 2026-06-04 (§9)

> **⚠ This §3 "wait for glass-ui" model is OBSOLETE (re-ground 2026-06-04).** glass-ui SHIPPED 3.2.0; value.js's CORE half is two tranches behind it (K, L CLOSED); the supplier (keyframes) published 3.0.0. **value.js owes the cohort NOTHING further** — its contract bound, its `/diff` envelope proven, its publish peer + [P0] filter shipped + deepened in L. The "design waves wait for glass-ui's release" edge is DISSOLVED: glass-ui's primitives are PUBLISHED and the fourier adoption is a one-line `^3.1.0`→`^3.2.0` ADOPT-NOW bump, not a wait. The only remaining cohort act is **fourier's OWN** adoption + its own `/diff`+publish conformance probe + the paired-close parity computation. See §9 + `ADOPTION-ASKS.md §10`.

**fourier-J ↔ value.js-J**, with **glass-ui** as the hub. Symmetric-by-contract, asymmetric-by-implementation; close **paired** — except the cohort is now asymmetric-in-TIME: value.js-J's obligation is DISCHARGED (it sprinted J→K→L), fourier-J's close is GATED ON FOURIER'S OWN WORK (the bump + the consumer-wire + the inv-27 green).

- **The shared contracts (fourier owns; value.js binds, read-only — absolute hub paths):**
  - `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/J/design/J-diff-shape.md` — the canonical `/diff` envelope (`{fromHash,toHash,ops,identical}`; op vocab `added`/`removed`/`changed`; pattern name `atomdiff`). Both impls + both conformance probes assert against THIS doc, never against each other. **value.js's conformance probe BINDS this doc + proves its half** (`value.js/api/test/conformance/diff.test.ts`); fourier's OWN Python probe is the remaining half.
  - `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/J/design/J.W1c-publish-visibility.md` — the publish/unpublish facet (idempotent in-place flag-flip; NEVER a new row). value.js built the symmetric peer + the [P0] `visibility="public"` filter fix — **DONE in value.js-L** (`crud-list.ts:114`).
  - `/Users/mkbabb/Programming/fourier-analysis/docs/constellation/ADOPTION-ASKS.md §7/§10` — the two value.js arms (`valuejs-J-atomdiff`, `valuejs-J-publish`) are now **DONE-in-sibling** (flipped §7/§10); the `glass-ui-P5-inner-rounding` ask is **KILLED-AS-PHANTOM** (struck — container-owned by design).
- **The dependency edges (re-grounded):**
  - The **CORE backend** (fourier W2 remix+publish; value.js W2) depends on *nothing* but the already-committed `J-diff-shape.md` → runs immediately, in parallel. value.js's is DONE.
  - The **design waves** (fourier W5 WC) consume glass-ui's **ALREADY-PUBLISHED 3.2.0** primitives (`asideSide`, `useTextHighlight` on `/dom`, `inert`, the useId dock fix) via the ADOPT-NOW bump — they no longer WAIT on a glass-ui release. A-1/A-2 are the only outstanding glass-ui asks (BOOK-to-AT/3.3.0; non-blocking).
  - fourier↔value.js sync is **read-time only** (value.js reads fourier's contract). No write crosses.

---

## §4 — Execution arms (each session's perimeter + first move)

Every arm: re-ground from the named docs (context may be compacted), orchestrate each wave with parallel agents/workflows, write only your boundary cell, gate on your own green CI. NO workarounds — idiomatic/gestalt, no legacy.

| Repo | Arm | First move | Re-ground reading |
|---|---|---|---|
| **fourier** | tranche J, W0→W8 | verify W0/W1 (authored) → cross DEV/IMPL → **W2 CORE**: `canonical_digest` (§12) → `§11` ordered-writes remix → publish (J.W1c) | `docs/tranches/J/{J.md,PROGRESS.md,design/*}`, `docs/audits/runs/2026-06-02-J-deep-audit/J-deep-audit.md`, memory |
| **value.js** | tranche J, W0→W5 | reconcile tree → W0 terminal verdicts (KILL VAL-9; BOOK VAL-1 kill-date; CH-6) → atom-diff over `PaletteColor[]` bound to `J-diff-shape.md` → publish peer + the crud-list.ts:85 filter | own `docs/tranches/J/*` + the fourier contracts (§3, absolute path) + memory |
| **glass-ui** | `g.w5` release + the 2 booked asks | finish/commit the 5-dirty → **P5 inner-section rounding at the `ConfiguratorLayer` root** (the literal CANON; outer was b6d6cf4) + the a11y `inert` ask → **publish a release** (unblocks the cohort WC waves) | own tranche/AQ docs + `/Users/mkbabb/Programming/fourier-analysis/docs/constellation/ADOPTION-ASKS.md` (the `glass-ui-P5-inner-rounding` + a11y rows) |
| **speedtest** | own tranche-AT | **reconcile the 157-dirty tree FIRST** → forms-semantics (`<form>`, `inputmode`, `autocomplete`) + security (HSTS, Permissions-Policy on geolocation) | own `docs/tranches/*` + `/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-06-01-modern-web-audit/` (the speedtest findings) |
| **keyframes.js** | own tranche A | execute A (bbnf-format, CI repair, EasingResolvable, engine modern-web) | own `docs/tranches/A/*` + memory. *Role: glass-ui's spring supplier — read-only upstream; never write glass-ui.* |
| **words/Floridify** | own tranche A | reconcile the 21-dirty tree → execute A; fold the floridify-Mongo-bind ask here if owned | own `docs/tranches/A/*` + memory |
| **muster** | own tranche K (A–J closed-ish) | **reconcile the 87-dirty tree FIRST** → continue K; fold the csp-solver-routes ask if owned | own `docs/tranches/K/*` + memory |
| **deploy** | infra-only | change only when the deploy spine needs a fix (fourier-driven) | `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md` |

---

## §5 — The orchestration protocol (driving from one session)

**This fourier session is the orchestration lead.** It owns: this manifest, fourier's own arm, the canonical contracts (§3), and the live state tracker (§7). It does **not** write across the boundary (inv-16). Two modes:

- **Mode A — federated (default; matches the open sessions in fourier/glass-ui/value.js/speedtest).** Each repo's own session reads `CONSTELLATION.md §4`, executes its arm, gates on its own CI. The lead coordinates: holds the contracts, answers cross-repo questions, updates §7, and calls the cohort paired-close when both J arms are green. Per-session command collapses to:
  > `/effort ultracode. Read /Users/mkbabb/Programming/fourier-analysis/docs/constellation/CONSTELLATION.md, find your repo in §1/§4, re-ground from its reading list, and execute your arm — orchestrating each wave with parallel agents/workflows. inv-16: write only your own repo. Gate on your own green CI. No workarounds, idiomatic, no legacy.`
- **Mode B — worktree orchestration (single session drives a cohort arm).** The lead spins a **clean worktree** of a cohort repo and drives its arm there, gated, for review — **only** for clean/light-dirty repos (value.js ×3, glass-ui ×5), and **only if that repo is not being driven in its own session** (no double-driving). Heavy-dirty independents (muster/speedtest/words) are out of scope for Mode B until they self-reconcile. This is the inv-16′ "executed-on-clean-checkout" path made local.

**The lead may always run READ-ONLY constellation-wide work** (audits, analysis sweeps) via agents across all repos without touching the boundary.

**Compaction protocol.** After any compaction, the lead re-reads this manifest + `docs/tranches/J/*` + memory; each arm re-reads this manifest + its §4 reading list. Durable artifacts over recalled context — always.

---

## §6 — Sequencing (what runs when)

1. **Now, fully parallel (no inter-dependency):** fourier-J CORE (W2), value.js-J CORE (W2), glass-ui (`g.w5` + P5/a11y), speedtest, keyframes.js, words, muster — each on its own arm. The CORE backends need only the already-committed `J-diff-shape.md`.
2. **Gated on glass-ui's release:** fourier W5 (WC) + value.js WC — they consume glass-ui's published primitives. Start them when glass-ui ships.
3. **Cohort paired-close:** when fourier-J and value.js-J are both green, the lead verifies the `/diff` + publish envelope parity (against `J-diff-shape.md`) and closes both → `FINAL.md` each + `CANONICAL-ORDERING → μ′`.
4. **Coordination chronics (maintainer-owned, inv-16):** the dispatch-hook migration, CI adoption, csp-solver routes, floridify Mongo-bind — fold into muster/words/speedtest arms as they run; tracked in `ADOPTION-ASKS §3/§4`; fourier holds no lever.

---

## §7 — Live state tracker (the lead updates this)

| Repo | Arm | Status | Green CI | Notes |
|---|---|---|---|---|
| fourier | J W0→W8 | **authored, awaits Begin** | — | 1 unpushed commit (`7bbaa51`); the fold is complete |
| value.js | J W0→W5 | **authored, awaits Begin** | — | binds to fourier's `J-diff-shape.md`; reconcile tree first |
| glass-ui | g.w5 + P5/a11y | mid-flight | — | its release gates the cohort WC waves |
| speedtest | tranche-AT | mid-flight (×157) | — | reconcile tree first; independent |
| keyframes.js | A | authored, clean | — | supplier; no J arm |
| words | A | mid-flight (×21) | — | independent; + floridify ask |
| muster | K | mid-flight (×87) | — | independent; + csp-solver ask |

> Update the Status / Green CI cells as arms advance. The cohort closes only when fourier-J **and** value.js-J both cite a green run id and the parity checks pass.

---

## §8 — The pointers (single-source; absolute hub paths; do not duplicate here)

All under `HUB = /Users/mkbabb/Programming/fourier-analysis/`:

- **Contracts:** `HUB/docs/tranches/J/design/{J-diff-shape.md, J.W1c-publish-visibility.md, J.W1-crud-remix.md}`
- **Ledger:** `HUB/docs/constellation/ADOPTION-ASKS.md` (the cross-repo asks + the coordination chronics)
- **Order:** `HUB/docs/tranches/CANONICAL-ORDERING.md` (fourier Greek chain; `§19 = μ′ = J`)
- **Deep-audit substrate:** `HUB/docs/audits/runs/2026-06-02-J-deep-audit/`
- **Deploy facts:** `HUB/docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md` + memory `deploy_operational_knowledge.md`

(`HUB` = `/Users/mkbabb/Programming/fourier-analysis`. Your-own-repo paths in §4 stay relative to your cwd.)

---

## §9 — Re-ground note (2026-06-04): every cohort head moved

This manifest self-mandates (§5): *"Reconcile against reality whenever a member's tranche head moves."* The 2026-06-04 glass-ui-reground deep audit (`/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-06-04-glassui-reground-deep-audit/SYNTHESIS.md`, 6 dimension auditors against the SIBLINGS' ACTUAL HEADS) found **every cohort head had moved past the §1/§3 roster snapshot**, which was authored 2026-06-02 and frozen while siblings sprinted:

| Member | §1/§3 booked (2026-06-02) | ACTUAL (2026-06-04) |
|---|---|---|
| glass-ui | "lineage→V; `g.w5` release wave; the cohort waits for it to ship" | **3.2.0 PUBLISHED** (AQ→AR→AS; `06b35d9`, npm `latest=3.2.0`) — the wait is OVER |
| value.js | "J authored (`2f7fc87`); close paired with fourier-J" | **J EXECUTED+GREEN → K CLOSED → L CLOSED** (`66dcd68`) — two tranches past its cohort obligation |
| keyframes.js | "A authored; at 2.2.0" | **3.0.0 PUBLISHED** (tranche B; `c66e6f3`); glass-ui peer-widened to `^2.2.0\|\|^3.0.0` |
| deploy | "clean (`3c3fbd2`)" | repo clean, but the **babb.dev API host is STUCK at `f2fe447`, 29 commits behind** — the one real live chronic |

**The §3 "synchronized cohort — fourier-J ↔ value.js-J, glass-ui hub waits" model is OBSOLETE.** What re-grounds:

1. **The "wait for glass-ui" edge dissolves to an ADOPT-NOW bump.** glass-ui's primitives are PUBLISHED; fourier consumes them via a one-line `web/package.json` `^3.1.0`→`^3.2.0` + `npm install`. This single bump greens fourier e2e at the source (the useId dock fix), un-`fixme`s the 2 a11y keystones (`inert`), enables DEC-2 controls-LEFT (`asideSide`), and wires `useTextHighlight` (from `/dom`). It belongs at the FRONT of fourier's executable chain.
2. **value.js's cohort obligation is DISCHARGED.** `valuejs-J-atomdiff` + `valuejs-J-publish` are DONE-in-sibling (executed in J, folded into K, hardened through L; the [P0] public filter shipped `crud-list.ts:114`). The only residual is fourier's OWN `/diff`+publish envelope parity probe. value.js's still-open K continuation + dirty precepts submodule are value.js's arm (inv-16) — booked, not fourier debts.
3. **`glass-ui-P5-inner-rounding` is KILLED-AS-PHANTOM** (container-owned by design; struck from `ADOPTION-ASKS.md`). The §3 contract-list reference is corrected.
4. **The asymmetry is in TIME, not contract.** value.js-J cannot wait at a paired close-gate while fourier finishes; the honest re-frame is value.js-J = discharged, fourier-J's close = gated on fourier's own bump + consumer-wire + inv-27 green.

The full re-grounded ASK ledger lives in `ADOPTION-ASKS.md §10`; the terminal chronic ledger + re-sequenced wave skeleton in the audit-run `SYNTHESIS.md §3/§4/§2`.

**inv-16 attestation (§9 re-ground)**: this note edited `fourier-analysis/docs/constellation/CONSTELLATION.md` only (fourier owns `docs/constellation/`); NO sibling repo source, NO host state, NO code. Every cross-repo head cites the sibling's own committed artifact, read-only. fourier's only forward act is the fourier-local `^3.2.0` bump.

(`HUB` = `/Users/mkbabb/Programming/fourier-analysis`. Your-own-repo paths in §4 stay relative to your cwd.)

End of CONSTELLATION.md.
