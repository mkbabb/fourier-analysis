# D — progress log

Updated at every wave boundary. Reconciled against reality at W7 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-D — the
production-deployment, design-refinement, backend-convergence-completion, and
cross-repo-cohesion tranche — so the close ceremony can reconcile claim against
artefact without archaeology.

## Completion criterion

Every wave's row carries (a) a status word from the canonical set, (b) a close
timestamp once it closes, and (c) a notes cell naming the binding deliverable.
At W7 close every row reconciles against `FINAL.md`'s gate table.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open · baseline · research dispatch* | open | — | C confirmed closed; prod-state baseline (the `8818ae5` pre-A gap, dirty tree, empty DB, missing `image_blobs` volume); design-debt + backend-legacy catalogs; δ research dispatched; §8 window ratified; binding baseline at `waves/W0.md`; W0→Wα→Wχ gate opened |
| Wα — *Research (ratification + narrowed dispatch)* | closed | 2026-05-27 | 2 parallel agents (Wα.a R1+R2, Wα.b R3+R4) ratified the dev-era substrate against the live tree + host. **R1 RATIFIED-AS-IS**: ~11-clause divergence binds verbatim; `palette_slug` FK clause authored; **C4.5/C4.6 → W3 (γ-thread)**. **R2 RATIFIED-AS-IS**: every host fact (HEAD `8818ae5`, dirty tree, missing `image_blobs`, foreign CA, dispatcher weakness, hook perms `0664`, 3 Mongos on `0.0.0.0`, 4 UFW rules) re-confirmed verbatim. **R3 RATIFIED-WITH-DELTA**: palette-api at `/home/mbabb/Programming/palette-api/` has NO `.git/` (sharpens rsync provenance, not load-bearing). **R4 RATIFIED-WITH-DELTA (LOAD-BEARING)**: `certbot-dns-cloudflare` plugin NOT installed on host. **Folded resolution**: HTTP-01 via existing `--apache` plugin (Path B; api hosts grey-cloud → origin Apache serves challenge directly); W2/W10/D.md/CONSTELLATION-DEPLOY §3.2.a/§8.1 reconciled. `research/README.md` authored. |
| Wχ — *Challenge* | closed | 2026-05-27 | **5 probes in 4+1 batches** all landed PASS-WITH-CONDITIONS (P4 ACCEPTED-WITH-STRENGTHENING). **P1** co-tenant blast radius: dispatcher arm-scoped, sibling Mongo/UFW residuals named; HMAC rotation = Shape A (per-rule, hooks.json supports it) **OR** Shape B (lockstep) — W1 binds. **P2** migration atomic + rollback-safe: empty DB at first deploy + atomicity proof reproduces on prod — **§8 brittleness window STRUCK**. **P3** cohesion KISS: inv-16 holds (no shared framework/codegen/coordinator). **P4** β refines + γ deletes only dead: all greps verified zero live consumers; surfaced **W4 enumeration gap** (3 of 9 `#f0b632` + 6 of 12 alpha-modifier sites enumerated — W4 closes the gap at dispatch). **P5** α′ pilot-first + DNS-safe + Path B HTTP-01: live `curl http://34.197.214.67/.well-known/acme-challenge/` returns 404-from-Apache (not refusal) — the `RewriteCond` exemption is **already in babb-dev.conf** with comment "also serves certbot challenges"; MX/SPF/apex/NS/wildcard all preserved. |
| W1 — *Security hotfix + first prod deploy* | closed-with-host-residuals | 2026-05-27 | **PHASE 1 GREEN**: 3 Mongos bound off `0.0.0.0` + 8 UFW rules withdrawn; external `nc -zv` times-out on all 4 ports across all 3 apps (audit/W1-phase1-host.md). **PHASE 2 GREEN via SSH-trigger** (the webhook URL `mbabb.friday.institute` is not in public DNS — ~2-month constellation-wide regression; named residual for W8/W10): host tree reconciled + Mongo password extracted to `/var/www/fourier-analysis/.env` (0600); deploy-hook bootstrap'd + dispatcher fourier-arm re-pointed; `/opt/deploy/{hooks.json,.env}` perms `0664→0600`; `image_blobs` volume created; **first A/B/C → host deploy LIVE** via `bash scripts/deploy-hook.sh` — host HEAD `8818ae5` → `795d64f` → bad → rollback → `a6ba377` (revert); rollback proof captured (74s degraded window with 31×200/33×502; site restored to GREEN; HEAD never advanced past rollback target); migration ran (empty DB; 0 unmigrated docs); build-fix landed at `795d64f` (sibling repos vendored as `npm pack` tarballs at `web/vendor/*.tgz` — the A.W2 `file:../../` refs escape Docker context). **Residuals (W8/W10/W9)**: (1) webhook URL public DNS gap; (2) `fourier.babb.dev` → GH Pages 404 (host's loopback `:8100` is the operational fourier; public URL is a W9 deliverable). |
| W2 — *Verified-TLS cutover + precepts promotion* | provisional | — | thread α — `gen-mongo-certs.sh` host-run; the `infra/tls.md §9` 3-site diff; live verified-cert ping; the staged precepts promoted into the submodule |
| W3 — *Backend NO-legacy symmetry + transpositions* | provisional | — | thread γ — backend `snapshot_hash` band → slug (flags field+index, 9 admin sites); dead `gallery` stratum deleted; image asset typed (retires the dict shim that caused C9/C10) |
| W4 — *Design refinement* | provisional | — | thread β — `.cartoon-card` resurrected (1 shim → 14 components); upload IA → one dropzone; gallery orphans resolved; light-mode contrast sweep; `:focus-visible` rings; axe light-mode clean. ∥ W3 (web vs api) |
| W5 — *CRUD-CONTRACT v2.0.0 + cohesion* | provisional | — | thread δ — contract v2.0.0 (2 relaxations); fourier flips DEFERRED cells vs live palette-api; value.js alignment ask recorded; colour-lift consume iff published. value.js-side = a value.js tranche (user-gated) |
| W6 — *Test integrity* | provisional | — | thread ε — cross-env Playwright matrix (2 apps × local/dev/prod, prod non-mutating); CI Mongo retires `@requires_mongo` skips; `COMPUTE_RATE_LIMIT` harness |
| W8 — *DNS-as-code* | provisional | — | thread α′ — idempotent CF-API script: `<app>.babb.dev`=proxied CNAME→`<app>.pages.dev`; **`api.<app>.babb.dev`=grey-cloud A→`34.197.214.67`** (TLS path RESOLVED — certbot LE on the origin, no ACM); don't-break (MX/SPF/apex/NS/wildcard) |
| W9 — *CF-Pages frontend migration* | provisional | — | thread α′ — speedtest recipe per frontend; **fourier pilot first**; then keyframes.js + value.js/color off GH Pages; bounded-parallel |
| W10 — *Backend ingress + origin LE for api.<app> + CORS* | provisional | — | thread α′ — per-`api.<app>` Apache vhost → app nginx gateway; **`certbot --expand` adds `api.<app>` SANs** to the live LE cert via DNS-01 (CF token's DNS:Edit); auto-renew preserved; CORS fixes (palette empty, floridify stale → `https://<app>.babb.dev`). Mongo-bind moved to W1 |
| W11 — *palette-api → color rename* | provisional | — | thread α′/δ — **user-re-mandate-gated**; reconcile the standalone-repo provenance first; rename + `api.color.babb.dev` + palette-Mongo bind (value.js-side; shared vhost the seam) |
| W12 — *Close* | provisional | — | reconcile PROGRESS; FINAL cites commits + gates; coordination updated; dangling-image (`gaggle`/`server-api`) + dead `:8140` speedtest vhost cleanup; §8 window restored; CANONICAL-ORDERING → ordering ε. **CF token NOT rotated** (per user) — saved in gitignored `.env`s + CI secrets |

## Log

### 2026-05-27 — tranche authored (10-lane D-development audit)

**WHAT.** Following the C close, the user directed a deep 6-agent parallel audit
of the original plan + all changes herein, devising the path forward, with: NO
quick solutions / NO workarounds / idiomatic-gestalt / architectural-transpositions
DESIRABLE / NO legacy code; fold deferred + chronic items; recap ALL prompts;
**tranche development only**; **prod SSH available — integrate + deploy all of the
above**; a further **4-agent design wave (frontend-design plugin)** analysing every
screen; a **cross-repo palette/visualization CRUD cohesion** pass auditing value.js;
and **Playwright validation of both apps across local/dev/prod**.

The audit ran as 6 lanes `DA1`–`DA6` + 4 design lanes `design/DA-design-A1..A4` +
a live `validation-matrix.md` (screens captured) at
`docs/audits/runs/2026-05-27-D-audit/` (1,477 + 285 L + the matrix).

**Pivotal finding (DA4).** None of A/B/C is in production — prod serves pre-A
`8818ae5` (2026-03-28) from a dirty host tree (inline plaintext Mongo password),
empty DB, never webhook-deployed; the `image_blobs` `external:true` volume is
absent (a naive deploy would fail). With prod SSH now available, C's host residuals
become D's headline deliverables.

**Other findings folded:** (DA1) C's NO-legacy discharge was frontend-only — the
backend still speaks `snapshot_hash` (flags field+index, 9 admin sites) + a dead
`gallery` collection stratum + the untyped image-asset dict shim that caused
C9/C10 → thread γ. (DA3) value.js ships a live deployed `palette-api` v2.0.0,
divergent on ~11 contract clauses; fourier's `palette_slug` is a live FK into it →
thread δ (value.js-heavy, user-gated). (Design) `.cartoon-card` is a dead class
applied by 14 components; triple upload affordance; gallery orphans; light-mode
contrast cluster; missing focus rings → thread β. (DA5) 39 directives, 0 outstanding.

**Wave set**: five threads (α prod-deploy, β design, γ backend-symmetry, δ CRUD
cohesion, ε test integrity) across W0→Wα→Wχ→W1-W7. Three new invariants by name
(production parity; code-and-migration-together; token-system-single-source).
`CANONICAL-ORDERING` reconciled to ordering ε.

**Prompt disposition (DA5):** 39 directives — 34 addressed/held, 0 partial, 5
routed-to-D, 0 OUTSTANDING.

### 2026-05-27 — domain/endpoint naming standardization folded (thread α)

**WHAT.** The user directed a constellation domain-naming standardization: rename
the `palette-api` endpoint to `color` (`api.color.babb.dev`, matching the live
GitHub-Pages `color.babb.dev` frontend), and split fourier into `fourier.babb.dev`
(frontend) + `api.fourier.babb.dev` (backend). Read-only prod ingress recon
grounded it and surfaced findings folded into `coordination/DOMAIN-NAMING.md`:

- **Convention**: `<app>.babb.dev` (frontend) + `api.<app>.babb.dev` (backend),
  uniform; `api.color.babb.dev` is the recommended resolution of the user's
  "either/or" (consistency with the explicit `api.fourier.babb.dev`).
- **Current reality**: `fourier.babb.dev` is a shared host-Apache vhost →
  `:8100` (frontend + `/api`→backend behind one domain); `color.babb.dev` is
  GitHub Pages (`mkbabb.github.io`, off-host); `palette-api` is loopback `:8130`
  from a **standalone repo `/home/mbabb/Programming/palette-api`** (NOT
  `value.js/api/` — a provenance discrepancy to reconcile at Wα).
- **SECURITY**: both Mongos publish on `0.0.0.0` (`fourier:27017`, `palette:27020`)
  — publicly reachable; D.α binds them to loopback.

**Disposition**: the fourier domain split + the fourier-Mongo bind → D.W1/W2
(thread α, fourier-owned); the color/palette rename + `api.color.babb.dev` + the
palette-Mongo bind → a cross-repo ask (value.js / the standalone palette-api repo,
user-re-mandate-gated; the shared Apache vhost the one fourier-touchable seam). The
naming convention → a `docs/precepts/infra/` precept (D.W2). Wα gains R3 (ingress).

### 2026-05-27 — constellation deployment normalization folded (new thread α′, 6-lane audit)

**WHAT.** The user expanded D into a constellation-wide deployment normalization
(every app → `<app>.babb.dev` + `api.<app>.babb.dev`; frontends → CF Pages via the
speedtest recipe; backends → mbabb docker; programmatic DNS via the CF API; a CF
token provided) + "what other containers run on the server?". A 6-lane read-only
audit (`normalization/NA1-6`, 2,047 L) grounded it; `coordination/CONSTELLATION-DEPLOY.md`
is the binding plan; folded as new thread **α′** (waves W8-W12).

**The app constellation (the answer):** fourier (fourier-analysis), color
(palette-api), sudoku (csp-solver), words (floridify), grammar (bbnf-lang, static),
+ keyframes.js & value.js/color (GH Pages) + speedtest (already CF Pages). Host =
AWS EC2 `34.197.214.67`; support: code-server, MySQL, the webhook receiver, Apache.

**Two load-bearing findings:**
1. **LIVE CRITICAL SECURITY** — three Mongos (fourier:27017, floridify:27018,
   palette:27020) bind `0.0.0.0` AND are reachable from the public Internet
   (external TCP connect confirmed; UFW explicitly ALLOWs the ports; creds plaintext
   in compose). → W10, and flagged to the user as a candidate pre-tranche hotfix.
2. **The `api.<app>` TLS ceiling** — CF free Universal SSL is single-level `*.babb.dev`
   only, so `api.fourier.babb.dev` gets no edge cert. ACM (~$10/mo) keeps the pattern;
   `<app>-api.babb.dev` is free. → a user decision at W8.

**Plan**: fourier is the PILOT (W1/W2/W9 prove the full pattern end-to-end on one
app on the shared host), then the proven recipe rolls to the co-tenants bounded-
parallel — never a big-bang. grammar DEFERRED (active dev). The CF token is never
persisted/committed and is ROTATED at W12 close (it was chat-pasted). NA findings
also corrected DOMAIN-NAMING's earlier assumptions (the TLS ceiling; palette-api's
rsync/standalone provenance).

