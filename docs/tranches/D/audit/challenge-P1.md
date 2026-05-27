# Wχ-P1 — co-tenant blast radius (shared host + dispatcher + Apache ingress)

**Probe agent**: P1 (one agent). **Authored**: 2026-05-27. **Mode**: read-only adversarial review of the Wα-ratified substrate. **Charter**: `docs/tranches/D/waves/Wchi.md §3.1`. **Baseline**: `docs/tranches/D/waves/W0.md §1`–§1.4. **Substrate**: `docs/tranches/D/research/README.md` R2 + R4. **No source change. No host mutation.**

---

## §0 — Subject (the Wα-ratified claim under attack)

The W1 plan — wire the **fourier arm** of `/opt/deploy/scripts/dispatch.sh` to invoke `/var/www/fourier-analysis/scripts/deploy-hook.sh`, reconcile the dirty host tree (`M docker-compose.prod.yml`, `M docker-compose.yml`, `?? ssl/`), run the migration-with-deploy, and capture a chain transcript + bad-commit rollback proof — **does not break floridify or palette-api** (the two stateful co-tenants on the shared AWS host `34.197.214.67`, `mbabb.fridayinstitute.net:1022`). The probe interrogates: does fourier-isolation hold under the planned mutations?

The eight checks below are the binding adversarial checks per `Wchi.md §3.1` list items 1–8. Each carries pasted SSH evidence and a per-check verdict.

---

## §1 — The eight read-only adversarial checks

### Check 1 — Dispatcher fourier-arm-only edit (the core blast-radius question)

**Live dispatcher** (`ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cat /opt/deploy/scripts/dispatch.sh"`):

```bash
#!/bin/bash
set -euo pipefail

REPO="$1"
LOGDIR="/opt/deploy/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOGFILE="$LOGDIR/${REPO//\//-}-$TIMESTAMP.log"

deploy() {
    local dir="$1" port="$2" health="$3"
    cd "$dir"
    PREV=$(git rev-parse HEAD)
    git fetch origin && git reset --hard origin/master
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel 2>&1 || docker compose build --parallel 2>&1
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d 2>&1 || docker compose up -d 2>&1

    for i in $(seq 1 12); do
        curl -sf "http://localhost:${port}${health}" >/dev/null 2>&1 && {
            docker image prune -f >/dev/null 2>&1 || true
            echo "Deploy OK"
            return 0
        }
        sleep 5
    done

    echo "FAILED — rolling back to $PREV"
    git reset --hard "$PREV"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d 2>&1 || docker compose up -d 2>&1
    return 1
}

echo "=== Deploy started: $REPO at $(date) ===" | tee "$LOGFILE"

case "$REPO" in
    mkbabb/fourier-analysis)
        deploy "/var/www/fourier-analysis" "8100" "/api/health" 2>&1 | tee -a "$LOGFILE"
        ;;
    mkbabb/words)
        deploy "$HOME/floridify" "8110" "/health" 2>&1 | tee -a "$LOGFILE"
        ;;
    mkbabb/speedtest)
        # Speedtest needs frontend build before docker build
        cd ~/speedtest
        PREV=$(git rev-parse HEAD)
        git fetch origin && git reset --hard origin/master
        npm ci && npm run build
        docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        for i in $(seq 1 12); do
            curl -sf "http://localhost:8140/api/" >/dev/null 2>&1 && {
                docker image prune -f >/dev/null 2>&1 || true
                echo "Deploy OK" | tee -a "$LOGFILE"
                exit 0
            }
            sleep 5
        done
        echo "FAILED" | tee -a "$LOGFILE"
        git reset --hard "$PREV"
        exit 1
        ;;
    mkbabb/value.js)
        deploy "$HOME/Programming/palette-api" "8130" "/" 2>&1 | tee -a "$LOGFILE"
        ;;
    mkbabb/csp-solver)
        deploy "/var/www/csp-solver" "8120" "/" 2>&1 | tee -a "$LOGFILE"
        ;;
    *)
        echo "Unknown repo: $REPO" | tee -a "$LOGFILE"
        exit 1
        ;;
esac

echo "=== Deploy finished at $(date) ===" | tee -a "$LOGFILE"
```

**Exact `case mkbabb/fourier-analysis)` arm contents** (the only fourier-scoped block):

```bash
    mkbabb/fourier-analysis)
        deploy "/var/www/fourier-analysis" "8100" "/api/health" 2>&1 | tee -a "$LOGFILE"
        ;;
```

