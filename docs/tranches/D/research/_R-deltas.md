# D-Wα — RATIFIED-WITH-DELTA consolidated record

**Status**: draft (Wα.b append). **Authored**: 2026-05-27. **Authority shape**: each delta names (a) the lane it surfaced under, (b) the substrate citation it deviates from / sharpens, (c) the load-bearing impact on a downstream wave (Wχ probe or implementation wave), (d) the KISS-ordered remediation. No delta is silently absorbed.

---

## Wα.b appended deltas

### Δ-R3.1 — palette-api host directory has no `.git/`

- **Lane**: R3 (ingress + domain-naming + palette-api provenance).
- **Substrate**: NA1 §272-276 ("palette uses rsync `deploy.sh`") + CONSTELLATION-DEPLOY §2 row 2 ("standalone rsync, not `value.js/api/`"). The wave-spec probe text in `waves/Walpha.md §3.3` presupposed a `.git/config` exists ("is it a fresh clone of `value.js`, a checkout of `value.js/api/` only, an rsync from the value.js repo, or a divergent copy?"); live evidence shows there is no `.git/` directory at all.
- **Evidence** (pasted):
  ```
  $ ls /home/mbabb/Programming/palette-api/.git/config
  ls: cannot access '/home/mbabb/Programming/palette-api/.git/config': No such file or directory
  ```
- **Impact**: **None on Wχ probes** — the W11 rename plan is unchanged (it touches the host directory + compose project + package name, NOT `value.js/api/`). **Impact on R3 lane authority**: the lane's "palette-api provenance answer" sharpens from "standalone repo" to "standalone rsync target with no host-side git" — more honest, not contradictory.
- **Remediation** (KISS): record the sharpened answer in `research/README.md` R3 lane (already in `_lane-R3.md`); no other action. The W11 rename touches a plain directory, no `git mv` involved.

### Δ-R3.2 — `default-ssl.conf` `/words` is a 301 redirect, not a `:8001|:3001` path-proxy

- **Lane**: R3.
- **Substrate**: NA5 §0 records floridify front at `mbabb.friday.institute`; the wave-spec probe text in `waves/Walpha.md §3.3` described `default-ssl.conf` as having "/words → :8001|:3001 path-proxies" which is loose. Live evidence shows `RewriteRule ^/words(/.*)?$ https://mbabb.friday.institute/words$1 [R=301,L]` — a 301 redirect, not a path-proxy.
- **Evidence** (pasted):
  ```
  # Floridify (Dictionary) — redirect to mbabb.friday.institute
  RewriteEngine On
  RewriteRule ^/words(/.*)?$ https://mbabb.friday.institute/words$1 [R=301,L]
  ```
- **Impact**: **None.** Substrate (NA5 §0) was correct that `mbabb.friday.institute` is the floridify front; only the wave-spec probe-text simplification was loose. RATIFIED-AS-IS for the underlying ingress claim.
- **Remediation**: nothing — recording for the record.

### Δ-R4.1 — `certbot-dns-cloudflare` plugin NOT installed on host

- **Lane**: R4 (constellation matrix + pilot-then-rollout).
- **Substrate**: CONSTELLATION-DEPLOY §6 line 81 ("`certbot --expand --apache --dns-cloudflare -d api.<app>.babb.dev …`") + NA5 §158-§175 (the W10 origin-LE step) + NA6 §117 (α′.W5 close binds the token + certbot pattern). All presume `dns-cloudflare` is installed as a DNS-01 challenge channel.
- **Evidence** (pasted):
  ```
  $ certbot plugins 2>&1 | head -20
  * apache ...
  * dns-route53 ...
  * standalone ...
  $ certbot plugins 2>&1 | tail -30
  * webroot ...
  $ dpkg -l | grep -i cloudflare 2>&1 | head -5
  (empty)
  ```
  Available plugins: `apache`, `dns-route53`, `standalone`, `webroot`. No `dns-cloudflare`. The `certbot` binary at `/usr/local/bin/certbot` is a non-apt install (probably pip or snap), so the `dns-cloudflare` plugin install channel matches the certbot channel — `pip install certbot-dns-cloudflare` or `snap install certbot-dns-cloudflare`.
