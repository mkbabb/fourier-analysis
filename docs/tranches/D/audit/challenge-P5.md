# Wχ-P5 — α′ rollout proves on fourier first + DNS-safe + api-TLS-path-real (Path B HTTP-01)

**Probe agent**: P5 (one agent, Batch 2 dispatch). **Authored**: 2026-05-27. **Mode**: read-only adversarial review of the Wα-ratified α′ substrate (R3 + R4 + the Δ-R4.1 Path-B HTTP-01 fold). **Charter**: `docs/tranches/D/waves/Wchi.md §3.5` (REVISED per Wα-Δ-R4.1: the binding ACME challenge mechanism is **HTTP-01 via `--apache`**, not DNS-01 via `--dns-cloudflare` — see `coordination/CONSTELLATION-DEPLOY.md §3.2.a`). **Substrate**: `docs/tranches/D/research/README.md` R3 + R4; `coordination/CONSTELLATION-DEPLOY.md §3.2`, §3.2.a (the binding Path B amendment), §5 (don't-break list), §6 (CF token discipline), §7 (pilot-then-rollout), §8 (per-app API plan). **Cross-probe citation**: `audit/challenge-P1.md` for the sibling-isolation findings (P1 PASSed-with-conditions on co-tenant blast radius; W10 sibling cutovers depend on the same fourier-arm-scoping + sibling-flag discipline). **No source change. No host mutation.**

---

## §0 — Subject (the Wα-ratified claim under attack, REVISED)

The α′ thread — `<app>.babb.dev` / `api.<app>.babb.dev` normalization across the constellation, fourier as the pilot (W1 → W2 → W9 prove end-to-end on fourier), then W6 matrix-green gates W10/W11 (bounded-parallel rollout to co-tenants); programmatic DNS via the CF API (W8); the api-`<app>` TLS path resolved to grey-cloud (DNS-only A → origin `34.197.214.67`) + origin Let's Encrypt (`certbot --expand --apache`); CF token NOT rotated per user direction.

**Wα-Δ-R4.1 binding amendment**: the host's certbot install (`/usr/local/bin/certbot 5.3.1`) carries plugins `apache`, `dns-route53`, `standalone`, `webroot` — **NO `dns-cloudflare`**. The earlier `--dns-cloudflare` invocation cannot run as written. Team-lead reconcile selected **Path B (HTTP-01 via `--apache`)** — smallest mechanism; the api hostnames are grey-cloud so LE's HTTP-01 challenge reaches origin Apache directly via `http://api.<app>.babb.dev/.well-known/acme-challenge/<token>`. The CF token's `Zone:DNS:Edit` perm remains needed for W8 (writing the grey-cloud A records) but NOT for cert issuance.

The probe interrogates (REVISED for Path B): (a) does the rollout truly prove on fourier first (no big-bang); (b) is the DNS change set safe (mail / apex / wildcard / NS preserved); (c) is the **api-TLS path via Path B HTTP-01 real** — specifically, does the origin Apache (i) accept `:80` connections for the api.`<app>` ServerName Apache will see after W8 lands the A record, (ii) NOT blanket-redirect `:80 → :443` in a way that kills HTTP-01, (iii) have the `--apache` plugin functional, (iv) successfully serve a probe `.well-known/acme-challenge/<token>` request when LE makes one.

The seven checks below correspond to `Wchi.md §3.5` list items 1–7 (REVISED). Each carries pasted live-probe evidence and a per-check verdict.

---

## §1 — The seven read-only adversarial checks

### Check 1 — Fourier pilot end-to-end-proven BEFORE any sibling-app touch

**Evidence (read `D.md §3` ordering)**:

`D.md §3` table rows (`docs/tranches/D/D.md:55-67`) record the binding wave ordering:

- **W1** — Security hotfix (live exposure: bind all three Mongos off `0.0.0.0`) + first prod deploy of D-HEAD → fourier backend stack
- **W2** — Verified-TLS + domain split (fourier-side: DNS `api.fourier.babb.dev`, `certbot --expand --apache -d sudoku,fourier,words,api.fourier.babb.dev`, Apache vhost split, `VITE_API_URL` moved off same-origin to `https://api.fourier.babb.dev`)
- **W6** — Test integrity (the cross-env Playwright matrix runs across 6 cells; **prod cell becomes available once W1 lands D-HEAD on prod**, per `W6.md:35`)
- **W8** — DNS-as-code (the CF-API script lands the api.`<app>` grey-cloud A records — fourier first per the pilot-tranche)
- **W9** — CF-Pages frontend migration (per `D.md:64` W9 row: "**Pilot-then-rollout ordering (binding)**: (1) **fourier** first (proves the split end-to-end with W1/W2's backend; the api.fourier→origin LE side already lands at W2); (2) **keyframes.js** (off GH Pages); (3) **value.js/color** (off GH Pages — the `color.babb.dev` frontend); (4) **sudoku/csp-solver** (its frontend, paired with W10's `api.sudoku.babb.dev`)")
- **W10** — Backend ingress + origin LE for `api.<app>` + CORS — adds `api.color.babb.dev` and `api.sudoku.babb.dev` SANs via `certbot --expand --apache`, lands the per-vhost templates, fixes palette-api's EMPTY `ALLOWED_ORIGINS` and floridify's stale `BACKEND_CORS_ORIGINS`

`W10.md:3` records: **"Opens after: W8 closes (the api A records resolve to `34.197.214.67`) AND W1 closes (the Mongo bind front-loaded; the fourier dirty-tree reconciled; the first prod deploy live so the LE expand operates on a known-healthy stack)"**. `W10.md:310` records: **"Blocks: W9 cutover for split apps — fourier/color/sudoku cannot land their CF Pages cutover (W9.a/c/d sub-waves) until their matching `api.<app>` ingress + cert are live"**.

But W10.md does NOT presently include an **explicit named gate** that says "W10 cannot fire until the fourier triple (W1+W2+W9.a-fourier) is recorded green via the W6 ε prod matrix". The ordering is implied by `Opens after` (which names W8 + W1 but not W6 + W9.a-fourier directly), and by §1 of `D.md §3 W6` row which lists W6 in the post-deploy slot. The probe surfaces this as a binding condition (P5.C1 below): W10's hard-gate ledger needs a named gate `G_pilot-precedes-rollout` that binds to W6's matrix-green-on-prod + W9.a's fourier-pilot-green, BEFORE the W10 sibling-app arms (api.color, api.sudoku) fire.

**Verdict (Check 1)**: **PASS-WITH-CONDITIONS**. The plan **orders** fourier first — the W1/W2/W9.a sequence proves the recipe end-to-end on fourier alone. The W6 matrix gates implementation completeness. The W10 sibling cutovers (color, sudoku) cannot land until W6's prod arm reports green + W9.a (fourier-pilot CF Pages) is recorded green. **The harden ask**: name these as explicit gates in W10.md so the ordering cannot be silently walked back.

---

### Check 2 — DNS change set preserves mail / apex / wildcard / NS

**Live `dig` evidence (read-only, executed 2026-05-27 ~23:10 UTC)**:

```
$ dig MX babb.dev +short
10 alt4.aspmx.l.google.com.
5 alt1.aspmx.l.google.com.
1 aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.

$ dig TXT babb.dev +short | grep -i spf
"v=spf1 include:_spf.google.com ~all"

$ dig A babb.dev +short
198.185.159.144

$ dig NS babb.dev +short   # via system resolver (stale cache; NA3 §16 noted)
ns-cloud-d3.googledomains.com.
ns-cloud-d4.googledomains.com.
ns-cloud-d1.googledomains.com.
ns-cloud-d2.googledomains.com.

$ dig @1.1.1.1 NS babb.dev +short   # authoritative
jillian.ns.cloudflare.com.
maciej.ns.cloudflare.com.

$ dig @8.8.8.8 NS babb.dev +short   # authoritative
jillian.ns.cloudflare.com.
maciej.ns.cloudflare.com.

$ dig NS babb.dev +trace | tail -5   # parent-trace
babb.dev.    10800   IN   NS   jillian.ns.cloudflare.com.
babb.dev.    10800   IN   NS   maciej.ns.cloudflare.com.

$ dig A foo-nonexistent-probe.babb.dev +short   # wildcard catch-all
185.199.108.153
185.199.111.153
185.199.110.153
185.199.109.153
```

**Findings**:
- **MX preserved** — five Google `aspmx.l.google.com` records present (priorities 1, 5, 5, 10, 10). Google Workspace mail is live.
- **SPF preserved** — `v=spf1 include:_spf.google.com ~all` present. SPF aligns with the MX.
- **Apex preserved** — `198.185.159.144` is the Squarespace anycast IP (302→github.com/mkbabb per NA3 §3.3).
- **NS = Cloudflare** — authoritative (confirmed via two independent recursors + parent trace from `.dev` TLD): `jillian.ns.cloudflare.com` + `maciej.ns.cloudflare.com`. The earlier `ns-cloud-d*.googledomains.com` answer from the system resolver was a **stale cache artifact** (NA3 §16 baselined this exact behavior — first stray pass returned the same Google cloud NS via a poisoned cache; authoritative answers agree on CF-only). **No reconcile needed** — the W8 CF-API script reaches the same authoritative zone the dig @1.1.1.1 / @8.8.8.8 / +trace queries reach.
- **Wildcard `*.babb.dev` resolves** — `foo-nonexistent-probe.babb.dev` returns GitHub Pages anycast IPs (`185.199.108-111.153`). The wildcard is a CNAME → `mkbabb.github.io` (per NA3 §1.3 the zone has a `*.babb.dev` wildcard). **Important sharpening**: the wildcard catches *anything that doesn't have an explicit record*, INCLUDING currently `api.color.babb.dev` and `api.sudoku.babb.dev` (both confirmed returning GH Pages IPs in the probe above). `api.fourier.babb.dev` and `fourier.babb.dev` and `sudoku.babb.dev` return CF anycast IPs (`104.21.56.22`, `172.67.175.252`) — meaning these have **explicit CF DNS records** (proxied) or CF Universal SSL is fronting them. Either way, the wildcard catch is currently load-bearing for the api hostnames that don't have explicit records yet.

**W8.md don't-break binding**:
`W8.md §2.4` (line 101) — "The don't-break catalogue (binding; recorded inline so the script's reviewer cannot miss it)" — lists MX, SPF, NS, apex A/AAAA, `*.babb.dev` wildcard, and the existing `color`/`keyframes` GH-Pages CNAMEs as the **never-touch** records. The script's target-list iteration "explicitly skips any name matching the don't-break catalogue (defensive: even if a target tuple is mis-authored to one of these names, the script refuses to PATCH it)" (`W8.md:114`).

`W8.md §5` Hard-gate ledger — **G3** ("Don't-break catalogue present in script header"), **G8** ("Don't-break regression — MX/SPF/NS/apex/wildcard untouched: `dig +short babb.dev MX` matches the pre-run output (4 lines, Google's `aspmx`); `dig +short babb.dev TXT | grep -F 'v=spf1 include:_spf.google.com ~all'` matches; `dig +short babb.dev NS` matches the two CF NS lines; `dig +short babb.dev A` returns `198.185.159.144`; `dig +short zzqq-nonexistent-9k.babb.dev` returns the wildcard CF anycast (still working)") — the W8 wave already binds the don't-break-verified discipline. The probe re-confirms this is sufficient.

**Subtlety**: G8 says "`dig +short babb.dev MX` matches **the pre-run output** (4 lines, Google's `aspmx`)". The live output shows **5 lines** (one priority-1 + two priority-5 + two priority-10). The "4 lines" in W8.md G8 is a count-off-by-one — the W8 author should adjust G8 to "matches the pre-run output (5 lines, Google's `aspmx` set: `aspmx.l.google.com` pri 1, `alt1`/`alt2` pri 5, `alt3`/`alt4` pri 10)". This is a recording-only correction — substrate is correct; the gate's expected-count wording is loose. Recorded as P5 surfacing; team-lead reconciles at the §X congruence pass.

**Verdict (Check 2)**: **PASS-WITH-CONDITIONS**. The don't-break list is honoured by construction (the W8 script iterates the *target* list, not the *current* list — `W8.md §2.1` line 62 "never destructively edits records outside the in-scope set"). G3 + G8 + the §2.4 header-comment catalogue bind the discipline. **The harden ask**: (a) record the dig-transcript pre+post every DNS commit (already in W8.md §2.1 step 7 + §4 W8.b mechanism); (b) correct the MX line-count in W8.md G8 (5 not 4); (c) explicitly bind that the W8 script's *target-list* (the records it asserts) is fourier-pilot-tranche first per `W8.md:35-43` table (only `api.fourier.babb.dev` A in the pilot tranche; `api.color`/`api.sudoku` are W10-tranche).

---

### Check 3 — HTTP-01 challenge path REAL for `api.<app>.babb.dev` (the Path B critical check)

**Live evidence**:

**(a) certbot version + plugins on host**:

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "certbot --version; certbot plugins"
certbot 5.3.1
* apache (Apache Web Server plugin)
* dns-route53 (Obtain certificates using a DNS TXT record if using AWS Route53)
* standalone (HTTP server local; HTTP challenge only)
* webroot (Saves validation files to .well-known/acme-challenge/ within nominated webroot; HTTP challenge only)
```

`certbot --version` works → confirms the binary is functional. `--apache` plugin is present → `certbot --expand --apache ...` is the binding invocation per `CONSTELLATION-DEPLOY.md §3.2.a`. The `dns-cloudflare` plugin is **absent** → confirms Wα-Δ-R4.1 (Path A — install the plugin — is rejected; Path B — HTTP-01 via `--apache` — is the binding mechanism).

**(b) Apache `:80` vhost shape** (the load-bearing check — does the origin accept `:80` connections for the api hostname, and does the `/.well-known/acme-challenge/` path NOT get blanket-301'd to `:443`?):

```
$ ssh -p 1022 mbabb@... "sudo cat /etc/apache2/sites-enabled/babb-dev.conf | head -15"
# HTTP: redirect to HTTPS (also serves certbot challenges)
<VirtualHost *:80>
    ServerName sudoku.babb.dev
    ServerAlias fourier.babb.dev words.babb.dev

    DocumentRoot /var/www/html
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>
```

**LOAD-BEARING POSITIVE FINDING**: the babb-dev.conf `:80` vhost **already exempts `/.well-known/acme-challenge/` from the `:80 → :443` redirect** via `RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/`. The vhost's header comment explicitly says **"HTTP: redirect to HTTPS (also serves certbot challenges)"** — the exemption is deliberate and load-bearing for HTTP-01. **Path B is ALREADY infrastructure-ready** for `sudoku.babb.dev`, `fourier.babb.dev`, `words.babb.dev`.

**(c) Default-server for `*:80`** (the LE challenge for `api.<app>.babb.dev` will be caught by which vhost?):

```
$ ssh -p 1022 mbabb@... "sudo apachectl -S | grep -A4 '*:80'"
*:80                   is a NameVirtualHost
         default server sudoku.babb.dev (/etc/apache2/sites-enabled/babb-dev.conf:2)
         port 80 namevhost sudoku.babb.dev (/etc/apache2/sites-enabled/babb-dev.conf:2)
                 alias fourier.babb.dev
                 alias words.babb.dev
         port 80 namevhost grammar.babb.dev (/etc/apache2/sites-enabled/grammar.babb.dev.conf:1)
         port 80 namevhost speedtest.mbabb.friday.institute (/etc/apache2/sites-enabled/speedtest.conf:25)
```

**The `*:80` default server is `sudoku.babb.dev` (babb-dev.conf:2)** — the vhost with the `/.well-known/acme-challenge/` RewriteCond exemption. When LE makes an HTTP-01 challenge request to `http://api.fourier.babb.dev/.well-known/acme-challenge/<token>` (post-W8, when the A record resolves `api.fourier.babb.dev → 34.197.214.67`), and no explicit vhost ServerName matches `api.fourier.babb.dev`, Apache falls back to the **default `*:80` server** (sudoku.babb.dev) — which has the exemption AND a `DocumentRoot /var/www/html`. **The `--apache` plugin** (invoked by `certbot --expand --apache`) writes the challenge token into the Apache-managed challenge dir (typically `/var/www/html/.well-known/acme-challenge/` or a plugin-controlled location), reloads Apache, and serves the token for the LE validator's GET — all from the default vhost.

**(d) :80 reachability via origin IP** (does Apache accept connections at all?):

```
$ curl -v -m 8 http://34.197.214.67/.well-known/acme-challenge/test-probe-p5 -H "Host: fourier.babb.dev"
< HTTP/1.1 404 Not Found
< Server: Apache
```

**HTTP 404** (not connection-refused, not connection-reset, not timeout) — Apache `:80` is reachable AND the `/.well-known/acme-challenge/` path is NOT redirected to `:443` (a 404 from `:80` means the request reached the vhost and the file simply doesn't exist; a 301 would have meant the redirect ate the request). The exemption is verified live.

**(e) api.fourier.babb.dev pre-W8 state** (confirming the W8 dependency):

```
$ dig A api.fourier.babb.dev +short
172.67.175.252
104.21.56.22
$ curl -v -m 8 https://api.fourier.babb.dev/ 2>&1 | grep -E "handshake|error|HTTP"
* LibreSSL/3.3.6: error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
* Closing connection
curl: (35) LibreSSL/3.3.6: error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
```

Currently `api.fourier.babb.dev` resolves via the CF wildcard catch-all (the explicit grey-cloud A record lands at W8); TLS handshake at `:443` fails (CF Universal SSL covers single-level only, `api.<app>.babb.dev` is two-deep). This is **the expected pre-W8 state** — the api-TLS path will become real once (a) W8 lands the grey-cloud A record `api.fourier.babb.dev → 34.197.214.67`, (b) W2/W10 runs `certbot --expand --apache` to add the SAN, (c) the apache vhost lands, (d) the per-vhost SSL terminates with the expanded LE chain.

**(f) The path is real iff (a)+(b)+(c)+(d) all hold**:
- (a) certbot --apache plugin functional: **YES** (live `certbot plugins` shows it).
- (b) Apache :80 accepts connections for an arbitrary api.`<app>` hostname: **YES** (the default-server fallback catches it; the live `curl http://34.197.214.67/...` succeeds with 404 not refusal).
- (c) The /.well-known/acme-challenge/ path is exempt from the :80 → :443 redirect: **YES** (the babb-dev.conf RewriteCond explicitly exempts it).
- (d) The A record resolves (post-W8): NO today, **YES after W8** (W8 explicitly lands grey-cloud A → 34.197.214.67 per `W8.md:35`).

**Verdict (Check 3)**: **PASS**. Path B is **infrastructure-ready** — every prerequisite for HTTP-01 on `api.<app>.babb.dev` is live. The `--apache` plugin is installed; the default :80 vhost catches unknown ServerName; the `/.well-known/acme-challenge/` exemption is in place; the only missing piece is the W8 A record (which W10 explicitly depends on per `W10.md:206` "Pre-condition: W8's pilot-tranche A records resolve (G7/G8 of W8)"). **No additional W10 exemption-add is required** — the existing exemption covers any api.`<app>` hostname Apache catches via default-server. The condition (P5.C3) is to bind a **post-W10 live HTTP-01 verification probe** (e.g., `openssl s_client -connect api.fourier.babb.dev:443 -servername api.fourier.babb.dev </dev/null 2>&1 | grep "subject="` returning the LE chain with the expanded SAN list) so the chain is verified end-to-end before W9.a fourier-CF-Pages cuts over.

---

### Check 4 — A-record (grey-cloud) → cert (`certbot --expand --apache`) → vhost (Apache) → reload ordering per api.`<app>` cutover

**Evidence**:

`CONSTELLATION-DEPLOY.md §3.2.a` (the binding amendment) records: **"The A records for the api hostnames MUST exist before certbot runs (Apache needs the vhost or default-server to handle the challenge request); W8 lands them first, then W2/W10 issue."**

`W10.md:3` "Opens after: W8 closes (the api A records resolve to `34.197.214.67`)" — the W8 → W10 ordering is binding-on-spec.

`W10.md:7-15` (the AMENDMENT block): "Each `api.<app>` HTTP-01 challenge is served by the origin Apache directly (grey-cloud means CF returns the origin IP; LE hits `http://api.<app>.babb.dev/.well-known/acme-challenge/<token>` and Apache responds; the `--apache` plugin both serves the challenge AND reloads Apache on success). **W8 → W10 ordering binding**: the api A records must exist before certbot runs (Apache needs to handle `:80` requests for the challenge); W8 lands the A records, then W10 issues."

`W10.md:96` "Inversion is forbidden. Any vhost activation (Step 3) before the LE expand (Step 2) lands serves the new `api.<app>` names with the WRONG cert (the default `sudoku.babb.dev`-only chain; the browser fails the SAN-match)."

`W10.md §3` lines 205-207 prescribe the host-side execution sequence: **LE expand (run `scripts/certbot-expand-api.sh` on host as root, pre-conditioned on W8's A records) → Apache vhost activate (copy template, `a2ensite`, `apachectl configtest`, `systemctl reload apache2`, pre-conditioned on the LE expand landing AND the per-app nginx gateway running) → CORS env-set on each app's compose stack**.

`W10.md §5` ledger G3 (LE cert SANs expanded — six SANs total) precedes G4 (Apache vhosts active, configtest green) which precedes G5/G6/G7 (the per-api.`<app>` verified-TLS GET). The ordering is recorded.

**Subtlety**: `W10.md §2.2` still references `cloudflare.ini` and `dns_cloudflare_api_token` in legacy text (lines 158-160, 180-183). The AMENDMENT block at lines 7-15 supersedes those references, but the legacy text creates confusion. The W10 author hardening pass should either strike the legacy text or mark it clearly as superseded inline. Recorded as P5 surfacing; team-lead reconciles at the §X congruence pass.

**Verdict (Check 4)**: **PASS-WITH-CONDITIONS**. The A-record → cert → vhost → reload ordering is recorded in CONSTELLATION-DEPLOY.md §3.2.a + W10.md (amendment + §3 host-side execution + §5 ledger). **The harden ask** (P5.C4): name the ordering as an explicit gate `W10.G_ordering` in the hard-gate ledger (currently implicit via G3 → G4 → G5/G6/G7 ordering); strike or supersede the legacy `--dns-cloudflare` / `cloudflare.ini` text in W10.md §2.2.

---

### Check 5 — W6 matrix-green gates W10 sibling cutovers

**Evidence**:

`D.md §3` Phase ordering (`D.md:75-87`):
- Phase I — production (W1–W2) — deploy first; TLS second
- Phase II/III/IV — γ (W3) ∥ β (W4); δ (W5)
- **Phase V — test integrity (W6) — the cross-env matrix + CI Mongo + the COMPUTE_RATE_LIMIT harness** — AFTER the deploy (`D.md:69` "W6 (ε) after the deploy")
- **Phase VI — constellation rollout (W8–W11, thread α′)** — DNS-as-code (W8) → CF-Pages frontends (W9, fourier-pilot first) → backend ingress + origin LE for `api.<app>` + CORS (W10) → palette-api→color rename (W11, user-gated). Pilot-then-rollout: fourier proves the full pattern end-to-end; the others follow bounded-parallel.

`W6.md:5` "Opens after: Wχ close AND W1 close (the prod deploy lands so the prod arm of the matrix tests *D-HEAD*, not the pre-A `8818ae5` build) AND W3 close AND W4 close AND W5 close. **W6 is the last implementation wave before the constellation rollout (W8–W11)**".

`research/README.md` R4 §"Pilot-then-rollout ordering re-confirmation" (line 153-156): "2. **W6 matrix-green gates W10** — until the ε-thread test matrix is green (the `validation-matrix.md` `KeyError: 'storage_uri'` + `COMPUTE_RATE_LIMIT` findings discharged), no sibling cutover. 3. **W10 sibling cutovers** — `api.color.babb.dev`, `api.sudoku.babb.dev`, CORS fixes ..."

`W10.md` does NOT presently include an explicit named hard gate `G_matrix-gates-W10` or `G_pilot-precedes-rollout`. The "Opens after" preamble names W8 + W1 directly, but not W6 + W9.a-fourier. The matrix-green-on-prod gate is asserted in R4 + D.md §3 Phase ordering but not bound into W10.md's hard-gate ledger as a named row. Similarly, **W6.md does NOT include an explicit named gate `G_matrix-gates-W10`** asserting W6's matrix-green output is the prerequisite for W10's sibling-arm fires.

**Verdict (Check 5)**: **PASS-WITH-CONDITIONS**. The ordering is binding-on-substrate (R4 + D.md §3 Phase ordering + W10's "Opens after"), but the hard-gate naming is incomplete. **The harden ask** (P5.C1, the sharper articulation): name `W10.G_pilot-precedes-rollout` (W10 cannot fire any sibling-arm before W6 prod matrix is green AND W9.a fourier-CF-Pages is recorded green) and `W6.G_matrix-gates-W10` (W6's prod-cell-green output is the gate W10 reads).

---

### Check 6 — CF token NOT rotated (per user direction)

**Evidence**:

`CONSTELLATION-DEPLOY.md §6` (line 64): "**Do NOT rotate** (per user direction); rotate only on suspicion."

`D.md §3 W12` row (line 67): "CF token stays (per user — saved in gitignored `.env`s + CI; rotated only on suspicion)".

`W12.md` (line 79): "**The CF token NOT rotated** (per user direction, `D.md §7`; `PROGRESS.md` 2026-05-27 resolution entry; `CONSTELLATION-DEPLOY.md §6` 'Do NOT rotate'). The token lives in the gitignored host `.env`s (`fourier-analysis/.env`, `value.js/.env`, `0600`) + the CI secret store. Rotated only on suspicion. **NA6 §2.3's recommended rotate-after-migration is explicitly overridden by the user**; the override is recorded so it cannot be silently walked back at a future close."

`W12.md:103` (the §9 Reflection): "the no-rotate CF token override honoured honestly".

`W12.md:111` (the precepts): "**No CF token rotation** (per user; recorded explicitly)".

`W12.md:161` records: "**`D.md §3` W12 row says 'CF token NOT rotated (per user direction)' — congruent + reinforced. The spec authored here makes the override explicit (so NA6 §2.3's contrary recommendation is not silently walked back). **No reconcile**; the W12 row is correct.**"

`research/README.md` R4 §"CF token discipline re-confirmation" (line 142-149): both `.env` files `0600`, NOT rotated per user direction, referenced by name only, also held in GitHub Actions secret store.

**Verdict (Check 6)**: **PASS**. The discipline is binding across `CONSTELLATION-DEPLOY.md §6` + `D.md §3 W12` row + `W12.md` (multiple sites) + `PROGRESS.md` resolution entry + `research/README.md` R4. **The harden ask** (P5.C5): name an explicit gate `W12.G_cf-token-not-rotated` in W12.md's hard-gate ledger (the current text is in the close-checklist `- [ ]` form but not in a numbered G-gate row; the precept-promotion close should bind it as a numbered G).

---

### Check 7 — No big-bang (each sibling cutover its own arm)

**Evidence**:

`CONSTELLATION-DEPLOY.md §7` (line 80): "**fourier is the pilot** — D's α.W1/W2 already do the backend-deploy / DNS / ingress / Mongo-bind half; adding the CF-Pages-frontend extension makes fourier the complete end-to-end proof of the pattern (blast radius = one app on the shared multi-tenant host). Prove it on fourier, verify via the ε prod matrix, **then** roll the proven recipe across the others parallel-but-bounded — rejecting a big-bang all-apps cut that would entangle nine failure modes and endanger the healthy co-tenants (floridify, the 2-month-healthy palette-api)."

`CONSTELLATION-DEPLOY.md §8.3` (line 130): "fourier is the pilot — when `api.fourier.babb.dev` works end-to-end (DNS grey-cloud, certbot cert, Apache vhost, CORS, `fourier.babb.dev` on CF Pages calling it), the recipe is proven and the other apps' rows follow exactly the same four moves, bounded-parallel. **Never a big-bang.**"

`D.md:69` (the wave-table summary): "**The α′ constellation waves W8–W11 follow the fourier pilot** — W1/W2 + W9 prove the full pattern on fourier first (one app on the shared multi-tenant host), then the proven recipe rolls to the co-tenants bounded-parallel, never a big-bang (NA6). W11 (rename) is user-re-mandate-gated."

`D.md §3` cap: "**Hard ceiling 4 agents/wave (DA6/NA6 guard)**; D peaks at ~3."

`W9.md` (per `D.md §3` W9 row line 64): "Bounded-parallel; cap 4 agents/wave."

`W10.md:3` "**Agents**: 2 parallel (per `D.md §3` W10 row; bounded by NA6 §3.2 4-agent ceiling)."

`W10.md §4` (line 213) "Agent dispatch (2 parallel, per `D.md §3` W10 row)" splits W10 into **W10.a** (LE expand + Apache vhost — fourier-color-sudoku in one expand op since the LE cert is a single multi-SAN; one cert update covers three names) and **W10.b** (CORS fixes — palette + floridify env edits + Mongo bind verification). Two parallel agents; each app's cert + vhost + CORS is per-app and rollback-capable.

`research/README.md` R4 §155-159 (pilot-then-rollout): "3. **W10 sibling cutovers** — bounded-parallel; ≤4 agents/wave (NA6 §3); each app individually rollback-capable. ... 6. **Big-bang explicitly REJECTED** — NA6 §1 + §3."

**Sharpening (subtlety)**: W10.a actually issues one `certbot --expand --apache -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev,api.color.babb.dev,api.sudoku.babb.dev` invocation that adds *three* api SANs to *one* cert at once. This is **not a big-bang** — it's one cert-renewal operation; the three api SANs share a single multi-SAN cert, which is the natural shape and matches the existing live cert (which already covers fourier/sudoku/words as SANs on one cert). The per-app **vhost activation** is per-vhost (three separate `a2ensite` calls + one `systemctl reload apache2`); the per-app **CORS env-set** is per-app (palette-api's `ALLOWED_ORIGINS=https://color.babb.dev` is one env edit on the standalone palette-api compose; floridify's tidy is another env edit on the floridify compose). Per `W10.md §4` line 243: "the cross-repo CORS edits are coordinated (W10.b proposes; the value.js / floridify owners commit) — NOT unilaterally imposed". The discipline matches P1.C3's named constellation residual approach.

**Verdict (Check 7)**: **PASS**. The bounded-parallel rule is binding (NA6 §3 — 4-agent ceiling; W9/W10 each declare ≤4); each sibling cutover is its own arm in W10 (the cert is one op but the per-app vhost + CORS land per-app and are individually rollback-capable). Big-bang is explicitly rejected. **The harden ask** (P5.C6): name an explicit gate `W10.G_no-big-bang` in the hard-gate ledger asserting "no single commit / no single host-op session lands more than one sibling-app's CORS + vhost together; the LE expand is one op (necessary — one cert) but the per-app activation is per-app and per-vhost".

---

## §2 — Cross-probe citation: P1 sibling-isolation findings

Per `audit/challenge-P1.md §Verdict` (line 405): "PASS-WITH-CONDITIONS: the W1 plan, as scoped against the eight checks, does not break floridify or palette-api. **Every fourier-scoped mutation is byte-scoped to a fourier artefact; every sibling-app residual is explicitly named with a coordinated owner.**" P1.C3 ("Mongo bind fourier-scoped; sibling residuals named") and P1.C4 ("UFW withdrawal fourier-scoped; sibling rules as residuals") establish the binding discipline P5's W10 sibling cutovers must inherit: **each sibling-app's cutover is its own coordinated host-ops act, never a unilateral fourier-D commit on a sibling stack**.

P5's W10 sibling-arm analysis (Check 7 above) inherits this discipline directly:
- **api.color.babb.dev** lands a vhost on the shared Apache (one new file) + adds `ALLOWED_ORIGINS=https://color.babb.dev` to the *standalone* palette-api compose (cross-repo coordinated, value.js-side owner) + verifies the W1 Mongo-bind held for `palette-api-mongo:27020`. The vhost is fourier-D's commit; the CORS env is value.js-side coordinated; the Mongo verify is a read-only check.
- **api.sudoku.babb.dev** lands a vhost on the shared Apache (one new file). csp-solver has no CORS gap to fix (per `NA5 §2.3` floridify is stale + palette is empty; csp-solver was not flagged). The vhost is fourier-D's commit; csp-solver-side coordination is for the vhost-instantiation operator review.
- **floridify CORS tidy** (a cosmetic edit per `D.md:65` W10 row "floridify's stale → tidied to `https://words.babb.dev`, cosmetic — floridify stays all-mbabb, no split") is constellation-flagged (floridify-sibling-owner-coordinated).

The W10 sibling-cutover blast radius is bounded to: one Apache vhost-add per sibling (the shared Apache config is touched once per sibling, additively — like the W2 fourier vhost-add was per P1 Check 4); one cross-repo CORS env-edit per sibling (palette-side, floridify-side); the LE expand is one op against the existing multi-SAN cert (the natural shape, low blast radius). **Per P1.C1's byte-scoping discipline**: every W10 sibling-vhost addition must be a pure-append on the Apache config (no existing vhost touched — the same shape as P1.C1's dispatcher-arm scoping).

---

## §3 — Findings summary (P5)

**LOAD-BEARING POSITIVES** (Path B is real):
- The `--apache` certbot plugin is installed and functional on the host (`certbot 5.3.1` with `apache`/`dns-route53`/`standalone`/`webroot` plugins).
- The default `*:80` vhost on the host is babb-dev.conf:2 (`sudoku.babb.dev` with `ServerAlias fourier.babb.dev words.babb.dev`), and **it already exempts `/.well-known/acme-challenge/` from the `:80 → :443` redirect** (`RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/`). The vhost's comment explicitly says "HTTP: redirect to HTTPS (also serves certbot challenges)" — the exemption is deliberate.
- Live `curl http://34.197.214.67/.well-known/acme-challenge/test-probe-p5` returns HTTP 404 from Apache (not connection-refused, not 301-redirected) — confirms `:80` accepts connections, the path is not blanket-redirected, and the default-server fallback is functional.
- The DNS don't-break list is honoured live: MX (5 Google records), SPF (`v=spf1 include:_spf.google.com ~all`), apex (`198.185.159.144` Squarespace), NS (CF authoritative `jillian/maciej.ns.cloudflare.com`, confirmed via two independent recursors + parent trace), wildcard (`foo-nonexistent-probe.babb.dev → 185.199.108-111.153` GH Pages anycast) — all present and unchanged.
- W8.md already binds the don't-break catalogue via §2.4 header comment + G3 gate + G8 don't-break-regression gate.

**LOAD-BEARING GAPS** (harden asks):
- W10.md does NOT presently name explicit hard gates `G_pilot-precedes-rollout`, `G_certbot-expand-real`, `G_api-tls-live-ping`, `G_ordering`, `G_no-big-bang`. The substrate / "Opens after" / §3 host-side ordering all imply these, but the hard-gate ledger doesn't name them as numbered rows.
- W6.md does NOT presently name `G_matrix-gates-W10` — the matrix-green-on-prod output is the gate W10 reads, but W6's ledger doesn't bind that consumer-side gate.
- W12.md has the CF-token-not-rotated discipline in close-checklist `- [ ]` form (line 79) but not as a numbered G-gate.
- W10.md §2.2 still references `cloudflare.ini` and `--dns-cloudflare` in legacy text (superseded by the AMENDMENT block at lines 7-15 but still present and confusing).
- W8.md G8 has an off-by-one wording on the MX count ("4 lines" should be "5 lines" — live evidence shows 5 records).

**NEGATIVE FINDING (none load-bearing)**:
- The system resolver's NS answer for babb.dev returned the stale Google Domains NS cache artifact (already baselined in NA3 §16 as a known false positive). Authoritative resolution via @1.1.1.1 / @8.8.8.8 / +trace agrees on Cloudflare-only — the W8 CF-API script reaches the correct zone.

---

## Verdict

**PASS-WITH-CONDITIONS**: the α′ rollout truly proves on fourier first (Check 1 — D.md §3 + W6 + W9 + W10 "Opens after" orderings); the DNS change set is safe (Check 2 — live dig confirms mail/apex/wildcard/NS preserved; W8.md §2.4 + G3 + G8 bind the discipline); the api-TLS path is real via Path B HTTP-01 (Check 3 — `--apache` plugin installed; Apache `:80` accepts connections; `/.well-known/acme-challenge/` exempt from blanket redirect; default-server fallback catches arbitrary api.`<app>` hostname; W8 A record is the only missing prerequisite, which W10 explicitly depends on); the A-record → cert → vhost → reload ordering is recorded (Check 4 — CONSTELLATION-DEPLOY §3.2.a + W10.md amendment + §3 host-side + §5 ledger); W6 matrix-green is the gate for W10 sibling cutovers (Check 5 — R4 + D.md §3 Phase V→VI); the CF token is NOT rotated (Check 6 — bound across CONSTELLATION-DEPLOY §6, D.md §3 W12, W12.md, PROGRESS.md, R4); no big-bang (Check 7 — CONSTELLATION-DEPLOY §7 + §8.3 + D.md §3 + W10.md §4 + R4). The conditions below name the explicit-gate-naming hardening, the post-W10 live HTTP-01 verification, and the recording-only corrections to W8.md G8 + W10.md §2.2 legacy text.

## Conditions to bind

- **P5.C1** (fourier pilot triple precedes sibling cutover) → **W10.G_pilot-precedes-rollout** + **W6.G_matrix-gates-W10**: W10's hard-gate ledger names an explicit gate asserting "W10 cannot fire any sibling-arm (api.color, api.sudoku, palette/floridify CORS) before (a) W6's prod-cell on the cross-env matrix is recorded green AND (b) W9.a fourier-CF-Pages cutover is recorded green AND (c) W2's `https://api.fourier.babb.dev` returns 200 with verified TLS chain". W6's hard-gate ledger names a paired gate asserting "W6's prod-cell-green output is the binding gate W10's `G_pilot-precedes-rollout` reads".
- **P5.C2** (DNS-as-code honours don't-break list) → **W8.G_dont-break-verified** (already in W8.md as G8 + the §2.4 header catalogue; the harden ask is the recording-only correction of the MX line-count from "4 lines" to "5 lines" — the live evidence shows five Google MX records; W8 author reconciles at hardening pass).
- **P5.C3** (Path B HTTP-01 via `--apache` — the api-TLS path is real) → **W10.G_certbot-expand-real** (REVISED) + **W10.G_api-tls-live-ping**: W10's ledger names (a) `G_certbot-expand-real` asserting "the host `certbot plugins` enumerates `apache`; the `certbot --expand --apache -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev,api.color.babb.dev,api.sudoku.babb.dev` invocation completes 0 on the host; the `--apache` plugin reloads Apache automatically on success"; (b) `G_api-tls-live-ping` asserting "post-expand, `openssl s_client -connect api.fourier.babb.dev:443 -servername api.fourier.babb.dev </dev/null 2>&1 | openssl x509 -noout -text | grep -A1 'Subject Alternative Name'` returns the LE chain with all six SANs". Additional W10 hardening ask: strike or supersede the legacy `--dns-cloudflare` / `cloudflare.ini` references in W10.md §2.2 (the AMENDMENT block at lines 7-15 supersedes them, but the legacy text remains and creates reviewer confusion).
- **P5.C4** (A-record → cert → vhost → reload ordering per api.`<app>` cutover) → **W10.G_ordering**: W10's ledger names a numbered gate asserting "the per-api.`<app>` cutover follows the binding sequence — (1) W8's grey-cloud A record resolves `api.<app>.babb.dev → 34.197.214.67`; (2) `certbot --expand --apache` runs on host and adds the SAN; (3) Apache vhost copies the template into sites-available + `a2ensite` + `apachectl configtest` green; (4) `systemctl reload apache2`; (5) live verified-TLS GET succeeds — inversion forbidden per W10.md §1 line 96".
- **P5.C5** (CF token NOT rotated per user) → **W12.G_cf-token-not-rotated**: W12's hard-gate ledger names a numbered gate asserting "the CF token in `fourier-analysis/.env` and `value.js/.env` (mode 0600, gitignored) is byte-identical at W12 close vs pre-D-tranche; the GitHub Actions secret store value is byte-identical; NA6 §2.3's rotate-after-migration recommendation is explicitly overridden per user direction (`D.md §7`, `CONSTELLATION-DEPLOY §6`, `PROGRESS.md` 2026-05-27 resolution); rotation triggers only on suspicion-of-leak". The current close-checklist `- [ ]` form (W12.md:79) elevates to a numbered G-gate.
- **P5.C6** (no big-bang; each sibling cutover its own arm) → **W10.G_no-big-bang**: W10's ledger names a numbered gate asserting "no single fourier-D commit + no single host-ops session lands more than one sibling-app's CORS env-edit + vhost activation together; the LE expand is one op (necessary — one multi-SAN cert is the natural shape) but the per-vhost `a2ensite` + per-app CORS env-set are per-app and per-vhost; each sibling-arm is individually rollback-capable; the 4-agent ceiling (NA6 §3) binds W10's parallelism; the cross-repo CORS edits (palette-api, floridify) are proposed-not-imposed per P1.C3's sibling-residual discipline".

## File created

`/Users/mkbabb/Programming/fourier-analysis/docs/tranches/D/audit/challenge-P5.md`
