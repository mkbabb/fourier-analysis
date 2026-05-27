# D — constellation deployment normalization (mbabb + Cloudflare)

**Status**: planned (thread α′ — the new constellation-deployment thread). **Authored**: 2026-05-27 (user directive + the 6-lane normalization audit `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-6`). **Authority**: this doc consolidates the plan; the per-lane NA docs are the evidence; the disposition is `D.md §3` (the α′ waves) + `§7`.

## §1 — The directive

Normalize every constellation app to **`<app>.babb.dev` (frontend) + `api.<app>.babb.dev` (backend)**; frontends → **Cloudflare Pages** (the speedtest CI recipe); backends → **mbabb docker**; DNS → programmatic via the Cloudflare API; the GitHub-Pages apps (color, keyframes.js) move to CF Pages. A CF API token was provided (held out-of-band; see §6).

## §2 — The constellation (NA1) — the answer to "what other containers do we have"

Host = **AWS EC2, public `34.197.214.67`**, private `10.0.2.253`; one Apache TLS terminator is the sole public ingress; babb.dev is on Cloudflare NS.

| App | = repo | Frontend today | Backend today | Target (NA4) |
|---|---|---|---|---|
| **fourier** | fourier-analysis (`/var/www/fourier-analysis`) | mbabb nginx `:8100` (behind `fourier.babb.dev`) | docker (Mongo) | **SPLIT** — frontend→CF Pages (`fourier.babb.dev`), backend→mbabb (`api.fourier.babb.dev`) — the **pilot** |
| **color** | palette-api (`/home/mbabb/Programming/palette-api`, standalone rsync, **not** value.js/api) + value.js frontend | GH Pages (`color.babb.dev`=value.js) | docker Hono `:8130` | frontend→CF Pages; backend→mbabb `api.color.babb.dev`; **rename palette-api→color** (user-gated) |
| **sudoku** (CSC-411) | csp-solver (`/var/www/csp-solver`) | mbabb `:3000`/`:8120` (`sudoku.babb.dev`) | docker `:8000` (stateless) | **SPLIT** — frontend→CF Pages, backend→mbabb `api.sudoku.babb.dev` |
| **words** | floridify (`/home/mbabb/floridify`) | mbabb `:3001`/`:8110` (`words.babb.dev`) | docker `:8001` (Mongo) | **ALL-MBABB** — SSE streaming + buffering-bypass proxy + a notification server; same-origin wins; a split would be net-negative |
| **grammar** | bbnf-lang (`/var/www/grammar`) | static Vite via Apache (`grammar.babb.dev`), **no container** | none (the `server/` is `bbnf-lsp`, an editor LSP, not a web API) | static→CF Pages, **but DEFER** the cutover (1009 commits/14d, dirty master — author-coordinated quiet window, never a drive-by) |
| **keyframes.js** | keyframes.js | GH Pages (`keyframes.babb.dev`) | none (static lib demo) | **fully CF Pages** |
| **speedtest** | speedtest | **already CF Pages** (`speedtest.friday.institute`) + CF Workers + EC2 API | the reference recipe | already normalized — the template |

Support services (not apps): `code-server :8080`, host MySQL `:3306`, the `adnanh/webhook :9000` deploy receiver, Apache. Dangling images (gaggle, speedtest, server-api) + a dead `speedtest :8140` vhost — cleanup carries.

## §3 — The two load-bearing findings (decisions the user must weigh)

### §3.1 — CRITICAL SECURITY (live, not theoretical): three Mongos on the public Internet

`fourier-analysis-mongo :27017`, `floridify-mongo :27018`, `palette-api-mongo :27020` all bind `0.0.0.0` **and** are reachable from `34.197.214.67` (external TCP connect confirmed, NA1/NA5) — triple-allowed by the `0.0.0.0` docker publish, **explicit UFW `ALLOW IN Anywhere` rules per port**, and a permissive AWS SG. Only SCRAM `--auth` + `requireTLS` (with `tlsAllowInvalidCertificates=true` — unverified) stands between the Internet and each DB, and the Mongo credentials are **committed plaintext** in the compose files. **Per user direction, the fix is in-tranche, front-loaded as the FIRST act of W1** (not a pre-tranche hotfix): compose `ports:` `0.0.0.0`→`127.0.0.1`/no-publish (the backend reaches `mongo:27017` over the compose network), withdraw the four UFW rules, pair with W2's TLS-laxity cutover. fourier's Mongo bind is fourier-owned; the palette + floridify binds are cross-app (operator-coordinated in one shared-host session). External `nc -zv 34.197.214.67 27017 27018 27020` returns refused = the W1.Phase-1 close gate.

### §3.2 — The `api.<app>` TLS path — RESOLVED (grey-cloud + origin LE, free)