### 2026-05-27 — resolutions folded (TLS path + Mongo + credential placement)

**WHAT.** The user's follow-up resolved the open decisions and added items:
- **TLS path RESOLVED to grey-cloud + origin LE** (the user's "re-add direct DNS
  records?" intuition is exactly right): `api.<app>.babb.dev` becomes a DNS-only A
  → origin `34.197.214.67`; the mbabb Apache serves a Let's Encrypt cert (certbot
  is already on prod with a live `/etc/letsencrypt/live/sudoku.babb.dev/` cert;
  `certbot --expand` with DNS-01 via the CF token adds the api SANs); LE has no
  subdomain-depth limit. **Free, exact naming, no ACM.** Frontends remain CF-Pages
  proxied (single-level, free Universal SSL OK). → W8/W10 updated.
- **Mongo fix in-tranche, front-loaded** as the FIRST act of W1 (the live exposure
  closed across fourier + floridify + palette before any deploy). W10 drops the
  Mongo-bind.
- **CF token NOT rotated** (per user); saved in gitignored `.env`s at
  `fourier-analysis/.env` + `value.js/.env` (`0600`, `git check-ignore` verified,
  `git status` clean), referenced by name. The user's supplied perm set is
  sufficient (and broader than the minimal {DNS:Edit, DNS:View, Pages:Edit,
  Zone:Read} — SSL/certs perms aren't even needed under the grey-cloud+LE plan
  because certbot uses DNS-01, not the CF SSL API).
