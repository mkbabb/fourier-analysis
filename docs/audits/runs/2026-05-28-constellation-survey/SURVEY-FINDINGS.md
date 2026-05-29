# Constellation infra survey — current-state findings (2026-05-28)

**Mode**: READ-ONLY parallel survey (4 Agent lanes) — no mutations. **Purpose**: ground the CI/webhook/deploy standardization design in the *actual* current state across all constellation repos + the host. **Authority**: this is the evidence; `docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md` is the synthesis + recommendation.

## §1 — Current-state matrix (6 repos × 6 axes)

| Repo | Frontend hosting | Backend | CI | Deploy trigger | Webhook | Secrets posture |
|---|---|---|---|---|---|---|
| **fourier-analysis** | self-hosted docker-nginx `:8100` behind CF proxy (`fourier.babb.dev`) | FastAPI docker + Mongo | 3-job (api-tests + web-build + e2e) | **webhook → `deploy-hook.sh`** (hardened: flock + health-gate + rollback-on-rollback + auto-migration) | adnanh/webhook → dispatch.sh | clean — `.env` gitignored; `:?` mandatory-prod pattern; Mongo TLS |
| **value.js** | GH Pages (peaceiris) → `color.babb.dev` | palette-api Hono docker `:8130` + Mongo + backup svc | dual-gate (ci.yml + node.js.yml; 8 proof invariants) | GH Actions gh-pages (frontend, auto) + **manual rsync `deploy.sh`** (backend) | NONE (manual backend) | **CF token in local `.env`** (gitignored; MEDIUM); strictest docker hardening |
| **words** (floridify) | self-hosted docker-nginx `:8110` behind CF proxy | FastAPI docker + Mongo + notification svc (6 services) | **NONE** | **manual `deploy.sh`** (rsync + scp secrets + ssh build) | dispatcher arm (but operator-initiated) | **`.env.production` with `pk_live_*` Clerk keys COMMITTED + in git history (HIGH)** |
| **speedtest** | **CF Pages via wrangler** (the reference recipe) + CF Workers (edge) | docker EC2 `:8140` | **NONE** | **manual `deploy.sh`** (modular: CF Pages + Workers + EC2; pre-flight gates; rollback-image-tag) | NONE (manual) | **`.env` with live `cfat_*` CF token COMMITTED (HIGH)** |
| **csp-solver** (sudoku) | self-hosted docker-nginx `:8120` behind CF proxy | FastAPI docker `:8120` (nginx/1.29.5 — diverges from Apache-fronted others) | test-only (`deploy.yml.disabled`) | **manual SSH + git-pull** | NONE | `.env` gitignored OK; **missing solve/openapi/docs routes (route-registration regression)** |
| **keyframes.js** | GH Pages (peaceiris) → `keyframes.babb.dev` | (npm lib; no backend) | dual-gate + release (npm publish) | GH Actions gh-pages (auto) + npm publish on tag | GH Actions (the dispatcher) | clean — `NPM_TOKEN` only |

## §2 — The heterogeneity (normalization targets)

**Three frontend-hosting patterns:**
1. CF Pages via wrangler (speedtest) — the D-era declared target.
2. GitHub Pages via peaceiris → CF CNAME (value.js, keyframes.js).
3. Self-hosted docker-nginx behind CF orange-cloud proxy (fourier, words, csp-solver).

**Three deploy-trigger patterns:**
1. Webhook → host dispatch (fourier only — the hardened reference).
2. Manual `deploy.sh` (words, speedtest, csp-solver — operator-initiated).
3. GitHub Actions auto (value.js + keyframes frontends).

**CI presence:** 3 of 6 have real CI (fourier, value.js, keyframes); words + speedtest have NONE; csp-solver's deploy CI is `.disabled`.

**Docker hardening gradient:** value.js/api strictest (`read_only` + `cap_drop ALL` + `no-new-privileges` + tmpfs + limits + backup svc) → fourier moderate (USER app + limits + Mongo TLS) → words/speedtest/csp minimal (non-root user + limits, no read_only/cap_drop).

