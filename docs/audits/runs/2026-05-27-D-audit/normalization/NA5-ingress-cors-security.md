# NA5 — `api.<app>.babb.dev` backend ingress + CORS + Mongo-loopback security + deploy/CI generalization

**Lane**: NA5 (tranche-D constellation normalization) · **Date**: 2026-05-27 ·
**Mode**: READ-ONLY. Repo ground-truth + read-only SSH to the prod host + read-only
public DNS/TLS probes. **No mutations**: every host command was `ls`/`cat`/`grep`/
`ss`/`ufw status`/`iptables -L`/`nft list`/`docker inspect`/`openssl … -noout`; every
public probe was `dig`/`openssl s_client`. The Cloudflare API token was **not** used.

This lane derives the *reusable constellation patterns* for the public-facing
two-domain model — `<app>.babb.dev` (frontend) + `api.<app>.babb.dev` (backend) —
from the live host reality. It is grounded in `file:line` and pasted SSH/DNS/TLS
output. It builds on DA4 (host/deploy/prod) and CA5 (storage/infra) rather than
re-deriving them.

---

## §0 — Headline

| Axis | Finding |
|---|---|
| **`api.<app>.babb.dev` ingress** | **NOT YET BUILT.** Today every app is path-routed at the bare apex (`fourier.babb.dev` → host-Apache `ProxyPass / → :8100`). No `api.*` vhost exists; `*.babb.dev` DNS is a CF wildcard so `api.fourier.babb.dev` resolves but lands on Apache's *default* vhost (sudoku, `:8120`). The canonical recipe is a per-`api.<app>` Apache vhost → `localhost:<backend-port>`, fronted by CF. |
| **CF SSL mode** | **Full (strict) is available and is the canonical target** — the origin already serves a real Let's Encrypt cert (`CN=sudoku.babb.dev`, SAN `fourier/sudoku/words.babb.dev`, issuer LE E8). Public domains resolve to CF anycast (orange-cloud proxied). `api.<app>` is **not** in the current SAN — the cert must be extended (or a CF Origin Cert minted) before the `api.` vhost is valid end-to-end. |
| **CORS** | Cross-origin is real (frontend on CF, backend on `api.<app>`). fourier sets it correctly (`CORS_ORIGINS=https://fourier.babb.dev`). **palette-api's `ALLOWED_ORIGINS` is EMPTY in the live container** (CORS effectively closed — a gap). **floridify points at the OLD origin** (`https://mbabb.friday.institute`, not `*.babb.dev`). |
| **Mongo exposure** | **LIVE, not firewalled.** `ss` shows 27017/27018/27020 bound on `0.0.0.0` *and* `[::]`; **ufw explicitly `ALLOW IN … Anywhere`** for 27017–27020 (each named per app). The host firewall does **not** block them — it deliberately opens them. Only TLS+SCRAM auth stands between the public internet and each Mongo. **Severity stays HIGH.** |
| **Deploy model** | Backends deploy via the shared `/opt/deploy/` webhook dispatcher (per-app `case` arm → docker rebuild + health gate); frontends deploy via CF Pages CI (per NA2). fourier's C-authored `scripts/deploy-hook.sh` is the improved per-app backend arm. |

---

## §1 — The `api.<app>.babb.dev` backend ingress recipe (canonical)

### 1.1 — The live topology (what each layer is)

```
client ──HTTPS──▶ Cloudflare edge (orange-cloud proxy, *.babb.dev)
                    │  CF terminates the public TLS; re-originates to the host
                    ▼
            host Apache  *:443  (the single TLS terminator on the box)
              ├─ vhost ServerName <app>.babb.dev        → ProxyPass / → localhost:<gateway-port>
              └─ vhost ServerName api.<app>.babb.dev     → ProxyPass / → localhost:<backend-port>   ← THE NEW ARM
                    │
                    ▼
            per-app docker stack (one compose project per app)
              ├─ <app>-nginx     127.0.0.1:<gateway-port>:80   (SPA + /api/ → backend)
              ├─ <app>-backend   (loopback or internal-only)
              ├─ <app>-frontend  (internal)
              └─ <app>-mongo     (see §3 — currently 0.0.0.0)
```

**Evidenced:**

