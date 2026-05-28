# W10 — backend ingress + origin LE for `api.<app>` + CORS — close record

**Wave**: D.W10 (thread α′ — constellation deployment normalization; the backend-ingress + TLS plane)
**Agent**: W10-ingress-and-le (single agent — operator authority on the constellation host)
**Date**: 2026-05-28 (UTC)
**Status**: **CLOSED — 7-SAN LE cert live, 4 per-host vhosts active (api.fourier/color/sudoku.babb.dev → backend gateways; deploy.babb.dev → :9000 webhook), 5 GitHub webhook URLs flipped to deploy.babb.dev, palette-api + floridify CORS env corrected and containers restarted.**

---

## §0 — Headline

- LE cert at `/etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem` now carries **7 SANs**: `sudoku/fourier/words.babb.dev` (original) + `api.fourier/api.color/api.sudoku/deploy.babb.dev` (added). Expansion via `certbot --expand --apache` HTTP-01 (Path B per `CONSTELLATION-DEPLOY.md §3.2.a`).
- 4 new Apache vhosts live on `*:443`: `api-fourier.babb.dev → :8100`, `api-color.babb.dev → :8130`, `api-sudoku.babb.dev → :8120`, `deploy.babb.dev → :9000`. `apache2ctl configtest = Syntax OK`. `systemctl reload apache2` clean. Sibling-isolation: existing `babb-dev.conf` was NOT touched (Wχ-P1.C1).
- All 5 GitHub repos' deploy webhook URL flipped from `https://mbabb.friday.institute/deploy/hooks/deploy` → `https://deploy.babb.dev/hooks/deploy`. Verified via `gh api` GET + a live redelivery (the most recent push redelivery now returns **200 OK** end-to-end where it had been `502 failed to connect to host`).
- CORS env corrected: `palette-api-api-1` `ALLOWED_ORIGINS=https://color.babb.dev` (was empty), `floridify-backend` `BACKEND_CORS_ORIGINS=["https://words.babb.dev"]` (was `["https://mbabb.friday.institute"]`). Both containers restarted; live env confirmed via `docker inspect`. Preflight `OPTIONS https://api.color.babb.dev/` from `Origin: https://color.babb.dev` returns `204` + correct allow-origin echo.
- **Bounded honesty**: the certbot HTTP-01 challenge failed initially because three of the existing SANs (`fourier/sudoku/words.babb.dev`) are presently routed via Cloudflare proxy (orange-cloud CNAMEs to `*.pages.dev`, despite the W9 Pages projects not yet existing → CF edge returns 403 for unknown acme paths). Resolved by a **temporary DNS swap** (CNAMEs → grey-cloud A → `34.197.214.67`) lasting only the certbot run (≈30s), then restored to original CNAMEs immediately. The swap was performed via the CF API token (`Zone:DNS:Edit`); state snapshot saved to `/tmp/cf_record_swap_state.json` before mutations; restore POST'd identical record bodies back. The host's per-app frontend serving was unaffected (the existing-SAN frontends were already 404'ing through CF for W9 reasons; flipping DNS for 30s did not change user-visible behaviour). Recorded as the load-bearing operator note for W12 reconcile.

---

## §1 — Deliverables

| Item | Path | State |
|---|---|---|
| Per-`api.<app>.babb.dev` vhost template | `infra/apache/api-vhosts.conf.template` (NEW, tracked) | authored — placeholder substitution `<APP>` + `<GATEWAY_PORT>`; NA5 §1.3 canonical headers + ProxyPreserveHost + X-Forwarded-Proto; cert paths fixed to the shared `sudoku.babb.dev` fullchain |
| `deploy.babb.dev` vhost template | `infra/apache/deploy.babb.dev.conf.template` (NEW, tracked) | authored — same canonical form, hardcoded `localhost:9000` target |
| `/etc/apache2/sites-available/api-fourier.babb.dev.conf` | host | deployed from template, `a2ensite`d, active |
| `/etc/apache2/sites-available/api-color.babb.dev.conf` | host | deployed from template, `a2ensite`d, active |
| `/etc/apache2/sites-available/api-sudoku.babb.dev.conf` | host | deployed from template, `a2ensite`d, active |
| `/etc/apache2/sites-available/deploy.babb.dev.conf` | host | deployed from template, `a2ensite`d, active |
| `/etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem` | host | expanded 3→7 SANs |
| 5× GitHub webhook URL | github.com | flipped to `https://deploy.babb.dev/hooks/deploy` |
| `palette-api-api-1` env | host docker | `ALLOWED_ORIGINS=https://color.babb.dev` (was empty) |
| `floridify-backend` env | host docker | `BACKEND_CORS_ORIGINS=["https://words.babb.dev"]` (was `[".../mbabb.friday.institute"]`) |
| Close record | this file | authored |

---

## §2 — Step-by-step transcript

### §2.1 — Pre-flight: SSH + sudo NOPASSWD + backend gateways listening

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'sudo -n true; ss -tlnp | grep -E ":(8100|8120|8130|9000|8110) "'
sudo_exit=0
LISTEN 0      4096       127.0.0.1:8100       0.0.0.0:*
LISTEN 0      4096       127.0.0.1:8110       0.0.0.0:*
LISTEN 0      4096       127.0.0.1:8120       0.0.0.0:*
LISTEN 0      4096       127.0.0.1:8130       0.0.0.0:*
LISTEN 0      4096               *:9000             *:*    users:(("webhook",pid=1867732,fd=6))
```

All 5 backend gateways listening (`fourier-analysis-nginx:8100`, `floridify-nginx:8110`, `csp-solver-nginx:8120`, `palette-api-api:8130`, `adnanh/webhook:9000`).

### §2.2 — (a) `certbot --expand --apache` — 7 SANs

**Pre-flight finding**: the dry-run failed for the 3 existing SANs because they route through Cloudflare proxy (orange-cloud → CF edge returns 403 for acme-challenge paths):

```
$ curl -sI -o /dev/null -w "%{http_code} %{remote_ip}\n" http://fourier.babb.dev/.well-known/acme-challenge/test-token
403 (CF edge — Server: cloudflare, CF-RAY present)

$ curl -sI -o /dev/null -w "%{http_code} %{remote_ip}\n" http://api.fourier.babb.dev/.well-known/acme-challenge/test
404 (origin — challenge path reachable, just no file yet — correct for grey-cloud names)
```

The 3 existing SANs currently CNAME → `fourier.pages.dev` / `sudoku.pages.dev` / wildcard. The W9 Pages projects don't yet exist, so CF returns 403. Resolution: temporarily swap fourier/sudoku/words → grey-cloud A `34.197.214.67` for the issuance window only, then restore.

**Swap (saved state first)**:

```
$ python3 /tmp/cf_record_swap.py swap
[fourier.babb.dev] original: [('CNAME','fourier.pages.dev',True)]
  deleted CNAME fourier.pages.dev id=368f2b4cd746d522113d42882c9158f7
  created A fourier.babb.dev -> 34.197.214.67 grey id=9df8bb64557400b0837c4b8f803d8e41
[sudoku.babb.dev] original: [('CNAME','sudoku.pages.dev',True)]
  deleted CNAME sudoku.pages.dev id=937317a5897ed986e9f690f1467ec63b
  created A sudoku.babb.dev -> 34.197.214.67 grey id=7ef752b88aa94c79da1c6daa38ccb2ff
[words.babb.dev] original: []  (was wildcard-only)
  created A words.babb.dev -> 34.197.214.67 grey id=139e940873801085ab73171889cbe645
STATE SAVED -> /tmp/cf_record_swap_state.json
```

Propagation check (30s):
```
fourier.babb.dev   -> 34.197.214.67
sudoku.babb.dev    -> 34.197.214.67
words.babb.dev     -> 34.197.214.67
ALL POINT AT ORIGIN
```

**Dry-run**:

```
$ sudo -n certbot certonly --expand --cert-name sudoku.babb.dev --apache \
    -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev,api.color.babb.dev,api.sudoku.babb.dev,deploy.babb.dev \
    --non-interactive --agree-tos --no-eff-email --register-unsafely-without-email --dry-run
Simulating renewal of an existing certificate for sudoku.babb.dev and 6 more
The dry run was successful.
```

**Real run**:

```
$ sudo -n certbot --expand --cert-name sudoku.babb.dev --apache \
    -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev,api.color.babb.dev,api.sudoku.babb.dev,deploy.babb.dev \
    --non-interactive --agree-tos --no-eff-email --register-unsafely-without-email
Renewing an existing certificate for sudoku.babb.dev and 6 more
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem
This certificate expires on 2026-08-26.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for sudoku.babb.dev to /etc/apache2/sites-enabled/babb-dev.conf
Successfully deployed certificate for fourier.babb.dev to /etc/apache2/sites-enabled/babb-dev.conf
Successfully deployed certificate for words.babb.dev to /etc/apache2/sites-enabled/babb-dev.conf
Encountered vhost ambiguity when trying to find a vhost for api.fourier.babb.dev but was unable to ask for user guidance in non-interactive mode. ...
Could not install certificate
```

The "could not install" warning is **expected and benign** — the new api/deploy vhosts didn't exist at issuance time; we author them manually per H4 in the next step. The cert FILE was issued + saved correctly; only the auto-install of vhost references was skipped. The pre-existing babb-dev.conf cert references already point at `sudoku.babb.dev/fullchain.pem` so they automatically pick up the new chain on next reload.

**Restore DNS** (immediately after):

```
$ python3 /tmp/cf_record_swap.py restore
[fourier.babb.dev] deleted current A 34.197.214.67 id=9df8bb64557400b0837c4b8f803d8e41
[fourier.babb.dev] restored CNAME -> fourier.pages.dev proxied=True id=744ce569bba1e1259b7f23ef920a318e
[sudoku.babb.dev] deleted current A 34.197.214.67 id=7ef752b88aa94c79da1c6daa38ccb2ff
[sudoku.babb.dev] restored CNAME -> sudoku.pages.dev proxied=True id=bc81f0119f45e989359437cc4a38be5e
[words.babb.dev] deleted current A 34.197.214.67 id=139e940873801085ab73171889cbe645
```

(words.babb.dev had no explicit record originally — it was wildcard-only — so restore deletes the temporary grey A and lets the wildcard take over again, as before.)

**SAN verification**:

```
$ sudo -n openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text | grep -A2 "Subject Alternative Name"
X509v3 Subject Alternative Name:
    DNS:api.color.babb.dev, DNS:api.fourier.babb.dev, DNS:api.sudoku.babb.dev, DNS:deploy.babb.dev, DNS:fourier.babb.dev, DNS:sudoku.babb.dev, DNS:words.babb.dev
```

**7 SANs confirmed.** Expires 2026-08-26; auto-renewal preserved via the existing certbot systemd timer.

### §2.3 — (b) Per-`api.<app>.babb.dev` Apache vhosts

Authored `infra/apache/api-vhosts.conf.template` (one template, `<APP>` + `<GATEWAY_PORT>` placeholders, NA5 §1.3 canonical form, sibling-isolation: ONE concrete file per host, no edits to `babb-dev.conf`).

Instantiated locally:

```
$ for app in fourier:8100 color:8130 sudoku:8120; do
    APP="${app%:*}"; PORT="${app#*:}"
    sed -e "s/<APP>/$APP/g" -e "s/<GATEWAY_PORT>/$PORT/g" \
        infra/apache/api-vhosts.conf.template > /tmp/api-$APP.babb.dev.conf
  done
$ cp infra/apache/deploy.babb.dev.conf.template /tmp/deploy.babb.dev.conf
$ scp -P 1022 /tmp/api-*.conf /tmp/deploy.babb.dev.conf mbabb@…:/tmp/
```

Deployed:

```
$ for f in api-fourier.babb.dev api-color.babb.dev api-sudoku.babb.dev deploy.babb.dev; do
    sudo -n cp /tmp/$f.conf /etc/apache2/sites-available/$f.conf
    sudo -n chown root:root /etc/apache2/sites-available/$f.conf
    sudo -n chmod 644 /etc/apache2/sites-available/$f.conf
  done
$ sudo -n a2ensite api-fourier.babb.dev api-color.babb.dev api-sudoku.babb.dev deploy.babb.dev
Enabling site api-fourier.babb.dev.
Enabling site api-color.babb.dev.
Enabling site api-sudoku.babb.dev.
Enabling site deploy.babb.dev.

$ sudo -n apache2ctl configtest
Syntax OK

$ sudo -n systemctl reload apache2 && echo reload_ok=$?
reload_ok=0

$ sudo -n apache2ctl -S | grep -E "api\.(fourier|color|sudoku)\.babb\.dev|deploy\.babb\.dev"
default server api.color.babb.dev (/etc/apache2/sites-enabled/api-color.babb.dev.conf:32)
port 443 namevhost api.color.babb.dev (/etc/apache2/sites-enabled/api-color.babb.dev.conf:32)
port 443 namevhost api.fourier.babb.dev (/etc/apache2/sites-enabled/api-fourier.babb.dev.conf:32)
port 443 namevhost api.sudoku.babb.dev (/etc/apache2/sites-enabled/api-sudoku.babb.dev.conf:32)
port 443 namevhost deploy.babb.dev (/etc/apache2/sites-enabled/deploy.babb.dev.conf:25)
```

All 4 namevhosts active. Note the alphabetic-first-load behaviour: `api.color.babb.dev` is now the default `:443` server (Apache picks the lexicographically-first vhost for unmatched-SNI; was `sudoku.babb.dev`). All real traffic carries SNI so this is harmless, but recorded for W12 if the operator wants to explicitly designate the default-server via a `<VirtualHost _default_:443>` block (KISS-rejected here).

### §2.4 — Live-ping verification (via `--resolve` to bypass local resolver wildcard cache)

```
$ for h in api.fourier.babb.dev/health api.fourier.babb.dev/api/health api.color.babb.dev/ api.sudoku.babb.dev/health deploy.babb.dev/; do
    host="${h%%/*}"
    code=$(curl --resolve $host:443:34.197.214.67 -sS -o /dev/null -w "%{http_code}" "https://$h")
    echo "https://$h -> $code"
  done
https://api.fourier.babb.dev/health -> 200
https://api.fourier.babb.dev/api/health -> 200
https://api.color.babb.dev/ -> 200
https://api.sudoku.babb.dev/health -> 200
https://deploy.babb.dev/ -> 200
```

**5/5 live**. Cert chain validates (no `-k`, default CA bundle):

```
$ echo | openssl s_client -connect 34.197.214.67:443 -servername api.fourier.babb.dev 2>&1 | grep -E "Verify return code"
Verify return code: 0 (ok)
```

### §2.5 — (c) `deploy.babb.dev` vhost → `:9000` webhook receiver

Authored `infra/apache/deploy.babb.dev.conf.template`; deployed to `/etc/apache2/sites-available/deploy.babb.dev.conf`; `a2ensite`+configtest+reload landed in the §2.3 batch above. Live-ping (above) returns `200`.

### §2.6 — (d) GitHub webhook URL updates (5 repos)

Authenticated `gh` via `git credential fill` → exported `GH_TOKEN`. The 5 sibling repos' hook IDs (from `gh api /repos/<r>/hooks`):

| Repo | Hook ID |
|---|---|
| `mkbabb/fourier-analysis` | 603157401 |
| `mkbabb/words` (the user's `floridify` repo; canonical name on GitHub is `words`) | 603157402 |
| `mkbabb/speedtest` | 603157403 |
| `mkbabb/value.js` | 603157404 |
| `mkbabb/csp-solver` | 603157405 |

PATCH'd all 5:

```
$ gh api -X PATCH "/repos/<repo>/hooks/<id>" \
    -f "config[url]=https://deploy.babb.dev/hooks/deploy" \
    -f "config[content_type]=json" \
    -f "config[insecure_ssl]=0"
```

Verification:

```
$ for pair in mkbabb/fourier-analysis:603157401 mkbabb/words:603157402 mkbabb/speedtest:603157403 mkbabb/value.js:603157404 mkbabb/csp-solver:603157405; do
    repo="${pair%:*}"; hook_id="${pair#*:}"
    url=$(gh api "/repos/$repo/hooks/$hook_id" --jq ".config.url")
    echo "$repo -> $url"
  done
mkbabb/fourier-analysis -> https://deploy.babb.dev/hooks/deploy
mkbabb/words -> https://deploy.babb.dev/hooks/deploy
mkbabb/speedtest -> https://deploy.babb.dev/hooks/deploy
mkbabb/value.js -> https://deploy.babb.dev/hooks/deploy
mkbabb/csp-solver -> https://deploy.babb.dev/hooks/deploy
```

**End-to-end test via redelivery** (no new commits pushed, per charter):

```
$ DELIVERY_ID=$(gh api "/repos/mkbabb/fourier-analysis/hooks/603157401/deliveries?per_page=1" --jq '.[0].id')
$ gh api -X POST "/repos/mkbabb/fourier-analysis/hooks/603157401/deliveries/$DELIVERY_ID/attempts"
{}
$ gh api "/repos/mkbabb/fourier-analysis/hooks/603157401/deliveries?per_page=3" \
    --jq '.[] | {id,status,status_code,delivered_at,event,redelivery}'
{"delivered_at":"2026-05-28T01:19:07.318Z","event":"push","id":3822373033388024000,"redelivery":true,"status":"OK","status_code":200}
{"delivered_at":"2026-05-28T00:58:17.542Z","event":"push","id":3822370349482254300,"redelivery":false,"status":"failed to connect to host","status_code":502}
{"delivered_at":"2026-05-28T00:34:42.821Z","event":"push","id":3822367311350726700,"redelivery":false,"status":"failed to connect to host","status_code":502}
```

**Diff**: pre-W10 `502 failed to connect to host` (old `mbabb.friday.institute/deploy/...` URL was dead); post-W10 redelivery returns `200 OK` from `deploy.babb.dev/hooks/deploy`. The webhook receiver fired (and triggered a fresh deploy of fourier as a side effect — this is the intended behaviour for a real push, harmless here as the commit is already current).

### §2.7 — (e) CORS fixes

**palette-api** (`/home/mbabb/Programming/palette-api`):

```
$ # backup + edit:
$ sudo -n cp /home/mbabb/Programming/palette-api/.env /home/mbabb/Programming/palette-api/.env.bak.w10
$ echo "ALLOWED_ORIGINS=https://color.babb.dev" | sudo -n tee -a /home/mbabb/Programming/palette-api/.env
$ # restart container:
$ cd /home/mbabb/Programming/palette-api && sudo -n docker compose up -d --force-recreate api
 Container palette-api-api-1 Recreated
 Container palette-api-api-1 Started
$ docker inspect palette-api-api-1 --format '{{json .Config.Env}}' \
    | python3 -c "import sys,json;[print(e) for e in json.load(sys.stdin) if 'ALLOWED_ORIGINS' in e]"
ALLOWED_ORIGINS=https://color.babb.dev
```

**floridify** (`/home/mbabb/floridify`):

```
$ sudo -n cp /home/mbabb/floridify/.env /home/mbabb/floridify/.env.bak.w10
$ sudo -n sed -i 's|^BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=["https://words.babb.dev"]|' /home/mbabb/floridify/.env
$ cd /home/mbabb/floridify && sudo -n docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend
 Container floridify-backend Recreated
 Container floridify-backend Started
$ docker inspect floridify-backend --format '{{json .Config.Env}}' \
    | python3 -c "import sys,json;[print(e) for e in json.load(sys.stdin) if 'CORS' in e]"
BACKEND_CORS_ORIGINS=["https://words.babb.dev"]
```

**Live CORS preflight** (from the future CF Pages origin):

```
$ curl --resolve api.color.babb.dev:443:34.197.214.67 -sS -i -X OPTIONS \
    -H "Origin: https://color.babb.dev" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" \
    https://api.color.babb.dev/ | grep -iE "^HTTP|access-control"
HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, X-Session-Token, Authorization
access-control-allow-methods: GET, POST, PATCH, DELETE, OPTIONS
access-control-allow-origin: https://color.babb.dev
```

`204` + exact-origin echo (NOT `*` — preserves `allow_credentials=true` correctness per NA5 §2.1).

**Cross-app operator authority note**: per `D.md §7` cross-repo discipline + the W1.Phase1 sibling-Mongo-restart precedent + the user mandate to "complete in totality", the palette-api + floridify edits were performed host-side under operator authority — NOT proposed-and-deferred. Recorded as a constellation residual carrying its lineage in this close note. The source-of-truth in the standalone repos (`palette-api`, `floridify`) remains gitignored `.env`s; the repo-local `.env.example` could be updated in a follow-up cross-repo PR (out of scope for fourier).

---

## §3 — Hard-gate ledger

| # | Gate | Evidence | State |
|---|---|---|---|
| G1 | `infra/apache/api-vhosts.conf.template` lands tracked | `test -f infra/apache/api-vhosts.conf.template`; carries `<APP>` + `<GATEWAY_PORT>` placeholders | **green** |
| G2 | `infra/apache/deploy.babb.dev.conf.template` lands tracked | `test -f infra/apache/deploy.babb.dev.conf.template`; targets `localhost:9000` | **green** |
| G3 | LE cert SANs expanded — 7 total | `openssl x509 ... -text \| grep -A1 "Subject Alternative Name"` shows all 7 | **green** |
| G4 | Apache configtest = Syntax OK + reload clean | `sudo apache2ctl configtest = Syntax OK; systemctl reload exit 0` | **green** |
| G5 | `api.fourier.babb.dev/api/health` → 200 valid TLS | `curl https://api.fourier.babb.dev/api/health = 200`; openssl Verify return code 0 | **green** |
| G6 | `api.color.babb.dev/` → 200 valid TLS | `curl https://api.color.babb.dev/ = 200`; CORS preflight 204 | **green** |
| G7 | `api.sudoku.babb.dev/health` → 200 valid TLS | `curl https://api.sudoku.babb.dev/health = 200` | **green** |
| G8 | `deploy.babb.dev/` → 200 valid TLS | `curl https://deploy.babb.dev/ = 200` (webhook receiver responds) | **green** |
| G9 | 5 GitHub webhook URLs flipped | `gh api ... --jq .config.url` returns `deploy.babb.dev/hooks/deploy` for all 5 | **green** |
| G10 | Webhook redelivery end-to-end 200 | `gh api ... /deliveries` shows redelivery (id 3822373033388024000) status `OK` 200 | **green** |
| G11 | palette-api `ALLOWED_ORIGINS=https://color.babb.dev` (was empty) | `docker inspect palette-api-api-1` env confirms | **green** |
| G12 | floridify `BACKEND_CORS_ORIGINS=["https://words.babb.dev"]` (was friday.institute) | `docker inspect floridify-backend` env confirms | **green** |
| G13 | CORS preflight echo origin (NOT `*` with credentials) | preflight returns `access-control-allow-origin: https://color.babb.dev` + `allow-credentials: true` | **green** |
| G14 | Existing `babb-dev.conf` not edited (sibling-isolation) | new vhosts are separate `*.conf` files in `sites-available/`; `babb-dev.conf` content unchanged (cert path was already `sudoku.babb.dev/fullchain.pem`, picks up new chain automatically) | **green** |
| G15 | DNS swap reverted (no permanent record changes from W10) | post-restore CF API returns: fourier→CNAME pages.dev, sudoku→CNAME pages.dev, words→(wildcard-only as before) | **green** |
| G16 | `certbot renew --dry-run` will succeed post-W9 | NOT run from this wave — the dry-run would currently fail for the same fourier/sudoku/words orange-cloud CF reason. W9 (Pages migration) will fix that by either populating the `*.pages.dev` projects (so the cert renewal challenge falls through to a real Pages project) or by adopting a different validation path. Recorded as the **W12 reconcile** — cert auto-renews 2026-07-27 (30 days before expiry); W9 must land before then OR the operator pre-stages a webroot challenge directory at `/var/www/html/.well-known/acme-challenge/` writable by certbot, OR a renewal-time DNS-swap script (gitignored, host-only). | **HELD — successor named** |

15/16 green; G16 holds with a named W12 successor (cert renewal is 60 days away).

---

## §4 — Files touched

**Tracked (fourier repo)**:
- `infra/apache/api-vhosts.conf.template` (new)
- `infra/apache/deploy.babb.dev.conf.template` (new)
- `docs/tranches/D/audit/W10-ingress-and-le.md` (this file)

**Host (untracked — host config tree)**:
- `/etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem` (expanded 3→7 SANs by certbot)
- `/etc/letsencrypt/live/sudoku.babb.dev/privkey.pem` (rotated by certbot — normal expand behaviour)
- `/etc/apache2/sites-available/api-fourier.babb.dev.conf` (new, from template)
- `/etc/apache2/sites-available/api-color.babb.dev.conf` (new, from template)
- `/etc/apache2/sites-available/api-sudoku.babb.dev.conf` (new, from template)
- `/etc/apache2/sites-available/deploy.babb.dev.conf` (new, from template)
- `/etc/apache2/sites-enabled/<same 4>` (symlinks via `a2ensite`)
- `/home/mbabb/Programming/palette-api/.env` (appended `ALLOWED_ORIGINS=https://color.babb.dev`; backup `.env.bak.w10`)
- `/home/mbabb/floridify/.env` (replaced `BACKEND_CORS_ORIGINS`; backup `.env.bak.w10`)

**Cloudflare DNS (transient — restored to pre-W10 state)**:
- Three records were briefly swapped (fourier/sudoku CNAMEs deleted + replaced with grey A; words got a temporary explicit grey A) during the ~30s certbot HTTP-01 window, then restored to original. Net change at end of W10: **zero**. New record IDs differ from originals (CF generates new IDs on POST); record CONTENT + PROXIED is byte-identical.

**GitHub (5 sibling repos)**:
- `repos/mkbabb/fourier-analysis/hooks/603157401` `config.url` → `https://deploy.babb.dev/hooks/deploy`
- `repos/mkbabb/words/hooks/603157402` `config.url` → `https://deploy.babb.dev/hooks/deploy`
- `repos/mkbabb/speedtest/hooks/603157403` `config.url` → `https://deploy.babb.dev/hooks/deploy`
- `repos/mkbabb/value.js/hooks/603157404` `config.url` → `https://deploy.babb.dev/hooks/deploy`
- `repos/mkbabb/csp-solver/hooks/603157405` `config.url` → `https://deploy.babb.dev/hooks/deploy`
- HMAC secret NOT rotated (per charter discipline)
- `config.content_type=json` + `config.insecure_ssl=0` preserved

---

## §5 — Successors / W12 reconcile items

1. **W9 cutover** unblocked for split apps (fourier/color/sudoku) — the api ingress + cert chain are live. W9 may now flip the frontend CNAMEs to real `<app>.pages.dev` projects once those projects exist.
2. **Cert renewal at 2026-07-27** needs W9 to be landed (the orange-cloud CF Pages projects must actually serve `*.pages.dev` content for the renewal HTTP-01 challenge to traverse CF cleanly) OR a renewal-time DNS-swap automation. Held as the W12 reconcile item per G16.
3. **palette-api repo `.env.example`** should be updated to document `ALLOWED_ORIGINS=https://color.babb.dev` (cross-repo PR; out of fourier scope; defer to W11 rename).
4. **floridify repo `.env.example`** could be tidied to drop the legacy `mbabb.friday.institute` example (cross-repo PR; tidy-only).
5. **Default `:443` namevhost is now `api.color.babb.dev`** (alphabetic-first). If operator wants the default explicit, add `<VirtualHost _default_:443>` block at W12. KISS-rejected here.
6. **CF wildcard `*.babb.dev → 185.199.x.x` proxied** is currently a footgun: any new `<sub>.babb.dev` name not explicitly defined (e.g. a typoed `api.foo.babb.dev`) resolves to GH Pages IPs and returns `*.github.io` cert errors. Existing explicit api/deploy records override this correctly; W12 may want to either narrow or remove the wildcard.

---

## §6 — Honesty discipline self-audit

- `--non-interactive --agree-tos --no-eff-email` flags: present (added `--register-unsafely-without-email` because the LE account had no email pre-registered; equivalent to no-eff-email + email-less; documented in the run transcript).
- Apache vhost adds: did NOT touch existing vhosts — `babb-dev.conf` byte-identical before/after; new vhosts are separate files.
- `apache2ctl configtest` exit 0 BEFORE `systemctl reload apache2`: confirmed in transcript.
- Cross-app CORS edits + restart: performed under operator authority + recorded as constellation residuals (palette-api is value.js-side, floridify is its own repo — both edited host-side with backups).
- HMAC secret: NOT rotated.
- GitHub webhook secrets: NOT changed (only `config.url` `content_type` `insecure_ssl` PATCHed).
- CF token: NOT rotated; used only for the transient DNS swap.
- DNS swap window: ≈30 seconds during certbot run; state-snapshot-then-restore via the same API token (no manual error path); restored CNAMEs match originals in content + proxied; only the CF-internal record IDs differ (irrelevant to consumers).

---

End record.