- **Full API plan** authored at `coordination/CONSTELLATION-DEPLOY.md §8` — the
  uniform four-move recipe per backend (DNS / origin LE / Apache vhost / CORS),
  the per-app row table, and the pilot-then-rollout ordering.
- I confirm I SSH'd into the server (read-only) multiple times this session.

### 2026-05-27 — D.W1 closed-with-host-residuals (Phase 1 GREEN; Phase 2 GREEN via SSH-trigger)

**WHAT.** W1's two-phase spine executed in order — inversion preserved.

**Phase 1 GREEN — live security hotfix (FIRST act, per user direction).** Agent
`W1.Phase1-host-coordinator` closed the world-reachable Mongo exposure across
all three apps on the shared host:
- fourier-analysis-mongo-1: `0.0.0.0:27017` → no host publish (canonical
  `ports: !reset []` edit committed locally + applied on host).
- floridify-mongodb: `0.0.0.0:27018` → no host publish (cross-app residual
  edit to /home/mbabb/floridify/docker-compose.prod.yml; floridify maintainer
  reconciles upstream).
- palette-api-mongo-1: `0.0.0.0:27020` → no host publish (cross-app residual
  edit to /home/mbabb/Programming/palette-api/compose.yaml; rsync-target host
  dir).
- 8 UFW rules withdrawn (27017, 27018, 27019 stale, 27020 — v4+v6).
- External `nc -zv 34.197.214.67 270{17,18,19,20}` from local laptop: all 4
  ports time out (refused — symmetry with the audit's previously-confirmed
  open state, see NA1 §4b).
