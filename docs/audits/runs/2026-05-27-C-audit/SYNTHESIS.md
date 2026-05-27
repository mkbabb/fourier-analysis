# 2026-05-27 — C-development audit synthesis

**Substrate**: 6 read-only lanes (`CA1`–`CA6`, 1,054 L) auditing the B plan + the 18 B execution commits + both repos, recapping every prompt, and adversarially guarding the forthcoming tranche-C shape. **Mode**: tranche development only — no implementation. **Authority for the C scope decision**: this synthesis; the per-lane deliverables are the evidence.

## §0 — Verdict

The B execution landed cleanly (CA1: 5 waves as-planned, 3 benign divergences, 1 partial; the `api/lib/crud/` module is genuinely 525 LOC and framework-free; `snapshots.py` deleted; no `snapshot_hash` survives as a backend *identity* scheme). But the audit surfaced **one real precept violation** and a decisive **KISS correction** that together reshape tranche C:

1. **The one B precept violation (CA1 + CA6)** — the slug-identity convergence stopped at the API boundary: the frontend mirrors the slug into DTO fields still *named* `snapshot_hash`, masked by an `as unknown as` cast on a stale `FlaggedListResponse` type. It survived because the B-close grep was scope-limited to two backend files. This breaches **NO-legacy-code / fix-at-ROOT / no-workarounds** — exactly the user's standing precepts. It is the load-bearing reason C must carry a **B-residual discharge** thread.
2. **The colour-lift KISS correction (CA4)** — `colors.ts` has **0 domain symbols** (brand tokens + DOM glue + 2 dup conversions); `easings.ts` has exactly **1** (`generateCurveSVGPath` = the `sampleToSVGPath` candidate). The full `Palette`/`colorScale` lift is **NOT warranted** — fourier has no gradient/scale consumer, so building it is the rejected "library nobody calls" anti-pattern. The headline B residual is therefore *much smaller than feared*: a single narrow function lift, not a domain-model relocation.

**The C scope decision: fourier-C stays fourier-only** — infra hygiene + image-blob storage relocation + the `--reload` infra-residual + the bounded B-residual discharge (the `snapshot_hash` legacy band + conformance honesty). The colour lift's value.js half is a **value.js-tranche deliverable** (narrow: `sampleToSVGPath`), user-re-mandate-gated; fourier-C holds only a **conditional consume** that fires iff value.js republishes during C's window. The cross-repo edge **inverts** (value.js publishes → fourier consumes). This is the unanimous CA2 + CA3 + CA4 + CA6 recommendation.

## §1 — The six lanes, consolidated

- **CA1 — B plan-vs-reality**: backend landing solid + idiomatic; frontend convergence stopped at the API boundary leaving a bounded legacy-name smell papered over by a cast. 3 FINAL.md close-claims read cleaner than the tree (the 15 conformance tests are skip-skeletons; the no-`snapshot_hash` grep was scope-limited; the `FlaggedListResponse` carry is a cast-masked truth gap). Concrete residuals with `file:line` (§3 below).
- **CA2 — deferred/chronic inventory**: 18 items, 6 chronic. Corrections: `storage_budget_gb` config was ALREADY retired at B.W3 (only a NOTE survives); the axe-keystone carry is timing-tuning only (harness exists). Only the `--reload`-aborts-compute item genuinely expands fourier-C beyond its stub. The colour lift's true home is a reopened value.js cohort, not an in-app domain model.
- **CA3 — value.js state + cohort-reopen**: value.js-H CLOSED (v0.10.0, `16129e0`); `I-SEED.md` declares an OPEN thesis with no colour reference — the lift cannot side-fold into I as authored. Verdict **(a-prime)**: a value.js tranche publishes the colour machinery; fourier keeps its `VIZ_COLORS` application choices. Needs a dedicated/forward-themed value.js tranche, user-re-mandate-gated.
- **CA4 — colour-domain lift**: the KISS bombshell (§0.2). Minimal-honest version = the narrow `sampleToSVGPath` lift into `value.js/src/math.ts` (generalising `cubicBezierToSVG`), consumed by `easings.ts`. `Palette`/`colorScale` stay latent affordances (already `CRUD-CONTRACT §9` "0 library") — build when a real consumer lands.
- **CA5 — storage + infra**: C.md anchors DRIFTED (`image_storage.py:97`→`:104`; the `janitor.py:84-119` band-aid is gone; the C.md §7 claim that `storage_budget_gb` config was NOT retired is a **factual error** — it was). Filesystem+nginx is the KISS storage verdict (atomic per-doc cutover → removes the brittleness window). Infra W1/W2/W3 valid; the janitor audit-log gap is real; the thumbnail is a second blob C.md doesn't name; `deploy.sh` has a health-check port bug (8091 vs live 8100). The `--reload` item is dev-only → C.W0 baseline + C.W3 sub-task.
- **CA6 — prompts/precepts + guard**: 27 directives — **23 ADDRESSED, 3 PARTIAL, 1 ROUTED-TO-C, 0 OUTSTANDING**. One precept VIOLATION (the `snapshot_hash` DTO band, §0.1). Top guardrail: **C must NOT build a `Palette`/`colorScale` domain model in-app** (inv-15 + library-nobody-calls). Recommended scope boundary: C stays fourier-only; the colour lift is a value.js-tranche deliverable + a conditional fourier-consume wave. CANONICAL-ORDERING stale in 11 rows → re-author as ordering γ.

