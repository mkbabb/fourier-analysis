## R4 — constellation matrix + pilot-then-rollout ordering

### Verdict

RATIFIED-WITH-DELTA: the `certbot-dns-cloudflare` plugin is **NOT installed** on the host. CONSTELLATION-DEPLOY §6 §8 + NA5 §158-§175 + NA6 §117 all presume `certbot --expand --apache --dns-cloudflare -d api.<app>.babb.dev ...` for the W10 origin-LE step (DNS-01 challenge via the CF token's `DNS:Edit` perm). The live `certbot plugins` output enumerates only `apache`, `dns-route53`, `standalone`, `webroot` — no `dns-cloudflare`. W10 therefore carries an additional pre-step (install `python3-certbot-dns-cloudflare` on the host) before the `certbot --expand` invocation can run; alternatively W10 can fall back to the `webroot`/`apache` HTTP-01 challenge for `api.<app>.babb.dev` since the api hostnames are grey-cloud (the origin IP serves the challenge directly), removing the DNS-01 dependency entirely. Either path is honest; the install-the-plugin path matches CONSTELLATION-DEPLOY §6 most faithfully. Substrate authority unchanged — the delta is a load-bearing missing-dependency that W10 must address explicitly.

The constellation matrix itself (4 compose projects + LE cert SAN + keyframes.js not-on-host + grammar static-not-git) RATIFIES-AS-IS against NA1/NA4/CONSTELLATION-DEPLOY §2.

### Authority

- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` §2 (the 7-app constellation table), §137 (Apache vhost layout), §144–145 (path-proxy + grammar static), §257–258 (grammar = bbnf-lang, "Not a git repo at the prod path"), §272–276 (per-app deploy mechanisms).
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA2-cf-pages-recipe.md` (the wrangler recipe).
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA3-dns-plan.md` (the programmatic CF-API approach + the don't-break list).
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA6-guard-wave-structure.md` §2 (credential discipline), §3 (the new-wave set), §4 (the pilot-then-rollout argument), §111-§117 (the Wα-R4 + α′.W1-W5 sequence).
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` §2 (binding constellation table), §3.2 (TLS path), §6 (CF token discipline + `certbot --expand --apache --dns-cloudflare`), §7 (wave set), §8 (per-backend four-move recipe).

### Live re-probe results

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "docker compose ls -a 2>&1 | head -10"
NAME                STATUS              CONFIG FILES
csp-solver          running(3)          /var/www/csp-solver/docker-compose.yml,/var/www/csp-solver/docker-compose.prod.yml
floridify           running(4)          /home/mbabb/floridify/docker-compose.yml,/home/mbabb/floridify/docker-compose.prod.yml
fourier-analysis    running(4)          /var/www/fourier-analysis/docker-compose.yml,/var/www/fourier-analysis/docker-compose.prod.yml
palette-api         running(3)          /home/mbabb/Programming/palette-api/compose.yaml
```

(Confirms exactly the 4 compose projects (csp-solver, floridify, fourier-analysis, palette-api) NA1 §64 + CONSTELLATION-DEPLOY §2 expects. Speedtest absent from compose-ls (off to CF Pages, NA2). No new compose project appeared since the audit. RATIFIED-AS-IS.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "sudo ls /etc/letsencrypt/live/ 2>&1 || ls /etc/letsencrypt/live/ 2>&1"
README
grammar.babb.dev
mbabb.friday.institute
speedtest.mbabb.friday.institute
sudoku.babb.dev
```

(Confirms the `sudoku.babb.dev` cert directory exists (the shared cert covering the fourier/sudoku/words SANs); also visible: `mbabb.friday.institute`, `speedtest.mbabb.friday.institute`, and `grammar.babb.dev`. The `grammar.babb.dev` cert is present — NA1 §137 records the `grammar.babb.dev.conf` + `-le-ssl.conf` vhost pair. Cert inventory matches substrate.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "sudo openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text 2>&1 | grep -A2 'Subject Alternative Name'"
            X509v3 Subject Alternative Name: 
                DNS:fourier.babb.dev, DNS:sudoku.babb.dev, DNS:words.babb.dev
            X509v3 Certificate Policies:
```

(SAN set is exactly `{fourier, sudoku, words}.babb.dev` — RATIFIED-AS-IS against CONSTELLATION-DEPLOY §3.2's "the live `/etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem` cert (which already covers fourier/sudoku/words as SANs)". W10's `certbot --expand` plan can extend this SAN set to include `api.fourier.babb.dev`, `api.color.babb.dev`, etc.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "test -d /home/mbabb/Programming/keyframes.js && (cd /home/mbabb/Programming/keyframes.js && git rev-parse HEAD) || echo 'keyframes.js not on host'"
keyframes.js not on host
```

(Confirms keyframes.js has NO host-side checkout — its GH Pages provenance is purely upstream-repo-driven, no host-side artifact to migrate. CONSTELLATION-DEPLOY §2 ("keyframes.js → fully CF Pages") substrate RATIFIED-AS-IS — the migration touches only the GH-Actions workflow + the CNAME flip, no host work.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "test -d /var/www/grammar && (cd /var/www/grammar && git log -1 --format='%cI %h') || echo 'grammar absent'"
grammar absent
fatal: not a git repository (or any of the parent directories): .git
```

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "ls -la /var/www/grammar/ 2>&1 | head -15"
total 192
drwxr-xr-x 4 mbabb mbabb   4096 Mar 25 23:55 .
drwxr-xr-x 6 root  root    4096 Mar 10 04:06 ..
-rw-r--r-- 1 mbabb mbabb    796 Mar 25 23:55 404.html
drwxr-xr-x 2 mbabb mbabb   4096 Mar 25 23:55 assets
-rw-r--r-- 1 mbabb mbabb 169559 Mar 25 23:55 bbnf-icon.png
drwxr-xr-x 2 mbabb mbabb   4096 Mar 25 23:55 img
-rw-r--r-- 1 mbabb mbabb    796 Mar 25 23:55 index.html
```

(The `test -d /var/www/grammar` succeeded but `git log` failed because `/var/www/grammar` is **not a git repo** — it is a built static Vite SPA, mtime `Mar 25 23:55`. This RATIFIES the NA1 §258 substrate exactly: "Not a git repo at the prod path (`git remote -v` → fatal). Served directly by Apache (`grammar.babb.dev.conf`) with `FallbackResource /index.html`." The wave-spec probe text in `waves/Walpha.md §3.4` expected `git -C /var/www/grammar log -1` to return the "dirty-master + recent activity" pattern — that wording was misaligned with NA1's already-recorded "not a git repo" fact. **Substrate is right; the probe text was loose.** The DEFER decision (CONSTELLATION-DEPLOY §2 row "grammar = DEFER (1009 commits/14d, dirty master)") is keyed on the **upstream `bbnf-lang` repo**, not the host's built-artifact directory — which is consistent with NA1 §258's "Active dev happens elsewhere (the bbnf-lang repo); only the build artifact lives here."  DEFER verdict for grammar holds.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "which certbot; certbot plugins 2>&1 | head -20"
/usr/local/bin/certbot

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
* apache
Description: Apache Web Server plugin
...
* dns-route53
Description: Obtain certificates using a DNS TXT record (if you are using AWS
Route53 for DNS).
...
* standalone
Description: Runs an HTTP server locally which serves the necessary validation
files under the /.well-known/acme-challenge/ request path. Suitable if there is
no HTTP server already running. HTTP challenge only (wildcards not supported).
...

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "certbot plugins 2>&1 | tail -30"
...
* webroot
Description: Saves the necessary validation files to a
.well-known/acme-challenge/ directory within the nominated webroot path.
...
```

(Available plugins: `apache`, `dns-route53`, `standalone`, `webroot`. **No `dns-cloudflare`.** `certbot` binary at `/usr/local/bin/certbot` confirms CONSTELLATION-DEPLOY §3.2's "already-installed certbot (`/usr/local/bin/certbot`)". This is the W10 load-bearing delta.)

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "dpkg -l | grep -i cloudflare 2>&1 | head -5"
(empty output)
```

(`dpkg -l | grep -i cloudflare` returns no rows — `python3-certbot-dns-cloudflare` is NOT installed via apt. Since the certbot binary at `/usr/local/bin/certbot` is a non-apt installation (probably `pip install certbot` or `snap`), the install path for `dns-cloudflare` may be `pip install certbot-dns-cloudflare` or `snap install certbot-dns-cloudflare`, not `apt`. W10 must verify the matching install channel for the existing certbot install and add the `dns-cloudflare` plugin via that channel. Alternative: fall back to HTTP-01 via `--apache` or `--webroot` since `api.<app>.babb.dev` is grey-cloud — the challenge can be served directly from the origin without needing DNS-01.)

### CF token discipline re-confirmation

The CF API token (`CLOUDFLARE_API_TOKEN`) is **properly disciplined** at both repos per NA6 §2 + CONSTELLATION-DEPLOY §6:

```
$ cd /Users/mkbabb/Programming/fourier-analysis && git check-ignore -v .env 2>&1
.gitignore:50:.env	.env
$ cd /Users/mkbabb/Programming/fourier-analysis && stat -f '%Sp' .env
-rw-------
```

```
$ cd /Users/mkbabb/Programming/value.js && git check-ignore -v .env 2>&1
.gitignore:7:.env	.env
$ cd /Users/mkbabb/Programming/value.js && stat -f '%Sp' .env
-rw-------
```

Both `.env` files are:
- **gitignored** — `git check-ignore -v` reports `.gitignore:50` (fourier) and `.gitignore:7` (value.js).
- **mode 0600** — `stat -f '%Sp'` returns `-rw-------` for both (owner-only RW; no group/other access).
- **NOT rotated** per user direction (CONSTELLATION-DEPLOY §6 line 45: "Do NOT rotate (per user direction); rotate only on suspicion.").
- **Referenced by name** (`CLOUDFLARE_API_TOKEN`) — never echoed in shell history, logs, commits, or chat.
- The token is also held in the GitHub Actions secret store for the CI publishes (NA6 §2 + CONSTELLATION-DEPLOY §6).

**RATIFIED-AS-IS** for the credential-discipline rule. Authority: NA6 §2 (smallest-honest-mechanism, the four-perm minimum) + CONSTELLATION-DEPLOY §6 (gitignored `.env`s + `0600` + `git check-ignore` verified + not-rotated).

### pilot-then-rollout ordering re-confirmation

The pilot-then-rollout ordering per NA6 §3 + §4 + CONSTELLATION-DEPLOY §7 is **RATIFIED-AS-IS**:

1. **fourier as the pilot** — W1 (security hotfix + first prod deploy, with Mongo loopback-bind + the deploy-hook hardening) → W2 (verified-TLS + domain split + precepts promotion) → W9 (CF-Pages frontend migration for fourier ONLY, the pilot proves the recipe). The pilot proves the four facets (CF Pages frontend + `api.fourier.babb.dev` backend + programmatic DNS + Mongo loopback-bind) end-to-end on the live shared host before any sibling rolls out.

2. **W6 matrix-green** — the ε-thread test-integrity wave gates the rollout: until the local-e2e + Playwright + backend test matrix is green (the `validation-matrix.md` `KeyError: 'storage_uri'` + `COMPUTE_RATE_LIMIT` findings discharged), no sibling cutover lands.

3. **W10 sibling cutovers** — `api.color.babb.dev` + `api.floridify.babb.dev` (if applicable per NA4 — words/floridify stays all-mbabb so no split) + CORS allow-list fixes (palette empty → populate, floridify stale → re-scope) + `certbot --expand` to extend SANs. Each app is small + repeatable + individually rollback-capable. Maximum 4 agents in parallel on disjoint repos per NA6 §3's hard ceiling. NA6 §1 explicitly **REJECTS** one-agent-per-app fan-out.

4. **W11 palette-api → color rename** — user-re-mandate-gated, rides the rollout's tail (per NA6 §1(d) + CONSTELLATION-DEPLOY §7).

5. **DEFERRED: grammar** — explicit DEFER per NA6 §4 + CONSTELLATION-DEPLOY §2 row "grammar" ("1009 commits/14d, dirty master — author-coordinated quiet window, never a drive-by"). Live evidence (the upstream bbnf-lang repo is where active dev happens; the host's `/var/www/grammar` is the static build artifact) confirms the DEFER decision is keyed on upstream activity, not host-directory state.

**Big-bang explicitly REJECTED** per NA6 §1 + §3 (the per-facet smallest-honest-mechanism + the agent-budget ceiling + the brittleness-window discipline of `D.md §8`).

Authority: NA6 §3 (new-wave set, agent-ceiling) + NA6 §4 (pilot-then-rollout, "fourier IS the pilot") + CONSTELLATION-DEPLOY §7 (wave-numbered binding: α′.W1 = DNS-as-code, α′.W2 = CF-Pages migration, α′.W3 = per-app backend ingress, α′.W4 = rename, α′.W5 = close).
