# NA1 — Full mbabb-server Inventory, Per-App Current-State, and Exposed-Mongo Security Sweep

- **Lane**: NA1 (constellation deployment normalization audit — tranche D)
- **Date**: 2026-05-27
- **Mode**: STRICTLY READ-ONLY (recon only; no mutations on prod, no Cloudflare token used)
- **Host**: `mbabb@mbabb.fridayinstitute.net:1022`
- **Host facts**: AWS EC2, hostname `ip-10-0-2-253`, kernel `6.8.0-1047-aws`, Ubuntu 22.04
  - **Private IP (eth0)**: `10.0.2.253/24`
  - **Public IP**: `34.197.214.67` (confirmed via IMDS `public-ipv4` and `api.ipify.org`)
  - **AWS security groups** (via IMDS): `FI-Production-Public Web`, `FI Production - Secure Access - Administration`, `FI Production - DB Internal`, `FI-Production-Public SSH`, `FI-TIL-Production-Tableau Online`

All claims below are grounded in the SSH command output pasted in each section.

---

## 1. Full Container Inventory

`docker ps -a` (all states — every container is running; none stopped/exited):

```
NAMES                         IMAGE                       STATUS                  PORTS
floridify-nginx               nginx:alpine                Up 8 weeks              127.0.0.1:8110->80/tcp
floridify-backend             floridify-backend:latest    Up 8 weeks (healthy)    127.0.0.1:8001->8000/tcp
floridify-frontend            floridify-frontend:latest   Up 8 weeks (healthy)    127.0.0.1:3001->80/tcp
floridify-mongodb             mongo:8.0                   Up 8 weeks (healthy)    0.0.0.0:27018->27017/tcp, [::]:27018->27017/tcp
palette-api-api-1             palette-api-api             Up 2 months (healthy)   127.0.0.1:8130->3000/tcp
palette-api-backup-1          mongo:8                     Up 2 months             27017/tcp   (no host publish)
palette-api-mongo-1           mongo:8                     Up 2 months (healthy)   0.0.0.0:27020->27017/tcp, [::]:27020->27017/tcp
fourier-analysis-mongo-1      mongo:8.0                   Up 2 months (healthy)   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
fourier-analysis-backend-1    fourier-analysis-backend    Up 2 months             (no host publish)
csp-solver-nginx-1            nginx:alpine                Up 2 months             127.0.0.1:8120->80/tcp
fourier-analysis-nginx-1      nginx:alpine                Up 2 months             127.0.0.1:8100->80/tcp
csp-solver-frontend-1         csp-solver-frontend         Up 2 months             80/tcp, 127.0.0.1:3000->3000/tcp
csp-solver-backend-1          csp-solver-backend          Up 2 months             127.0.0.1:8000->8000/tcp
fourier-analysis-frontend-1   fourier-analysis-frontend   Up 2 months             80/tcp (internal only)
```

Compose project / service / working-dir (from `com.docker.compose.*` labels):

```
floridify-nginx|floridify|nginx|/home/mbabb/floridify
floridify-backend|floridify|backend|/home/mbabb/floridify
floridify-frontend|floridify|frontend|/home/mbabb/floridify
floridify-mongodb|floridify|mongo|/home/mbabb/floridify
palette-api-api-1|palette-api|api|/home/mbabb/Programming/palette-api
palette-api-backup-1|palette-api|backup|/home/mbabb/Programming/palette-api
palette-api-mongo-1|palette-api|mongo|/home/mbabb/Programming/palette-api
fourier-analysis-mongo-1|fourier-analysis|mongo|/var/www/fourier-analysis
fourier-analysis-backend-1|fourier-analysis|backend|/var/www/fourier-analysis
csp-solver-nginx-1|csp-solver|nginx|/var/www/csp-solver
fourier-analysis-nginx-1|fourier-analysis|nginx|/var/www/fourier-analysis
csp-solver-frontend-1|csp-solver|frontend|/var/www/csp-solver
csp-solver-backend-1|csp-solver|backend|/var/www/csp-solver
fourier-analysis-frontend-1|fourier-analysis|frontend|/var/www/fourier-analysis
```

`docker compose ls -a`:

```
NAME                STATUS              CONFIG FILES
csp-solver          running(3)          /var/www/csp-solver/docker-compose.yml,/var/www/csp-solver/docker-compose.prod.yml
floridify           running(4)          /home/mbabb/floridify/docker-compose.yml,/home/mbabb/floridify/docker-compose.prod.yml
fourier-analysis    running(4)          /var/www/fourier-analysis/docker-compose.yml,/var/www/fourier-analysis/docker-compose.prod.yml
palette-api         running(3)          /home/mbabb/Programming/palette-api/compose.yaml
```

