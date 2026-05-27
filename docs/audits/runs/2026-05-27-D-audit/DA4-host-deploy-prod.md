# DA4 — host / deploy / prod integration audit (tranche-D DEVELOPMENT)

**Lane**: DA4 · **Date**: 2026-05-27 · **Mode**: READ-ONLY ground-truth (repo
*and* prod host) + ONE deliverable. No source edits, no commits, **no host
mutation** — every command run was `docker ps / inspect`, `ls`, `cat`,
`openssl … -noout`, `git status/log`, `curl`, a read-only `mongosh` count, and
`systemctl status`. Where a step would mutate the host it is recorded as a **D
deploy-step**, never executed.

**The pivot (charter)**: the user states *"We can SSH into the prod server. All
of the above must be integrated and deployed."* C's host-coupled residuals —
the deploy-hook wiring, the verified-TLS cutover, the blob migration, the
precepts promotion — are therefore **in-scope for D as IMPLEMENT+DEPLOY
deliverables**, not as deferred Stratum-B proposals. This audit establishes the
TRUE prod reality those deploy-steps must act on.

**Host**: `ssh -p 1022 mbabb@mbabb.fridayinstitute.net` → `ip-10-0-2-253`
(AWS, Ubuntu 22.04 / kernel 6.8, **497 GiB disk, 24% used**, up 78 days). The
60-day-old `project_infra_plan.md` calls this a "15 GiB" host — **stale by an
order of magnitude**; the disk-pressure premise behind several infra-plan
decisions no longer holds.

All `file:line` citations are verified against the live tree at audit time
(local master `1e47115`); every host claim pastes its SSH output.

---

## §0 — Headline: the prod fourier is ~3 tranches behind and nothing C built has shipped

| Axis | Live prod reality (SSH-measured) | The repo (master `1e47115`) | Gap |
|---|---|---|---|
| Deployed SHA | **`8818ae5`** (`git rev-parse HEAD` in `/var/www/fourier-analysis`) | `1e47115` (post-C close) | prod predates **all of A, B, C** |
| Backend image | built **2026-03-28** (2 months old) | n/a | every A/B/C `api/**` change is absent |
| MONGO_URI | inline **plaintext password** + `tlsAllowInvalidCertificates=true` (live container env) | `${MONGO_PASSWORD:?}` + (W2 target) `tlsCAFile` | the C.W2 cutover unshipped; prod compose is hand-edited |
| Mongo CA | `CN=mbabb.fridayinstitute.net, O=mbabb, C=US` (host-wide, self-signed) | gen-mongo-certs.sh target `CN=fourier-internal-ca, O=fourier-analysis` | the C.W2 cert provenance unshipped |
| `image_blobs` volume | **does not exist**; no `/data/blobs` in backend | declared `external: true` in prod compose | the C.W5 blob backend unshipped |
| blob migration | **never run** (and prod `images` collection is empty) | `api/scripts/migrate_image_blobs.py` exists | nothing to migrate yet; cutover unexercised |
| deploy-hook | live dispatcher's inline fourier arm (the **weak** one) | `scripts/deploy-hook.sh` (the 4 improvements) | the C.W1 hook never wired in |
| fourier deploys ever | **zero** (`/opt/deploy/logs/` has only speedtest + words) | n/a | the webhook chain has never fired for fourier |

**Net**: the live site IS up and healthy (`{"status":"ok"}` on `:8100`, SPA
`200`), but it serves a **pre-tranche-A build**. "Integrated and deployed" for D
means: (1) reconcile the dirty/stale host tree, (2) ship master through a wired
deploy-hook, (3) provision + cut over TLS, (4) stand up the blob backend, (5)
promote the two precepts. All four C host-residuals are **confirmed unshipped**.

---

## §1 — Full prod inventory (read-only)

### 1.1 — Every container (`docker ps -a`, full)

