# G.Wα — Research-light (2 READ-ONLY lanes)

**Status**: CLOSED
**Thread**: α (deploy-of-record) + β.2 (IP identity)
**Agents**: 2 (parallel, READ-ONLY; mutated nothing — inv-21 honored)

## Lane A — frontend-deploy path (governs α)

**Findings (evidence-backed):**
- CF Pages project slug **`fourier-682`** (generic `fourier` slug was taken; CF auto-suffixed). Custom domain `fourier.babb.dev` CNAMEs to it. Mode = **wrangler DIRECT-UPLOAD**, NOT git-integrated → CF does not auto-build on push.
- The canonical recipe is `deploy/cf/pages-deploy.sh`; its emitted **CF deployment ID is the citable `deploy_run_id`** (inv-25).
- **CF creds**: local `fourier/.env` HAS `CLOUDFLARE_API_TOKEN` (len 53) + `CLOUDFLARE_ACCOUNT_ID` (len 32). **Host has NEITHER** + no `wrangler`. So the host deploy-hook **structurally cannot ship the SPA**, and the origin root is a deliberate 404 (inv-22) — the SPA is not a host concern.
- fourier already has `.github/workflows/ci.yml` (api-tests, web-build [`vue-tsc -b` + `vite build`], e2e). It **builds but does not deploy** the SPA; no `secrets:` block; its own header notes "this is the spot" for a future deploy arm. The natural extension point.
- **δ live-vs-source delta CONFIRMED** (prod still pre-`9bd80b3`): live serves CM-fonts `@latest` (source = pinned SHA `333f55e…`), **no** `<meta name="description">` (source has it), robots.txt = Cloudflare's 4497 B auto-file (source = F's 103 B). δ is NOT live.

**Recommendation (ratified): Architecture (b) — GitHub Actions + wrangler**, a `deploy-pages` job in `fourier-analysis/.github/workflows/` (`needs: [web-build]`, `if: push to master`), running the `pages-deploy.sh` logic (build `web/` → `wrangler pages deploy web/dist --project-name fourier-682`). CF token as a **GH Actions repo secret**. Beats (a) CF native git-integration (operator-heavy dashboard migration, diverges from the constellation's wrangler-direct-upload standard) and (c) host deploy-hook extension (host has no token/wrangler; widens secret blast-radius onto EC2 for a build-time job). inv-25 fit: dual-citable `deploy_run_id` (GH run URL + CF deployment ID); inv-16 fit: lives under fourier's own `.github/`.

**Operator coordination item:** the GH repo secret(s) `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (one-time set). Wχ confirms slug + scope.

## Lane B — nginx real_ip chain (governs β.2)

**Findings (evidence-backed, live-probed):**
- Chain: `real client → host Apache *:443 (ProxyPass http://localhost:8100/, ProxyPreserveHost On, mod_proxy auto-appends client to XFF; remoteip NOT loaded) → docker-proxy (SNAT) → docker nginx (fourier.conf, $remote_addr = 172.25.0.1 the bridge gw, app-net 172.25.0.0/16) → uvicorn (--proxy-headers --forwarded-allow-ips private-ranges)`.
- **CF does NOT front the API origin**: `dig api.fourier.babb.dev → 34.197.214.67` (raw EC2), no `CF-Ray`. ⇒ trusted forwarded header = raw **X-Forwarded-For**, NOT CF-Connecting-IP.
- **Spoof-proven**: a client-set `X-Forwarded-For: 1.2.3.4` is *preserved* leftward; Apache appends the real client; nginx appends the gw → `"1.2.3.4, <client>, 172.25.0.1"`. The real client is the entry Apache appends.
- **The exact nginx `real_ip` block** (server-level, before locations):
  ```nginx
  set_real_ip_from 172.25.0.0/16;   # docker app-network (peer = gw 172.25.0.1)
  set_real_ip_from 127.0.0.1;
  real_ip_header   X-Forwarded-For;
  real_ip_recursive on;
  ```
  `real_ip_recursive on` strips trusted hops right-to-left, stopping at the first untrusted entry = the real client; the attacker's leftmost XFF is never reached → spoof-safe.
- **TWO rewriters** in the path: the proposed nginx `real_ip` AND uvicorn `--proxy-headers`. They must be reconciled, not left to fight.
- **`get_client_ip` (`api/dependencies.py:182-193`) is wrong today**: `XFF.split(",")[-1]` = the LAST hop = `172.25.0.1` (gateway), not the client. The rate limiter (`rate_limiter.py:227`) doesn't even call it (uses raw `request.client.host`). 11 other call sites silently mis-key to the gateway.
- **Recommended single identity**: nginx `real_ip` rewrites `$remote_addr` → real client; set `X-Real-IP $remote_addr` (now the real client, overwritten so un-spoofable); point both the rate limiter and `get_client_ip` at **X-Real-IP** (drop the `XFF[-1]` heuristic), fall back to `request.client.host`. One identity end-to-end.

**Open risks → Wχ P2:** the double-rewriter resolution (keep uvicorn `--proxy-headers` or drop it once nginx is authoritative); the re-tightened per-client read budget value (Lane B est. 60–120/min per client vs the 1200 global); **the nginx `limit_req` zones (`fourier.conf:3-5`, `$binary_remote_addr`) ALSO flip from global to per-client** under `real_ip` — re-validate the 30 r/s / 2 r/s burst values aren't now too tight for one legit client; gateway-IP stability (pin the docker subnet); blast-radius of fixing the 11 other `get_client_ip` call sites.

## Gate
- Both lanes READ-ONLY; nothing mutated. ✓
- α architecture ratified (b); β.2 nginx block + identity wiring derived. ✓
- Carry-forward to Wχ: P2 absorbs the double-rewriter + budget + limit_req re-validation; W1 preflight confirms slug `fourier-682`.