The earlier framing (ACM ~$10/mo vs `<app>-api` rename) is **superseded by the cleanest resolution the user surfaced**: since we control the origin, `api.<app>.babb.dev` records are **DNS-only (grey-cloud) A → `34.197.214.67`** — CF returns the origin IP, the browser connects directly, and the **mbabb Apache serves a Let's Encrypt cert** issued by `certbot --expand` on the already-installed certbot (`/usr/local/bin/certbot`) extending the live `/etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem` cert (which already covers fourier/sudoku/words as SANs) to include `api.fourier.babb.dev`, `api.color.babb.dev`, etc. LE has **no subdomain-depth limit** (the CF Universal SSL single-level constraint applies only to CF-edge TLS, i.e., orange-cloud); LE happily issues for `api.<app>.babb.dev` at any depth. Auto-renewal preserved via the existing certbot timer. **Free, exact naming (`api.<app>.babb.dev`), no ACM, no rename.** Frontends stay CF-Pages-proxied (single-level `<app>.babb.dev`, Universal SSL covers). Tradeoff vs orange-cloud-on-api: lose CF CDN/WAF/proxy on the api subdomains — acceptable (APIs don't need a CDN; the origin IP is the host's public IP and is already public — and W1 closes its actual exposure, the Mongos). If at some future point CF proxy on the api is wanted, ACM is the upgrade path; until then, grey-cloud + LE wins.

#### §3.2.a — ACME challenge mechanism: **HTTP-01 via `--apache`/`--webroot`** (the binding implementation; Wα-Δ-R4.1 resolution)

The Wα-R4 ratification surfaced a load-bearing delta (Δ-R4.1, `research/README.md` R4 + `research/_R-deltas.md`): the host's certbot install has plugins `apache`/`dns-route53`/`standalone`/`webroot` — **NO `dns-cloudflare`**. The earlier `--dns-cloudflare` invocation cannot run as written. Two paths considered:

- **Path A — install the plugin** (`pip install certbot-dns-cloudflare` matching the existing certbot at `/usr/local/bin/certbot`). Preserves DNS-01; adds a new host-ops dependency. Useful only if a wildcard cert is ever needed (which forces DNS-01).
- **Path B — HTTP-01 via existing `--apache`/`--webroot` plugin** (**chosen, the binding implementation**). Smallest mechanism; uses plugins already installed. Since `api.<app>.babb.dev` is grey-cloud (DNS-only A → `34.197.214.67`), the LE HTTP-01 challenge file at `http://api.<app>.babb.dev/.well-known/acme-challenge/<token>` is served by the origin Apache directly — no DNS-01 round-trip, no CF API call for the cert path, no new plugin install. The CF token's `Zone:DNS:Edit` perm remains needed for the W8 DNS-as-code script (writing the grey-cloud A records), but NOT for cert issuance.

**Binding invocation** for all W2 / W10 `certbot --expand` calls:

```bash
sudo certbot --expand --cert-name sudoku.babb.dev \
    --apache \
    -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev[,api.color.babb.dev,api.sudoku.babb.dev]
```

(`--apache` plugin both serves the challenge AND auto-reloads Apache. Alternatively `--webroot -w /var/www/html` for an Apache-config-untouched variant.) The A records for the api hostnames MUST exist before certbot runs (Apache needs the vhost or default-server to handle the challenge request); W8 lands them first, then W2/W10 issue.

**Prerequisite (W2/W10 binding)**: each `api.<app>.babb.dev` has an HTTP (`:80`) reachable Apache vhost or the default `:80` ServerAlias catches it, serving `/.well-known/acme-challenge/*` files from the certbot-managed challenge dir (`--apache` plugin handles this automatically).

## §4 — The CF-Pages recipe (NA2 — the speedtest template, generalized)

Per static frontend: Vite `build` → `dist/` (`base:"/"`) → `public/_redirects` (`/*  /index.html  200` SPA fallback) + optional `_headers` (CSP) → `npx wrangler pages deploy dist --project-name <app> --branch master` → attach the `<app>.babb.dev` custom domain (CF auto-TLS on the single-level name). CI secrets by name only: `CLOUDFLARE_API_TOKEN` (Pages:Edit), `CLOUDFLARE_ACCOUNT_ID`, build-time `VITE_*`. GH-Pages→CF cutover: create the Pages project → verify on `.pages.dev` → flip the babb.dev DNS to `CNAME → <app>.pages.dev` → retire the `peaceiris/actions-gh-pages` deploy job (keep build-and-test) → tear down GH Pages (source None, delete `gh-pages`, remove `CNAME`).

## §5 — DNS programmatic path (NA3)

