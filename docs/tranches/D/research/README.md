# D — research contracts index (ratified at Wα close)

**Status**: ratified at Wα close. **Authored**: 2026-05-27 (folding the D-development audit substrate). **Authority**: this index binds the Wχ probes and the W1–W12 implementation; deviation requires re-opening Wα. **Composition**: assembled by team-lead reconcile from `_lane-R1.md` through `_lane-R4.md` + the consolidated `_R-deltas.md` (Wα.a authored R1+R2, Wα.b authored R3+R4 — parallel, file-disjoint).

**Net verdict**: two RATIFIED-AS-IS lanes (R1, R2); two RATIFIED-WITH-DELTA lanes (R3, R4). One delta (Δ-R4.1, the missing `certbot-dns-cloudflare` plugin) is **load-bearing on W10** — the team-lead reconcile folds the HTTP-01 fallback path B (the smaller-mechanism resolution) into W2/W10/CONSTELLATION-DEPLOY §6/§8. Three deltas are recording-only (substrate correct; wave-spec probe-text loose).

---

## R1 — CRUD-CONTRACT v2.0.0 design + the `palette_slug` FK contract

### Verdict
**RATIFIED-AS-IS**

### Authority
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md` — the audit lane (the ~11 divergent clauses, the live `palette-api` v2.0.0 inventory, the value.js-side I.W1–W4 sketch, the colour-lift orthogonality, the `palette_slug` FK).
- `docs/tranches/D/coordination/CRUD-COHESION.md` — the cross-repo ask doc (the two KISS relaxations, the §10 three-way close-rule).
- `docs/tranches/B/coordination/CRUD-CONTRACT.md` + `CONFORMANCE-MATRIX.md` + `CRUD-CONSTELLATION.md` — the B-era contract substrate.
- `docs/audits/runs/2026-05-27-D-audit/DA2-deferred-chronic-inventory.md` §item-6 + §γ-thread — the C4.5/C4.6 chronic-load-bearing classification.

### Live re-probe results (read-only — Wα.a, 2026-05-27)

- `value.js HEAD = 16129e0` (Tranche H close, v0.10.0, 2026-05-26) — one day older than the audit. **No advance.** The DA3 §3 ~11-clause divergence list binds verbatim.
- `palette-api v2.0.0` re-confirmed via `api/package.json`.
- `palette_slug` FK sites unchanged: `etag.py:14`, `visualization.py:119,163,177`, `web/src/lib/api.ts:41,65,73` — exact citation match.
- The v2.0.0 top-level `id` field at `value.js/api/src/format/palette.ts:18,59` re-confirmed (DA3 §5 C1.3 violation still live).
- The live ingress at `https://api.color.babb.dev/` returns a TLS handshake failure (no origin wired behind the `*.babb.dev` wildcard catch-all CF IPs) — **expected**, the api.<app> ingress is W10's work, not yet provisioned. R1 substrate is code-shape, not public-ingress reachability.
- The legacy `/colors/` path at `mbabb.fridayinstitute.net` now serves the **Sudoku/CSP Solver SPA** (HTTP 200, title `<title>Sudoku - CSP Solver</title>`). The NA5 §1 "path-proxy /colors/ → :8130 (palette-api)" claim is contradicted at the public ingress today — cross-lane R3 evidence (recorded below at R3 + as a non-load-bearing delta).

### `palette_slug` FK contract clause (the binding cross-repo artefact)

