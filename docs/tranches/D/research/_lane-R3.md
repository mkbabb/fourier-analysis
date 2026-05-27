## R3 — ingress + domain-naming + palette-api provenance

### Verdict

RATIFIED-WITH-DELTA: the palette-api host directory at `/home/mbabb/Programming/palette-api/` is **NOT a git repo** at all (no `.git/` directory present) — it is a plain rsync target. This sharpens, rather than contradicts, the substrate: NA1 §272–276 explicitly records "palette uses rsync `deploy.sh`" and the W11 (palette-api → color rename) gate was already cited as the standalone host directory (CONSTELLATION-DEPLOY §2 row 2). The wave-spec probe shape in `waves/Walpha.md §3.3` ("is it a fresh clone of `value.js`, a checkout of `value.js/api/` only, an rsync from the value.js repo, or a divergent copy?") presupposed a `.git/config` existed; live state confirms the rsync option — there is no git provenance at all on the host side. Authority for the underlying answer is unchanged (NA1/NA4/CONSTELLATION-DEPLOY §2 → "standalone rsync, not `value.js/api/`"); the delta is the live evidence's exact shape (no `.git` vs presumed-git-clone). W11 plan unaffected: the rename still touches the host directory + compose project + package name, NOT `value.js/api/`.

### Authority

- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` §2 (the 14-container ledger + the 5-compose-project map), §272–276 ("palette uses rsync deploy.sh"), §45–47 (compose mounts at `/home/mbabb/Programming/palette-api`).
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA4-deployability-matrix.md` (the per-app split-vs-all-mbabb decision; the DNS-already-provisioned fact at row 0).
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA5-ingress-cors-security.md` §0 + §1 (the `api.<app>.babb.dev` recipe; the live CORS audit — palette empty + floridify stale).
- `docs/tranches/D/coordination/DOMAIN-NAMING.md` (the `<app>.babb.dev`/`api.<app>.babb.dev` convention + the open palette-api provenance question, now answered).
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` §2 row 2 (palette-api provenance), §3.2 + §8 (the grey-cloud + origin-LE TLS path).

### Live re-probe results

```
$ dig +short api.fourier.babb.dev
104.21.56.22
172.67.175.252
```

(Resolves via the `*.babb.dev` Cloudflare wildcard safety-net; no dedicated A record yet — the W10 `api.<app>.babb.dev` provisioning is still pending. The CF anycast IPs are the wildcard's catch-all, not a provisioned grey-cloud A → origin. Confirms NA4 §0's "DNS already provisioned for the split" only loosely — the wildcard exists, the record-set for `api.fourier.babb.dev` does not.)

```
$ dig +short color.babb.dev
185.199.110.153
185.199.111.153
185.199.109.153
185.199.108.153
$ dscacheutil -q host -a name color.babb.dev
name: color.babb.dev
ip_address: 185.199.108.153
ip_address: 185.199.109.153
ip_address: 185.199.111.153
ip_address: 185.199.110.153
```

(`185.199.108-111.153` is the GitHub Pages anycast set. Confirms GH Pages still fronts `color.babb.dev`; the CF Pages flip has not yet landed. NA4 §0 substrate holds.)

```
$ dig +short api.color.babb.dev
172.67.175.252
104.21.56.22
```

