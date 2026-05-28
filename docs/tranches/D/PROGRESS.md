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
| W2 — *Verified-TLS cutover + precepts promotion* | closed-partial | 2026-05-27 | **Spine 1 GREEN** (Mongo verified-TLS cutover, `CN=fourier-internal-ca`, 3 `tlsAllowInvalid*` flags removed BUT `--tlsAllowConnectionsWithoutCertificates` retained — mongod 8.0 reality; honesty pivot recorded in promoted `tls.md §1.1`). **Spine 3 GREEN** (precepts promotion — `tls.md`, `blob-backend-dr.md`, `deploy.md`, `domains.md` landed at `docs/precepts/infra/`; submodule pushed `63240e6`; superproject gitlink bumped). **Spine 2 DEFERRED-to-post-W8/W10**: fourier domain split (DNS api.fourier + Apache vhost + certbot --expand + VITE_API_URL retarget + CORS_ORIGINS) depends on W8 DNS + W10 ingress — blocked-on-CF-token-account-mismatch. |
| W3 — *Backend NO-legacy symmetry + transpositions* | closed | 2026-05-27 | **GREEN deployed live**. Backend `flags.snapshot_hash` → `content_hash` (database.py:125-126 + 9 admin.py sites; idempotent migration `migrate_flags_field.py` ran in cutover; 0 docs renamed against empty prod DB; 2/2 indexes transposed). Dead `gallery` stratum deleted (11 dead boot indexes; `_entry_from_doc`, `GalleryEntryResponse`); typed `ImageAsset` Pydantic model; mypy --strict clean on 4 touched modules; images.py:140,159 resolve through typed shim → clean 404/410 not 500 (P4.C3 satisfied); pytest 129 passed/83 skipped. |
| W4 — *Design refinement* | closed | 2026-05-27 | **GREEN deployed live**. `.cartoon-card` shim restores all 14 application sites (1 utility in style.css); upload IA collapsed to source-strip + canvas hero; `GalleryMarquee` mounted as empty-state band + CTA; `GalleryGrid.vue` deleted. Light-mode contrast sweep **P4.C2 enumeration gap CLOSED**: 9-of-9 `#f0b632` sites swept; 11-of-11 `/35`/`/60`/`/70` alpha modifiers retired; `--viz-amber` darkened to ≈4.6:1. `:focus-visible` rings landed; `GalleryCard` keyboard a11y (role=button, tabindex, keydown.enter.space); `GalleryCardModal` re-pointed onto glass-ui `<Dialog>`. ∥ W3. |
| W5 — *CRUD-CONTRACT v2.0.0 + cohesion* | closed | 2026-05-27 | **GREEN (doc-only)**. v2.0.0 contract authored with 2 KISS relaxations + §10 three-way close-rule + §0 inv-16 re-certification. CONFORMANCE-MATRIX flipped: **27 ADDRESSED / 53 DEFERRED-TO-VALUE.JS / 7 RETIRED-AS-OVER-SPEC** (87 total). `VALUE-JS-ASK.md` authored (cross-repo cohesion ask, user-re-mandate-gated). Colour-lift `sampleToSVGPath` = **named residual** (value.js@0.10.0 doesn't export it). value.js HEAD unchanged at `16129e0`; no cross-repo source touches. |
| W6 — *Test integrity* | closed | 2026-05-27 | **GREEN (test+CI plumbing)**. Cross-env Playwright matrix: AMBER local/host (3p/4f & 3p/3f — pre-existing UI/data drift, not W6 plumbing); RED prod (W9 residual — `fourier.babb.dev` → GH Pages 404). 82 `@requires_mongo` skips retire under live-Mongo CI (211 passed/0 skipped); `COMPUTE_RATE_LIMIT` env override wired in `api/config.py` + `scripts/e2e.sh` + `.github/workflows/ci.yml` (3 jobs: api-tests + Mongo, web-build, e2e-tests). Backend log under harness: zero 429s. |
| W8 — *DNS-as-code* | **BLOCKED — CF token / babb.dev account mismatch** | — | thread α′ — script authored at `scripts/dns-cf-sync.sh` + close record at `audit/W8-dns-as-code.md` (commit `0f5d7c1`). **Live run HALTED**: the user-supplied CF token (`cfat_…`) belongs to `Mike7400@gmail.com`'s account which contains ZERO zones; babb.dev is owned by a different CF account (NS = `jillian.ns.cloudflare.com`, `maciej.ns.cloudflare.com`). Resolution path: user re-issues token from the babb.dev-owning account with `Zone:DNS:Edit` + `Zone:Zone:Read` (per CONSTELLATION-DEPLOY §6.1) → drop into `.env` (0600) → re-run `bash scripts/dns-cf-sync.sh` (idempotent, fail-fast, don't-break-preserving). Don't-break list verified preserved (vacuous — zero writes). |
| W9 — *CF-Pages frontend migration* | **BLOCKED on W8** | — | thread α′ — depends on W8 DNS records (the `<app>.pages.dev` CNAMEs must resolve before CF Pages projects bind to custom domains). Resolution: user re-issues CF token + re-runs W8 + re-attempts W9 (speedtest recipe + `wrangler pages deploy` + custom domain attach). The `fourier.babb.dev` public-URL gap (W1 residual) closes here. |
| W10 — *Backend ingress + origin LE for api.<app> + CORS* | **BLOCKED on W8** | — | thread α′ — depends on W8 A records for `api.fourier.babb.dev` etc. (Apache vhost can't proxy a hostname that doesn't resolve; certbot `--expand --apache` HTTP-01 needs the hostname publicly reachable). Resolution: post-W8 → land `scripts/certbot-expand-api.sh` + the per-api Apache vhost template + CORS fixes (palette empty, floridify cosmetic). |
| W11 — *palette-api → color rename* | **user-re-mandate-gated AND blocked on W8/W10** | — | thread α′/δ — rename + `api.color.babb.dev` ingress depends on W8 DNS + W10 vhost. Standalone-repo provenance reconciled at Wα-R3 (rsync target at `/home/mbabb/Programming/palette-api/`, NOT git, NOT value.js/api/). |
| W12 — *Close* | closed | 2026-05-27 | reconcile PROGRESS; author `D/FINAL.md` (§0→§9); coordination updated; CANONICAL-ORDERING → ordering ε. **D closed `complete_with_constellation_residuals`**: source-code waves (α γ β δ ε) all GREEN + deployed; constellation rollout (α′) blocked-on-CF-token-account-mismatch. **CF token NOT rotated** (per user — but the supplied token is for the wrong CF account; user re-issues to resolve W8/W9/W10/W11). |

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