- All 3 apps loopback-healthy throughout.
- Close record: `docs/tranches/D/audit/W1-phase1-host.md`.

**Phase 2 GREEN via SSH-trigger — first A/B/C → host deploy LIVE.** Three
real-world blockers surfaced during Phase 2 dispatch:
1. **Webhook URL DNS gap**: `mbabb.friday.institute` not in public DNS for
   ~2 months — affects ALL 5 sibling repos. GitHub webhook delivers fail with
   502 from DNS resolution failure.
2. **Frontend Docker build broken**: A.W2's `a7d1904` introduced
   `file:../../{glass-ui,keyframes.js,value.js}` refs in `web/package.json`
   which escape the Docker build context; npm-published versions are too old
   (glass-ui 0.3.0 vs local 2.0.0; value.js 0.5.1 vs local 0.10.0) and lack
   the subpath exports fourier consumes (`@mkbabb/glass-ui/sidebar`, etc.).
3. **`fourier.babb.dev` not host-connected**: DNS routes to Cloudflare → GH
   Pages (returns 404); host's loopback `:8100` is the operational fourier.

Blocker 2 was resolved in-tranche via `npm pack` vendoring (commit `795d64f`):
each sibling repo's `dist/` was built locally, packed to a tarball, vendored at
`web/vendor/*.tgz`; `web/package.json` `file:` refs updated to point at the
vendor tarballs; `web/Dockerfile` extended with `COPY web/vendor ./vendor`
before `npm ci`. Local + Docker `vite build` both verified clean. The smallest
idiomatic fix; the alternative (publishing sibling repos to npm at current
versions) would have breaking-changed other consumers of the @mkbabb scope.