### Container classification (14 running, 0 stopped)

| Container | Project | Role | Host binding | Health | Uptime | Image |
|---|---|---|---|---|---|---|
| fourier-analysis-nginx-1 | fourier-analysis | app: nginx gateway | `127.0.0.1:8100->80` | (no hc) Up | 2 mo | nginx:alpine |
| fourier-analysis-frontend-1 | fourier-analysis | app: frontend (Vue/Vite) | internal `80/tcp` only | (no hc) Up | 2 mo | fourier-analysis-frontend |
| fourier-analysis-backend-1 | fourier-analysis | app: backend (FastAPI) | internal only (ports `!reset []`) | (no hc) Up | 2 mo | fourier-analysis-backend |
| **fourier-analysis-mongo-1** | fourier-analysis | support: **MongoDB** | **`0.0.0.0:27017->27017`** | healthy | 2 mo | mongo:8.0 |
| palette-api-api-1 | palette-api | app: API (Hono/Node22) | `127.0.0.1:8130->3000` | healthy | 2 mo | palette-api-api |
| **palette-api-mongo-1** | palette-api | support: **MongoDB** | **`0.0.0.0:27020->27017`** | healthy | 2 mo | mongo:8 |
| palette-api-backup-1 | palette-api | support: mongo backup cron | none (exposes `27017/tcp` internal) | (no hc) Up | 2 mo | mongo:8 |
| csp-solver-nginx-1 | csp-solver | app: nginx gateway | `127.0.0.1:8120->80` | (no hc) Up | 2 mo | nginx:alpine |
| csp-solver-frontend-1 | csp-solver | app: frontend | `127.0.0.1:3000->3000` (+ internal `80`) | (no hc) Up | 2 mo | csp-solver-frontend |
| csp-solver-backend-1 | csp-solver | app: backend | `127.0.0.1:8000->8000` | (no hc) Up | 2 mo | csp-solver-backend |
| floridify-nginx | floridify | app: nginx gateway | `127.0.0.1:8110->80` | (no hc) Up | 8 wk | nginx:alpine |
| floridify-backend | floridify | app: backend (FastAPI/uvicorn) | `127.0.0.1:8001->8000` | healthy | 8 wk | floridify-backend:latest |
| floridify-frontend | floridify | app: frontend | `127.0.0.1:3001->80` | healthy | 8 wk | floridify-frontend:latest |
| **floridify-mongodb** | floridify | support: **MongoDB** | **`0.0.0.0:27018->27017`** | healthy | 8 wk | mongo:8.0 |

Note: csp-solver has no Mongo container — it is a stateless solver (sudoku). It double-publishes the frontend on both internal `80` and `127.0.0.1:3000`.

### Image age (`docker images`) — includes dangling/unused images

```
gaggle-gaggle               latest   e42649c64b70   3 weeks ago     989MB   (no running container)
speedtest-api               latest   c7eb56ef8d7c   7 weeks ago     191MB   (no running container)
speedtest-frontend          latest   7a728ffb79b7   8 weeks ago     76.3MB  (no running container)
floridify-backend           latest   28cfeac60c00   2 months ago    8.67GB
server-api                  latest   436a554b6108   2 months ago    220MB   (no running container)
palette-api-api             latest   0c5f2ca98e88   2 months ago    174MB
fourier-analysis-backend    latest   9162c236a4b8   2 months ago    1.08GB
fourier-analysis-frontend   latest   4c3b8541dd99   2 months ago    113MB
mongo                       8.0      a977f874cd37   2 months ago    953MB
floridify-frontend          latest   5b131470684f   2 months ago    65.1MB
csp-solver-frontend         latest   9f573759ff6a   2 months ago    62.4MB
csp-solver-backend          latest   94fb687ae447   2 months ago    283MB
node                        22-slim  900e30fdf086   2 months ago    228MB
mongo  7 / 7.0 / 8 ; nginx alpine ; alpine ; jonasal/nginx-certbot 5 ; node 23-slim   (older base/dangling)
```

