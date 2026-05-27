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

`fourier-analysis-mongo :27017`, `floridify-mongo :27018`, `palette-api-mongo :27020` all bind `0.0.0.0` **and** are reachable from `34.197.214.67` (external TCP connect confirmed, NA1/NA5) — triple-allowed by the `0.0.0.0` docker publish, **explicit UFW `ALLOW IN Anywhere` rules per port**, and a permissive AWS SG. Only SCRAM `--auth` + `requireTLS` (with `tlsAllowInvalidCertificates=true` — unverified) stands between the Internet and each DB, and the Mongo credentials are **committed plaintext** in the compose files. **This is a live exposure that arguably warrants a hotfix ahead of the full tranche.** The fix (α′.W3, or sooner): compose `ports:` `0.0.0.0`→`127.0.0.1`/no-publish (the backend reaches `mongo:27017` over the compose network), withdraw the four UFW rules, pair with the C.W2 TLS-laxity cutover. fourier's Mongo bind is fourier-owned; the palette + floridify binds are cross-app (coordinated).

### §3.2 — The `api.<app>` TLS ceiling (a cost/naming decision)

Cloudflare **free-tier Universal SSL covers only single-level `*.babb.dev`** — so `api.fourier.babb.dev` (two-level) gets **no edge certificate** → TLS handshake failure (NA3). Two honest paths:
- **(a) Advanced Certificate Manager** (~$10/mo) — a two-level/`*.fourier.babb.dev`-style cert; keeps the user's exact `api.<app>.babb.dev` pattern.
- **(b) `<app>-api.babb.dev`** (single-level, e.g. `fourier-api.babb.dev`) — free under the existing `*.babb.dev` cert; a small naming deviation from the stated pattern.

**Recommendation: confirm with the user** — (a) honours the pattern at ~$10/mo; (b) is free with a minor rename. Separately, the CF→origin leg needs the origin's LE cert (`CN=sudoku.babb.dev`, SAN fourier/sudoku/words) extended to cover the api hostnames (`certbot --expand`) or a CF `*.babb.dev` Origin Cert, with CF SSL mode **Full (strict)** (NA5). Also: the proxied-A backends need a public origin — the host's public IP `34.197.214.67`, or a **CF Tunnel** (`cloudflared`) since `mbabb.fridayinstitute.net` is RFC1918.

## §4 — The CF-Pages recipe (NA2 — the speedtest template, generalized)

Per static frontend: Vite `build` → `dist/` (`base:"/"`) → `public/_redirects` (`/*  /index.html  200` SPA fallback) + optional `_headers` (CSP) → `npx wrangler pages deploy dist --project-name <app> --branch master` → attach the `<app>.babb.dev` custom domain (CF auto-TLS on the single-level name). CI secrets by name only: `CLOUDFLARE_API_TOKEN` (Pages:Edit), `CLOUDFLARE_ACCOUNT_ID`, build-time `VITE_*`. GH-Pages→CF cutover: create the Pages project → verify on `.pages.dev` → flip the babb.dev DNS to `CNAME → <app>.pages.dev` → retire the `peaceiris/actions-gh-pages` deploy job (keep build-and-test) → tear down GH Pages (source None, delete `gh-pages`, remove `CNAME`).

## §5 — DNS programmatic path (NA3)

Yes — programmatic. KISS-ranked: **(1) a thin idempotent CF-REST-API script** for the DNS record set + `wrangler` for Pages; (2) `cf-terraforming` + Terraform only if the zone grows to warrant IaC (not now — one zone, ~10 apps); (3) dashboard. Keep `color`/`keyframes` records **grey-cloud** (orange-clouding breaks Pages TLS). **Don't-break**: the Google **MX** + **SPF TXT** (mail), the Squarespace apex `babb.dev A=198.185.159.144` (live 302→github.com/mkbabb — replace deliberately), the NS, and the `*.babb.dev` wildcard safety-net.

## §6 — Credential discipline (NA6) — binding on every α′ wave

The CF token is **NEVER** committed, written to a tracked file, or placed in compose / in-repo CI config. It lives in the GitHub Actions secret store + the operator's out-of-band store, referenced by name only (mirroring `deploy-hook.sh`'s no-secret discipline). **Perms needed (confirm/adjust):** `Zone:DNS:Edit` + `Zone:Zone:Read` (scoped to the babb.dev zone) for DNS; `Account:Cloudflare Pages:Edit` for Pages; `Zone:SSL and Certificates:Edit` only if ACM (§3.2a). Use a scoped token, not the Global API Key. **Because the token was pasted in chat, ROTATE it after the migration** — a named close-item of the final α′ wave.

## §7 — Pilot-then-rollout (NA6) + the α′ wave set

**fourier is the pilot** — D's α.W1/W2 already do the backend-deploy / DNS / ingress / Mongo-bind half; adding the CF-Pages-frontend extension makes fourier the complete end-to-end proof of the pattern (blast radius = one app on the shared multi-tenant host). Prove it on fourier, verify via the ε prod matrix, **then** roll the proven recipe across the others parallel-but-bounded — rejecting a big-bang all-apps cut that would entangle nine failure modes and endanger the healthy co-tenants (floridify, the 2-month-healthy palette-api).

The new **thread α′ (constellation deployment normalization)**, folded into `D.md §3`:
- **Wα-R4** (extends Wα): the DNS/CF/ingress recon (this audit) + the §3.2 TLS-path decision.
- **Wχ-P5** (extends Wχ): does the rollout avoid breaking the co-tenants + the mail/apex DNS; is the pilot a true end-to-end proof.
- **α′.W8 — DNS-as-code** (the CF-API script; the target record set; grey/orange discipline; the don't-break list).
- **α′.W9 — CF-Pages frontend migration** (fourier pilot first; then keyframes.js + value.js/color off GH Pages; per-app, bounded-parallel).
- **α′.W10 — backend ingress + CORS + Mongo-loopback security** (the per-`api.<app>` Apache vhost + the origin cert extension; the CORS allow-lists — fix palette's empty + floridify's stale; the Mongo-bind across fourier/palette/floridify + the UFW withdrawal).
- **α′.W11 — palette-api → color rename** (user-re-mandate-gated; reconcile the standalone-repo provenance vs value.js/api first).
- **α′.W12 — close**: precept promotion (the convention + the CF recipe into `docs/precepts/infra/`), the token ROTATE, the dangling-image/dead-vhost cleanup.

grammar is **explicitly deferred** from the rollout (author-coordinated). words/floridify stays all-mbabb (no split). The agent ceiling holds at 4/wave (reject one-agent-per-app fan-out).