Yes — programmatic. KISS-ranked: **(1) a thin idempotent CF-REST-API script** for the DNS record set + `wrangler` for Pages; (2) `cf-terraforming` + Terraform only if the zone grows to warrant IaC (not now — one zone, ~10 apps); (3) dashboard. Keep `color`/`keyframes` records **grey-cloud** (orange-clouding breaks Pages TLS). **Don't-break**: the Google **MX** + **SPF TXT** (mail), the Squarespace apex `babb.dev A=198.185.159.144` (live 302→github.com/mkbabb — replace deliberately), the NS, and the `*.babb.dev` wildcard safety-net.

## §6 — Credential discipline (NA6) — binding on every α′ wave

The CF token is **NEVER committed or written to any tracked file**. It IS saved (per user direction, 2026-05-27) in **gitignored `.env`s** at `fourier-analysis/.env` and `value.js/.env` (`0600`, verified gitignored via `git check-ignore`), plus the CI provider's secret store (GitHub Actions) when CI publishes Pages. Referenced by name (`CLOUDFLARE_API_TOKEN`) — never echoed in shell history, logs, commits, or chat. **The user's provided perm-set is sufficient** (see §6.1); the minimal-honest subset is also documented for an operator wanting a tighter token. **Do NOT rotate** (per user direction); rotate only on suspicion.

### §6.1 — Perms sufficiency (the user-provided list)

The user supplied a generous token-perm list. The minimal-honest subset this plan needs:

| Action | Minimal perm |
|---|---|
| Edit DNS records in the babb.dev zone (the W8 CF-API script + certbot DNS-01) | **Zone:DNS:Edit** (`Zone DNS Settings Write` + `DNS Write` + `DNS View` all cover it) |
| Deploy CF Pages (W9 `wrangler pages deploy`) | **Account:Cloudflare Pages:Edit** (`Pages Write`) |
| Read zone metadata | **Zone:Zone:Read** (`Zone Write` implies read) |

That's it for the grey-cloud + LE plan. **SSL/Certificates perms are NOT needed** (grey-cloud means LE on the origin handles certs; certbot uses DNS:Edit for DNS-01, not CF SSL APIs). The user-supplied list includes those + many extras (`Registrar Domains Admin`, `Workers CI/Containers`, `Intel`, `Radar`, `Logs`, `Analytics`, `API Tokens Read`, `API Gateway`, `CF Agents`) — **harmless to have, broader than needed**; over-permissioned = larger blast radius on leak, but the token lives only in gitignored `.env`s + the CI store, so the bound is small. **Verdict: sufficient and intentional; no perm changes required.** If you ever want to trim, the four-perm minimum above is the floor.

## §7 — Pilot-then-rollout (NA6) + the α′ wave set

**fourier is the pilot** — D's α.W1/W2 already do the backend-deploy / DNS / ingress / Mongo-bind half; adding the CF-Pages-frontend extension makes fourier the complete end-to-end proof of the pattern (blast radius = one app on the shared multi-tenant host). Prove it on fourier, verify via the ε prod matrix, **then** roll the proven recipe across the others parallel-but-bounded — rejecting a big-bang all-apps cut that would entangle nine failure modes and endanger the healthy co-tenants (floridify, the 2-month-healthy palette-api).