(Same `*.babb.dev` wildcard catch-all behaviour as `api.fourier.babb.dev` — wildcard resolves, dedicated record absent. Both confirm the wildcard-safety-net is intact and the per-`api.<app>` records remain to be cut at W8/W10.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cat /etc/apache2/sites-enabled/babb-dev.conf 2>/dev/null | head -100"
# HTTP: redirect to HTTPS (also serves certbot challenges)
<VirtualHost *:80>
    ServerName sudoku.babb.dev
    ServerAlias fourier.babb.dev words.babb.dev

    DocumentRoot /var/www/html
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

# sudoku.babb.dev — built with VITE_BASE_URL=/
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName sudoku.babb.dev
    ...
    ProxyPass / http://localhost:8120/
    ProxyPassReverse / http://localhost:8120/
</VirtualHost>

# fourier.babb.dev — built with base=/fourier/
<VirtualHost *:443>
    ServerName fourier.babb.dev
    ...
    ProxyPass / http://localhost:8100/
    ProxyPassReverse / http://localhost:8100/
</VirtualHost>

# words.babb.dev — proxied through nginx gateway
<VirtualHost *:443>
    ServerName words.babb.dev
    ...
    ProxyPass / http://localhost:8110/
    ProxyPassReverse / http://localhost:8110/
</VirtualHost>
</IfModule>
```

(Confirms `fourier.babb.dev` is the only fourier vhost on `babb-dev.conf`; no `api.fourier.babb.dev` vhost yet. Vhost layout matches NA1 §137 + §144. Sibling `sudoku.babb.dev`/`words.babb.dev` proxies to `:8120`/`:8110` confirmed.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cat /etc/apache2/sites-enabled/default-ssl.conf 2>/dev/null | head -200"
<IfModule mod_ssl.c>
    <VirtualHost _default_:443>
        ...
        ServerName mbabb.fi.ncsu.edu
        ...
        # Floridify (Dictionary) — redirect to mbabb.friday.institute
        RewriteEngine On
        RewriteRule ^/words(/.*)?$ https://mbabb.friday.institute/words$1 [R=301,L]

        # Palette / Colors API Proxy
        ProxyPass /colors/ http://localhost:8130/
        ProxyPassReverse /colors/ http://localhost:8130/

        <Location /colors/>
            ProxyPreserveHost On
            RequestHeader set X-Forwarded-Proto "https"
            RequestHeader set X-Forwarded-Port "443"
        </Location>

        # Fourier Analysis — Interactive Demo
        # Redirect /fourier (no trailing slash) to /fourier/
        RewriteEngine On
        RewriteRule ^/fourier$ /fourier/ [R=301,L]
        ProxyPass /fourier/api/ http://localhost:8100/api/
        ProxyPassReverse /fourier/api/ http://localhost:8100/api/

        ProxyPass /fourier/ http://localhost:8100/fourier/
        ProxyPassReverse /fourier/ http://localhost:8100/fourier/

        # CSP Solver → redirect to sudoku.babb.dev
        RewriteRule ^/csp-solver(/.*)?$ https://sudoku.babb.dev$1 [R=301,L]
        ...
    </VirtualHost>
</IfModule>
```

(Confirms the legacy `mbabb.fi.ncsu.edu` ingress carries `/colors/` → `:8130` (palette-api) and the `/fourier/` + `/fourier/api/` path-proxies. **Sharpening**: the `/words` route on `default-ssl.conf` is a **301 redirect** to `https://mbabb.friday.institute/words`, NOT a `:8001|:3001` path-proxy as the wave-spec probe text described. NA5 substrate is correct that `mbabb.friday.institute` is the floridify front; the wave-spec text simplification was loose.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "ls /home/mbabb/Programming/palette-api/.git/config 2>&1; cd /home/mbabb/Programming/palette-api && git remote -v 2>/dev/null; git log -1 --format='%h %cI' 2>/dev/null"
ls: cannot access '/home/mbabb/Programming/palette-api/.git/config': No such file or directory
```

(**DELTA**: no `.git/` directory exists at `/home/mbabb/Programming/palette-api/`. The host directory is a plain rsync target — there is no git provenance at all on the host side. This SHARPENS the substrate's "rsync deploy" finding into "rsync target with no host-side git" rather than contradicting it. The W11 rename plan is unchanged: the rename touches the host directory + compose project + package name, not `value.js/api/`.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "ls -la /home/mbabb/Programming/palette-api/ 2>&1 | head -30"
total 116
drwxr-xr-x  7 mbabb mbabb  4096 Mar 28 06:36 .
drwxrwxr-x 22 mbabb mbabb  4096 Feb 25 19:59 ..
-rw-r--r--  1 mbabb mbabb  6148 Mar 18 21:23 .DS_Store
-rw-r--r--  1 mbabb mbabb   161 Mar 26 02:56 .dockerignore
-rw-rw-r--  1 mbabb mbabb   238 Mar 28 06:45 .env
-rw-r--r--  1 mbabb mbabb   471 Mar 26 02:56 .env.example
-rw-r--r--  1 mbabb mbabb  4068 Mar  7 21:16 CLAUDE.md
-rw-r--r--  1 mbabb mbabb   566 Mar 26 03:43 Dockerfile
-rw-r--r--  1 mbabb mbabb  7323 Mar  7 21:15 README.md
-rw-r--r--  1 mbabb mbabb   550 Feb 26 03:55 apache-vhost.conf
-rw-r--r--  1 mbabb mbabb  3335 Mar 28 06:48 compose.yaml
-rwxr-xr-x  1 mbabb mbabb  1042 Mar 26 02:56 deploy.sh
drwxr-xr-x  2 mbabb mbabb  4096 Mar 26 02:55 mongo-init
-rw-r--r--  1 mbabb mbabb 30807 Feb 26 03:58 package-lock.json
-rw-r--r--  1 mbabb mbabb   571 Feb 25 20:25 package.json
drwxr-xr-x  2 mbabb mbabb  4096 Mar 26 03:55 scripts
drwxr-xr-x  3 mbabb mbabb  4096 Mar 26 05:05 src
drwxrwxr-x  2 mbabb mbabb  4096 Mar 28 06:45 ssl
drwxr-xr-x  2 mbabb mbabb  4096 Feb 26 06:13 test-results
-rw-r--r--  1 mbabb mbabb   482 Feb 25 20:25 tsconfig.json
```

(Confirms the live shape: source + compose + `deploy.sh` + `.env` + ssl assets — exactly the rsync-target layout. Last `.env` mtime is `Mar 28 06:45`; the host directory is alive, not a stale snapshot.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker exec palette-api-api-1 printenv ALLOWED_ORIGINS 2>&1 || echo NOT_SET"
ALLOWED_ORIGINS=
```

(Confirms the CORS allow-list is the empty string, EXACTLY as NA5 §0 headlines: "palette-api `ALLOWED_ORIGINS` is EMPTY in the live container." RATIFIED-AS-IS for the CORS finding.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker exec floridify-backend printenv BACKEND_CORS_ORIGINS 2>&1 || docker ps --format '{{.Names}}' | grep -i floridify"
["https://mbabb.friday.institute"]
```

(Confirms floridify's `BACKEND_CORS_ORIGINS` is still scoped to `https://mbabb.friday.institute` only — the legacy `friday.institute` origin, not `floridify.babb.dev` or any constellation-normalized name. NA5 §0 substrate ("stale `mbabb.friday.institute`") RATIFIED-AS-IS.)

### palette-api provenance answer

**Standalone rsync target on the host at `/home/mbabb/Programming/palette-api/`** — NOT a git repo (no `.git/` directory), NOT `value.js/api/`; deployed via the dispatcher's `mkbabb/value.js` arm which rsyncs from the `value.js` repo's `api/` subtree into the host directory, then runs `compose.yaml` locally. **Authority**: NA4 §0 + CONSTELLATION-DEPLOY §2 row 2 ("standalone rsync, not `value.js/api/`"); this re-probe sharpens "standalone repo" → "standalone rsync target with no host-side git" via the live evidence (`ls /home/mbabb/Programming/palette-api/.git/config` → `No such file or directory`). The W11 rename touches the host directory + the `palette-api` compose project + the package name, NEVER `value.js/api/`.
