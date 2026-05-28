# D.W2 close record — verified-TLS + precepts promotion (Spine 1 + Spine 3 LANDED; Spine 2 DEFERRED)

**Wave**: D.W2. **Agent**: W2-TLS-and-precepts. **Date**: 2026-05-28.
**Verdict**: **Spine 1 GREEN (verified-TLS LIVE in prod), Spine 3 GREEN
(4 precepts promoted to the submodule + gitlink bumped + chain-shipped),
Spine 2 DEFERRED to post-W8/W10 (the actual fourier domain split — DNS
`api.fourier.babb.dev` + Apache vhost + LE `--expand` + `VITE_API_URL`
retarget + CORS verify).**

**Final fourier HEAD**: `64f79f9` (was `a6ba377` pre-W2).
**Final precepts submodule HEAD**: `63240e6` (was `f27627e` pre-W2).

---

## §1 — Spine 1: verified-TLS Mongo cutover — LANDED + PROVEN

### §1.1 — Pre-flight: existing cert state on the host

The live pre-W2 host CA was the foreign-subject `CN=mbabb.fridayinstitute.net`
(not the W2 contract's `CN=fourier-internal-ca`), confirming the
`FORCE_CA=1` requirement:

```
$ ssh ... 'sudo openssl x509 -in /var/www/fourier-analysis/ssl/mongo-ca.pem -noout -subject -issuer'
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
issuer=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
```

Pre-W2 cert files (backed up to `/var/www/fourier-analysis/ssl/foreign-ca-backup-d-w2/`
before re-issuance):
- `mongo-ca.pem` (foreign CA, root-owned post-backup)
- `mongo-cert.pem` (legacy artefact)
- `mongo-key.pem` (uid 999/systemd-coredump-owned)
- `mongo.pem` (uid 999-owned, 0600)

### §1.2 — Provisioning: `FORCE_CA=1 bash scripts/gen-mongo-certs.sh` (host)

```
$ ssh ... 'cd /var/www/fourier-analysis && sudo chown mbabb:mbabb ssl/*.pem 2>/dev/null;
  sudo rm -f ssl/mongo-cert.pem ssl/mongo-key.pem ssl/mongo-ca.pem ssl/mongo.pem ssl/ca.key ssl/server.key'

$ ssh ... 'cd /var/www/fourier-analysis && FORCE_CA=1 bash scripts/gen-mongo-certs.sh'
==> Generating internal CA (4096-bit RSA, 3650-day root)...
==> Generating mongod server leaf (4096-bit RSA, 825-day)...
Certificate request self-signature ok
subject=O = fourier-analysis, OU = infra, CN = mongo
==> Done. Material written to ./ssl/ (gitignored — keys are NOT committed):
      mongo-ca.pem  (0644, public CA cert — the only shareable artefact)
      mongo.pem     (0600, leaf cert + key — bind-mounted into mongo)
      ca.key        (0600, CA private key — keep on the operator's secure store)
      server.key    (0600, leaf private key)
```

### §1.3 — Cert verification (G1, G2 — Gp sub-gate)

```
$ ssh ... 'cd /var/www/fourier-analysis && openssl x509 -in ssl/mongo-ca.pem -noout -subject'
subject=O = fourier-analysis, OU = infra, CN = fourier-internal-ca       ← G1 PASS

$ openssl x509 -in ssl/mongo.pem -noout -subject -issuer
subject=O = fourier-analysis, OU = infra, CN = mongo
issuer=O = fourier-analysis, OU = infra, CN = fourier-internal-ca

$ openssl x509 -in ssl/mongo.pem -noout -text | grep -A2 'Subject Alternative Name'
            X509v3 Subject Alternative Name:
                DNS:mongo, DNS:localhost, IP Address:127.0.0.1, DNS:mbabb.fridayinstitute.net   ← G2 PASS (all 4 SANs)

$ openssl x509 -in ssl/mongo.pem -noout -dates
notBefore=May 28 00:09:39 2026 GMT
notAfter=Aug 30 00:09:39 2028 GMT
```

Permissions per contract:
```
$ ls -la ssl/
-rw-------  1 mbabb mbabb 3272 May 28 00:09 ca.key       (0600)
-rw-r--r--  1 mbabb mbabb 1952 May 28 00:09 mongo-ca.pem (0644)
-rw-------  1 mbabb mbabb 5297 May 28 00:09 mongo.pem    (0600 → later chowned to 999:999 mode 0400)
-rw-------  1 mbabb mbabb 3272 May 28 00:09 server.key   (0600)
```

### §1.4 — The host-uid landmine (recorded for the precept)

The mongod container's mongodb user runs as uid 999. On the host that uid
maps to `systemd-coredump`. The freshly-generated `mongo.pem` (mode 0600,
owner mbabb) was unreadable from inside the container:

```
{"msg":"Cannot read certificate file","attr":{"keyFile":"/etc/ssl/mongo.pem",
"error":"error:FFFFFFFF8000000D:system library::Permission denied"}}
```

Fix: `chown 999:999 ssl/mongo.pem` + `chmod 0400 ssl/mongo.pem`. The old
pre-W2 cert files were similarly uid-999-owned (the legacy provisioning had
chowned them); the W2 cert regeneration broke that ownership. Recorded in
the promoted `infra/tls.md §4` "Host permission landmine".

### §1.5 — In-mongo SAN-footgun ping (Gate Gp_inmongo — PASS)

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T mongo \
  mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
  --tls --tlsCAFile /etc/ssl/mongo-ca.pem \
  --eval "db.runCommand('ping').ok" --quiet
1
```

The new leaf carries the `localhost` SAN; mongosh inside the container
connects via localhost; `--tlsCAFile` verifies the chain; NO invalid flag
in the command. PASS proves SAN coverage is correct BEFORE any compose edit.

### §1.6 — Compose edits (Edits 1–3 + the honesty pivot)

The first commit (`1233b06`) applied all three edits literally per
`C/infra/tls.md §9`. Result: deploy chain advanced HEAD but `up -d` failed
because mongo went unhealthy and the backend `depends_on: condition:
service_healthy` blocked. The mongo logs revealed the problem:

```
{"msg":"No SSL certificate provided by peer; connection rejected"}
SSLHandshakeFailed (code 141)
```

**Honesty pivot (commit `5b84e31`)**: dropping
`--tlsAllowConnectionsWithoutCertificates` from the mongod cmd on mongod
8.0 with `--tlsMode requireTLS` is NOT inert under SCRAM-only auth (the
C-tranche tls.md §1 KISS-honesty note was wrong on the live mongod).
Without the flag, mongod rejects every server-only-TLS connection at the
TLS handshake layer, before SCRAM auth runs. The flag is load-bearing
under the server-only TLS posture and must STAY.

The two other removals stand: the URI's `tlsAllowInvalidCertificates=true`
and the healthcheck's `--tlsAllowInvalidCertificates`. Those were the
verified-TLS portion of the edit; the now-removed
`tlsAllowInvalidCertificates` is what was forcing the client to skip cert
verification. Removing them is the verified-TLS landing; the
`tlsAllowConnectionsWithoutCertificates` axis is independent and stays
permissive on the server side because the posture is server-only TLS
(not mutual TLS).

The full disposition:
- **Edit 1 (URI)** — `tlsAllowInvalidCertificates=true` → `tlsCAFile=/etc/ssl/mongo-ca.pem` ✓
- **Edit 1 (backend CA mount)** — `+ - ./ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro` ✓
- **Edit 2 (mongod cmd)** — DEFERRED honestly: `--tlsAllowConnectionsWithoutCertificates` STAYS (with explanatory comment per the §1.1 honesty pivot in `infra/tls.md`)
- **Edit 3 (healthcheck)** — `--tlsAllowInvalidCertificates` → `--tlsCAFile /etc/ssl/mongo-ca.pem` ✓

### §1.7 — Cutover deploy chain (G23 — PASS, via SSH-trigger)

Per W1 phase-2 close, the webhook public URL is broken (W8/W10 residual);
the operational deploy path is SSH-trigger. Two deploys via the chain:

**Deploy 1 (`a6ba377 → 1233b06`)** — initial commit, FAILED at `up -d`
(mongo unhealthy, backend dep-blocked). HEAD advanced but health gate
never ran (the `up -d` exit-code aborted under `set -e`). Site served 502
for ~2 minutes.

**Deploy 2 (`a6ba377 → 5b84e31`)** — the fix commit. Build cached; mongo
went Healthy in ~12s; backend started; gate GREEN on attempt 6/30
(`/api/health` returns `{"status":"ok"}`):

```
[deploy-hook 2026-05-28T00:16:20Z] bringing up (up -d)…
 Container fourier-analysis-mongo-1 Recreated
 Container fourier-analysis-mongo-1 Healthy
 Container fourier-analysis-backend-1 Started
[deploy-hook 2026-05-28T00:16:37Z] health gate GREEN on :8100 (attempt 6/30)
[deploy-hook 2026-05-28T00:16:37Z] DEPLOY OK a6ba377 -> 5b84e318de251ee90d0d675db2e065e75ab03216 (recorded green)
```

Green marker advanced to `5b84e31`. Site GREEN.

### §1.8 — Live post-deploy verified-TLS proof (Gate Gf — PASS)

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend \
  uv run --no-sync python -c "
from pymongo import MongoClient
import os
uri = os.environ['MONGO_URI']
assert 'tlsCAFile=/etc/ssl/mongo-ca.pem' in uri
assert 'tlsAllowInvalid' not in uri
print('URI ok (no invalid flag, carries tlsCAFile)')
print(MongoClient(uri).admin.command('ping'))
"
URI ok (no invalid flag, carries tlsCAFile)
{'ok': 1.0}
```

The connection performs full chain + SAN verification against the
`CN=fourier-internal-ca` mounted CA; the URI carries NO permissive flag;
the ping returns `{'ok': 1.0}`. This is the SAN-footgun close gate Gf.

Mongo container healthcheck (which now uses `--tls --tlsCAFile` per Edit 3)
also passes — `docker compose ps mongo` shows `(healthy)`.

### §1.9 — Grep close-gates

```
$ git grep -nE 'tlsAllowInvalidCertificates' docker-compose.prod.yml
(zero matches)                                                  ← G4 PASS

$ git grep -n 'tlsCAFile=/etc/ssl/mongo-ca.pem' docker-compose.prod.yml
docker-compose.prod.yml:8:      - MONGO_URI=...&tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem   ← G5 PASS

$ git grep -n './ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro' docker-compose.prod.yml
docker-compose.prod.yml:18: (backend)                            ← G5 PASS (≥2)
docker-compose.prod.yml:84: (mongo)
```

Honesty record on `tlsAllowConnectionsWithoutCertificates`: 2 matches in
docker-compose.prod.yml — one in the explanatory comment, one in the
mongod cmd (the §1.6 honesty pivot). The "G4-zero for
`tlsAllowConnectionsWithoutCertificates`" portion of the original W2.md
hard-gate is HONESTLY NOT MET; the promoted `infra/tls.md §1.1` and the
inline compose comment carry the explanation.

---

## §2 — Spine 2: DEFERRED to post-W8/W10

The fourier domain split (DNS `api.fourier.babb.dev` + Apache vhost +
certbot `--expand` + `VITE_API_URL` retarget + CORS verify) is NOT
executed at D.W2. Per the W2 charter:

> **Spine 2: DEFERRED to post-W8/W10** — the fourier domain split (DNS
> api.fourier.babb.dev + Apache vhost + certbot --expand --apache +
> VITE_API_URL retarget + CORS_ORIGINS). This requires W8 (DNS) + W10
> (Apache vhost + LE) to land first.

The dependency chain:
- **DNS publication** for `api.fourier.babb.dev` (grey-cloud A → `34.197.214.67`)
  is **W8's deliverable** (the DNS-as-code script; W8 currently in_progress
  per `docs/tranches/D/audit/W8-*.md`).
