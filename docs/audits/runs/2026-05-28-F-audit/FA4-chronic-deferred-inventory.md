# FA4 — Chronic + deferred inventory

**Lane**: FA4 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: every deferred / chronic / named-residual across A → B → C → D → E (and value.js A → I); classify; fold or REJECT-from-F.

## §1 — Headline numbers

- **Total items inventoried**: **35** (EA2 base) + **10** (E/FINAL §5) + **5** (E.W11 §2 named-residuals) — **deduped to ~33 unique** load-bearing items + the **53 DEFERRED-TO-VALUE.JS matrix cells** (X1, now ADDRESSED by I/W1-W4).
- **By class**:
  - **CHRONIC-3+**: 4 (C1, C5, C6, C8) — all 4-gate now 5-gate after E held
  - **CHRONIC-2**: 4 (C2, C3, C4, C7, C9) — most now downgraded by E's I-cohort discharge
  - **NEW-IN-E**: 7 (E1-E7 below)
  - **OPERATOR-COORD**: 5 (T-S3 host-flip, FULL rename, :8140 vhost, dispatcher arm, dangling-image sweep)
  - **CROSS-REPO**: 3 (csp-solver, floridify, glass-ui C5/C6)
  - **DOC-ONLY**: 1 (C9 numbering)
  - **POST-COHORT-HYGIENE**: 3 (T-P3 metrics, per-call adoption, Idempotency-Key API middleware, cross-env Playwright matrix)
  - **REJECT-FROM-F candidates**: 6 (see §4)

## §2 — Deferral ledger

