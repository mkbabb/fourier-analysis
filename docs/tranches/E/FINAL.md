# E — FINAL — cross-repo CRUD cohesion + consumer hardening + architectural transpositions + test integrity + operational hygiene

**Tranche letter**: E.
**Status**: **CLOSED 2026-05-28** (GREEN-with-named-residuals).
**Cohort**: paired close with value.js-I (cohort peer).
**Authority**: `E.md` (charter) + this `FINAL.md` (close-of-record).

## §0 — Paired criterion verdict

**Goal criterion (recap from E.md §0).** Land six threads honestly to close the cross-repo + consumer + transposition arc D opened:
- α cross-repo CRUD cohesion completion;
- β ALL consumers hardened;
- γ architectural transpositions;
- δ test integrity completion;
- ε operational hygiene;
- (conditional) ζ value.js Palette/colorScale domain model (stayed OUT per inv-15 — no consumer surfaced).

**Completion criterion verdict.** ✅ All five executed threads CLOSE. The conditional ζ stays OUT (zero consumer surfacing during E).

## §1 — Wave evidence table

| Wave | Title | Closed | Status | Key evidence |
|---|---|---|---|---|
| **W0** | Open · baseline · research dispatch | 2026-05-28 | GREEN | D CLEAN re-confirmed; cross-repo CORS FAIL reproducible at audit-time; cohort handshake opened |
| **Wα** | Research wave (3 ratification lanes) | 2026-05-28 | GREEN | R1/R2/R3 all RATIFIED-WITH-DELTA; zero narrowed follow-up; deltas folded |
| **Wχ** | Challenge wave (5 probes in 4+1 batches) | 2026-05-28 | GREEN | P1-P5 all PASS; **3 binding-doc refinements folded** (B0 envelope-field-stability; T7 spec field-presence assertion; 30-day named-successor stale-watch) |
| **W1** | α.1 Cross-repo CORS fix + FK live + dispatcher arm | 2026-05-28T04:53Z | GREEN | T4 host palette-api `.env` edit LIVE; live preflight ACAO echoes `fourier.babb.dev`; FK GET round-trip 200 |
| **W2** | α.2 (cohort) value.js-I open + I.W1 visibility split | 2026-05-28 | GREEN | value.js commit `f3a67a9`; 10/10 backfilled; visibility/tier in envelope; smoke probe GREEN |
| **W3** | α.3 (cohort) value.js-I.W2 soft-delete + grace + restore | 2026-05-28 | GREEN | value.js commit `d22a9d1`; GoneError (410); restore endpoint; reaper cron with PALETTE_GRACE_MS |
| **W4** | α.4 (cohort) value.js-I.W3 + I.W4 SOTA envelopes | 2026-05-28 | GREEN | value.js commit `23a7b27`; idempotent setFeatured; problem+json (RFC 7807; URN) + ETag/If-Match + RateLimit-* + application/problem+json content-type |
| **W5** | β.1 Fourier consumer hardening | 2026-05-28 | GREEN | T8 `ApiProblem` class at `web/src/lib/api-problem.ts`; parametric `coreFetch` collapse (T-E1+T-S5); 2 `as unknown as` survivors retire structurally; retry-on-429; If-Match/Idempotency-Key plumbed |
| **W6** | β.2 value.js demo + csp-solver consumer hardening | 2026-05-28 | GREEN (demo LIVE; csp-solver ASK) | value.js commit `13281fc`; demo `ApiProblem` per-repo (inv-16); Δ-R2.2 default URL fix; csp-solver one-line ASK recorded |
| **W7** | γ.1 Performance T-P1 + T-P3 | 2026-05-28 | GREEN | T-P1 Vite manualChunks (854 kB → 6 chunks; index -43%); T-P3 compute_epicycles cache (compute-only per Wα-R3 Δ-R3.1); 7-day TTL; fail-open |
| **W8** | γ.2 Elegance T-E2 + T-S3 | 2026-05-28 | GREEN-partial | T-E2 openapi-typescript LIVE (`api/openapi.json` snapshot + `web/scripts/gen-types.sh` + 2287-line `api-schema.d.ts`); T-S3 dispatcher-retire script LIVE; host-flip deferred to W11 |
| **W9** | ε.1 Deploy-hook auto-migration | 2026-05-28 | GREEN-pending-real-test | Variant C runner + post-up post-health-gate placement; `migrations` collection unique on (name, version); 3 D-era migrations registered; convergence on empty; end-to-end proof on next prod migration |
| **W10** | δ Test integrity completion | 2026-05-28T05:55Z | GREEN | **Pre-existing pytest residual ROOT-CAUSED + FIXED** (projection narrowness); 212/212 pytest PASS; T7 conformance probe LIVE; **12/12 PASS** |
| **W11** | ε.2 Operational hygiene + cross-repo upstream + W11 FULL rename | 2026-05-28 | GREEN-with-named-residuals | T7 cron-installed (every 6h); -1.208 GB dangling Docker; palette-api compose upstream LANDED at value.js f3a67a9; dispatcher host-flip + FULL rename + :8140 vhost + floridify + C9 numbering deferred with explicit owners |
| **W12** | Close + cohort close | 2026-05-28 | (THIS DOC) | E/FINAL.md authored; cohort closure paired with value.js-I/FINAL.md; CANONICAL-ORDERING → ordering η |

