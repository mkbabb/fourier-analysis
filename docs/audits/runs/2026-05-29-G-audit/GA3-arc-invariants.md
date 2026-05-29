# GA3 — Full-arc plan coherence + invariant falsification (tranche-G dev audit)

**Lane**: GA3 of the 6-lane G-development audit. READ-ONLY + live probes.
**Repo HEAD**: `d34d21b` (the F.W13 close commit).
**Probed**: 2026-05-29 ~21:55Z. `api.fourier.babb.dev` + `api.color.babb.dev` live; pytest + vue-tsc + npm build re-run locally.
**Verdict headline**: **F's close SURVIVES falsification.** Every §6 hard gate reproduces. The close's own honesty (GREEN-**with-named-residuals**, not CLEAN) is accurate. Two real findings: one inv-22 **symmetry overstatement** [DRIFT] and one inv-11 **duplicated-IP-source** [INVARIANT-VIOLATION, latent]. Neither overturns the close; both are tranche-G candidates.

---

## §1 — F.md §6 hard-gate re-derivation (independent of FINAL.md)

| Gate | Independent verdict | Evidence (my probe, not FINAL.md's) |
|---|---|---|
| pytest 214/214 | **[HOLDS]** | `uv run pytest api/tests/ -q` → **214 passed in 9.16s**. Matches FINAL.md exactly. |
| `vue-tsc -b` green | **[HOLDS]** | `npx vue-tsc -b` exit 0. |
| `npm run build` | **[HOLDS]** | `npm run build` → `✓ built in 3.63s`, exit 0. |
| T7 conformance 12/12 | **[HOLDS]** | `bash scripts/conformance-probe.sh` → **12/12 PASS**, exit 0, live. |
| inv-22 fourier `/`→404 problem+json | **[HOLDS, with note]** | Live `/`→`404 application/problem+json`. Body is `{"type":"about:blank","title":"Not Found","status":404}` — FastAPI's *default* envelope, NOT the catalog `urn:...` envelope. Still problem+json, so PASS, but the 404 on `/` is the SPA-catch-all-absent generic, not a surgical typed envelope. Cosmetic. |
| inv-22 fourier `/health`→ok | **[HOLDS, with note]** | `/health`→200 `{"status":"ok"}` — but this is a **static nginx stub** (`nginx/fourier.conf:45 location = /health … return 200`), NOT a FastAPI route. The real app route is `/api/health` (also 200 ok, in `/openapi.json`). The "health" gate is satisfied by an nginx literal, not the backend. Honest but worth knowing for G. |
| inv-22 fourier `/docs`,`/openapi.json` | **[HOLDS]** | `/docs`→200 Swagger HTML (1019 B, not SPA); `/openapi.json`→`"title":"Fourier Analysis API"`. |
| F-α rate-limit dynamic (escape clause) | **[HOLDS]** | Live burst of 8 GETs to `/api/health`: `RateLimit-Remaining` decremented 1199→1192 monotonically; `Limit=1200`, `Reset` dynamic. "Observably non-static" escape clause is genuinely met. The ≥1-429 burst clause was NOT exercised (correctly disclosed as untested in FINAL.md). |
| F-β compute-cache symmetric | **[HOLDS]** | `api/services/compute_cache.py:55` `cache_key(contour_hash, params: dict)`; `COMPUTE_VERSION="v1"` at L47; payload `f"{contour_hash}\|{canonical}\|{COMPUTE_VERSION}"` at L62. The 3-field-positional contract is gone; parametric key confirmed. (CACHE_HIT not live-exercised here — needs a compute round-trip; code path present.) |
| C4 ORT flood | **[HOLDS]** | `api/__init__.py:12` `os.environ.setdefault("ORT_LOGGING_LEVEL", "3")` set before onnxruntime import. |
| F-δ a11y/SEO | **[HOLDS]** | `web/public/robots.txt` present (103 B, `Allow: /`); `web/index.html` carries 1 `name="description"` meta. |
| F-δ perf font-pin | **[HOLDS]** | `web/index.html:18-34` — all `cm-web-fonts` URLs pinned to immutable commit `333f55ec19733c…` (full 40-char SHA, not `@latest`). |
| C9 numbering reconciled | **[HOLDS]** | `docs/tranches/INVARIANTS.md` exists, is internally consistent, name-resolves the 18/19/20 B↔C collision + 21/22 B↔F re-use non-destructively. See §3. |
| auto-migration GREEN via deploy-hook | **[HOLDS — receipt only]** | Receipt `F-W8-auto-migration.txt`: `migrations` collection count=3, all `result: SUCCESS`, all sharing one `deploy_run_id=6fb88af5fc02@4007ec5…`. I cannot re-probe the prod Mongo collection (no host creds in this lane) — the claim rests on the receipt. The local migration *tests* (`test_migrate_*`, `test_migrate_integration`) are in the 214-green suite. **[caveat: receipt-trust, not re-derived]** |

**No gate FAILS falsification.** The one gate met by escape-clause (F-α) is honestly flagged as such in FINAL.md.

---

## §2 — Invariant adherence sweep (current code)

### [INVARIANT-VIOLATION — inv-11 one-identity, latent] — duplicated client-IP source

There are **two divergent client-IP derivations** in the live code:

- `api/dependencies.py:182` `get_client_ip(request)` — full chain: `X-Forwarded-For` → `X-Real-IP` → `request.client.host`. Used correctly by sessions (`sessions.py:39,60`), visualizations (`visualizations.py:92`), and admin (9 call sites).
- `api/services/rate_limiter.py:227` — the rate-limit middleware uses **raw `request.client.host` only**, bypassing `get_client_ip` entirely.

This is the literal inv-11 "one identity scheme" smell the GA3 charter named (`get_client_ip` vs the rate-limiter's IP handling). It is also the **root cause of the F-α "shared global bucket" residual**: the limiter keys on the proxy hop instead of resolving the real client IP that `get_client_ip` already knows how to extract. The code comment at `rate_limiter.py:143` is **misleading** — it says "`get_client_ip` currently resolves to the nginx-seen proxy address," but the middleware does **not call `get_client_ip` at all**; it calls `request.client.host` directly. The "real-client-IP" residual (FINAL.md §5) is therefore *under-scoped*: even after nginx `real_ip` lands, the rate limiter would still need to be re-pointed at the unified `get_client_ip` helper, or the duplication persists. **Tranche-G fix candidate: collapse the limiter onto `get_client_ip`.** file:line — `api/services/rate_limiter.py:227` vs `api/dependencies.py:182`.

### [HOLDS — inv-12 KISS]
The rate-limit middleware is genuinely a single enforce+report path (`check()` then `snapshot()`+`_stamp()`), `_limiter_for_path` is a clean single-pick dispatch. The cache collapse to one parametric key holds. No contrivance found.

### [HOLDS — inv-15 no dead exports]
`read_limiter` is consumed via `_limiter_for_path` (`rate_limiter.py:197`) + asserted in tests. `get_client_ip` is widely called (11 sites). No orphaned export surfaced in the audited modules.

### [HOLDS — inv-16 cross-repo source boundary]
`git diff --name-only d08e515^ d34d21b` touches **only** `api/`, `docs/`, `nginx/`, `scripts/`, `web/` — all fourier-analysis paths. ZERO non-fourier source touched. The deploy-repo work landed in the separate `mkbabb/deploy` repo (not this tree). inv-16 HELD across the entire F commit range.

### [HOLDS — inv-20 NO-legacy]
The `epicycle_cache`→`compute_cache` rename abandons old docs cleanly (`compute_cache.py:21`). Grep for `fallback|legacy|_AVAILABLE|compat|deprecated` surfaces only: (a) migration-script comments describing the *data* legacy collections being migrated AWAY from (correct usage); (b) `equations.py:83` "Tier 3: Spline fallback" — a legitimate *mathematical* approximation tier (symbolic→identified→spline), not a code-quality shim. No `_AVAILABLE` flags, no dead branches. Clean.

### inv-22 — see §4 [DRIFT].

---

## §3 — Plan/wave coherence (A→F arc + orderings)

**[HOLDS]** The ordering chain δ→ε→ζ→η→θ→ι→θ′ in `CANONICAL-ORDERING.md` is internally consistent and each supersession cites the prior. Note the Greek-letter ordering tags (§8 γ, §9 δ, §10 ε, §11 ζ, §12 η, §13 θ, §14 ι, §15 θ′) are NOT alphabetically monotone — §14 is "ι" then §15 reverts to "θ′" — because §14 (ι) is the *constellation-wide* ordering and §15 (θ′) is the *fourier-local* post-F ordering; they are deliberately different namespaces. The MEMORY.md shorthand "δ→η→θ→θ′ + ι" matches this. Coherent, if dense.

**[HOLDS]** INVARIANTS.md ledger is consistent with the charters it indexes: it does not renumber, it name-resolves. F.md §2's `inv-21`/`inv-22` F-local re-use is correctly flagged with the asterisk convention and the "appended phrase is always load-bearing" rule. The B↔C 18/19/20 collision and the `inv-19` TLS-vs-single-replica semantic split are both reconciled as documented.

**[HOLDS — no silent gate slip]** F.md §6 gates that were *revised* (inv-22 narrowed to `/docs`-Swagger-OK + scope {fourier,color}; F-δ.b narrowed to a single font-pin; F-T-E1/S2 REJECTED) were all revised at the **Wχ research wave BEFORE execution** (§13.4/§13 last para documents the RATIFIED-WITH-DELTA), not silently slipped at close. The narrowing is on-record and pre-execution. This is honest.

**One coherence wrinkle [DRIFT-minor]**: The original inv-22 definition (ordering θ §13.3, F.md §13.3) states both vhosts return JSON on **`/`, `/health`, `/docs`, `/openapi.json`**. The Wχ-revised scope kept that wording but FINAL.md §1 silently relaxes the *color* side to just `/`→json. The color API does **not** satisfy the original 4-endpoint definition (see §4). The reconciliation between "inv-22 as defined" and "inv-22 as gated for color" is not written down anywhere — a G-candidate doc fix.

---

## §4 — Doc-vs-reality drift (5 load-bearing claims)

| # | Claim (source) | Live reality | Verdict |
|---|---|---|---|
| 1 | "inv-22 vhost-correctness-symmetric … both API vhosts return JSON on `/`, `/health`, `/docs`, `/openapi.json`" (FINAL.md §6; F.md §13.3) | `api.color.babb.dev`: `/`→200 json ✓ BUT `/health`→**404**, `/docs`→**404**, `/openapi.json`→**404** (all Apache-served `application/problem+json`, palette-api has no such routes). fourier side: all 4 hold. | **[DRIFT]** — "symmetric" overstates. Color satisfies only the `/`→json clause. The FINAL.md gate row (`api.color.babb.dev/`→json) is technically PASS *as gated*, but the inv-22 *definition* and the word "symmetric" do not hold. NOT a close-breaker (color is value.js-owned, inv-16-out-of-bounds for fourier to fix), but the claim is inflated. |
| 2 | "T7 conformance probe 12/12 PASS" (FINAL.md §0/§1) | Re-ran live: **12/12 PASS**, exit 0. | **[HOLDS]** |
| 3 | "pytest 214/214 (≥ the 212 floor)" (FINAL.md §1) | **214 passed**. | **[HOLDS]** |
| 4 | "rate limiter … keys on the proxy IP … shared global bucket" (FINAL.md §5) | Confirmed at code (`rate_limiter.py:227` uses `request.client.host`) AND live (Remaining decremented across a single-client burst — consistent with a non-segmented bucket). | **[HOLDS]** — honest residual. But the residual is *under-scoped* (see §2 inv-11): it omits that the fix must also unify onto `get_client_ip`. |
| 5 | "inv-16 … HELD across all fourier-F commits (touched only `fourier-analysis/**`)" (FINAL.md §6) | `git diff --name-only d08e515^ d34d21b` → only api/docs/nginx/scripts/web. | **[HOLDS]** |

**Bonus drift [benign]**: FINAL.md §0 "Heads of record: fourier-analysis HEAD `d98da91`" but actual HEAD is `d34d21b`. `d34d21b` is the F.W13 close commit that *authored* FINAL.md itself (self-reference: a doc cannot cite its own future SHA). `d98da91` is the immediately-prior head. Benign, expected.

---

## §5 — Summary for the synthesizer

**Does F's close survive falsification? YES.** All thirteen F.md §6 hard gates reproduce independently: pytest 214/214, vue-tsc + build green, T7 12/12 PASS live, inv-22 fourier-side endpoints correct, rate-limit observably-dynamic (escape clause genuine), cache parametric, ORT/SEO/font-pin all present. The close's self-description (GREEN-with-named-residuals, NOT clean) is accurate and honest — including the disclosure that the ≥1-429 burst clause was never exercised and that the auto-migration GREEN rests on a receipt I could not re-probe (host-cred-gated).

**Top findings for tranche-G:**
1. **[INVARIANT-VIOLATION, inv-11, latent]** Two divergent client-IP sources: `rate_limiter.py:227` (`request.client.host`) bypasses the unified `get_client_ip` (`dependencies.py:182`). This IS the root of the F-α global-bucket residual, and the FINAL.md residual is under-scoped because it omits the unification. **Strongest G candidate.**
2. **[DRIFT]** inv-22 "symmetric" is overstated: `api.color.babb.dev` returns 404 (not JSON) on `/health`/`/docs`/`/openapi.json`; only `/`→json holds. The inv-22 *definition* (4 endpoints) is unmet for color, and the definition-vs-gate gap is undocumented.
3. **[note]** fourier `/health` is a static nginx literal, not a backend route — fine, but the "health" gate is satisfied outside the app.
4. **[note]** fourier `/`→404 uses FastAPI's generic `about:blank` envelope, not the catalog `urn:` typed envelope (cosmetic).

**No gate fails. No half-state in fourier source. inv-16/inv-20 clean.** The arc (A→F) and ordering chain are coherent; the one wrinkle is the undocumented inv-22 definition-vs-color-gate relaxation.
