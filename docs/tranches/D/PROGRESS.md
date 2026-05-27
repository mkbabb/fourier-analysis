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
| Wα — *Research (ratification + narrowed dispatch)* | planned | — | **dev-era 10+6 lanes did the substantive work**; Wα = ratification. R1 CRUD-cohesion v2.0.0 + `palette_slug` FK + C4.5/C4.6 disposition; R2 prod-deploy-safety re-probe; R3 ingress + palette-api provenance reconcile; R4 constellation matrix + CF-token discipline. Each: RATIFIED-AS-IS or -WITH-DELTA; at-most-one narrowed follow-up |
| Wχ — *Challenge* | planned | — | **5 probes in 4+1 batches** (4-agent ceiling): P1 co-tenant blast radius (floridify/palette-api untouched); P2 migration-with-deploy atomic + rollback-safe on real data; P3 cohesion KISS (no shared framework, inv-16); P4 β refines / γ deletes only dead code; **P5** α′ pilot-first + DNS-safe (mail/apex preserved) + api-TLS-path-real (grey-cloud + origin LE, not a handshake failure) |
| W1 — *Security hotfix + first prod deploy* | provisional | — | thread α/α′ — **FIRST: bind all 3 Mongos off `0.0.0.0` + withdraw 4 UFW rules** (the live exposure closed across the shared host); THEN dirty-tree reconcile + secret extraction; deploy-hook wired; hook perms 0664→0600; `image_blobs` volume; FIRST real A/B/C→prod deploy + migration-in-cutover; transcripts |
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

D.W0 OPEN. The strict W0 → Wα → Wχ → implementation gate is active; Wα dispatch
follows directly.
