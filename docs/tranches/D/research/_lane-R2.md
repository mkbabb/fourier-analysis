# R2 — prod-deploy-safety on the shared host

## Verdict
RATIFIED-AS-IS

## Authority
- `docs/audits/runs/2026-05-27-D-audit/DA4-host-deploy-prod.md` — the live host audit (the pre-A `8818ae5` finding, the dirty-tree + missing-volume + foreign-CA + dispatcher-weakness + co-tenant blast-radius ledger, the 4-phase deploy sequence in DA4 §6).
- `docs/tranches/C/waves/W1.md` — the C-era deploy-hook spec (the four improvements: `flock` + real `:8100` health-gate + rebuild-on-rollback + dirty-tree-fail-loud + `last-known-green` marker).
- `docs/tranches/C/coordination/DEPLOY-RECONCILE.md` — the host-residual coordination doc.
- `docs/tranches/C/infra/blob-backend-dr.md:64` — the `docker volume create image_blobs` precondition.
- `docs/tranches/D/waves/W0.md §1` — the W0 baseline (host SHA, dirty paths, missing volume, foreign-CA subject).

## Live re-probe results

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD && git status --porcelain"
8818ae532125c8d555ab715dbf172c625a10a8ba
 M docker-compose.prod.yml
 M docker-compose.yml
?? ssl/
```

HEAD remains `8818ae5` (the pre-A baseline). Dirty tree carries the two `M` compose files plus the untracked `ssl/` directory — verbatim match with `DA4 §1.1` + `W0.md §1`. **None of A/B/C is deployed; prod still serves pre-A.**

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker volume inspect image_blobs 2>&1 | head -3"
[]
Error response from daemon: get image_blobs: no such volume
```

`image_blobs` Docker volume remains absent on the host — the precondition from `tranches/C/infra/blob-backend-dr.md:64` is still unsatisfied (must be created before first deploy of any backend that mounts it, per the 4-phase deploy sequence `DA4 §6`).

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker exec fourier-analysis-backend-1 env 2>&1 | grep MONGO_URI"
MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true
```

Inline plaintext password + `tlsAllowInvalidCertificates=true` still present in the live container env — both `DA4 §1.2` security findings re-confirm. The 32-char password `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` matches `W0.md §1` verbatim. **This is the security-hotfix surface for W1** (rotate password + flip to `tlsCAFile=/etc/ssl/mongo-ca.pem` + drop `tlsAllowInvalidCertificates`).

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "openssl x509 -in /var/www/fourier-analysis/ssl/mongo-ca.pem -noout -subject 2>&1"
subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US
```

The CA subject is `CN = mbabb.fridayinstitute.net, O = mbabb, C = US` — the foreign-CA finding from `DA4 §3.2` re-confirms (subject is the *host*, not a recognized CA). This is the live CA that `gen-mongo-certs.sh` should reuse at W1 (verified-TLS cutover) — `O = mbabb` + `C = US` are the org/country fields the script must continue to produce so the existing trust chain isn't broken.

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "grep -c flock /opt/deploy/scripts/dispatch.sh ; grep -c porcelain /opt/deploy/scripts/dispatch.sh"
0
0
```

Both still 0 — neither `flock` (concurrent-dispatch guard) nor `porcelain` (dirty-tree-fail-loud check) is present in `/opt/deploy/scripts/dispatch.sh`. The four C.W1 improvements (`flock` + `:8100` health-gate + rebuild-on-rollback + dirty-tree-fail-loud + `last-known-green` marker) **remain absent** — re-confirms `DA4 §2`.

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "ls -la /opt/deploy/hooks.json /opt/deploy/.env"
-rw-rw-r-- 1 mbabb mbabb  80 Mar 28 06:07 /opt/deploy/.env
-rw-rw-r-- 1 mbabb mbabb 849 Mar 28 06:07 /opt/deploy/hooks.json
```

Both files are still `-rw-rw-r-- mbabb:mbabb` (mode `0664`). The `DA4 §1.4` hardening (`chmod 0640 hooks.json .env` to deny world-read of the dispatcher secret/config) remains pending. Mtime `Mar 28 06:07` confirms the files have not been touched since the C-era initial deploy setup.

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "ss -tlnp 2>/dev/null | grep -E ':270(17|18|19|20)'"
LISTEN 0      4096         0.0.0.0:27020      0.0.0.0:*
LISTEN 0      4096         0.0.0.0:27017      0.0.0.0:*
LISTEN 0      4096         0.0.0.0:27018      0.0.0.0:*
LISTEN 0      4096            [::]:27020         [::]:*
LISTEN 0      4096            [::]:27017         [::]:*
LISTEN 0      4096            [::]:27018         [::]:*
```

Three Mongos listening on `0.0.0.0` (all-interfaces, world-routable): `27017` (fourier-analysis), `27018` (floridify), `27020` (palette-api). **Port `27019` (speedtest) is absent from the listen set** — likely speedtest's Mongo container is down or not exposing the port; this is a minor delta vs the audit which listed three, but the audit's "three Mongos on 0.0.0.0" framing matches the live state exactly. The blast-radius finding (`DA4 §1.3`) re-confirms.

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "sudo -n ufw status verbose 2>&1 | grep -E '270(17|18|19|20)'"
27017/tcp                  ALLOW IN    Anywhere                   # MongoDB - fourier-analysis
27018/tcp                  ALLOW IN    Anywhere                   # MongoDB - floridify
27019/tcp                  ALLOW IN    Anywhere                   # MongoDB - speedtest
27020/tcp                  ALLOW IN    Anywhere                   # MongoDB - palette-api
27017/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - fourier-analysis
27018/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - floridify
27019/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - speedtest
27020/tcp (v6)             ALLOW IN    Anywhere (v6)              # MongoDB - palette-api
```

UFW (passwordless sudo permitted) confirms **all four Mongo ports `27017–27020` are firewall-open to `Anywhere`** (both v4 + v6). The fact that `27019` is in UFW but absent from `ss` confirms the firewall posture is open even when the underlying service is down — i.e. when speedtest's Mongo comes back up, it will be world-routable. This is exactly the `DA4 §1.3` "co-tenant blast-radius" surface that W1 must close (lock down to `127.0.0.1` or to docker bridge addrs).
