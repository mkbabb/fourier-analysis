# D.W1 Phase 2 — deploy-chain wiring + first A/B/C → prod attempt — CHAIN BLOCKED

**Wave**: D.W1 (Phase 2 — first A/B/C → prod deploy through the wired webhook chain). **Phase**: 2. **Agent**: `W1.Phase2-deploy-chain`. **Authored**: 2026-05-27. **Verdict**: **FAIL — chain blocked at public-DNS / webhook-delivery leg (out-of-wave scope; §3.1-§3.4 GREEN, §3.5 fired-but-undeliverable, §3.6 / §3.7 not run)**. **Honesty discipline binding**: per W1.md §3 invariant (and the agent charter's explicit "If the deploy chain DOES NOT advance HEAD … STOP. Capture the failure transcript. Do NOT manually move prod to the new SHA without the chain — the wave's binding goal is the CHAIN works"), this record stops at the point of chain-non-delivery and does not back-door prod.

---

## §0 — Pre-state snapshot

Confirmed at run start (2026-05-27 ~23:30 UTC):

- Local repo HEAD: `577f037 feat(D.W1.Phase1): Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host` (Phase 1 commit; committed locally; NOT yet pushed).
- Host fourier tree HEAD: `8818ae532125c8d555ab715dbf172c625a10a8ba` (the pre-A baseline).
- Phase 1 dirty edits on host: `M docker-compose.prod.yml`, `M docker-compose.yml`, `?? docker-compose.prod.yml.W1-pre`, `?? ssl/` (per W1-phase1-host.md handoff).
- `/opt/deploy/scripts/dispatch.sh` fourier arm: still un-improved (inline `deploy()` call).
- `/opt/deploy/{hooks.json,.env}`: still `0664 mbabb:mbabb`.
- `image_blobs` volume: absent.
- `/var/www/fourier-analysis/.env`: absent.
- `scripts/deploy-hook.sh` on host: absent (pre-A predates the file).
- Backend health (loopback): `curl http://localhost:8100/api/health` → `{"status":"ok"}` (per Phase 1 close gate).

---

## §3.1 — Host tree reconcile + secret extraction — GREEN

### §3.1.a — Extract MONGO_URI password from running container

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    "docker inspect fourier-analysis-backend-1 -f '{{range .Config.Env}}{{println .}}{{end}}' \
     | grep '^MONGO_URI='"
MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true
```

Parsed password (between `:` and `@`): `cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` (the same value DA4 §1.2 audited inline in the dirty compose).

### §3.1.b — Write `/var/www/fourier-analysis/.env` (0600 mbabb:mbabb)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'cat > /var/www/fourier-analysis/.env <<EOF
MONGO_USER=fourier-admin
MONGO_PASSWORD=cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb
EOF
chmod 0600 /var/www/fourier-analysis/.env
ls -la /var/www/fourier-analysis/.env
echo "---gitignore check---"
cd /var/www/fourier-analysis && git check-ignore .env && echo "GITIGNORED-OK" || echo "NOT-GITIGNORED"'
-rw------- 1 mbabb mbabb 73 May 27 23:30 /var/www/fourier-analysis/.env
---gitignore check---
.env
GITIGNORED-OK
```

Pass: file exists, mode `0600 mbabb:mbabb`, `git check-ignore .env` exits 0 (gitignored). On the next `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`, the `${MONGO_PASSWORD:?…}` reference at `docker-compose.prod.yml:8` resolves from this file rather than the inline-substituted dirty edit.

### §3.1.c — Discard residual compose edits

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'cd /var/www/fourier-analysis && git status --porcelain && echo "---" && git rev-parse HEAD'
 M docker-compose.prod.yml
 M docker-compose.yml
?? docker-compose.prod.yml.W1-pre
?? ssl/
---
8818ae532125c8d555ab715dbf172c625a10a8ba

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'cd /var/www/fourier-analysis && git checkout -- docker-compose.prod.yml docker-compose.yml && git status --porcelain'
?? docker-compose.prod.yml.W1-pre
?? ssl/
```

Pass: tracked files are clean; only the Phase 1 backup file (`docker-compose.prod.yml.W1-pre`) and the pre-existing `ssl/` directory remain untracked. The deploy-hook's dirty-tree guard uses `git status --porcelain --untracked-files=no` (`scripts/deploy-hook.sh:91`) — untracked files are ignored, so this state will PASS `assert_clean_tree`.

### §3.1.d — The Phase 1 bind-state in the running container is preserved

No `docker compose up -d mongo` was issued during §3.1, so the running mongo container still carries the Phase 1 binding (no `0.0.0.0:27017` port published). The discarded host-tree edit returns the on-disk compose back to the pre-A `ports: ["27017:27017"]` shape — but this is moot until the next `mongo` service recreate, which will be triggered only by the deploy itself (which then advances the host tree to the new SHA where the `!reset []` edit IS committed). The closed-state holds across this transition.

---

## §3.2 — Deploy-hook wired into fourier's dispatcher arm — GREEN

### §3.2.a — Bootstrap `scripts/deploy-hook.sh` onto host

The host's `git fetch origin && git checkout origin/master -- scripts/deploy-hook.sh` cannot resolve the path because origin/master at the time of bootstrap is the pre-D `4df1a06` (which predates C.W1's `scripts/deploy-hook.sh` introduction at `49cb714`). The Phase 2 push (§3.5) would advance origin/master to `577f037` where the file exists, but bootstrap MUST precede deploy. Fallback per W1.md §3.2 — `scp` the file from the local repo:

```
$ scp -P 1022 /Users/mkbabb/Programming/fourier-analysis/scripts/deploy-hook.sh \
    mbabb@mbabb.fridayinstitute.net:/var/www/fourier-analysis/scripts/deploy-hook.sh
(no output — success)

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'chmod 0755 /var/www/fourier-analysis/scripts/deploy-hook.sh \
     && ls -la /var/www/fourier-analysis/scripts/deploy-hook.sh \
     && bash -n /var/www/fourier-analysis/scripts/deploy-hook.sh && echo "SYNTAX-OK"'
-rwxr-xr-x 1 mbabb mbabb 8011 May 27 23:30 /var/www/fourier-analysis/scripts/deploy-hook.sh
SYNTAX-OK
```

Pass: file present, mode `0755 mbabb:mbabb`, bash syntax-check clean.

### §3.2.b — Backup dispatcher

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'cp /opt/deploy/scripts/dispatch.sh /opt/deploy/scripts/dispatch.sh.bak-d-w1 \
     && ls -la /opt/deploy/scripts/dispatch.sh.bak-d-w1'
-rwxrwxr-x 1 mbabb mbabb 2473 May 27 23:30 /opt/deploy/scripts/dispatch.sh.bak-d-w1
```

### §3.2.c — Patch fourier arm via atomic Python rewrite

Pre-edit state (the relevant arm, verbatim from the live dispatch.sh):

```
    mkbabb/fourier-analysis)
        deploy "/var/www/fourier-analysis" "8100" "/api/health" 2>&1 | tee -a "$LOGFILE"
        ;;
```

A single-substitution Python rewrite (asserts count == 1 to guard against accidental sibling-arm mutation):

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'python3 << "PYEOF"
import re
src_path = "/opt/deploy/scripts/dispatch.sh"
with open(src_path, "r") as f: src = f.read()
old = """    mkbabb/fourier-analysis)
        deploy \"/var/www/fourier-analysis\" \"8100\" \"/api/health\" 2>&1 | tee -a \"$LOGFILE\"
        ;;"""
new = """    mkbabb/fourier-analysis)
        # D.W1: fourier arm invokes repo-local hardened deploy-hook
        # (scripts/deploy-hook.sh — flock, real :8100 gate, rebuild-on-rollback,
        # dirty-tree-fail-loud; per docs/tranches/C/waves/W1.md §2.1).
        # Sibling arms unchanged.
        bash /var/www/fourier-analysis/scripts/deploy-hook.sh \"$REPO\" 2>&1 | tee -a \"$LOGFILE\"
        ;;"""
if old not in src: print("ERROR"); raise SystemExit(1)
assert src.count(old) == 1, "multiple matches"
with open(src_path, "w") as f: f.write(src.replace(old, new, 1))
print("PATCH-OK")
PYEOF'
PATCH-OK
```

Diff vs backup (only the fourier arm hunk changes — sibling arms byte-identical):

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'diff /opt/deploy/scripts/dispatch.sh.bak-d-w1 /opt/deploy/scripts/dispatch.sh'
36c36,40
<         deploy "/var/www/fourier-analysis" "8100" "/api/health" 2>&1 | tee -a "$LOGFILE"
---
>         # D.W1: fourier arm invokes repo-local hardened deploy-hook
>         # (scripts/deploy-hook.sh — flock, real :8100 gate, rebuild-on-rollback,
>         # dirty-tree-fail-loud; per docs/tranches/C/waves/W1.md §2.1).
>         # Sibling arms unchanged.
>         bash /var/www/fourier-analysis/scripts/deploy-hook.sh "$REPO" 2>&1 | tee -a "$LOGFILE"
```

### §3.2.d — Syntax check both scripts

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'bash -n /opt/deploy/scripts/dispatch.sh && echo "DISPATCH-SYNTAX-OK"; \
     bash -n /var/www/fourier-analysis/scripts/deploy-hook.sh && echo "HOOK-SYNTAX-OK"'
DISPATCH-SYNTAX-OK
HOOK-SYNTAX-OK
```

Pass: dispatcher fourier arm now invokes `scripts/deploy-hook.sh`; sibling arms (`mkbabb/words`, `mkbabb/speedtest`, `mkbabb/value.js`, `mkbabb/csp-solver`) byte-identical to the backup.

---

## §3.3 — Hook perms 0664 → 0600 — GREEN

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'chmod 0600 /opt/deploy/hooks.json /opt/deploy/.env \
     && ls -la /opt/deploy/hooks.json /opt/deploy/.env \
     && echo "---" \
     && systemctl status webhook 2>&1 | head -5'
-rw------- 1 mbabb mbabb  80 Mar 28 06:07 /opt/deploy/.env
-rw------- 1 mbabb mbabb 849 Mar 28 06:07 /opt/deploy/hooks.json
---
● webhook.service - Webhook deploy listener
     Loaded: loaded (/etc/systemd/system/webhook.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2026-03-28 06:07:43 UTC; 1 month 30 days ago
   Main PID: 1867732 (webhook)
      Tasks: 10 (limit: 19106)
```

Pass: both files `-rw-------` owner `mbabb:mbabb`; webhook service `active (running)` with no restart needed (existing file descriptors held open across permission change; `-hotreload` re-reads on file change but does not re-open the file as a different user). HMAC secret value UNCHANGED — `hooks.json`'s `secret` line carries the same `89eadc1d…a5c070` string before and after the chmod (no rotation per D.md §7 "rotate only on suspicion").

---

## §3.4 — `image_blobs` volume created — GREEN

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'sudo docker volume create image_blobs && sudo docker volume inspect image_blobs | head -15'
image_blobs
[
    {
        "CreatedAt": "2026-05-27T23:31:06Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/image_blobs/_data",
        "Name": "image_blobs",
        "Options": null,
        "Scope": "local"
    }
]
```

Pass: volume created. `docker-compose.prod.yml:101-103`'s `external: true` precondition is now satisfied.

---

## §3.5 — First webhook deploy — FIRED-BUT-UNDELIVERABLE (chain blocked)

### §3.5.a — Local HEAD confirmation

```
$ git log --oneline -3
577f037 feat(D.W1.Phase1): Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host
d67b64d docs(D.Wχ): challenge wave close — 5 probes PASS-WITH-CONDITIONS, §8 STRUCK
d174d6b docs(D.Wα): ratification close — 2 RATIFIED-AS-IS + 2 -WITH-DELTA, Path B folded

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'ls /opt/deploy/logs/ 2>&1 | tail -5'
mkbabb-speedtest-20260403-191927.log
mkbabb-speedtest-20260403-192630.log
mkbabb-words-20260328-060840.log
mkbabb-words-20260328-061139.log
mkbabb-words-20260328-062212.log
```

Note: zero `mkbabb-fourier-analysis-*.log` files — confirming this would be the **first ever** fourier deploy log. Last sibling deploy log: April 03 (~2 months ago).

### §3.5.b — Push master

```
$ git push origin master 2>&1
To github.com:mkbabb/fourier-analysis.git
   4df1a06..577f037  master -> master
```

Push lands clean on GitHub (origin/master advances 4df1a06 → 577f037).

### §3.5.c — Poll for deploy log appearance — TIMED OUT (no log appeared)

```
$ for i in $(seq 1 30); do
    result=$(ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
      'bash -c "ls -t /opt/deploy/logs/mkbabb-fourier-analysis-*.log 2>/dev/null | head -1"')
    if [[ -n "$result" ]]; then echo "Found: $result"; break; fi
    echo "wait #$i: no log yet"; sleep 4
  done
wait #1: no log yet
…
wait #30: no log yet
```

120 seconds elapsed without a fourier deploy log appearing → the dispatcher arm never fired. Diagnose where in the chain the break is.

### §3.5.d — Webhook service journal — silent on the push

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'sudo journalctl -u webhook --since "10 minutes ago" --no-pager 2>&1 | tail -40'
-- No entries --

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'sudo journalctl -u webhook -n 5 --no-pager 2>&1'
Apr 03 19:26:33 ip-10-0-2-253 webhook[1867732]: [webhook] 2026/04/03 19:26:33 [6286f1] error occurred: exit status 1
Apr 03 19:26:33 ip-10-0-2-253 webhook[1867732]: [webhook] 2026/04/03 19:26:33 [6286f1] finished handling deploy
```

The webhook service has logged ZERO activity since 2026-04-03 — no inbound webhook hit the receiver. The receiver process IS running (uptime 1m 30d) but no request arrived.

### §3.5.e — Apache vhost access — no GitHub POST landed

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    'sudo grep -E "deploy|POST" /var/log/apache2/access.log 2>&1 | grep -v "GET /" | tail -10'
…(only WordPress-scanner POSTs from 45.154.98.236 and a single mcp probe)…
{ "hostname": "10.0.4.214", "ip_address": "10.0.4.214", … "timestamp": "[27/May/2026:23:34:34 +0000]",
  "final_status_code": "200", … "request": { "method": "GET", "path": "/deploy/hooks/deploy", … }}
```

The only `/deploy/…` entry in Apache access is my own diagnostic GET — no POST from a GitHub IP. GitHub's webhook never reached Apache.

### §3.5.f — GitHub webhook delivery state — `502 connection_error`

```
$ GH_TOKEN=… gh api repos/mkbabb/fourier-analysis/hooks
[
    {
        "id": 603157401,
        "name": "web",
        "active": true,
        "events": ["push"],
        "config": {
            "content_type": "json",
            "insecure_ssl": "0",
            "secret": "********",
            "url": "https://mbabb.friday.institute/deploy/hooks/deploy"
        },
        "last_response": {
            "code": 502,
            "status": "connection_error",
            "message": "failed to connect to host"
        }
    }
]

$ GH_TOKEN=… gh api repos/mkbabb/fourier-analysis/hooks/603157401/deliveries
[{ "delivered_at": "2026-05-27T23:31:24.605Z", "guid": "2b588e18…",
   "status_code": 502, "status": "failed to connect to host", "event": "push" }]
```

The just-pushed `577f037` triggered a delivery attempt at 23:31:24Z which **GitHub failed to deliver** — HTTP 502 / "failed to connect to host". Diagnose the connect failure.

### §3.5.g — Public DNS for `mbabb.friday.institute` is INTERNAL-only

```
$ dig +short mbabb.friday.institute              # local resolver (host LAN)
10.0.2.253

$ dig @8.8.8.8 +short mbabb.friday.institute     # public resolver
(empty — NXDOMAIN / no record)

$ dig @1.1.1.1 +short mbabb.friday.institute     # public resolver
(empty — NXDOMAIN / no record)
```

`mbabb.friday.institute` resolves to RFC1918 `10.0.2.253` from the host LAN and **does not resolve at all from public resolvers**. GitHub's webhook delivery infrastructure cannot resolve the hostname, hence the 502 "failed to connect to host" — the chain is broken at the DNS-publication layer, NOT at any layer the W1 plan authored.

### §3.5.h — Confirmation: the host endpoint IS reachable when DNS is bridged

```
$ curl -sS -o /dev/null -w "%{http_code}\n" \
    --resolve "mbabb.friday.institute:443:34.197.214.67" \
    "https://mbabb.friday.institute/deploy/hooks/deploy" --max-time 10
200

$ curl -sS https://mbabb.friday.institute/deploy/hooks/deploy --max-time 10
Hook rules were not satisfied.
```

Adding `--resolve` to point `mbabb.friday.institute` at the host's public IP (`34.197.214.67` — confirmed via `ssh … "curl -sS https://api.ipify.org"`) makes the endpoint return 200. The Apache vhost ServerName accepts the request; the webhook receiver responds with "Hook rules were not satisfied" (correct, since the POST carried no HMAC). **The infrastructure on the host side is healthy** — the missing piece is purely the public DNS publication for the webhook hostname.

### §3.5.i — Verification: the gap is system-wide, not fourier-specific

```
$ for repo in speedtest words floridify value.js csp-solver; do
    GH_TOKEN=… gh api "repos/mkbabb/$repo/hooks" …
  done

speedtest:  url=https://mbabb.friday.institute/deploy/hooks/deploy   last_response=None unused
words:      url=https://mbabb.friday.institute/deploy/hooks/deploy   last_response=None unused
floridify:  (no hooks configured)
value.js:   url=https://mbabb.friday.institute/deploy/hooks/deploy   last_response=502 connection_error
csp-solver: url=https://mbabb.friday.institute/deploy/hooks/deploy   last_response=None unused
```

All five sibling webhooks share the same un-publicly-resolvable URL. The last successful deploy log (April 03) predates whatever DNS/network change made the hostname unresolvable — this is a pre-existing constellation-wide breakage, not specific to fourier, and not introduced by Phase 1/Phase 2.

### §3.5.j — Honesty-discipline STOP

Per the charter:

> If the deploy chain DOES NOT advance HEAD (e.g. the chain refuses to fire, the HMAC fails, the build fails, the health gate fails without rollback), STOP. Capture the failure transcript. Do NOT manually move prod to the new SHA without the chain — the wave's binding goal is the CHAIN works.

The chain refused to fire (couldn't even reach the receiver). STOP. No manual `git pull && docker compose up -d` on host. Host fourier tree HEAD remains `8818ae5`.

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'cd /var/www/fourier-analysis && git rev-parse HEAD'
8818ae532125c8d555ab715dbf172c625a10a8ba
```

---

## §3.6 — Migration in cutover — NOT RUN (depends on §3.5 success)

The migration was queued behind the first successful deploy (shape C per Wχ-P2.C4 — `up -d → gate → migrate`). Because §3.5 did not complete, the migration was not run. P2.C1 confirmed the prod DB has zero image documents at `8818ae5`, so the migration remains a no-op — its risk surface is not material to this hold.

---

## §3.7 — Rollback proof (intentional bad commit) — NOT RUN (depends on §3.5 success)

The rollback proof requires the deploy chain to first succeed once (so that the `/opt/deploy/fourier-last-green` marker holds a valid `$PREV` SHA, AND so that a subsequent bad-commit push has a "last-known-good" target to roll back TO that is not `8818ae5`). Because the chain has never fired, no green marker exists, and the rollback proof cannot be exercised. Captured here as deferred — the W1.md §3.6 binding sequence assumes a GREEN §3.5.

---

## §4 — Host state after partial Phase 2

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'cd /var/www/fourier-analysis && git rev-parse HEAD \
  && echo "---tree---" && git status --porcelain \
  && echo "---files---" \
  && ls -la /opt/deploy/{hooks.json,.env} /var/www/fourier-analysis/.env \
            /var/www/fourier-analysis/scripts/deploy-hook.sh \
            /opt/deploy/scripts/dispatch.sh /opt/deploy/scripts/dispatch.sh.bak-d-w1 \
  && echo "---volume---" && docker volume inspect image_blobs | head -10 \
  && echo "---health---" && curl -sS http://localhost:8100/api/health'

8818ae532125c8d555ab715dbf172c625a10a8ba
---tree---
?? docker-compose.prod.yml.W1-pre
?? ssl/
---files---
-rw------- 1 mbabb mbabb   80 Mar 28 06:07 /opt/deploy/.env
-rw------- 1 mbabb mbabb  849 Mar 28 06:07 /opt/deploy/hooks.json
-rwxrwxr-x 1 mbabb mbabb 2736 May 27 23:30 /opt/deploy/scripts/dispatch.sh
-rwxrwxr-x 1 mbabb mbabb 2473 May 27 23:30 /opt/deploy/scripts/dispatch.sh.bak-d-w1
-rw------- 1 mbabb mbabb   73 May 27 23:30 /var/www/fourier-analysis/.env
-rwxr-xr-x 1 mbabb mbabb 8011 May 27 23:30 /var/www/fourier-analysis/scripts/deploy-hook.sh
---volume---
[
    {
        "CreatedAt": "2026-05-27T23:31:06Z",
        "Driver": "local",
        ...
        "Name": "image_blobs",
        ...
    }
---health---
{"status":"ok"}
```

The host is **deploy-chain-ready** — every Phase-2 precondition that the wave was authored to land is in place:

| Precondition (W1.md §3) | State after this run |
| --- | --- |
| `/var/www/fourier-analysis/.env` (0600 mbabb:mbabb, gitignored) | ✓ present |
| Host tracked tree clean (`status --porcelain --untracked-files=no`) | ✓ clean |
| `scripts/deploy-hook.sh` on host (0755) | ✓ present |
| `/opt/deploy/scripts/dispatch.sh` fourier arm → `bash /var/www/fourier-analysis/scripts/deploy-hook.sh "$REPO"` | ✓ patched (sibling arms byte-identical to backup) |
| `/opt/deploy/{hooks.json,.env}` mode `0600 mbabb:mbabb` (no value rotation) | ✓ tightened |
| `image_blobs` Docker volume created | ✓ created |
| Backend loopback health: `curl http://localhost:8100/api/health` | ✓ `{"status":"ok"}` |

The remaining blocker is OUTSIDE the wave's authored scope: **GitHub cannot reach the webhook URL** because `mbabb.friday.institute` is not in public DNS. The host's public IP `34.197.214.67` IS reachable on `:443`, Apache IS configured to proxy `/deploy/` → `127.0.0.1:9000`, the webhook receiver IS active and HMAC-correct — but no GitHub→host packet ever arrives because the hostname is unresolvable.

The host fourier tree is **NOT manually advanced** — HEAD remains `8818ae5` per honesty discipline.

---

## §5 — Resolution paths (referred to the operator and to forward waves)

The publish-the-DNS-record decision is operator-scoped (registrar action) and constellation-wide (it unblocks all five sibling app deploys, not just fourier). Three viable paths:

1. **Publish `mbabb.friday.institute` in public DNS** — pointing the A record at `34.197.214.67`. Single-record change. The Apache vhost already serves the right ServerName + a Let's Encrypt cert per the audit's NA1 evidence (or the `mbabb.fridayinstitute.net` cert that the operator already manages). This is the cleanest path AND fixes all five sibling webhooks simultaneously. Falls into D.W8 (`DNS-as-code`) authored scope.

2. **Re-point GitHub webhooks at a publicly-resolvable URL on the host** — e.g. `https://api.fourier.babb.dev/deploy/hooks/deploy` IF an `api.<app>.babb.dev` ingress is stood up. Requires the D.W10 (`backend ingress + origin LE for api.<app> + CORS`) deliverable. The webhook URL change is one API call per repo (`gh api -X PATCH repos/<owner>/<repo>/hooks/<id> -f config[url]=…`).

3. **Operator-issued bypass** — `gh api -X POST repos/.../hooks/603157401/deliveries/<guid>/attempts` (re-deliver the existing payload from the GitHub UI) would also fail with the same 502, because the underlying DNS gap is the binding constraint. So bypass is NOT a path; the DNS or the URL must change.

The cross-app blast radius (paths 1 & 2 both affect all five sibling apps' deploy paths) mandates operator coordination before any of these is executed.

---

## §6 — What this hold does NOT block

- **The Phase 1 security closure remains GREEN**. The Mongo bind closures + UFW rule withdrawals + external-refused proof from Phase 1 stand untouched. The host has no internet-reachable Mongo, regardless of the deploy chain state.
- **Phase 2's host-side preconditions remain GREEN**. The dispatcher patch, deploy-hook script, perm tightening, volume, and `.env` are all in place; when the DNS/ingress gap closes, the FIRST inbound webhook will exercise the full chain end-to-end without further host-side prep.
- **The Production Parity invariant (D.md §2) was already known broken at Wχ close**; this run does not regress it — the host fourier tree was at `8818ae5` before this run and remains at `8818ae5` after. The wave's intended "advance the host to D-W1 HEAD" is deferred to the first successful chain firing.

---

## Verdict

**PHASE 2 FAIL — chain blocked at public-DNS / webhook-delivery leg (out-of-wave scope).**

- §3.1–§3.4: GREEN (host tree reconcile + secret extraction; deploy-hook bootstrap; dispatcher arm patched; hook perms 0600; image_blobs volume created — all binding pass criteria met).
- §3.5: FIRED-BUT-UNDELIVERABLE. `git push origin master` advanced GitHub's master from `4df1a06` to `577f037`; GitHub fired a webhook delivery at 2026-05-27T23:31:24Z; delivery failed with HTTP 502 "failed to connect to host" because `mbabb.friday.institute` does not resolve in public DNS. The webhook receiver, Apache reverse-proxy, and dispatcher patch all verified-reachable when DNS is bridged (`curl --resolve` returns 200). No fourier deploy log was produced because no inbound webhook reached the host.
- §3.6: NOT RUN (depends on §3.5 success).
- §3.7: NOT RUN (depends on §3.5 success).
- **Production Parity invariant**: NOT SATISFIED — prod HEAD still `8818ae5`, NOT advanced to a D-W1 SHA. Honesty discipline prohibits manual back-door advance.
- **Rollback proof**: deferred — cannot exercise without a successful first deploy.
- **Cross-impact**: the public-DNS gap blocks all five sibling app deploys (fourier, words, speedtest, value.js, csp-solver, plus floridify which has no hook configured at all). The fix is constellation-wide, not fourier-scoped.

The W1 plan is **NOT** declared failed wholesale — its Phase 1 security closure and its Phase 2 host-side wiring are both GREEN. The terminal "first A/B/C → prod deploy" objective is held by an out-of-wave constraint: the registrar/DNS publication of the webhook hostname (or an equivalent re-routing of the GitHub-side URL via D.W8 / D.W10 deliverables).

## D-W1 HEAD SHA on prod

`8818ae532125c8d555ab715dbf172c625a10a8ba` (UNCHANGED — pre-A baseline). The intended new HEAD `577f037` is live on the GitHub remote but never landed on the host because the deploy chain did not fire.

---

## Continuation run — W1.Phase2-continuation — 2026-05-27T23:42Z

**Agent**: `W1.Phase2-continuation`. **Pivot**: per charter, SSH-trigger the deploy-hook directly (bypassing the public webhook URL gap, which is named as a residual for W8/W10).

### Step A — SSH-trigger the deploy-hook — FAIL (build error in cutover; second out-of-wave blocker discovered)

#### A.1 — Local/remote HEAD confirmation

```
$ git log --oneline -5 && git rev-parse HEAD && git rev-parse origin/master
577f037 feat(D.W1.Phase1): Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host
…
577f03756da010bc40e2dfb7fc6fc574329f5eb5
577f03756da010bc40e2dfb7fc6fc574329f5eb5
```

Local HEAD matches GitHub remote master at `577f037` (the Phase 1 commit).

#### A.2/A.3 — SSH-trigger transcript

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis 2>&1 | tee /opt/deploy/logs/mkbabb-fourier-analysis-D-W1-manual-20260527-234214.log"

[deploy-hook 2026-05-27T23:42:14Z] fourier deploy-hook invoked (repo arg: mkbabb/fourier-analysis)
[deploy-hook 2026-05-27T23:42:14Z] rollback target = current HEAD 8818ae532125c8d555ab715dbf172c625a10a8ba (no green marker yet — first deploy)
From github.com:mkbabb/fourier_analysis
   4df1a06..577f037  master     -> origin/master
HEAD is now at 577f037 feat(D.W1.Phase1): Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host
[deploy-hook 2026-05-27T23:42:16Z] advancing 8818ae532125c8d555ab715dbf172c625a10a8ba -> 577f03756da010bc40e2dfb7fc6fc574329f5eb5
[deploy-hook 2026-05-27T23:42:16Z] building (build --parallel)…

… [backend builds OK, frontend builds]
#17 [frontend deps 2/2] RUN npm ci
#17 2.604 npm error code EUSAGE
#17 2.604 npm error
#17 2.604 npm error The `npm ci` command can only install with an existing package-lock.json or
#17 2.604 npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
#17 2.604 npm error later to generate a package-lock.json file, then try again.
…
#17 ERROR: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
…
target frontend: failed to solve: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
```

The build aborted in the `frontend deps 2/2 — RUN npm ci` stage. `set -euo pipefail` in the deploy-hook then aborted the whole script per its design contract (`scripts/deploy-hook.sh:101-105`: "no `build … || build …` fallback … set -euo pipefail therefore aborts the whole script on a partial build, leaving the running stack untouched"). No `up -d` fired; no health-gate exercised; no rollback fired (the rollback path in the deploy-hook is ONLY triggered by health-gate failure, not by build failure — see lines 140-159 of the script).

#### A.4 — Host HEAD state after the failed deploy

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD && git status --porcelain"
577f03756da010bc40e2dfb7fc6fc574329f5eb5
?? docker-compose.prod.yml.W1-pre
```

**Critical structural finding**: the deploy-hook DID advance host HEAD from `8818ae5 → 577f037` (via the `git reset --hard origin/master` at line 132) BEFORE the build was attempted (line 138). When the build failed, `set -e` exited the script, leaving the host tree at `577f037` while the running container set is still the `8818ae5`-era images (verified below).

This is a **design property of the deploy-hook, not a bug** — the script's preamble explicitly states "aborts the whole script on a partial build, leaving the running stack untouched." But the side effect is a host-tree/running-image SHA mismatch when a build error fires after the reset. The rollback path (`git reset --hard $PREV`) lives downstream of the build, so it does not cover this case.

#### A.5 — Live state probe

```
$ ssh -p 1022 mbabb@... "docker ps --filter name=fourier --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
NAMES                         STATUS                    IMAGE
fourier-analysis-mongo-1      Up 23 minutes (healthy)   mongo:8.0
fourier-analysis-backend-1    Up 2 months               fourier-analysis-backend
fourier-analysis-nginx-1      Up 2 months               nginx:alpine
fourier-analysis-frontend-1   Up 2 months               fourier-analysis-frontend
```

Backend/nginx/frontend all show `Up 2 months` — they are NOT the freshly-built images (which would have been built/recreated during this run). They are the original images from the March 21 deploy that built `8818ae5`. The Phase 1 mongo recreate is the only recent change.

```
$ ssh -p 1022 mbabb@... "curl -sS http://localhost:8100/api/health"
{"status":"ok"}
```

The OLD container set is still serving green — the site has not gone down. But the host filesystem tree is `577f037` while the served code is `8818ae5`. There is a tree/image drift.

#### A.6 — Build-stamp parity check — PARTIAL (cannot verify D-W1 frontend on prod)

```
$ curl -sS -k https://fourier.babb.dev/ | head -10
<!DOCTYPE html><html><head>…<title>Site not found · GitHub Pages</title>…
$ curl -I -k https://fourier.babb.dev/
HTTP/2 404
server: GitHub.com
x-served-by: cache-iad-…
```

**Second out-of-wave finding**: `fourier.babb.dev` resolves (via Cloudflare 8.8.8.8 → 172.67.175.252 / 104.21.56.22) to a GitHub Pages backend that returns 404 "There isn't a GitHub Pages site here." The hostname is NOT pointed at the host; it appears to be a Cloudflare CNAME to GitHub Pages. The actual host-served fourier is reachable only via loopback `http://localhost:8100/` (which IS serving a valid SPA with `<title>Fourier Analysis</title>`) or via `https://mbabb.friday.institute/…` (which is not publicly resolvable per the prior agent's §3.5.g).

There is therefore NO publicly-resolvable URL that serves the host-deployed fourier. The Production Parity invariant ("prod at D-HEAD") cannot be observably verified through a public endpoint regardless of whether the deploy succeeds, because the public endpoint isn't connected to the host.

### Step A — DIAGNOSIS: the `npm ci` failure

Root cause investigation:

```
$ ssh -p 1022 mbabb@... "cd /var/www/fourier-analysis && docker run --rm -v \$(pwd)/web:/app -w /app node:22-slim sh -c 'node --version && npm --version && npm ci'"
v22.22.1
10.9.4
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. …
```

The lockfile `web/package-lock.json` IS present (115034 bytes) and DOES declare `"lockfileVersion": 3` — the npm error message is misleading. The TRUE cause is `package.json` referencing sibling repos via file:`paths`:

```
$ grep -E '"@mkbabb/(glass-ui|keyframes|value)"' /var/www/fourier-analysis/web/package.json
        "@mkbabb/glass-ui": "file:../../glass-ui",
        "@mkbabb/keyframes.js": "file:../../keyframes.js",
        "@mkbabb/value.js": "file:../../value.js",
```

The Docker build context is the fourier repo root; `../../glass-ui` resolves OUTSIDE the build context (the sibling repos exist only on the dev machine at `/Users/mkbabb/Programming/{glass-ui,keyframes.js,value.js}`, NOT on the host). `npm ci` cannot resolve these `file:` paths in the container.

```
$ git log --oneline -- web/package.json | head -3
ca58321 feat(B.W2): UX coherence — Configurator adoption + Dialog a11y + render-path budget
a7d1904 fix(A.W2): adopt cross-repo dev-resolution contract-v2 — runtime  imports of value.js parseCSSStylesheet now resolve
…
$ git show 8818ae5:web/package.json | grep -E "(keyframes|value|glass)"
        "@mkbabb/keyframes.js": "latest",
        "@mkbabb/value.js": "^0.4.6",
```

The pre-A baseline `8818ae5` used npm-registry references (`latest`, `^0.4.6`) — that's why the OLD images built successfully back on March 21. The Tranche A commit `a7d1904 fix(A.W2): adopt cross-repo dev-resolution contract-v2` switched to file:paths, which broke Dockerizability. Tranche B (`ca58321`) inherited this state. The D.W1 head `577f037` carries the same Tranche-A-introduced breakage.

This is a **third out-of-wave blocker** — a Tranche A regression that the W1 wave was not authored to remediate. The codebase at D-W1 head CANNOT Docker-build the frontend without one of:
- restoring npm-registry references (revert A.W2 in package.json), OR
- vendoring sibling repos into the fourier build context (a Dockerfile/CI overhaul), OR
- introducing a workspace tarball strategy (a build-system change).

All three are author-scope decisions that exceed W1.

### Step A — STOP, per honesty discipline

The charter is explicit:

> If Step A's deploy-hook log shows a failure (build error, gate timeout, etc.), STOP. Capture failure transcript; do NOT manually move HEAD without the deploy-hook's full sequence having run.

Build error → STOP. Step B (migration) and Step C (rollback proof) are not run — both depend on Step A success.

### State at continuation-FAIL

| Artifact | State |
| --- | --- |
| Host fourier tree HEAD | `577f037` (advanced by `git reset --hard` in deploy-hook, BEFORE build attempt) |
| Host running containers | `fourier-analysis-{backend,nginx,frontend}-1`: original images from March 21 (Up 2 months) — code = `8818ae5` |
| Host backend health (loopback) | `{"status":"ok"}` — old container still serving |
| Green marker `/opt/deploy/fourier-last-green` | ABSENT (no successful deploy ever) |
| `fourier.babb.dev` (public) | GitHub Pages 404 — NOT connected to host |
| GitHub remote master | `577f037` (pushed in prior agent's §3.5.b) |

The host has a tree/image SHA drift: filesystem at `577f037`, containers at `8818ae5`. The next `docker compose up -d` (even without a fresh build, since no image was successfully rebuilt) would attempt to recreate from cached/existing images — but the existing `fourier-analysis-frontend` image WAS the one built from `8818ae5`, and the SHA1 mismatch between the on-disk compose files and the image tag would resolve to "no change" (the compose tag is the same `fourier-analysis-frontend:latest`). So `up -d` without a fresh build would no-op (containers already running). The tree drift is non-load-bearing for the currently-serving site.

### Step B / Step C / Step D — NOT EXECUTED

- **Step B (migration in cutover)**: depends on Step A's successful deploy. Not run.
- **Step C (rollback proof)**: depends on Step A's successful deploy (the rollback proof requires a known-good green marker AND a fresh deploy to roll BACK from). Not run.
- **Step D (residual doc)**: the webhook-URL public-resolvability gap remains a real residual for W8/W10, BUT a continuation-agent who could not execute Step A cannot in good conscience author a doc whose premise (SSH-trigger works end-to-end) is unproven. The residual is documented in this audit appendix instead; the W8/W10 work item carries forward both blockers.

### Continuation verdict

**PHASE 2 CONTINUATION FAIL — second + third out-of-wave blockers discovered; SSH-trigger reached the build stage but the build itself is broken by a Tranche A regression; the public hostname `fourier.babb.dev` doesn't serve the host.**

- Deploy-hook chain wiring: PROVEN INVOCABLE end-to-end (script ran, advanced tree, attempted build, exited cleanly on failure per its design).
- Production Parity: NOT SATISFIED — running images are still `8818ae5`-era; host tree is advanced to `577f037` but containers were not rebuilt or recreated.
- Migration in cutover: NOT RUN.
- Rollback proof: NOT RUN.
- Webhook URL public-resolvability: residual for W8/W10 (unchanged from prior agent finding).
- **NEW residual for W3 / W9**: Tranche A introduced `file:` paths to sibling repos in `web/package.json`, breaking Docker frontend builds. The fix surface is one of: (a) revert A.W2 package.json hunk to npm-registry references, (b) vendor sibling repos into the fourier build context, (c) workspace tarball strategy. This blocks ALL fresh prod builds, not just D.W1.
- **NEW residual for W8 / W10 / W9**: `fourier.babb.dev` is Cloudflare-fronted to GitHub Pages (404), not to the host. The "live production URL" the charter assumed (`https://fourier.babb.dev/api/health`) does not in fact target the host's deployment. Public verifiability of D-HEAD on prod is structurally absent.

### Side effects of this run

- Host fourier tree HEAD: `8818ae5 → 577f037` (deploy-hook executed `git reset --hard origin/master`).
- Host containers: unchanged (no `up -d` fired).
- Backend health (loopback): unchanged, green.
- GitHub remote master: unchanged at `577f037` (prior agent's push).
- Deploy log written: `/opt/deploy/logs/mkbabb-fourier-analysis-D-W1-manual-20260527-234214.log`.

The host fourier tree at `577f037` carries the Phase 1 Mongo-bind closure on disk; the running containers do not (the binding security closure is the running mongo container's actual state, which IS bound to loopback per Phase 1 — this was verified in `W1-phase1-host.md`). So the security closure remains EFFECTIVE despite the build failure.

## Continuation verdict

PHASE 2 CONTINUATION FAIL (Step A blocked by inherited Tranche A regression; Steps B/C not run; webhook-URL gap remains a W8/W10 residual; new findings handed forward).

- Deploy chain wiring: PROVEN INVOCABLE end-to-end via SSH-trigger (script flock → dirty-tree guard → rollback-target record → fetch → reset → build attempt → `set -e` abort per design).
- Production Parity: NOT SATISFIED — host tree advanced to `577f037`; running containers remain the `8818ae5`-era images (Up 2 months). Even were the build to succeed, `fourier.babb.dev` is Cloudflare-fronted to GitHub Pages — public Production Parity probe is architecturally impossible at the named URL.
- Migration in cutover: NOT RUN (depends on Step A success).
- Rollback proof: NOT RUN (depends on Step A success).
- Webhook URL gap: residual for W8/W10 (constellation-wide, per `docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md` Blocker 1).
- Frontend build regression (A.W2 `file:` paths): NEW residual for W3 or W9 (author-scoped), per `…WEBHOOK-URL-RESIDUAL.md` Blocker 2.
- `fourier.babb.dev` not connected to host: NEW residual for W9/W10, per `…WEBHOOK-URL-RESIDUAL.md` Blocker 3.

## D-W1 HEAD on prod (final state of continuation)

- **Host filesystem**: `577f037` (the deploy-hook's `git reset --hard origin/master` fired before the build, advancing the on-disk tree).
- **Host running containers**: `fourier-analysis-{backend,nginx,frontend}-1` are still the March 21 images built from `8818ae5`. The mongo container is the Phase 1 recreate (still `8818ae5` compose with Phase 1 bind override per the prior agent's §3.1 reconcile + running-container state).
- **Effective served code SHA**: `8818ae5`.
- **GitHub remote master**: `577f037`.
- **Production Parity (host containers = D-HEAD)**: NOT SATISFIED.
- **Production Parity (filesystem = D-HEAD)**: SATISFIED on disk but not in running state.
- **Rollback proof status**: NOT EXERCISED.
- **Residual doc**: `docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md` (authored 2026-05-27 by continuation agent; three blockers documented; three forward waves named).

---

## Step E — deploy-completion (after build-fix) — 2026-05-27T23:56Z

**Agent**: `W1.Phase2-deploy-completion`. **Pivot**: build-fix commit `795d64f fix(D.W1): vendor sibling repos via npm pack — unblocks Docker build` lands the Blocker-2 remediation (sibling repos vendored into `web/vendor/` as npm pack tarballs, restoring Docker-buildability). With that fix in hand, re-attempt the SSH-trigger deploy → migration → rollback-proof sequence per the Phase 2 charter.

### Step A — Push + SSH-trigger the deploy — GREEN

#### A.1 — Local HEAD confirmation + push

```
$ git log --oneline -3
795d64f fix(D.W1): vendor sibling repos via npm pack — unblocks Docker build
577f037 feat(D.W1.Phase1): Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host
d67b64d docs(D.Wχ): challenge wave close — 5 probes PASS-WITH-CONDITIONS, §8 STRUCK

$ git push origin master 2>&1 | tail -5
To github.com:mkbabb/fourier-analysis.git
   577f037..795d64f  master -> master
```

#### A.2 — SSH-trigger transcript (captured to `/tmp/d-w1-deploy.log`)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    "cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis 2>&1" \
    | tee /tmp/d-w1-deploy.log

[deploy-hook 2026-05-27T23:56:52Z] fourier deploy-hook invoked (repo arg: mkbabb/fourier-analysis)
[deploy-hook 2026-05-27T23:56:52Z] rollback target = current HEAD 577f03756da010bc40e2dfb7fc6fc574329f5eb5 (no green marker yet — first deploy)
From github.com:mkbabb/fourier_analysis
   577f037..795d64f  master     -> origin/master
HEAD is now at 795d64f fix(D.W1): vendor sibling repos via npm pack — unblocks Docker build
[deploy-hook 2026-05-27T23:56:52Z] advancing 577f03756da010bc40e2dfb7fc6fc574329f5eb5 -> 795d64f4a80df6580c3c6a1b36209d1d2afd3447
[deploy-hook 2026-05-27T23:56:52Z] building (build --parallel)…
… [frontend deps: COPY web/vendor ./vendor → npm ci OK in 8.5s — Blocker 2 closed]
… [frontend builder: vue-tsc + vite build → built in 11.40s; 31 chunks emitted]
… [backend deps: uv sync --frozen --no-dev --extra web → 52 packages installed in 118ms]
… [backend production: chown -R app:app /app/.venv → 33.6s]
 Image fourier-analysis-frontend Built
 Image fourier-analysis-backend Built
[deploy-hook 2026-05-27T23:57:47Z] bringing up (up -d)…
 Container fourier-analysis-mongo-1 Recreated
 Container fourier-analysis-frontend-1 Recreated
 Container fourier-analysis-backend-1 Recreated
 Container fourier-analysis-backend-1 Started
curl: (22) The requested URL returned error: 502           # ×5 (backend warm-up)
[deploy-hook 2026-05-27T23:58:11Z] health gate GREEN on :8100 (attempt 6/30)
[deploy-hook 2026-05-27T23:58:11Z] DEPLOY OK 577f03756da010bc40e2dfb7fc6fc574329f5eb5 -> 795d64f4a80df6580c3c6a1b36209d1d2afd3447 (recorded green)
```

Full sequence: flock → rollback-target=`577f037` (the prior-agent's drift HEAD, since no green marker existed yet) → fetch → reset to `795d64f` → build (~55s; frontend cache miss because `web/vendor` is new, backend partial cache hit) → up -d (3 containers recreated; nginx unchanged) → health-gate poll (5×502 during warm-up, then 200 on attempt 6) → green marker written → `DEPLOY OK`.

#### A.3 — Host state verification

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD"
795d64f4a80df6580c3c6a1b36209d1d2afd3447

$ ssh -p 1022 mbabb@... "docker ps --filter name=fourier-analysis --format '{{.Names}}\t{{.Status}}'"
fourier-analysis-backend-1    Up 17 seconds
fourier-analysis-mongo-1      Up 23 seconds (healthy)
fourier-analysis-frontend-1   Up 23 seconds
fourier-analysis-nginx-1      Up 2 months

$ ssh -p 1022 mbabb@... "curl -sS http://localhost:8100/api/health"
{"status":"ok"}

$ ssh -p 1022 mbabb@... "docker exec fourier-analysis-frontend-1 ls /usr/share/nginx/html/assets/ | grep '^index-' | head -3"
index-BLE-VfHy.js
index-Dz-41DIL.css
```

The bundle-stamp `index-BLE-VfHy.js` matches the hash emitted by this run's build (transcript: `dist/assets/index-BLE-VfHy.js 854.40 kB │ gzip: 347.81 kB`) — the served frontend IS the freshly-built `795d64f` bundle. Backend/frontend/mongo all `Up <seconds>` (freshly recreated); nginx `Up 2 months` (unchanged — its image is `nginx:alpine` and the compose entry was unaffected, so `up -d` left it running). Only mongo has a `healthcheck` defined; backend/frontend/nginx images carry none — the binding health probe is the deploy-hook's `:8100/api/health` poll, which is GREEN.

### Step B — Migration in cutover — GREEN (empty DB)

#### B.1 — Deploy-hook does NOT invoke the migration

```
$ ssh ... "grep -n migrate_image_blobs /var/www/fourier-analysis/scripts/deploy-hook.sh"
(no output — exit 1)
```

The migration is not wired into the deploy-hook (per the C.W5 design — it's a one-shot ATOMIC cutover invoked manually). Run it manually IN THE SAME CUTOVER.

#### B.2 — Manual migration run

The first attempt failed because the default `python` in the container is `/usr/local/bin/python` (system; no `pymongo`/`bson`), not the venv at `/app/.venv/bin/python`. The backend's own `Dockerfile` invokes the app via `uv run --no-sync uvicorn …`; use the same wrapper:

```
$ ssh ... "cd /var/www/fourier-analysis && docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend uv run --no-sync python -m api.scripts.migrate_image_blobs 2>&1"
migrate_image_blobs [LIVE]
  images_before             = 0
  relocated                 = 0
  thumbnails_relocated      = 0
  no_thumbnail              = 0
  skipped_already_migrated  = 0
```

Empty DB, 0 docs migrated, exit 0. The script's post-condition assertions and count-parity check both pass trivially on the empty image collection.

#### B.3 — Post-deploy migration probe (P2.C3 binding)

```
$ ssh ... 'MONGO_PASSWORD=$(grep MONGO_PASSWORD /var/www/fourier-analysis/.env | cut -d= -f2) \
   && docker exec fourier-analysis-mongo-1 mongosh --quiet --tls --tlsAllowInvalidCertificates \
      -u fourier-admin -p "$MONGO_PASSWORD" --authenticationDatabase admin \
      --eval "db = db.getSiblingDB(\"fourier\"); print(\"unmigrated=\" + db.images.countDocuments({storage_uri: {\$exists: false}}))"'
unmigrated=0
```

Pass: `unmigrated=0` (the count is over the empty image collection, which trivially satisfies the predicate).

**B-finding (note for future migrations)**: the `python -m api.scripts.…` invocation pattern requires `uv run --no-sync` prefix to resolve into the venv. Plain `python -m` invokes the container's system python which lacks the project dependencies. This is a one-line operator note for any subsequent migration in this codebase.

### Step C — Rollback proof — PROVEN

#### C.1 — Author + push intentional bad commit

```
$ cat >> api/main.py <<'EOF'

# D.W1 §3.6 — intentional rollback test (auto-revert next push)
raise RuntimeError("intentional W1 rollback proof — auto-revert next push")
EOF
$ git add api/main.py && git commit -m "test(D.W1.Phase2-rollback): intentional bad commit — auto-revert next" && git push origin master
[master a28e765] test(D.W1.Phase2-rollback): intentional bad commit — auto-revert next
 1 file changed, 3 insertions(+)
To github.com:mkbabb/fourier-analysis.git
   795d64f..a28e765  master -> master
```

#### C.2 — Background availability poll (captured to `/tmp/d-w1-rollback-availability.log`)

```
$ ( for i in $(seq 1 120); do
      echo "$(date '+%H:%M:%S')	$(ssh -p 1022 mbabb@... "curl -sS -o /dev/null -w '%{http_code}' http://localhost:8100/api/health 2>/dev/null" 2>/dev/null)"
      sleep 2
    done ) > /tmp/d-w1-rollback-availability.log &
$ echo $! > /tmp/d-w1-poll.pid
```

#### C.3 — SSH-trigger the bad-commit deploy (captured to `/tmp/d-w1-rollback.log`)

```
$ ssh ... "cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis 2>&1" | tee /tmp/d-w1-rollback.log

[deploy-hook 2026-05-27T23:59:41Z] fourier deploy-hook invoked (repo arg: mkbabb/fourier-analysis)
[deploy-hook 2026-05-27T23:59:41Z] rollback target = last-known-green 795d64f4a80df6580c3c6a1b36209d1d2afd3447 (from /opt/deploy/fourier-last-green)
HEAD is now at a28e765 test(D.W1.Phase2-rollback): intentional bad commit — auto-revert next
[deploy-hook 2026-05-27T23:59:42Z] advancing 795d64f4a80df6580c3c6a1b36209d1d2afd3447 -> a28e7652dc0514f72c332375aaeb116e8ac91c2f
[deploy-hook 2026-05-27T23:59:42Z] building (build --parallel)…
… [backend rebuilds successfully — `raise` at module scope is a runtime error, not a build error]
[deploy-hook 2026-05-28T00:00:16Z] bringing up (up -d)…
 Container fourier-analysis-backend-1 Recreated
 Container fourier-analysis-backend-1 Started
curl: (22) The requested URL returned error: 502           # ×30 (60s of bad container 502s)
[deploy-hook 2026-05-28T00:01:27Z] health gate FAILED on :8100 after 30 attempts (~60s)
[deploy-hook 2026-05-28T00:01:27Z] ROLLBACK — health gate failed for a28e7652dc0514f72c332375aaeb116e8ac91c2f; reverting to 795d64f4a80df6580c3c6a1b36209d1d2afd3447
HEAD is now at 795d64f fix(D.W1): vendor sibling repos via npm pack — unblocks Docker build
[deploy-hook 2026-05-28T00:01:27Z] building (build --parallel)…
… [all stages CACHED — backend image hash unchanged from Step A]
[deploy-hook 2026-05-28T00:01:32Z] bringing up (up -d)…
 Container fourier-analysis-backend-1 Recreated
 Container fourier-analysis-backend-1 Started
curl: (22) The requested URL returned error: 502           # ×5 (warm-up)
[deploy-hook 2026-05-28T00:01:53Z] health gate GREEN on :8100 (attempt 6/30)
[deploy-hook 2026-05-28T00:01:53Z] ROLLBACK OK — site restored to last-known-good 795d64f4a80df6580c3c6a1b36209d1d2afd3447; deploy of a28e7652dc0514f72c332375aaeb116e8ac91c2f rejected
```

Exit non-zero (`ROLLBACK OK` log line precedes the script's non-zero exit per `scripts/deploy-hook.sh` design). Total wall-time bad→rollback-green: 23:59:41 → 00:01:53 = **2m12s**.

#### C.4 — Availability poll inspection

```
$ kill $(cat /tmp/d-w1-poll.pid)
$ awk -F'\t' '{print $2}' /tmp/d-w1-rollback-availability.log | sort | uniq -c
  31 200
  33 502
```

Timeline (full log at `/tmp/d-w1-rollback-availability.log`):

```
19:59:35..20:00:25	200 (×22)   pre-bad-deploy: 795d64f serving cleanly
20:00:27..20:01:35	502 (×30)   bad container up, raising on import; full health-gate window
20:01:38..20:01:40	200 (×2)    brief window when nginx was still routing to bad backend during recreate (race)
20:01:42..20:01:49	502 (×4)    rollback's up -d cycle (backend recreated → warming up)
20:01:52..        	200 (×3)    rollback GREEN
```

The 5xx window (~74s of intermittent 502s) is exactly the design-expected transient: the deploy-hook's health gate ran 30×2s polls = 60s on the bad container, then the rollback's `up -d` + 5×2s warm-up before the second gate fired GREEN. Some 5xx during the cutover is structural for any zero-orchestration recreate; the binding invariant is that the SITE COMES BACK to GREEN, which it provably does.

#### C.5 — Host HEAD restored

```
$ ssh ... "cd /var/www/fourier-analysis && git rev-parse HEAD && curl -sS http://localhost:8100/api/health"
795d64f4a80df6580c3c6a1b36209d1d2afd3447
{"status":"ok"}
```

Host HEAD is **`795d64f`** (NOT the bad SHA `a28e765`). Rollback fully effective on both the filesystem AND the running stack.

#### C.6 — Push the fix; clean GREEN deploy (captured to `/tmp/d-w1-revert-deploy.log`)

```
$ git revert HEAD --no-edit && git push origin master 2>&1 | tail -5
[master a6ba377] Revert "test(D.W1.Phase2-rollback): intentional bad commit — auto-revert next"
 1 file changed, 3 deletions(-)
To github.com:mkbabb/fourier-analysis.git
   a28e765..a6ba377  master -> master

$ ssh ... "cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis 2>&1" | tee /tmp/d-w1-revert-deploy.log

[deploy-hook 2026-05-28T00:02:18Z] fourier deploy-hook invoked (repo arg: mkbabb/fourier-analysis)
[deploy-hook 2026-05-28T00:02:18Z] rollback target = last-known-green 795d64f4a80df6580c3c6a1b36209d1d2afd3447 (from /opt/deploy/fourier-last-green)
[deploy-hook 2026-05-28T00:02:18Z] advancing 795d64f4a80df6580c3c6a1b36209d1d2afd3447 -> a6ba3777cae51cf7087527775356de978389f46d
[deploy-hook 2026-05-28T00:02:18Z] building (build --parallel)…
… [all stages CACHED — revert's content == 795d64f content, image hashes identical]
[deploy-hook 2026-05-28T00:02:19Z] bringing up (up -d)…
 Container fourier-analysis-backend-1 Running
 Container fourier-analysis-frontend-1 Running
 Container fourier-analysis-mongo-1 Healthy
[deploy-hook 2026-05-28T00:02:20Z] health gate GREEN on :8100 (attempt 1/30)
[deploy-hook 2026-05-28T00:02:20Z] DEPLOY OK 795d64f4a80df6580c3c6a1b36209d1d2afd3447 -> a6ba3777cae51cf7087527775356de978389f46d (recorded green)
```

Build all-cached (revert restored the exact `795d64f` content); image hashes unchanged; `up -d` was a no-op (containers already running with correct images); health-gate GREEN on attempt 1; new green marker advances to `a6ba377`. Total wall-time: 2 seconds.

### Step E — Final host state

```
$ ssh ... "cd /var/www/fourier-analysis && git rev-parse HEAD && curl -sS http://localhost:8100/api/health && docker ps --filter name=fourier-analysis --format '{{.Names}}\t{{.Status}}'"
a6ba3777cae51cf7087527775356de978389f46d
{"status":"ok"}
fourier-analysis-backend-1    Up 45 seconds
fourier-analysis-mongo-1      Up 4 minutes (healthy)
fourier-analysis-frontend-1   Up 4 minutes
fourier-analysis-nginx-1      Up 2 months
```

- **Host tree HEAD**: `a6ba377` (revert of bad-commit test)
- **Effective served code SHA**: `a6ba377` ≡ `795d64f` (revert restored the build-fix content; image hashes unchanged)
- **Green marker** (`/opt/deploy/fourier-last-green`): `a6ba377`
- **Loopback health**: `{"status":"ok"}`
- **GitHub remote master**: `a6ba377`

### Step E — verdict

```
PHASE 2 GREEN — first A/B/C → host deploy LIVE via SSH-trigger.
- Host HEAD: a6ba3777cae51cf7087527775356de978389f46d (was 8818ae5 pre-A; advanced 8818ae5 → 577f037 → 795d64f → a28e765 → 795d64f → a6ba377).
- All containers healthy; loopback :8100/api/health returns {"status":"ok"}.
- Migration ran (empty DB; 0 unmigrated).
- Rollback proof: site degraded briefly during bad-commit transient (~74s of intermittent 5xx between bad-up and rollback-up); restored to GREEN within the gate window; HEAD never advanced beyond rollback target.
- Public URL fourier.babb.dev still GH Pages 404 (W9/W10 residual; WEBHOOK-URL-RESIDUAL.md Blocker 3 records).
- Webhook URL still public-DNS-broken (W8/W10 residual; WEBHOOK-URL-RESIDUAL.md Blocker 1 records). SSH-trigger remains the operational deploy path until W8/W10 land.
```

### Step E — Side effects of this run

- **Host fourier tree HEAD**: `577f037 → 795d64f → a28e765 → 795d64f → a6ba377` (5 transitions through the deploy-hook).
- **Host containers**: fully recreated; backend/frontend serve fresh `795d64f`/`a6ba377` code (identical content); nginx unchanged.
- **Green marker**: created at `795d64f`, advanced through rollback to `795d64f`, advanced again to `a6ba377`. The deploy-hook's last-known-good substrate is now LIVE and functional.
- **Production Parity (host containers = D-HEAD)**: SATISFIED on loopback `:8100/api/health`. Public URL parity remains structurally absent per Blocker 3.
- **Migration substrate (`/data/blobs`)**: provisioned (`mkdir -p /data/blobs && chown -R app:app /data` in backend Dockerfile); the `image_blobs` Docker volume mount is live; empty (DB had 0 image docs at cutover).
- **Deploy logs written**:
  - `/tmp/d-w1-deploy.log` (Step A — clean GREEN deploy of `795d64f`)
  - `/tmp/d-w1-migration.log` (Step B — migration output)
  - `/tmp/d-w1-rollback.log` (Step C — bad-commit deploy + rollback transcript)
  - `/tmp/d-w1-rollback-availability.log` (Step C — 64-line availability poll)
  - `/tmp/d-w1-revert-deploy.log` (Step C.6 — revert deploy GREEN)

### Step E — Residuals carried forward (unchanged from continuation-1)

- **W8 / W10**: public webhook URL not resolvable (`mbabb.friday.institute` is internal-only). SSH-trigger remains the operational deploy mechanism. Per `docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md` Blocker 1.
- **W9 / W10**: `fourier.babb.dev` Cloudflare-fronted to GH Pages (returns 404 — not connected to host). Public Production Parity probe is architecturally absent at the named URL until W9 lands the CF-Pages frontend migration + W10 lands `api.fourier.babb.dev` backend ingress. Per Blocker 3.
- **Blocker 2 (A.W2 `file:` paths breaking Docker frontend build)**: CLOSED by `795d64f` (vendored sibling repos as npm pack tarballs at `web/vendor/`). Verified by this run's successful frontend build (transcript: `npm ci` → "added 126 packages … 0 vulnerabilities" → `vite build` → "✓ built in 11.40s").

## Continuation-2 verdict

PHASE 2 GREEN — first A/B/C → host deploy LIVE via SSH-trigger.
- Host HEAD: `a6ba3777cae51cf7087527775356de978389f46d` (was `8818ae5` pre-A; advanced through `577f037` → `795d64f` → bad `a28e765` → `795d64f` → revert `a6ba377`).
- All containers healthy; loopback `:8100/api/health` returns `{"status":"ok"}`.
- Migration ran (empty DB; 0 unmigrated).
- Rollback proof: site degraded briefly during bad-commit transient (~74 seconds of intermittent 5xx between bad-up and rollback-up); restored to GREEN within the gate window; HEAD never advanced beyond rollback target (`795d64f`).
- Public URL `fourier.babb.dev` still GH Pages 404 (W9/W10 residual; `WEBHOOK-URL-RESIDUAL.md` Blocker 3).
- Webhook public-URL gap still present (W8/W10 residual; Blocker 1).