- **CF proxies the public domain.** `babb.dev` is on Cloudflare nameservers, and
  every app apex resolves to CF anycast (origin hidden):

  ```
  $ dig +short babb.dev NS                → jillian.ns.cloudflare.com / maciej.ns.cloudflare.com
  $ dig +short fourier.babb.dev A         → 172.67.175.252 / 104.21.56.22   (Cloudflare ranges)
  $ dig +short words.babb.dev  A          → 104.21.56.22 / 172.67.175.252
  $ dig +short sudoku.babb.dev A          → 172.67.175.252 / 104.21.56.22
  $ dig +short api.fourier.babb.dev A     → 172.67.175.252 / 104.21.56.22   (CF wildcard — resolves, but…)
  ```

- **Apache is the single host-side TLS terminator** (host nginx/caddy inactive —
  DA4 §5). The current vhost shape (`/etc/apache2/sites-enabled/babb-dev.conf:36-55`):

  ```apache
  # fourier.babb.dev — built with base=/fourier/
  <VirtualHost *:443>
      ServerName fourier.babb.dev
      SSLCertificateFile /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem
      ProxyPreserveHost On
      RequestHeader set X-Forwarded-Proto "https"
      ProxyPass        / http://localhost:8100/
      ProxyPassReverse / http://localhost:8100/
  </VirtualHost>
  ```

- **The per-app docker nginx IS the gateway** the apex vhost targets. fourier's
  apex `→ :8100` lands on `fourier-analysis-nginx-1` (`127.0.0.1:8100->80`, DA4
  §1.1), which serves the SPA at `/` and proxies `/api/` to the backend
  (`nginx/fourier.conf:30,42`). The fourier *backend* has **no published host
  port** (DA4 §1.1: `(no published ports)`) — it is reachable only inside the
  compose network via the nginx gateway.

### 1.2 — The decision: does `api.<app>` route through the per-app nginx, or bypass to the backend?

Two shapes are viable; the **gateway-reuse** shape is canonical (KISS, invariant 12):

| Shape | Apache `api.<app>` `ProxyPass` target | Pros | Cons |
|---|---|---|---|
| **A — reuse the per-app nginx gateway (CANONICAL)** | `→ localhost:<gateway-port>` (e.g. fourier `:8100`), letting nginx's `location /api/` route to the backend | Reuses the rate-limit zones (`nginx/fourier.conf:3-5`), the security headers (`:13-17`), the compute-route timeouts (`:19-28`); **the backend keeps zero published host ports**; one upstream per app | `api.<app>.babb.dev/api/foo` double-prefixes — the SPA must call the backend at `api.<app>.babb.dev/api/…` and nginx already expects `/api/`, so it works unchanged; bare `api.<app>.babb.dev/foo` (no `/api`) would 404 (acceptable: the API contract is `/api/*`) |
| B — bypass nginx, publish the backend on a loopback port | `→ localhost:<backend-port>` directly | Cleanest URL (`api.<app>.babb.dev/health`) | Forces the backend to publish a host port (fourier currently publishes none); **loses** the nginx rate-limit/header/timeout layer; duplicates concerns Apache + nginx already cover |

**Verdict — Shape A.** Point the `api.<app>` vhost at the same `localhost:<gateway-port>`
the apex vhost already uses. The per-app nginx stays the single backend front-door;
the backend stays unpublished. The only app-specific knob is the gateway port
(fourier 8100, floridify 8110, csp 8120, palette 8130 — DA4 §5, ratified, no renumber).

### 1.3 — The canonical vhost (drop-in, fourier shown)

```apache
# api.fourier.babb.dev — backend ingress (NA5 canonical)
<VirtualHost *:443>
    ServerName api.fourier.babb.dev

    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    SSLEngine on
    # The cert SAN MUST include api.fourier.babb.dev — see §1.4.
    SSLCertificateFile    /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/sudoku.babb.dev/privkey.pem

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyTimeout 120
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    ProxyPass        / http://localhost:8100/   # the fourier-analysis-nginx gateway
    ProxyPassReverse / http://localhost:8100/
</VirtualHost>
```

Generalised: `ServerName api.<app>.babb.dev`, `ProxyPass / → localhost:<gateway-port>`,
same headers + `X-Forwarded-Proto https` (the backend trusts these via uvicorn
`--proxy-headers --forwarded-allow-ips '*'`, DA4 §1.2). Apache's required mods are
already enabled: `proxy.load`, `proxy_http.load`, `headers.load`, `ssl.load`,
`rewrite.load` (`/etc/apache2/mods-enabled/`).

### 1.4 — CF mode + the origin cert (Full strict, not Flexible)

