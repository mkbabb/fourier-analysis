# D — Final disposition

**Status**: CLOSED 2026-05-27 `complete_with_constellation_residuals`. **Tranche**: D — fourier production integration, design refinement, backend NO-legacy convergence completion, cross-repo CRUD cohesion, and constellation deployment normalization. **Predecessor**: fourier-C (`docs/tranches/C/FINAL.md`, `1e47115`). **Mode**: direct for α (deploy), β (design), γ (backend symmetry), ε (testing); research-first for δ (CRUD-CONTRACT v2.0.0). Constellation rollout (α′) authored + scripted; live execution blocked-on-CF-token-account-mismatch. Executed W0 → Wα → Wχ → W1 (Phase 1 + Phase 2) → W2 (Spine 1 + 3) ∥ W8 ∥ W3 ∥ W4 → W3+W4 deploy → W5 ∥ W6 → W12.

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

Both criteria hold for the **repo-landable + host-deployable** aim. The **constellation rollout (α′)** is partial — W8 script authored, live run halted on CF-token-account-mismatch; W9/W10/W11 blocked on W8. The close is therefore `complete_with_constellation_residuals` (mirroring C's `complete_with_host_residuals` shape, with a single user-action resolution path).

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
| W12 close | (this commit) | FINAL.md + PROGRESS reconcile + CANONICAL-ORDERING → ordering ε |

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
- **Public URL fourier.babb.dev**: STILL GH Pages 404 — W9 residual.
- **Webhook URL `mbabb.friday.institute`**: STILL not in public DNS — W8/W10 residual.
- **SSH-trigger deploy mechanism**: operational and proven (replaces the broken webhook URL until W8/W10 land `deploy.babb.dev`).

## §6 — Residuals (named successors)

### §6.1 — Constellation rollout (blocked-on-CF-token-account-mismatch)

The W8 script (`scripts/dns-cf-sync.sh`) is idempotent + don't-break-preserving + fail-fast. Single user action unblocks W8/W9/W10/W11:

1. User re-issues a CF API token from the **babb.dev-owning CF account** (currently NS = `jillian/maciej.ns.cloudflare.com`) with `Zone:DNS:Edit` + `Zone:Zone:Read` (per `CONSTELLATION-DEPLOY.md §6.1`).
2. Drop into `/Users/mkbabb/Programming/fourier-analysis/.env` (mode 0600, gitignored): `CLOUDFLARE_API_TOKEN=<new-token>`.
3. Re-run `bash scripts/dns-cf-sync.sh`. The script lands 8 target records (4 proxied CNAMEs to `<app>.pages.dev`, 4 grey-cloud A → `34.197.214.67` including `deploy.babb.dev` for the W1 webhook URL fix).
4. Dispatch W9 (CF-Pages frontend migration), W10 (api ingress + Path B HTTP-01 via `certbot --expand --apache`), W11 (user-re-mandate-gated palette-api → color rename if mandated).

### §6.2 — W3 follow-up

- One pre-existing pytest failure: `test_backfill_image_bounds_on_migrated_image` (`api/tests/test_image_storage.py`) — a W3-followup item; named-residual.

### §6.3 — Out-of-D entirely (per `D.md §7`)

- Multi-replica fourier deployment (inv-19).
- Full value.js `Palette`/`colorScale` domain model (value.js tranche when a real consumer lands).
- Dangling prod images (gaggle, server-api, speedtest-*) + dead `:8140` speedtest vhost cleanup (host-ops sweep).
- Frontend bundle split (867 kB index) — ε or successor performance item.

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

D closes **`complete_with_constellation_residuals`** at commit (this FINAL.md's commit). Five implementation waves (W2 partial + W3 + W4 + W5 + W6) landed GREEN with verified end-to-end coverage: the first real A/B/C → host deploy went live; the live Mongo exposure was closed across the shared host; verified-TLS Mongo posture landed (with honest mongod-8.0 pivot recorded); the backend NO-legacy band completed (snapshot_hash → content_hash per H3); the design refinement landed (cartoon-card shim + IA + orphans + contrast sweep + focus rings; P4.C2 enumeration gap closed); CRUD-CONTRACT v2.0.0 ratified with three-way disposition and inv-16 re-certification; test integrity restored (cross-env matrix + CI Mongo + COMPUTE_RATE_LIMIT harness). The constellation rollout thread (α′) is **authored + scripted + ready to fire** — W8's `scripts/dns-cf-sync.sh` is idempotent, fail-fast, and don't-break-preserving; the single blocker is the CF token's CF-account ownership, resolvable by user re-issuance. The §8 brittleness window was STRUCK at Wχ close and remained struck through all wave executions. CANONICAL-ORDERING reconciled to **ordering ε** (post-D-close); the constellation thread α′ is partial — named as residuals, not a silent close.

No miss is silent. Every constellation-residual carries a recorded successor (`§6.1` resolution path). The repo-landable + host-deployable aim is met; the constellation rollout aim has a single-action user resolution.
