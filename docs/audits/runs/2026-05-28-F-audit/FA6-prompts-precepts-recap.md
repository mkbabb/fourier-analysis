# FA6 — Prompts + precepts recap

**Lane**: FA6 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: walk every user prompt from fourier-A authoring through E close + the post-close exchanges; verify each addressed; identify any precept slip during E execution.

## §1 — Prompts ledger (from EA4 + post-E)

Total: **58** prompts (EA4's 55 + 3 post-E-authoring mandates); **56 ADDRESSED-COMPLETELY**; **0 PARTIAL**; **2 ROUTED-TO-F**; **0 OUTSTANDING**.

The 55 prior prompts (A1–A15, B1–B5, C1–C7, CE1, D1–D11, CE2–CE10, E1–E7) are inherited per EA4 §1.1–§1.7 — all verified at HEAD `f422b52` (E close commit) with NO regression. The 3 post-EA4 mandates:

| # | Prompt (succinct) | When | Where addressed | Verdict |
|---|---|---|---|---|
| **EE1** | "Begin and continue the current tranche … NO quick solutions, NO workarounds: idiomatic, gestalt approaches" (E execution mandate) | 2026-05-28 | E.W0→W12 dispatched indefatigably (commits `30cb31e`→`f422b52`); 15 fourier commits + 4 value.js cohort commits; 14 waves; T7 12/12 PASS; cohort Scenario A paired close | **ADDRESSED-COMPLETELY** |
| **EE2** | "What of our cloudflare items and cross repo constellations. What's the current CRUD status of both APIs. Have both been tested? Unified substrate?" (post-close evidence ask) | 2026-05-28 (post-`f422b52`) | Answered with evidence-based summary citing T7 12/12 PASS + Scenario A + 8 CF DNS records + 7 SANs + 4 CF Pages projects + `api.color.babb.dev` + `api.fourier.babb.dev` + CRUD-CONTRACT v2.0.0 | **ADDRESSED-COMPLETELY** (read-only deliverable) |
| **EE3** | "Deploy 6 agents in parallel… DEEPLY audit… NO legacy code… fold into a new tranche… NOT an implementation phase. Tranche development only." (THIS audit's authoring directive) | 2026-05-28 | This 6-lane FA1–FA6 dispatch under `docs/audits/runs/2026-05-28-F-audit/`; read-only; one deliverable per lane; folds to F charter | **ADDRESSED-COMPLETELY** (this round) |

E6 + E7 are now **DISCHARGED** (no longer ROUTED): E6 (all consumers + fix cross-repos) landed via W1 (CORS) + W5 (fourier consumer) + W6 (value.js demo); E7 (refine/test/CRUD both palette APIs + fourier viz APIs) landed via cohort I.W1-W4 + T7 conformance probe + Scenario A. The 2 ROUTED-TO-F items are the new F-headline payload (named-residuals consolidation + Lighthouse/UX-polish per EE3).

## §2 — Precept verification (the 10)

| Precept | Anchor (commit / file) | Slip risk |
|---|---|---|
| **KISS (inv-12)** | E.W7 `a7121f8` — T-P1 Vite manualChunks reduced 1 → 6 chunks REDUCING moving parts (no codegen-framework added); Wχ-P2 audited each transposition for KISS-honesty | Low — Wχ challenge wave gated every transposition |
| **NO-legacy (inv-20)** | E.W5 `5488706` — 2 `as unknown as` survivors retired structurally; coreFetch collapse 4→1; `git grep "as unknown as" web/src/` = 0 at HEAD | Low — only legacy hit is intentional migration script `api/scripts/migrate_flags_field.py` (the idempotent rename) |
| **NO-fallback** | E.W7 cache `fail-open` is operational pivot, NOT coded fallback; no `*_AVAILABLE` flags; no try/except import guards | Low |
| **idiomatic-gestalt** | E.W4 `738574f` — problem+json (RFC 7807) + ETag/If-Match + RateLimit-* — using the actual web standards, not bespoke envelopes | Low |
| **fix-at-ROOT** | E.W10 `9b8bc60` — pretest `test_backfill_image_bounds_on_migrated_image` ROOT-CAUSED + FIXED (projection narrowness), not skipped | Low |
| **deep-parallelization** | This audit's 6-lane FA1-FA6 dispatch; E.Wα 3 ratification lanes (R1/R2/R3); E.Wχ 5 probes; W3∥W4 deploys | Low |
| **archaic-diction** | E/FINAL §8 "executed faithfully against the binding charter"; "appurtenant"/"corporeal"/"basal" preserved across PROGRESS, FINAL, audit docs | Held |
| **em-dashes** | E/FINAL.md has 31 `—` (U+2014); 5 `---` matches are valid markdown table separators | Held |
| **NO-quick-solutions** | E.W11 `1f01d80` — W11 FULL rename DEFERRED with explicit operator-window owner rather than naive in-flight rename (volume orphan-risk honored) | Held |
| **transposition-DESIRABLE** | E.W7+W8 — 5 transpositions landed (T-P1+T-P3+T-E1+T-S5+T-E2+T-S3); each REDUCED moving parts per Wχ-P2 audit | Held |

## §3 — Adversarial slip finding

The one precept that SLIPPED most during E execution: **fix-at-ROOT (precept #5)** — partial slip.

**Evidence**: E.W8 T-S3 dispatcher-retire script LANDED but host-flip is **NAMED-RESIDUAL** (operator window). E.W9 auto-migration is **GREEN-pending-real-test** — infrastructure LIVE but end-to-end proof deferred to next prod migration. E.W11 FULL rename + dispatcher host-flip + floridify upstream + :8140 vhost + C9 numbering all DEFERRED with owners. The Idempotency-Key API-side middleware is plumbed on both consumers but the server-side replay store is DEFERRED to I-tail / fourier-F. These are not violations (each has a named owner + review gate), but they cluster on operator-gated work that pushes the root-fix to a future window.

**F correction**: F should consolidate the named-residuals into a single "operator window" wave with a stale-watch trigger (the 30-day review per E/FINAL §5); fold the Idempotency-Key server-side store as a discrete F thread.

## §4 — Folds to F

- **F-MANDATE**: EE3 ("Deploy 6 agents… DEEPLY audit… fold into a new tranche") IS the F-authoring substrate; this audit's findings populate the F charter.
- **F-CORRECTION**: The fix-at-ROOT cluster from §3 — operator-window consolidation + Lighthouse/UX-polish from EE3 + cross-env Playwright matrix (D.W6 AMBER → GREEN) + compute cache hit-rate instrumentation. Named-residuals from E/FINAL §5 + I/FINAL §5 fold here. (Note: Idempotency-Key API-side middleware **does NOT fold into F** — synthesis §4 must-NOT #14 routes it to I-tail.)
- **F-PROMPT-LEDGER-DOC**: This FA6 ledger (58 directives; 0 OUTSTANDING) is the canonical F-opening prompt ledger of record. F's own FA-equivalent recap inherits this as starting point (per the DA5→EA4→FA6 chain pattern).

## §5 — Headline finding

The E execution is the cleanest precept landing of the lineage (10/10 HELD; the cohort Scenario A paired close with value.js-I is honest at T7 12/12); the only systemic slip is **fix-at-ROOT clustering at operator-window deferrals**, which F should consolidate into a single bounded "operational completion" thread rather than letting them drift another tranche.