- **The origin has a real public cert** — Apache serves Let's Encrypt for these vhosts:

  ```
  $ echo | openssl s_client -connect localhost:443 -servername fourier.babb.dev | openssl x509 -noout -subject -issuer -ext subjectAltName
  subject=CN = sudoku.babb.dev
  issuer =C = US, O = Let's Encrypt, CN = E8
  X509v3 Subject Alternative Name:
      DNS:fourier.babb.dev, DNS:sudoku.babb.dev, DNS:words.babb.dev
  ```

- **Therefore CF should run in Full (strict)** — CF validates the origin's LE cert,
  encrypting CF↔origin end-to-end. Flexible (CF↔origin plaintext) is **not** needed
  and **must not** be selected (it would expose the origin leg). The choice is per-app
  but the same for all: Full (strict).

- **The blocker for `api.<app>`**: the live SAN is **only the three bare domains** —
  `api.fourier.babb.dev` is **not** covered. A request for it today falls to Apache's
  default vhost and gets the wrong backend + a host-name-mismatched cert:

  ```
  $ echo | openssl s_client -connect localhost:443 -servername api.fourier.babb.dev | openssl x509 -noout -subject
  subject=CN = sudoku.babb.dev      ← default vhost; api.fourier is NOT a configured ServerName
  ```

  **Two equivalent fixes (operator picks one, D-step, not run here):**
  1. **Extend the LE cert SAN** to include `api.<app>.babb.dev` (certbot `--expand`
     adding the `api.` name), then point the new vhost at that fullchain. Keeps one
     cert; works for CF Full (strict).
  2. **Mint a CF Origin Certificate** (`*.babb.dev` wildcard, 15-yr) and have CF
     trust it in Full (strict). Covers all current + future `api.<app>` without
     per-name certbot expansion. This is the more constellation-scalable choice and
     removes the per-subdomain certbot churn.

  Either way: **DNS already resolves** (`*.babb.dev` CF wildcard), so the only deltas
  are (a) the Apache vhost (§1.3) and (b) the SAN/origin-cert coverage.

### 1.5 — The recipe, condensed

> **Per app, to stand up `api.<app>.babb.dev`:**
> 1. Ensure DNS: `api.<app>.babb.dev` proxied (orange cloud) on CF → already covered
>    by the `*.babb.dev` wildcard; add an explicit proxied record if the wildcard is
>    ever narrowed.
> 2. Cover the name in TLS: add `api.<app>.babb.dev` to the LE SAN (`certbot --expand`)
>    **or** adopt a CF `*.babb.dev` Origin Cert. Set CF SSL = **Full (strict)**.
> 3. Add the Apache vhost (§1.3): `ServerName api.<app>.babb.dev`,
>    `ProxyPass / → localhost:<gateway-port>`, `X-Forwarded-Proto https`.
> 4. `apachectl configtest && systemctl reload apache2`.
> 5. Set the backend's CORS to allow `https://<app>.babb.dev` (§2).

---

## §2 — CORS: the cross-origin pattern + per-app catalog

### 2.1 — Why it is cross-origin

When the frontend is at `https://<app>.babb.dev` (CF Pages or the docker SPA) and
the API at `https://api.<app>.babb.dev`, the browser treats them as **different
origins** (different host). Every API call (and its preflight `OPTIONS`) carries an
`Origin: https://<app>.babb.dev` header; the backend must reflect it in
`Access-Control-Allow-Origin` or the browser blocks the response. With cookies/session
tokens, `allow_credentials=true` requires an **exact** origin echo (not `*`).

> NOTE: today fourier is *same-origin* (SPA + `/api/` both under `fourier.babb.dev`
> via the one apex vhost), so CORS is latent. The moment the frontend moves to CF
> Pages on `<app>.babb.dev` while the backend answers on `api.<app>.babb.dev`, the
> split is real and `CORS_ORIGINS` becomes load-bearing. fourier already has the
> correct value staged.

### 2.2 — The fourier reference implementation

- **Read site**: `api/main.py:55-62` — splits a comma-list and feeds FastAPI's
  `CORSMiddleware`:

  ```python
  origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
  app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["Content-Type", "Authorization", "X-Session-Token"],
  )
  ```

- **Config field**: `api/config.py:10` — `cors_origins: str = "http://localhost:3000,http://localhost:5173"`
  (dev default; prod overrides via env).
