# D.W1 Phase 1 — host close record (live-Mongo exposure CLOSED)

**Agent**: `W1.Phase1-host-coordinator`. **Executed**: 2026-05-27. **Host**: `mbabb@mbabb.fridayinstitute.net:1022` (AWS, `34.197.214.67`). **Charter**: `docs/tranches/D/waves/W1.md §2` (Phase 1 — live security hotfix, the FIRST act). **Sibling-isolation conditions**: `audit/challenge-P1.md §1` (P1.C3 — Mongo bind fourier-scoped; sibling residuals named. P1.C4 — UFW withdrawal fourier-scoped; sibling rules as residuals).

**Phase 1 scope**: close the live, internet-reachable Mongo exposure across three apps (`fourier`, `floridify`, `palette-api`) + withdraw 4 UFW rules (8 with IPv6 mirrors). **NOT** in scope: TLS-laxity flags (`tlsAllowInvalid*` — those stay; W2 lands the verified-TLS cutover). **NOT** in scope: any Phase 2 deploy action.

---

## Verdict

**PHASE 1 GREEN** — Mongo exposure CLOSED across the shared host.

- Three Mongos no longer publish on `0.0.0.0`. Each container still binds `27017/tcp` internally; the host-publish layer is gone.
- 8 UFW rules (4 ports × 2 IP families) withdrawn — UFW default-deny now governs the four ports.
- External `nc -zv` from a non-prod machine returns "Operation timed out" on all four ports — the world-reachable surface is closed.
- All three apps' loopback health probes return 200; all three Mongo containers report `healthy`. The backend ↔ mongo path over the compose-network DNS is unaffected.

---

## Per-step transcript

### Step 0 — baseline (pre-change ground-truth)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'docker ps --filter name=mongo --format "{{.Names}}\t{{.Ports}}"; echo ---; ss -tlnp 2>/dev/null | grep -E ":270(17|18|19|20)"'
floridify-mongodb	0.0.0.0:27018->27017/tcp, [::]:27018->27017/tcp
palette-api-mongo-1	0.0.0.0:27020->27017/tcp, [::]:27020->27017/tcp
fourier-analysis-mongo-1	0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
---
LISTEN 0      4096         0.0.0.0:27020      0.0.0.0:*
LISTEN 0      4096         0.0.0.0:27017      0.0.0.0:*
LISTEN 0      4096         0.0.0.0:27018      0.0.0.0:*
LISTEN 0      4096            [::]:27020         [::]:*
LISTEN 0      4096            [::]:27017         [::]:*
LISTEN 0      4096            [::]:27018         [::]:*

$ ssh -p 1022 mbabb@... 'sudo ufw status verbose | grep -E "270(17|18|19|20)"'
27017/tcp                  ALLOW IN    Anywhere                   # MongoDB - fourier-analysis
27018/tcp                  ALLOW IN    Anywhere                   # MongoDB - floridify
27019/tcp                  ALLOW IN    Anywhere                   # MongoDB - speedtest
27020/tcp                  ALLOW IN    Anywhere                   # MongoDB - palette-api
27017/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - fourier-analysis
27018/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - floridify
27019/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - speedtest
27020/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - palette-api

$ ssh -p 1022 mbabb@... 'cd /var/www/fourier-analysis && git status --porcelain && git rev-parse HEAD'
 M docker-compose.prod.yml
 M docker-compose.yml