```
$ docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.RunningFor}}"
NAMES                         IMAGE                       STATUS                  PORTS
floridify-nginx               nginx:alpine                Up 8 weeks              127.0.0.1:8110->80/tcp
floridify-backend             floridify-backend:latest    Up 8 weeks (healthy)    127.0.0.1:8001->8000/tcp
floridify-frontend            floridify-frontend:latest   Up 8 weeks (healthy)    127.0.0.1:3001->80/tcp
floridify-mongodb             mongo:8.0                   Up 8 weeks (healthy)    0.0.0.0:27018->27017/tcp
palette-api-api-1             palette-api-api             Up 2 months (healthy)   127.0.0.1:8130->3000/tcp
palette-api-backup-1          mongo:8                     Up 2 months             27017/tcp
palette-api-mongo-1           mongo:8                     Up 2 months (healthy)   0.0.0.0:27020->27017/tcp
fourier-analysis-mongo-1      mongo:8.0                   Up 2 months (healthy)   0.0.0.0:27017->27017/tcp
fourier-analysis-backend-1    fourier-analysis-backend    Up 2 months             (no published ports)
csp-solver-nginx-1            nginx:alpine                Up 2 months             127.0.0.1:8120->80/tcp
fourier-analysis-nginx-1      nginx:alpine                Up 2 months             127.0.0.1:8100->80/tcp
csp-solver-frontend-1         csp-solver-frontend         Up 2 months             80/tcp, 127.0.0.1:3000->3000/tcp
csp-solver-backend-1          csp-solver-backend          Up 2 months             127.0.0.1:8000->8000/tcp
fourier-analysis-frontend-1   fourier-analysis-frontend   Up 2 months             80/tcp
```

**Five compose projects co-tenant on the host** (`com.docker.compose.project`
labels):

