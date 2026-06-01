# H — FINAL (close ledger)

**Tranche**: H — green-means-green + single-replica-elegance + constellation-perfection; the CI-honesty correction of G's "CI green" overstatement.
**Status**: **CLOSED GREEN** 2026-06-01.
**Predecessor**: G (`docs/tranches/G/FINAL.md`, fourier `5e29ed0`/`b28c3fa`, deploy `a7b58ab`).

## §0 — The headline

**fourier CI is actually green for the first time.** CI run **`26773946417`** (HEAD `8058c44`) is **GREEN on all three jobs** — `web (vue-tsc + vite build)` + `api/tests (with live Mongo)` + `e2e (Playwright)`. The `e2e` gate had been red since before F (broken, then masked across D→E→F→G); G closed labeled GREEN while it was RED on every commit. H repaired it for real and installed the invariants that forbid the overstatement (inv-27) and the red-SHA ship (inv-28). This run id is the binding inv-27 evidence; every gate below was verified as part of it (or against prod), not local-only.

## §1 — Threads (six)

| Thread | Was | Now |
|---|---|---|
| **α** green-means-green | `e2e` RED on every G commit; "CI green" claimed against it; api tests hiding off the `pytest api/tests/` path | **e2e GREEN** (40 passed / 0 failed / 7 booked fixmes) — repaired 4 breakage classes + **3 buried app bugs** (dropdown-never-positioned via a Tooltip-wrapped Reka anchor; mobile configurator-stage 0px; TOC leaf no-scroll) + a11y roles; dead `paperTextEnhancer.ts` removed. **CI widened `pytest api/tests/`→`pytest api/`** → exposed 5 janitor tests broken+off-path since B.W3 (drifted mock → migrated to real Mongo; `pytest api/`=225/0). **inv-27** authored; `G/FINAL` corrected (§2 caveat + §6). |
| **α** inv-28 | the deploy path shipped a SHA regardless of CI status (G's SPA shipped while same-SHA CI was RED) | **SPA arm CI-green-gated** — `deploy-pages.yml` rewired push→`workflow_run [CI] completed`, deploys only on `conclusion==success && master && push` (web/** filter re-imposed; checkout pinned to the verified SHA). A red CI ⇒ no ship (mechanical). API arm precisely specified, booked to ζ (host-coupled). **inv-28** authored. |
| **β** WORKERS=1 | uvicorn `--workers 4` vs the inv-12 single-replica posture; rate_limiter + `_suspended_cache` + janitor-loop per-process divergences | **`WORKERS=1`** — one authoritative process; budgets are honest hard caps; dead orphan `api_upload` nginx zone deleted; **T2 converge DECLINED** (would duplicate the errors.py envelope / drift inv-26). inv-12 claim==reality. |
| **γ** hardening + CSP | frontend/nginx at no-new-privileges only; CSP absent; a born-dead KaTeX phantom face | frontend+nginx at the **full floor** (`read_only`+tmpfs+`cap_drop:ALL`+`cap_add:NET_BIND_SERVICE`); **CSP `_headers`** (verified against the built app, 2 justified widenings); phantom KaTeX face removed (W0); softdelete naive-row regression test **with a negative control**. |
| **δ** contract honesty | the 4th hand-type island + the `F-Inv 22*` "symmetric" overname | 4th island (`equation/types.ts`) = **KEEP-AS-IS** (distinct domain, assessed vs `api/models/equations.py` — no drift); inv-26 reconciled per-domain + **no-codegen DECLINED-with-rationale**; "symmetric" name **retired** (INVARIANTS §1 + §2.4/§2.7). |
| **ε** constellation perfection | constellation CI broadly red (one un-propagated vendor-seam cascade); words 404; speedtest mis-framed | **BOOKED-ALL** (user decision 2026-06-01): all 5 siblings mid-flight (unpushed backlogs) → touched NONE; authored the **exact file-verified fixes** as inv-16′ asks (`waves/W6-W7-epsilon-booking.md`; ADOPTION-ASKS §4+§6). inv-16′ enabled, named, ledgered — not compelled. speedtest=`friday.institute` recorded. |
| **ζ** spine + coordination | DNS-tuple drift; render-hooks unapplied; inline HMAC | **DNS reconciled** (`dns-cf-sync.sh` fourier→`fourier-682.pages.dev`, deploy `3c3fbd2`); render-hooks application + the inv-28 API-arm PAT **booked** (operator/credential-gated, working-chain-safe); dispatcher retirement re-affirmed GATED; stale-watch re-triggered. |

## §2 — Hard-gate table (all verified within the GREEN CI run `26773946417` or against prod)

| Gate | Result | Evidence |
|---|---|---|
| **inv-27 green-means-green** | ✅ | CI `26773946417` (HEAD `8058c44`) GREEN on web + api-tests + e2e. Every "green" in this ledger cites it. |
| **inv-28 verified-deploy-of-record (SPA)** | ✅ | `deploy-pages.yml` `workflow_run`-gated on `conclusion=='success' && head_branch=='master' && event=='push'`; red CI ⇒ deploy `if` false ⇒ no ship (mechanical refusal). API arm booked to ζ. |
| **H.α e2e suite** | ✅ | 40 passed / 0 failed / 7 booked fixmes (run `26773946417` e2e job); no strict-mode locator; stale specs refreshed; `G/FINAL` rows corrected. |
| **H.α full-api CI** | ✅ | `pytest api/` (widened from `api/tests/`) = **225 passed / 0 failed**; janitor migrated to real Mongo; no test off-path. |
| **H.β WORKERS=1** | ✅ | `api/Dockerfile` `ENV WORKERS=1`; `_suspended_cache` + rate-limiter + janitor-loop divergences collapse to one process; rate_limit conformance 5/5; inv-12 claim==reality. |
| **H.γ hardening + CSP** | ✅ | `docker-compose.prod.yml` frontend+nginx at floor (compose-config rendered: read_only+3×tmpfs+cap_drop ALL+cap_add NET_BIND_SERVICE); `web/public/_headers` CSP; softdelete test 9 passed (negative-control-proven). |
| **H.δ contract honesty** | ✅ | INVARIANTS §2.9 (4th-island keep-as-is + no-codegen) + §1/§2.4 "symmetric" retired; `vue-tsc -b` green. |
| **H.ε constellation** | ✅ (booked) | inv-16′ book-all (user 2026-06-01); 9 precise fixes in `waves/W6-W7-epsilon-booking.md` + ADOPTION-ASKS; no sibling repo touched. |
| **H.ζ DNS + coordination** | ✅ | `dns-cf-sync.sh` reconciled (deploy `3c3fbd2`); render-hooks + API-arm PAT booked; stale-watch re-triggered. |
| **pytest / vue-tsc + build / e2e** | ✅ | all three CI jobs green in run `26773946417` — NOT local-only (inv-27). |

## §3 — Commits

**fourier-analysis** (W0→close): `62cafc3` (W0 open + KaTeX) · `504844a` (W1 α green-means-green) · `a05384c` (W3 β WORKERS=1) · `fd213d0` (W4 γ hardening+CSP) · `3431f5d` (W5 δ contract) · `8058c44` (W1 BLOB_DIR fix — the e2e green-CI completion) · `fc980ee` (W2 inv-28 SPA gate) · `013a466` (ε book-all) · + this W9 close.
**mkbabb/deploy**: `3c3fbd2` (ζ DNS-tuple reconcile).

## §4 — Residuals (owned, booked, none gating fourier; all honest)

- **ε constellation (inv-16′ asks, owner-applied)**: the value.js→keyframes→glass-ui vendor-seam cascade, words SPA publish, speedtest CI (friday.institute), api.color + api.sudoku routes, glass-ui-a11y `inert` — precise fixes in `waves/W6-W7-epsilon-booking.md`; deliberately not executed (all siblings mid-flight; user chose book-all). 30-day stale-watch.
- **ζ host ops (operator/credential-gated)**: apply `render-hooks.sh` on the host (inline-HMAC→rendered; inv-21 capture-before-mutate + receipt) — not mutated this session on the working prod chain; and the inv-28 **API-arm** gate (a fail-closed `commits/<sha>/status` block in `deploy-hook.sh` + a host-only read-only PAT — the PAT is a credential the maintainer provisions). SPA arm is LANDED + demonstrable; the API arm is precisely specified.
- **glass-ui-a11y**: the `aria-hidden-focus` keystones are `test.fixme`'d + booked (ADOPTION-ASKS); un-fixme on the glass-ui `inert` release + the guarded `^2→^3` bump.
- **Node-20 Actions deprecation** (CI warned): `actions/checkout@v4`/`setup-node@v4` run on Node 20 (forced to 24 by 2026-06-16). Cosmetic now; a one-line bump when convenient.

## §5 — Disposition

A–H closed. H made "green" mean green (CI actually green, run `26773946417`), installed **inv-27** (green-means-green), **inv-28** (verified-deploy-of-record), and **inv-16′** (authorized-cross-repo-sweep); landed the **WORKERS=1** single-replica transposition (closing two per-process divergences + a janitor-dup), the hardening floor + CSP, and the contract-honesty reconciliation; and — under inv-16′ — **booked** the constellation perfection precisely rather than clobber five mid-flight repos. It **refused the anti-patterns it was born correcting**: no "green" claimed without a covering green run id; no deploy of a red-CI SHA; no silent cross-repo mutation; no Redis; no schema that lies (response_model declined). The green-means-green loop bit twice in execution (the off-path janitor breakage; the BLOB_DIR upload-500) — each a real local↔CI gap the dead gate had buried, each genuinely fixed. Ordering κ′ (CANONICAL-ORDERING §17) marks H CLOSED.

End of H/FINAL.md.