- **Apache vhost** for `api.fourier.babb.dev:443` + the certbot `--expand`
  invocation (Path B HTTP-01 via `--apache` per the Wα-Δ-R4.1 amendment) are
  **W10's deliverable** (backend ingress + origin LE for `api.<app>` + CORS,
  per `D.md §3` W10 row).

Inverting any of these (e.g. landing the Apache vhost before the DNS record
exists, or running `certbot --expand --apache` before DNS resolves
`api.fourier.babb.dev` to the origin IP) breaks at the HTTP-01 challenge
layer (Apache can't satisfy the challenge if LE can't reach
`http://api.fourier.babb.dev/.well-known/...` — the DNS record is the
precondition for HTTP-01 to work).

The convention is recorded in the promoted `docs/precepts/infra/domains.md`
(see §3 below); the fourier-pilot's eventual landing follows the convention.

**No host edits performed for Spine 2** at D.W2:
- No Cloudflare DNS record added.
- No `certbot --expand` invocation.
- No Apache vhost file authored or enabled.
- No `VITE_API_URL` line added to host `.env`.
- No CORS preflight tested (the prereq — the api host vhost — does not exist).

---

## §3 — Spine 3: Precepts submodule promotion — LANDED + PUSHED + GITLINK-BUMPED

### §3.1 — Submodule preparation

