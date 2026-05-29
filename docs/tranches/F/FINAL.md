# F — FINAL — post-cohort hygiene · API-vhost-correctness + compute-cache-symmetry + operator-window + UX-polish + chronic discharge + constellation deploy standardization

**Tranche letter**: F.
**Status**: **CLOSED 2026-05-29** (GREEN-with-named-residuals).
**Heads of record**: fourier-analysis HEAD `d98da91`; deploy-repo (`mkbabb/deploy`) HEAD `7c4e96b`.
**Cohort**: single repo. value.js-I closed Scenario A at ordering η; the cohort handshake was discharged before F opened. No peer required.
**Authority**: `F.md` (charter) + this `FINAL.md` (close-of-record).

## §0 — Disposition

F closes **CLOSED 2026-05-29** against the binding charter (`F.md §0` goal + completion criterion; `F.md §6` hard gates). The six threads — α API-vhost-correctness, β compute-cache-symmetry, γ operator-window-consolidation, δ UX + a11y + perf polish, ε chronic + transpositions + auto-migration GREEN-verified, ζ constellation deploy standardization — all landed honestly. Production is LIVE: `fourier.babb.dev` (CF Pages SPA, 200) + `api.fourier.babb.dev` (origin Apache → Docker nginx → FastAPI). T7 conformance probe 12/12 PASS; pytest 214/214; `vue-tsc -b` + `npm run build` green.

The close is GREEN-**with-named-residuals**, not CLEAN, for three honestly-booked reasons: (1) the rate-limit per-client correctness is a residual — the limiter is observably non-static but keys on the proxy IP behind the 2-hop Apache→nginx chain (a shared global bucket); (2) the 7 cross-repo adoption asks are maintainer-owned, out of F's inv-16 source boundary; (3) `dispatch.sh` full retirement is gated on the 4 non-fourier repos adopting `deploy-hook.sh`. None is a half-state in fourier source; each carries an owner and a 30-day stale-watch (§5).

**The headline finding** (§3): F not only landed its planned surface — it discovered that the constellation's auto-deploy chain had been silently BROKEN for ~2 months and restored it. The host was stuck at `6039e95`; three independent deploy-blockers (a stale Dockerfile COPY, a drifted lockfile, and a 3-layer auto-migration defect) plus a missing webhook secret on all 5 repos each had to be root-caused and fixed before F's own surface could deploy at all.

## §1 — Hard-gate verdict (per F.md §6)