| Project | working_dir | mongo port | gateway |
|---|---|---|---|
| **fourier-analysis** | `/var/www/fourier-analysis` | `27017` | nginx `127.0.0.1:8100` |
| **floridify** (= the `words` repo) | `/home/mbabb/floridify` | `27018` | nginx `127.0.0.1:8110` |
| **palette-api** (value.js's backend) | `/home/mbabb/Programming/palette-api` | `27020` | api `127.0.0.1:8130` |
| **csp-solver** | `/var/www/csp-solver` | (dev mongo) | nginx `127.0.0.1:8120` |
| **speedtest** | `~/speedtest` (orphaned containers seen) | — | (`8140`) |

The three the charter names — `fourier-analysis-*`, `floridify-*`,
`palette-api-*` — are **all confirmed present and running**. This is a genuinely
shared host: any change to a host-wide artefact (the dispatcher, the TLS CA
posture, Apache, the disk) touches sibling apps.

### 1.2 — fourier container detail

`fourier-analysis-mongo-1`: image `mongo:8.0`, created **2026-03-28T06:39:46Z**.
Command (TLS flags live):

```
["mongod","--tlsMode","requireTLS","--tlsCertificateKeyFile","/etc/ssl/mongo.pem",
 "--tlsCAFile","/etc/ssl/mongo-ca.pem","--tlsAllowConnectionsWithoutCertificates","--auth"]
```

Mounts: `./ssl/mongo.pem`→`/etc/ssl/mongo.pem:ro`, `./ssl/mongo-ca.pem`→
`/etc/ssl/mongo-ca.pem:ro`, `fourier-analysis_mongo_data`→`/data/db`. **No
`image_blobs` mount anywhere.**

`fourier-analysis-backend-1`: image `fourier-analysis-backend`, created
**2026-03-28T06:39:19Z**, state `running` (no healthcheck — note: this container
has **no health status**, unlike the floridify/palette backends). Command:

```
["uv","run","--no-sync","uvicorn","api.main:app","--host","0.0.0.0","--port","8000",
 "--workers","4","--proxy-headers","--forwarded-allow-ips","*"]
```

— so the prod backend runs `--workers 4` (production, **not** `--reload`; the L6
chronic is dev-only, confirming CA5 §5). **But its env carries a literal
secret**:

```
MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true
CORS_ORIGINS=https://fourier.babb.dev
```

and it **bind-mounts the source tree read-write over the image**:

```
/var/www/fourier-analysis/api    -> /app/api   (rw)
/var/www/fourier-analysis/assets -> /app/assets (rw)
/var/www/fourier-analysis/src    -> /app/src   (rw)
```

These RW source mounts + the inline password come from the **hand-edited host
`docker-compose.prod.yml`** (the `M` in §2.3) — they are NOT in repo master and
are exactly the host-specific overrides the deploy-hook's dirty-tree guard
exists to protect. The repo prod compose uses `${MONGO_PASSWORD:?}` and mounts
no source.

### 1.3 — Volumes (`docker volume ls`)

```
fourier-analysis_mongo_data   ← the only fourier volume
floridify_mongo_data / _config / _nginx_secrets
palette-api_mongo-data / _mongo-backups
server_mongo-data
+ 12 anonymous (sha-named) volumes
```

**There is NO `image_blobs` volume** (`docker volume inspect image_blobs` →
`Error … no such volume`). The C.W5 storage backend has not been provisioned.

---

## §2 — The deploy reality

### 2.1 — The webhook receiver (live, shared)

```
$ systemctl status webhook
● webhook.service - Webhook deploy listener
     Active: active (running) since Sat 2026-03-28 06:07:43 UTC; 1 month 30 days ago
   ExecStart=/usr/local/bin/webhook -hooks /opt/deploy/hooks.json -port 9000 -verbose -hotreload
$ ss -tlnp | grep 9000
LISTEN 0 4096 *:9000 *:* users:(("webhook",pid=1867732,fd=6))
```

Binds **`*:9000` (all interfaces)** — matches the C P2 probe; *not* loopback.
`webhook` binary `/usr/local/bin/webhook` (Oct-2024 build).

### 2.2 — `hooks.json` (perms + auth)

```
$ ls -la /opt/deploy/hooks.json /opt/deploy/.env
-rw-rw-r-- 1 mbabb mbabb  849  /opt/deploy/hooks.json
-rw-rw-r-- 1 mbabb mbabb   80  /opt/deploy/.env
```

**`0664 mbabb:mbabb` — world-readable.** The HMAC secret is in the clear to any
local host user (and I, as a read-only recon SSH user, read it):
`hooks.json` carries `"secret": "89eadc1d…a5c070"` and `/opt/deploy/.env`
carries `WEBHOOK_SECRET=89eadc1d…a5c070`. **The same secret value sits in two
world-readable files.** This is the C DEPLOY-RECONCILE §3.2 / staged-precept
"recorded finding" — confirmed live. The trigger rule is exactly the
invariant-19 model: `payload-hmac-sha256` on `X-Hub-Signature-256` **and**
`value` match `ref == refs/heads/master`. (No branch-protection: a force-push
to master deploys the rewritten tree — named, KISS-bounded.)

### 2.3 — `dispatch.sh` (the shared multi-repo dispatcher) — fourier arm exists, is the WEAK one

```
$ cat /opt/deploy/scripts/dispatch.sh        # 2473 bytes, 0775 mbabb:mbabb
…
deploy() {
    local dir="$1" port="$2" health="$3"
    cd "$dir"
    PREV=$(git rev-parse HEAD)
    git fetch origin && git reset --hard origin/master
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel 2>&1 || docker compose build --parallel 2>&1
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d 2>&1 || docker compose up -d 2>&1
    for i in $(seq 1 12); do
        curl -sf "http://localhost:${port}${health}" >/dev/null 2>&1 && { docker image prune -f …; echo "Deploy OK"; return 0; }
        sleep 5
    done
    echo "FAILED — rolling back to $PREV"
    git reset --hard "$PREV"
    docker compose … up -d …          # NO rebuild, NO re-gate
    return 1
}
case "$REPO" in
    mkbabb/fourier-analysis) deploy "/var/www/fourier-analysis" "8100" "/api/health" … ;;
    mkbabb/words)            deploy "$HOME/floridify" "8110" "/health" … ;;
    mkbabb/speedtest)        … (bespoke npm-build arm) … ;;
    mkbabb/value.js)         deploy "$HOME/Programming/palette-api" "8130" "/" … ;;
    mkbabb/csp-solver)       deploy "/var/www/csp-solver" "8120" "/" … ;;
esac
```

The fourier arm **exists** and targets `/var/www/fourier-analysis`, port `8100`,
`/api/health` — but it is the **un-improved** logic. Verified the four C.W1
improvements are absent:

```
$ grep -c flock /opt/deploy/scripts/dispatch.sh                 → 0   (no serialisation)
$ grep -c "porcelain" /opt/deploy/scripts/dispatch.sh           → 0   (no dirty-tree guard)
```

Gap analysis (the deploy-hook is **NOT** wired in — `/var/www/fourier-analysis`
has no `scripts/deploy-hook.sh` at SHA `8818ae5`, and the dispatcher invokes its
own inline `deploy()`):

| Improvement (`scripts/deploy-hook.sh`) | Live `dispatch.sh` | Risk on the shared host |
|---|---|---|
| `flock /run/lock/fourier-deploy.lock` (`deploy-hook.sh:52,164`) | **absent** — concurrent pushes race | a second push mid-build corrupts the checkout |
| real `:8100` health-gate, bounded, no swallow (`deploy-hook.sh:68-82`) | blind `sleep 5`×12 with `curl -sf … && return` (no `\|\| echo` swallow here, but no `{"status":"ok"}` body-check) | a 200 from a half-broken app "passes"; the gate is shallow |
| rebuild-on-rollback + re-gate (`deploy-hook.sh:147-158`) | `reset --hard $PREV` → `up -d` only, **no rebuild, no re-gate** | rollback restarts containers built from the *failed* source; never confirms green |
| dirty-tree-fail-loud (`deploy-hook.sh:89-98`) | **absent** — blind `git reset --hard origin/master` | **silently discards the host's hand-edited `docker-compose.prod.yml` + `docker-compose.yml`** (the RW source mounts + inline password) on the very next deploy |
| `build … \|\| build …` fallback that defeats `set -e` | **present** (`build … 2>&1 \|\| docker compose build`) | a failed primary build falls through to `up -d` with a half-built image set |

**The dirty-tree hazard is now load-bearing for D.** The host tree is `M`-dirty
on both compose files (§2.4); the live dispatcher would `reset --hard` straight
over them. D must reconcile the host tree *before* the first gated deploy, or
the override is lost and `$PREV` is unreproducible (C7).

### 2.4 — The host fourier tree (stale + dirty)

```
$ cd /var/www/fourier-analysis && git rev-parse HEAD
8818ae532125c8d555ab715dbf172c625a10a8ba
$ git status --porcelain
 M docker-compose.prod.yml
 M docker-compose.yml
?? ssl/
$ git log --oneline -3
8818ae5 refactor(contours): restructure config hierarchy, improve pipeline detail extraction
a17356c fix(web): trail reset on epicycle change only, preview cleanup, auto-play
8ce3586 fix(web): suppress auto-recompute during image transitions
```

SHA `8818ae5` is exactly the SHA the C P2 probe recorded — **the host has not
moved since C's audit**. The `M` on both compose files = the host-specific
overrides (inline password, RW source mounts) measured in §1.2. `?? ssl/` =
untracked cert material (survives a `reset --hard`, but the `M` tracked files do
not).

### 2.5 — Deploy history: fourier has NEVER deployed through this chain

```
$ ls -la /opt/deploy/logs/
… mkbabb-speedtest-2026032*-*.log   (18 files)
… mkbabb-words-20260328-*.log       (3 files)
```

**Zero `mkbabb-fourier-analysis-*.log`.** The fourier `case` arm has never
fired. The webhook journal shows only speedtest/words activity (last Apr 3,
including a speedtest port-80-collision error). The commit-to-deploy chain for
fourier is **unexercised** — C's G10/G11 (chain transcript + rollback proof)
remain "host-activation pending," now D's to discharge.

---

## §3 — The TLS reality

### 3.1 — Mounted certs (`ls -la /var/www/fourier-analysis/ssl/`)

```
-rw-r--r-- 1 mbabb            mbabb            1927  mongo-ca.pem
-rw-rw-r-- 1 mbabb            mbabb            1927  mongo-cert.pem
-rw------- 1 systemd-coredump systemd-coredump 3272  mongo-key.pem
-rw------- 1 systemd-coredump systemd-coredump 5199  mongo.pem
```

The dir carries **four** files with names that only partly match
`gen-mongo-certs.sh`'s contract (`mongo-ca.pem` ✓, `mongo.pem` ✓, plus the
script-foreign `mongo-cert.pem`/`mongo-key.pem`; the script also emits
`ca.key`/`server.key`, absent here). `mongo.pem` + `mongo-key.pem` are owned by
`systemd-coredump`, mode `0600` — **I could not read them (Permission denied) —
correct read-only behaviour**; recorded as not-inspectable rather than mutated.