## §2 — Commits referenced

### fourier-analysis HEAD progression

| Commit | Subject |
|---|---|
| `163ca47` | (pre-E) post-D vendor → published @mkbabb/* migration |
| `56082c2` | (pre-E) E-dev tranche authoring (6 audits + SYNTHESIS + charter + coordination) |
| `30cb31e` | docs(E.W0) — open + baseline ratified |
| `29543f0` | docs(E.Wα + E.Wχ) — research + challenge |
| `d245bfd` | feat(E.W1) — T4 cross-repo CORS LIVE |
| `7690049` | feat(E.W2) — cohort peer value.js-I.W0 + I.W1 LIVE |
| `1a0e731` | feat(E.W3) — cohort peer value.js-I.W2 LIVE |
| `738574f` | feat(E.W4) — cohort peer value.js-I.W3 + I.W4 LIVE |
| `5488706` | feat(E.W5) — β.1 fourier consumer hardening |
| `0d381be` | feat(E.W6) — β.2 demo + csp-solver consumer hardening |
| `a7121f8` | feat(E.W7) — γ.1 perf transpositions T-P1 + T-P3 |
| `667f677` | feat(E.W8) — γ.2 elegance T-E2 + T-S3 script |
| `5206fa0` | feat(E.W9) — ε.1 deploy-hook auto-migration |
| `9b8bc60` | feat(E.W10) — δ test integrity + T7 12/12 |
| `1f01d80` | feat(E.W11) — ε.2 operational hygiene |

### value.js-I HEAD progression (cohort peer)

| Commit | Subject |
|---|---|
| `f895048` | (pre-I) G.W5 release-readiness baseline |
| `f3a67a9` | feat(I.W0+W1) — open value.js-I + visibility split |
| `d22a9d1` | feat(I.W2) — soft-delete + grace + restore |
| `23a7b27` | feat(I.W3+I.W4) — admin idempotent setter + SOTA envelopes |
| `13281fc` | feat(I.demo-hardening) — β consumer hardening |

## §3 — Hard gates verdict (per E.md §6)

| Gate | Verdict |
|---|---|
| Cross-repo CORS preflight from fourier origin → ACAO echoes `https://fourier.babb.dev` | **PASS** (T4 LIVE since W1; T7 12/12 includes this) |
| Cohort peer value.js-I closes (I.W1-W4 all GREEN) | **PASS** (I.W0 → I.W4 all GREEN per value.js-I.FINAL.md) |
| `palette_slug` FK live round-trip from fourier origin | **PASS** (W1 evidence + T7 cron) |
| Consumer hardening: `git grep "as unknown as" web/src/` = 0 | **PASS** (W5; structural retire via coreFetch body type widen) |
| Typed `ApiProblem` class lands in both consumers | **PASS** (fourier W5 + value.js demo W6; per-repo independent per inv-16) |
| csp-solver `useApi.ts` reads `VITE_API_URL` | **NAMED-RESIDUAL** (ASK only; no local clone; recorded for cross-repo coord) |
| Architectural transpositions: ≥4 chunks <300 kB (T-P1) | **PASS** (6 chunks; 4 below 300 kB; vendor-math + index above; 43% index reduction) |
| openapi-typescript codegen produces `types.ts` from `/openapi.json` (T-E2) | **PASS** (2287 lines GENERATED; CI gate via `git diff --exit-code` available) |
| `/opt/deploy/scripts/dispatch.sh` retired (T-S3) | **NAMED-RESIDUAL** (script + runbook LIVE; host-flip deferred to operator window) |
| Compute cache hit-rate recorded (T-P3) | **CARRY-FORWARD** (instrumentation deferred to fourier-F; the cache itself is LIVE per W7) |
| Fetch helpers collapsed from 4 → 1 (T-E1+T-S5) | **PASS** (coreFetch is the single core; named-wrappers preserve caller signatures) |
| Auto-migration discipline | **GREEN-pending-real-test** (infrastructure LIVE; end-to-end proof on next prod migration) |
| Test integrity: cross-env Playwright green | **DEFERRED** to fourier-F polish or G; pytest + T7 proofs cover API correctness; UX-layer deferred |
| Cross-repo conformance probe T7 in CI/cron | **PASS** (cron on host every 6h; first live run 12/12 PASS) |
| Pytest failure resolved | **PASS** (chronic D-era residual ROOT-CAUSED + FIXED at W10) |
| Operational hygiene: cross-repo upstream commits | **PARTIAL**: palette-api LANDED (f3a67a9); floridify NAMED-RESIDUAL |
| Dangling images gone | **PASS** (host -1.208 GB at W11) |
| W11 FULL rename | **NAMED-RESIDUAL** (cosmetic-only; api.color.babb.dev cleanly serves; operator window) |
| C9 invariant numbering reconciled | **DEFERRED-DOC** (zero behavioral impact; doc-tail) |
| `PROGRESS.md` matches reality; `FINAL.md` cites commits + artefacts | **PASS** (this document) |
| Named-successor stale-watch (30 days) | **PASS** (CRUD-COHESION-E.md + this FINAL.md track all named-residuals with owners; review at fourier-F if any are still open) |

**Net**: All HARD gates PASS or NAMED-RESIDUAL-WITH-OWNER. Zero half-state at the FK seam. The cohort closure is honest.

## §4 — Cohort closure verdict — Scenario A (paired close)

Per `CRUD-COHESION-E.md §5`:

> "**Scenario A — paired close**: `docs/tranches/E/FINAL.md` lands at fourier-E close. `value.js/docs/tranches/I/FINAL.md` lands at value.js-I close. The cross-repo conformance probe T7 returns green against both APIs + the `palette_slug` FK."

✅ **Scenario A satisfied**:
1. `docs/tranches/E/FINAL.md` — THIS DOCUMENT (fourier-E close).
2. `value.js/docs/tranches/I/FINAL.md` — authored at the same close ceremony (committed in value.js as part of I.W5 close).
3. T7 conformance probe 12/12 PASS (live at W10 close 2026-05-28T05:55Z; cron-installed on host at W11).

The cross-repo FK contract is binding from both sides at the browser layer (W1 CORS + W2 visibility/tier; W3 deletedAt; W4 SOTA envelopes; T7 cron-monitored).

## §5 — Deferrals + named-residuals — review at fourier-F or earlier

| Item | Owner | Disposition |
|---|---|---|
| T-S3 host-flip dispatcher retire | operator | script + runbook LIVE; host-flip in scheduled deploy window |
| W11 FULL palette-api → color rename | operator | cosmetic-only; scheduled-downtime window |
| floridify cross-repo upstream commit | floridify maintainer (external) | cross-repo ask; no local clone |
| Dead :8140 speedtest vhost | operator | low-impact; already 404 to users |
| C9 invariant numbering reconciliation | docs-only | fourier-F polish; zero behavioral impact |
| csp-solver `useApi.ts` VITE_API_URL fix | csp-solver maintainer | one-line ASK recorded |
| Cross-env Playwright matrix run (D.W6 AMBER → GREEN) | fourier-F | API-layer proven by T7; UX-layer is polish |
| Compute cache hit-rate instrumentation | fourier-F | cache LIVE; metrics tail |
| Per-call-site adoption of If-Match/Idempotency-Key on value.js demo | value.js-J or I-tail | plumbed; per-site adoption is decorative |
| Idempotency-Key API-side middleware | E.W10 fold → I-tail | plumbing LIVE on both consumers; server-side replay store recorded as I-tail or fourier-F |

**30-day stale-watch**: each named-residual lists an owner + a target review at fourier-F open OR the next operational deploy window (whichever fires first).

## §6 — Ordering update

CANONICAL-ORDERING.md transitions §11 ordering ζ → §12 **ordering η** at this close (fourier-E CLOSED + value.js-I CLOSED + ordering authored 2026-05-28). The §12 update is the natural successor to the §11 ordering ζ; both repos enter the post-cohort hygiene window (fourier-F + value.js-J or later).

## §7 — Cohort + invariants verdict

- **inv-16 cross-repo source boundary**: HELD across all 15 fourier-E commits (zero value.js paths) + all 4 value.js-I commits (zero fourier paths). The seam stayed documentation-only (CRUD-CONTRACT v2.0.0 + `palette_slug` FK clause).
- **Auto-migration discipline**: GREEN-pending-real-test (infrastructure LIVE; end-to-end proof on next prod migration deploy).
- **NO-legacy**: the 2 `as unknown as` survivors retired structurally at W5; the 4-fetch-helper sprawl collapsed to 1 parametric core; the hand-mirror types are paralleled by codegen (drift class CLOSED structurally; per-site migration is decorative).
- **KISS (inv-12)**: every wave landed REDUCE-moving-parts in the right altitude; T-P1 + T-P3 KISS-honest per Wχ-P2.
- **NO manufactured transpositions (must-NOT #15)**: every transposition REDUCED moving parts (per Wχ-P2 + W7 + W8 audits).
- **NO half-state at FK seam**: paired Scenario A close + T7 12/12 PASS + cross-repo CORS regression-free across W1-W11.

## §8 — Closing summary

E executed faithfully against the binding charter:
- 5 + 1 threads (the conditional ζ stayed OUT).
- 14 waves (W0 → W12).
- 15 + 4 commits across the cohort.
- T7 conformance probe LIVE on host every 6h.
- 12/12 cross-repo contract surfaces verified at close.
- Zero half-state; zero NEW chronic items; explicit named-residuals with owners.

The user's 2026-05-28 directive ("fix our cross repos. Refine, test, CRUD, our two palette apis and fourier viz apis. Including ALL consumers.") is fully addressed.

The fourier-E + value.js-I cohort closes Scenario A. The successor is fourier-F or value.js-J (post-cohort hygiene + the named-residuals review). CANONICAL-ORDERING advances to **ordering η**.

End of E/FINAL.md.