Blockers 1 & 3 are scoped to **W8 (DNS-as-code) + W9 (CF Pages migration) +
W10 (api ingress + LE)** per `docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md`
(NEW — authored in-wave, names W8/W9/W10 as forward-wave deliverables).

**Phase 2 SSH-triggered deploy chain (the deploy-hook ran end-to-end as if
the webhook had fired):**
- Host tree reconciled (`git checkout -- docker-compose.{,prod}.yml`); Mongo
  password extracted from running container env to `/var/www/fourier-analysis/.env`
  (mode 0600, gitignored).
- `scripts/deploy-hook.sh` bootstrapped onto host via `git fetch && git checkout
  origin/master -- scripts/deploy-hook.sh` (the host was at pre-A `8818ae5`
  which predates the script).
- `/opt/deploy/scripts/dispatch.sh` fourier `case` arm re-pointed via atomic
  Python substitution: `bash /var/www/fourier-analysis/scripts/deploy-hook.sh
  "$REPO"`. Sibling arms byte-identical (`diff` verified). Backup preserved
  at `.bak-d-w1`.
- `/opt/deploy/{hooks.json,.env}` chmod `0664 → 0600`. HMAC secret value
  UNCHANGED (not rotated per user direction).
- `docker volume create image_blobs` (the prod compose's `external: true`
  declaration precondition).
- **First deploy** (SSH-triggered after Blocker 2 fix):
  - `git push origin master` advanced GitHub to `795d64f`.
  - SSH-trigger ran the deploy-hook: flock acquired → clean tree → PREV=`577f037`
    → `git fetch origin && git reset --hard origin/master` advances to
    `795d64f` → `docker compose build --parallel` (now succeeds with vendored
    tarballs, ~55s) → `up -d` → 5×502 warm-up → health-gate GREEN at attempt
    6/30 → green marker written → `DEPLOY OK 577f037 -> 795d64f`.
  - Host HEAD: `795d64f`; bundle stamp `index-BLE-VfHy.js` matches build output.
- **Migration in cutover (P2.C1 shape (C)):** the deploy-hook does NOT invoke
  the migration script (operator-note for future hardening); ran manually
  immediately:
  - `docker compose exec -T backend uv run --no-sync python -m api.scripts.migrate_image_blobs`
    → empty DB, 0 docs migrated, exit 0.
  - Post-deploy probe: `db.images.countDocuments({storage_uri: {$exists: false}})`
    returns `unmigrated=0` (P2.C3 satisfied).
  - Note: required `uv run --no-sync` because container's default `python` lacks
    project deps; only `/app/.venv/bin/python` has them.
- **Rollback proof (Production Parity §6 close gate):**
  - Bad commit `a28e765` authored (RuntimeError at module scope of api/main.py).
  - SSH-trigger: build succeeded (compile-time fine) → `up -d` → 30×2s health
    poll all 502 → `ROLLBACK — health gate failed` → `git reset --hard
    795d64f` → rebuild (cached) → re-up → GREEN attempt 6/30 → `ROLLBACK OK —
    site restored to 795d64f; deploy of a28e765 rejected`. Total bad→
    rollback-green: 2m12s.
  - Availability poll: 31×200 / 33×502 across the rollback window (~74s
    degraded between bad-up and rollback-up; restored cleanly to GREEN).
  - Host HEAD: `795d64f` (unchanged — rollback target reached; the bad SHA
    never persisted).
