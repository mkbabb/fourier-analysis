# D — production integration, design refinement, backend convergence completion, and cross-repo CRUD cohesion

**Tranche letter**: D — fourier-analysis's production-deployment, design-refinement, NO-legacy-completion, and cross-repo-cohesion tranche; successor to C (infra + storage + B-residual discharge).
**Predecessor close**: C — `docs/tranches/C/FINAL.md` (close commit on master); C closed `complete_with_host_residuals` — repo-landable aim clean, host-coupled acts named. **D is where those acts land**, because prod SSH is now available.
**Cohort**: **partly cross-repo.** Threads α/β/γ/ε are fourier-local; thread δ (palette/visualization CRUD cohesion) reaches **value.js** — whose live, deployed `palette-api` v2.0.0 is the cohesion target, and into whose palette noun fourier already holds a live slug-FK (`visualization.palette_slug`). The value.js side is user-re-mandate-gated.
**Mode**: **direct** for α (deploy — procedures recorded in C's residuals), β (design — findings concrete), γ (backend symmetry — fix-at-root), ε (testing); **research-first** for δ (CRUD-CONTRACT v2.0.0 design + value.js's open-thesis alignment).
**Open**: TBD (after the user authorises D.W0).
**Authored**: 2026-05-27 (the 10-lane D-development audit — 6 `DA*` + 4 `design/DA-design-A*` + `validation-matrix.md` — `docs/audits/runs/2026-05-27-D-audit/SYNTHESIS.md`).

## Goal criterion (tranche-level)

D exists to land five threads honestly:

- **α — production integration & deploy**: the tranche work of A/B/C, currently NOT in production (prod serves pre-A `8818ae5`), is deployed for the first time through a real, observable, rollback-capable chain — on a shared multi-app host — with the verified-TLS cutover, the image-blob volume + migration (code-and-migration atomic), the deploy-hook wired in, the hook secret hardened, the staged precepts promoted, **the domain split landed (`fourier.babb.dev` frontend + `api.fourier.babb.dev` backend, per the `<app>.babb.dev` / `api.<app>.babb.dev` convention)**, and **the publicly-exposed Mongo bound to loopback** (a real exposure — `fourier-analysis-mongo` is on `0.0.0.0:27017` today).
- **β — frontend design refinement**: the shipped surface's surgical design debt is repaired (the dead `.cartoon-card` class restored across its 14 consumers; the workspace upload IA resolved; the gallery orphans resolved; the light-mode contrast cluster swept; `:focus-visible` rings restored) — refinement, not rebrand.
- **γ — backend NO-legacy symmetry + architectural transpositions**: the slug-identity convergence is completed on the **backend** (symmetric to C.W4's frontend discharge — the `snapshot_hash` band gone end-to-end); the dead `gallery` collection stratum is removed; the untyped image-asset `dict` shim becomes a typed model (retiring the class of bug that produced C9/C10).
- **δ — cross-repo palette/visualization CRUD cohesion**: `CRUD-CONTRACT v2.0.0` is re-ratified (two KISS relaxations) and both repos reach a cohesive spec — fourier-light (it already conforms), value.js-heavy in its own idiom (visibility split, soft-delete, the SOTA envelopes); the inverted colour-lift (`sampleToSVGPath`) lands as a bounded sub-item.
- **ε — test integrity**: both apps are validated across local/dev/prod (prod non-mutating); a CI Mongo retires the load-bearing `@requires_mongo` skips; the compute-rate-limit e2e harness lands.
- **α′ — constellation deployment normalization** (added 2026-05-27, the 6-lane normalization audit): every app reaches `<app>.babb.dev` (frontend, **proxied CF Pages**, single-level, free Universal SSL) + `api.<app>.babb.dev` (backend, **DNS-only A→origin, served by certbot LE on the mbabb server we control**, free, no ACM); DNS programmatic via the CF API; the GitHub-Pages apps (color, keyframes.js) move to CF Pages; **the live critical exposure — three Mongos publicly reachable on `34.197.214.67` — is closed as the FIRST act of W1 (front-loaded security)**; fourier is the pilot, the proven recipe rolls to the others. The CF token is held in gitignored `.env`s + the CI secret store (saved 2026-05-27 per user direction); not rotated. `coordination/CONSTELLATION-DEPLOY.md` is the binding plan.

## Completion criterion (tranche-level)

Every wave lands its hard gates or names an honest successor. The binding close evidence: **prod serves the D-HEAD build** (recorded commit-to-deploy chain + a captured rollback proof); `git grep snapshot_hash` returns zero on **backend** identity paths (symmetric to C); the dead `gallery` stratum is deleted (no boot index, no model, no helper); `git grep cartoon-card` returns zero dead references (the class lives or every consumer is migrated); the light-mode axe sweep is clean (no AA contrast fail on the measured surfaces); `CRUD-CONTRACT v2.0.0` is ratified with the value.js conformance disposition recorded; the cross-env test matrix is green (or each red cell carries a named cause); `uv run pytest` green, `vue-tsc -b --force` green, `npm run build` succeeds. The §6 hard-gate list is the binding ledger; `PROGRESS.md` reconciles to reality; `FINAL.md` cites every commit + gate.

## §1 — Thesis

A retired the stylistic drift; B converged the identity model on the backend; C hardened the infra + storage + discharged the frontend convergence residual — **but C closed `complete_with_host_residuals` because the repo could not reach the host.** The D-development audit found the deeper truth: **none of A/B/C is in production** — the live site is a pre-A build from a dirty host tree (`8818ae5`, 2026-03-28). With prod SSH now available, the residuals become deliverables, and D's spine is **the first real deployment of the entire tranche lineage**. Alongside it, the audit surfaced the symmetric debt every prior close left implicit: C's NO-legacy discharge was frontend-only (the backend still speaks `snapshot_hash`); the design carries surgical debt a glass-ui bump silently introduced (`.cartoon-card` died, 14 components flattened); and the cross-repo cohesion B deferred is now concrete (value.js's live `palette-api`, the live `palette_slug` FK). D completes what the lineage made true but never finished — at the root, in production, across both repos.

D is composed of **five intentionally separable threads** sequenced so production-readiness precedes the deploy that exercises it:

- **α prod integration & deploy** — well-scoped operational engineering following C's recorded host-residual procedures (`C/FINAL.md §6`, `C/coordination/DEPLOY-RECONCILE.md`, `C/infra/tls.md §9`) + `memory/project_infra_plan.md`.
- **β design refinement** — surgical, from the 4 design lanes; the `.cartoon-card` shim is the single highest-leverage fix (one change lifts 14 components).
- **γ backend symmetry + transpositions** — bounded fix-at-root + the elegance/simplicity transpositions the user mandates (dead-stratum removal, typed asset model).
- **δ CRUD cohesion** — open-design (research-first); value.js-heavy, user-re-mandate-gated on the value.js side.
- **ε test integrity** — direct; the cross-env matrix + CI Mongo + the rate-limit harness.
- **α′ constellation deployment normalization** (the 2026-05-27 expansion) — the `<app>.babb.dev`/`api.<app>.babb.dev` pattern across the constellation (fourier the pilot), CF-Pages frontends, programmatic DNS, and the live Mongo-exposure closure; `coordination/CONSTELLATION-DEPLOY.md` is the binding plan. Two findings gate it: a **live critical security exposure** (three Mongos on the public Internet) and the **`api.<app>` TLS ceiling** (CF free Universal SSL is single-level — ACM ~$10/mo or `<app>-api.babb.dev`, a user decision).

KISS (invariant 12) and NO-legacy are load-bearing across all five. The threads share few files; α precedes the deploy-dependent verification; γ and β run parallel (disjoint: `api/**` vs `web/src/**`); δ is cross-repo + gated; ε spans both.

## §2 — Invariants

D inherits all prior invariants (`A.md §3`, `B.md §2`, `C.md §2`) unchanged. (Note: the C-era numbering of its three additions as 18/19/20 overlaps B's 18–24 range — a known doc inconsistency. **Reconciled at fourier-F.W6 (C9):** see the canonical ledger `docs/tranches/INVARIANTS.md`, which records C's additions as `C-Inv 18′ / 19′ / 20′` and blesses the by-name binding D already practises. D binds by *name* not number; the ledger is the locatable index.) D adds three, by name:

- **Production parity** — a tranche does not close as "landed" while production serves a pre-tranche build. The deployed prod HEAD equals the closed-tranche HEAD (or the gap is a named, dated residual with a deploy date). The DA4 lesson: A/B/C all "closed" while prod ran a build predating all three. Testable gate: the recorded commit-to-deploy chain shows prod at D-HEAD; `curl` of the live `/api/health` + a build-stamp confirms it.
- **Code and migration cut over together** — a storage/schema migration and the code that assumes its post-condition deploy atomically, in **every** environment (local, dev, prod); no environment runs code ahead of its migration. The validation lesson: the W5 serving code subscripts `storage_uri` and 500s on any unmigrated doc, and the migration had run nowhere. Testable gate: the deploy chain runs the migration in the same cutover that ships the code; a post-deploy probe finds zero unmigrated docs.
- **The token system is the single source of surface truth** — no dead style class is referenced (`.cartoon-card`), no hardcoded colour stands where a token exists, and every surface resolves through the glass-ui light/dark token system with measured AA contrast in **both** themes. The design lesson: a glass-ui bump killed `.cartoon-card` and 14 components silently flattened; light mode carries a systematic AA-contrast cluster. Testable gate: `git grep cartoon-card` → zero dead refs; an axe light-mode pass clean on the measured surfaces.

D opens with **one provisional brittleness window** (§8) for the prod deploy + migration cutover; the filesystem cutover is atomic per-doc (proven at C.Wχ-P3), so the window governs only the deploy-chain span, not a dual-read.

## §3 — Wave schedule (provisional — hardened at challenge close)

| Wave | Title | Thread | Agents | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Open · baseline · research dispatch* | — | 1 | C confirmed closed; the prod-state baseline snapshot (the `8818ae5` gap, the dirty tree, the empty DB, the missing volume) committed; the design-debt + backend-legacy catalogs committed; δ research dispatched; §8 window ratified | planned |
| Wα — *Research wave (ratification + narrowed dispatch)* | δ/α/α′ | 2-3 parallel | **The dev-era audit (DA1-6 + design A1-4 + NA1-6, the 10+6 lanes) already executed Wα's substantive work** — Wα at execution is therefore **ratification, not greenfield research**: confirm the dev-era findings against the live tree at execution-time, dispatch at-most-one narrowed follow-up if anything genuinely changed. Four ratification lanes: **R1** CRUD-cohesion v2.0.0 + `palette_slug` FK contract + the `C4.5/C4.6` visibility-transition guard disposition (W3 vs δ); **R2** prod-deploy-safety re-probe (shared-host blast radius; dirty-tree reconcile; migration-with-deploy ordering; rollback safety); **R3** ingress + the **palette-api provenance reconcile** (NA1 answered: prod rsyncs from standalone `/home/mbabb/Programming/palette-api`, not `value.js/api/`; W11 ratifies); **R4** constellation matrix + CF-token discipline. Each lane verdict: RATIFIED-AS-IS or RATIFIED-WITH-DELTA. Produces `docs/tranches/D/research/README.md` index | planned |
| Wχ — *Challenge wave* | — | **5 probes in 4+1 batches** (4-agent ceiling) | **P1** co-tenant blast radius (does the plan avoid breaking floridify/palette-api — shared dispatcher, Apache ingress); **P2** migration-with-deploy genuinely atomic + rollback-safe on real prod data; **P3** contract v2.0.0 cohesion is KISS — no shared framework/codegen (inv-16); **P4** β refinements stay refinement (no rebrand) + γ removals delete only genuinely-dead code; **P5** α′ rollout proves on fourier-the-pilot first; DNS change-set safe (mail/apex preserved); the `api.<app>` TLS path real (grey-cloud + origin LE, not a handshake failure) | planned |
| W1 — *Security hotfix (live exposure) + first prod deploy* | α/α′ | 2 | **FIRST: bind all three Mongos off `0.0.0.0` (fourier `:27017`, floridify `:27018`, palette `:27020`) — compose `ports:` → `127.0.0.1:` or no-publish; withdraw the four UFW `ALLOW` rules; the live public-Internet exposure closed across the shared host.** THEN: the dirty host tree reconciled + the inline Mongo secret extracted; the fourier arm wired to the improved `deploy-hook.sh`; hook perms `0664→0600`; `image_blobs` volume created; the **first real A/B/C→prod deploy** via the gated chain; the migration run in the same cutover; recorded commit-to-deploy + rollback transcripts | provisional |
| W2 — *Verified-TLS + domain split + precepts promotion* | α | 1-2 | `gen-mongo-certs.sh` run (issuer `CN=fourier-internal-ca`); the `infra/tls.md §9` 3-site diff (provision-before-flags); live verified-cert ping; **the fourier domain split** — DNS `api.fourier.babb.dev` (grey-cloud A → origin per the resolved TLS path); `certbot --expand --apache -d sudoku.babb.dev,fourier.babb.dev,words.babb.dev,api.fourier.babb.dev` (**HTTP-01 via the existing `--apache` plugin** per `CONSTELLATION-DEPLOY §3.2.a` — the binding implementation; the `dns-cloudflare` plugin is absent on the host, Wα-Δ-R4.1; LE challenge resolves through the origin Apache directly since the api host is grey-cloud); host-Apache vhost (`fourier.babb.dev`→frontend, `api.fourier.babb.dev`→backend `localhost:8100`); the client `VITE_API_URL` env (the live var name — `.env.example:55`, `web/src/lib/api.ts:18`) moved off same-origin `/api` to `https://api.fourier.babb.dev`; `CORS_ORIGINS=https://fourier.babb.dev`; the staged `C/infra/*` (`tls.md`, `blob-backend-dr.md`) + the deploy precept + a new `domains.md` (the `<app>.babb.dev`/`api.<app>.babb.dev` naming precept) promoted into the `docs/precepts/` submodule (a real submodule push + gitlink bump) | provisional |
| W3 — *Backend NO-legacy + transpositions* | γ | 2 parallel | the backend `flags.snapshot_hash` band → **`content_hash`** (the truthful rename target per H3's live-tree probe: `admin.py:218,606` store the content-sha in this slot, `:534` aggregates as a regroup key per content-hash; the field is a moderation FK to image content, NOT a user-facing slug like C.W4's frontend discharge — `database.py:125-126` field+unique index, 9 admin sites; a load-bearing `migrate_flags_field.py` migration mirroring C.W5 carries the rename atomically); the dead `gallery` collection stratum deleted (`_entry_from_doc`, `GalleryEntryResponse`, **11 dead `gallery`+`snapshots` boot indexes** per H3 census — not 9); the image asset typed as a Pydantic model (`api/models/assets.py:ImageAsset`; `images.py:140,159` resolve through the typed shim; `dependencies.py:91-100` typed; **`mypy --strict` clean on the four touched asset modules** = the C9/C10 root-fix gate) | provisional |
| W4 — *Design refinement* | β | 2-3 parallel | `.cartoon-card` resurrected via a fourier-local shim in `web/src/style.css` (one shim → **13 consumer files / 14 application sites** un-flattened per H3 live census — `EquationView.vue` applies twice; `git grep cartoon-card` no dead-render refs); the workspace upload IA resolved to one hero dropzone + a source-strip; the gallery orphans resolved (decided binary at dispatch — mount `GalleryMarquee` as living empty-state band with CTA-to-/visualize, OR delete both orphans); light-mode contrast token sweep (amber/golden/dimmed-text in one `:root`-override block); `:focus-visible` rings (TOC + cards); axe light-mode clean. Disjoint from γ (web vs api) — parallel | provisional |
| W5 — *CRUD-CONTRACT v2.0.0 + cohesion* | δ | 2-3 parallel | `CRUD-CONTRACT v2.0.0` ratified (the two KISS relaxations + the §10 close-rule reinterpretation per H3: every DEFERRED cell named); fourier **dispositions** the ~88 DEFERRED matrix cells against `palette-api` in **three categories** (ADDRESSED / DEFERRED-TO-VALUE.JS / RETIRED-AS-OVER-SPEC) — not a binary flip; the value.js alignment ask recorded in `coordination/`; the colour-lift (`sampleToSVGPath`) consumed iff value.js publishes (evidence-based grep at dispatch — currently absent → named-residual branch expected). **value.js-side execution is a value.js tranche** (user-re-mandate-gated) — D authors the fourier side + the cross-repo contract | provisional |
| W6 — *Test integrity* | ε | 1-2 | the cross-env Playwright matrix (fourier + value.js × local/dev/prod, prod non-mutating) green or each red cell named; a CI Mongo retires the `@requires_mongo` skips; the `COMPUTE_RATE_LIMIT` e2e harness; `settings-persistence.spec.ts` recorded inert | provisional |
| W8 — *DNS-as-code* | α′ | 1-2 | a thin idempotent CF-API script lands the target `babb.dev` record set: `<app>.babb.dev` = **proxied** CNAME → `<app>.pages.dev` (CF Pages frontends, single-level, covered by free Universal SSL); `api.<app>.babb.dev` = **DNS-only (grey-cloud) A → origin `34.197.214.67`** (the cleanest TLS resolution — certbot on the origin already runs; LE has no subdomain-depth limit, so `certbot --expand` covers `api.<app>` for free, no ACM). Don't-break list honoured (Google MX/SPF, the Squarespace apex, NS, the `*.babb.dev` wildcard); GitHub Pages CNAMEs (color, keyframes) stay grey | provisional |
| W9 — *CF-Pages frontend migration* | α′ | 2-3 parallel | the speedtest recipe replicated per static frontend (`_redirects` SPA fallback, `wrangler pages deploy`, custom domain). **Pilot-then-rollout ordering (binding)**: (1) **fourier** first (proves the split end-to-end with W1/W2's backend; the api.fourier→origin LE side already lands at W2); (2) **keyframes.js** (off GH Pages); (3) **value.js/color** (off GH Pages — the `color.babb.dev` frontend); (4) **sudoku/csp-solver** (its frontend, paired with W10's `api.sudoku.babb.dev`). GH-Pages→CF cutover per app: create Pages project → verify on `.pages.dev` → flip the babb.dev CF DNS record (CNAME → `<app>.pages.dev`, proxied — was grey transitionally) → retire the `peaceiris/actions-gh-pages` job (keep build-and-test) → tear down GH Pages. grammar DEFERRED (active dev). Bounded-parallel; cap 4 agents/wave | provisional |
| W10 — *Backend ingress + origin LE for api.<app> + CORS* | α′ | 2 parallel | per-`api.<app>.babb.dev` Apache vhost → the app's nginx gateway (`localhost:<gateway-port>` — fourier 8100, color 8130, sudoku 8120; **tracked manual vhost template** per H4); **`certbot --expand --apache` on the origin** (HTTP-01 via the existing `--apache` plugin per `CONSTELLATION-DEPLOY §3.2.a` — the binding implementation, Wα-Δ-R4.1 resolution; the `dns-cloudflare` plugin is absent on the host) to add `api.fourier.babb.dev`, `api.color.babb.dev`, `api.sudoku.babb.dev` SANs to `/etc/letsencrypt/live/sudoku.babb.dev/` (LE HTTP-01 challenge served by origin Apache since api hosts are grey-cloud), auto-renew preserved; CORS fixes (palette's empty → `https://color.babb.dev`; floridify's stale → tidied to `https://words.babb.dev`, **cosmetic — floridify stays all-mbabb, no split**). Mongo-bind moved to W1 | provisional |
| W11 — *palette-api → color rename* | α′/δ | 1-2 | **user-re-mandate-gated** — reconcile the standalone-repo provenance first (prod rsyncs from `/home/mbabb/Programming/palette-api`, not `value.js/api/`; `coordination/PALETTE-API-PROVENANCE.md` records the diff/decision); then rename the service / repo / compose project / container `palette-api`→`color`; `api.color.babb.dev` ingress already in place (W8 + W10), only the source-of-truth labels change. **palette-Mongo bind was done at W1** (front-loaded security) — W11 verifies it held, does NOT re-bind. value.js-side; the shared host vhost the only fourier-touchable seam | provisional |
| W12 — *Close* | — | 1 | reconcile PROGRESS; author `D/FINAL.md` (§0→§9 mirroring `C/FINAL.md`); coordination updated (the value.js cohesion ask carried into a value.js tranche; the prod-deploy + constellation runbook; the v2.0.0 §10 close-rule reinterpretation noted in `CRUD-COHESION.md §6`); CF token stays (per user — saved in gitignored `.env`s + CI; rotated only on suspicion); dangling-image cleanup (`gaggle`, `server-api`, `speedtest-api`, `speedtest-frontend` per NA1) + dead `:8140` speedtest vhost; **§8 window confirmed closed** (W1 opened + closed it; W12 records the closed disposition — no re-open); CANONICAL-ORDERING → ordering ε (or ζ if W11 fired) | provisional |

Hard ceiling 4 agents/wave (DA6/NA6 guard); D peaks at ~3. W0 → Wα → Wχ is the research-first gate (δ + deploy-safety + the α′ DNS/CF/ingress recon, landed this round as `normalization/NA1-6`). W1 (deploy) precedes W2 (TLS ships through the deployed stack). W3 (γ) ∥ W4 (β) — disjoint files. W5 (δ) is research-gated + cross-repo. W6 (ε) after the deploy. **The α′ constellation waves W8–W11 follow the fourier pilot** — W1/W2 + W9 prove the full pattern on fourier first (one app on the shared multi-tenant host), then the proven recipe rolls to the co-tenants bounded-parallel, never a big-bang (NA6). W11 (rename) is user-re-mandate-gated. W12 closes. W1–W12 harden into `waves/W*.md` at Wχ close.

## §4 — Phases

**Phase 0 — research + challenge (W0–Wχ).** The contract v2.0.0 + the deploy-safety-on-a-shared-host are open questions; research surveys, challenge tests nothing breaks the co-tenants and nothing is over-built. No prod change commits before Wχ closes.

**Phase I — production (W1–W2).** The deploy first (so the lineage is finally live + observable), TLS second (so the rollout exercises the chain on a non-trivial change). The migration rides the deploy cutover (invariant: code-and-migration together).

**Phase II — convergence completion + transposition (W3).** The backend slug-identity finishes (symmetric to C.W4); the dead strata and the untyped shim are transposed away.

**Phase III — design refinement (W4).** Parallel with W3 (disjoint files). The token system becomes the single source of truth; the dead class, the IA confusion, the orphans, and the light-mode contrast are repaired.

**Phase IV — cross-repo cohesion (W5).** The contract v2.0.0; fourier-light; the value.js ask recorded.

**Phase V — test integrity (W6).** The cross-env matrix + CI Mongo + the `COMPUTE_RATE_LIMIT` harness.

**Phase VI — constellation rollout (W8–W11, thread α′).** DNS-as-code (W8) → CF-Pages frontends (W9, fourier-pilot first) → backend ingress + origin LE for `api.<app>` + CORS (W10) → palette-api→color rename (W11, user-gated). Pilot-then-rollout: fourier proves the full pattern end-to-end; the others follow bounded-parallel.

**Phase VII — close (W12).**

## §5 — Critical files and ownership

The research wave refines this; the known scope at open:

| Surface | Files | Owning wave |
|---|---|---|
| Prod deploy | the host tree (read-only-then-reconcile), `scripts/deploy-hook.sh` (wire-in), the host `/opt/deploy/` arm (constellation-flagged), `api/scripts/migrate_image_blobs.py` (run), `docker-compose*.yml` (`image_blobs` volume) | W1 |
| TLS + domain + precepts | host `gen-mongo-certs.sh` run, `docker-compose.prod.yml` (the §9 3-site diff + the `0.0.0.0:27017`→loopback Mongo bind), host Apache vhost (`api.fourier.babb.dev` split) + DNS, `web/` (API base-URL) + `api/config.py` (`CORS_ORIGINS`), `docs/precepts/infra/` (promote the staged notes + the naming convention) | W2 |
| Backend symmetry (γ) | `api/services/database.py` (the `flags` index + dead boot indexes), `api/routers/admin.py` (9 snapshot_hash sites), `api/models/assets.py` (+ a typed `ImageAsset`), `api/services/image_storage.py` + `api/dependencies.py` + `api/routers/images.py` (the typed shim) | W3 |
| Design (β) | glass-ui `.cartoon-card` shim + the 14 consumers, `web/src/components/visualization/` (the upload IA), `web/src/components/visualization/gallery/{GalleryMarquee,GalleryGrid}.vue` (orphans), the light-mode token sweep (`web/src/**/*.css` / glass-ui tokens), `:focus-visible` (TOC + cards) | W4 |
| CRUD cohesion (δ) | `docs/tranches/B/coordination/CRUD-CONTRACT.md` → v2.0.0, `CONFORMANCE-MATRIX.md` (flip DEFERRED), `coordination/` (the value.js ask), `web/src/lib/easings.ts` (colour-lift consume) | W5 |
| Test integrity (ε) | `web/e2e/`, `web/playwright.config.ts` (env retarget), a CI Mongo config, `api/config.py` (`COMPUTE_RATE_LIMIT` harness) | W6 |

No two waves hold overlapping write bounds. W3 (api) ∥ W4 (web). W1's `image_storage` touch is the migration run; W3's is the typed shim — sequential (W3 after W1's deploy) or coordinated.

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:

- **Production parity**: a recorded commit-to-deploy chain shows prod at D-HEAD; the live `/api/health` + build-stamp confirms it; a rollback proof (intentional bad commit) is captured.
- **Migration-with-deploy**: the `migrate_image_blobs` run rode the deploy cutover; a post-deploy probe finds zero unmigrated docs; no environment runs code ahead of its migration.
- `docker-compose.prod.yml` source carries no `tlsAllowInvalid*`/`--tlsAllowConnectionsWithoutCertificates` (all sites); the verified-cert issuer (`CN=fourier-internal-ca`) is recorded in the promoted `docs/precepts/infra/tls.md`; a live verified-cert ping passes; **`fourier-analysis-mongo` no longer publishes on `0.0.0.0`** (loopback/network-only).
- **Domain split**: `fourier.babb.dev` serves the frontend and `api.fourier.babb.dev` serves the backend (live, with TLS); the client API base-URL + `CORS_ORIGINS` reference the split host (no same-origin `/api` remnant); the `<app>.babb.dev`/`api.<app>.babb.dev` convention is recorded in `docs/precepts/infra/`.
- **Backend NO-legacy symmetry**: `git grep -nE "snapshot_hash|snapshotHash" api/` returns zero (the `flags` collection's legacy-named field renamed to **`content_hash`** — the truthful target, since the value is a content-hash, NOT a user-identity slug as C.W4's frontend was); the dead `gallery` collection stratum is deleted (no model, no helper, no boot index — **11 dead boot indexes** per the H3 census, not 9); the image asset is a typed `ImageAsset` Pydantic model (`images.py:140,159` no longer raw-subscript a possibly-absent key); `mypy --strict` clean on the four asset modules.
- **Design**: `git grep cartoon-card` returns zero dead references (the class lives or every consumer migrated); an axe light-mode pass is clean on the measured surfaces; `:focus-visible` rings present on TOC + gallery cards; the workspace shows one upload affordance; no orphan gallery component remains.
- **Cohesion**: `CRUD-CONTRACT v2.0.0` ratified with the two relaxations + the fourier↔value.js clause map; the DEFERRED matrix cells flipped or re-disposed; the value.js alignment ask recorded in `coordination/`.
- **Test integrity**: the cross-env matrix recorded (green or each red cell named-with-cause); the CI Mongo retires the `@requires_mongo` skips for the load-bearing proofs.
- `uv run pytest` green; `vue-tsc -b --force` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites commits + artefacts; the value.js cohesion disposition recorded.

Invalid hard gates (rejected at challenge): "deployed" without a recorded chain + a live build-stamp; "migration ready" without it running in the cutover; "TLS enabled" without a verified-cert issuer; "`snapshot_hash` removed" by a frontend-only or behind-a-cast move; "`.cartoon-card` fixed" by re-adding a hardcoded style rather than the token; a shared CRUD framework/codegen presented as "cohesion"; a design rebrand presented as "refinement"; deleting live code as "dead".

## §7 — Cross-tranche debt and explicit deferrals

**Inherited from C (now in-scope via prod SSH — `C/FINAL.md §6`):**
- The shared `/opt/deploy/dispatch.sh` wiring + the fourier-hook registration → **W1** (constellation-flagged: it touches 4 sibling repos; D wires fourier's arm + proposes shared hardening, does not unilaterally rewrite).
- The prod MongoDB TLS cutover → **W2**.
- The prod image-blob migration run → **W1** (rides the deploy cutover).
- The precepts-submodule promotion of `C/infra/{tls.md, blob-backend-dr.md}` + the deploy precept → **W2**.
- The hook-secret `0664→0600` hardening + the dirty-host-tree reconcile → **W1**.

**Inherited from B/C (the NO-legacy completion):**
- The backend `flags.snapshot_hash` band — note the H3 correction: this is NOT symmetric to C.W4's frontend (which was an identity slug); the backend slot's value is a content-hash, so the truthful rename target is **`content_hash`**, not `slug`. The completeness instinct (the legacy name gone end-to-end) holds, the target shifts. → **W3**.
- The `--reload` background queue → still a fourier-D-or-successor residual (dev-only; out of scope unless ε surfaces a need).
- The C4.5/C4.6 visibility-transition guard (struck at C.W4) → **W3 or δ** (decide at Wα — it intersects the contract v2.0.0).

**Cross-repo (δ + ingress):**
- `CRUD-CONTRACT v2.0.0` + the value.js alignment → **W5**; the value.js-side execution is a value.js tranche (user-re-mandate-gated). The colour-lift (`sampleToSVGPath`) is a bounded W5 sub-item.
- **The `palette-api` → `color` rename + `api.color.babb.dev` + the palette Mongo loopback-bind** (`coordination/DOMAIN-NAMING.md`) → a cross-repo ask, user-re-mandate-gated: the rename + CORS + Mongo-bind are value.js-side / the standalone `/home/mbabb/Programming/palette-api` repo; the shared-host Apache vhost for `api.color.babb.dev` is the one fourier-touchable seam (constellation-flagged — proposed + coordinated, not unilaterally imposed). Gated on the Wα palette-api-provenance reconcile.

**Constellation normalization (α′ — `coordination/CONSTELLATION-DEPLOY.md`):**
- The full `<app>.babb.dev`/`api.<app>.babb.dev` rollout (fourier pilot → keyframes.js, value.js/color off GH Pages, sudoku split; words/floridify stays all-mbabb; **grammar DEFERRED** — author-coordinated, 1009 commits/14d) → **W8–W11**.
- **The live Mongo exposure** (fourier/palette/floridify on `0.0.0.0`, internet-reachable on `34.197.214.67`, UFW-opened) → **W1, front-loaded** (the FIRST act of the implementation phase, per user direction: in-tranche).
- **The `api.<app>` TLS path — RESOLVED to grey-cloud + origin LE** (no ACM): DNS-only A → origin `34.197.214.67`, `certbot --expand --apache` on the existing `/etc/letsencrypt/live/sudoku.babb.dev/` cert (certbot is already on prod) adds the api.<app> SANs via **HTTP-01** (the `dns-cloudflare` plugin is absent — Wα-Δ-R4.1; the binding implementation is HTTP-01 via the existing `--apache` plugin, served by origin Apache since api hosts are grey-cloud; `CONSTELLATION-DEPLOY §3.2.a`). Free, exact naming, auto-renew. → **W8 + W10**.
- The CF token: saved in gitignored `.env`s (fourier-analysis + value.js, `0600`) + CI secret store; **not rotated** (per user); reuse via the CI provider's secret store + `wrangler` / the CF-API script.

**Deferred out of D (potential successors):**
- Multi-replica fourier deployment — out of scope per inv-19; a fourier-E if ever needed.
- The full value.js `Palette`/`colorScale` domain model — a value.js tranche when a real consumer lands.
- The dangling prod images (gaggle, server-api) + dead `:8140` speedtest vhost cleanup → W12 (or a host-ops sweep).
- The frontend bundle split (867 kB) — an ε or successor performance item if it proves load-bearing.

## §8 — Brittleness window (provisional)

The W1 prod deploy + migration cutover may open a brief window — the span of the first deploy (build → health-gate → migration → cut). The filesystem cutover is atomic per-document (proven at C.Wχ-P3), so there is **no dual-read**; the window governs only the deploy-chain span, and rollback (the deploy-hook's `reset --hard $PREV` + rebuild + re-gate) restores the prior (pre-A) build if the gate fails.

```yaml
breaking_changes_during_wave: NO (window STRUCK at Wχ-P2 close)
suspended_gates: none
restoration_wave: N/A — the §8 brittleness window was STRUCK at Wχ close (P2.C5)
reason: the W1 deploy is structurally atomic + rollback-safe. The atomicity proof
        from C.Wχ-P3 reproduces on prod (replicas:1, no app-side cache, single
        update_one with $set+$unset per doc); the empty DB at first deploy
        (mongosh confirmed images.count=0, visualizations.count=0) makes the
        migration a structural no-op; the deploy-hook's rollback restores code
        + volume + migration-status at 8818ae5 cleanly on failure; no
        observable suspended-gate interval. Wχ-P1 confirmed fourier-isolation
        holds (dispatcher arm-scoped, Apache vhost zero-touch on siblings,
        Mongo CAs independent fingerprints, volume name no collision). W1 owns
        the host-ops + the migration invocation + the post-deploy probe; none
        suspends a live-site gate.
```

W1–W12 close green with no window. The α′ DNS/Pages/ingress cutovers are individually reversible — a DNS record flip back, a Pages rollback, a vhost revert — and bounded to one app at a time after the fourier pilot. The close ceremony can proceed at any wave.