**Leftover / non-containerized notes** (for D cleanup scope):
- `gaggle-gaggle`, `speedtest-api`, `speedtest-frontend`, `server-api` images exist but have **no running containers**. `speedtest` has an Apache vhost pointing at `127.0.0.1:8140`, but **that port is CLOSED** (`Connection refused`) — the speedtest vhost is a dead end.
- The `floridify-backend` image is **8.67 GB** (notable bloat; flagged for D).

---

## 2. Per-App Current-State Map

| App | Repo dir | Frontend | Backend | DB | Public domain / ingress | CF-proxied? |
|---|---|---|---|---|---|---|
| **fourier-analysis** | `/var/www/fourier-analysis` | containerized Vue/Vite, internal `80`, fronted by nginx `:8100` | FastAPI container, internal only (`!reset []`) | Mongo 8.0 container, **`0.0.0.0:27017`**, `--auth --tlsMode requireTLS` | `fourier.babb.dev` (Apache `:443` → `localhost:8100`); also `/fourier/` on `mbabb.fi.ncsu.edu` | **Yes** (104.21.56.22 / 172.67.175.252) |
| **palette-api** (app: "color") | `/home/mbabb/Programming/palette-api` | **NOT on this server** — `color.babb.dev` → GitHub Pages (`mkbabb.github.io`, 185.199.x). Server hosts API only | Hono + `@hono/node-server` (Node 22), `127.0.0.1:8130->3000` | Mongo 8 container, **`0.0.0.0:27020`**, `--auth --tlsMode requireTLS` (+ `backup` container, mongo:8) | API via `/colors/` proxy on `mbabb.fi.ncsu.edu` → `localhost:8130`. No dedicated `color.babb.dev` vhost on box | API: no vhost (CF n/a); frontend on GH Pages |
| **csp-solver** (app: "sudoku") | `/var/www/csp-solver` (= sudoku / CSC-411) | containerized, `127.0.0.1:3000` + internal `80`, fronted by nginx `:8120` | backend container `127.0.0.1:8000` | **none** (stateless solver) | `sudoku.babb.dev` (Apache `:443` → `localhost:8120`); `/csp-solver` on `mbabb.fi.ncsu.edu` 301-redirects to `sudoku.babb.dev` | **Yes** (104.21.56.22 / 172.67.175.252) |
| **floridify** (app: "words") | `/home/mbabb/floridify` | containerized, `127.0.0.1:3001`, fronted by nginx `:8110` | FastAPI/uvicorn `127.0.0.1:8001` (nginx gateway `:8110`); also a notification node service | Mongo 8.0 container, **`0.0.0.0:27018`**, `--auth --tlsMode requireTLS`. NOTE: prod backend env points at remote `MONGO_URI` (`MONGODB_URL`/`MONGO_URI` injected); local mongo present + published | `words.babb.dev` (Apache `:443` → `localhost:8110`); `/words/` on `mbabb.friday.institute`; `mbabb.fi.ncsu.edu/words` 301→`mbabb.friday.institute/words` | **Yes** (104.21.56.22 / 172.67.175.252) for words.babb.dev |
| **grammar** (= bbnf-lang) | `/var/www/grammar` | **static built Vite SPA** (no container) — `index.html` + `assets/*.js/.css`, served directly by Apache with `FallbackResource /index.html` | none (static only) | none | `grammar.babb.dev` (Apache `:80`/`:443` static DocumentRoot) | **Yes** (104.21.56.22 / 172.67.175.252) |

### Other / supporting services found on the host (not app stacks)

| Service | Where | Binding | Notes |
|---|---|---|---|
| code-server (VS Code) | host process (node, pid 1109) | `127.0.0.1:8080` | `/usr/lib/code-server`; loopback-only |
| deploy webhook | host process `webhook` (pid 1867732) | `*:9000` (all ifaces) | Proxied at `mbabb.friday.institute/deploy/` → `127.0.0.1:9000`; listens on `0.0.0.0:9000` but **UFW does not allow 9000**, so not externally reachable |
| MySQL | host process `mysqld` (pid 909) | `127.0.0.1:3306` + `127.0.0.1:33060` | host-level MySQL (not a container); loopback-only |
| Apache (httpd) | host | `*:80`, `*:443` | the single public ingress reverse proxy |
| sshd | host | `0.0.0.0:1022` | SSH (non-standard port) |

---

## 3. Apache Ingress Map (domain → container routing table)

Enabled vhosts in `/etc/apache2/sites-enabled/`: `000-default.conf` (commented out / inert), `babb-dev.conf`, `default-ssl.conf`, `mbabb-friday-institute-ssl.conf`, `grammar.babb.dev.conf` + `-le-ssl.conf`, `speedtest.conf`. Proxy modules enabled: `proxy`, `proxy_http`, `proxy_wstunnel`.