**Shared `deploy()` function body**: lines following `deploy() {` through the matching `}` — `cd "$dir"`; `PREV=$(git rev-parse HEAD)`; `git fetch origin && git reset --hard origin/master`; the two `build … || build …` lines; the two `up -d || up -d` lines; the 12×5s health-poll; the `image prune` on success; the `FAILED — rolling back` branch (`git reset --hard "$PREV"` + a second `up -d`); `return 0/1`. This body is **shared by four arms** (fourier, words, value.js, csp-solver); the speedtest arm has its own inlined deploy (the `cd ~/speedtest; … npm run build; …` block) and does **not** call `deploy()`.

**The planned W1 re-pointing edit** (per `C/waves/W1.md §1`, `D.md §3` W1 row, `W0.md §1.3`): replace the single body line inside the fourier arm with an `exec` to the repo-local hook. Diff shape:

```diff
     mkbabb/fourier-analysis)
-        deploy "/var/www/fourier-analysis" "8100" "/api/health" 2>&1 | tee -a "$LOGFILE"
+        exec /var/www/fourier-analysis/scripts/deploy-hook.sh "$REPO" "$REF" 2>&1 | tee -a "$LOGFILE"
         ;;
```

**Byte-scope demonstration**:
- The diff touches **one line inside one `case` arm**. The opening `mkbabb/fourier-analysis)` pattern and the closing `;;` are unchanged.
- The shared `deploy()` function body (`local dir="$1" port="$2" health="$3"; cd "$dir"; …`) is **byte-identical** before/after — the edit does not enter the function body.
- The four sibling `case` arms (`mkbabb/words)`, `mkbabb/speedtest)`, `mkbabb/value.js)`, `mkbabb/csp-solver)`) are **byte-identical** before/after.
- The `*)` default arm is untouched.
- The shebang, `set -euo pipefail`, `REPO/LOGDIR/TIMESTAMP/LOGFILE` setup, the `echo "=== Deploy started …"`, and the trailing `echo "=== Deploy finished …"` are all untouched.

**A subtlety surfaced by the probe**: the live dispatcher's `deploy()` body **does not** carry the C.W1 four improvements (`flock`, dirty-tree guard, rebuild-on-rollback, the no-fallback build/up). The C-era discharge was: **fourier-D wires its arm to the repo-local `scripts/deploy-hook.sh`** (which carries the four improvements as fourier-scoped behaviour); the shared `deploy()` rewrite is a constellation-flagged residual (touches sibling arms; requires coordination across `mkbabb/words`, `mkbabb/value.js`, `mkbabb/csp-solver`). The probe **confirms** this disposition holds — the planned arm-only re-pointing does NOT improve the shared `deploy()`; sibling deploys continue to use the unchanged shared function, exactly as today.

**Note on the `exec` choice**: `exec` (vs plain invocation) replaces the dispatcher process with the hook; the parent `tee` pipe survives because `exec` replaces the child of the pipe, not the pipeline shell. If a non-exec invocation (`/var/www/fourier-analysis/scripts/deploy-hook.sh "$REPO" "$REF" 2>&1 | tee -a "$LOGFILE"`) is preferred for log-tee continuity, the byte-scope guarantee is identical — still a one-line replacement inside the fourier arm. The choice between `exec` and direct call is a hook-author detail bound at W1, not a P1 concern.

**Verdict (Check 1)**: **PASS**. The re-pointing edit is byte-scoped to the fourier arm. No shared helper, no sibling arm, no global setup line is touched.

---

### Check 2 — Hook-perm hardening (`0664 → 0600`) does not affect sibling-arm invocation

**Live perm posture** (`ssh -p 1022 mbabb@... "ls -la /opt/deploy/hooks.json /opt/deploy/.env"`):

```
-rw-rw-r-- 1 mbabb mbabb  80 Mar 28 06:07 /opt/deploy/.env
-rw-rw-r-- 1 mbabb mbabb 849 Mar 28 06:07 /opt/deploy/hooks.json
```

Both files are `0664` (`-rw-rw-r--`, world-readable). W1 plans `chmod 0600` on both (per `W0.md §1.4`, `D.md §3` W1 row).

**Independence claim**: the per-arm dispatch rules live INSIDE `hooks.json` (the `case "$REPO" in …` is a downstream artefact in `dispatch.sh`; what `hooks.json` carries is the single trigger-rule that matches HMAC + ref). Tightening the file perms restricts **who on the host can read or forge the secret value**; it does not change the trigger-rule semantics or which dispatcher arms fire on which payload.

