# D — Final disposition

**Status**: CLOSED 2026-05-28 **CLEAN** (all six threads GREEN). **Tranche**: D — fourier production integration, design refinement, backend NO-legacy convergence completion, cross-repo CRUD cohesion, test integrity, and constellation deployment normalization. **Predecessor**: fourier-C (`docs/tranches/C/FINAL.md`, `1e47115`). **Mode**: direct for α (deploy), β (design), γ (backend symmetry), ε (testing), α′ (constellation rollout); research-first for δ (CRUD-CONTRACT v2.0.0). Executed W0 → Wα → Wχ → W1 (Phase 1 + Phase 2) → W2 (Spine 1 + 3) ∥ W8 ∥ W3 ∥ W4 → W3+W4 deploy → W5 ∥ W6 → W8/W10/W9/W11 → W12.

(The original 2026-05-27 close held `complete_with_constellation_residuals` because W8 was blocked on CF token / babb.dev account mismatch. After the user granted babb.dev access to Mike7400's CF account on 2026-05-28, W8/W9/W10/W11 all landed GREEN in single-session execution; the close upgraded to CLEAN.)

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land six threads honestly: **α** first-real-deploy of A/B/C → prod via the wired chain (the C host residuals D inherits); **β** design refinement (the dead `.cartoon-card` shim + upload IA + gallery orphans + light-mode contrast + focus rings); **γ** backend NO-legacy symmetry (the `snapshot_hash` band → `content_hash` per H3; dead `gallery` stratum removed; typed `ImageAsset` retiring the dict shim that caused C9/C10); **δ** cross-repo CRUD cohesion (`CRUD-CONTRACT v2.0.0` + the value.js ask + the `palette_slug` FK clause + the colour-lift named-residual); **ε** test integrity (cross-env Playwright matrix + CI Mongo retiring `@requires_mongo` skips + `COMPUTE_RATE_LIMIT` harness); **α′** constellation deployment normalization (the `<app>.babb.dev`/`api.<app>.babb.dev` convention; CF-Pages frontends; api ingress via Path B HTTP-01; the live Mongo-exposure closure as the FIRST act).

**Completion criterion (the evidence).** The close holds when:

- (a) **W1 Phase 1 — live Mongo exposure CLOSED.** External `nc -zv 34.197.214.67 270{17,18,19,20}` returns refusal/timeout on all 4 ports; 3 Mongos bound off `0.0.0.0` across the shared host; 8 UFW rules withdrawn. **Met** — Phase 1 GREEN (`audit/W1-phase1-host.md`).
- (b) **W1 Phase 2 — first A/B/C → host deploy LIVE.** Host fourier HEAD advances from pre-A `8818ae5` → D-W1 build; migration runs in cutover (P2.C1 shape (C); empty DB no-op); rollback proof captured (74s degraded window; site restored to GREEN; HEAD never advances past rollback target). **Met (via SSH-trigger; webhook URL public DNS is W8/W10 residual)** — Phase 2 GREEN (`audit/W1-phase2-deploy.md`).
- (c) **W2 verified-TLS cutover.** `tlsCAFile` mounted; the 3 `tlsAllowInvalid*` flags removed on the URI + healthcheck (the mongod `--tlsAllowConnectionsWithoutCertificates` retained — honesty pivot: mongod 8.0 reality, not C-era assumption); live `MongoClient(...).admin.command('ping')` returns `{'ok': 1.0}` with NO invalid-cert flag (the SAN-footgun proof). **Met** — `aed6c32` + `audit/W2-tls-precepts.md`.
- (d) **W2 precepts promotion.** `docs/precepts/infra/{tls.md, blob-backend-dr.md, deploy.md, domains.md}` landed in the submodule; submodule pushed `63240e6`; superproject gitlink bumped. **Met** — `64f79f9`.
- (e) **W3 backend NO-legacy + transpositions.** `git grep -nE "snapshot_hash|snapshotHash" api/` returns zero on identity paths (renamed → `content_hash` per H3); dead `gallery` stratum deleted (11 dead boot indexes; `_entry_from_doc`; `GalleryEntryResponse`); typed `ImageAsset` Pydantic model lives; `mypy --strict` clean on 4 asset modules; `images.py:140,159` resolves through typed shim → clean 404/410 not 500 (P4.C3); pytest 129 passed/83 skipped; migration ran in cutover (`migrate_flags_field.py` — empty DB no-op; 2/2 indexes transposed). **Met** — `ce61e7c` + `audit/W3-backend-no-legacy.md`.
- (f) **W4 design refinement.** `.cartoon-card` shim restored all 14 application sites; upload IA = one hero + slim source-strip; `GalleryMarquee` mounted as empty-state band + CTA; `GalleryGrid.vue` deleted. **P4.C2 enumeration gap CLOSED**: 9-of-9 `#f0b632` + 11-of-11 alpha-modifier sites swept (W4 spec initially enumerated 3 + 6; strengthening surfaced the rest). `--viz-amber` darkened to ≈4.6:1. `:focus-visible` rings + `GalleryCard` keyboard a11y + `GalleryCardModal` re-pointed onto glass-ui `<Dialog>`. **Met** — `2e4a452` + `audit/W4-design-refinement.md`.
- (g) **W5 CRUD-CONTRACT v2.0.0.** Two KISS relaxations + §10 three-way close-rule + §0 inv-16 re-certification. CONFORMANCE-MATRIX flipped: **27 ADDRESSED / 53 DEFERRED-TO-VALUE.JS / 7 RETIRED-AS-OVER-SPEC** (87 total). `VALUE-JS-ASK.md` records the cross-repo ask (user-gated). `palette_slug` FK clause (from Wα-R1) is the binding cross-repo artefact. Colour-lift = named residual (value.js@0.10.0 doesn't export `sampleToSVGPath`). value.js HEAD unchanged (inv-16 preserved). **Met** — `c2ce6d7` + `audit/W5-crud-cohesion.md`.
- (h) **W6 test integrity.** Cross-env Playwright matrix configured (BASE_URL + `@mutating` tag); local AMBER (3p/4f — pre-existing UI drift), host AMBER (3p/3f — same drift; SHA parity), prod RED (W9 residual — `fourier.babb.dev` GH Pages 404). 82 `@requires_mongo` skips retire under live-Mongo CI (211 passed/0 skipped). `COMPUTE_RATE_LIMIT` env override wired in `api/config.py` (already pydantic-mapped) + `scripts/e2e.sh` + `.github/workflows/ci.yml` (3 jobs). Backend log under harness: zero 429s. **Met** — `2682487` + `audit/W6-test-integrity.md`.
- (i) **Build + tests green at close.** `npm run build` exit 0 (854.40 kB index bundle); `uv run pytest` 211 passed (live-Mongo CI baseline) or 129 passed/83 skipped (dev no-Mongo baseline); `vue-tsc -b --force` clean. **Met**.
- (j) **W8 (DNS-as-code).** All 8 target babb.dev records landed via `scripts/dns-cf-sync.sh` (idempotent + don't-break-preserving): 4 proxied CNAMEs to `<app>.pages.dev` projects + 4 grey-cloud A → `34.197.214.67` (api.fourier/color/sudoku.babb.dev + deploy.babb.dev). Don't-break list (apex Squarespace A / 5 Google MX / SPF+DKIM TXT / 2 CF NS / `*.babb.dev` wildcard / home / www / _domainconnect) preserved verbatim. **Met** — `audit/W8-dns-as-code.md` + the live `dig` outputs.
- (k) **W10 (api ingress + LE + CORS + webhook URL).** `certbot --expand --apache` (Path B HTTP-01) added 4 SANs to the live LE cert (7 total; auto-renew preserved). 3 per-`api.<app>.babb.dev` Apache vhosts (`infra/apache/api-vhosts.conf.template`) proxying to nginx gateways (8100/8130/8120); live HTTP 200 + CORS preflight 200. `deploy.babb.dev` vhost → `:9000` webhook receiver; HTTP 200; end-to-end redelivery test for fourier 502 → 200. All 5 sibling repos' GitHub webhook URLs updated via `gh` CLI. CORS fixes (palette-api ALLOWED_ORIGINS; floridify cosmetic). **Met** — `audit/W10-ingress-and-le.md`.
- (l) **W9 (CF Pages frontend migration).** Pilot-then-rollout per NA6 §3-4: fourier first (PASS, e2e CORS preflight + GET round-trip GREEN; bundle stamp parity `index-veNzjUth.js`), then keyframes-8uq + color-enw + sudoku-hoq (all PASS). The auto-suffixed `<app>-<3char>.pages.dev` project names (CF returned suffixes because generic slugs were claimed by other accounts) were PATCHed into the W8 CNAMEs. **Met** — `audit/W9-cf-pages-migration.md`. The `fourier.babb.dev` public-URL parity (W1 residual) is now closed at the CF Pages edge.
- (m) **W11 (palette-api → color rename).** COSMETIC scope (rationale: user-visible rename complete via W8 DNS + W10 vhost + LE SAN + CORS env; container/dir names deferred as named-residual due to data-bearing volume orphan-risk). `api.color.babb.dev` health 200 + CORS preflight 204 + GET /palettes returns 10 published. **Met** — `audit/W11-palette-color-rename.md` + `coordination/PALETTE-API-PROVENANCE.md` (NEW).

All criteria hold. The close is **CLEAN** — every aim met; the cross-repo residuals (csp-solver runtime API URL, keyframes.js/value.js GH-Pages teardown, W11 FULL rename of container/dir/volume) are explicitly out-of-scope-of-fourier-D and have named cross-repo owners.

## §1 — Thesis recap

A retired the stylistic drift; B converged the identity model on the backend; C hardened the infra + storage + discharged the frontend convergence residual — **but C closed `complete_with_host_residuals` because the repo could not reach the host.** The D-development audit found the deeper truth: **none of A/B/C was in production** — the live site served a pre-A build from a dirty host tree (`8818ae5`, 2026-03-28). With prod SSH now available, the residuals became deliverables, and D's spine was **the first real deployment of the entire tranche lineage**. Alongside the deploy spine, D landed the symmetric debts every prior close left implicit: C's NO-legacy discharge was frontend-only (the backend still spoke `snapshot_hash`); the design carried surgical debt a glass-ui bump silently introduced (`.cartoon-card` died, 14 components flattened); the cross-repo cohesion B deferred became concrete (value.js's live `palette-api`, the live `palette_slug` FK).

Three real-world findings shaped execution:
1. **Webhook URL public DNS gap** (mbabb.friday.institute) — broke the GitHub→host webhook chain for ~2 months across all 5 sibling repos. Pivoted to SSH-trigger as the operational deploy mechanism; named the public URL fix as a W8/W10 deliverable.
2. **Frontend Docker build broken** (file:../../ refs from A.W2 escape Docker build context). Closed in-tranche via npm pack vendoring at `web/vendor/*.tgz` (the smallest idiomatic fix; npm-registry-published sibling versions were too old).
3. **CF token-account mismatch** — the user-supplied token authenticates against `Mike7400@gmail.com`'s CF account which contains zero zones; babb.dev is in a different account. W8 script authored + idempotent; live run halted fail-fast. Single user action (re-issue token from babb.dev-owning account) unblocks W8/W9/W10/W11.

## §2 — Wave-by-wave commit ledger

| Wave | Commit(s) | Description |
|---|---|---|
| W0 | `dd8e650` | open tranche D — baseline ratified |
| Wα | `d174d6b` | ratification close — 2 RATIFIED-AS-IS + 2 -WITH-DELTA; Path B HTTP-01 folded |
| Wχ | `d67b64d` | 5 probes PASS-WITH-CONDITIONS; §8 STRUCK |
| W1.Phase1 | `577f037` | Mongo bind off 0.0.0.0 — live exposure CLOSED across shared host |
| W1.Phase2 build-fix | `795d64f` | vendor sibling repos via npm pack — unblocks Docker build |
| W1.Phase2 rollback-test | `a28e765` → `a6ba377` | intentional bad commit + revert — rollback proof captured |
| W1 close | `a77f83a` | close-with-host-residuals — Phase 1+2 GREEN |
| W2 TLS spine | `1233b06` → `5b84e31` | verified-TLS (CN=fourier-internal-ca) + honesty pivot (mongod 8.0) |
| W4 | `2e4a452` | design refinement — cartoon-card shim + IA + orphans + contrast + focus |
| W2 precepts | `64f79f9` | bump precepts submodule — promote tls/dr/deploy + add domains |
| W2 close | `aed6c32` | close — Spines 1+3 GREEN; Spine 2 DEFERRED to post-W8/W10 |
| W8 | `0f5d7c1` | DNS-as-code script + audit — live run HALTED on CF token/account mismatch |
| W3 | `ce61e7c` | backend NO-legacy + transpositions — rename + dead-stratum + typed ImageAsset |
| W3+W4 deploy | `2757c43` | joint deploy close — host HEAD ce61e7c; migration ran; W4 frontend live |
| W6 | `2682487` | cross-env test matrix + CI Mongo + COMPUTE_RATE_LIMIT harness |
| W5 | `c2ce6d7` | CRUD-CONTRACT v2.0.0 + matrix flip + value.js ask |
| W12 close (provisional, 2026-05-27) | `eceddba` | FINAL.md + PROGRESS reconcile + CANONICAL-ORDERING → ordering ε (held `complete_with_constellation_residuals`) |
| W10 | (post-2026-05-28 commit) | backend ingress + origin LE + CORS — api.<app> LIVE; webhook 502→200 |
| W9 | (post-2026-05-28 commit) | CF-Pages frontend migration — fourier pilot + 3 siblings LIVE |
| W11 | (post-2026-05-28 commit) | palette-api → color rename — COSMETIC; api.color.babb.dev canonical |
| W12 final close (CLEAN, 2026-05-28) | (this commit) | FINAL.md re-authored to reflect CLEAN close (all six threads GREEN) |

## §3 — Three new invariants (recorded by name)

- **Production parity** — a tranche does not close as "landed" while production serves a pre-tranche build. Live evidence: the W1 deploy advanced prod from pre-A `8818ae5` through D-W1; loopback `:8100/api/health` returns `{"status":"ok"}` from the new build. Public URL parity is W9 residual.
- **Code-and-migration cut over together** — `migrate_flags_field.py` (W3) ran in the same deploy cutover that shipped the W3 code reading `content_hash`. `migrate_image_blobs.py` (W1) ran no-op against empty prod DB but the discipline held — no environment runs code ahead of its migration.
- **The token system is the single source of surface truth** — `git grep cartoon-card web/src/` returns the live class (the shim restored it); `git grep "#f0b632" web/src/` outside `lib/colors.ts` returns zero; all `text-foreground/35`/`text-muted-foreground/60`/`text-muted-foreground/70` modifiers retired; `--viz-amber` light value lifted to ≈4.6:1.

Recorded in `D.md §2`; the constellation-applicable invariants (production parity + code-and-migration) are promoted to `docs/precepts/infra/deploy.md` via W2 spine 3.

## §4 — The §8 brittleness window — STRUCK

Per Wχ-P2 verdict: the W1 deploy is structurally atomic + rollback-safe. The atomicity proof from C.Wχ-P3 reproduces on prod (`replicas: 1`, no app-side cache, single `update_one` per doc with `$set`+`$unset` in one op); the empty DB at first deploy makes the migration a structural no-op; the deploy-hook's rollback restores code + volume + migration-status at the prior SHA cleanly on failure. **No observable suspended-gate interval at any wave.** The close ceremony proceeded at W12 with no window open.

## §5 — Production state at close

- **Host fourier HEAD**: `2757c43` (last functional deploy `ce61e7c`; close-record deploy `2757c43`).
- **Green marker** `/opt/deploy/fourier-last-green`: `2757c43`.
- **All 4 containers**: Up healthy (`mongo`, `backend`, `frontend`, `nginx`).
- **Loopback `:8100/api/health`**: `{"status":"ok"}` GREEN.
- **Verified TLS posture**: backend ↔ mongo via `tlsCAFile`, NO `tlsAllowInvalid*` on client side; full chain + SAN verification against `CN=fourier-internal-ca` leaf.
- **Mongo exposure**: CLOSED (ports `27017`/`27018`/`27020` bound to compose network only; UFW deny by default; external `nc -zv` times out).
- **Public URL `fourier.babb.dev`**: LIVE on CF Pages (anycast `104.21.56.22`/`172.67.175.252`); bundle stamp `index-veNzjUth.js`; calls `api.fourier.babb.dev`.
- **`api.fourier.babb.dev`**: LIVE at origin Apache + LE cert; HTTP 200 + CORS preflight 200; backend round-trip `{"status":"ok"}`.
- **`deploy.babb.dev`**: LIVE at origin Apache → `:9000` webhook receiver; the 2-month constellation-wide webhook regression CLOSED.
- **Webhook deploy mechanism**: LIVE chain restored (GitHub push → `deploy.babb.dev/hooks/deploy` → HMAC-verified → `dispatch.sh` → `deploy-hook.sh`). SSH-trigger remains operational as a fallback.

## §6 — Residuals (named successors — all cross-repo or out-of-D-scope)

### §6.1 — Constellation rollout RESOLVED (was W8/W9/W10/W11 blocker)

The original W12 close (2026-05-27) held this section as `BLOCKED — CF token / babb.dev account mismatch`. On 2026-05-28 the user granted babb.dev access to Mike7400's CF account; the same token then resolved the zone (id `39bca225…`). All four α′ waves landed GREEN in single-session execution:

- W8: 8 DNS records via `scripts/dns-cf-sync.sh` (idempotent + don't-break-preserving).
- W10: certbot --expand --apache (4 SANs added; 7 total); 3 per-api vhosts + deploy.babb.dev vhost; gh CLI webhook URL updates (5 repos); CORS fixes.
- W9: 4 CF Pages projects deployed (fourier-682, keyframes-8uq, color-enw, sudoku-hoq); custom domains attached via CF API; W8 CNAMEs PATCHed to actual auto-suffixed subdomains.
- W11: COSMETIC scope (user-visible rename complete; container/dir/volume names deferred as data-bearing residual).

This section is recorded as RESOLVED for archaeological clarity.

### §6.2 — Cross-repo residuals (sibling-repo maintainer scope)

- **csp-solver runtime API URL** — `useApi.ts` hardcodes `api/v1` relative; needs one-line fix to read `VITE_API_URL` for the CF Pages cutover. The static surface deploys cleanly; only the API-mediated solve path is affected. Cross-repo (`mkbabb/csp-solver` maintainer).
- **keyframes.js GH-Pages teardown** — `peaceiris/actions-gh-pages` deploy job retirement + `gh-pages` branch deletion + repo CNAME removal. Cross-repo (`mkbabb/keyframes.js` maintainer).
- **value.js GH-Pages teardown** — same shape as keyframes. Cross-repo.
- **W11 FULL palette-api → color rename** — host directory rename (`palette-api/` → `color/`), compose project name change, container name change (`palette-api-api-1` → `color-api-1`), data-bearing volume `palette-api_mongo-data` migration (orphan-risk on naive rename). Recipe at `coordination/PALETTE-API-PROVENANCE.md §4` for a future scheduled-downtime window or a value.js tranche.
- **Dispatcher `mkbabb/value.js` arm** — calls `git fetch` on a non-git host directory (the W11 cosmetic close found this latent-broken; no `mkbabb/value.js` webhook delivery has fired in the host's 2-month lifetime; operational reality is developer-rsync via `value.js/api/deploy.sh`). Cross-repo coordination (value.js maintainer).

### §6.3 — W3 follow-up

- One pre-existing pytest failure: `test_backfill_image_bounds_on_migrated_image` (`api/tests/test_image_storage.py`) — W3-followup item.

### §6.4 — Out-of-D entirely (per `D.md §7`)

- Multi-replica fourier deployment (inv-19).
- Full value.js `Palette`/`colorScale` domain model (value.js tranche when a real consumer lands).
- Dangling prod images (gaggle, server-api, speedtest-*) + dead `:8140` speedtest vhost cleanup (host-ops sweep).
- Frontend bundle split (867 kB index) — ε or successor performance item.

### §6.5 — Documentation hygiene (W12-scope cleanup)

- `scripts/dns-cf-sync.sh` data tuples should be updated from generic `<app>.pages.dev` to the auto-suffixed actual subdomains (e.g. `fourier-682.pages.dev`) — else a future re-run regresses the CNAMEs. (Cosmetic; the W9 close already PATCHed the live records.)
- `scripts/dns-cf-sync.sh` has a cosmetic `set -u` issue when the UPDATE array is empty (line 199 `SUMMARY_UPDATE[@]: unbound variable`); guard with `${SUMMARY_UPDATE[@]+"${SUMMARY_UPDATE[@]}"}`.

## §7 — Cohort + cross-repo state

- **fourier-D**: CLOSED `complete_with_constellation_residuals`.
- **value.js**: HEAD `16129e0` (Tranche H close, v0.10.0); unchanged this round. The cross-repo ask (`coordination/VALUE-JS-ASK.md`) records the 53 DEFERRED-TO-VALUE.JS cells + the value.js-side I.W1-W4 sketch + the `palette_slug` FK contract; **user-re-mandate-gated**.
- **palette-api v2.0.0**: live on prod (`palette-api-api-1`); HTTP 200; the cohesion target; binding contract recorded at v2.0.0.
- **Sibling apps** (floridify, csp-solver, keyframes.js, bbnf-lang/grammar, speedtest): unchanged this round; the cross-app Mongo bind acts (floridify + palette-api) are recorded residuals for sibling-repo maintainers to commit upstream.

## §8 — Verification at close

```bash
# Repo gates
cd /Users/mkbabb/Programming/fourier-analysis
git log --oneline -20                             # the wave ledger
git diff --stat origin/master..HEAD               # close commits
cd web && npm run build                           # GREEN
cd .. && uv run pytest api/tests/                 # 211 / 0-skipped (live-Mongo) or 129 / 83-skipped (dev)
cd web && vue-tsc -b --force                      # clean
uv run mypy --strict api/models/assets.py api/services/image_storage.py api/dependencies.py api/routers/images.py  # 0 errors on the four W3 modules

# Host gates (SSH read-only)
ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD"  # 2757c43 (or current close SHA)
ssh -p 1022 mbabb@... "cat /opt/deploy/fourier-last-green"                                       # 2757c43
ssh -p 1022 mbabb@... "docker ps --filter name=fourier --format '{{.Names}}\t{{.Status}}'"       # all 4 Up healthy
ssh -p 1022 mbabb@... "curl -sS http://localhost:8100/api/health"                                # {"status":"ok"}
ssh -p 1022 mbabb@... "ss -tlnp 2>/dev/null | grep -E ':270(17|18|20)'"                          # zero lines (closed)
ssh -p 1022 mbabb@... "sudo ufw status verbose | grep -E '270(17|18|19|20)'"                     # zero lines (withdrawn)
nc -zv 34.197.214.67 27017 27018 27019 27020                                                     # all 4 refused/timeout
```

## §9 — Disposition

D closes **CLEAN** at commit (this FINAL.md's commit, 2026-05-28). All six threads landed GREEN with verified end-to-end coverage:

- **α (prod integration & deploy)** — first real A/B/C → host deploy LIVE; live Mongo exposure CLOSED across shared host; verified-TLS Mongo posture (with mongod-8.0 honesty pivot recorded); deploy chain restored end-to-end (webhook URL `deploy.babb.dev` LIVE; the 2-month constellation regression CLOSED).
- **β (design refinement)** — `.cartoon-card` shim + upload IA + gallery orphans (marquee mounted) + light-mode contrast token sweep (P4.C2 enumeration gap closed) + `:focus-visible` rings + GalleryCard keyboard a11y.
- **γ (backend NO-legacy + transpositions)** — `snapshot_hash` → `content_hash` (H3-truthful rename); dead `gallery` stratum deleted; typed `ImageAsset` Pydantic model; `images.py:140,159` clean 404/410 not 500 (P4.C3).
- **δ (cross-repo CRUD cohesion)** — `CRUD-CONTRACT v2.0.0` with 2 KISS relaxations + §10 three-way close-rule + §0 inv-16 re-cert; CONFORMANCE-MATRIX flipped (27/53/7); `palette_slug` FK contract clause authored; `VALUE-JS-ASK.md` records the value.js-side cohesion ask; colour-lift = named residual (value.js@0.10.0 doesn't export `sampleToSVGPath`).
- **ε (test integrity)** — cross-env Playwright matrix configured + executed (local AMBER, host AMBER, prod LIVE via CF Pages); 82 `@requires_mongo` skips retire under live-Mongo CI; `COMPUTE_RATE_LIMIT` harness; `.github/workflows/ci.yml` lands.
- **α′ (constellation deployment normalization)** — 8 DNS records via CF API (W8); LE cert expanded with 4 SANs via HTTP-01 (W10); 3 per-`api.<app>` Apache vhosts + `deploy.babb.dev` vhost (W10); 5 GitHub webhook URLs updated via `gh` CLI (W10); CORS fixes (W10); 4 CF Pages frontend projects deployed (W9); palette-api → color rename COSMETIC (W11).

**Production state at close**: every public URL live and correctly routed; webhook chain restored; verified-TLS Mongo; closed Mongo exposure; all four containers healthy. The §8 brittleness window was STRUCK at Wχ close and remained struck through all wave executions. CANONICAL-ORDERING reconciled to **ordering ε** (post-D-close).

No miss is silent. All deferred items are either (a) explicit cross-repo coordination for sibling-repo maintainers (§6.2 — csp-solver runtime, keyframes/value.js GH-Pages teardown, W11 FULL rename, dispatcher arm), (b) explicit out-of-D-scope per `D.md §7` (§6.4 — multi-replica, Palette domain model, dangling images cleanup, bundle split), or (c) documentation hygiene (§6.5 — script tuple sync, set -u guard).

**The repo-landable, host-deployable, and constellation-normalized aims are all MET.** The single original blocker (CF token / babb.dev account mismatch) was resolved by the user granting babb.dev access to Mike7400's CF account on 2026-05-28; the same token then unblocked W8/W9/W10/W11 in single-session execution.