| Public host (ServerName/Alias) | Path | Apache proxy target | Lands at container | App |
|---|---|---|---|---|
| `fourier.babb.dev` (`:443`, babb-dev.conf) | `/` | `http://localhost:8100/` | fourier-analysis-nginx-1 | fourier-analysis |
| `sudoku.babb.dev` (`:443`, babb-dev.conf) | `/` | `http://localhost:8120/` | csp-solver-nginx-1 | csp-solver/sudoku |
| `words.babb.dev` (`:443`, babb-dev.conf) | `/` | `http://localhost:8110/` | floridify-nginx | floridify/words |
| `sudoku/fourier/words.babb.dev` (`:80`) | `/` | 301 → `https://%{HTTP_HOST}` | (redirect, certbot challenge passthrough) | — |
| `grammar.babb.dev` (`:80`+`:443`) | `/` | static `DocumentRoot /var/www/grammar` (FallbackResource) | (no container) | grammar/bbnf-lang |
| `mbabb.friday.institute` (`_default_:443`) | `/words/api/v1/lookup/*/stream` | `http://localhost:8110/...` (SSE, nokeepalive) | floridify-nginx | floridify/words |
| `mbabb.friday.institute` | `/words/api/` | `http://localhost:8110/api/` | floridify-nginx | floridify |
| `mbabb.friday.institute` | `/words/health` | `http://localhost:8110/health` | floridify-nginx | floridify |
| `mbabb.friday.institute` | `/words/` | `http://localhost:8110/` | floridify-nginx | floridify |
| `mbabb.friday.institute` | `/deploy/` | `http://127.0.0.1:9000/` | host `webhook` process | CI/CD deploy listener |
| `mbabb.fi.ncsu.edu` (`_default_:443`, default-ssl.conf) | `/words*` | 301 → `https://mbabb.friday.institute/words$1` | (redirect) | floridify |
| `mbabb.fi.ncsu.edu` | `/colors/` | `http://localhost:8130/` | palette-api-api-1 | palette/color (API) |
| `mbabb.fi.ncsu.edu` | `/fourier/api/` | `http://localhost:8100/api/` | fourier-analysis-nginx-1 | fourier-analysis |
| `mbabb.fi.ncsu.edu` | `/fourier/` | `http://localhost:8100/fourier/` | fourier-analysis-nginx-1 | fourier-analysis |
| `mbabb.fi.ncsu.edu` | `/csp-solver*` | 301 → `https://sudoku.babb.dev$1` | (redirect) | csp-solver/sudoku |
| `speedtest.mbabb.friday.institute` (`:443`) | `/` | `http://127.0.0.1:8140/` | **DEAD** (`:8140` connection refused; no container) | speedtest (broken) |

**Routing observations for D**:
- Two `_default_:443` vhosts (`default-ssl.conf` = `mbabb.fi.ncsu.edu`, `mbabb-friday-institute-ssl.conf` = `mbabb.friday.institute`). Apache resolves by `ServerName` via SNI; `default-ssl.conf` is the catch-all default.
- `speedtest.mbabb.friday.institute` vhost is enabled but its target (`:8140`) is dead — stale config.
- `color.babb.dev` has **no vhost on this box** — its frontend is GitHub Pages; only the `/colors/` API path on `mbabb.fi.ncsu.edu` is served here.
- The `.babb.dev` zone is Cloudflare-fronted (apex/CNAME → CF). `mbabb.friday.institute` resolves to the **private** IP `10.0.2.253` (internal/split-horizon DNS — externally it would route via NCSU/FI network, not directly). `mbabb.fi.ncsu.edu` resolves to the public `34.197.214.67`.

### DNS resolution evidence (`dig +short`)

```
fourier.babb.dev                  -> 172.67.175.252 104.21.56.22         (Cloudflare)
sudoku.babb.dev                   -> 104.21.56.22 172.67.175.252         (Cloudflare)
words.babb.dev                    -> 172.67.175.252 104.21.56.22         (Cloudflare)
grammar.babb.dev                  -> 104.21.56.22 172.67.175.252         (Cloudflare)
color.babb.dev                    -> mkbabb.github.io. 185.199.111.153 185.199.108.153 ...  (GitHub Pages)
mbabb.friday.institute            -> 10.0.2.253                          (PRIVATE / split-horizon)
mbabb.fi.ncsu.edu                 -> 34.197.214.67                       (public host IP)
speedtest.mbabb.friday.institute  -> 34.197.214.67
```