- **Fix-push (revert):** `git revert a28e765` → `a6ba377` → push → SSH-trigger
  → all-cached build → up no-op → GREEN attempt 1/30 → `DEPLOY OK 795d64f ->
  a6ba377`. Host HEAD final: `a6ba377`.

**Final host state (W1 close):**
- Host HEAD: `a6ba377` (advanced from pre-A `8818ae5`).
- Green marker `/opt/deploy/fourier-last-green`: `a6ba377`.
- All 4 containers running; mongo `(healthy)`.
- Loopback `:8100/api/health` → `{"status":"ok"}`.
- Bundle: `index-BLE-VfHy.js` (the post-build-fix asset).

**Production Parity (`D.md §6`):** **PROVEN AT LOOPBACK**. The host serves
D-W1 HEAD. The PUBLIC URL parity is a named W9 residual (`fourier.babb.dev`
currently CF→GH Pages 404; the W9 cutover migrates the static frontend to CF
Pages with the api split landing at W2/W10).

**Wave gates landed:**
- ✅ Mongo exposure CLOSED across host (Phase 1; P1.C3+C4 sibling-isolation
  residuals named).
- ✅ Phase 1 → Phase 2 operator-confirms-healthy gate GREEN.
- ✅ Host tree reconciled (compose dirty mods discarded; secret extracted).
- ✅ Deploy-hook wired (fourier arm of dispatch.sh; sibling arms untouched —
  P1.C1).
- ✅ Hook perms 0600.
- ✅ image_blobs volume created.
- ✅ First A/B/C → host deploy LIVE (via SSH-trigger as the webhook URL is
  upstream-broken; the chain logic is fully exercised).
- ✅ Migration ran in same cutover (P2.C1 shape (C); P2.C3 zero-unmigrated
  probe).
- ✅ Rollback proof captured (the deploy-hook's rebuild-on-rollback path
  exercised; site restored to last-known-good).
- ⚠️ **Residuals carried to W8/W9/W10**: webhook URL public DNS gap;
  fourier.babb.dev public URL routing.

**Next**: dispatch W2 + W8 in parallel (file-disjoint — W2 spine 1 is Mongo
TLS host-ops; W8 is CF DNS provisioning + local script authoring). W10/W9
follow W8. W2 spine 2 (the fourier domain split) completes after W8+W10 land
the api.fourier.babb.dev ingress.

### 2026-05-27 — D.Wχ closed (5 probes in 4+1 batches; §8 STRUCK)

**WHAT.** 5 adversarial probes (P1-P5) dispatched in two batches per
`waves/Wchi.md §4`: Batch 1 = P1+P2+P3+P4 parallel; Batch 2 = P5 alone (cites
P1 sibling-isolation findings). Each agent authored
`docs/tranches/D/audit/challenge-P<n>.md`. All 5 probes verdicted; the §7
conditions-to-waves binding table holds with minor refinements folded.

**Per-probe verdicts:**
- **P1 — co-tenant blast radius**: PASS-WITH-CONDITIONS. Dispatcher fourier-arm
  edit byte-scoped; shared `deploy()` body untouched; sibling arms untouched.
  TLS CA collision is cosmetic (3 distinct fingerprints). Volume name zero
  collision. **Critical disposition**: `hooks.json` structurally supports
  per-rule secrets (independent JSON array entries each with own `secret`)
  but is configured single-secret — **W1 binds Shape A (per-rule rotation,
  fourier-only) OR Shape B (single-secret lockstep across all 5 GitHub
  webhook configs)**. Recommendation: Shape A (smaller blast radius).
- **P2 — migration atomic + rollback-safe**: PASS-WITH-CONDITIONS. Empty DB
  at first deploy (`images.count=0`, `visualizations.count=0`) → migration is
  no-op. Volume create is W1 pre-deploy host-ops (not in deploy-hook).
  `api/main.py` boot path zero `storage_uri` subscripts. C.Wχ-P3 atomicity
  proof reproduces on prod (`replicas: 1`, no app-side cache, single
  `update_one` per doc with `$set`+`$unset` in one op). **§8 brittleness
  window verdict: STRIKE.** No observable suspended-gate interval.
  Migration shape (C) for first deploy, (B) for subsequent. Rollback target
  `$PREV = 8818ae5` safe (no inline blobs in DB). Added P2.C4 (volume create
  prereq) and P2.C5 (§8 STRIKE).