**Live `hooks.json`** (read below — Check 3 evidence) carries one `id: "deploy"` with a single trigger-rule (HMAC + ref-match). The four sibling arms in `dispatch.sh` resolve from `repository.full_name` AFTER the webhook accepts the request — wholly independent of the file permissions on `hooks.json`.

**Verdict (Check 2)**: **PASS** (trivial; recorded for completeness per `Wchi.md §3.1` list item 2). The perm change is a security tightening with zero functional impact on the four sibling-repo arms' invocation.

---

### Check 3 — HMAC secret rotation: per-rule shape vs single-secret lockstep

**Live `hooks.json`** (`ssh -p 1022 mbabb@... "cat /opt/deploy/hooks.json"`):

```json
[
  {
    "id": "deploy",
    "execute-command": "/opt/deploy/scripts/dispatch.sh",
    "command-working-directory": "/opt/deploy",
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "repository.full_name"
      }
    ],
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "89eadc1d4fdfb6f21b84dac09a59728341e7b79703014581cd30fe3bbaa5c070",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/master",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

**The structural reality**:
- `hooks.json` is a **JSON array** of webhook entries. Each array element carries its own `id`, its own `execute-command`, its own `trigger-rule` (and therefore its own HMAC secret string in its own `match.secret` field).
- The `adnanh/webhook` tool's design **does** support per-rule secrets: structurally, one COULD author two entries — `id: "deploy-fourier"` (with its own secret + a `match` against `repository.full_name = mkbabb/fourier-analysis`) and `id: "deploy-others"` (with the shared old secret + a `match` against the four siblings) — and route GitHub webhooks to distinct URL paths (`https://hooks…/hooks/deploy-fourier` vs `…/hooks/deploy-others`).
- **As currently configured**, however, there is **exactly one** entry (`id: "deploy"`) with **exactly one** HMAC secret string. All five repos' GitHub webhooks POST to the same URL path with the same secret. Per-rule secrets are a **possible-but-not-current** shape.

**The single-secret-rotation constraint** (current shape): rotating the HMAC secret means updating `secret` in this one `match` AND updating **every sibling repo's GitHub webhook config** (`https://github.com/mkbabb/words/settings/hooks`, `…/speedtest/settings/hooks`, `…/value.js/settings/hooks`, `…/csp-solver/settings/hooks`) to the new secret **in lockstep**. If the GitHub-side update lags the host-side `hooks.json` update, every sibling deploy `401`s from the moment of rotation until its webhook config is updated.

**The per-rule-rotation alternative** (the cleanest): split the single `id: "deploy"` entry into **two** entries — `id: "deploy-fourier"` (with a freshly-rotated secret, matched against `repository.full_name = mkbabb/fourier-analysis`) and `id: "deploy-legacy"` (retaining the old shared secret, matched against the four siblings). Then **only the fourier GitHub webhook config** is updated to the new secret + the new URL path; the four siblings continue routing to the old URL path with the old secret. **Sibling-lockout risk: zero.** The split is a hooks.json edit + a GitHub-side webhook URL change for fourier; the siblings see no change.

**The W1 plan must name the chosen rotation shape**:
- **Shape A (per-rule split)**: hooks.json split into per-repo `id` entries, each with its own secret; fourier rotates unilaterally; constellation residual is **eventual** (per-app rotation when each owner is ready).
- **Shape B (single-secret lockstep)**: hooks.json rotates the one secret; **must** be paired with simultaneous updates to all five GitHub webhook configs (fourier-analysis, words, speedtest, value.js, csp-solver); coordination required across cross-repo owners; window of `401`s if lockstep fails.

Shape A is the recommended (cleaner blast-radius, KISS). Shape B is the smaller-edit-but-coupled fallback if the per-rule split is judged out-of-scope for W1. **Either way**, the choice is a binding W1 condition.