---

## 4. Exposed-Mongo Security Sweep (systemic D finding)

### 4a. Which Mongos publish on 0.0.0.0 vs loopback

From `docker ps -a` PORTS and the prod compose overlays:

| Mongo | Project | Host binding | Source of binding | Auth | TLS |
|---|---|---|---|---|---|
| fourier | fourier-analysis | **`0.0.0.0:27017->27017`** + `[::]` | `docker-compose.prod.yml` re-adds `ports: ["27017:27017"]` (base used `!reset []`) | `--auth` (user `fourier-admin`) | `--tlsMode requireTLS` |
| floridify | floridify | **`0.0.0.0:27018->27017`** + `[::]` | `docker-compose.prod.yml` `ports: ["27018:27017"]` | `--auth` (root user `admin`) | `--tlsMode requireTLS` |
| palette | palette-api | **`0.0.0.0:27020->27017`** + `[::]` | `compose.yaml` `ports: ["27020:27017"]` | `--auth` (user `palette-admin`) | `--tlsMode requireTLS` |
| palette-backup | palette-api | none (internal `27017/tcp`, not published) | — | n/a (client) | — |

All three primary Mongos publish on the unspecified address `0.0.0.0` (and `::`), NOT loopback. None use the `127.0.0.1:` host-IP prefix that every other service on this box uses.

### 4b. Blast radius — host firewall + actual public reachability

`ss -tlnp` confirms the three Mongos bind to `0.0.0.0`:

```
LISTEN 0 4096  0.0.0.0:27020  0.0.0.0:*
LISTEN 0 4096  0.0.0.0:27017  0.0.0.0:*
LISTEN 0 4096  0.0.0.0:27018  0.0.0.0:*
   (+ matching [::]:27017/18/20 IPv6 listeners)
```

(Contrast: every app/support service binds loopback — `127.0.0.1:8100/8110/8120/8130/8001/8000/3000/3001/8080/3306/33060`.)

**UFW is active and EXPLICITLY allows the Mongo ports from Anywhere** (`sudo ufw status verbose`):

```
Status: active
Default: deny (incoming), allow (outgoing), deny (routed)
To                 Action      From
1022/tcp           ALLOW IN    Anywhere
443/tcp            ALLOW IN    Anywhere    # HTTPS
80/tcp             ALLOW IN    Anywhere    # HTTP - certbot + redirect
27017/tcp          ALLOW IN    Anywhere    # MongoDB - fourier-analysis
27018/tcp          ALLOW IN    Anywhere    # MongoDB - floridify
27019/tcp          ALLOW IN    Anywhere    # MongoDB - speedtest   (no listener — stale rule)
27020/tcp          ALLOW IN    Anywhere    # MongoDB - palette-api
   (+ identical v6 rules)
```

Docker's iptables `DOCKER` chain also ACCEPTs the published Mongo ports (`dpt:27017` to the three mongo container IPs `172.18.0.2`, `172.27.0.2`, `172.25.0.3`). Docker port-publishing bypasses UFW via this chain regardless, so the explicit UFW allow rules are belt-and-suspenders — the exposure exists either way.

**Confirmed public reachability** — TCP connect from the auditor's external machine (NOT the prod host) to the public IP `34.197.214.67`:

```
34.197.214.67:27017 OPEN from this host    (fourier mongo)
34.197.214.67:27018 OPEN from this host    (floridify mongo)
34.197.214.67:27020 OPEN from this host    (palette mongo)
34.197.214.67:443   OPEN from this host    (expected — HTTPS)
34.197.214.67:1022  OPEN from this host    (expected — SSH)
   (egress sanity: 1.1.1.1:443 reachable — the test host has working outbound)
```

**VERDICT — exposed-Mongo sweep**: All three application MongoDB instances (fourier `:27017`, floridify `:27018`, palette `:27020`) are **directly reachable from the public Internet**. Blast radius = the entire Internet, not merely the VPC, confirmed by an external connect to `34.197.214.67`. This is triple-allowed: (1) `0.0.0.0` Docker bind, (2) explicit UFW `ALLOW IN Anywhere` rules, and (3) AWS SG `FI-Production-Public Web` evidently permits these ports (the external connect succeeded — the SG is not blocking them).

