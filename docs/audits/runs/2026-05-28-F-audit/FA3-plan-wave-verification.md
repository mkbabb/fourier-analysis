# FA3 — Original plan + wave verification

**Lane**: FA3 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: adversarial re-verification of every E wave (W0 → W12) + the value.js-I cohort waves against current HEAD.
**Discipline**: default to FAIL — find any wave that overclaimed.

## §1 — Per-wave verification (W0 → W12)

| Wave | Close claim | HEAD evidence | Verdict |
|---|---|---|---|
| **W0** | D CLEAN re-confirmed; cross-repo CORS FAIL reproducible; cohort handshake opened | commit `30cb31e`; audit `W0-open.md` present | RATIFIED-AS-IS |
| **Wα** | R1/R2/R3 RATIFIED-WITH-DELTA; deltas folded | commit `29543f0`; `Walpha-research-ratification.md` | RATIFIED-AS-IS |
| **Wχ** | P1-P5 PASS; 3 binding-doc refinements folded (B0/T7-field-presence/30d-stale-watch) | same commit; `Wchi-challenge.md` | RATIFIED-AS-IS |
| **W1** | T4 cross-repo CORS LIVE; ACAO echoes `fourier.babb.dev` | commit `d245bfd`; live preflight returns `access-control-allow-origin: https://fourier.babb.dev` (204) | RATIFIED-AS-IS |
| **W2** | I.W0+I.W1 visibility/tier landed (value.js `f3a67a9`) | live `/palettes/sunset-blaze` returns `visibility: public`, `tier: standard` | RATIFIED-AS-IS |
| **W3** | I.W2 soft-delete + grace + restore (value.js `d22a9d1`) | live envelope carries `deletedAt: null` key | RATIFIED-AS-IS |
| **W4** | SOTA envelopes (problem+json/ETag/If-Match/RateLimit) | live: `etag: "2026-02-26T04:14:26.646Z"`, `ratelimit-limit: 60`, `ratelimit-remaining/reset` present; 404 returns `type: urn:palette-api:problem:not_found`, `status`, `title`, `instance` (RFC 7807 + URN) | RATIFIED-AS-IS |
| **W5** | `ApiProblem` class lands; `as unknown as` survivors retire | `web/src/lib/api-problem.ts` exists; `git grep "as unknown as" web/src/` = **0 source matches** (1 hit is a doc-comment in `equation/api.ts:4` referencing the retire) | RATIFIED-AS-IS |
| **W6** | demo `ApiProblem` per-repo; Δ-R2.2 default URL fix to `api.color.babb.dev`; csp-solver ASK | `demo/@/lib/palette/api/client.ts:28` = `DEFAULT_REMOTE_API_URL = "https://api.color.babb.dev"`; `api-problem.ts` present | RATIFIED-AS-IS |
| **W7** | T-P1 Vite manualChunks (4+ chunks) + T-P3 compute cache | `web/vite.config.ts:50-58` defines `vendor-vue/ui/math/paper`; cache landed per commit `a7121f8` | RATIFIED-AS-IS |
| **W8** | T-E2 openapi-typescript GENERATED + T-S3 retire script; host-flip deferred | `api/openapi.json` present; `web/scripts/gen-types.sh` present; `web/src/lib/api-schema.d.ts` has `GENERATED — do not edit` header; `scripts/update-webhook-urls.sh` present | RATIFIED-AS-IS |
| **W9** | deploy-hook invokes `run_pending_migrations`; Variant C runner | `scripts/deploy-hook.sh:152` invokes `python -m api.scripts.run_pending_migrations`; `api/scripts/run_pending_migrations.py` exists with Variant C docstring | RATIFIED-AS-IS |
| **W10** | pytest residual root-caused/fixed; T7 12/12 LIVE | `scripts/conformance-probe.sh` present; **live re-run: `T7 conformance probe: 12/12 PASS`** | RATIFIED-AS-IS (reproduced) |
| **W11** | T7 cron-installed on host every 6h; -1.208 GB pruned; named-residuals documented | Local crontab empty (cron is on remote host `mbabb@host` per audit §1 — accepted on doc trust; not verifiable from local) | RATIFIED-WITH-TRUST-DELTA |
| **W12** | FINAL.md authored; Scenario A paired close; ordering η | commit `f422b52`; both FINAL.md files present; mutual cross-citation | RATIFIED-AS-IS |