**Verdict (Check 3)**: **PASS-WITH-CONDITIONS** — `hooks.json` structurally supports per-rule secrets (it is a JSON array of independent entries with independent `trigger-rule.match.secret` fields), but the **live configuration uses one shared secret across all five repos**. W1 must explicitly choose Shape A (per-rule split, fourier-scoped rotation) or Shape B (lockstep update of every sibling repo's GitHub webhook config).

---

### Check 4 — Apache vhost edit (`api.fourier.babb.dev` addition) does not touch existing vhosts

**Live `babb-dev.conf`** (`ssh -p 1022 mbabb@... "cat /etc/apache2/sites-enabled/babb-dev.conf"`): three `<VirtualHost *:443>` stanzas — `sudoku.babb.dev` → `:8120`, `fourier.babb.dev` → `:8100`, `words.babb.dev` → `:8110` — sharing the LE cert at `/etc/letsencrypt/live/sudoku.babb.dev/{fullchain,privkey}.pem`. Plus one `<VirtualHost *:80>` that redirects HTTP → HTTPS (also serves certbot challenges) with `ServerAlias fourier.babb.dev words.babb.dev`.

**Live `default-ssl.conf`** (`ssh -p 1022 mbabb@... "sudo cat /etc/apache2/sites-enabled/default-ssl.conf"`): the legacy `mbabb.fi.ncsu.edu` ingress carrying `/colors/` → `:8130`, `/fourier/api/` → `:8100/api/`, `/fourier/` → `:8100/fourier/`, a `/words` 301 redirect to `mbabb.friday.institute` (sharpens R3's Δ-R3.2 — **not** a path-proxy), and a `/csp-solver` 301 redirect to `sudoku.babb.dev`.

**The planned addition** (per `coordination/CONSTELLATION-DEPLOY.md §8.1`, §8.2 row 1):

```apache
<VirtualHost *:443>
    ServerName api.fourier.babb.dev
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/sudoku.babb.dev/privkey.pem
    ProxyPreserveHost on
    ProxyPass / http://localhost:8100/
    ProxyPassReverse / http://localhost:8100/
    RequestHeader set X-Forwarded-Proto https
</VirtualHost>
```

**Byte-scope demonstration**:
- The addition is a **brand-new `<VirtualHost *:443>` stanza** — appended to `babb-dev.conf` (or authored as a new file `babb-dev-api.conf` in `sites-enabled/`). Either landing site is fourier-scoped.
- The existing three `*:443` stanzas (sudoku, fourier, words) are byte-identical before/after — Apache routes the new SNI/ServerName `api.fourier.babb.dev` to the new vhost without affecting the existing three.
- `default-ssl.conf` is untouched (the legacy `/colors/`, `/fourier/api/`, `/fourier/` path-proxies remain; the `/words` and `/csp-solver` redirects remain).
- The `*:80` HTTP→HTTPS redirect vhost should have `api.fourier.babb.dev` added to its `ServerAlias` line so the LE HTTP-01 renewal challenge for the new SAN resolves; this is a **one-token append** (`ServerAlias fourier.babb.dev words.babb.dev api.fourier.babb.dev`), zero risk to existing aliases.
- The LE cert SAN expansion (`certbot --expand --cert-name sudoku.babb.dev --apache -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev`) is W10's work per `CONSTELLATION-DEPLOY.md §8.1`, with the Wα-Δ-R4.1 HTTP-01 Path B (the `dns-cloudflare` plugin is absent; HTTP-01 via `--apache` is the binding path). The cert renewal is in-place; the existing three SANs (`sudoku/fourier/words.babb.dev`) are preserved.

**`apachectl configtest` shape-validation**: the new stanza syntactically mirrors the three existing `*:443` vhosts (same `SSLEngine on`, same `ProxyPass / http://localhost:<port>/`, same `ProxyPassReverse`, same `RequestHeader`). No new directive, no new module load, no `<Location>` block introduced. Syntax-clean against the existing config shape.

**Verdict (Check 4)**: **PASS**. The vhost addition is a pure append; no existing vhost is touched.

---

### Check 5 — Fourier Mongo bind change (`0.0.0.0:27017` → `127.0.0.1:` or no-publish) is fourier-scoped

**Live container port bindings** (`ssh -p 1022 mbabb@... "docker ps --format ... | grep mongo"`):

```
floridify-mongodb             0.0.0.0:27018->27017/tcp, [::]:27018->27017/tcp
palette-api-mongo-1           0.0.0.0:27020->27017/tcp, [::]:27020->27017/tcp
fourier-analysis-mongo-1      0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
```

**Live compose port lines** (`ssh -p 1022 mbabb@... "grep -nE 'ports:|27017|27018|27020' /home/mbabb/floridify/docker-compose.prod.yml /home/mbabb/Programming/palette-api/compose.yaml /var/www/fourier-analysis/docker-compose.prod.yml"`):

```
/home/mbabb/floridify/docker-compose.prod.yml:78:    ports:
/home/mbabb/floridify/docker-compose.prod.yml:79:      - "27018:27017"
/home/mbabb/Programming/palette-api/compose.yaml:50:    ports:
/home/mbabb/Programming/palette-api/compose.yaml:51:      - "27020:27017"
/var/www/fourier-analysis/docker-compose.prod.yml:39:    ports:
/var/www/fourier-analysis/docker-compose.prod.yml:40:      - "27017:27017"
```

**Three Mongos, three compose files, three host repos, three bind lines** — each is a separate file edit on a separate host repo:
- `/var/www/fourier-analysis/docker-compose.prod.yml:40` — fourier's bind, **owned by fourier-D directly**. The W1 edit (`"27017:27017"` → `"127.0.0.1:27017:27017"` OR the entire `ports:` block deleted, since the backend reaches `mongo:27017` over the compose network and does not need a host bind) lands as part of fourier's commit.
- `/home/mbabb/floridify/docker-compose.prod.yml:79` — floridify's bind, **lives in a different host repo**, owned by the floridify sibling. Fourier-D's commit on `/var/www/fourier-analysis` does **not** reach this file. Closing this bind requires a coordinated host-ops touch on the floridify repo (its own deploy chain) — a constellation-flagged residual.
- `/home/mbabb/Programming/palette-api/compose.yaml:51` — palette-api's bind, **lives in a rsync target** (per R3, no host-side `.git`). The file is overwritten on each rsync from the `value.js` repo's `api/` subtree (via the `mkbabb/value.js` dispatcher arm). Closing this bind requires editing **the upstream `value.js` repo's `api/compose.yaml`** so the next rsync lands the closed bind — a coordinated cross-repo residual.

**The probe confirms** (per `Wchi.md §3.1` list item 5): fourier-D owns only the `27017` bind directly; the sibling binds (`floridify:27018`, `palette-api:27020`) are constellation-flagged residuals requiring coordinated host-ops on the sibling-app stacks. The W1 row's "FIRST: bind all three Mongos off `0.0.0.0`" framing (per `D.md §3` W1 + `W0.md §1.2`) requires acknowledging that the **non-fourier two** are not fourier-D commits — they are coordinated mutations on sibling-app files, the same way C.W1 named the dispatcher-rewrite as a constellation residual.

**Verdict (Check 5)**: **PASS-WITH-CONDITIONS** — fourier's `27017` bind change is fourier-scoped (one line in one fourier file); the floridify `27018` and palette-api `27020` bind changes are coordinated host-ops residuals on sibling-app stacks, not fourier-D commits. W1 must record these as **named constellation-flagged residuals** with explicit owners (floridify-sibling for `27018`; value.js-side for `27020`'s upstream `value.js/api/compose.yaml`).

---

### Check 6 — UFW withdrawal (`27017/tcp ALLOW IN Anywhere`) is fourier-scoped

**Live UFW posture** (`ssh -p 1022 mbabb@... "sudo ufw status verbose | grep -E '270(17|18|19|20)'"`):

```
27017/tcp                  ALLOW IN    Anywhere                   # MongoDB - fourier-analysis
27018/tcp                  ALLOW IN    Anywhere                   # MongoDB - floridify
27019/tcp                  ALLOW IN    Anywhere                   # MongoDB - speedtest
27020/tcp                  ALLOW IN    Anywhere                   # MongoDB - palette-api
27017/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - fourier-analysis
27018/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - floridify
27019/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - speedtest
27020/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - palette-api
```

**Eight rules total** (four v4 + four v6), one per port, distinctly tagged by the comment.

**The planned W1 withdrawal**: `sudo ufw delete allow 27017/tcp` (and its v6 counterpart, `sudo ufw delete allow 27017/tcp` again is sufficient — UFW deletes both family rules with the matching protocol/port). This **is fourier-scoped** by port-tag: UFW rules are keyed by `(direction, protocol, port[, source])`; the `# MongoDB - fourier-analysis` comment is descriptive, not functional. Deleting `27017/tcp` does not affect the rules at `27018/tcp`, `27019/tcp`, or `27020/tcp`.

**Sibling rule dispositions**:
- `27018/tcp` (floridify) — withdrawal requires coordinated host-ops on the floridify side; paired with the floridify compose-bind closure (Check 5). Constellation-flagged residual.
- `27019/tcp` (speedtest, **stale rule** — no listener; per `W0.md §1.2`, the speedtest container does not publish `:27019`) — withdrawal is pure cleanup, harmless, no co-tenant impact. The probe records this as a **safe-to-include opportunity** in the W1 host-ops session (the no-listener stale rule has nothing to break), but it is **not fourier-scoped** in ownership; it is host-ops housekeeping that can ride alongside the fourier withdrawal in the same `ufw delete` session.
- `27020/tcp` (palette-api) — withdrawal requires coordinated host-ops on the palette-api side; paired with the palette-api/value.js compose-bind closure (Check 5). Constellation-flagged residual.

**The probe confirms** (per `Wchi.md §3.1` list item 6): the `sudo ufw delete allow 27017/tcp` is fourier-scoped; the sibling rules require their own withdrawal steps (constellation-flagged), with the `27019` stale rule as a safe-ride-along opportunity.

**Verdict (Check 6)**: **PASS-WITH-CONDITIONS** — the fourier UFW withdrawal is fourier-scoped (`27017/tcp` only); the sibling withdrawals (`27018`, `27020`) are coordinated host-ops residuals; the stale `27019` is safe-ride-along housekeeping (no listener, no risk).

---

### Check 7 — Verified-TLS cutover: sibling Mongo CAs are independent self-signed

**Live CA inventory** (`ssh -p 1022 mbabb@... "openssl x509 -in /var/www/fourier-analysis/ssl/mongo-ca.pem -noout -subject -fingerprint; echo ---; openssl x509 -in /home/mbabb/floridify/ssl/mongo-ca.pem -noout -subject -fingerprint; echo ---; openssl x509 -in /home/mbabb/Programming/palette-api/ssl/mongo-ca.pem -noout -subject -fingerprint"`):

```
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
SHA1 Fingerprint=8C:97:19:88:8A:B8:66:9D:47:4B:A4:58:BB:60:A8:A7:FB:27:0C:E5
---
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
SHA1 Fingerprint=E0:75:18:9E:48:7B:66:4D:E1:D4:95:53:6D:17:B0:48:CF:6F:6A:F0
---
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
SHA1 Fingerprint=F7:01:E3:3E:24:0B:75:BF:CD:A6:08:52:55:71:7F:A6:5F:7A:71:BC
```

**The three CAs share the subject string `CN = mbabb.fridayinstitute.net, O = mbabb, C = US`** — a naming collision likely from a shared `gen-mongo-certs.sh`-style generator across the three repos at different times. **But the SHA1 fingerprints are all distinct**:
- Fourier: `8C:97:19:88:8A:B8:66:9D:47:4B:A4:58:BB:60:A8:A7:FB:27:0C:E5`
- Floridify: `E0:75:18:9E:48:7B:66:4D:E1:D4:95:53:6D:17:B0:48:CF:6F:6A:F0`
- Palette-api: `F7:01:E3:3E:24:0B:75:BF:CD:A6:08:52:55:71:7F:A6:5F:7A:71:BC`

This **confirms** they are **three independent self-signed CAs** (different keypairs, different generation timestamps), each trusted only by its own app's Mongo client (via `tlsCAFile` in the per-app `MONGO_URI` or `--tlsCAFile` on the per-app `mongod` invocation). The shared subject is cosmetic.

**The fourier CA swap** (W2 work — `mbabb.fridayinstitute.net` → `fourier-internal-ca, O=fourier-analysis, OU=infra` per `gen-mongo-certs.sh` target, `W0.md §1` row 4): edits **only** `/var/www/fourier-analysis/ssl/mongo-ca.pem` (and `mongo.pem`, regenerated by the script) + the fourier `MONGO_URI` (drops `tlsAllowInvalidCertificates=true`, adds `tlsCAFile=/etc/ssl/mongo-ca.pem`). The floridify CA at `/home/mbabb/floridify/ssl/mongo-ca.pem` and the palette CA at `/home/mbabb/Programming/palette-api/ssl/mongo-ca.pem` are **independent files in independent app repos**; fourier's commit does not reach them.

**Sibling TLS-verification cutovers** (the C.W2 `tls.md §9` 3-site diff applied to floridify and palette-api): coordinated host-ops on sibling-app stacks; constellation-flagged residuals. Each sibling app's `MONGO_URI` carries its own `tlsAllowInvalidCertificates=true` today (per `W0.md §1.2` security exposure description); closing those requires editing the sibling compose files + regenerating each sibling's CA + re-pointing the per-app Mongo client to the per-app CA.

**Verdict (Check 7)**: **PASS** — the three CAs are independent self-signed (subject collision is cosmetic; fingerprints differ). Fourier's CA swap is fourier-scoped. Sibling verified-TLS cutovers are constellation-flagged residuals (carried to W10 + named owners), not blocking the fourier W2.

---

### Check 8 — `image_blobs` volume creation does not collide with any sibling volume name

**Live volume inventory** (`ssh -p 1022 mbabb@... "docker volume ls"`):

```
DRIVER    VOLUME NAME
local     0d0cc6ac8d4df8e7d912824890589d20125f900f95f6f681f419c3a2396147db
local     002f13ce1d94e6a965adc068c3b81870d30c2b9ec8a18966550b2e861693e373
local     32fda59ac84652056b23a76c11b92208bdd4b21a100348e6640082090e0b6f39
local     80a0012e79ccd54f70511c0ce2226f662e2e020bbbdbed566dcfe92728c4a1d1
local     94bb404a3483ceaa05b5f82a6c1f770baa14d16126eb3ee48079d997d2c0443b
local     99b648f3f007f5036cbdc732d661359c4dc9385518dd8dc5b009cdc2bc3865af
local     246647e2833093baa65e3c235c60a14bb8fee53926d506ec549969b7866f1be7
local     35651126b2f0aea905c9ee565654a5588460da2bb7a2531504becf825b94611b
local     b0d7a1af9c77429442002adeadc241627ee0e31b41d0a3e53a2e80a39c6eed85
local     da1fc54c89328fd7a91378eb8b81a8cdc4033fdf1436191f50aafefa49b2a0be
local     dea838365318213b470f7ec196fb305e009cfe606b608e2177cf0a608651d6ef
local     ffcc6d90042d5be8d6ce20d64446d5dcc4c944f9457e792b4394b2665e63571c
local     floridify_mongo_config
local     floridify_mongo_data
local     floridify_nginx_secrets
local     fourier-analysis_mongo_data
local     palette-api_mongo-backups
local     palette-api_mongo-data
local     server_mongo-data
```

**No volume named `image_blobs`** exists on the host. The named sibling volumes are **project-prefixed** (`floridify_*`, `fourier-analysis_*`, `palette-api_*`) per docker-compose's default naming; the `server_mongo-data` is a one-off; the dozen hex-id anonymous volumes are container-scratch (typical Docker debris).

**The planned `docker volume create image_blobs`** (per `W0.md §1` row 5 + C.W1 + `DA4 §6 Phase 3 step 8`) creates a **top-level** (not project-prefixed) volume named `image_blobs` — fourier's `docker-compose.prod.yml:101-103` declares `image_blobs:` with `external: true`, so the volume is shared by name across compose runs but **never auto-created** by `up -d`. The probe **confirms** zero collision: no sibling app uses an unprefixed `image_blobs` (or any name containing `image_blobs` or `blob`). The fourier-only create is safe.

**Verdict (Check 8)**: **PASS**. `image_blobs` is fourier-only, no sibling collision.

---

## §2 — Cross-cut: the planned W1 mutations vs the co-tenant blast radius

The eight checks together enumerate every host artefact W1 will touch. Restated as a blast-radius table:

| W1 mutation | File / artefact | Fourier-scoped? | Sibling residual? |
|---|---|---|---|
| Dispatcher fourier-arm re-pointing (Check 1) | `/opt/deploy/scripts/dispatch.sh` (one line in the `mkbabb/fourier-analysis)` arm) | **YES** — byte-scoped; shared `deploy()` body + four sibling arms byte-identical | The shared `deploy()` rewrite (the four C.W1 improvements) is a constellation-flagged residual (cross-repo coordination) |
| Hook-perm `0664 → 0600` (Check 2) | `/opt/deploy/hooks.json`, `/opt/deploy/.env` | **YES** functionally — perm change does not affect arm semantics | none |
| HMAC secret rotation (Check 3) | `/opt/deploy/hooks.json` `match.secret` field | **CONDITIONAL** — fourier-scoped iff Shape A (per-rule split) is chosen; lockstep across all five GitHub webhook configs iff Shape B | Shape B is a constellation residual (all five repos' GitHub webhook UIs updated in lockstep, otherwise `401`s) |
| Apache vhost `api.fourier.babb.dev` (Check 4) | `/etc/apache2/sites-enabled/babb-dev.conf` (append) + the `*:80` ServerAlias one-token append | **YES** — new vhost; existing three `*:443` stanzas + `default-ssl.conf` untouched | none |
| Fourier Mongo bind `0.0.0.0 → 127.0.0.1` (Check 5) | `/var/www/fourier-analysis/docker-compose.prod.yml:40` | **YES** — fourier-D's commit | Floridify (`:78-79`) + palette-api (`:50-51`) bind closures are constellation residuals (sibling-app file edits) |
| Fourier UFW rule withdrawal (Check 6) | `sudo ufw delete allow 27017/tcp` | **YES** — port-tagged | Sibling withdrawals (`27018`, `27020`) are constellation residuals; `27019` is safe-ride-along housekeeping |
| Fourier TLS cert/CA swap (Check 7) | `/var/www/fourier-analysis/ssl/{mongo,mongo-ca}.pem` + `MONGO_URI` in `docker-compose.prod.yml` | **YES** — fourier-D's commit | Sibling verified-TLS cutovers are constellation residuals |
| `docker volume create image_blobs` (Check 8) | host docker volume namespace (top-level) | **YES** — zero collision with sibling project-prefixed volumes | none |

**Net**: every mutation is either fourier-scoped or explicitly constellation-flagged. No mutation silently leaks into a sibling-app file. The W1 plan, as scoped against each check, demonstrably touches only fourier-scoped artefacts unless the residual is named with its coordinated owner.

**Single conditional point**: the HMAC rotation (Check 3) requires W1 to pick **Shape A** (per-rule split — cleaner, fourier-scoped) or **Shape B** (single-secret lockstep — coordinated across all five repos). Without that choice named, the rotation is ambiguous and the sibling-lockout risk is real.

---

## §3 — Honesty discipline

This probe used **read-only SSH commands only** — `cat`, `ls`, `grep`, `docker ps` (read-only `--format` projection), `docker volume ls`, `sudo ufw status verbose` (passwordless sudo on the host per W0 §1.2 baseline; read-only `status` invocation), `openssl x509 -noout` (read-only inspection). **Zero mutation**: no `chmod`, no `docker volume create`, no `ufw delete`, no Apache reload, no `git reset`, no `certbot --expand`. The host's state at probe-time is byte-identical to the pre-probe state. Wχ-G6 + Wχ-G7 hold (no source change, no host mutation).

No co-tenant blast-radius finding surfaced without a remediation: every cross-app touch the W1 plan implies is either (a) named as a constellation-flagged residual with its coordinated owner, or (b) ride-along housekeeping with zero co-tenant impact (the `27019` stale UFW rule). The HMAC rotation shape (Check 3) is the one design-decision that must be bound at W1, not left ambiguous.

---

## Verdict

**PASS-WITH-CONDITIONS**: the W1 plan, as scoped against the eight checks, does not break floridify or palette-api. Every fourier-scoped mutation is byte-scoped to a fourier artefact; every sibling-app residual is explicitly named with a coordinated owner. The conditional point is the HMAC rotation shape — W1 must explicitly bind Shape A (per-rule split, fourier-only rotation) or Shape B (single-secret lockstep across all five GitHub webhook configs).

## Conditions to bind (extracted)

- **P1.C1** (dispatch-arm-scoped) → **W1.G_dispatch-arm-scoped**: the dispatcher fourier-arm re-pointing is byte-scoped (the diff touches only the `case mkbabb/fourier-analysis)` block; the shared `deploy()` body + the four sibling arms are byte-identical before/after). Proven by `diff` against the pre-edit `/opt/deploy/scripts/dispatch.sh` at W1 close.
- **P1.C2** (HMAC rotation shape: per-rule OR coordinated sibling update) → **W1.G_hmac-rotation-shape**: W1 explicitly binds Shape A (`hooks.json` split into per-`id` entries with per-rule secrets; only fourier's GitHub webhook URL+secret updated) OR Shape B (single-secret rotation paired with simultaneous updates to all five GitHub webhook configs — fourier-analysis, words, speedtest, value.js, csp-solver). Shape A is the recommended (cleanest blast-radius, KISS); Shape B requires the lockstep coordination noted as a constellation residual.
- **P1.C3** (Mongo bind fourier-scoped; sibling residuals named) → **W1.G_mongo-bind-fourier-scoped** + **W1.G_sibling-mongo-residual**: fourier owns `/var/www/fourier-analysis/docker-compose.prod.yml:40` (the `27017` bind change) directly. The floridify `27018` (`/home/mbabb/floridify/docker-compose.prod.yml:79`) and palette-api `27020` (upstream `value.js/api/compose.yaml`; rsyncs to `/home/mbabb/Programming/palette-api/compose.yaml:51`) are constellation-flagged residuals with named owners (floridify-sibling; value.js-side).
- **P1.C4** (UFW withdrawal fourier-scoped; sibling rules as residuals) → **W1.G_ufw-withdrawal-fourier-scoped**: `sudo ufw delete allow 27017/tcp` (and v6 counterpart) is fourier-scoped. Sibling withdrawals (`27018/tcp`, `27020/tcp`) are constellation-flagged residuals. The stale `27019/tcp` (speedtest, no listener) is safe-ride-along housekeeping — can be deleted in the same W1 host-ops session with zero co-tenant impact.

## File created

`/Users/mkbabb/Programming/fourier-analysis/docs/tranches/D/audit/challenge-P1.md`