- **Prod value (live container, DA4 §1.2 + re-confirmed)**:
  `CORS_ORIGINS=https://fourier.babb.dev` (`docker-compose.prod.yml:7`,
  `${CORS_ORIGINS:-https://fourier.babb.dev}`).

This is the canonical shape: a comma-separated env var → exact-origin allow-list →
`allow_credentials=true` (matches the `X-Session-Token` session model).

### 2.3 — Per-app CORS catalog (live `docker inspect` evidence)

| App | Var name | Read site | Live value | Verdict |
|---|---|---|---|---|
| **fourier** | `CORS_ORIGINS` (comma-list) | `api/main.py:55`, field `api/config.py:10` | `https://fourier.babb.dev` | **CORRECT** (already names the public frontend origin) |
| **palette-api** (value.js backend) | `ALLOWED_ORIGINS` (comma-list) | `palette-api/src/middleware.ts:7-8` (Set from split); prod-required guard `src/index.ts:80-81` (`throw if !ALLOWED_ORIGINS`) | **EMPTY** (`ALLOWED_ORIGINS=` in the live container) | **GAP — CORS effectively closed.** The prod-guard only fires at boot if *unset*; an empty string passes the guard but yields an empty allow-set, so no browser origin is admitted. Must be set to `https://palette.babb.dev` (or value.js's CF Pages origin). |
| **floridify** (words) | `BACKEND_CORS_ORIGINS` (JSON array) | live env | `["https://mbabb.friday.institute"]` | **STALE ORIGIN.** Points at the legacy `mbabb.friday.institute` apex, not `words.babb.dev` / `api.words.babb.dev`. Must be re-pointed when floridify adopts the two-domain model. |

**The pattern (canonical):** every split backend exposes a single env var (name
varies by framework — `CORS_ORIGINS` / `ALLOWED_ORIGINS` / `BACKEND_CORS_ORIGINS`)
whose value is the **exact** `https://<app>.babb.dev` frontend origin (plus any dev
origins), echoed with `allow_credentials=true`. The constellation normalization is:
**every app's backend env carries `https://<app>.babb.dev`** (and, if the SPA is also
served from the docker gateway under the apex, that origin too). Two of three siblings
are currently mis-set — palette-api empty, floridify stale.

---

## §3 — The Mongo-loopback security fix (and the firewall verdict)

### 3.1 — The exposure is LIVE, not firewalled — verdict HIGH

Three Mongos publish on **all interfaces**, and the host firewall **explicitly opens
them to the world**:

```
$ ss -tlnp | grep -E '2701|2702'
LISTEN 0 4096   0.0.0.0:27020   0.0.0.0:*          ← palette-api
LISTEN 0 4096   0.0.0.0:27017   0.0.0.0:*          ← fourier-analysis
LISTEN 0 4096   0.0.0.0:27018   0.0.0.0:*          ← floridify
LISTEN 0 4096      [::]:27020      [::]:*          (also IPv6)
LISTEN 0 4096      [::]:27017      [::]:*
LISTEN 0 4096      [::]:27018      [::]:*

$ ufw status verbose
Status: active
Default: deny (incoming), allow (outgoing), deny (routed)
…
27017/tcp   ALLOW IN  Anywhere   # MongoDB - fourier-analysis
27018/tcp   ALLOW IN  Anywhere   # MongoDB - floridify
27019/tcp   ALLOW IN  Anywhere   # MongoDB - speedtest
27020/tcp   ALLOW IN  Anywhere   # MongoDB - palette-api
(+ the v6 mirror rules)
```