## §2 — Tranche C scope (expanded, folded)

C is **fourier-only**, four threads, sequenced so infra precedes the storage migration that depends on it:

- **Thread α — infra hygiene** (existing): webhook CI/CD + secret extraction; MongoDB TLS + port standardization (incl. the `deploy.sh` health-check port bug); janitor audit-log + recovery hardening (incl. the `--reload`-aborts-compute fix).
- **Thread β — image-blob storage relocation** (existing, refined): filesystem+nginx (KISS, atomic cutover); the gate corrected (config already retired; thumbnail is a second blob; recency-prune already bounds staleness).
- **Thread γ — B-residual discharge** (NEW — the "NO legacy code" fold): rename the `snapshot_hash` DTO band → slug end-to-end + remove the `as unknown as` cast + reconcile `FlaggedListResponse` to the cursor envelope; fill-or-retire the 15 conformance skeletons honestly; the e2e axe-keystone settle-wait. This discharges the one precept violation.
- **Thread δ — conditional colour-consume** (NEW — narrow, conditional): iff a value.js tranche publishes `sampleToSVGPath` during C's window, fourier consumes it (collapsing the `easings.ts` internal dup); otherwise it remains a named residual. `Palette`/`colorScale` held latent.

## §3 — Concrete B residuals C must address (with `file:line`)

- `snapshot_hash` DTO-name = slug (legacy band): `web/src/stores/gallery.ts:29,37`; `web/src/stores/workspace.ts:33,364`; `web/src/lib/types.ts:88-95,115-127,191-199,201-206`; `web/src/lib/api.ts:577,582,694,698`; `web/src/components/visualization/gallery/AdminFlaggedPanel.vue:53-60` (+ ~16 gallery-component consumers).
- 15 unfilled conformance skeletons: `api/tests/conformance/*.py` (skip-stubs; the matrix is ~5% empirically bound at its own cited paths).
- Migration proof is `@requires_mongo`-gated on a 5-row seed (live DB empty) — needs a CI Mongo or a non-vacuous fixture.
- `image_storage.py:104` inline `Binary(content)` write (Thread β target); the thumbnail second-blob.
- `deploy.sh` health-check port bug (8091 vs 8100).

## §4 — Cross-repo colour-lift (the value.js side; inverted edge)

The colour lift is now **value.js-authored, fourier-consumed** (edge inverts vs the original B plan). The value.js side is a **narrow** deliverable (per CA4): `sampleToSVGPath(fn, n)` in `src/math.ts` (generalising `cubicBezierToSVG`). The richer `Palette` domain type + `colorScale` are real modelling but **premature** — held as latent affordances (the ratified `CRUD-CONTRACT §9` already records them "0 library"), built when fourier (or another consumer) actually samples a gradient. This requires a value.js user-re-mandate (value.js-I forward-themed, or a dedicated value.js tranche); fourier-C does not author value.js's tranche — it records the cross-repo ask in `coordination/` and holds Thread δ conditional. CA3's sketched value.js wave-set (if the user mandates the *full* lift): I.W0 reopen → I.W1 `sampleToSVGPath` ∥ I.W2 `colorScale` → I.W3 `src/palette/` → I.W4 publish + conformance → I.W5 close. KISS default: only I.W1 (`sampleToSVGPath`) is warranted today.

## §5 — Prompts + precepts disposition

27 directives, 0 outstanding (CA6 ledger). Every A/B-era prompt ADDRESSED; the C-era directive is in-flight (this round). The single precept VIOLATION (the `snapshot_hash` DTO band) is ROUTED-TO-C Thread γ — its discharge is C's compliance restoration. All other precepts (idiomatic-gestalt, architectural-transpositions, fix-at-ROOT, deep-parallelization, archaic-diction, em-dashes, no-fallbacks) hold across the B landing and the planned C.

## §6 — CANONICAL-ORDERING reconciliation (ordering γ)

CANONICAL-ORDERING.md is stale in 11 load-bearing rows. Corrected state: fourier-A CLOSED (`c7cfd82`); fourier-B CLOSED (`fc5b3b0`); value.js-H CLOSED (v0.10.0, `16129e0`); the cohort orphan verdict SETTLED (value.js-C RETIRED); fourier-C AUTHORED + expanded (this round). **The cross-repo edge inverts**: the original `fourier-B.W4 → value.js-C.W1` (fourier consumes value.js) is severed; the new latent edge is `value.js-I.W1 (publishes sampleToSVGPath) → fourier-C Thread-δ (consumes)`, conditional + user-gated. The synthesis re-authors CANONICAL-ORDERING as ordering γ (post-B-close, fourier-C-active, value.js-I-seeded).

## §7 — Path forward (next action)

This is tranche development. The artefacts produced this round: this SYNTHESIS; the **expanded `C.md`** (folding Threads γ + δ, correcting the drifted anchors, adding the legacy-discharge invariant, inverting the cross-repo edge); the reconciled `CANONICAL-ORDERING.md`; the updated `C/PROGRESS.md`; the `coordination/` cross-repo-colour-lift note; and `CA6`'s prompt ledger as the standing recap. The C wave specs harden at Wχ per the research-first discipline. **No implementation dispatches until the user authorizes C.W0** — and C's research-first gate (W0 → Wα → Wχ) governs the infra+storage threads exactly as B's did.