### 2026-05-27 — D closed `complete_with_constellation_residuals` (W12)

**WHAT.** Five implementation waves (W2 partial + W3 + W4 + W5 + W6) landed
GREEN — backend NO-legacy convergence completed, frontend design refined,
CRUD-CONTRACT v2.0.0 ratified, test integrity restored. The constellation
rollout (W8/W9/W10/W11) is BLOCKED on a CF-token-account-mismatch: the
user-supplied token (`cfat_…` — held in gitignored `.env`s per CONSTELLATION-DEPLOY §6; never referenced verbatim in tracked content)
authenticates against `Mike7400@gmail.com`'s CF account which contains zero
zones; babb.dev's authoritative NS (`jillian/maciej.ns.cloudflare.com`) is
under a different CF account. Resolution requires user re-issuance of a token
from the babb.dev-owning account.

**Wave outcomes (chronological since W1):**

- **W2 (closed-partial)**: Spine 1 (verified-TLS Mongo cutover, deployed via
  SSH-trigger) + Spine 3 (precepts promotion: `tls.md`/`blob-backend-dr.md`/
  `deploy.md`/`domains.md` landed in submodule `63240e6`) GREEN. Spine 2
  (fourier domain split) DEFERRED to post-W8/W10. Honest pivot recorded:
  `--tlsAllowConnectionsWithoutCertificates` is load-bearing in mongod 8.0
  (the C/infra/tls.md §1 "inert under SCRAM-only auth" claim was empirically
  false); kept in compose with explanatory comment; promoted `tls.md §1.1`
  carries the pivot for future tranches.
