# Constellation deploy standardization — the adoption-ask ledger

**Status**: COORDINATION DOC (the per-repo, maintainer-owned adoption asks). **Authored**: 2026-05-28; refreshed 2026-05-29 at fourier-analysis tranche-F thread ζ, wave W12 (ζ.4). **Companion to**: `DEPLOY-STANDARDIZATION-DESIGN.md` (§2 the standard patterns + §4 the tranche fold) and the 4-lane current-state survey at `../audits/runs/2026-05-28-constellation-survey/SURVEY-FINDINGS.md`.

## §0 — What this ledger is (and is NOT)

This is the canonical register of the **cross-repo adoption asks** that flow OUTWARD from the constellation deploy standardization. Each ask is coordinated FROM fourier-analysis (the design substrate lives here) but **executed by the target repo's own maintainer** in that repo's own tree.

**inv-16 — the cross-repo source boundary — is load-bearing here.** fourier-F commits NONE of these asks to any other repo. fourier-F's write surface this tranche was `fourier-analysis/**` + `deploy/**` (the new `mkbabb/deploy` repo fourier-F owns) ONLY. Every line below that says "adopt X into repo Y" is a request, not a change fourier performed. Each is therefore booked as a **maintainer-owned named residual** subject to the F-close 30-day stale-watch (§4).

This ledger is a COORDINATION DOC under `fourier-analysis/docs/`. It mutates no host state and edits no other repo's source.

## §1 — What fourier-F actually completed (the standing-on this ledger sits atop)

So the asks below read against reality, the foundation laid this tranche:

- **The constellation webhook chain was restored.** The chronic ~2-month regression — the GitHub webhook secret was MISSING on all 5 repos, silently severing the auto-deploy chain — was diagnosed and fixed. (This was the root of survey C8 / the long-latent deploy-trigger failure.)
- **The chain was hardened to per-repo URLs + per-repo HMAC secrets.** Each repo now signs against `deploy.babb.dev/hooks/<repo>` with its OWN secret; the single shared HMAC (survey S4) is RETIRED. One repo's compromise no longer re-signs payloads for all five.
- **`mkbabb/deploy` now versions the spine + the standard templates.** The deploy spine that lived only as un-versioned host state is captured; the templates the asks below reference (`deploy-hook.sh`, `docker-compose.hardening.yml`, `ci.yml`, `env.example`, the `cf/` recipes) are authored there as the canonical reference shapes.
- **`dispatch.sh` is RETAINED on the host — deliberately.** The 4 non-fourier app repos (words/floridify, speedtest, value.js/palette-api, csp-solver) still route through the multiplex dispatcher because they have NOT adopted the hardened per-repo `scripts/deploy-hook.sh` + direct `hooks.json` arm. Adopting that, per repo, is exactly the maintainer-owned ask in Ask 2. **The dispatcher's deletion is GATED on ALL FOUR migrating** — deleting it sooner would 404 their deploy path.

fourier-analysis itself already conforms to the full standard (it IS the reference shape for the hardened hook). The asks therefore target the other five repos.

## §2 — The reference templates (in `mkbabb/deploy`)

Every ask names its reference template. The canonical homes (per the `deploy/README.md` contract):

| Reference | Path in `mkbabb/deploy` | What it is |
|---|---|---|
| Hardened deploy hook | `templates/deploy-hook.sh` | flock serialization + record-rollback-SHA + `git reset --hard origin/master` + `docker compose build && up -d` + real health-gate + rollback-on-rollback + post-gate auto-migration |
| Docker hardening floor | `templates/docker-compose.hardening.yml` | `read_only: true` + `tmpfs /tmp` + `cap_drop: ALL` + `security_opt: no-new-privileges` + resource limits + json-file log rotation + backup svc for stateful apps |
| CI template | `templates/ci.yml` | GitHub Actions: lint → typecheck → build → test on push/PR to master; backends add a live-service test job; libraries add a release/publish job |
| `.env` discipline | `templates/env.example` | the `:?` mandatory-prod pattern; `.env` gitignored everywhere |
| Per-repo webhook entry | `host/hooks.json.template` | the per-repo `deploy.babb.dev/hooks/<repo>` entry with `${HMAC_<REPO>}` interpolation (the direct arm that retires the dispatcher route) |
| CF Pages recipe | `cf/pages-deploy.sh` | the standard `wrangler pages deploy` recipe (promoted from speedtest, the reference) |
| DNS-as-code | `cf/dns-cf-sync.sh` | constellation-wide DNS-as-code (promoted from fourier-only) |