### 3.2 — CA provenance — does NOT match `gen-mongo-certs.sh`

```
$ openssl x509 -in ssl/mongo-ca.pem -noout -subject -issuer -dates -fingerprint -sha256
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
issuer =CN = mbabb.fridayinstitute.net, O = mbabb, C = US   (self-signed)
notBefore=Mar 28 06:36:28 2026 GMT
notAfter =Mar 27 06:36:28 2029 GMT                          (3-year, NOT 10-year)
sha256 Fingerprint=44:86:A9:D0:…:B9:70
```

The live fourier CA is **`CN=mbabb.fridayinstitute.net`** — the C.W2 target is
**`CN=fourier-internal-ca, O=fourier-analysis, OU=infra`** (`tls.md §2`,
`gen-mongo-certs.sh:54`). **Mismatch confirmed.** The live root is also a
**3-year** cert, not the script's 10-year (`CA_DAYS=3650`,
`gen-mongo-certs.sh:63`). The invariant-19 close-gate evidence (a recorded
`CN=fourier-internal-ca` issuer line) is therefore **NOT** satisfiable against
the live cert — running `gen-mongo-certs.sh` on the host is a prerequisite, and
it would **replace** this CA (the script reuses an existing CA only if the file
names match; `mongo-ca.pem` here is a different-subject foreign CA, so the
operator must decide: `FORCE_CA=1` clobber, or accept the live subject).