- **W3 (closed)**: deployed live at host HEAD `ce61e7c`. Backend
  `flags.snapshot_hash` → `content_hash` (H3-truthful rename target); 11 dead
  boot indexes deleted; typed `ImageAsset` Pydantic model; `mypy --strict`
  clean on 4 asset modules; `images.py:140,159` resolves through typed shim →
  clean 404/410 on pre-migration docs (P4.C3 satisfied). Migration ran
  in-cutover: 0 docs renamed on empty prod DB; 2/2 indexes transposed.
  Idempotent (re-runnable). pytest 129 passed / 83 skipped.
- **W4 (closed)**: deployed live (via W2 deploy chain, since W4 commit was
  atop W2's ancestor). `.cartoon-card` shim restored all 14 application sites
  (one `@utility` in style.css); upload IA collapsed to one hero dropzone +
  slim source-strip; `GalleryMarquee` mounted as empty-state band with CTA;
  `GalleryGrid.vue` deleted. **P4.C2 enumeration gap CLOSED**: 9-of-9 `#f0b632`
  sites swept; 11-of-11 `/35`/`/60`/`/70` alpha modifiers retired (W4 spec
  initially enumerated only 3 + 6; the strengthening surfaced the rest).
  `--viz-amber` darkened to ≈4.6:1 light-mode contrast. `:focus-visible`
  rings on TOC + gallery cards; `GalleryCard` keyboard a11y conversion;
  `GalleryCardModal` re-pointed onto glass-ui `<Dialog>`.
- **W5 (closed — doc only)**: `CRUD-CONTRACT v2.0.0` authored with 2 KISS
  relaxations (§2 admits user-supplied slugs; §0 binds behaviour-not-layout)
  + §10 three-way disposition close-rule + §0 inv-16 re-certification (P3.C1
  satisfied). CONFORMANCE-MATRIX flipped: **27 ADDRESSED / 53 DEFERRED-TO-
  VALUE.JS / 7 RETIRED-AS-OVER-SPEC** (87 cells total). `VALUE-JS-ASK.md`
  records the cross-repo cohesion ask (user-re-mandate-gated per P3.C4).
  `palette_slug` FK contract clause from Wα-R1 carried forward. Colour-lift
  `sampleToSVGPath` consume = **named residual** (value.js@0.10.0 doesn't
  export it; would fire iff published). value.js HEAD unchanged at `16129e0`;
  zero cross-repo source touches (inv-16 preserved).
- **W6 (closed — test/CI plumbing)**: cross-env Playwright matrix configured
  (BASE_URL env var + `@mutating` tag for prod skip; new `web/e2e/README.md`
  + `scripts/e2e.sh` local launcher). Matrix results recorded: local AMBER
  (3p/4f — pre-existing UI/data drift, not W6 plumbing), host AMBER (3p/3f —
  same drift confirms host SHA matches local), prod RED (W9 residual —
  `fourier.babb.dev` → GH Pages 404). 82 `@requires_mongo` skips retired
  under live-Mongo (211 passed/0 skipped in live-Mongo baseline; 1 pre-existing
  W3-followup failure named). `COMPUTE_RATE_LIMIT` env override wired in
  `api/config.py` (already pydantic-mapped) + `scripts/e2e.sh` +
  `.github/workflows/ci.yml` (3 jobs: api-tests + Mongo, web-build, e2e-tests
  + Mongo + harness). Backend log under harness: zero 429s.

**Constellation rollout (α′) — BLOCKED-ON-CF-TOKEN-ACCOUNT-MISMATCH:**

- **W8 (DNS-as-code) — script authored, live run halted**. The user's CF
  token authenticates against `Mike7400@gmail.com`'s account (zone count: 0);
  babb.dev is in a different CF account. `scripts/dns-cf-sync.sh` is
  idempotent + fail-fast + don't-break-preserving; re-runs cleanly when a
  babb.dev-scoped token lands in `.env`. Don't-break list vacuously preserved
  (zero writes). The 8 target records: `fourier|color|sudoku|keyframes.babb.dev`
  CNAME → `<app>.pages.dev` (proxied); `api.fourier|color|sudoku.babb.dev` A
  → `34.197.214.67` (grey-cloud); `deploy.babb.dev` A → `34.197.214.67`
  (grey-cloud — fixes the W1 webhook URL residual).
- **W9 (CF-Pages migration) — BLOCKED on W8**. The `<app>.pages.dev` CNAMEs
  must resolve before CF Pages can bind custom domains. The `fourier.babb.dev`
  public-URL gap (W1 residual) closes here when W9 fires.
- **W10 (api.<app> ingress + LE + CORS) — BLOCKED on W8**. The api.<app>
  hostnames must publicly resolve before certbot `--expand --apache` HTTP-01
  (Path B per Wα-Δ-R4.1) can succeed and Apache vhosts can proxy them.
- **W11 (palette-api → color rename) — user-re-mandate-gated AND BLOCKED on
  W8/W10**. Standalone-repo provenance reconciled at Wα-R3 (rsync target,
  not git, not value.js/api/).

**Resolution path (single user action unblocks all four):**
1. Re-issue a CF API token from the babb.dev-owning CF account with
   `Zone:DNS:Edit` + `Zone:Zone:Read` (per CONSTELLATION-DEPLOY §6.1).
2. Drop into `/Users/mkbabb/Programming/fourier-analysis/.env` (mode 0600,
   `CLOUDFLARE_API_TOKEN=<new-token>`).
3. Re-run `bash scripts/dns-cf-sync.sh` — idempotent; lands the 8 records;
   the script's don't-break preservation logic protects MX/SPF/apex/NS/wildcard.
4. Dispatch W9 (CF-Pages migration, fourier-pilot-first), W10 (api ingress +
   `scripts/certbot-expand-api.sh` Path B HTTP-01 via --apache + CORS), W11
   (user-gated palette-api → color rename if mandated).

**Production Parity ledger (D close):**
- Host fourier HEAD: `2757c43` (W3+W4 close; advanced from pre-A `8818ae5`
  through `795d64f` → bad-rollback → `a6ba377` → `1233b06` → `5b84e31` →
  `2e4a452` (W4 came in with W2 deploy) → `64f79f9` → `aed6c32` → `ce61e7c`
  (W3) → `2757c43` (close record)).
- Loopback `:8100/api/health`: `{"status":"ok"}` GREEN.
- Verified TLS: backend ↔ mongo via `tlsCAFile`, NO `tlsAllowInvalid*` on
  client side; full chain + SAN verification holds.
- All 4 containers Up healthy.
- Public URL `fourier.babb.dev`: STILL GH Pages 404 (W9 residual until CF
  token resolved).
- Production Parity invariant: **PROVEN AT LOOPBACK**; public URL parity is
  W9-deliverable (named, dated).

**Three new D invariants — all recorded by name in `docs/precepts/infra/`:**
- Production parity (`tls.md §1` + `deploy.md`)
- Code-and-migration-cut-over-together (`deploy.md`)
- Token-system-single-source-of-surface-truth (recorded in `D.md §2`;
  promotion to a precept is a fourier-E or successor item — the design lesson
  is fourier-specific, not constellation-applicable)

**CANONICAL-ORDERING reconciled to ordering ε** (post-D-authoring; the
constellation thread α′ is partial — W8/W9/W10/W11 named-residuals).

**Files committed in W12 close:**
- `docs/tranches/D/FINAL.md` (new — §0-§9 mirroring `C/FINAL.md`)
- `docs/tranches/D/PROGRESS.md` (status board + log reconciled to reality)
- `docs/tranches/CANONICAL-ORDERING.md` (ordering ε)

**Disposition**: D closes `complete_with_constellation_residuals`. The repo-
landable + host-deployable scope (α γ β δ ε threads) is GREEN. The
constellation thread (α′) is blocked-on-CF-token-resolution; the script +
plan are authored, idempotent, and ready to fire on user re-issuance.

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

**D CLOSED `complete_with_constellation_residuals`**. Five implementation
waves (W2 partial + W3 + W4 + W5 + W6) GREEN. Constellation rollout (W8/W9/
W10/W11) blocked-on-CF-token-account-mismatch — single user action (re-issue
token from babb.dev-owning CF account) unblocks all four. Tranche development
complete; FINAL.md authored; CANONICAL-ORDERING → ordering ε.