- **P3 — cohesion KISS, inv-16**: PASS-WITH-CONDITIONS. `git grep` for
  shared-framework signatures returns zero instrumental matches in both
  repos. value.js@0.10.0 exports `cubicBezierToSVG` but NOT
  `sampleToSVGPath` → colour-lift is a **named residual** (expected branch).
  Per-repo matrix flip discipline; `palette_slug` FK by shape+existence; no
  cross-repo write-path traffic; value.js-side as separate user-gated tranche.
- **P4 — β refines + γ deletes dead**: ACCEPTED-WITH-STRENGTHENING. All γ
  deletion targets verified-dead at HEAD (`_entry_from_doc`/`GalleryEntryResponse`
  hits all declarations or false docstrings; `gallery.(insert|update|replace)`
  hits all test fixtures; `db.snapshots.` hits dead boot indexes + one-shot
  migration; `snapshot_hash` 44 hits = 11 W3 targets + docstrings + dead
  indexes + 30 explicitly out-of-scope). All β refinements preserve surface
  treatment / colour-system / IA-paradigm baselines. **Surfaced W4
  enumeration gap**: W4.md §1.4 enumerates 3 of 9 `#f0b632` sites + 6 of 12
  alpha-modifier sites — W4 must close at dispatch (P4.C2 strengthening
  bound).
- **P5 — α′ pilot-first + DNS-safe + Path B api-TLS-real**: PASS-WITH-CONDITIONS.
  Live `curl -v http://34.197.214.67/.well-known/acme-challenge/test -H "Host:
  fourier.babb.dev"` returns HTTP 404-from-Apache (not connection refusal)
  → Apache `:80` reachability + the `RewriteCond !^/.well-known/acme-challenge/`
  exemption is **already live in `babb-dev.conf:2`** with header comment
  "HTTP: redirect to HTTPS — also serves certbot challenges". The Path B
  HTTP-01 mechanism is infrastructure-ready. DNS: MX (5 Google), SPF, apex
  (Squarespace), NS (CF), wildcard — all preserved verbatim. (Minor:
  P5.C2 records MX line-count as 5 not 4.) Fourier pilot ordering
  W1→W2→W6→W9→W10 binding. CF token NOT rotated.

**Folded reconciliations (team-lead, central):**
- `D.md §8` brittleness window → **STRUCK** (P2.C5 verdict).
- `waves/Wchi.md` close-record updated with per-probe verdicts.
- W1 must bind HMAC rotation shape (P1.C2 — Shape A recommended).
- W1 must add volume-create-prereq gate (P2.C4).
- W4 must enumerate all 9 `#f0b632` + all 12 alpha-modifier sites at
  dispatch (P4.C2 strengthening).
- W12 must elevate CF-token-not-rotated from checklist to numbered G-gate
  (P5.C5).

**Wχ-G1 through Wχ-G7 all green.** No source change. No host mutation.
Phase 0 discipline holds through close.

**Next**: implementation waves open. Per `D.md §3`/§4: W1 (security hotfix +
first prod deploy) → W2 (verified-TLS + domain split) → W3 ∥ W4 (γ ∥ β) →
W5 (CRUD v2.0.0) → W6 (test integrity) → W8 (DNS) → W9 (CF Pages, fourier
pilot first) → W10 (sibling api ingress) → W11 (palette-api → color rename,
user-gated) → W12 (close).

### 2026-05-27 — D.Wα closed (ratification + 1 load-bearing delta folded)

**WHAT.** 2 parallel ratification agents (Wα.a R1+R2, Wα.b R3+R4) ratified the
dev-era 10+6 lane substrate against the live tree + host (read-only SSH probes).
Authored `docs/tranches/D/research/README.md` (binding index) assembled by
team-lead reconcile from `_lane-R{1,2,3,4}.md` + `_R-deltas.md`. Four deltas
surfaced; one (**Δ-R4.1 — `certbot-dns-cloudflare` plugin not installed**) is
load-bearing on W2/W10; team-lead resolved with **Path B — HTTP-01 via existing
`--apache` plugin** (smallest mechanism; api hosts are grey-cloud so the LE
HTTP-01 challenge resolves through the origin Apache directly, no DNS-01
round-trip, no new plugin install). The other three deltas are recording-only
(substrate correct; wave-spec probe-text wording loose).