| ID | Item | First | Latest | Class | Owner | F disposition |
|---|---|---|---|---|---|---|
| **C1** | colour-lift `sampleToSVGPath` | A.W2.b | E (held) | CHRONIC-5gates | value.js | STAYS-OUT (consumer-half latent until publish) |
| **C2** | Palette/colorScale domain model | B.W2 | E (held by inv-15) | CHRONIC-4gates | value.js | STAYS-OUT |
| **C3** | 53 DEFERRED-TO-VALUE.JS cells | B.W1 | E (DISCHARGED via I.W1-W4) | DISCHARGED | — | ledger close only |
| **C4** | onnxruntime CPU warning flood | A.W3.5 | E (held) | CHRONIC-4gates | F-opportunistic | F.W0 one-liner `ORT_LOGGING_LEVEL=3` |
| **C5** | glass-ui substrate carries (7-item) | A.W0 | E (held) | CHRONIC-5gates CROSS-REPO | glass-ui | STAYS-OUT (CONSTELLATION discipline) |
| **C6** | glass-ui `style.css:3` cold-boot race | A.W3.5.d | E (held) | CHRONIC-5gates CROSS-REPO | glass-ui | STAYS-OUT |
| **C7** | 6 §U conformance strikes | B.W1 | E (held) | CHRONIC-3gates | — | WONTFIX-revive-if-built |
| **C8** | Cross-cohort infra plan (constellation-wide) | 2026-03-28 | E (host subset done) | CHRONIC-5gates | host-ops | F.W0 host-ops sweep (dangling + :8140); rest STAYS-OUT |
| **C9** | inv-18/19/20 numbering | C | E (DOC deferred) | DOC-ONLY | F.W0 or W12 | F doc-hygiene fold (one PR) |
| **N1** | dispatcher value.js arm latent-broken | D.W11 | E (T-S3 LIVE, host-flip deferred) | OPERATOR-COORD | operator | **F.W3 host-window: DELETE arm + webhook** |
| **N2** | CF wildcard `*.babb.dev` footgun | D.W10 | E (held) | NEW-IN-D-FOOTGUN | F-opportunistic | F.W0 narrow at next DNS surface |
| **N3** | W11 FULL palette-api → color rename | D.W11 | E (held) | OPERATOR-COORD CROSS-REPO | operator | STAYS-OUT (cosmetic-only; URL-layer GREEN) |
| **N4** | csp-solver `useApi.ts` VITE_API_URL | D.W9 | E (ASK only) | CROSS-REPO | csp-solver | STAYS-OUT (1-line ASK; not F's) |
| **N5** | keyframes.js GH-Pages teardown | D.W9 | E (DISCHARGED via cohort cutover) | DISCHARGED | — | — |
| **N6** | value.js GH-Pages teardown | D.W9 | E (DISCHARGED via I cohort) | DISCHARGED | — | — |
| **N7** | floridify Mongo-bind upstream commit | D.W1 | E (named-residual) | CROSS-REPO | floridify | STAYS-OUT |
| **N8** | palette-api compose upstream | D.W1 | E (LANDED at value.js f3a67a9) | DISCHARGED | — | — |
| **N9** | `test_backfill_image_bounds_on_migrated_image` | D.W3 | E.W10 (ROOT-CAUSED + FIXED) | DISCHARGED | — | — |
| **N10** | Frontend bundle 854 kB single chunk | D.W6 | E.W7 (DISCHARGED via T-P1, 6 chunks) | DISCHARGED | — | — |
| **N11** | Deploy-hook migration auto-run | D.W1 | E.W9 (DISCHARGED, GREEN-pending-real-test) | DISCHARGED-pending-proof | — | F.W0 ledger note only |
| **E1** | T-S3 host-flip dispatcher retire | E.W8 | E.W11 (deferred) | OPERATOR-COORD | operator | F.W3 host-window: schedule + pair with N1 |
| **E2** | Cross-env Playwright matrix → GREEN | D.W6 | E.W10 (DEFERRED to F) | POST-COHORT-HYGIENE | F | F.W-test: cross-env matrix sweep |
| **E3** | Compute cache hit-rate instrumentation | E.W7 | E.W12 | POST-COHORT-HYGIENE | F | F.W2: metrics emission (rides F-β) |
| **E4** | Per-call-site adoption If-Match/Idempotency-Key | E.W5+W6 | E.W12 | POST-COHORT-HYGIENE | F or I-tail | TARGETED ~5 call-sites at F-W7 |
| **E5** | Idempotency-Key API-side middleware | E.W4 | E.W12 (CARRY) | POST-COHORT-HYGIENE | F or I-tail | STAYS-OUT (must-NOT) |
| **E6** | Per-repo conformance suite (value.js side) | I.W4 | E.W12 | CROSS-REPO POST-COHORT | value.js-J | STAYS-OUT (T7 cross-repo probe covers it) |
| **E7** | `id` field hard-removal from palette envelope | I.W4 | E.W12 | CROSS-REPO | value.js-J | STAYS-OUT |
| **X4** | Dispatcher arm coordination | D.W11 | E.W11 | OPERATOR-COORD | merges with N1 | F.W3 host-window |
| **dead :8140 vhost** | speedtest cleanup | D.§6.4 | E.W11 | OPERATOR-COORD | operator | F.W3 sweep (1-liner `a2dissite`) |
| **dangling images sweep** | D.§6.4 | E.W11 (LANDED -1.208 GB) | DISCHARGED | — | — |

## §3 — CHRONIC-3+ items (load-bearing F-input)

- **C1** colour-lift `sampleToSVGPath` — 5 gates. History: filed at A.W2.b (2026-05-18); cross-repo orphan because value.js shipped D/E/F/G/H/I without exporting the helper. **F disposition: STAYS-OUT.** F is not value.js's tranche; the no-silent-orphan check in `easings.ts` already enforces honesty. Discharge requires a value.js publish wave — not F's mandate.
- **C5** glass-ui substrate carries (7 items) — 5 gates: A→B→C→D→E. CONSTELLATION discipline forbids fourier annexation. **F disposition: STAYS-OUT.** Re-state in F.W0 §carries.
- **C6** glass-ui `style.css:3` cold-boot race — 5 gates. Same root as C5. **STAYS-OUT.**
- **C8** cross-cohort infra plan — 5 gates; the `project_infra_plan.md` is now 91 days stale. fourier-bound subset is fully done. **F disposition: STAYS-OUT for constellation-wide;** the fourier-relevant residue (dangling images, :8140 vhost) is a 1-session host-ops sweep at F.W3.
- **C4** onnxruntime warnings — 4 gates, cosmetic. **F disposition: SCHEDULE at F.W0** as a 1-line `os.environ['ORT_LOGGING_LEVEL'] = '3'` in `__init__.py`. Cheapest possible discharge; eliminates a 5-gate chronic.

## §4 — REJECT-FROM-F (STAYS-OUT with rationale)

F is post-cohort hygiene, not a catchall. Default to LARGER reject pool.

- **C1, C5, C6** — cross-repo substrate. Fourier-F cannot discharge; only the upstream maintainer can. STAYS-OUT with no-silent-orphan watchdog.
- **C2** Palette domain model — inv-15 binding (no library nobody calls). Zero consumer surfaced in E despite full cohort close. STAYS-OUT.
- **C7** §U strikes — never-built-by-design. KISS. Revive only if built. STAYS-OUT.
- **N3** W11 FULL rename — purely cosmetic; URL-layer is GREEN; operator-coord window. Risk (data-bearing volume orphan) outweighs benefit. STAYS-OUT.
- **N4** csp-solver runtime URL — external maintainer's 1-line. STAYS-OUT (ASK only; recorded).
- **N7** floridify upstream — external maintainer. STAYS-OUT.
- **E5** Idempotency-Key API-side middleware — must-NOT in F per synthesis §4 #14.
- **E6, E7** — value.js-J scope. STAYS-OUT.

## §5 — Top 5 highest-leverage items for F

Ranked by (load-bearing weight × cheapness-of-discharge):

1. **C4 onnxruntime suppression** — 1-line env var; kills a 4-gate cosmetic chronic. **F.W0.**
2. **N1 + E1 dispatcher value.js arm + T-S3 host-flip** — single SSH session; discharges TWO named-residuals (the latent-broken arm + the T-S3 host-flip the operator window). Removes operational fragility documented at W11. **F.W3 host-window.**
3. **C8-host-subset sweep (`:8140` vhost + any stale Apache configs)** — 1-line `a2dissite speedtest.conf` + reload; trivial. **F.W3.**
4. **N2 CF wildcard narrow** — 1 `dns-cf-sync.sh` re-run with the wildcard removed/narrowed; closes the GH-Pages cert footgun. **F.W0.**
5. **C9 invariant numbering reconciliation** — single doc-PR across A.md / B.md / C.md / D.md / E.md + precepts; closes 3-gate cosmetic chronic. **F.W0 or F.W12.**

(E2 Playwright cross-env matrix is the natural larger F-thread; E3-E5 are decorative POST-COHORT-HYGIENE and should ride a consumer-touch wave, not be allocated standalone.)

## §6 — Headline finding

**E's cohort closure (paired with value.js-I) discharged the headline chronic body** — the 53 DEFERRED cells (C3), the N11 deploy-hook auto-migration, the N9 pytest residual, and N10 bundle split all closed — leaving fourier-F a genuinely small operational-hygiene surface (4 ssh-session-sized items plus 1 doc-hygiene PR) over a CHRONIC-5gate residue (C1/C5/C6/C8) that is structurally cross-repo and must STAY-OUT under CONSTELLATION discipline; fourier-F's load-bearing scope is 5 items, not 35.
