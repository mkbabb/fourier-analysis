# NA6 — adversarial guard · the new tranche-D wave structure · credential discipline

**Lane**: NA6 (the constellation-deployment-normalization development pass — folding the user's constellation-wide normalization findings into the extant tranche D as new waves). READ-ONLY; planning only; ONE deliverable; NO source edits, NO commits, NO use of the CF token.
**Date**: 2026-05-27. **HEAD**: master `fc5b3b0` (B.W5 close record on the recent log); fourier-A/B/C CLOSED; fourier-D **AUTHORED** (`docs/tranches/D/D.md`, the five-thread α/β/γ/δ/ε charter; `docs/audits/runs/2026-05-27-D-audit/SYNTHESIS.md`).
**Charter (user, in substance)**: expand tranche D into a *constellation-wide deployment normalization* — every app (fourier, color/palette-api, keyframes.js, sudoku/csp-solver, words, grammar/bbnf-lang, floridify, speedtest) onto the `<app>.babb.dev` + `api.<app>.babb.dev` pattern; frontends → Cloudflare Pages (CI modelled on the speedtest/wrangler recipe); backends → the mbabb docker host; DNS programmatic via the Cloudflare API; a CF API token was provided in chat. "Fold these findings into this extant tranche as a series of new waves."
**Sibling lanes (NA1–NA5)**: NA6 supplies the over-engineering guard + the credential-discipline rule + the new-wave structure + the pilot-then-rollout argument. It does NOT re-derive the per-app inventory (NA1), the deploy recipe (NA2), the DNS-as-code mechanism (NA3), the per-app frontend/backend matrix (NA4), or the ingress/CORS/Mongo-bind detail (NA5); where NA6 cites those it cites them by name and defers the ground-truth to that lane.
**Convention modelled on**: `docs/audits/runs/2026-05-27-D-audit/DA6-guard-thread-scoping.md §1` (the per-candidate smallest-honest-mechanism + named-trap-to-reject + per-line KISS justification) and `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md §4`. NA6 mirrors that discipline verbatim in shape: each facet gets a **smallest-honest-mechanism**, a **trap to reject**, and an explicit note of **when the heavier mechanism is genuinely warranted**.

---

## §0 — Goal criterion and completion criterion (paired)

**Goal.** Give the D-expansion authoring round (a) a per-facet over-engineering guard naming the smallest-honest-mechanism, the trap to reject, and the warranted exception, across the five facets (DNS, CF Pages, ingress, the rename, per-app split); (b) the binding credential-discipline rule the execution-wave specs must encode for the CF API token, with the exact token permissions the work needs and a rotate-after-migration recommendation; (c) a concrete new-wave set folded into D thread α (or a new thread α′ "constellation deployment") with an ordering against the existing W1, and an agent-budget ceiling; (d) the pilot-then-rollout argument for proving the full pattern on fourier first.

**Completion.** This document carries all four (§1 guard, §2 credential discipline, §3 the new wave set, §4 pilot-then-rollout). Every guard verdict names its smallest mechanism and its trap; the credential rule states exact permissions; the wave set sequences against the existing D.W1; the pilot argument is concrete. Both criteria hold at this writing. NA6 authors nothing executable and touches no secret.

---

## §1 — Over-engineering guard (per facet)

The constellation normalization fronts **five facets** — DNS, CF Pages, ingress, the rename, the per-app split. Each is a fresh surface on which the large-tranche pull toward gold-plating reasserts. The guard's job is the same as DA6's: hold each facet at its smallest-honest-mechanism, name the seductive trap, and state precisely when the heavier mechanism is warranted (so the guard cannot be misread as "always reject the big thing").

The binding lens (inherited from `DA6 §4`): *a mechanism is justified iff it has (a) a named, present need, (b) a measured or structural delta over the smaller mechanism, and (c) it removes more than it adds.* Absent any one, hold the smaller mechanism.

### (a) DNS — programmatic via the CF API

**Smallest-honest-mechanism.** A small, idempotent **CF-API script** (curl or the `cloudflare` Python/JS SDK against the Zone DNS endpoints) that, given the token and the zone ID, ensures the records exist: for each app, an `A`/`AAAA` (or `CNAME` to the host) for `api.<app>.babb.dev` pointing at the mbabb host, and a `CNAME` for `<app>.babb.dev` pointing at the CF Pages target. Idempotent (read-then-create-or-skip), version-tracked as a script, run by the operator with the token injected from the environment. This is NA3's mechanism; NA6 binds only that it stays a *script*, not a framework.

**Trap to reject.** **Full Terraform / Pulumi / an IaC stack for ~9 apps' DNS.** A handful of records per app across one zone (`babb.dev`) does NOT justify a state backend, a provider lockfile, a plan/apply lifecycle, drift detection, and the operational burden of remote state. That is infrastructure-for-infrastructure's-sake — the cost (state management, the `terraform.tfstate` secret-bearing artefact, a CI runner for apply) exceeds the benefit for a static, rarely-changing record set. **REJECT** standing up Terraform/IaC for this DNS surface.

**When the heavier mechanism IS warranted (the honest carve).** IaC for DNS becomes warranted only when (a) the record set grows large and churns frequently, (b) multiple operators must collaborate on it with audit + review, or (c) DNS is one facet of a broader already-IaC-managed estate it would be inconsistent to leave out. None of those holds for the babb.dev constellation today (one operator, one zone, static records). If a future constellation tranche adopts IaC estate-wide, DNS folds in then — as a named successor, not built speculatively now. The script is the KISS choice; record the IaC trigger condition as a residual.

### (b) CF Pages — frontend hosting + CI

**Smallest-honest-mechanism.** The **speedtest/wrangler recipe** already proven in the constellation: each frontend builds with its existing build tool (Vite, etc.) and publishes the static output to CF Pages via `wrangler pages deploy`, invoked from a per-app GitHub Actions workflow on push to the default branch. The CF token (Pages-scoped) lives in the GitHub Actions secret store; the workflow references it by name. This is NA2's recipe; NA6 binds only that it reuses the existing wrangler pattern (the `speedtest` repo already carries a `wrangler.toml` + the wrangler dependency — the constellation has the recipe in hand) and does not invent a bespoke pipeline.

**Trap to reject.** **A custom build/deploy pipeline** — a hand-rolled S3+CloudFront equivalent, a bespoke artefact-uploader service, a self-hosted runner orchestrating builds, or a per-app divergent CI shape. CF Pages + `wrangler pages deploy` (or the CF Pages Git integration) is a one-command publish; wrapping it in custom orchestration is gold-plating. **REJECT** any frontend-deploy mechanism that is not the speedtest/wrangler recipe (or CF's native Pages Git integration, the equally-KISS alternative NA2 evaluates).

**When the heavier mechanism IS warranted.** A custom step is warranted only for a genuine per-app build peculiarity (e.g. fourier's frontend needs the precomputed SVG/nav-icon assets generated before the Vite build — `scripts/precompute_*.py`). That is a *build step inside the existing workflow*, not a new pipeline: the workflow runs the precompute, then `npm run build`, then `wrangler pages deploy`. The recipe absorbs the peculiarity; it does not justify a different deploy architecture. Per-line: any frontend that claims it cannot use the wrangler recipe must name the specific build constraint, and the resolution is a step in the standard workflow, not a fork of it.

### (c) Ingress — backend routing on the shared host

**Smallest-honest-mechanism.** The **host's existing Apache2 + Cloudflare proxy**. The recon in `D/coordination/DOMAIN-NAMING.md §3` already established the reality: the host runs Apache2 (`/etc/apache2/sites-enabled/`), `babb.dev` apps are `ServerName`/`ServerAlias` vhosts on a shared multi-domain config, each proxying to a loopback-bound docker port. The normalization adds, per app, one `api.<app>.babb.dev` vhost proxying to that app's backend loopback port (the 10-port-block scheme from `project_infra_plan.md`: 8100 fourier, 8110 floridify, 8120 sudoku, 8130 palette/color, 8140 speedtest). CF sits in front as the DNS+proxy/TLS-edge layer. This is NA5's mechanism; NA6 binds that the ingress stays *host-Apache-vhost + CF proxy*.

**Trap to reject.** **A new reverse-proxy layer — Traefik, a k8s ingress controller, a Kong/Nginx-gateway service, or a service mesh.** The host already terminates and routes for ~7 apps via Apache vhosts; introducing Traefik/k8s to "modernize ingress" is the single largest over-engineering trap in this normalization, because it re-architects a working shared host to serve symmetry, not need. DA6 §5 already named "NO host re-architecture — no k8s" as a binding D exclusion (carried from C's HELD KISS-rejections, `C/FINAL.md §3`); NA6 re-certifies it for the constellation: **REJECT** Traefik/k8s/service-mesh/a new gateway container. The host Apache + the CF proxy edge suffice.

**When the heavier mechanism IS warranted.** A dynamic reverse proxy (Traefik et al.) earns its keep only with dynamic backend topology — autoscaling replicas, service discovery, blue-green at the proxy, dozens of churning upstreams. The constellation is ~9 static single-replica backends on one host; inv-19 already bounds fourier to single-replica (DA6 §5 #1 carries "multi-replica fourier... out of scope per inv-19"). Static topology → static Apache vhosts. The heavier proxy is a named successor IF the constellation ever adopts multi-replica/autoscale, never built speculatively now.

### (d) The rename — palette-api → color (and the pattern-application boundary)

**Smallest-honest-mechanism.** Apply the `<app>.babb.dev` + `api.<app>.babb.dev` pattern, and **rename only what the user named** — `palette-api` → `color` (`api.color.babb.dev`), per the explicit directive in `DOMAIN-NAMING.md §1`. The rename touches the standalone host repo (`/home/mbabb/Programming/palette-api`), its compose project/container names, the package name, the CORS origin, and the new vhost — all value.js-side / cross-repo, user-re-mandate-gated, with the shared-host Apache vhost as the one fourier-touchable seam (constellation-flagged: proposed + coordinated, not unilaterally imposed). This is the disposition already recorded in `DOMAIN-NAMING.md §6` and `D.md §7`.

**Trap to reject.** **Touching apps the user did not name beyond applying the pattern**, and **inventing renames for symmetry.** The user named the *pattern* (`<app>.babb.dev` + `api.<app>.babb.dev`) and named *one* rename (palette-api → color). The trap is to "normalize" every app's *internal* names (repo names, container names, compose project names, package names) to match the domain — e.g. renaming `csp-solver`'s repo to `sudoku`, or `bbnf-lang` to `grammar`, or `words`'s package to `floridify` a second time — when the user asked only that the *domains* follow the pattern. **REJECT** any rename beyond palette-api → color unless the user names it. The domain is the surface the user standardized; the repo/package/container identity is the app's own and is out of scope absent an explicit ask. (Note the existing `words → floridify` rename is already done per `project_infra_plan.md`; do not re-litigate it.)

**When the heavier mechanism IS warranted.** A deeper rename is warranted only where the *domain* the user mandated cannot be served without it — e.g. if an app's CORS allow-list, OAuth callback URLs, or hard-coded API base must change to honour the new `api.<app>.babb.dev` host. Those are *consequences of the domain change*, in-scope. A rename for *aesthetic* repo↔domain symmetry is not. Per-line: any rename beyond palette-api → color must cite the domain-change consequence that forces it.

### (e) Per-app split — backend-on-mbabb vs frontend-on-Pages

**Smallest-honest-mechanism.** Split an app into `<app>.babb.dev` (CF Pages frontend) + `api.<app>.babb.dev` (mbabb docker backend) **only where the app genuinely has a separable static frontend and a stateful backend.** Some apps are honestly all-mbabb (a backend-rendered app, or one with no separable static bundle) or all-Pages (a pure static frontend with no backend, or one whose "backend" is a CF Worker). The user **explicitly left fourier/sudoku/words open** (per this lane's charter) — meaning the split decision per app is a per-app judgment NA4 makes from the inventory, not a uniform mandate.

**Trap to reject.** **Splitting an app that is better kept all-mbabb (or all-Pages) purely for constellation symmetry.** Forcing a frontend onto CF Pages when it is a thin static asset served fine by the app's existing nginx, or carving a backend out of an app that has none, adds a deploy surface (a second CI target, a CORS boundary, a cross-origin base-URL) for zero benefit. **REJECT** the split where the app does not have two genuinely separable tiers. The pattern is a *target shape for apps that fit it*, not a Procrustean bed.

**When the split IS warranted.** The split is warranted exactly where fourier is: a static SPA bundle (Vite output) that CF Pages serves at the edge cheaply + globally, plus a stateful backend (FastAPI + Mongo + image blobs) that must live on the host. fourier *fits* the pattern — which is why it is the pilot (§4). For each other app, NA4's inventory decides fit; NA6 binds only that the decision be *fit-driven*, and that fourier/sudoku/words stay user-open until the inventory + the user resolve them.

---

## §2 — Credential discipline (the CF API token)

A CF API token was pasted into the chat that authorized this expansion. That single fact drives the entire credential-discipline section: the token is now in a transcript, and the wave specs must encode a rule that keeps it out of the repo and recommends its rotation.

### §2.1 — The binding rule (the wave specs MUST encode this verbatim)

> **The CF API token is NEVER committed, NEVER written to a tracked file, NEVER placed in any compose file, CI-config-in-repo, `.env` that is tracked, or any artefact under version control.** It lives in exactly two places: (1) the CI provider's secret store — a GitHub Actions repository/organization secret (or CF's own secret store for CF-native automation); and (2) the operator's out-of-band secret store (a password manager / OS keychain). The execution waves reference it **by name only** (e.g. `${{ secrets.CF_API_TOKEN }}` in a workflow, `$CF_API_TOKEN` injected into the operator's shell for the DNS script). No wave, no script, no doc commits its value.

This is the standing constellation posture made explicit: it mirrors fourier's own `deploy-hook.sh` discipline — that script "carries NO secret — the HMAC secret lives only in GitHub's webhook config and the host's un-tracked hooks.json... NO SSH key and NO password" (`scripts/deploy-hook.sh` header). The CF token gets the identical treatment: referenced by name, stored out-of-band, never in the tree. The `no-fallbacks` precept's sibling principle holds — no plaintext-secret shim "just to get it working," exactly as the C-audit flagged the live host's inline plaintext Mongo password as a real exposure to extract (`DA4`, the dirty-tree inline-secret finding).

The DNS-as-code script (§1(a)) and the CF Pages workflows (§1(b)) are the two token consumers. Both reference it by name: the workflow via the Actions secret; the script via an environment variable the operator injects at run time. Neither hard-codes it; neither writes it to a file the script then reads from the tree.

### §2.2 — The exact token permissions the work needs (so the user can confirm/adjust)

The normalization needs a **scoped** token, not a global API key. The minimum permission set, by facet (CF's permission-group names):

| Facet | CF permission (scope · group · level) | Why |
|---|---|---|
| DNS-as-code (§1(a)) | **Zone · DNS · Edit** | create/update the `api.<app>.babb.dev` + `<app>.babb.dev` records |
| DNS-as-code (§1(a)) | **Zone · Zone · Read** | resolve the `babb.dev` zone ID the DNS script needs to target |
| CF Pages (§1(b)) | **Account · Cloudflare Pages · Edit** | `wrangler pages deploy` (create/update Pages projects + deployments) |

Token scoping: restrict the **Zone** permissions to the **`babb.dev` zone only** (Zone Resources → Include → Specific zone → `babb.dev`), and restrict the **Account** permission to the operator's single CF account. The token should carry **no** `Zone · SSL and Certificates`, no `Workers Scripts` edit (the speedtest *Worker* is its own concern — Pages-Edit does not cover Worker-script deploys; if a future facet deploys Workers it needs `Account · Workers Scripts · Edit`, added then, not now), and no global `User · Memberships` / billing scopes. Least-privilege: exactly the three lines above, zone- and account-restricted.

The user should **confirm or adjust** this set before any execution wave runs the token — if the chosen mechanism is CF's native Pages *Git integration* rather than `wrangler` (NA2's call), the Pages-Edit line may shift to CF's GitHub-App connection (which CF manages OAuth-side) and the token then needs only the two DNS lines. NA6 states the superset (wrangler-deploy path); NA2 narrows it to the chosen mechanism.

### §2.3 — Rotate after the migration (hygiene)

**The token was pasted in chat — it is therefore in a transcript, and chat transcripts are not a secret store.** Recommend the user **ROTATE the CF API token after the constellation migration completes**: roll a fresh scoped token (the §2.2 perms), update the GitHub Actions secret + the operator's out-of-band store, and revoke the pasted one in the CF dashboard (My Profile → API Tokens → Roll/Delete). This is standard credential hygiene for any secret that has touched a non-secret channel; it costs one dashboard action and one secret-store update, and it closes the only credential exposure this expansion introduces. The rotate is a named close-item of the final normalization wave (§3), not an optional nicety.

---

## §3 — Scope into D as new waves (folded into thread α / a new thread α′)

The existing D is W0 → Wα → Wχ → W1–W7 across five threads (α/β/γ/δ/ε); `D.md §3`. The constellation normalization is a **thread-α-adjacent** body of work — it is deployment/ingress, the same domain as α (prod integration & deploy). But α as authored is **fourier-only** (the first A/B/C→prod deploy + the fourier domain split + the fourier Mongo bind). The constellation normalization is **broader than fourier** (it reaches ~8 sibling apps, programmatic DNS estate-wide, CF Pages estate-wide). NA6 recommends folding it as a **new thread α′ — "constellation deployment normalization"** — rather than overloading α, because (a) α's existing waves (W1/W2) are fourier-scoped and well-formed and should not be re-opened; (b) α′ is explicitly cross-repo + constellation-flagged (it touches sibling repos the way the shared `/opt/deploy/` dispatcher does — proposed + coordinated, not unilaterally imposed, per `DA6 §1(a)` and `DOMAIN-NAMING.md §6`); (c) a distinct thread label keeps the constellation work's blast-radius and gating legible against fourier-local α/β/γ/δ/ε.

Thread α′ binds to fourier's existing α as its **pilot** (§4): fourier's α.W1/α.W2 *are* the first pass of the pattern (CF Pages frontend would be the one open α-extension; the rest of α.W1/W2 — backend on mbabb, DNS for `api.fourier.babb.dev`, the Mongo loopback bind — already prove the backend/DNS/ingress half). α′ then generalizes the *proven* fourier recipe across the constellation.

### §3.1 — The proposed thread-α′ wave set

Folded after the existing fourier-α waves (W1/W2), research-gated through the same W0→Wα→Wχ discipline (the constellation facets are open questions — the per-app inventory, the palette-api provenance, the CF Pages-vs-wrangler call — exactly the research-first posture `D.md §4 Phase 0` already mandates). The new waves:

| Wave | Title | Thread | Closes on (completion) | Depends on |
|---|---|---|---|---|
| **Wα-R4** (extend the research wave) | *Constellation normalization recon* | α′ | NA1–NA5 land: the per-app inventory (which apps split / all-mbabb / all-Pages — fourier/sudoku/words held open per the user); the CF-Pages-vs-wrangler mechanism call; the DNS-as-code script shape; the ingress-vhost-per-app matrix; the CORS + Mongo-bind list; the palette-api provenance reconcile (`DOMAIN-NAMING.md §3`); the CF token perm-set confirmed with the user (§2.2) | extends the existing Wα |
| **Wχ-P5** (extend the challenge wave) | *Normalization adversarial probe* | α′ | the four new probes: does the DNS mechanism stay a script (not IaC, §1(a))? does CF Pages stay the wrangler recipe (no custom pipeline, §1(b))? does ingress stay host-Apache + CF (no Traefik/k8s, §1(c))? does the rename touch only palette-api→color + the per-app split stay fit-driven (no symmetry-renames, no forced splits, §1(d)(e))? does any wave commit the token (§2.1)? | extends the existing Wχ |
| **α′.W1 — DNS-as-code** | *Programmatic DNS for the constellation* | α′ | the idempotent CF-API DNS script lands (token by-name, §2.1); the `api.<app>.babb.dev` + `<app>.babb.dev` records ensured for the in-scope apps; the script committed (NO token in it); the run transcript captured | Wχ-P5; the fourier pilot (§4) DNS proven first |
| **α′.W2 — CF-Pages frontend migration** *(per-app, parallelizable on disjoint repos)* | α′ | each in-scope frontend onto CF Pages via the wrangler recipe + a per-app GH Actions workflow referencing the Pages-Edit token by-name; the `<app>.babb.dev` CNAME cut to the Pages target; per-app, disjoint repos → parallel under the agent ceiling | α′.W1 (DNS); the fourier pilot proves the recipe |
| **α′.W3 — backend ingress + CORS + Mongo bind** *(per-app)* | α′ | each in-scope backend's `api.<app>.babb.dev` Apache vhost → loopback port; CORS allow-list moved to the split host; the **exposed Mongos bound to loopback** (`DOMAIN-NAMING.md §4`: `palette-api-mongo` on `0.0.0.0:27020` is a live exposure, sibling to fourier's own); the shared-host vhost changes constellation-flagged + coordinated | α′.W1; coordinated with the sibling repos' owners |
| **α′.W4 — palette-api → color rename** *(cross-repo, user-re-mandate-gated)* | α′ | the standalone `/home/mbabb/Programming/palette-api` repo/compose/container/package renamed to color; `api.color.babb.dev` live; CORS allows `https://color.babb.dev`; the palette Mongo loopback-bind; the fourier-touchable shared vhost reconciled | α′.W1–W3; user re-mandate (it is value.js-side) |
| **α′.W5 — normalization close + precept + token rotate** | α′ | the `<app>.babb.dev`/`api.<app>.babb.dev` convention promoted into `docs/precepts/infra/` (alongside the C TLS + deploy notes, per `D.md §5`); the per-app split dispositions recorded; **the CF token rotation done** (§2.3 — roll fresh, update the secret store, revoke the pasted one); the per-app status matrix captured | α′.W1–W4 |

Notes on the fold:
- **Wα-R4 / Wχ-P5 extend the existing research/challenge waves** rather than adding new ones — the research-first gate stays one gate; the constellation facets are additional lanes within the already-planned Wα (≤4 lanes) and Wχ (≤4 probes). This respects `D.md §3`'s "W0 → Wα → Wχ is the research-first gate" without proliferating gates.
- **α′ runs after fourier-α's W1/W2 prove the pattern** (§4). The execution waves α′.W1–W5 do not start until fourier is end-to-end on the pattern.
- **α′.W2/W3 are per-app and parallelizable** on disjoint sibling repos — but bounded by the agent ceiling below.
- **α′.W4 is user-re-mandate-gated** (the rename reaches value.js / the standalone repo), exactly as `D.md §7` already records.

### §3.2 — Agent-budget ceiling

**Hold the existing D hard ceiling: 4 agents/wave** (`DA6 §5`; `D.md §3` "Hard ceiling 4 agents/wave (DA6 guard); D peaks at ~3"). The constellation work is per-app and *tempting* to fan out to one-agent-per-app (8 apps → an 8-agent mega-wave) — **REJECT** that. α′.W2 and α′.W3, though per-app, run at most 4 concurrent agents on disjoint repos, draining the app list in batches. The pilot (§4) further means the *first* app (fourier) is a 1–2 agent careful pass, and only the *proven* recipe fans out. Total D (now α/β/γ/δ/ε + α′) must not exceed the C-shaped lifecycle agent count per wave; the peak stays ~3–4.

---

## §4 — The pilot-then-rollout principle

**Recommendation: prove the full pattern on ONE app — fourier — end-to-end, THEN roll the proven recipe across the others. Reject a big-bang all-apps migration.**

### §4.1 — The argument (KISS + risk)

fourier is **already in flight** as the pattern's first instance: `D.md §3` W1/W2 (thread α) deploy fourier's backend to `api.fourier.babb.dev` on mbabb docker, cut DNS for `api.fourier.babb.dev`, split the host-Apache vhost (`fourier.babb.dev` → frontend, `api.fourier.babb.dev` → backend), move the client base-URL + `CORS_ORIGINS` off same-origin `/api`, and bind `fourier-analysis-mongo` to loopback. The *only* facet fourier-α does not yet exercise is the CF-Pages frontend (today fourier's frontend is served by its own nginx behind Apache). So fourier is **one CF-Pages-extension away from being the complete pilot** of the entire constellation pattern: CF Pages frontend + `api.fourier.babb.dev` backend + programmatic DNS + Mongo loopback-bind, end-to-end, on the live shared host, with a recorded deploy + rollback chain.

Why pilot-then-rollout beats big-bang:

1. **The pattern is unproven across the estate.** None of A/B/C is even *deployed* yet (`DA4`, the pivotal finding — prod serves pre-A `8818ae5`). The constellation has *never* run the `<app>.babb.dev` + CF-Pages + `api.<app>.babb.dev` shape end-to-end on this host. Proving it once, on the app the team knows best and is already deploying, surfaces every sharp edge — the CORS move, the CF Pages build peculiarity (fourier's precompute step, §1(b)), the Apache vhost split, the Mongo bind, the DNS cutover, the rollback — at a blast radius of **one app**, not nine.

2. **The shared host is a multi-tenant blast surface.** fourier co-tenants floridify and the live `palette-api` on one host (`DA4`; `DOMAIN-NAMING.md §3`). A big-bang that re-vhosts, re-CORSes, re-binds Mongos, and re-points DNS for all apps *simultaneously* risks taking down working co-tenants (`palette-api` has been healthy for two months) in one irreversible cut. The brittleness window `D.md §8` already opens for the fourier-only W1 deploy; an all-apps window would be far wider and far harder to roll back. Pilot-first keeps each app's window narrow and independently reversible.

3. **The recipe hardens before it scales.** Once fourier proves the pattern, the per-app rollout (α′.W2/W3) is *mechanical application of a known-good recipe* — the wrangler workflow, the DNS script call, the Apache vhost template, the CORS + Mongo-bind checklist — to each remaining app. Each app's migration is then small, repeatable, and individually rollback-capable. This is the KISS path: solve it once, then copy. A big-bang solves it nine times at once, with nine times the failure modes entangled.

4. **It matches the discipline D already adopted.** D is research-first-gated for the open threads and runs disjoint parallel waves on small blast radii. Pilot-then-rollout is that same discipline applied to the constellation: prove (fourier), challenge (Wχ-P5), then roll out parallel-but-bounded (α′.W2/W3, ≤4 agents). Big-bang violates the brittleness-window discipline `D.md §8` was written to enforce.

### §4.2 — The sequencing verdict

- **fourier IS the pilot.** Its α.W1/α.W2 already deploy the backend/DNS/ingress/Mongo half; add the one CF-Pages-frontend extension (the open α-facet) and fourier is the complete end-to-end proof of the pattern.
- **The pilot completes (and is verified — `ε`'s prod-non-mutating matrix confirms fourier live on the split pattern) BEFORE α′ rolls out.** α′.W1–W5 do not start until fourier is green on CF Pages + `api.fourier.babb.dev` + DNS + Mongo-bind.
- **Then the proven recipe rolls out per-app**, parallel-but-bounded (≤4 agents), each app individually rollback-capable, fit-driven (the split decision per §1(e), fourier/sudoku/words held open until the inventory + user resolve them).
- **The rename (α′.W4) and the token rotate (α′.W5) ride the rollout's tail** — the rename is user-re-mandate-gated; the rotate is the close-item that retires the chat-pasted token.

This is the smallest-honest-mechanism for the constellation as a whole: one careful end-to-end proof, then mechanical replication — not nine simultaneous migrations.

---

## §5 — Provenance

- The existing D shape: `docs/tranches/D/D.md` (§3 wave schedule W0–W7, §4 phases, §7 deferrals — the palette-api rename + `api.color.babb.dev` already recorded as a cross-repo ask, §8 brittleness window).
- The D-development synthesis: `docs/audits/runs/2026-05-27-D-audit/SYNTHESIS.md` (§0 the pivotal "none of A/B/C is in production" finding; §2 the five threads).
- The guard discipline modelled on: `docs/audits/runs/2026-05-27-D-audit/DA6-guard-thread-scoping.md §1` (smallest-honest-mechanism + trap-to-reject), §5 (the binding exclusion list — NO host re-architecture, NO k8s); `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md §4`.
- Domain naming + ingress reality: `docs/tranches/D/coordination/DOMAIN-NAMING.md` (§2 the convention; §3 the host-Apache + CF-Pages + loopback-port reality + the palette-api provenance discrepancy; §4 the `0.0.0.0`-exposed Mongos; §5/§6 the per-side plan + disposition).
- CRUD cohesion (the value.js side, gating α′.W4's rename): `docs/tranches/D/coordination/CRUD-COHESION.md`.
- The credential-discipline model: `scripts/deploy-hook.sh` header (carries NO secret — HMAC in GitHub config + un-tracked hooks.json only); the C-audit inline-plaintext-Mongo-password exposure finding (`SYNTHESIS.md §0.1` / `DA4`).
- The CF-Pages/wrangler recipe substrate: `/Users/mkbabb/Programming/speedtest` (carries `workers/speedtest-edge/wrangler.toml` + the wrangler dependency — the constellation's existing CF deploy recipe).
- The port-block + host scheme: `~/.claude/.../memory/project_infra_plan.md` (10-port blocks 8100/8110/8120/8130/8140, all 127.0.0.1-bound; webhook CI/CD; Mongo TLS+SCRAM on 27017–27020; `words → floridify` rename already done).
- Invariants: 12 (KISS), 15 (no domain-in-app), 16 (no shared framework/codegen — the B trap), 19 (single-replica bound). `feedback_parallelization.md` (maximize agents) bounded by inv-12 + the 4-agent ceiling.
- CF token permission groups: Cloudflare API-token permission model (Zone · DNS · Edit; Zone · Zone · Read; Account · Cloudflare Pages · Edit) — stated for the user to confirm/adjust at Wα-R4.