**The firewall does NOT mitigate this — it deliberately allows it.** ufw's default is
`deny (incoming)`, but there are **explicit `ALLOW IN … Anywhere` rules for each Mongo
port** (named per app, so it was intentional, presumably to permit `dev → prod`
direct-TLS access — DA4 §5's "VPN removal" item). The underlying nft INPUT policy is
`drop`, but ufw's allow rules punch through it. So the ports are **reachable from the
public internet** (the box is the AWS instance `ip-10-0-2-253` whose public ingress is
CF + the open firewall).

**The only thing standing between the internet and each database is Mongo's own
TLS+SCRAM `--auth`** (DA4 §1.2 / §3.3: `requireTLS` + `--auth`). That is real
defence-in-depth, but it is the *sole* layer — and every URI uses
`tlsAllowInvalidCertificates=true` (fourier `docker-compose.prod.yml:8`; palette-api
live `…&tls=true&tlsAllowInvalidCertificates=true`; floridify live
`…&tls=true&tlsAllowInvalidCertificates=true`), so the TLS layer does **not** verify
the server cert and is downgradeable by an active MITM. **Net severity: HIGH** — a live,
internet-reachable database surface protected only by a single password layer over
unverified TLS. (CA5 §3.2 / DA4 §3.3 already flag the `tlsAllowInvalid*` laxity; NA5
adds that the network exposure is wide-open, not loopback.)

### 3.2 — The fix pattern (the compose `ports:` edit, per app)

Mongo does **not** need to be reachable from outside the docker network — each
backend reaches it via the compose service DNS name `mongo:27017` *inside* the
`app-network` bridge (fourier `docker-compose.yml:19`, `…@mongo:27017/…`). Publishing
it to the host at all is the defect. The canonical fix is to **stop publishing the
Mongo port to `0.0.0.0`**:

**fourier** — `docker-compose.prod.yml:44-46`:

```yaml
  mongo:
    ports:
      - "27017:27017"        # ← BEFORE: binds 0.0.0.0:27017 (world-reachable)
```

Two correct targets, in increasing strictness:

```yaml
    # Option A — bind to loopback only (still allows host-local dev→prod via SSH-fwd / tunnel)
    ports:
      - "127.0.0.1:27017:27017"

    # Option B (CANONICAL, strictest) — do NOT publish to the host at all;
    # the backend reaches mongo over the compose network. Remove the ports: block.
    # (matches floridify/palette/csp backends which talk to `mongo:27017` internally)
    # ports: []          # or simply delete the mongo `ports:` key
```

Apply the **identical edit per app**:

- **fourier**: `docker-compose.prod.yml:44-46` (`"27017:27017"` → remove or `127.0.0.1:`).
- **palette-api**: its compose `mongo` service (live `palette-api-mongo-1` shows
  `0.0.0.0:27020->27017/tcp`, DA4 §1.1) — same `ports:` edit.
- **floridify**: its compose `mongo` service (live `floridify-mongodb` shows
  `0.0.0.0:27018->27017/tcp`, DA4 §1.1) — same `ports:` edit.

Then **withdraw the ufw allow rules** (host-ops, the second half of the fix — without
this, a future re-publish silently re-exposes):

```
sudo ufw delete allow 27017/tcp   # fourier  (+ the v6 rule)
sudo ufw delete allow 27018/tcp   # floridify
sudo ufw delete allow 27019/tcp   # speedtest
sudo ufw delete allow 27020/tcp   # palette-api
```

> **Constellation note**: this is a *shared-host* security act touching all three
> sibling Mongos + the shared ufw policy. Per DA4 §5's shared-blast-radius discipline,
> the fourier compose edit is fourier-isolated, but the ufw rule withdrawal touches
> the constellation — coordinate (or scope each `ufw delete` to its named app port).
> If `dev → prod` direct Mongo access is still wanted, replace the open ufw rule with
> a source-scoped `ufw allow from <dev-ip> to any port 27017` rather than `Anywhere`.

> **Defence-in-depth pairing**: combine the loopback/no-publish fix with C.W2's TLS
> cutover (drop `tlsAllowInvalidCertificates` + the cert provisioning, CA5 §3.2 /
> DA4 §3) — together they restore both *network* and *transport* integrity.

---

## §4 — The unified constellation deploy model

Two deploy planes, one per domain leg:

```
                       ┌──────────────────────────── BACKEND plane ────────────────────────────┐
  git push (master) ──▶│  GitHub webhook ──HMAC-SHA256──▶ host adnanh/webhook (*:9000)          │
                       │                                    │  matches ref==refs/heads/master    │
                       │                                    ▼                                     │
                       │              /opt/deploy/scripts/dispatch.sh  (shared, per-repo case arm)│
                       │                 case mkbabb/fourier-analysis) → /var/www/fourier-analysis│
                       │                       └▶ scripts/deploy-hook.sh  (fourier's improved arm)│
                       │                            git reset --hard origin/master → compose build │
                       │                            → up -d → health-gate :8100/api/health         │
                       │                            → (fail ⇒ rebuild-on-rollback)                 │
                       └──────────────────────────────────────────────────────────────────────────┘
                       ┌──────────────────────────── FRONTEND plane (NA2) ─────────────────────────┐
  git push (frontend) ▶│  Cloudflare Pages CI  → build → publish to <app>.babb.dev (CF edge)       │
                       │  (value.js's `colors.babb.dev` resolves to GitHub-Pages/CF-Pages IPs       │
                       │   185.199.108-111.153 — confirms the static-frontend-on-CF pattern is live)│
                       └────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 — Backend plane (the shared webhook dispatcher)

- **Receiver** (shared): `webhook.service` → `/usr/local/bin/webhook -hooks
  /opt/deploy/hooks.json -port 9000` (DA4 §2.1), binding `*:9000`. Apache also
  reverse-proxies `/deploy/ → http://127.0.0.1:9000/`
  (`mbabb-friday-institute-ssl.conf:99-100`) so GitHub can post over HTTPS.
- **Dispatcher** (shared): `/opt/deploy/scripts/dispatch.sh` with one `case "$REPO"`
  arm per repo — fourier, words/floridify, palette-api/value.js, csp-solver,
  speedtest (DA4 §2.3). The fourier arm targets `/var/www/fourier-analysis` `:8100`
  `/api/health`.
- **Per-app arm** (the improvement): fourier's tracked `scripts/deploy-hook.sh` is
  the *improved* backend arm — `flock` serialisation (`:52,164`), a real bounded
  health-gate sourced from `${HTTP_PORT:-8100}` with no `|| echo` swallow
  (`:68-82`), rebuild-on-rollback + re-gate (`:147-158`), and dirty-tree-fail-loud
  (`:89-98`). DA4 §2.3 confirms the live `dispatch.sh` lacks all four
  (`grep -c flock`=0, `grep -c porcelain`=0) — D wires the fourier arm to `exec` this
  script. **This is the canonical per-app backend deploy arm** other apps' arms
  should converge on.
- **Secret hygiene**: `hooks.json` + `/opt/deploy/.env` are `0664` world-readable
  with the HMAC secret in the clear (DA4 §2.2) — tighten to `0600` + rotate (shared
  infra, low-risk permission act).

### 4.2 — Frontend plane (CF Pages CI — NA2's recipe)

- Public frontends are static SPAs published to `<app>.babb.dev` through Cloudflare
  Pages CI (a `git push` to the frontend repo triggers a CF build + edge publish).
  This is **NA2's recipe**; NA5 only records the interface to the backend plane.
- **Live evidence the static-on-CF pattern exists**: value.js's `colors.babb.dev`
  resolves to `185.199.108-111.153` (the GitHub-Pages anycast set, CF-frontable),
  distinct from the docker-backed apexes — i.e. a sibling already serves its frontend
  off a static/Pages plane while its API (`palette-api`) runs in docker on the host.
- The two planes meet at CORS (§2): the CF-Pages frontend origin
  `https://<app>.babb.dev` is exactly the value the backend's CORS env must allow, and
  `api.<app>.babb.dev` (§1) is exactly the API base the frontend's `VITE_API_URL`
  must point at (`docker-compose.prod.yml:30`, `.env.example:52` —
  `VITE_API_URL — absolute API base for the SPA when not same-origin`).

### 4.3 — The unified picture

> **Constellation deploy model**: per app, **backend pushes → host webhook → shared
> `dispatch.sh` arm → per-app `deploy-hook.sh` → docker rebuild + health-gate**;
> **frontend pushes → CF Pages build → `<app>.babb.dev` edge**. The two planes are
> bound by (a) the `api.<app>.babb.dev` Apache vhost (§1) the frontend calls, and (b)
> the `CORS_ORIGINS=https://<app>.babb.dev` the backend must allow (§2). fourier's
> `deploy-hook.sh` is the reference backend arm; CF Pages is the reference frontend
> plane (NA2).

---

## §5 — The four normalization deltas (what D would land)

1. **Ingress** — add a per-`api.<app>.babb.dev` Apache vhost → `localhost:<gateway-port>`
   (§1.3); extend the LE SAN (or adopt a CF `*.babb.dev` Origin Cert) to cover the
   `api.` name; set CF SSL = Full (strict). Today **no `api.*` vhost exists**.
2. **CORS** — set every split backend's origin var to `https://<app>.babb.dev`:
   fourier ✓ already correct; **palette-api `ALLOWED_ORIGINS` is empty (fix)**;
   **floridify `BACKEND_CORS_ORIGINS` is stale `mbabb.friday.institute` (re-point)**.
3. **Mongo exposure (HIGH, LIVE)** — change each `mongo` compose `ports:` from
   `0.0.0.0` publish to `127.0.0.1:` or no-publish (§3.2); withdraw the four ufw
   `ALLOW IN Anywhere` Mongo rules; pair with the C.W2 TLS-laxity cutover.
4. **Deploy** — wire fourier's `case` arm to the improved `scripts/deploy-hook.sh`;
   tighten `/opt/deploy/{hooks.json,.env}` to `0600` + rotate; document the
   backend-webhook + frontend-CF-Pages dual plane as the constellation standard.

---

## Appendix — verified evidence index (audit time)

**Repo (local master):**
- `api/main.py:55-62` — CORS middleware (exact-origin echo, `allow_credentials=true`).
- `api/config.py:10` — `cors_origins` field (dev default).
- `docker-compose.prod.yml:7` — `CORS_ORIGINS=${CORS_ORIGINS:-https://fourier.babb.dev}`.
- `docker-compose.prod.yml:8` — backend `MONGO_URI` `…&tls=true&tlsAllowInvalidCertificates=true`.
- `docker-compose.prod.yml:44-46` — `mongo` `ports: ["27017:27017"]` (0.0.0.0 publish).
- `docker-compose.prod.yml:30`, `.env.example:52` — `VITE_API_URL` absolute API base.
- `docker-compose.yml:19` — backend → `mongo:27017` over the compose network (internal reachability proof).
- `nginx/fourier.conf:3-5,13-17,19-28,30,42` — rate-limit zones, security headers, compute/api/SPA routes.
- `scripts/deploy-hook.sh:52,68-82,89-98,147-158,164` — the four improved per-app deploy-arm behaviours.

**Host (SSH `mbabb@mbabb.fridayinstitute.net:1022`, read-only):**
- `/etc/apache2/sites-enabled/babb-dev.conf:36-55` — `fourier.babb.dev` vhost → `localhost:8100`; no `api.*` vhost.
- `/etc/apache2/sites-enabled/babb-dev.conf:1-77` — sudoku/fourier/words apex vhosts, all on the `sudoku.babb.dev` LE cert.
- `/etc/apache2/sites-enabled/mbabb-friday-institute-ssl.conf:99-100` — `/deploy/ → 127.0.0.1:9000` (webhook reverse-proxy).
- `/etc/apache2/mods-enabled/` — `proxy`, `proxy_http`, `headers`, `ssl`, `rewrite` enabled.
- `ss -tlnp` — 27017/27018/27020 on `0.0.0.0` + `[::]`; gateways 8100/8110/8120/8130 on `127.0.0.1`.
- `ufw status verbose` — `active`; explicit `ALLOW IN Anywhere` for 27017/27018/27019/27020 (v4+v6).
- `nft list ruleset` — INPUT `policy drop`, but ufw allow-rules punch through for the Mongo ports.
- `openssl s_client … -servername fourier.babb.dev` — origin LE cert `CN=sudoku.babb.dev`, SAN `fourier/sudoku/words.babb.dev`, issuer LE E8 (CF Full-strict capable).
- `openssl s_client … -servername api.fourier.babb.dev` — falls to default vhost (`CN=sudoku.babb.dev`); `api.` not configured.
- `docker inspect fourier-analysis-backend-1` — `CORS_ORIGINS=https://fourier.babb.dev`.
- `docker inspect palette-api-api-1` — `ALLOWED_ORIGINS=` (empty); URI `…&tls=true&tlsAllowInvalidCertificates=true`.
- `docker inspect floridify-backend` — `BACKEND_CORS_ORIGINS=["https://mbabb.friday.institute"]`; URI `…&tls=true&tlsAllowInvalidCertificates=true`.
- `palette-api/src/middleware.ts:7-8`, `src/index.ts:80-81` — `ALLOWED_ORIGINS` read + prod-required guard.

**Public DNS / TLS:**
- `dig babb.dev NS` → Cloudflare (`jillian/maciej.ns.cloudflare.com`).
- `dig fourier/words/sudoku/api.fourier.babb.dev A` → CF anycast `172.67.175.252` / `104.21.56.22` (orange-cloud proxied; `*` wildcard covers `api.`).
- `dig colors.babb.dev A` → `185.199.108-111.153` (GitHub-Pages/static-frontend plane — the CF-Pages sibling pattern).
- `dig mbabb.fridayinstitute.net A` → `10.0.2.253` (the AWS host, `ip-10-0-2-253`).