### 3.3 — Three TLS-laxity sites all live

- Backend `MONGO_URI` (live env, §1.2): `…&tls=true&tlsAllowInvalidCertificates=true`.
- mongod command (§1.2): `--tlsAllowConnectionsWithoutCertificates`.
- Healthcheck (repo prod compose `docker-compose.prod.yml:58`):
  `--tls`, `--tlsAllowInvalidCertificates`.

All three match CA5 §3.2's "broader than one line" finding. The C.W2 Stratum-B
diff (`tls.md §9`, Edits 1–3 + the backend `./ssl/mongo-ca.pem:ro` mount)
remains **fully unapplied** on prod.

### 3.4 — Shared-host TLS coupling — the certs are per-app self-signed with a SHARED subject

```
$ openssl x509 … fourier   /var/www/fourier-analysis/ssl/mongo-ca.pem  → CN=mbabb.fridayinstitute.net  FP 44:86:A9:…
$ openssl x509 … floridify /home/mbabb/floridify/ssl/mongo-ca.pem       → CN=mbabb.fridayinstitute.net  FP 90:68:73:…
$ openssl x509 … palette   …/palette-api/ssl/mongo-ca.pem               → CN=mbabb.fridayinstitute.net  FP E9:E8:2D:…
```

**All three subjects are identical (`CN=mbabb.fridayinstitute.net`) but the
fingerprints DIFFER** — they are three *independent* self-signed CAs that happen
to share the subject string. floridify + palette mongo run the **identical** TLS
command as fourier (`requireTLS` + same flag set). Implication for D: re-issuing
fourier's CA to `CN=fourier-internal-ca` is **fully isolated** — it touches only
fourier's `./ssl/` + fourier's mongo container, **NOT** the siblings (they own
separate `ssl/` dirs + separate CAs). The shared-host TLS risk is therefore
LOW for the cert swap itself; the risk is operational (restarting
`fourier-analysis-mongo-1` is a fourier-only blip).

---

## §4 — The storage reality

### 4.1 — No blob backend, migration never run, DB effectively empty

```
$ docker exec fourier-analysis-backend-1 ls -la /data/blobs   → No such file or directory
$ docker exec fourier-analysis-backend-1 ls -la /data         → No such file or directory
$ docker volume inspect image_blobs                            → Error: no such volume
```

Read-only mongo probe (via `mongosh --tlsAllowInvalidCertificates`, count-only):

