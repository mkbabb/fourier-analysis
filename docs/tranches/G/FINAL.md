# G — FINAL — the close ledger

**Tranche**: G — elegance/simplicity/performance transposition + the correction of the three honest overstatements the 6-lane G-audit found in F's close.
**Status**: **CLOSED GREEN** 2026-05-30.
**Predecessor**: F (`d34d21b`) + deploy-repo (`7c4e96b`).
**Close state**: fourier HEAD `de9a078` (+ the W9 close commit); deploy-repo HEAD `a7b58ab`.
**Authored→executed**: authored 2026-05-29 (dev-only); executed 2026-05-30 on user authorization ("Begin and continue the current tranche… orchestration and deep parallelization… NO quick solutions… idiomatic, gestalt").

## §1 — What G corrected (the three overstatements) + what it transposed

| Thread | Aim | Outcome |
|---|---|---|
| **α** deploy-of-record + δ ships | F's δ never reached prod (auto-deploy drove only the API) | **δ LIVE.** Wired the SPA's standing automated path (`deploy-pages.yml` + `scripts/pages-deploy.sh`); inv-25 authored. Prod serves pinned font SHA + meta-description + a11y; robots honestly reconciled (CF zone-managed = superior). |
| **β.1** one contract source (T1) | 3 api↔web type sources | **1 source.** Deleted the unused 65 KB codegen + toolchain (it couldn't even emit `Visualization`); folded inline decls into `types.ts`. inv-26. |
| **β.2** one IP identity (T2) | rate-limiter keyed on the proxy gateway (one global bucket), masked by widening 1200 | **Per-client, verified live.** nginx `real_ip` + `get_client_ip` (X-Real-IP) convergence; dropped uvicorn `--proxy-headers`; budget 1200→180; spoof-proven. |
| **γ** NO-legacy excision | dead code | `like_limiter`/`/like`, 6 dead exports, `GalleryEntry`/`toGalleryEntry` vestige, 5× `datetime.utcnow` — all gone, grep-proven. |
| **δ** perf + Lighthouse | 3 LCP-path third-party origins | **3→0.** KaTeX bundler-import + self-hosted CM/Fraunces/Fira fonts. Lighthouse **prod 95 + dev 94**, A11y/SEO 100 — the "prod AND dev" demand literally honored. |
| **ε** deploy-spine completion | secret-model doc↔host lie; no self-CI; deploy-hook gaps; fourier hardening; host cruft | secret-model reconciled (executable render wrapper); deploy self-CI (shellcheck); deploy-hook nginx-recreate (+ template backport); backend hardening floor live; host backups pruned. |
| **ζ** honesty + coordination | inv-22 overstated; chronics; asks | inv-22 honestly scoped (`INVARIANTS §2.7`); C1/C5/C6 re-affirmed with predicates; E2 out w/ rationale; 7-ask stale-watch re-triggered (Ask 4 fourier portion LANDED). |

## §2 — Hard-gate table (verified — local + live; CI-signal corrected in §6)

> **inv-27 correction (added H.W1, 2026-05-31).** The `pytest`, `vue-tsc + build`, and `T7 conformance` rows below were verified **LOCALLY** at close — each true as a local result — but the table as a whole read as "CI green," which was **FALSE**: the `CI` workflow's `e2e (Playwright)` job was red on every G commit (a chronic broken gate G did not cause). See **§6** for the honest scope and the H.W1 green run that discharges it. The live/deploy rows (inv-25, δ, β.2, ε, ζ) are unaffected — they were verified against prod, not CI.

| Gate | Result | Evidence |
|---|---|---|
| **inv-25 deploy-of-record (SPA)** | ✅ | `deploy-pages` GH Actions run `26695021489` → CF deployment `135ab532`/`52f90604` — automated, push-triggered, NOT a manual one-off. |
| **inv-25 deploy-of-record (API)** | ✅ | webhook → `deploy-hook.sh` chain; last `DEPLOY OK e9faab6 → 9080ca2` (host journal); API `deploy_run_id d41742633452@87ebe4be5e57` (β.2 deploy). |
| **δ LIVE** | ✅ | prod serves `cm-web-fonts@333f55e` (not @latest), `<meta name=description>`, a11y; robots reconciled. Prod Lighthouse **Perf 95 / A11y 100 / SEO 100**, network trace **0** jsdelivr/googleapis/gstatic. |
| **inv-26 single contract source** | ✅ | `grep` clean (no `api-schema` import, no `openapi-typescript`/`gen-types`, no shadow inline decls); `vue-tsc -b` green. |
| **β.2 per-client rate limit** | ✅ | nginx log `$remote_addr` = real client; spoof (`XFF: 1.2.3.4`) ignored → same bucket; budget 180; `read_limiter=1200` retired. |
| **γ legacy zero** | ✅ | `grep` empty for `like_limiter`/`/like`, the 6 exports, `GalleryEntry`/`toGalleryEntry`, `datetime.utcnow`. |
| **δ perf 3→0** | ✅ | dev+prod Lighthouse artefacts under `receipts/`; LCP-path third-party origins eliminated. |
| **ε deploy-spine** | ✅ | rotation runbook executable (`render-hooks.sh`, fail-loud); deploy self-CI (deploy `a7b58ab`, shellcheck clean); backend hardening live (`docker inspect`: read_only+cap_drop ALL+no-new-priv+tmpfs); backups pruned (receipt). |
| **ζ honesty** | ✅ | inv-22 reconciled; C1/C5/C6 re-affirmed w/ predicate; stale-watch re-triggered. |
| **pytest** | ✅ | 132 passed / 83 skipped (+1 new per-client test). |
| **vue-tsc + build** | ✅ | green. |
| **T7 conformance** | ✅ | 12/12 PASS. |

## §3 — Commits

**fourier-analysis** (W0→W9): `a2be117` (W0) · `3787453` (Wα+Wχ) · `cbe95cd`/`1174211`/`01c9767`/`076e77a` (W1) · `830cfa0` (W2) · `87ebe4b`/`69cc15b` (W3) · `b7f639c` (W4) · `6868e8d` (W5) · `3ab42d8` (W6 receipt) · `e9faab6` (W7) · `9080ca2` (W5+W7 close) · `de9a078` (W8) · + this W9 close.
**mkbabb/deploy**: `26e9160` (W6 — secret-model + self-CI) · `a7b58ab` (W7 — deploy-hook template backport).

## §4 — Residuals (owned, booked, none gating fourier)

- **WORKERS=4 per-process rate bucket** (β.2): the in-memory limiter is per-process → effective ceiling ~4× the configured 180. True single-bucket needs a shared store (Redis) or WORKERS=1. Named in code + W3.
- **Compose hardening — frontend/mongo/nginx `read_only`+`cap_drop`** (ε): booked as per-image staging-test residuals (backend is at the full floor, live-verified).
- **4th hand-type island** `web/src/lib/equation/types.ts` (β.1): a distinct equation-domain contract (10 importers), not a duplicate of the collapsed boundary — noted, out of inv-26's named scope.
- **CSP `font-src 'self'`** (δ bonus): now possible (0 third-party font origins); optional hardening for a later wave.
- **inv-22 `api.color`** (ζ): value.js-owned partial conformance; booked in `ADOPTION-ASKS.md §4`.
- **Coordination (inv-16, maintainer-owned)**: the 6 remaining adoption asks + dispatcher-retirement gate; re-affirmed at G.W8 with the 30-day stale-watch.

## §5 — Disposition
A–G closed. G discharged the three overstatements at root, landed the convergence/legacy/perf transpositions, completed the deploy spine, and — load-bearing — **refused the anti-pattern it was born correcting**: no residual widened to mask a defect; no "LIVE" claimed without an automated `deploy_run_id`. Ordering ι′ (CANONICAL-ORDERING §16) marks G CLOSED.

## §6 — inv-27 correction (added by H.W1, 2026-05-31, non-destructive)

G's §2 marked `pytest` (132/83), `vue-tsc + build`, and `T7` ✅ — all **verified locally at close**, and all genuinely passing locally. But the table collectively implied "CI green," and that was **not** true: the GitHub `CI` workflow was `failure` on every G commit, including the W9 close `5e29ed0` (run `26695317377`) and the post-close fix `b28c3fa` (`26719598467`). The single red job was **`e2e (Playwright)`** — a deterministic strict-mode locator violation (`input[type="file"]` resolves to two elements: `ImageUpload.vue` + `VisualizationView.vue`'s `canvasFileInput`). **G did NOT cause it**: both inputs pre-date G; the suite was broken since before F (where it failed at the submodule checkout step and never ran), and G's W1 checkout fix merely *unmasked* it. The cheap CI jobs (`web`, and `api-tests` after `b28c3fa`) were green; the close cited those and the local gates, not the full CI run.

This is the same honesty class that birthed inv-25 (deploy-of-record-automated), now in the **test signal** — which is exactly why **H exists** and authors **inv-27 (green-means-green)**: a "CI green" claim must cite a run id whose *every* job is green. **H.W1 repaired the `e2e` suite** (four breakage classes: the dual-file-input locator + three stale-selector/assertion drifts) so fourier CI is now actually green on all three jobs — the discharging green run id is cited in `H/FINAL.md`. **None of G's landed work is reopened or altered** by this correction: δ-live, β.2-per-client, inv-26, and the hardening floor were verified against prod/grep and stand. Only the CI-green *implication* of §2 is corrected here.

End of G/FINAL.md.