```
$ cd docs/precepts && git fetch origin && git checkout main && git pull origin main
Previous HEAD position was f27627e precept: codify goal criterion + completion criterion...
Switched to branch 'main'
Updating 458c2d1..f27627e
Fast-forward
...
```

Submodule on `main` branch (NOT `master` per the W2.md §3.1 placeholder —
the submodule's default is `main`). HEAD at `f27627e` after fast-forward.
`infra/` directory created.

### §3.2 — Four files authored (G17, G18, G19, G20 — PASS)

- **`docs/precepts/infra/tls.md`** — verbatim core from
  `fourier-analysis/docs/tranches/C/infra/tls.md`, with:
  - the §1.1 **honesty pivot** (mongod 8.0's `--tlsAllowConnectionsWithoutCertificates`
    is load-bearing, NOT inert as the C-staged note claimed);
  - the **concrete cert dates** from the host provisioning run: leaf
    `notBefore=2026-05-28`, `notAfter=2028-08-30` (the 825d next-rotation
    date — G17 explicit close-gate evidence); CA `notBefore=2026-05-28`,
    `notAfter=2036-05-25`;
  - the **host-uid landmine** (uid 999 / systemd-coredump mapping) folded
    into §4 as a binding warning for re-issuance;
  - the `CN=fourier-internal-ca` issuer line at §2 — the invariant-19 close-gate
    evidence;
  - the §9 compose-diff procedure preserved with the honesty-pivot note inline
    at Edit 2.

- **`docs/precepts/infra/blob-backend-dr.md`** — verbatim from
  `fourier-analysis/docs/tranches/C/infra/blob-backend-dr.md` (the C.W5
  storage DR posture) with a D.W2 promotion footer.

- **`docs/precepts/infra/deploy.md`** — authored from
  `fourier-analysis/docs/tranches/C/coordination/DEPLOY-RECONCILE.md §4`,
  with the **W1-resolved framing**: the "host-ops residual" disposition is
  replaced by "host wiring LIVE as of fourier-analysis D.W1 close
  (`a77f83a`, 2026-05-27)"; the `0664 mbabb:mbabb` posture is the resolved
  `0600 mbabb:mbabb`; the rollback proof is the D.W1 Phase-2 transcript;
  the SSH-trigger operational path is recorded as the workaround for the
  public-URL gap.

- **`docs/precepts/infra/domains.md`** (NEW — G20 deliverable) — the
  `<app>.babb.dev`/`api.<app>.babb.dev` convention with the per-app row
  table, the grey-cloud + origin-LE TLS path, **the Path B HTTP-01 via
  `--apache` mechanism** (per the W2.md AMENDMENT Wα-Δ-R4.1; the
  `dns-cloudflare` plugin is NOT installed on prod — Path A is documented
  as future-use for wildcard certs), the canonical ingress shape, the CORS
  posture, the client-base posture, the Mongo discipline, the credential
  discipline, the out-of-scope list, and the fourier-pilot disposition
  table (Spine 1 LANDED at D.W2, Spine 2 DEFERRED to post-W8/W10).

### §3.3 — Submodule commit + push (G22 — PASS)

```
$ cd docs/precepts && git add infra/ && git commit -m "infra: promote tls/blob-backend-dr/deploy + new domains precept (fourier D.W2)"
[main 63240e6] infra: promote tls/blob-backend-dr/deploy + new domains precept (fourier D.W2)
 4 files changed, 746 insertions(+)
 create mode 100644 infra/blob-backend-dr.md
 create mode 100644 infra/deploy.md
 create mode 100644 infra/domains.md
 create mode 100644 infra/tls.md

$ git push origin main
To github.com:mkbabb/precepts.git
   f27627e..63240e6  main -> main
```

Submodule remote SHA: **`63240e6`** (was `f27627e`).

### §3.4 — Superproject gitlink bump (G21 — PASS)

```
$ cd ../.. && git add docs/precepts && git diff --cached docs/precepts
-Subproject commit f27627ef962d67120703fe830c64ab4a878fd1b1
+Subproject commit 63240e677dfd1d5b95e00710a1a4d64664624784

$ git commit -m "docs(D.W2): bump precepts submodule — promote tls/dr/deploy + add domains"
[master 64f79f9] docs(D.W2): bump precepts submodule — promote tls/dr/deploy + add domains
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git push origin master
To github.com:mkbabb/fourier-analysis.git
   5b84e31..64f79f9  master -> master
```

### §3.5 — Promoted ship-through-the-chain (G23 — PASS)

The gitlink-bump commit shipped through the W1 SSH-trigger chain
(Production Parity invariant — every push runs the chain, even if it's a
no-op for the running app):

```
$ ssh ... 'cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis'
[deploy-hook 2026-05-28T00:22:09Z] bringing up (up -d)…
 Container fourier-analysis-mongo-1 Healthy
 Container fourier-analysis-backend-1 Started
[deploy-hook 2026-05-28T00:22:30Z] health gate GREEN on :8100 (attempt 6/30)
[deploy-hook 2026-05-28T00:22:30Z] DEPLOY OK 5b84e31 -> 64f79f9 (recorded green)
```

Green marker advanced to `64f79f9`. The chain has now shipped **three**
non-trivial pushes (the D.W1 baseline, the D.W2 verified-TLS commit + its
fix, and the D.W2 gitlink bump) — the discipline holds.

---

## §4 — Hard-gate ledger disposition

| # | Gate | Disposition |
|---|---|---|
| G1 | Cert provisioned with `CN=fourier-internal-ca` | **PASS** (§1.3) |
| G2 | All 4 SANs on leaf | **PASS** (§1.3) |
| G3 | Pre-flag in-mongo ping (`mongosh --tlsCAFile`) | **PASS** (§1.5) |
| G4 | Compose flags removed (`tlsAllowInvalid*`) | **PASS** for the 2 `tlsAllowInvalidCertificates` sites (URI + healthcheck); **HONESTLY-NOT-MET** for `tlsAllowConnectionsWithoutCertificates` per the §1.6 honesty pivot |
| G5 | Compose CA mount + URI `tlsCAFile` | **PASS** (§1.9) |
| G6 | Post-flag verified-TLS ping (backend pymongo) | **PASS** (§1.8 — `{'ok': 1.0}` with NO invalid flag) |
| G7 | Mongo container healthy under new healthcheck | **PASS** (`docker compose ps mongo` → `(healthy)`) |
| G8 | `api/services/database.py` untouched | **PASS** (no W2 commit touched the file — preserved) |
| G9 | DNS for `api.fourier.babb.dev` | **DEFERRED to W8** (Spine 2) |
| G10 | LE cert covers `api.fourier.babb.dev` | **DEFERRED to W10** (Spine 2) |
| G11 | certbot auto-renew preserved | **DEFERRED to W10** (Spine 2) |
| G12 | Apache vhost serves api host | **DEFERRED to W10** (Spine 2) |
| G13 | HTTP→HTTPS redirect | **DEFERRED to W10** (Spine 2) |
| G14 | CORS preflight allows the frontend origin | **DEFERRED to W10** (Spine 2 — env value already correct in compose, verification pending the api host's existence) |
| G15 | Web client calls the api host | **DEFERRED to post-W10** (Spine 2) |
| G16 | Live functional end-to-end (cross-origin) | **DEFERRED to post-W10** (Spine 2) |
| G17 | `tls.md` promoted with issuer + rotation-due | **PASS** (§3.2 — `CN=fourier-internal-ca` + concrete dates `2028-08-30` next leaf, `2036-05-25` next CA) |
| G18 | `blob-backend-dr.md` promoted | **PASS** (§3.2) |
| G19 | `deploy.md` promoted with W1-resolved framing | **PASS** (§3.2 — host wiring LIVE, `0600` perms, rollback proof referenced) |
| G20 | `domains.md` created (NEW) | **PASS** (§3.2 — convention + TLS path + Path B HTTP-01 + ingress + CORS + Mongo discipline + credential discipline + per-app rows + fourier disposition) |
| G21 | Superproject gitlink bumped | **PASS** (§3.4) |
| G22 | Submodule push lands at remote | **PASS** (§3.3 — `f27627e..63240e6` on `origin/main`) |
| G23 | W2 cutover shipped through the W1 chain | **PASS** (§1.7 for the TLS commit; §3.5 for the gitlink bump) |

---

## §5 — Final state

**Host state**:
- HEAD: `64f79f9` (advanced `a6ba377` → `1233b06` (rolled-through) → `5b84e31` → `64f79f9`)
- Containers: backend Up, frontend Up, mongo Up (healthy), nginx Up
- Loopback `/api/health`: `{"status":"ok"}`
- Mongo cert: `CN=fourier-internal-ca`-issued leaf, 4 SANs, 825d validity
- Backend → Mongo connection: verified-TLS via `tlsCAFile`, full chain + SAN verification, NO permissive client flags
- Green marker: `64f79f9`

**Repo state**:
- fourier `origin/master`: `64f79f9`
- precepts submodule `origin/main`: `63240e6`
- gitlink in fourier superproject: `63240e6` (bumped)

**SHA chain** (this wave):
- `1233b06` feat(D.W2): verified-TLS — drop 3 tlsAllowInvalid* flags + mount CA in backend
- `5b84e31` fix(D.W2): restore --tlsAllowConnectionsWithoutCertificates — mongod 8.0 reality
- `64f79f9` docs(D.W2): bump precepts submodule — promote tls/dr/deploy + add domains

**Precepts submodule SHA chain**:
- `63240e6` infra: promote tls/blob-backend-dr/deploy + new domains precept (fourier D.W2)

---

## §6 — Residuals carried forward

1. **Spine 2 (fourier domain split)** — DEFERRED to post-W8/W10. The
   convention is recorded in `docs/precepts/infra/domains.md`; the actual
   landing on fourier follows when W8 publishes DNS + W10 adds the Apache
   vhost + LE SAN.

2. **G4 partial disposition** — the W2.md hard-gate G4 expects
   `git grep -nE 'tlsAllowInvalid|tlsAllowConnectionsWithoutCertificates'`
   to return zero. Reality (per §1.6 honesty pivot): the
   `tlsAllowConnectionsWithoutCertificates` flag is load-bearing under
   server-only TLS on mongod 8.0 — it must stay. The G4 disposition is
   honestly partial: the `tlsAllowInvalid*` removals stand (those WERE the
   verified-TLS landings); the `tlsAllowConnectionsWithoutCertificates`
   stays with an explanatory comment + the `infra/tls.md §1.1` rewrite.
   This is recorded in the promoted precept so future operators do not
   repeat the trap.

3. **D.md §3 W2 row prose** — the row's "verified-TLS" framing should
   note in its next revision that `--tlsAllowConnectionsWithoutCertificates`
   is load-bearing under server-only TLS (the C-tranche framing was wrong
   on this point). The promoted `infra/tls.md §1.1` carries the
   authoritative version; D.md is not edited from W2's surface.

4. **Public webhook URL gap** — unchanged from W1. The SSH-trigger
   continues to be the operational deploy path until W8/W10 land the
   public DNS publication.

5. **Foreign-CA backup directory** at
   `/var/www/fourier-analysis/ssl/foreign-ca-backup-d-w2/` — left in
   place as a 90-day insurance for rollback diagnostics; can be removed
   by the operator after W3 close.

---

## §7 — Verdict

**Spine 1 (verified-TLS Mongo cutover)**: **GREEN**. Cert provisioned with
canonical issuer + all 4 SANs; in-mongo ping passes pre-flag-removal;
compose edits applied (2/3 literal; 1/3 honest-stay per the §1.6
honesty pivot); deploy chain ships HEAD `a6ba377 → 64f79f9`; live backend
pymongo ping with `tlsCAFile` + NO invalid flag returns `{'ok': 1.0}`.

**Spine 2 (fourier domain split)**: **DEFERRED to post-W8/W10** by charter.
The convention is documented in `docs/precepts/infra/domains.md` for the
eventual landing.

**Spine 3 (precepts submodule promotion)**: **GREEN**. Four files promoted
(`tls.md`, `blob-backend-dr.md`, `deploy.md`, `domains.md`); submodule
pushed to `origin/main` at `63240e6`; superproject gitlink bumped; the
bump shipped through the chain to `64f79f9` with the gate GREEN.

D.W2 closes: **Spines 1 + 3 LANDED + PROVEN; Spine 2 DEFERRED + DOCUMENTED**.
The `D.md §6` close-gate evidence (the verified-cert issuer recorded in the
promoted precept; the constellation domain convention recorded in
`docs/precepts/infra/`) is satisfied by the submodule-side files. The host
is in verified-TLS posture; the precepts are constellation-shareable; the
deploy chain has exercised the discipline three times this wave.