The new **thread α′ (constellation deployment normalization)**, folded into `D.md §3`:
- **Wα-R4** (extends Wα): the DNS/CF/ingress recon (this audit) + the §3.2 TLS-path decision.
- **Wχ-P5** (extends Wχ): does the rollout avoid breaking the co-tenants + the mail/apex DNS; is the pilot a true end-to-end proof.
- **α′.W8 — DNS-as-code** (the CF-API script; the target record set; grey/orange discipline; the don't-break list).
- **α′.W9 — CF-Pages frontend migration** (fourier pilot first; then keyframes.js + value.js/color off GH Pages; per-app, bounded-parallel).
- **α′.W10 — backend ingress + origin LE for `api.<app>` + CORS** (the per-`api.<app>` Apache vhost; `certbot --expand` on the origin to add the api SANs via DNS-01 using the CF token; the CORS allow-lists — fix palette's empty + floridify's stale). The Mongo-bind moved to W1 (front-loaded security).
- **α′.W11 — palette-api → color rename** (user-re-mandate-gated; reconcile the standalone-repo provenance vs value.js/api first).
- **α′.W12 — close**: precept promotion (the convention + the CF recipe + the API plan into `docs/precepts/infra/`), the dangling-image/dead-vhost cleanup. **Token is NOT rotated** (per user direction).

grammar is **explicitly deferred** from the rollout (author-coordinated). words/floridify stays all-mbabb (no split). The agent ceiling holds at 4/wave (reject one-agent-per-app fan-out).

## §8 — The full API plan (per backend)

The pattern is uniform; each app's backend gets the same four moves. The grey-cloud + origin-LE TLS path (§3.2) underlies the whole set.

### §8.1 — The shape (per `api.<app>.babb.dev` backend)

1. **DNS** (W8): a **grey-cloud (DNS-only) `A` record** `api.<app>.babb.dev` → `34.197.214.67` in the Cloudflare zone (the idempotent CF-API script writes it; the user's `Zone:DNS:Edit` perm covers it).
2. **TLS at the origin** (W2/W10): `sudo certbot --expand --cert-name sudoku.babb.dev --apache -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.<app>.babb.dev` — HTTP-01 challenge via the existing `--apache` plugin (per §3.2.a — the binding implementation; the `dns-cloudflare` plugin is absent, Wα-Δ-R4.1). The api.<app> hostname must have an HTTP-reachable A record (W8 lands it grey-cloud first); the LE challenge resolves through the origin Apache directly. Auto-renew via the existing certbot timer. The origin serves the LE cert — browsers see a normal trusted chain, no CF edge involvement on the api hostname.
3. **Ingress** (W10): one host-Apache vhost per `api.<app>.babb.dev`, e.g.
   ```apache
   <VirtualHost *:443>
       ServerName api.<app>.babb.dev
       SSLEngine on
       SSLCertificateFile /etc/letsencrypt/live/<cert>/fullchain.pem
       SSLCertificateKeyFile /etc/letsencrypt/live/<cert>/privkey.pem
       ProxyPreserveHost on
       ProxyPass / http://localhost:<gateway-port>/
       ProxyPassReverse / http://localhost:<gateway-port>/
       RequestHeader set X-Forwarded-Proto https
   </VirtualHost>
   ```
   Proxying to the per-app **nginx gateway** (not directly to the backend container) — preserves rate-limits/headers/timeouts (NA5 verdict). HTTP→HTTPS redirect on `*:80` as needed.
4. **CORS** (W10): the backend allows the split frontend's origin — `CORS_ORIGINS=https://<app>.babb.dev` (+ `https://localhost:<dev-port>` for dev). Set per app: fourier `api/config.py` already reads `CORS_ORIGINS` correctly; palette-api `ALLOWED_ORIGINS` is currently EMPTY (gap to fix); floridify `BACKEND_CORS_ORIGINS` is currently stale (`mbabb.friday.institute`, not `*.babb.dev`).

### §8.2 — Per app (the binding rows)

| api hostname | Frontend it serves | Backend gateway port (origin) | App container | Repo |
|---|---|---|---|---|
| `api.fourier.babb.dev` | `fourier.babb.dev` (CF Pages, fourier `web/`) | `127.0.0.1:8100` (fourier-analysis-nginx) | fourier-analysis-backend (FastAPI+Mongo) | `/var/www/fourier-analysis` |
| `api.color.babb.dev` | `color.babb.dev` (CF Pages, value.js demo) | `127.0.0.1:8130` (palette-api Hono) | palette-api-api-1 | `/home/mbabb/Programming/palette-api` (standalone repo) — **rename to `color` at W11, user-gated** |
| `api.sudoku.babb.dev` | `sudoku.babb.dev` (CF Pages, csp-solver frontend) | `127.0.0.1:8120` (csp-solver-nginx) | csp-solver-backend | `/var/www/csp-solver` |
| *(no api)* | `keyframes.babb.dev` (CF Pages, static) | — | none | keyframes.js |
| *(no api)* | `grammar.babb.dev` (CF Pages, static — DEFERRED per active dev) | — | none (bbnf-lsp is an editor LSP, not a web API) | `/var/www/grammar` (bbnf-lang) |
| *(no split)* | `words.babb.dev` (mbabb nginx — all-mbabb, SSE + custom proxy) | same-origin `/api` | floridify-backend | `/home/mbabb/floridify` |

### §8.3 — Pilot then rollout (binding ordering)

fourier is the pilot — when `api.fourier.babb.dev` works end-to-end (DNS grey-cloud, certbot cert, Apache vhost, CORS, `fourier.babb.dev` on CF Pages calling it), the recipe is proven and the other apps' rows follow exactly the same four moves, bounded-parallel. Never a big-bang. The Mongo bind (W1, front-loaded security) covers all three apps' Mongos in one operational session before any deploy lands.

### §8.4 — `mbabb.fridayinstitute.net` (the RFC1918 wrinkle)

The host's hostname `mbabb.fridayinstitute.net` resolves to `10.0.2.253` (split-horizon, private). The public API target is the public IP `34.197.214.67` (used in the grey-cloud A records). Internal scripts/health-probes can use the private name; external (browsers, the CF Pages frontend) uses `api.<app>.babb.dev`→`34.197.214.67`.