```
COLLECTIONS: images,flags,admin_audit,users,fs.files,contours,sessions,snapshots,gallery,fs.chunks
images count:               0
images with blob:           0
images with storage_uri:    0
images with thumbnail:      0
visualizations count:       0
contours count:             0
```

**Findings:**
1. The blob migration has **never run** — but it is also **moot today**: the
   prod `images` collection has **0 documents**. There are no inline blobs to
   relocate at this SHA. The prod DB is essentially empty user-data.
2. The collection set is a **pre-A schema**: it carries `fs.files`/`fs.chunks`
   (GridFS), `snapshots`, and `gallery` — and **NO `visualizations`
   collection** (the B-era entity). This DB has never run the A/B/C index
   builders or the `migrate_visualization.py` backfill. The legacy
   `snapshots`/`gallery`/GridFS collections that CA5 §4 discusses retiring are
   live here, but empty.
3. Because the DB is empty, the C.W5 atomic-cutover (`migrate_image_blobs.py`)
   has nothing to migrate **at first deploy** — D should still stand up the
   `image_blobs` volume + the Stratum-B mount so that post-deploy uploads land
   on the filesystem from day one, but the migration itself is a no-op until
   there is data. This is a *simplification*: D can ship the blob backend
   without a risky data backfill.

### 4.2 — DR posture (`blob-backend-dr.md`) — unprovisioned

The `external: true` guard (`docker-compose.prod.yml:101-103`) requires
`docker volume create image_blobs` **before** the first prod bring-up (a
host-ops step, `blob-backend-dr.md:64`). It does not exist yet → a deploy of
master as-is would **fail** to start the backend (external volume missing).
This is a hard D pre-deploy step, not optional. No `mongodump`/snapshot cron
exists (the split-brain-on-restore hazard is unmitigated; named, not built).

---

## §5 — The constellation infra (`project_infra_plan.md`) — done / pending / D-must-integrate

| Plan item (2026-03-28) | Live state | Verdict for D |
|---|---|---|
| webhook CI/CD (adnanh/webhook, not GH Actions) | **DONE** — `webhook.service` active, shared `dispatch.sh`, all five repos wired *except fourier never fired* | D wires fourier's arm to `deploy-hook.sh` + captures the first transcript |
| MongoDB TLS+SCRAM on unique host ports (27017-20) | **DONE topologically** — fourier 27017, floridify 27018, palette 27020, all `requireTLS`+`--auth` | but **laxity flags remain** + CA subject is `mbabb.fridayinstitute.net`, not the C target → D's W2 cutover |
| 10-port blocks, 127.0.0.1-bound + nginx gateway | **DONE** — fourier 8100, floridify 8110, csp 8120, palette 8130, speedtest 8140 (matches plan) | ratify; no renumber |
| VPN removal / dev-direct-to-prod TLS | mongo ports published `0.0.0.0:27017-20` (not loopback) — direct access works | the dev→prod `.env.example` parity (`tls.md §7`) is D's to land |
| 15 GiB host disk pressure | **STALE** — host is **497 GiB, 24% used** | the disk-pressure premise (eviction band-aids etc.) is void; storage relocation is about Mongo-doc-size, not host disk |
| public ingress | **host Apache2** (`*:443`/`*:80`), vhost `fourier.babb.dev` → `ProxyPass / http://localhost:8100/` (`/etc/apache2/sites-enabled/babb-dev.conf`); also `/fourier/api/` path-proxy in `default-ssl.conf`. Host nginx + caddy **inactive**. | the TLS terminator + domain routing is Apache, NOT in fourier's compose — D must not assume nginx-host; any ingress change is a shared-Apache act |

**Multi-app host implications (the shared-blast-radius ledger):**
- The **`dispatch.sh` + `hooks.json` + `.env`** are shared by all five repos.
  Hardening them (flock, rebuild-on-rollback, `0600` perms) is a
  **constellation-level** act — it changes the deploy path for floridify /
  palette / csp / speedtest too. D's safe move: point the fourier `case` arm at
  the repo-local `scripts/deploy-hook.sh` (fourier-only), and carry the
  shared-dispatcher hardening as a separate, explicitly-coordinated step.