| Gate (F.md §6) | Verdict | Evidence |
|---|---|---|
| **inv-22 vhost-correctness lives** — `api.fourier.babb.dev/` → JSON-or-404 (not SPA index); `/health` → `"ok"`; symmetric on `api.color.babb.dev` | **PASS** | `fa9cf75` surgical `location =` blocks. Live: `/`→404 `application/problem+json`; `/health`→`{"status":"ok"}`; `/docs`→Swagger HTML (1019 B, not the 2759 B SPA); `/openapi.json`→`"Fourier Analysis API"`; `api.color.babb.dev/`→json. Receipt `F-W1-vhost-correctness.txt` |
| **F-α rate-limit dynamic** — 25-burst returns ≥1 429 w/ `RateLimit-Remaining: 0` *OR* limiter observably non-static | **PASS (escape clause)** | `fa9cf75` fused `check()` into a single enforce+report path; added `read_limiter`. Live `RateLimit-*` are dynamic (`Limit`, `Remaining` decrements, `Reset=60`). The ≥1-429 clause was NOT exercised — the charter's documented "observably non-static" escape is met instead; per-client 429 correctness is a **named residual** (proxy-IP shared bucket, §5). `9ad3625` widened `read_limiter` 240→1200/min as global-safe headroom |
| **F-β compute cache symmetric** — `CACHE_HIT compute_bases` on 2nd identical call; `compute_cache.py` no longer 3-field positional | **PASS** | `0a0a45b` — `cache_key(contour_hash, params: dict)` canonical-JSON + `COMPUTE_VERSION`; `compute_bases` wired (was uncached); `epicycle_cache`→`compute_cache` rename; CACHE_HIT/MISS logging (closes the E3 instrumentation residual) |
| **F-γ receipts** — `F-W3a` (host-ops single-window) AND `F-W3b` (URL flip + dispatcher disposition) | **PASS** | Receipts `F-W3a-host-evidence.txt` + `F-W3b-per-repo-split.txt`. **Exceeded the gate**: the chronic webhook regression was ROOT-CAUSED + CLOSED (missing secret on all 5 repos — §3); hardened to per-repo URLs + per-repo HMAC. `dispatch.sh` RETAINED by documented deviation (§4), not `rm`'d — the 4 non-fourier repos still route through it |
| **F-δ a11y + SEO** — `button-name: 0` failures; `meta-description` + `robots.txt` present | **PASS** | `9bd80b3` — aria-labels on AppHeader Reka trigger + UserSlugBar; `/visualize` label-content-name-mismatch fixed; `meta-description` + per-route meta via router `afterEach` + `robots.txt`. vue-tsc + build green |
| **F-δ perf (NARROWED per Wχ-P3)** — `cm-web-fonts` URL pinned to an immutable ref; preconnect retained | **PASS** | `9bd80b3` — `cm-web-fonts` pinned `@latest`→immutable commit SHA `333f55e`; preconnect retained; NO new files. bf-cache audited benign. (The struck `unused-javascript < 50 kB` clause stays struck; route-lazy + self-host DEFERRED-as-manufactured) |
| **F-ε transpositions (REVISED per Wχ-P4)** — F-T-N1 doc-ASK; F-T-E1 + F-T-S2 REJECTED | **PASS** | `ca9a751` — F-T-N1 cross-repo coordination ASK authored (value.js maintainer commits the `status` drop; inv-16 held). F-T-E1 REJECTED (static `MIGRATIONS` `(name, version)` list KEPT — version is load-bearing idempotency). F-T-S2 REJECTED (E.W5 `coreFetch` collapse retained) |
| **F-ε auto-migration GREEN-verified** — `migrations` collection holds ≥1 entry `result: SUCCESS` from a deploy-hook trigger (not manual SSH) | **PASS** | `a04f636` + `4007ec5`. Receipt `F-W8-auto-migration.txt`: 3 SUCCESS entries (`migrate_image_blobs`/`migrate_flags_field`/`migrate_visualization` @v1) all carrying one `deploy_run_id` from the deploy-hook; idempotent re-run SKIPs verified. Three masked latent defects fixed en route (§3) |
| **C4 chronic discharge** — `ORT_LOGGING_LEVEL=3` at `api/__init__.py`; ONNX flood gone | **PASS** | `d08e515` |
| **C9 numbering reconciled** — A/B/C/D/E charters carry consistent invariant numbering | **PASS** | `ca9a751` — authored `docs/tranches/INVARIANTS.md` canonical ledger. Non-destructive name-resolution (C restarted at 18/19/20; F re-used 21/22) — no charter renumber (would orphan live `inv-N` cross-references); the integer never disambiguates, the appended phrase always does |
| **T7 conformance probe** — still 12/12 PASS at close (no regression) | **PASS** | 12/12 PASS at close; cron `0 */6 * * *` installed on host (receipts `F-W3a-host-evidence.txt`, `F-W8`) |
| **`uv run pytest api/tests/` green (212/212 maintained)** | **PASS** | 214/214 (≥ the 212 floor) |
| **`vue-tsc -b` green; `npm run build` succeeds** | **PASS** | Green at W4/W5 (`9bd80b3`) |
| **`PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate** | **PASS** | `PROGRESS.md` reconciled (W0–W13 CLOSED); this document |
| **30-day named-residual stale-watch re-triggered** (inherits E/FINAL §5) | **PASS** | §5 re-triggers E's residuals + books F's 3 + the 7 adoption asks with owners |

**Net**: every §6 hard gate is PASS, with one gate (F-α rate-limit) met via the charter's own documented "observably non-static" escape clause rather than the ≥1-429 burst clause — the per-client 429 correctness is honestly carried forward as a named residual (§5). Zero half-state in fourier source.

## §2 — Commit ledger

### fourier-analysis (master, in order)

| Commit | Wave | Subject |
|---|---|---|
| `d08e515` | W0 | C4 chronic — `ORT_LOGGING_LEVEL=3` at `api/__init__.py` (silences the onnxruntime warning flood at import) |
| `fa9cf75` | W1 α | API-vhost-correctness — surgical nginx `location =` blocks (`/openapi.json`,`/docs`,`/redoc`→backend; `/health`→200 json; `/`→404 problem+json) BEFORE the SPA catch-all + rate-limit fused to a single enforce+report path (added `read_limiter`; method-aware; removed redundant per-route `Depends`/`.check()` across 5 routers). 214/214 pytest |
| `0a0a45b` | W2 β | compute-cache-symmetry — `cache_key(contour_hash, params: dict)` canonical-JSON + `COMPUTE_VERSION`; wired `compute_bases`; `epicycle_cache`→`compute_cache`; CACHE_HIT/MISS logging |
| `9bd80b3` | W4+W5 δ | a11y (aria-labels; `/visualize` mismatch) + SEO (`meta-description` + per-route meta + `robots.txt`) + perf (cm-web-fonts pinned to immutable SHA `333f55e`). bf-cache benign. vue-tsc + build green |
| `ca9a751` | W6+W7 ε | C9 invariant numbering reconciled (authored `docs/tranches/INVARIANTS.md`) + F-T-N1 cross-repo coordination ASK doc |
| `60f1f89` | (discovered) | **deploy-blocker fix** — dropped stale `COPY web/vendor ./vendor` from `web/Dockerfile` (`163ca47` removed `web/vendor` but left the COPY → broke EVERY Docker build → host stuck at `6039e95`) |
| `37da6f0` | (discovered) | **deploy-blocker fix** — synced `web/package-lock.json` (missing `openapi-typescript@7.13.0` + tree → `npm ci` failed; latent since E) |
| `9ad3625` | W1-refine | widen `read_limiter` 240→1200/min + documented the proxy-IP shared-bucket residual |
| `0a7a743` | W1 | inv-22-aware deploy-hook health gate — was curling `/` expecting 200 (SPA) but inv-22 makes `/`→404 → false roll-backs; gate now requires `/api/health`=ok AND `/`=404 → co-enforces inv-22 on every deploy |
| `a04f636` | W8 | auto-migration — deploy-hook targets `backend` service (was `api`) → runner now executes |
| `4007ec5` | W8 | auto-migration GREEN-verified — venv interpreter (`uv run --no-sync python`) + canonical Mongo URI (`settings.mongo_uri`, inv-11) + subprocess isolation. 3 migrations SUCCESS via deploy-hook |
| `d98da91` | W12 ζ.4 | `docs/constellation/ADOPTION-ASKS.md` (7 maintainer-owned asks) + γ/W1/W8 receipts |

### deploy repo — `mkbabb/deploy`

| Commit | Wave | Subject |
|---|---|---|
| `7c4e96b` | W9–W11 ζ.1–ζ.3 | host spine capture (`webhook.service`, `hooks.json.template` [secrets redacted], `dispatch.sh`, `deploy-dir-layout.md`) + `security/hmac-rotation.md` + `templates/{deploy-hook.sh, docker-compose.hardening.yml, ci.yml, env.example}` + `cf/{dns-cf-sync.sh, pages-deploy.sh}` |

### Host operations (no repo commit; receipts under `docs/tranches/F/receipts/`)

| Wave | Operation | Receipt |
|---|---|---|
| W3a γ | Chronic webhook regression root-caused + closed (secret restored on all 5); `:8140` speedtest vhost `a2dissite`d; dangling images pruned; T7 cron 12/12 | `F-W3a-host-evidence.txt` |
| W3b γ/ζ.2 | Per-repo URL (`/hooks/<repo>`) + per-repo HMAC split (closes S4; shared secret retired); fourier full-chain verified; 4 others HMAC-matched | `F-W3b-per-repo-split.txt` |

## §3 — The discovered work — the deploy chain was BROKEN

This is the tranche's highest-impact finding and the reason the close is recorded as *more* than its planned surface. F planned a post-cohort hygiene lift against a constellation assumed FULLY GREEN at ordering η. Execution discovered that the auto-deploy chain had been silently dead for ~2 months — the host was pinned at `6039e95`, and every prior "closed" tranche after that commit had in fact never reached production via the webhook path. Four independent defects, each masking the next, had to be root-caused and fixed before F's own surface could deploy at all:

1. **The stale `web/vendor` Dockerfile COPY** (`60f1f89`). Commit `163ca47` migrated the frontend from vendored `.tgz` seams to published `@mkbabb/*` npm versions and removed `web/vendor` — but left `COPY web/vendor ./vendor` in `web/Dockerfile`. Every Docker build failed at that layer. This alone pinned the host at `6039e95`.

2. **The drifted `web/package-lock.json`** (`37da6f0`). The lockfile was missing `openapi-typescript@7.13.0` and its dependency tree, so `npm ci` failed — latent since E, masked behind defect 1.

3. **The 3-layer W8 auto-migration defect** (`a04f636` + `4007ec5`). Once the Docker build was restored, the deploy-hook's migration step failed in three masked layers: (a) it ran `compose exec api` but the service is named `backend`; (b) it used the base `python` interpreter, which carries no `motor` → switched to `uv run --no-sync python`; (c) the runner read a non-existent `MONGODB_URI` → corrected to `settings.mongo_uri` (inv-11); plus an in-process `module.main()` call that nested `asyncio.run` → resolved by subprocess isolation (`python -m <module>`). Result: 3 migrations recorded SUCCESS via the deploy-hook; idempotent re-run SKIPs verified.

4. **The chronic webhook-secret regression** (host ops, W3a/W3b). The GitHub webhook secret was MISSING on all 5 constellation repos — lost in the `deploy.babb.dev` migration ~2 months ago. GitHub therefore never signed its deliveries → the receiver's HMAC trigger never fired → NO repo auto-deployed. F was deployed MANUALLY throughout its own execution. The fix restored the secret on all 5, then hardened the chain to per-repo URLs (`/hooks/<repo>`) + per-repo HMAC secrets (closing survey S4 — one repo's compromise no longer re-signs all 5). A redelivered fourier push then drove the full chain end-to-end: HMAC OK → TRIGGERED → DEPLOY OK; the other 4 repos' pings HMAC-matched.

The net of §3: F restored the constellation's auto-deploy after a silent ~2-month regression, and the inv-22-aware health gate (`0a7a743`) now co-enforces vhost-correctness on every future deploy — a regression of the kind α fixed can no longer roll forward unnoticed.

## §4 — Deviations (documented)

| Deviation | What | Rationale |
|---|---|---|
| **`dispatch.sh` RETAINED** | The charter (`F.md §3` W3b, W9) called for the multiplex `dispatch.sh` to be retired. It was NOT `rm`'d. | The 4 non-fourier repos (words, speedtest, value.js, csp-solver) still route through it — they have not adopted `scripts/deploy-hook.sh`. That adoption is the ζ.4 maintainer-owned ask (inv-16: fourier-F cannot commit to their repos). Full retirement is a named residual (§5) gated on their adoption. fourier itself routes to its own `deploy-hook.sh` |
| **Per-repo split (not URL-flip-then-rm)** | Charter framed W3b as "flip 5 URLs → `rm dispatch.sh`". Realized as per-repo URLs + per-repo HMAC secrets with dispatch.sh retained. | Same end-state intent (T-S3 per-repo isolation + S4 secret split) without deleting the still-needed router. The value.js arm is now per-repo-isolated but its `rsync`→`git` fix is value.js-maintainer-owned (ledger ask 3) |
| **`read_limiter` widened to 1200/min** | Charter implied per-client enforcement; `read_limiter` set to a global-safe 1200/min headroom (`9ad3625`). | The limiter keys on the proxy IP behind the 2-hop Apache→nginx chain (shared global bucket). 1200/min is safe global headroom until real-client-IP resolution lands; the per-client correctness is a named residual (§5) |

## §5 — Named residuals + the 30-day stale-watch

**F's new residuals (3):**

| Item | Owner | Disposition |
|---|---|---|
| Real-client-IP resolution behind the 2-hop Apache→nginx chain | successor infra wave | The rate limiter keys on the proxy IP → a shared/global bucket; `read_limiter`=1200 is safe global headroom. Per-client needs nginx `real_ip` + an XFF-hop resolver + Apache XFF verification. The F-α gate met "observably non-static"; per-client 429 correctness carries forward |
| The 7 cross-repo adoption asks (`docs/constellation/ADOPTION-ASKS.md`) | per-repo maintainers | inv-16-bounded; coordinated, not committed. CI template (words/speedtest/csp-solver); docker-hardening level-up; frontend CF-Pages convergence (value.js/keyframes); palette-api `rsync`→`git`; csp-solver route-registration (N4); floridify Mongo-bind (N7) |
| `dispatch.sh` full retirement | operator + per-repo maintainers | Gated on all 4 non-fourier repos adopting `deploy-hook.sh` (ζ.4). Per-repo isolation already achieved; the router stays until its last consumer migrates |

**E's residuals re-triggered (30-day stale-watch inherited from E/FINAL §5):**

| Item | Owner | Disposition at F close |
|---|---|---|
| T-S3 host-flip dispatcher retire | operator | **PARTIALLY DISCHARGED at W3b** — per-repo URLs + per-repo HMAC live; full `dispatch.sh` retirement remains (folded into F's residual above) |
| W11 FULL palette-api → color rename | operator | already URL-layer GREEN (`api.color.babb.dev`); cosmetic-only; STAYS (N3) |
| floridify cross-repo upstream commit | floridify maintainer (external) | folded into the F-ζ.4 adoption-ask ledger (N7) |
| Dead `:8140` speedtest vhost | operator | **DISCHARGED at W3a** — `a2dissite`d; `speedtest.babb.dev`→404 |
| C9 invariant numbering reconciliation | docs | **DISCHARGED at W6** — `docs/tranches/INVARIANTS.md` |
| csp-solver `useApi.ts` / route-registration | csp-solver maintainer | folded into the F-ζ.4 adoption-ask ledger (N4) |
| Cross-env Playwright matrix (D.W6 AMBER) | fourier-G | STAYS-OUT (API proven by T7; UX-layer polish) |
| Compute cache hit-rate instrumentation | fourier-F | **DISCHARGED at W2** — CACHE_HIT/MISS logging on `compute_cache` |
| Per-call-site If-Match/Idempotency-Key on value.js demo | value.js-J | STAYS (plumbed; per-site adoption decorative) |
| Idempotency-Key API-side replay store | value.js-J / I-tail | STAYS-OUT of F (must-NOT #14) |

**30-day stale-watch**: each open residual lists an owner + a target review at the next fourier successor open OR the next operational deploy window, whichever fires first.

## §6 — Invariants honored

- **inv-12 KISS** — every thread held a single-PR or single-SSH-session bound; the rate-limit fix REDUCED moving parts (one enforce+report path; redundant per-route `.check()`/`Depends` removed across 5 routers); the cache refactor collapsed a 3-field positional contract to one parametric key.
- **inv-16 cross-repo source boundary** — HELD across all fourier-F commits (touched only `fourier-analysis/**`) + the `deploy/**` repo. F-T-N1 stayed a documentation-only ASK; the 7 adoption asks are maintainer-owned PRs the fourier-F commits never authored.
- **inv-20 NO-legacy** — the `epicycle_cache`→`compute_cache` rename abandoned old docs cleanly (TTL ≤ 7 d + fail-open); the stale `web/vendor` COPY and the drifted lockfile were removed, not flagged-around.
- **inv-21 post-cohort-hygiene-bounded** — each thread closed within its single-window ceiling; the discovered deploy-chain work was root-cause-bounded (4 surgical fixes), not scope creep.
- **inv-22 vhost-correctness-symmetric** — first landed (`fa9cf75`) and now co-enforced on every deploy by the inv-22-aware health gate (`0a7a743`). Verified live on both `api.fourier.babb.dev` and `api.color.babb.dev`.
- **C9 numbering** — reconciled into the new `docs/tranches/INVARIANTS.md` canonical ledger (name-resolved, non-destructive; the integer never disambiguates a collided invariant, the appended phrase always does).

## §7 — Cohort note

F is single-repo. value.js-I closed Scenario A paired with fourier-E at ordering η (`value.js/docs/tranches/I/FINAL.md`); the cohort handshake was discharged before F opened. F's only cross-repo touchpoints were ASK-only and inv-16-bounded: the F-T-N1 paired demo PR (value.js maintainer commits the `status` drop) and the 7 maintainer-owned adoption asks in `ADOPTION-ASKS.md`. No peer-repo close is required for F. The constellation-wide deploy spine F authored (`mkbabb/deploy` `7c4e96b`) is a new node, not a cohort partner — the other 5 app repos adopt its templates via their own maintainer-owned PRs.

## §8 — Closing summary

F executed faithfully against the binding charter and discovered more than it planned:
- 6 threads (α/β/γ/δ/ε/ζ); 14 wave rows (W0, W1, W2, W3a, W3b, W4–W13) CLOSED.
- 12 fourier commits + 1 deploy-repo commit + 2 host-ops receipt sets.
- All §6 hard gates PASS (F-α via the documented "observably non-static" escape clause).
- T7 12/12 PASS; pytest 214/214; vue-tsc + build green.
- The constellation's auto-deploy chain — silently BROKEN for ~2 months — root-caused + restored + hardened to per-repo HMAC; inv-22 now co-enforced on every deploy.
- Zero half-state in fourier source; every residual carries an owner + a 30-day stale-watch.

The user's 2026-05-28 directive (the EE3 6-agent audit + the "normalize CI + webhook + ensure security; standardize across the constellation" mandate) is fully addressed. The successor work is the 7 maintainer-owned adoption asks + the real-client-IP infra wave. CANONICAL-ORDERING advances to **ordering θ′**.

End of F/FINAL.md.