**Partial mitigation (not a remedy)**: All three prod Mongos run `--auth` AND `--tlsMode requireTLS`, so an attacker cannot read data without both a valid TLS handshake and credentials. The remaining exposure is real but reduced to: pre-auth attack surface (any MongoDB pre-auth CVE), version/topology fingerprinting, brute-force/credential-stuffing against known admin usernames (`fourier-admin`, `admin`, `palette-admin` — usernames are visible in the committed compose files), and denial-of-service. **Credentials are in plaintext in the committed compose files** (e.g. fourier `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb`, palette `LkqzaB0NPF5nx4Wj1iCrUc5kxWYwra0W`) — a secondary finding.

**Normalization recommendation for D** (no action taken — read-only): rebind all three to `127.0.0.1:<port>:27017` (matching every other service on the box), drop the UFW Mongo ALLOW rules (27017/18/20) and the stale `27019` rule, and remove DB ports from the public AWS SG (use `FI Production - DB Internal` only). Move credentials out of committed compose into env/secrets.

---

## 5. Repo Provenance

### palette-api (app "color")
- **Prod source confirmed standalone**: `/home/mbabb/Programming/palette-api`. It is **NOT a git checkout** (`git remote -v` → `fatal: not a git repository`). It is deployed by **rsync**, per its own `deploy.sh`:
  ```
  REMOTE_DIR="/home/mbabb/Programming/palette-api"
  rsync -avz --delete --exclude node_modules --exclude dist --exclude .env ... -e "ssh -p 1022" ./ "$SERVER:$REMOTE_DIR/"
  ssh ... "cd $REMOTE_DIR && docker compose up -d --build"
  ```
- **Identity**: `package.json` → `"name": "palette-api", "version": "2.0.0"`. README: *"Palette API — Hono + MongoDB REST API ... Backs the demo color picker at color.babb.dev. Runtime: Node 22 (not Cloudflare Workers). Framework: Hono via @hono/node-server."*
- **NOT value.js/api**: no `value*` directory exists under `/home/mbabb/Programming/` or `/home/mbabb/`. This is the dedicated `palette-api` repo, not a sub-app of `value.js`. Directory contents: `CLAUDE.md, Dockerfile, README.md, apache-vhost.conf, compose.yaml, deploy.sh, mongo-init, package.json, package-lock.json, scripts, src, ssl, test-results, tsconfig.json`.
- Note: ships its own `apache-vhost.conf` (suggesting an intended `color.babb.dev` vhost), but on the live box palette is reached only via the `/colors/` proxy on `mbabb.fi.ncsu.edu`; the public `color.babb.dev` is GitHub Pages.

### grammar (bbnf-lang)
- **Deploy shape: static, no container.** `/var/www/grammar` is a built Vite SPA (`index.html`, `404.html`, `assets/*.js`+`*.css` such as `DocsPage-*.js`, `BenchChart-*.js`, `DocCard.vue_*.js`, plus `bbnf-icon.png`, `img/`). Owned by `mbabb:mbabb`, last built `Mar 25 23:55`. **Not a git repo** at the prod path (`git remote -v` → fatal). Served directly by Apache (`grammar.babb.dev.conf`) with `FallbackResource /index.html` for SPA routing. Active dev happens elsewhere (the bbnf-lang repo); only the build artifact lives here.

### App → repo confirmation
- `color` = `palette-api` (`/home/mbabb/Programming/palette-api`) — confirmed.
- `sudoku` = `csp-solver` (`/var/www/csp-solver`, CSC-411) — confirmed.
- `grammar` = `bbnf-lang` (`/var/www/grammar`, static build) — confirmed.
- `words` = `floridify` (`/home/mbabb/floridify`) — confirmed.
- `fourier` = `fourier-analysis` (`/var/www/fourier-analysis`) — confirmed.

---

## Appendix — directory-placement inconsistency (for normalization)

Repos are split across two roots with no convention:
- `/var/www/`: `fourier-analysis`, `csp-solver`, `grammar`, plus standard `html`.
- `/home/mbabb/`: `floridify`.
- `/home/mbabb/Programming/`: `palette-api`.

Deploy mechanisms also vary: fourier uses `scripts/deploy.sh` (git push + SSH pull at `/var/www/fourier-analysis`), palette uses rsync `deploy.sh`, floridify/grammar built/pushed by other means. The `/deploy/` webhook (`:9000`) is the standardized CI/CD listener path. Normalizing repo roots, the loopback-binding convention, and a single deploy mechanism are candidate D work items.