**Fourier (the FK holder) guarantees**:
- `Visualization.palette_slug: str | None` — nullable; the visualization may carry no palette association (None is the legitimate empty state).
- When non-`None`, the slug conforms to `^[a-z0-9][a-z0-9-]*$` with length ≤ 120.
- Uniqueness is **within the `visualization` document scope only** — fourier stores the slug as an *opaque foreign key*; uniqueness within the *palette space* is value.js's invariant.
- Fourier does **not** validate that the slug resolves at write time (no cross-repo round-trip on `POST /visualizations` or `PATCH /visualizations/{slug}`). The slug may become stale if the upstream palette is deleted; fourier carries this as graceful-degradation (the visualization renders with no palette, the frontend shows a "palette unavailable" affordance — not an error).
- The slug is **ETag-participating** (`etag.py:14` `_DEFAULT_FIELDS` includes `palette_slug`; a slug change rotates the visualization's ETag).
- The slug is **exposed verbatim** on `GET /visualizations/{slug}` (no enrichment, no resolve-and-inline of the palette payload) — the client fetches the palette separately.

**Value.js (the palette source-of-truth) guarantees**:
- `GET /palettes/{slug}` returns HTTP 200 with the palette envelope iff (a) the palette exists and (b) it is visible to the caller.
- Returns HTTP 404 in all other cases. Never returns 403 (visibility-denied palettes are indistinguishable from missing).
- The slug in the URL is the **stable identity** — no hash, no version suffix, no DB `_id` in the path.
- Slug uniqueness within the palette space is enforced via a Mongo unique index on the value.js side.
- Slug **immutability**: once created, the slug does not change for that palette's lifetime. A rename produces a new palette; a fourier 404 always means deletion (never "renamed").

**Cross-repo invariant**: the FK is *resolve-only*, not *enforce-at-write*. Fourier never reaches across to value.js on the write path; value.js never reaches across to fourier. Only cross-repo traffic is the read-side (fourier's frontend fetches `GET /palettes/{slug}`). This orthogonality is the load-bearing KISS property (DA3 §5 "Critical design notes" §3).

### C4.5/C4.6 visibility-transition guard disposition

**Verdict: W3 (γ-thread).**

**Rationale**: the guard is an internal-state-machine fix — the `visibility_illegal_transition` helper already exists in `api/lib/crud/` (per DA1 §140 + DA2 §item-6), the call site is `update_visualization` (currently `$set`s visibility unconditionally), the fix is router-local code with no wire-shape change. The contract v2.0.0 (δ at W5) records *which transitions are allowed* on the conformance matrix as a post-hoc fill; the *enforcement* is W3.

---

## R2 — prod-deploy-safety on the shared host

### Verdict
**RATIFIED-AS-IS**

### Authority
- `docs/audits/runs/2026-05-27-D-audit/DA4-host-deploy-prod.md` — the live host audit.
- `docs/tranches/C/waves/W1.md` — the C-era deploy-hook spec (the four improvements).
- `docs/tranches/C/coordination/DEPLOY-RECONCILE.md` — the host-residual coordination doc.
- `docs/tranches/C/infra/blob-backend-dr.md:64` — the `docker volume create image_blobs` precondition.
- `docs/tranches/D/waves/W0.md §1` — the W0 baseline.

### Live re-probe results (read-only — Wα.a, 2026-05-27)

- `cd /var/www/fourier-analysis && git rev-parse HEAD` → **`8818ae5`** (pre-A baseline unchanged).
- `git status --porcelain` → `M docker-compose.prod.yml` + `M docker-compose.yml` + `?? ssl/` (dirty tree verbatim).
- `docker volume inspect image_blobs` → `[]` + `Error response from daemon: get image_blobs: no such volume` (still absent).
- `docker exec fourier-analysis-backend-1 env | grep MONGO_URI` → `MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true` (inline plaintext password + invalid-cert allowance still live).
- `openssl x509 -in /var/www/fourier-analysis/ssl/mongo-ca.pem -noout -subject` → `subject=CN = mbabb.fridayinstitute.net, O = mbabb, C = US` (foreign-CA subject still live).
- `grep -c flock /opt/deploy/scripts/dispatch.sh; grep -c porcelain /opt/deploy/scripts/dispatch.sh` → `0` + `0` (the four C.W1 improvements still absent).
- `ls -la /opt/deploy/hooks.json /opt/deploy/.env` → both `-rw-rw-r-- mbabb:mbabb` mode `0664` (world-readable secret still pending W1 hardening).
- `ss -tlnp | grep -E ':270(17|18|19|20)'` → three Mongos on `0.0.0.0`: `:27017` (fourier), `:27018` (floridify), `:27020` (palette-api). Port `:27019` (speedtest) absent from listen set but UFW rule still ALLOWs it (host firewall posture remains open even when service down).
- `sudo ufw status verbose` (passwordless sudo permitted) → all four ports `27017–27020` ALLOW IN Anywhere v4 + v6 (eight UFW rules total).

**Net**: every host fact baselined in W0 §1 re-confirms verbatim. The host has not advanced since the 2026-05-27 audit.

---

## R3 — ingress + domain-naming + palette-api provenance

### Verdict
**RATIFIED-WITH-DELTA**: the palette-api host directory at `/home/mbabb/Programming/palette-api/` is **NOT a git repo** (no `.git/` directory) — it is a plain rsync target. This **sharpens** NA1 §272-276 + CONSTELLATION-DEPLOY §2 row 2 ("rsync deploy") without contradicting them. See `_R-deltas.md` Δ-R3.1. Secondary recording-only delta (Δ-R3.2): `default-ssl.conf` `/words` is a 301 redirect to `mbabb.friday.institute`, not a `:8001|:3001` path-proxy — wave-spec probe-text was loose; NA5 substrate is correct.

### Authority
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` §2, §137, §144, §272–276.
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA4-deployability-matrix.md` §0.
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA5-ingress-cors-security.md` §0–§1.
- `docs/tranches/D/coordination/DOMAIN-NAMING.md`.
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` §2, §3.2, §8.

### Live re-probe results (read-only — Wα.b, 2026-05-27)

- `dig +short api.fourier.babb.dev` → `104.21.56.22 / 172.67.175.252` (CF wildcard catch-all; no dedicated A record yet).
- `dig +short color.babb.dev` → GH Pages anycast `185.199.108-111.153` (GH Pages still fronts; W9 cutover pending).
- `dig +short api.color.babb.dev` → CF wildcard catch-all (no dedicated record).
- `cat /etc/apache2/sites-enabled/babb-dev.conf` → vhost layout confirmed: `sudoku.babb.dev` → `:8120`, **`fourier.babb.dev` → `:8100`** (only fourier vhost), `words.babb.dev` → `:8110`. No `api.fourier.babb.dev` vhost yet.
- `cat /etc/apache2/sites-enabled/default-ssl.conf` → legacy `mbabb.fi.ncsu.edu` ingress carries `/colors/` → `:8130` + `/fourier/api/` → `:8100/api/` + `/fourier/` → `:8100/fourier/`. `/words` is **301 redirect** to `mbabb.friday.institute` (not a path-proxy — sharpens wave-spec probe-text).
- `ls /home/mbabb/Programming/palette-api/.git/config` → `No such file or directory` (**Δ-R3.1**: no host-side git provenance).
- `ls -la /home/mbabb/Programming/palette-api/` → confirms rsync-target layout (`compose.yaml`, `deploy.sh`, `.env`, `src/`, `mongo-init/`, `ssl/`); `.env` mtime `Mar 28 06:45` (live, not stale).
- `docker exec palette-api-api-1 printenv ALLOWED_ORIGINS` → `ALLOWED_ORIGINS=` (**CORS empty**, RATIFIED-AS-IS against NA5 §0).
- `docker exec floridify-backend printenv BACKEND_CORS_ORIGINS` → `["https://mbabb.friday.institute"]` (**stale**, RATIFIED-AS-IS against NA5 §0).

### palette-api provenance answer

**Standalone rsync target on the host at `/home/mbabb/Programming/palette-api/`** — NOT a git repo (no `.git/` directory), NOT `value.js/api/`; deployed via the dispatcher's `mkbabb/value.js` arm which rsyncs from the `value.js` repo's `api/` subtree into the host directory, then runs `compose.yaml` locally. The W11 rename touches the host directory + the `palette-api` compose project + the package name, NEVER `value.js/api/`. Authority: NA4 §0 + CONSTELLATION-DEPLOY §2 row 2; live evidence sharpens "standalone repo" → "standalone rsync target with no host-side git" via `ls /home/mbabb/Programming/palette-api/.git/config` → `No such file or directory`.

---

## R4 — constellation matrix + pilot-then-rollout ordering + CF token discipline

### Verdict
**RATIFIED-WITH-DELTA**: the `certbot-dns-cloudflare` plugin is **NOT installed** on the host (Δ-R4.1, **load-bearing on W10**). CONSTELLATION-DEPLOY §6 §8 + NA5 §158-§175 all presume `certbot --expand --apache --dns-cloudflare …` for the W10 origin-LE step. Live `certbot plugins` enumerates only `apache`, `dns-route53`, `standalone`, `webroot`. Team-lead reconcile (see §"Folded resolution" below) selects **Path B (HTTP-01 via `--apache`/`--webroot`)** as the smaller-mechanism resolution — the api.<app> hostnames are grey-cloud (CONSTELLATION-DEPLOY §3.2 — DNS-only A → origin), so the LE HTTP-01 challenge files at `/.well-known/acme-challenge/` are reachable by LE directly from the origin Apache without any DNS-01 round-trip. Secondary recording-only delta (Δ-R4.2): grammar probe-text wording loose; substrate is correct.

The constellation matrix itself (4 compose projects + LE cert SAN set `{fourier,sudoku,words}.babb.dev` + keyframes.js not on host + grammar = static-not-git) RATIFIES-AS-IS. The CF token discipline + the pilot-then-rollout ordering both RATIFY-AS-IS.

### Authority
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` §2, §64, §137, §144–145, §257–258, §272–276.
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA2-cf-pages-recipe.md`.
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA3-dns-plan.md`.
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA6-guard-wave-structure.md` §2, §3, §4, §111–§117.
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` §2, §3.2, §6, §7, §8.

### Live re-probe results (read-only — Wα.b, 2026-05-27)

- `docker compose ls -a` → 4 projects: `csp-solver`, `floridify`, `fourier-analysis`, `palette-api`. RATIFIED-AS-IS against NA1 §64 + CONSTELLATION-DEPLOY §2.
- `sudo ls /etc/letsencrypt/live/` → `grammar.babb.dev`, `mbabb.friday.institute`, `speedtest.mbabb.friday.institute`, `sudoku.babb.dev`.
- `sudo openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text | grep SAN` → `DNS:fourier.babb.dev, DNS:sudoku.babb.dev, DNS:words.babb.dev` (the live cert SAN set, RATIFIED-AS-IS against CONSTELLATION-DEPLOY §3.2).
- `test -d /home/mbabb/Programming/keyframes.js …` → `keyframes.js not on host` (no host-side checkout — RATIFIED-AS-IS; W9 migration is GH-Actions + CNAME flip, no host work).
- `test -d /var/www/grammar && (cd /var/www/grammar && git log -1)` → `grammar absent` + `fatal: not a git repository` (static-not-git, RATIFIED-AS-IS against NA1 §258). The DEFER decision is keyed on the upstream `bbnf-lang` repo's quiet-window, not the host's static build dir.
- `which certbot; certbot plugins` → `/usr/local/bin/certbot` + plugins `apache`/`dns-route53`/`standalone`/`webroot` (**no `dns-cloudflare`** — Δ-R4.1).
- `dpkg -l | grep -i cloudflare` → (empty — apt-side plugin not present; certbot at `/usr/local/bin/` is non-apt so install channel is pip or snap).

### Folded resolution for Δ-R4.1 (the load-bearing delta)

**Decision: Path B (HTTP-01 via `--apache`/`--webroot`).** Smallest mechanism; matches the existing certbot install channel without adding a new plugin; removes the DNS-01 dependency on the CF token's `DNS:Edit` perm for the cert path (the perm is still needed for the DNS-as-code script at W8, but not for certbot). Since the api.<app> hostnames are grey-cloud (CONSTELLATION-DEPLOY §3.2 — DNS-only A → origin), the LE HTTP-01 challenge files at `/.well-known/acme-challenge/` are reachable by LE directly from the origin Apache — no DNS-01 round-trip needed. W2 + W10 + CONSTELLATION-DEPLOY §6/§8 reconciled by team-lead to record Path B as the binding approach. Path A (install `certbot-dns-cloudflare` via pip/snap matching the existing certbot install channel) remains a named alternative for future use (e.g. if a wildcard cert is ever needed, which would force DNS-01).

### CF token discipline re-confirmation

Both `.env` files **RATIFIED-AS-IS** per NA6 §2 + CONSTELLATION-DEPLOY §6:
- `/Users/mkbabb/Programming/fourier-analysis/.env`: gitignored at `.gitignore:50`, mode `-rw-------` (0600).
- `/Users/mkbabb/Programming/value.js/.env`: gitignored at `.gitignore:7`, mode `-rw-------` (0600).
- NOT rotated per user direction (CONSTELLATION-DEPLOY §6: "Do NOT rotate; rotate only on suspicion").
- Referenced by name (`CLOUDFLARE_API_TOKEN`) — never echoed in shell history, logs, commits, or chat.
- Also held in the GitHub Actions secret store for CI publishes.

### Pilot-then-rollout ordering re-confirmation

**RATIFIED-AS-IS** per NA6 §3-§4 + CONSTELLATION-DEPLOY §7. Binding sequence:
1. **fourier as the pilot** — W1 (security hotfix + first prod deploy) → W2 (verified-TLS + domain split) → W9 (CF-Pages frontend migration — fourier ONLY proves the recipe).
2. **W6 matrix-green gates W10** — until the ε-thread test matrix is green (the `validation-matrix.md` `KeyError: 'storage_uri'` + `COMPUTE_RATE_LIMIT` findings discharged), no sibling cutover.
3. **W10 sibling cutovers** — `api.color.babb.dev`, `api.sudoku.babb.dev`, CORS fixes (palette empty → populate, floridify cosmetic), `certbot --expand` extending SANs (now via HTTP-01 per Path B). Bounded-parallel; ≤4 agents/wave (NA6 §3); each app individually rollback-capable.
4. **W11 palette-api → color rename** — user-re-mandate-gated, rides the rollout tail.
5. **DEFERRED: grammar** — explicit per NA6 §4 + CONSTELLATION-DEPLOY §2 ("1009 commits/14d, dirty master — author-coordinated quiet window").
6. **Big-bang explicitly REJECTED** — NA6 §1 + §3.

---

## Narrowed follow-up lanes

The consolidated `_R-deltas.md` records all four deltas (Δ-R3.1, Δ-R3.2, Δ-R4.1, Δ-R4.2). One is load-bearing on W10 (Δ-R4.1 — the certbot-dns-cloudflare plugin missing → Path B HTTP-01 fallback folded). Three are recording-only.

---

## Wχ probe scope confirmation (Wα-G10)

The Wχ probe set (P1–P5 per `D.md §3` Wχ row + `waves/Wchi.md`) is **fully scoped against the ratified evidence above**:
- **P1** (co-tenant blast radius) — substrate from R2 + R4 (the dispatcher / Apache / Mongo binds / UFW rules) + the cross-app blast-radius analysis.
- **P2** (migration-with-deploy atomic + rollback-safe) — substrate from R2 (the host state + the C.Wχ-P3 per-doc atomicity proof) + the W0 §1 empty-DB-at-first-deploy simplification.
- **P3** (CRUD-cohesion KISS — no shared framework, inv-16) — substrate from R1 (the v2.0.0 design + the two relaxations + the `palette_slug` FK clause).
- **P4** (β stays refinement + γ removes only dead code) — substrate from W0 §2 + §3 + DA1 + design/DA-design-A1-A4.
- **P5** (α′ pilot-first + DNS-safe + api-TLS-path-real) — substrate from R3 + R4 (the live ingress + LE cert + DNS posture + the **Δ-R4.1 certbot-plugin pivot** to HTTP-01 Path B).

Wχ is ready to fire.

---

## Compositional discipline

This index assembled from `_lane-R1.md` + `_lane-R2.md` + `_lane-R3.md` + `_lane-R4.md` + `_R-deltas.md` by team-lead reconcile. The lane drafts remain as immutable evidence per the Walpha.md §2 "no re-research" discipline; the team-lead's central role is reconciliation, not re-authoring. The `_*.md` prefix marks them as the drafts (the README is the binding artefact).
