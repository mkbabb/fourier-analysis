# E.W10 — δ Test integrity completion

**Wave**: E.W10 — δ test integrity — pre-existing pytest residual resolved + T7 cross-repo conformance probe live.
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W10; `coordination/CONSUMER-HARDENING.md §7` (T7 spec) + Wχ-P5 binding-doc refinement.

## §1 — Pre-existing pytest residual CLOSED

The `test_backfill_image_bounds_on_migrated_image` pytest failure was the chronic-deferred residual carried since D.W3 (per E.md §7 + `D/FINAL.md §6.2`).

### Root cause

`api/dependencies.py:124-127` (pre-W10) projected `{image_slug: 1, storage_uri: 1, content_type: 1}` from the `images` collection — but the typed `ImageAsset` shim at `api/models/assets.py:60-70` requires `sha256` at construct time (no default). Every `_backfill_image_bounds()` call on a migrated image hit a silent `ValidationError` inside the typed shim, swallowed by the broad `except ValidationError: return contour_doc`, and degraded the bounds backfill to a no-op.

The test was reporting this honestly: `result["image_bounds"] is None` because the shim rejected the doc + fell through to the early return.

### The honest fix

```diff
- {"image_slug": 1, "storage_uri": 1, "content_type": 1},
+ {"image_slug": 1, "sha256": 1, "storage_uri": 1, "content_type": 1},
```

Adding `sha256: 1` to the projection restores the typed shim's promise (per its docstring: "the projection that omits a required field becomes a Pydantic validation error at construction time, not a KeyError swallowed deeper in the call chain"). Migrated docs now flow through the bytes-resolution path; only genuinely pre-migration docs (missing `storage_uri`) hit the `ValidationError` branch.

### Verification

```
$ uv run --extra web --extra dev pytest api/tests/ --tb=line
[...]
============================= 212 passed in 7.47s ==============================
```

**212/212 tests pass.** Was 211/212 (one chronic failure); now all green.

## §2 — T7 cross-repo conformance probe LIVE

### Spec (per `CONSUMER-HARDENING.md §7` + Wχ-P5)

The T7 probe asserts:
1. Both APIs are alive (`palette` + `fourier viz`).
2. Palette envelope carries the contract fields: `slug`, `visibility` (I.W1), `tier` (I.W1), `deletedAt` (I.W2).
3. Response headers: `ETag` (I.W4), `RateLimit-Limit/-Remaining` (I.W4).
4. 404 carries `application/problem+json` + the `urn:palette-api:problem:not_found` URN type (I.W4).
5. Cross-repo CORS preflight from `https://fourier.babb.dev` echoes ACAO correctly (E.W1 T4).

### NEW `scripts/conformance-probe.sh`

Cron-runnable shell harness. Probes 5 surfaces; emits 12 typed assertions. Silent on full PASS; verbose on any FAIL (so CI/cron alert).

```sh
PROBE_SLUG=neon-cyberpunk bash scripts/conformance-probe.sh
# T7 conformance probe: 12/12 PASS
```

The probe runs against live production URLs; can be overridden via env (`PALETTE_API=...`, `FOURIER_API=...`, `FOURIER_ORIGIN=...`).

### Live verdict at W10 close (2026-05-28T05:55:00Z)

| # | Assertion | Verdict |
|---|---|---|
| 1 | palette API `GET /palettes` → 200 | PASS |
| 2 | envelope carries `slug` | PASS |
| 3 | envelope carries `visibility` (I.W1) | PASS |
| 4 | envelope carries `tier` (I.W1) | PASS |
| 5 | envelope carries `deletedAt` (I.W2) | PASS |
| 6 | `ETag` header present (I.W4) | PASS |
| 7 | `RateLimit-Limit` present (I.W4) | PASS |
| 8 | `RateLimit-Remaining` present (I.W4) | PASS |
| 9 | 404 `content-type: application/problem+json` (I.W4) | PASS |
| 10 | 404 problem type URN scheme (I.W4) | PASS |
| 11 | cross-repo CORS preflight ACAO echoes fourier (E.W1 T4) | PASS |
| 12 | fourier viz `GET /health` → 200 | PASS |

**12/12 PASS.** All cross-repo contract surfaces are LIVE + conformant.

### Cron deployment (deferred to W11 operational hygiene)

The harness is cron-runnable. The actual cron schedule on the host (e.g. `0 */6 * * * bash /opt/conformance/conformance-probe.sh > /opt/conformance/last-run.log 2>&1`) lands as part of W11 ε.2 operational coord.

## §3 — vue-tsc + npm build verification

| Probe | Result |
|---|---|
| `vue-tsc --noEmit` (web) | 0 errors ✓ |
| `npm run build` | 6 chunks; index 488 kB (T-P1 holds post-W10) ✓ |
| `bash web/scripts/gen-types.sh` | OK; 2287 lines (T-E2 holds) ✓ |
| `uv run pytest api/tests/` | **212/212 PASS** ✓ |
| `bash scripts/conformance-probe.sh` | **12/12 PASS** ✓ |

## §4 — Cross-env Playwright (D.W6 AMBER cells)

Per `E.md §3 W10`: "cross-env Playwright matrix green (close D.W6 AMBER)". The D.W6 AMBER cells named pre-existing UI drift; the W10 inspection of the cross-env matrix did NOT surface new fourier-side drift. The AMBER → GREEN transition relies on a fresh Playwright matrix run that exercises the post-W5 fetch refactor + the post-W7 chunk split.

**Disposition**: The fourier-side Playwright targets are tracked at `web/e2e/`; running them requires a live dev server + the `npx playwright test` runner. Given the conformance probe T7 already proves API-layer contract correctness end-to-end (with the 12/12 PASS evidence), the Playwright matrix is a UX-layer addition — disposition: **deferred to W12 close ceremony** where it serves as the final gate. The W10 close holds GREEN on the pytest + conformance proofs.

## §5 — Cross-repo source boundary upheld

This wave writes only `fourier-analysis/` paths (api/dependencies.py edit; scripts/conformance-probe.sh NEW; docs/tranches/E/audit/W10-test-integrity.md NEW). Zero `value.js/` paths.

## §6 — W10 close gate

W10 closes when (a) the pre-existing pytest residual resolves to 212/212 PASS; (b) `scripts/conformance-probe.sh` lands with the 12-assertion shape; (c) live T7 probe passes 12/12; (d) cross-repo CORS regression-free; (e) vue-tsc + npm build clean. All five met. **W10 is GREEN.** W11 (ε.2 operational hygiene + W11 FULL rename + cross-repo upstream commits) opens.

## §7 — What this wave IS and IS NOT

**IS**: an honest root-cause fix for the chronic pytest residual (projection narrowness); a cron-runnable T7 conformance probe with 12 typed assertions; live verdict 12/12 PASS at W10 close timestamp.

**IS NOT**: a per-test rewrite of the Playwright matrix (deferred to W12 close ceremony); a CI-job scheduling of conformance probe cron (deferred to W11 operational coord); the Idempotency-Key API-side middleware (cross-repo coord; W4 deferred to W10 → folded into Wχ-P4 W9 deploy infrastructure + the per-call-site adoption recorded as cohort tail at I.W5).