?? ssl/
---
8818ae532125c8d555ab715dbf172c625a10a8ba
```

Baseline confirmed exactly per W0 §1.2 + the live ground-truth in the charter. Host SHA `8818ae5` (pre-A).

---

### Step 1 — fourier Mongo bind off `0.0.0.0` (fourier-owned, lowest risk)

**1a. Read live state** (`/var/www/fourier-analysis/docker-compose.prod.yml:42-55`):

```
      - "27017:27017"
    command: ["mongod", "--tlsMode", "requireTLS",
              "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
              "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
              "--tlsAllowConnectionsWithoutCertificates",
              "--auth"]
    healthcheck:
      test: ["CMD", "mongosh", "-u", "fourier-admin", "-p", "cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb", ...
```

The mongo service has `ports: - "27017:27017"` (the `0.0.0.0`-publishing form). Note also the inline plaintext password `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` in the healthcheck — this is the DA4 §1.2 residual; W1 Phase 2 extracts it to host `.env`. **Phase 1 does not touch the password** — it only closes the network surface.

**1b. Backup + apply canonical edit on host** (matches the local-repo `docker-compose.prod.yml:44-52` already-staged shape — `ports: !reset []` plus the explanatory comment block):

```
$ ssh -p 1022 mbabb@... 'sudo cp /var/www/fourier-analysis/docker-compose.prod.yml /var/www/fourier-analysis/docker-compose.prod.yml.W1-pre'

$ ssh -p 1022 mbabb@... 'python3 /tmp/w1-fourier-mongo-patch.py'
OK — patch applied
```

The patch script (`/tmp/w1-fourier-mongo-patch.py` — single-anchor exact-string replace with count-guard; aborts if anchor matches != 1) executed cleanly. Diff:

```diff
--- /var/www/fourier-analysis/docker-compose.prod.yml.W1-pre
+++ /var/www/fourier-analysis/docker-compose.prod.yml
@@ -36,8 +36,14 @@
         max-file: "3"

   mongo:
-    ports:
-      - "27017:27017"
+    # D.W1 Phase 1 security hotfix — Mongo is NOT published to the host.
+    # The backend reaches mongo over the compose-network DNS name `mongo:27017`
+    # (the existing `app-network` bridge — docker-compose.yml). The previous
+    # `0.0.0.0:27017->27017/tcp` publish (NA5 §3.1 — externally TCP-reachable
+    # on 34.197.214.67:27017) is closed. The verified-TLS posture lands at
+    # W2 (the tlsAllowInvalid* flags here STAY until W2; this wave closes
+    # the network half).
+    ports: !reset []
     command: ["mongod", "--tlsMode", "requireTLS",
               "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
               "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
```

Byte-identical to the local-repo edit (the staged-but-uncommitted compose change). **The edit changes 2 file lines (the `ports:` + the `- "27017:27017"` line) and adds 8 lines of comment + the `!reset []` value** — the canonical form mirroring `docker-compose.prod.yml:32` (frontend `ports: !reset []`).

**1c. Compose validation + restart mongo only**:

```
$ ssh -p 1022 mbabb@... 'cd /var/www/fourier-analysis && sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml config --services'
mongo
backend
frontend
nginx

$ ssh -p 1022 mbabb@... 'cd /var/www/fourier-analysis && sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d mongo'
 Container fourier-analysis-mongo-1 Recreate
 Container fourier-analysis-mongo-1 Recreated
 Container fourier-analysis-mongo-1 Starting
 Container fourier-analysis-mongo-1 Started
```

Mongo only — backend, frontend, nginx untouched.

**1d. Verify port no longer publishes**:

```
$ ssh -p 1022 mbabb@... 'docker ps --filter name=fourier-analysis-mongo --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"'
fourier-analysis-mongo-1	Up 9 seconds (healthy)	27017/tcp
```

`27017/tcp` (no `0.0.0.0:` prefix). Healthy.

**1e. Verify host listener gone**:

```
$ ssh -p 1022 mbabb@... 'ss -tlnp 2>/dev/null | grep ":27017"'
(zero output)
```

Zero host listeners on `:27017`. (Note: shell wrapper printed `no :27017 listener (expected)` as the OR-fallback.)

**1f. Health-gate fourier — loopback (internal probe; matches the deploy-hook's gate at `deploy-hook.sh:68-82`)**:

```
$ ssh -p 1022 mbabb@... 'curl -sS -w "HTTP %{http_code}\n" http://127.0.0.1:8100/api/health'
{"status":"ok"}HTTP 200
```

`{"status":"ok"}` + HTTP 200. The fourier backend is serving correctly post-restart.

**Public-DNS probe note**: `curl https://fourier.babb.dev/api/health` returns HTTP 404 with a GitHub Pages 404 body. Investigation: `dig +short fourier.babb.dev` returns Cloudflare IPs (`104.21.56.22`, `172.67.175.252`) — the public DNS is **CNAMEd through Cloudflare** which routes to GitHub Pages, NOT to the Apache vhost on this host. This is a pre-existing DNS/ingress routing artifact (the `babb.dev` zone is on Cloudflare; the host Apache vhost listens on `:8100` and is reachable via the host's IP but not via the public `fourier.babb.dev` name). The backend itself is fully operational — proven by both the loopback probe (200) and the backend access logs:

```
$ docker logs fourier-analysis-backend-1 --tail 30 | grep health
INFO:     172.25.0.1:0 - "GET /api/health HTTP/1.0" 200 OK
```

The charter's health-gate intent — "did the app break" — is GREEN. The public-DNS routing question is a known pre-W10 residual (`D.md §3` W10 row covers backend ingress + origin LE for `api.<app>`); not a W1 Phase 1 concern.

**1g. Backend log probe — no fresh mongo errors**:

```
$ ssh -p 1022 mbabb@... 'docker logs fourier-analysis-backend-1 --since 30s 2>&1 | grep -iE "mongo|connection|error"'
(zero mongo/connection error lines)
```

The backend's compose-network connection to `mongo:27017` survived the mongo container recreate.

**Step 1 verdict**: GREEN. Fourier mongo bind off `0.0.0.0`; container healthy; backend healthy; no mongo errors.

---

### Step 2 — floridify Mongo bind off `0.0.0.0` (sibling, operator-coordinated)

**2a. Read live state** (`/home/mbabb/floridify/docker-compose.prod.yml:78-79`):

```
  mongo:
    ports:
      - "27018:27017"
    command: ["mongod", "--tlsMode", "requireTLS", ...
```

Confirmed at the file-line predicted by P1 §1 Check 5. Floridify compose service-name is `mongo` (container-name `floridify-mongodb`).

**2b. Apply analogous edit on host (cross-app act)**:

```
$ ssh -p 1022 mbabb@... 'sudo cp /home/mbabb/floridify/docker-compose.prod.yml /home/mbabb/floridify/docker-compose.prod.yml.W1-pre'

$ ssh -p 1022 mbabb@... 'python3 /tmp/w1-floridify-mongo-patch.py'
OK
```

Diff:

```diff
--- /home/mbabb/floridify/docker-compose.prod.yml.W1-pre
+++ /home/mbabb/floridify/docker-compose.prod.yml
@@ -75,8 +75,13 @@
         labels: "service=notification"

   mongo:
-    ports:
-      - "27018:27017"
+    # D.W1 Phase 1 security hotfix (cross-app coordinated act, fourier-D-recorded) —
+    # Mongo is NOT published to the host. The backend reaches mongo over the compose
+    # network DNS name `mongo:27017`. The previous `0.0.0.0:27018->27017/tcp` publish
+    # (NA5 §3.1 — externally TCP-reachable on 34.197.214.67:27018) is closed.
+    # Sibling-repo edit performed by fourier-D W1 Phase1-host-coordinator on host;
+    # floridify maintainer reconciles upstream commit in their own tranche.
+    ports: !reset []
     command: ["mongod", "--tlsMode", "requireTLS",
               "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
               "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
```

This is a **cross-app act per P1.C3** — the diff lives in the floridify host repo, NOT this fourier repo. The floridify maintainer reconciles upstream in their own tranche. Recorded here per the binding charter.

**2c. Restart floridify mongo only**:

```
$ ssh -p 1022 mbabb@... 'cd /home/mbabb/floridify && sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d mongo'
 Container floridify-mongodb Recreate
 Container floridify-mongodb Recreated
 Container floridify-mongodb Starting
 Container floridify-mongodb Started
```

**2d. Verify**:

```
$ ssh -p 1022 mbabb@... 'docker ps --filter name=floridify-mongodb --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"'
floridify-mongodb	Up 10 seconds (healthy)	27017/tcp

$ ssh -p 1022 mbabb@... 'ss -tlnp 2>/dev/null | grep ":27018"'
(zero output)
```

Container healthy; no host listener on `:27018`.

**2e. Health-gate floridify**:

```
$ ssh -p 1022 mbabb@... 'curl -sS -w "\nHTTP %{http_code}\n" http://127.0.0.1:8110/health'
{"status":"healthy","version":"0.1.0","services":{"database":"connected","search_engine":"initialized","cache":"healthy"},"metrics":{"cache_hit_rate":0.235...,"uptime_seconds":5193870},"timestamp":"2026-05-27T23:22:07...","database":"connected","search_engine":"initialized","cache_hit_rate":0.235...,"uptime_seconds":5193870,"connection_pool":{"status":"connected","initialized":true,"database_name":"floridify"}}
HTTP 200

$ ssh -p 1022 mbabb@... 'curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8110/'
HTTP 200
```

Floridify reports `"database":"connected"` + `"connection_pool":{"status":"connected","initialized":true,"database_name":"floridify"}` — the floridify backend's connection to its mongo over the compose network survived. (Public DNS `words.babb.dev` returns 404/GH-Pages — same Cloudflare→GH-Pages routing artifact as fourier; pre-W10 residual.)

**2f. Floridify backend logs — no fresh mongo errors**:

```
$ ssh -p 1022 mbabb@... 'docker logs floridify-backend --since 1m 2>&1 | grep -iE "mongo|connection|error"'
(zero error lines)
```

**Step 2 verdict**: GREEN. Floridify mongo bind off `0.0.0.0`; container healthy; backend reports `database: connected`; no errors.

---

### Step 3 — palette-api Mongo bind off `0.0.0.0` (sibling, operator-coordinated)

**3a. Read live state** (`/home/mbabb/Programming/palette-api/compose.yaml:48-51`):

```
  mongo:
    image: mongo:8
    ports:
      - "27020:27017"
    command: ["mongod", ...
```

Confirmed at file-line predicted by P1. Note the palette-api host directory has no `.git` — it is an **rsync target** per P1 §1 Check 5; the upstream source repo is value.js/api (probably). The W1 charter records the host edit; upstream sync is a separate-tranche concern.

**3b. Apply analogous edit**:

```
$ ssh -p 1022 mbabb@... 'sudo cp /home/mbabb/Programming/palette-api/compose.yaml /home/mbabb/Programming/palette-api/compose.yaml.W1-pre'

$ ssh -p 1022 mbabb@... 'python3 /tmp/w1-palette-mongo-patch.py'
OK
```

Diff:

```diff
--- /home/mbabb/Programming/palette-api/compose.yaml.W1-pre
+++ /home/mbabb/Programming/palette-api/compose.yaml
@@ -47,8 +47,13 @@

   mongo:
     image: mongo:8
-    ports:
-      - "27020:27017"
+    # D.W1 Phase 1 security hotfix (cross-app coordinated act, fourier-D-recorded) —
+    # Mongo is NOT published to the host. The api reaches mongo over the compose
+    # network DNS name `mongo:27017`. The previous `0.0.0.0:27020->27017/tcp` publish
+    # (NA5 §3.1 — externally TCP-reachable on 34.197.214.67:27020) is closed.
+    # This host directory is an rsync target (not git-tracked); the upstream source
+    # (likely value.js/palette-api) reconciles in a separate tranche.
+    ports: !reset []
     command: ["mongod", "--tlsMode", "requireTLS",
               "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
               "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
```

**Cross-app act per P1.C3**. The palette-api host directory has no `.git` (confirmed: `ls /home/mbabb/Programming/palette-api/.git` returns `No such file or directory`). Diff recorded here; upstream value.js-side reconciles separately.

**3c. Restart palette-api mongo only**:

```
$ ssh -p 1022 mbabb@... 'cd /home/mbabb/Programming/palette-api && sudo docker compose up -d mongo'
 Container palette-api-mongo-1 Recreate
 Container palette-api-mongo-1 Recreated
 Container palette-api-mongo-1 Starting
 Container palette-api-mongo-1 Started
```

**3d. Verify**:

```
$ ssh -p 1022 mbabb@... 'docker ps --filter name=palette-api-mongo --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"'
palette-api-mongo-1	Up 10 seconds (healthy)	27017/tcp

$ ssh -p 1022 mbabb@... 'ss -tlnp 2>/dev/null | grep ":27020"'
(zero output)
```

**3e. Health-gate palette-api**:

```
$ ssh -p 1022 mbabb@... 'curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8130/'
HTTP 200

$ ssh -p 1022 mbabb@... 'curl -ksS -o /dev/null -w "HTTP %{http_code}\n" https://mbabb.fridayinstitute.net/colors/'
HTTP 200
```

Loopback 200; external (with `-k` for the SSL hostname mismatch — a pre-existing certificate posture not in W1 scope) 200.

**3f. Palette-api logs — no errors, cron jobs running**:

```
$ ssh -p 1022 mbabb@... 'docker logs palette-api-api-1 --since 1m 2>&1 | grep -iE "mongo|error|connect"'
(zero error lines)

$ ssh -p 1022 mbabb@... 'docker logs palette-api-api-1 --tail 5'
[cron] Cleanup: removed 0 expired + 0 stale sessions, 0 orphaned votes
[cron] Cleanup: removed 0 expired + 0 stale sessions, 0 orphaned votes
[cron] Cleanup: removed 0 expired + 0 stale sessions, 0 orphaned votes
[cron] Cleanup: removed 21 expired + 0 stale sessions, 0 orphaned votes
[cron] Cleanup: removed 0 expired + 0 stale sessions, 0 orphaned votes
```

Cron jobs running, no errors. (The `21 expired` line is normal session cleanup — proves mongo write path is live.)

**Step 3 verdict**: GREEN. Palette-api mongo bind off `0.0.0.0`; container healthy; api healthy; cron jobs running cleanly against mongo.

---

### Step 4 — UFW withdrawal (4 rules + IPv6 mirrors = 8 rules total)

**4a. Confirm 8 rules present (already shown in Step 0)**. Re-verified before the deletes:

```
$ ssh -p 1022 mbabb@... 'sudo ufw status verbose | grep -E "270(17|18|19|20)"'
27017/tcp                  ALLOW IN    Anywhere                   # MongoDB - fourier-analysis
27018/tcp                  ALLOW IN    Anywhere                   # MongoDB - floridify
27019/tcp                  ALLOW IN    Anywhere                   # MongoDB - speedtest
27020/tcp                  ALLOW IN    Anywhere                   # MongoDB - palette-api
27017/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - fourier-analysis
27018/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - floridify
27019/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - speedtest
27020/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - palette-api
```

**4b–4e. Withdraw each rule** (UFW's `delete allow N/tcp` removes both v4 and v6 entries when paired — confirmed by the output):

```
$ ssh -p 1022 mbabb@... '
sudo ufw delete allow 27017/tcp
sudo ufw delete allow 27018/tcp
sudo ufw delete allow 27019/tcp
sudo ufw delete allow 27020/tcp
'
Rule deleted
Rule deleted (v6)
Rule deleted
Rule deleted (v6)
Rule deleted
Rule deleted (v6)
Rule deleted
Rule deleted (v6)
```

8 rules removed (4 v4 + 4 v6). The stale `:27019` speedtest entry was withdrawn as safe ride-along housekeeping per P1.C4 (no live listener exists; removing it is pure cleanup, zero co-tenant impact).

**4f. Verify**:

```
$ ssh -p 1022 mbabb@... 'sudo ufw status verbose | grep -E "270(17|18|19|20)"'
(zero output — ZERO Mongo-port rules remain)
```

Full post-state of UFW (Mongo ports gone; SSH + HTTP/HTTPS remain):

```
$ ssh -p 1022 mbabb@... 'sudo ufw status verbose | head -15'
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), deny (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
1022/tcp                   ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere                   # HTTPS
80/tcp                     ALLOW IN    Anywhere                   # HTTP - certbot + redirect
1022/tcp (v6)              ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)              # HTTPS
80/tcp (v6)                ALLOW IN    Anywhere (v6)              # HTTP - certbot + redirect
```

UFW posture: `Default: deny (incoming)`; only SSH (`1022`), HTTPS (`443`), HTTP (`80`) ingress permitted. The Mongo ports now fall under the default-deny.

**Step 4 verdict**: GREEN. All 8 UFW Mongo rules withdrawn; default-deny governs.

---

## External `nc -zv` proof (the Phase 1 binding-pass criterion)

From the local laptop (NOT via SSH — external probe), targeting the prod host's public IP:

```
$ for port in 27017 27018 27019 27020; do echo "--- port $port ---" ; nc -zv -G 8 -w 8 34.197.214.67 $port 2>&1 ; done
--- port 27017 ---
nc: connectx to 34.197.214.67 port 27017 (tcp) failed: Operation timed out
--- port 27018 ---
nc: connectx to 34.197.214.67 port 27018 (tcp) failed: Operation timed out
--- port 27019 ---
nc: connectx to 34.197.214.67 port 27019 (tcp) failed: Operation timed out
--- port 27020 ---
nc: connectx to 34.197.214.67 port 27020 (tcp) failed: Operation timed out
```

All four ports return "Operation timed out" — the UFW default-deny silently drops the SYN packets (per the charter, "timed out is also refusal at the firewall level — either is acceptable"). Note: the audit's original NA1 §4b captured the OPEN state ("external connect succeeded"); this transcript captures the CLOSED state ("Operation timed out"). The symmetry — open before, refused/timed-out after — is the binding proof of closure.

---

## Step 6 — Final operator-confirms-healthy probe (cross-app)

```
$ ssh -p 1022 mbabb@... '
echo "== fourier loopback :8100/api/health =="
curl -sS -w "\nHTTP %{http_code}\n" http://127.0.0.1:8100/api/health
echo "== floridify loopback :8110/ =="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8110/
echo "== palette loopback :8130/ =="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8130/
echo ""
echo "== all three Mongo containers =="
docker ps --filter name=mongo --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "== host listeners on 27017/27018/27020 =="
ss -tlnp 2>/dev/null | grep -E ":270(17|18|20)" || echo "ZERO host listeners on Mongo ports"
'

== fourier loopback :8100/api/health ==
{"status":"ok"}
HTTP 200
== floridify loopback :8110/ ==
HTTP 200
== palette loopback :8130/ ==
HTTP 200

== all three Mongo containers ==
palette-api-mongo-1	Up About a minute (healthy)	27017/tcp
floridify-mongodb	Up 2 minutes (healthy)	27017/tcp
fourier-analysis-mongo-1	Up 3 minutes (healthy)	27017/tcp

== host listeners on 27017/27018/27020 ==
ZERO host listeners on Mongo ports (expected)
```

All three apps GREEN on the loopback path that Apache serves; all three Mongos healthy/running; zero host listeners on Mongo ports.

**Public-DNS note (recorded for transparency)**: `https://fourier.babb.dev/`, `https://words.babb.dev/`, and `https://mbabb.fridayinstitute.net/colors/` all show DNS/certificate routing artifacts unrelated to this wave — `babb.dev` is on Cloudflare CNAMEd to GitHub Pages (the public hostname does NOT currently route to the host's Apache vhost), and the `mbabb.fridayinstitute.net` cert is for a different name (SSL hostname mismatch, resolved by `-k`). These are pre-existing pre-W10 residuals; W10 (`backend ingress + origin LE for api.<app> + CORS`) addresses them. The W1 health-gate criterion — "the app didn't break post-restart" — is GREEN on the loopback path that the host actually serves.

---

## Cross-app residuals recorded (per P1.C3 + P1.C4)

This wave performed three host-edits on sibling-repo files outside fourier's `git` ownership. They are recorded here for upstream reconciliation in subsequent tranches:

### Floridify compose edit

- **File**: `/home/mbabb/floridify/docker-compose.prod.yml`
- **Edit**: mongo `ports: - "27018:27017"` → `ports: !reset []` (+ 5-line explanatory comment)
- **Backup**: `/home/mbabb/floridify/docker-compose.prod.yml.W1-pre`
- **Git state after edit**: `M docker-compose.prod.yml` (dirty on the floridify host tree; the floridify maintainer commits/discards in their own tranche). The fourier-D commit does NOT include this diff.

### Palette-api compose edit

- **File**: `/home/mbabb/Programming/palette-api/compose.yaml`
- **Edit**: mongo `ports: - "27020:27017"` → `ports: !reset []` (+ 5-line explanatory comment)
- **Backup**: `/home/mbabb/Programming/palette-api/compose.yaml.W1-pre`
- **Git state after edit**: N/A — this directory is an rsync target with **no `.git` tree** (`ls /home/mbabb/Programming/palette-api/.git` returns `No such file or directory`). The upstream source (likely `value.js/api/compose.yaml` or a standalone palette-api repo) carries the canonical copy and reconciles separately. The next rsync from upstream would overwrite this edit; the upstream maintainer must mirror the change before then.

### UFW rules withdrawn (cross-app, host-firewall scope)

- **Fourier-scoped**: `27017/tcp` v4 + v6 (the fourier-owned rule).
- **Cross-app residuals (4 rules)**: `27018/tcp` (floridify) + `27020/tcp` (palette-api) + `27019/tcp` (stale speedtest — no live listener, safe ride-along housekeeping per P1.C4) — each with their v6 mirror. 6 rules total beyond fourier's scope. All 8 rules withdrawn in the same operator session per the charter.

---

## Sibling-isolation conditions discharged (per challenge-P1.md)

- **P1.C3** (Mongo bind fourier-scoped; sibling residuals named) — DISCHARGED. Fourier's own edit was made at `/var/www/fourier-analysis/docker-compose.prod.yml` (file-tracked diff above); the floridify + palette-api edits are recorded here as **named cross-app residuals**, NOT folded into fourier's commit. The floridify maintainer reconciles upstream; palette-api's upstream (value.js-side) reconciles separately.
- **P1.C4** (UFW withdrawal fourier-scoped; sibling rules as residuals) — DISCHARGED. The fourier-scoped `27017/tcp` rule was withdrawn alongside the cross-app `27018/27019/27020` rules in a single coordinated UFW session; the stale `27019` is recorded as safe-ride-along housekeeping (no live listener — confirmed via `ss -tlnp` baseline). Sibling withdrawals are explicitly cross-app per the charter.

---

## Honesty discipline

- **TLS-laxity flags STAY**: `tlsAllowInvalidCertificates=true` in the URI + `--tlsAllowConnectionsWithoutCertificates` in `mongod` command + `--tlsAllowInvalidCertificates` in healthcheck — all unchanged. W2 lands the verified-TLS cutover. W1 closed the network-layer surface, not the transport-layer trust laxity.
- **Inline plaintext password STAYS**: `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` in the fourier compose healthcheck (`docker-compose.prod.yml:50` post-edit) — unchanged. W1 Phase 2 extracts to `/var/www/fourier-analysis/.env`; this Phase 1 record does NOT perform that step (it is out of scope for the host-coordinator agent — Phase 2 is the second agent's lane).
- **Host SHA UNCHANGED**: `git rev-parse HEAD` on `/var/www/fourier-analysis` still returns `8818ae5` (pre-A). This Phase 1 made only working-tree edits on the host's checkout; no commit, no advance. W1 Phase 2 wires the deploy chain and advances HEAD.
- **No deploy action**: zero invocations of `scripts/deploy-hook.sh`, zero `git push origin master`, zero rebuild of the backend/frontend/nginx containers. Only the three Mongo containers were recreated (each via `up -d mongo` against an edited compose).
- **External probe is real**: the `nc -zv` was executed from the local laptop, not via SSH. Output captured verbatim above. The "Operation timed out" closure (vs the audit's previously-confirmed "open") is the binding proof.

---

## Files modified on host

- `/var/www/fourier-analysis/docker-compose.prod.yml` (mongo `ports:` block — 2 lines removed + 8 lines added; canonical `!reset []`)
- `/home/mbabb/floridify/docker-compose.prod.yml` (mongo `ports:` block — 2 lines removed + 6 lines added; cross-app)
- `/home/mbabb/Programming/palette-api/compose.yaml` (mongo `ports:` block — 2 lines removed + 6 lines added; cross-app rsync-target)

Backups: same paths with `.W1-pre` suffix.

## Host state changes

- 3 Mongo containers recreated (`up -d mongo`); all three healthy and running on container-internal `27017/tcp` only.
- 8 UFW rules withdrawn (4 ports × v4+v6); UFW now has only `1022/tcp` (SSH), `443/tcp` (HTTPS), `80/tcp` (HTTP) ingress allows.
- No host-publish of Mongo on any of `27017/27018/27020` (and the stale `27019` was never bound).
- Fourier git tree state: `M docker-compose.prod.yml` (pre-existing, now with the W1 edit + the still-residual inline password in healthcheck) + `M docker-compose.yml` (pre-existing, unchanged by this wave) + `?? ssl/` (pre-existing) + `?? docker-compose.prod.yml.W1-pre` (W1-introduced backup). HEAD still `8818ae5`. The W1 Phase 2 reconcile-and-deploy agent picks up from here.

---

## Verdict

**PHASE 1 GREEN** — Mongo exposure CLOSED across the shared host. World-reach proven gone (external `nc -zv` timed out on all 4 ports — symmetry with the audit's previously-confirmed open). Three apps healthy on the loopback path; three Mongo containers healthy; no host listeners on `:27017/:27018/:27020`. Cross-app sibling-isolation conditions P1.C3 + P1.C4 discharged with named residuals. TLS-laxity STAYS (W2); host SHA STAYS at `8818ae5` (W1 Phase 2 advances).