- **Impact**: **load-bearing on W10**. The `certbot --expand --apache --dns-cloudflare -d api.<app>.babb.dev` invocation cannot run as written. **Impact on Wχ**: Wχ-P5 (the DNS + ingress probe per `D.md §3` Wχ row) should add an adversarial check that names the certbot plugin install path explicitly.
- **Remediation** (KISS-ordered):
  1. **Path A (matches CONSTELLATION-DEPLOY §6 most faithfully)**: at W10, before the `certbot --expand` invocation, run the install for the matching certbot channel: `pip install certbot-dns-cloudflare` (if pip-installed) or `snap install certbot-dns-cloudflare` (if snap-installed). Verify channel via `head -1 /usr/local/bin/certbot` (the shebang or wrapper).
  2. **Path B (no new plugin install)**: fall back to HTTP-01 via `--apache` or `--webroot`. Since `api.<app>.babb.dev` is grey-cloud (CONSTELLATION-DEPLOY §3.2 — DNS-only A → `34.197.214.67`), the origin serves the `/.well-known/acme-challenge/` HTTP challenge directly, no DNS-01 round-trip needed. This is the smaller-mechanism path; it also removes the W10 dependency on the CF token's `DNS:Edit` perm for the cert path (the perm is still needed for the DNS-as-code script at W8, just not for certbot).
  3. **Path C** (gold-plating, REJECT): install `acme.sh` instead. NA6 §1 explicitly rejects swapping the existing certbot for an alternative — KISS prefers extending the existing tool.
  **Decision: Path A or Path B at W10's discretion; Path B (HTTP-01 via Apache/webroot) is the smaller mechanism and is the recommended default unless a wildcard cert is needed (which would force DNS-01).**

### Δ-R4.2 — wave-spec probe text for grammar misaligned with NA1 substrate

- **Lane**: R4.
- **Substrate**: NA1 §258 explicitly records "Not a git repo at the prod path (`git remote -v` → fatal). Served directly by Apache (`grammar.babb.dev.conf`) with `FallbackResource /index.html` for SPA routing. Active dev happens elsewhere (the bbnf-lang repo); only the build artifact lives here." The wave-spec probe text in `waves/Walpha.md §3.4` expected `git -C /var/www/grammar log -1` to return the "dirty-master + recent activity" pattern — that wording was misaligned.
- **Evidence** (pasted):
  ```
  $ test -d /var/www/grammar && (cd /var/www/grammar && git log -1 --format='%cI %h') || echo 'grammar absent'
  grammar absent
  fatal: not a git repository (or any of the parent directories): .git
  $ ls -la /var/www/grammar/ | head -10
  drwxr-xr-x 4 mbabb mbabb   4096 Mar 25 23:55 .
  -rw-r--r-- 1 mbabb mbabb    796 Mar 25 23:55 404.html
  drwxr-xr-x 2 mbabb mbabb   4096 Mar 25 23:55 assets
  ...
  ```
- **Impact**: **None on Wχ probes or implementation waves.** Substrate (NA1 §258) is correct; only the wave-spec probe-text wording was loose. The DEFER decision for grammar is keyed on the upstream `bbnf-lang` repo's "1009 commits/14d, dirty master" state (CONSTELLATION-DEPLOY §2 row "grammar"), NOT the host's built-artifact directory.
- **Remediation**: nothing — recording for honesty. The team-lead reconcile may update the wave-spec probe text at a future revision to read `git -C ~/Programming/bbnf-lang log` (the upstream repo, not the host build dir) — but this is documentation polish, not a load-bearing fix.

---

## Wα.b summary

| Δ | Lane | Load-bearing? | Remediation owner |
|---|---|---|---|
| Δ-R3.1 (palette-api no `.git`) | R3 | No (sharpens substrate) | recorded in `_lane-R3.md` |
| Δ-R3.2 (`/words` 301 not proxy) | R3 | No (substrate correct; probe-text loose) | recording only |
| Δ-R4.1 (certbot-dns-cloudflare missing) | R4 | **YES, on W10** | W10 carries the install-or-fallback decision |
| Δ-R4.2 (grammar probe-text misaligned) | R4 | No (substrate correct; probe-text loose) | recording only |

**One load-bearing delta** (Δ-R4.1) requires W10 to add a pre-step (install plugin) or take the HTTP-01 fallback path. Three deltas are recording-only (substrate is correct; the wave-spec probe text was loose in two cases; the third sharpens substrate without contradicting it).