## §3 — The adoption asks (per-repo, maintainer-owned)

Acceptance shape = the observable evidence the maintainer's PR is complete. Priority = relative urgency for the F-close stale-watch (P1 highest).

### Ask 1 — CI adoption (no CI today)

- **Targets**: words/floridify, speedtest, csp-solver.
- **The change**: add `.github/workflows/ci.yml` to each repo, copied from `deploy/templates/ci.yml` and parameterized for the repo's stack (backends — words, csp-solver — add the live-service test job; speedtest's frontend/edge build is the build stage). csp-solver's stale `deploy.yml.disabled` is removed in the same PR (superseded by the standard CI + the webhook deploy).
- **Reference template**: `deploy/templates/ci.yml`.
- **Acceptance shape**: a green CI run visible on a push/PR to `master` in each of the three repos; the `Actions` tab shows lint → typecheck → build → test stages; csp-solver no longer carries `deploy.yml.disabled`.
- **Priority**: **P2.** These three repos have NO CI today (survey §1) — a real maturity gap, but not a live-correctness regression. Hygiene, not fire.

### Ask 2 — Hardened deploy-hook + per-repo direct webhook arm (retire the dispatcher route)

- **Targets**: words/floridify, speedtest, csp-solver. *(value.js/palette-api is the same migration but carries an extra precondition — see Ask 3.)*
- **The change**: each repo adds `scripts/deploy-hook.sh` from `deploy/templates/deploy-hook.sh` (flock + health-gate + rollback-on-rollback + auto-migration, parameterized for the repo's compose project + health endpoint). The host then gets a per-repo `hooks.json` entry routing `deploy.babb.dev/hooks/<repo>` DIRECT to that repo's hook (the `deploy/host/hooks.json.template` shape), retiring that repo's arm of the multiplex `dispatch.sh`.
- **Reference template**: `deploy/templates/deploy-hook.sh` + `deploy/host/hooks.json.template`.
- **Acceptance shape**: a push to the repo's `master` fires `deploy.babb.dev/hooks/<repo>` → the repo's own `deploy-hook.sh` runs → the health-gate passes (HTTP 200 from the repo's health endpoint) → the rollback path is exercised in a deliberate failed-deploy drill. The repo's arm is GONE from `dispatch.sh`.
- **Dispatcher retirement gate**: once ALL FOUR non-fourier repos (words, speedtest, csp-solver, AND value.js per Ask 3) have migrated, `dispatch.sh` can finally be DELETED from the host. Until the last of the four lands, the dispatcher stays — deleting it sooner 404s the un-migrated repos' deploy path. The deletion is a single host op that the maintainer performs (or authorizes) once the fourth migration's acceptance is green.
- **Priority**: **P1 (chain), P2 (per-repo).** The chain restoration + hardening is done (§1); the remaining per-repo migration is the long pole that unblocks deleting `dispatch.sh`. value.js (Ask 3) is the hardest of the four and the true critical-path item.

### Ask 3 — value.js / palette-api: convert rsync deploy-dir to a git checkout, then adopt the hardened hook (the N1 real fix)

- **Target**: value.js (palette-api backend).
- **The change**: the palette-api deploy directory is `~/Programming/palette-api` — an **rsync target, NOT a git checkout** (survey §2 deploy-dir divergence). Its dispatcher arm is therefore **latent-broken**: the standard hook does a `git fetch` / `git reset --hard origin/master`, which fails outright on a non-git directory. The ask is two-step: (a) convert the deploy dir to a proper git checkout under the canonical root (`/srv/constellation/palette-api` or the chosen canonical `<app>` dir per `deploy/host/deploy-dir-layout.md`); then (b) adopt `scripts/deploy-hook.sh` + a per-repo `hooks.json` direct arm exactly as Ask 2. This is the **N1 "value.js dispatcher arm" real fix** — not a workaround, the actual repair of the latent-broken arm.
- **Reference template**: `deploy/host/deploy-dir-layout.md` (the canonical-root map) + `deploy/templates/deploy-hook.sh` + `deploy/host/hooks.json.template`.
- **Acceptance shape**: `git -C <canonical palette-api dir> rev-parse HEAD` succeeds (it is a git checkout); a push to value.js `master` fires `deploy.babb.dev/hooks/value-js` → `deploy-hook.sh` performs a successful `git reset --hard` + rebuild + health-gate; the rsync `deploy.sh` step is retired. value.js's arm leaves `dispatch.sh`.
- **Priority**: **P1.** This is the one currently-broken arm (latent — it fails the instant the dispatcher tries to run it). It is also the gating fourth migration for deleting `dispatch.sh` (Ask 2). Highest real urgency of the deploy-trigger asks.

### Ask 4 — Docker hardening level-up to the floor

- **Targets**: words/floridify, speedtest, csp-solver, fourier-analysis. *(value.js/api is already AT the floor — it is the reference shape; keyframes.js is a pure npm lib with no backend container.)*
- **The change**: each backend's `docker-compose` levels up to the `deploy/templates/docker-compose.hardening.yml` baseline — `read_only: true` + `tmpfs /tmp` + `cap_drop: ALL` + `security_opt: no-new-privileges` + resource limits + json-file log rotation; stateful apps add the backup service. (fourier-analysis is currently moderate — USER app + limits + Mongo TLS — and levels up the same way; this is the one item where fourier-F could have moved its OWN repo, but it is recorded here for symmetry with the constellation floor and folds into fourier's own backlog rather than this cross-repo ledger.)
- **Reference template**: `deploy/templates/docker-compose.hardening.yml`.
- **Acceptance shape**: `docker inspect <container>` on each app shows `ReadonlyRootfs: true`, `CapDrop: ["ALL"]`, `SecurityOpt` containing `no-new-privileges`; the app still passes its health-gate (read_only is the most likely to break a service that writes outside `/tmp` — the acceptance must confirm functional parity, not just the flags).
- **Priority**: **P3.** Defense-in-depth posture improvement; no live exposure. Lowest urgency.

### Ask 5 — Frontend-hosting convergence to CF Pages

- **Targets**: value.js, keyframes.js.
- **The change**: both currently deploy their frontends via **GitHub Pages → CF CNAME (peaceiris GH Action)**; the D-era declared target is **CF Pages** (the speedtest reference). Converge each to the `deploy/cf/pages-deploy.sh` wrangler recipe (and the corresponding GitHub Actions secret for the CF API token, per the §2.5 secrets discipline), retiring the peaceiris gh-pages step. This resolves the single biggest "is the documented topology the live topology?" drift the survey surfaced.
- **Reference template**: `deploy/cf/pages-deploy.sh`.
- **Acceptance shape**: `color.babb.dev` (value.js) and `keyframes.babb.dev` serve from CF Pages (a `cf-ray` header + the Pages deployment visible in the CF dashboard / `wrangler pages deployment list`); the peaceiris `gh-pages` workflow step is removed; the CNAME→GH-Pages path is gone.
- **Priority**: **P3.** A working frontend served two ways is a consistency/drift item, not a correctness or security one. Converge when the maintainer touches those repos' deploy.

### Ask 6 — csp-solver: register the missing solve / openapi / docs routes (N4)

- **Target**: csp-solver (sudoku repo).
- **The change**: the backend is live at `/api/v1/health` but `solve`, `openapi.json`, and `docs` routes 404 — a **route-registration regression** in the sudoku repo (the router is defined but not mounted). The ask is a **1-line `app.include_router(...)`** (plus FastAPI's docs/openapi being enabled) so the documented API surface is reachable. This is the N4 residual; per FA2 §3 it is an external-repo route-registration bug, ASK-only — fourier holds no lever into csp-solver source.
- **Reference template**: none (this is a repo-local correctness fix, not a deploy-spine template adoption) — the acceptance is the canonical FastAPI surface, not a standard file.
- **Acceptance shape**: `curl https://api.sudoku.babb.dev/api/v1/solve` (or the documented solve path) returns a real solve response (not 404); `curl https://api.sudoku.babb.dev/openapi.json | jq .info.title` returns the API title; `/docs` serves Swagger UI.
- **Priority**: **P2.** A real (if low-traffic) prod API-surface regression — the documented endpoints don't resolve. Above pure hygiene, below the broken deploy arm.

### Ask 7 — floridify: Mongo-bind upstream hardening (N7)

- **Target**: words/floridify.
- **The change**: harden the floridify Mongo bind upstream so the database is not reachable beyond its intended internal surface (the D-era constellation Mongo-exposure close was applied to the fourier-side Mongos; floridify's bind is the remaining upstream item). The exact fix is the maintainer's call — bind to the internal docker network only / `127.0.0.1` + firewall, mirroring the D.W1 close — but the ask is to bring floridify's Mongo to the same internal-only posture the rest of the constellation holds.
- **Reference template**: the D-era Mongo-exposure close pattern (internal-only bridge network; no published Mongo port) — documented in `../tranches/D/coordination/CONSTELLATION-DEPLOY.md`; no new `mkbabb/deploy` template (it is a compose-bind posture, captured implicitly by the `docker-compose.hardening.yml` network discipline).
- **Acceptance shape**: an external port scan / `docker port <mongo-container>` shows NO published Mongo port; the Mongo is reachable only on the app's internal bridge network; floridify's services still connect (functional parity confirmed).
- **Priority**: **P2.** A data-exposure-adjacent hardening item — higher than cosmetic hygiene, though the survey did not flag a confirmed live exposure (it is upstream-hardening, not an open breach). Treat as P2 pending the maintainer's confirmation of the current bind.

## §4 — Withdrawn flags + the named-residual stale-watch

**S1 + S2 are WITHDRAWN — nothing to rotate.** The 4-lane survey initially flagged committed credentials in floridify (`pk_*` Clerk keys) and speedtest (`cfat_*` CF token). The maintainer determination (2026-05-28) is that neither is a live exposure: Clerk `pk_*` is a **publishable key** (public by design — it ships in the frontend bundle), and the speedtest `cfat_*` is **not a sensitive/active credential**. No rotation, no history-purge, no remediation — in or out of F scope. Recorded resolved in `SURVEY-FINDINGS.md §3` and `DEPLOY-STANDARDIZATION-DESIGN.md §3`. These appear here only to forestall their re-flagging.

**The named-residual stale-watch.** Each ask above is a **maintainer-owned named residual** entered into the F-close 30-day stale-watch (inherited from `E/FINAL.md §5`, re-triggered at F.W13). The watch's purpose is not to force execution — these are the maintainer's to schedule — but to keep them from silently rotting unbooked. At each 30-day review, an ask is either (a) closed (the maintainer's PR landed; acceptance green), (b) re-affirmed as open with an unchanged owner, or (c) reclassified (e.g. a priority change, or folded into a successor tranche).

**Re-triggered at fourier-G thread ζ (G.W8, 2026-05-30).** The 30-day watch is re-stamped. One material change: **Ask 4's fourier portion is now LANDED** — G.W7 leveled fourier's `docker-compose.prod.yml` to the hardening floor (backend FULL: `read_only`+`tmpfs`+`cap_drop: ALL`+`no-new-privileges`, verified live via `docker inspect` + functional smoke; frontend/mongo/nginx `no-new-privileges` with `read_only`/`cap_drop` booked as per-image staging-test residuals). The other six asks remain maintainer-owned and OPEN. **New coordination note (G.ζ): the `api.color.babb.dev` inv-22 partial conformance** (serves only `/`→200; `/health`/`/docs`/`/openapi.json`→404) is a value.js-owned vhost item — see `INVARIANTS.md §2.7` for the honest `F-Inv 22*` scoping. It rides alongside Ask 5 (value.js deploy convergence) as a value.js maintainer concern; fourier holds no lever (inv-16).

| Ask | Target repo(s) | Change (one line) | Priority | Owner | Stale-watch status |
|---|---|---|---|---|---|
| 1 | words, speedtest, csp-solver | adopt `deploy/templates/ci.yml` (no CI today) | P2 | each repo's maintainer | OPEN — re-affirmed G.W8 |
| 2 | words, speedtest, csp-solver | adopt hardened `deploy-hook.sh` + per-repo direct `hooks.json` arm (retire dispatcher route; deletion gated on all four) | P1/P2 | each repo's maintainer | OPEN — re-affirmed G.W8 |
| 3 | value.js (palette-api) | rsync deploy-dir → git checkout under canonical root, then adopt `deploy-hook.sh` (the N1 real fix; gating 4th migration) | P1 | value.js maintainer | OPEN — re-affirmed G.W8 |
| 4 | words, speedtest, csp-solver, ~~fourier~~ | level up to `deploy/templates/docker-compose.hardening.yml` floor | P3 | each repo's maintainer | **fourier portion LANDED G.W7** (backend full floor live; others no-new-priv + booked); 3 external repos OPEN — re-affirmed G.W8 |
| 5 | value.js, keyframes.js | converge GH-Pages→CF-CNAME to CF Pages per `deploy/cf/pages-deploy.sh` | P3 | each repo's maintainer | OPEN — re-affirmed G.W8 |
| 6 | csp-solver | 1-line `app.include_router` — register missing solve/openapi/docs routes (N4) | P2 | csp-solver maintainer | OPEN — re-affirmed G.W8 |
| 7 | words/floridify | Mongo-bind upstream hardening to internal-only (N7) | P2 | floridify maintainer | OPEN — re-affirmed G.W8 |
| inv-22-color | value.js (palette-api vhost) | bring `api.color` to the 4-endpoint vhost contract (`/health`/`/docs`/`/openapi.json` currently 404) — honest `F-Inv 22*` scope | P3 | value.js maintainer | OPEN — booked G.W8 (new) |
| glass-ui-a11y | glass-ui (`ConfiguratorLayer`) | apply `inert` to the collapsed `ConfiguratorLayer` body — it sets `aria-hidden="true"` but keeps focusable children, an axe `aria-hidden-focus` **serious** violation. Surfaced by fourier **H.W1**'s e2e a11y keystones (workspace-default AND Configurator-open: any closed sibling layer carries the defect); both app `test.fixme`'d pending a glass-ui release + the guarded `^2→^3` bump | P2 | glass-ui maintainer | OPEN — booked H.W1 (new) |

## §5 — Provenance + boundary attestation

- **Asks 1–5** derive from `DEPLOY-STANDARDIZATION-DESIGN.md §2` (the standard patterns) + `SURVEY-FINDINGS.md §1–§2` (the current-state heterogeneity).
- **Ask 3** is the N1 "value.js dispatcher arm" real fix (the latent-broken non-git deploy dir).
- **Ask 6** is N4 (csp-solver route-registration regression; FA2 §3).
- **Ask 7** is N7 (floridify Mongo-bind upstream; F.md §9).
- **glass-ui-a11y** is surfaced by fourier H.W1 (the e2e a11y keystones in `visualization-ux.spec.ts`: "workspace default" AND "ContourSettings Configurator-open"): a real `aria-hidden-focus` **serious** violation in glass-ui's `ConfiguratorLayer` collapsed body (it sets `aria-hidden="true"` but keeps focusable children, omitting `inert`). Because the workspace stacks several independent `ConfiguratorLayer`s, ANY closed sibling carries the defect — so opening one layer cannot clear it; both keystones hit it. fourier holds no lever (the app consumes the published `@mkbabb/glass-ui@^2.0.0`); both keystones are `test.fixme`'d as honest, booked baselines pending the glass-ui `inert` fix + the guarded `^2→^3` bump (an inv-16′ sweep candidate). The app's own co-located defect — a `button-name` **critical** on the ContourSettings Strategy `SelectTrigger` — was fixed in-tree (added `aria-label`), so the residual is purely vendored.
- **inv-16 attestation**: this ledger is a coordination doc under `fourier-analysis/docs/`. Authoring it edited NO other repo's source and mutated NO host state. Every ask is a request the named maintainer executes in their own tree. fourier-F's tranche write surface remained `fourier-analysis/**` + `deploy/**` only.

End of ADOPTION-ASKS.md.