- The **TLS CA swap is fourier-isolated** (§3.4) — low shared risk.
- **Apache** is shared ingress — leave it; fourier's contract is "serve on
  `127.0.0.1:8100`," which the compose already satisfies.
- **Disk is ample** — the blob volume's growth is not a host-disk concern.

---

## §6 — Recommended D infra+deploy sequence (the safe order on a shared host)

The binding constraint is **inversion-forbidden ordering**: provision before
flags (TLS), reconcile before reset (deploy), create-volume before bring-up
(storage). Recommended D thread, strictly sequenced:

**Phase 0 — host-tree reconcile (UNBLOCKS everything; no app change).**
1. On the host, in `/var/www/fourier-analysis`, **resolve the dirty tree**: the
   `M docker-compose.prod.yml` / `M docker-compose.yml` overrides (inline
   password, RW source mounts) must be either (a) folded into repo master as the
   intended prod shape, or (b) discarded in favour of the repo's
   `${MONGO_PASSWORD:?}` + no-source-mount design. **Decision required** — the
   repo design is the cleaner target (secret via `.env`, immutable image). Then
   commit/stash so `git status --porcelain` is clean. *This is the step the
   deploy-hook's dirty-tree guard would otherwise abort on.*
2. Stage a host `.env` (or `/opt/deploy`-level secret) carrying `MONGO_PASSWORD`
   so the repo compose's `${MONGO_PASSWORD:?}` resolves — the literal must leave
   the compose file.

**Phase 1 — wire + harden the deploy chain (fourier-scoped first).**
3. Land `scripts/deploy-hook.sh` on the host (it ships with master once Phase 3
   deploys; for the first deploy it can be copied in). Re-point the fourier
   `case` arm in `/opt/deploy/scripts/dispatch.sh` to `exec` the repo-local
   `deploy-hook.sh` instead of the inline `deploy()`. **Fourier-only edit** to
   the shared file — do not touch sibling arms.
4. Harden `hooks.json` + `/opt/deploy/.env` from `0664` to `0600` (the secret is
   currently world-readable). This is shared infra but a pure-permission
   tightening — low risk; rotate the HMAC secret while doing so (GitHub webhook
   config + `hooks.json` in lockstep).
5. (Coordinated, optional) port the four improvements into the shared
   `deploy()` for the sibling repos — separate, announced step.

**Phase 2 — TLS provisioning (fourier-isolated).**
6. On the host, from the repo root, run `bash scripts/gen-mongo-certs.sh`
   (decide `FORCE_CA=1` vs reusing — the live CA is a foreign-subject cert, so a
   fresh `fourier-internal-ca` is the C-conformant choice). Verify the SAN dump
   (`DNS:mongo,DNS:localhost,IP:127.0.0.1,DNS:mbabb.fridayinstitute.net`) + the
   `CN=fourier-internal-ca` issuer line — **this is the invariant-19 close-gate
   evidence**, capture it.
7. Apply the `tls.md §9` Stratum-B compose edits (drop the three
   `tlsAllowInvalid*`/`WithoutCertificates` sites; add the backend
   `./ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro` mount + URI `tlsCAFile`).
   **Do NOT invert** — certs first (step 6), flags second.

**Phase 3 — storage backend + the gated deploy.**
8. `docker volume create image_blobs` on the host (the `external: true`
   precondition — without it the backend will not start).
9. `git push origin master` → the wired deploy-hook fires: dirty-tree guard
   passes (Phase 0), advances `8818ae5 → master`, builds, gates on
   `:8100/api/health` `{"status":"ok"}` + SPA. The blob migration runs as a
   **no-op** (empty `images`), and new uploads land on `image_blobs` from then
   on. Capture the chain transcript (G10) from
   `/opt/deploy/logs/mkbabb-fourier-analysis-*.log`.
10. Verify TLS (Gf): `docker compose exec backend python -c "…MongoClient(…tlsCAFile=/etc/ssl/mongo-ca.pem…).admin.command('ping')"` succeeds with **no** invalid-cert flag.