**Deploy-dir + VCS divergence:** `/var/www/{fourier-analysis,csp-solver}` (git) vs `~/floridify` + `~/speedtest` (git) vs `~/Programming/palette-api` (**rsync, no .git**). Three locations, two VCS models.

**The deploy spine is UN-VERSIONED:** `/opt/deploy/{dispatch.sh, hooks.json}` + the `adnanh/webhook` systemd unit live ONLY on the host, tracked in NO repo. `dns-cf-sync.sh` is fourier-only.

## §3 — SECURITY findings (the user explicitly asked — front-loaded)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| ~~**S1**~~ | **WITHDRAWN** | floridify (`words`) `.env.production` with `pk_*` Clerk keys committed — **NOT an exposure**: Clerk `pk_*` is a **publishable key** (designed to ship in the frontend bundle; public is its intended state). Per the maintainer (2026-05-28): **nothing needs rotating**. RESOLVED — no action. | Survey-2 |
| ~~**S2**~~ | **WITHDRAWN** | speedtest `.env` with a `cfat_*` Cloudflare token committed — per the maintainer (2026-05-28) this is **not a live exposure** (not a sensitive/active credential). **Nothing needs rotating.** RESOLVED — no action. | Survey-2 |
| **S3** | MEDIUM | value.js local `.env` holds `CLOUDFLARE_API_TOKEN` (gitignored; at-risk if `.gitignore` lapses) | Survey-1 |
| **S4** | MEDIUM-HIGH | **Single shared HMAC webhook secret across all 5 repos** (`89eadc1d…a5c070`); one repo's compromise lets an attacker re-sign payloads for ALL five | Survey-4 §2 |
| **S5** | MEDIUM | No webhook-secret rotation (unchanged since 2026-03-28, ~2 months); no rotation policy | Survey-4 §2 |
| **S6** | LOW | No supply-chain scanning (dependabot absent); no signed tags; no SBOM | Survey-3 |
| — | (acceptable) | No IP-allowlist on `deploy.babb.dev` webhook receiver — acceptable because HMAC is enforced + `ref==refs/heads/master` AND-gated; receiver runs unprivileged `mbabb:mbabb`, not root | Survey-4 §1 |

**S1 + S2 WITHDRAWN (maintainer determination, 2026-05-28): nothing needs rotating.** The initial survey flagged them as committed-credential exposures; the maintainer confirms neither is a live secret — Clerk `pk_*` is a publishable key (public by design), and the speedtest `cfat_*` token is not a sensitive/active credential. No rotation, no history-purge, no action. (The webhook HMAC posture — S4/S5 — remains a real normalization target, addressed by F-ζ.2 per-repo-secret split, but that is hardening the *shared* secret, not remediating an exposure.)

## §4 — What's already RIGHT (the de-facto standards to codify)

- **Naming**: `<app>.babb.dev` + `api.<app>.babb.dev` (D-era CONSTELLATION-DEPLOY normalized this).
- **Per-app docker isolation**: each app on its own bridge network; Mongos internal-only (D.W1 closed the public-Mongo exposure).
- **Slim base images**: `python:3.x-slim`, `node:2x-alpine/slim`, `nginx:alpine` everywhere.
- **localhost-only port binding**: all backends bind `127.0.0.1:<port>` behind the single Apache TLS terminator.
- **TLS**: origin Let's Encrypt (grey-cloud api subdomains) + CF Universal SSL (orange-cloud frontends) — D-era resolved.
- **The fourier `deploy-hook.sh` pattern** (flock + real health-gate + rollback-on-rollback + auto-migration) is the maturest deploy unit — the reference for the standard.
- **The speedtest `deploy.sh`** (CF Pages + Workers + EC2 modular, pre-flight gates, rollback-image-tag, health-probe-with-body-token) is the maturest multi-target deploy — the reference for CF Pages.

## §5 — Provenance

4 parallel Agent survey lanes, 2026-05-28, READ-ONLY:
- Survey-1: fourier-analysis + value.js (local).
- Survey-2: words/floridify + speedtest (local + gh API).
- Survey-3: csp-solver + keyframes.js (gh API + local + live probes).
- Survey-4: host + CF + webhook-security (SSH read-only + live probes).