## §2 — Live probes (re-run)

- **T7 12/12**: **REPRODUCIBLE.** `bash scripts/conformance-probe.sh` → `T7 conformance probe: 12/12 PASS` (silent on full PASS; 115 LOC; exits 0).
- **W1 CORS**: PASS — `OPTIONS https://api.color.babb.dev/palettes/neon-cyberpunk` from `Origin: https://fourier.babb.dev` returns `204 No Content` with `access-control-allow-origin: https://fourier.babb.dev`.
- **W4 envelope**: PASS — `ETag: "2026-02-26T04:14:26.646Z"`; `RateLimit-Limit: 60`; problem+json `type: urn:palette-api:problem:not_found` on 404.
- **W5 `as unknown as`**: 0 source casts; 1 documentation reference (a retire-note comment) — within close-record allowance.
- **W6 demo URL**: `DEFAULT_REMOTE_API_URL = "https://api.color.babb.dev"` confirmed.

## §3 — Silent misses

- **W11:T7-cron** — LOCAL crontab has no entry. The W11 audit §1 places it on the host (`/home/mbabb/conformance-probe.sh` via `0 */6 * * *`). The doc is the source of truth; from this audit lane it cannot be falsified or confirmed without host SSH. Recorded as TRUST-DELTA (not OVERCLAIM).
- **W10:DEFERRED Playwright matrix** — gate row §3 lists "Test integrity: cross-env Playwright green" as **DEFERRED to fourier-F or G**; this is honestly named in FINAL §3 (not silent — explicit named-residual).
- **W9:GREEN-pending-real-test** — explicitly named; not a silent miss.
- **No silent claim of T-S3 host-flip done** — gate row §3 marks NAMED-RESIDUAL; consistent with W8/W11 audit.
- **Idempotency-Key API-side middleware** — I.FINAL §3 marks DEFERRED to fourier-E.W10 fold + I-tail. E.FINAL §5 mirrors this. Coherent, not silent.

## §4 — Adversarial finding

**Most-overclaimed wave: W11.** Two specific edges:

1. The T7 cron sits on a remote host (`mbabb@host`); the close-record provides no `ssh ... crontab -l` capture as evidence. The audit cites the crontab line as if installed but no live re-confirmation appears. This is the largest evidence gap in the entire E close.
2. W11 audit §2 reframes the floridify cross-repo upstream commit as "maybe stale at D close" rather than acknowledging the D.W11 named-residual is being silently dropped without verification. Honest disposition would be "carried forward unchanged" rather than "may have been stale".

**Net effect**: HOLDS. Neither edge invalidates the cohort closure. T7 is reproducible LIVE on demand from any cwd via the local script; the cron is operational hygiene, not contract proof.

## §5 — Net verdict

- **E close**: **HOLDS UNDER FALSIFICATION.** 12/12 of the live-probable gates reproduce; the 1 doc-trusted gate (host cron) has fallback verification (manual probe re-run).
- **I close**: **HOLDS UNDER FALSIFICATION.** All 4 wave evidences verifiable through the shared T7 probe and live envelope inspection at `api.color.babb.dev`.

## §6 — Folds to F

- **F-FA3-1**: Add a `scripts/verify-host-cron.sh` that SSHes to the host and emits `crontab -l | grep conformance` as part of the F open-baseline, closing the W11 trust-delta.
- **F-FA3-2**: Move the doc-comment "the 2 `as unknown as` casts retire" out of `web/src/lib/equation/api.ts:4` or rephrase so the surface-area regex grep returns absolute zero (currently 1 string match in a comment).
- **F-FA3-3**: Capture a host-side `tail -n 20 /home/mbabb/conformance-probe.log` snapshot at F open as standing evidence that the cron has actually fired ≥1 time since W11 close (proves the cron is running, not just installed).
- **F-FA3-4**: Reconcile W11 audit §2 floridify disposition — replace "may have been stale at D close" with explicit carry-forward to F or close-as-WONTFIX with operator sign-off.
- **F-FA3-5**: W9 GREEN-pending-real-test → upgrade to GREEN-verified by triggering one no-op migration at F open and capturing the `migrations` collection write.