**Phase 4 — rollback proof + precepts promotion.**
11. Exercise G11: push an intentional bad commit, observe the deploy-hook's
    rebuild-on-rollback restore last-known-green, capture the transcript.
12. Promote the two staged precepts into the `docs/precepts` **submodule**
    (`infra/deploy.md` from DEPLOY-RECONCILE §4; `infra/tls.md` from `tls.md`)
    + bump the fourier gitlink + dual-cite. Outward-facing coordinated act.

**Note on B/A schema drift (surfaced for D synthesis):** the prod DB lacks the
`visualizations` collection and carries legacy GridFS/`snapshots`/`gallery`.
Because it is empty, the A/B index builders + `migrate_visualization.py` will
initialise cleanly on first connect — but D should confirm
`api/services/database.py`'s startup index creation runs against this DB and
that the legacy collections (empty) are harmless or get dropped. This is a
data-layer adjacency, flagged for the DA-storage lane / D synthesis.

---

## Appendix — verified evidence index (host + repo, audit time)

**Host (SSH `mbabb@mbabb.fridayinstitute.net:1022`, read-only):**
- `docker ps -a` — 14 containers, 5 compose projects (§1.1).
- `/var/www/fourier-analysis` HEAD = `8818ae5`; `git status` = `M` both compose + `?? ssl/` (§2.4).
- `fourier-analysis-backend-1` env: inline password + `tlsAllowInvalidCertificates=true`; RW source mounts; `--workers 4` (§1.2).
- `fourier-analysis-mongo-1` cmd: `requireTLS` + 3 laxity flags (§1.2, §3.3).
- `image_blobs` volume / `/data/blobs` dir: **absent** (§4.1).
- prod `fourier` DB: `images=0`, no `visualizations`, legacy GridFS/snapshots/gallery present (§4.1).
- `ssl/mongo-ca.pem`: `CN=mbabb.fridayinstitute.net`, 3-yr, self-signed, FP `44:86:A9:…` (§3.2).
- floridify/palette CA subjects identical, fingerprints differ → independent CAs (§3.4).
- `webhook.service` active, `*:9000`; `hooks.json`/`.env` `0664` world-readable, secret `89eadc1d…` (§2.1-2.2).
- `dispatch.sh`: fourier arm present; `grep -c flock`=0, `grep -c porcelain`=0; `build…||build…` fallback; rollback no-rebuild (§2.3).
- `/opt/deploy/logs/`: zero fourier logs (§2.5).
- ingress: host **Apache2** `*:443`, vhost `fourier.babb.dev`→`localhost:8100` (`/etc/apache2/sites-enabled/babb-dev.conf`); host nginx/caddy inactive (§5).
- `/api/health` → `{"status":"ok"}`, `/` → `200` (§0).
- disk `/dev/xvda1 497G 24%` (§0; refutes the 15 GiB plan premise).

**Repo (master `1e47115`):**
- `scripts/deploy-hook.sh:52,68-82,89-98,147-158,164` — the four improvements.
- `scripts/gen-mongo-certs.sh:54,61,63` — CA subject `fourier-internal-ca`, SAN set, 10-yr.
- `docker-compose.prod.yml:8,50-54,58,72,101-103` — TLS sites + `image_blobs external`.
- `api/scripts/migrate_image_blobs.py` — atomic cutover (no-op against empty DB).
- `docs/tranches/C/coordination/DEPLOY-RECONCILE.md` — §1 host-fact table, §3 Stratum-B residual, §4 staged deploy precept, §5 G10/G11 host-pending.
- `docs/tranches/C/infra/tls.md:§2,§9` — issuer gate + Stratum-B cutover diff.
- `docs/tranches/C/infra/blob-backend-dr.md:64` — `docker volume create image_blobs` precondition.
- `nginx/fourier.conf:19,30,42` — compute / api / SPA routes (no `/blobs/` route — blobs serve via backend `image_bytes` shim, by design).

**Note on the master SHA discrepancy:** the conversation's opening gitStatus
snapshot showed `fc5b3b0` (a B-tranche close commit); the live `git rev-parse
HEAD` at audit time is `1e47115` (the C-tranche close). The repo advanced
between snapshot and audit; all repo citations above are against the live
`1e47115` tree.