**Per-lane verdicts:**
- **R1** (CRUD-CONTRACT v2.0.0 + `palette_slug` FK): RATIFIED-AS-IS. The
  `palette_slug` FK contract clause authored (resolve-only / read-side-only;
  fourier-shape constraints + value.js resolution semantics + immutability +
  no cross-repo write-path traffic). **C4.5/C4.6 verdict: W3 (γ-thread)** —
  the guard is internal-state-machine wiring, not a contract clause.
- **R2** (prod-deploy-safety): RATIFIED-AS-IS. Every host fact from `W0.md §1`
  re-confirms verbatim (HEAD `8818ae5`, dirty tree, missing volume, foreign
  CA, dispatcher weak, hook perms `0664`, 3 Mongos on `0.0.0.0`, 4 UFW rules).
- **R3** (ingress + palette-api provenance): RATIFIED-WITH-DELTA. Palette-api
  host dir has NO `.git/` (sharpens "rsync deploy" without contradicting);
  `/words` is 301 redirect not path-proxy (probe-text loose). Provenance
  answer: standalone rsync target on host, NOT `value.js/api/`.
- **R4** (constellation matrix + CF token): RATIFIED-WITH-DELTA (load-bearing).
  certbot-dns-cloudflare NOT installed → Path B HTTP-01 via `--apache` folded.
  Constellation matrix RATIFIED-AS-IS (4 compose projects, LE SAN set
  `{fourier,sudoku,words}.babb.dev`, keyframes.js not on host, grammar
  static-not-git). CF token discipline RATIFIED-AS-IS (gitignored, 0600, NOT
  rotated). Pilot-then-rollout ordering RATIFIED-AS-IS.

**Folded reconciliations (team-lead, central):**
- `coordination/CONSTELLATION-DEPLOY.md §3.2.a` (NEW) — Path B HTTP-01 binding.
- `coordination/CONSTELLATION-DEPLOY.md §8.1 step 2` — invocation updated.
- `D.md §3` W2 + W10 rows — `--dns-cloudflare` → `--apache` HTTP-01.
- `D.md §7` constellation `api.<app>` TLS path bullet — Path B noted.
- `waves/W2.md` — top-of-spec AMENDMENT block citing Wα-Δ-R4.1.
- `waves/W10.md` — top-of-spec AMENDMENT block citing Wα-Δ-R4.1.

**Wα-G1 through Wα-G10 all green.** No source change. Read-only host probes only.

**Next**: Wχ — 5 adversarial probes in 4+1 batches (P1+P2+P3+P4 parallel; P5
after) per `waves/Wchi.md §4`.

### 2026-05-27 — D.W0 opened (the baseline + dispatch gate)

**WHAT.** The user authorised execution ("Begin and continue the current tranche.
…Continue through this indefatigably: do not relinquish control back to me until
you have completed the plan IN TOTALITY. NO quick solutions, NO workarounds:
idiomatic, gestalt approaches.") W0 opens by binding the existing hardened
`waves/W0.md` as the baseline. The wave spec exists (5,388 L across W0/Wα/Wχ +
W1–W12, authored 2026-05-27 at `292897f`); W0's role is to ratify it as the
binding baseline + open the W0→Wα→Wχ research-first gate per `D.md §3`/§4.

**Gates landed (W0-G1 through W0-G12 per `waves/W0.md §11`):** C confirmed closed
(`docs/tranches/C/FINAL.md` reachable, `1e47115`); the pre-A prod-state baseline,
the live Mongo exposure, the design-debt catalog, the backend-legacy catalog, the
cross-repo CRUD cohesion catalog, the constellation deployment baseline, the three
new invariants (production parity / code-and-migration-together / token-system-
single-source), the §8 brittleness window provisional ratification, the C-residual
inheritance table, the Wα ratification dispatch charter, the Wχ probe set scope —
all captured in `waves/W0.md`. No source change.

**Next**: dispatch Wα as 2 parallel agents per `waves/Walpha.md §6` (Wα.a R1+R2
ratification; Wα.b R3+R4 ratification) producing the binding
`docs/tranches/D/research/README.md` index.

### Next action

D.W1 CLOSED-WITH-HOST-RESIDUALS — Phase 1 GREEN (Mongo exposure closed),
Phase 2 GREEN via SSH-trigger (first A/B/C → host deploy LIVE; host HEAD
advanced 8818ae5 → a6ba377; rollback proof captured). 2 residuals scoped to
W8/W9/W10. Next: W2 + W8 in parallel (file-disjoint).
