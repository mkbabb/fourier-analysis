# D.Wα — research wave (ratification + research-dispatch)

**Wave**: Wα (the research wave; 2–3 parallel ratification lanes; per `D.md §3` Wα row "2-3 parallel"). **Authored**: 2026-05-27 (hardened at Wχ-close from `D.md §3` Wα row + `PROGRESS.md` row 2 + the 10+6-lane D-development audit `docs/audits/runs/2026-05-27-D-audit/`). **Opens after**: W0 closed (`waves/W0.md` — the baseline + the Wα charter); the W0 → Wα → Wχ research-first gate (`D.md §4` Phase 0). **Status on completion**: the strict gate to Wχ opens once this record + the ratified research-contracts index land.

This record is the *binding implementation spec* for Wα. The crucial framing of this wave is in `D.md §3` Wα row + the `SYNTHESIS.md §0`-§5 audit substrate: **the D-development audit already did most of Wα's substantive work**. The 10+6 lanes covered every research subject Wα would normally open as a greenfield investigation — R1 (CRUD-CONTRACT v2.0.0 design — `DA3` + `coordination/CRUD-COHESION.md`), R2 (prod deploy-safety on the shared host — `DA4` + `C/waves/W1.md` + `C/coordination/DEPLOY-RECONCILE.md`), R3 (ingress + domain-naming + TLS-path resolution — `DOMAIN-NAMING.md` + the 6 `NA*` normalization lanes + `CONSTELLATION-DEPLOY.md`), and R4 (the constellation matrix — `NA1`–`NA6` + `CONSTELLATION-DEPLOY.md §2`/§7/§8). Wα at execution is therefore a **ratification + narrowed-research-dispatch** wave — confirm the dev-era findings hold against the live tree + host at execution-time, dispatch at most one narrowed follow-up research lane if a genuine delta surfaces (else proceed to Wχ with a "no delta" close note), and produce the binding research-contracts index that Wχ probes and W1–W12 cite.

**Honesty discipline**: the dev-era audit was deep (1,477 + 285 + 2,047 L across `DA1–DA6`, `design/A1–A4`, `NA1–NA6`, plus `validation-matrix.md` and the screens). Over-research at Wα is gold-plating (DA6 §1(a) + NA6 §1) — KISS / invariant 12 + the user's `feedback_no_fallbacks` mandate forbid re-deriving what is already deeply grounded.

---

## Goal criterion

Wα succeeds if (a) every dev-era audit finding cited as Wα substrate is **re-verified** against the live tree + host at execution-time, with deltas (if any) recorded honestly; (b) at most one narrowed follow-up research lane is authored (if a genuine delta surfaces — e.g. the host tree advanced since 2026-05-27, the live `palette-api` cut a new minor version, a co-tenant app appeared/disappeared, the CF token perms were silently rotated, the prod CA was re-issued); (c) the binding **research-contracts index** lands at `docs/tranches/D/research/README.md` referencing the existing audit substrate as the authority for each lane's verdict — Wα does **not** re-author the substrate, it ratifies it and indexes it; (d) the Wχ probe set (P1–P5 per `D.md §3` Wχ row) is fully scoped against the ratified evidence and ready to fire.

## Completion criterion (the paired gate)

Wα closes when:

1. All four ratification lanes (R1 / R2 / R3 / R4 — §3 below) have a **ratification verdict** recorded in this wave's close record: each is either `RATIFIED-AS-IS` (no delta vs the dev-era audit) or `RATIFIED-WITH-DELTA` (delta named with `file:line` or pasted SSH; honestly recorded, never silently absorbed).
2. If any lane carries `RATIFIED-WITH-DELTA`, the narrowed follow-up research lane is authored at `docs/tranches/D/research/R<n>-<subject>.md` carrying a KISS-ordered verdict + per-line invariant-12 justification for any deviation from the dev-era finding.
3. `docs/tranches/D/research/README.md` exists, indexes the four ratification lanes against their audit-substrate sources (each lane → its DA/NA lane → its coordination doc), records the ratification verdict per lane, and names any follow-up artefact.
4. The `palette_slug` FK cross-repo contract clause is recorded (the one binding cross-repo artefact `DA3 §5` "Critical design notes" §3 names — what fourier guarantees about the slug it stores, what value.js guarantees about resolving it).
5. The W3-vs-δ disposition for the **C4.5/C4.6 visibility-transition guard** (`D.md §7` inheritance — "decide at Wα — it intersects the contract v2.0.0") is recorded.
6. The Wχ probe set (P1–P5) is scoped against the ratified substrate; the per-probe planned PASS criterion + the read-only adversarial check shape are recorded (the full hardening lands at `waves/Wchi.md`, written in parallel; Wα confirms scope sufficiency).
7. No infra/storage/frontend source change commits before Wχ closes (Phase 0 discipline, `D.md §4`).

Wα names an honest successor for anything it cannot land; nothing is claimed proven that is not.

---

## §1 — Why this wave is mostly ratification (the load-bearing framing)

The conventional research wave (`C.Wα` shape — four greenfield lanes producing `R1`–`R4` + four `R-*-spec.md` contracts) is the wrong shape for D, for a measured reason: **the D-development audit already executed Wα's research**. The 10+6 lanes were authored 2026-05-27 with the explicit charter to "devise the path forward" (`PROGRESS.md` "tranche authored" entry), and produced the artefacts a fresh Wα would otherwise produce:

| Dev-era lane | Authored 2026-05-27 | What it would have been at a greenfield Wα |
|---|---|---|
| `DA1` execution fidelity | catalogued the C-era residuals (backend `snapshot_hash`, dead `gallery`, untyped image-asset shim, two `as unknown as` survivors, the stale docstring) — `DA1 §1`/§3/§4 | a γ-thread baseline research lane |
| `DA2` deferred / chronic inventory | the 27 items, 11 chronics ledger; the 3 host chronics promoted to D deliverables now SSH is available | a deferred/chronic research lane |
| `DA3` value.js CRUD cohesion | the live `palette-api` v2.0.0 audit + the ~11 divergent clauses + the two KISS relaxations + the value.js-side I.W1–W4 sketch + the `palette_slug` FK + the colour-lift orthogonality | exactly **R1** at a greenfield Wα |
| `DA4` host / deploy / prod | the live host inventory + the pre-A `8818ae5` finding + the dirty-tree + missing-volume + foreign-CA + dispatcher-weakness + co-tenant blast-radius ledger + the 4-phase deploy sequence | exactly **R2** at a greenfield Wα |
| `DA5` prompts + precepts | the 39 directives × disposition ledger (34 addressed, 5 routed to D, 0 outstanding) | a governance/discipline research lane |
| `DA6` guard + thread scoping | the per-candidate-thread KISS-guard + the must-NOT list + the 4-agents/wave ceiling + the smallest-honest-mechanism per facet | an over-engineering guard research lane |
| `design/A1–A4` | the per-screen surgical findings docs (`/paper`, workspace, gallery + admin, equation + morph + chrome + dark-mode parity) — the binding β-thread evidence | a β-thread research lane |
| `NA1` server inventory | the 14-container ledger + the 5-compose-project map + the live Mongo exposure + the UFW posture | part of **R3** + part of **R4** |
| `NA2` CF-Pages recipe | the speedtest-template-generalized publish recipe | part of **R3**/**R4** |
| `NA3` DNS plan | the programmatic-via-CF-API mechanism + the don't-break list + the grey/orange discipline | part of **R3**/**R4** |
| `NA4` deployability matrix | the per-app split-vs-all-mbabb decision + the live ground-truth + the DNS-already-provisioned fact | part of **R4** |
| `NA5` ingress + CORS + Mongo + deploy generalization | the `api.<app>.babb.dev` recipe + the origin-LE TLS resolution + the per-app CORS audit (palette empty, floridify stale) + the deploy-model generalization | part of **R3** + part of **R4** |
| `NA6` guard + wave structure + credential discipline | the per-facet smallest-honest-mechanism + the CF-token-in-gitignored-`.env`-not-rotated rule + the pilot-then-rollout argument | the constellation governance research lane |
| `validation-matrix.md` | the live Playwright + backend test matrix + the root-cause of the local-e2e red (compute rate-limit + the `KeyError: 'storage_uri'` unmigrated-doc finding) | a ε-thread research lane |

This is materially *more* substrate than a typical Wα produces. The D charter (`D.md §3 Wα` row + `SYNTHESIS.md §0`) acknowledges this by listing Wα as "**2-3 parallel**" rather than C's "**4 parallel**", and by framing the lanes as confirmations (R1 *design*, R2 *survey*, R3 *recon*) rather than greenfield investigations. **Wα's binding job is to ratify the substrate against the live state at execution-time, dispatch at most one narrowed follow-up, and index — not to re-research.**

---

## §2 — File bounds + scope honesty

Wα writes **only** the docs below; all under `docs/tranches/D/`:

| File | Action |
|---|---|
| `docs/tranches/D/research/README.md` | **create** — the binding research-contracts index, the one ratification artefact every successor wave cites |
| `docs/tranches/D/research/R<n>-<subject>.md` | **create iff** a `RATIFIED-WITH-DELTA` verdict surfaces in any lane (at most one such file, per the narrowed-follow-up policy §1); zero such files is the expected outcome if the dev-era findings hold |
| `docs/tranches/D/waves/Walpha.md` | this record (already exists at Wα open, updated at close with the per-lane ratification verdicts) |
| `docs/tranches/D/D.md` | NOT touched (the §X congruence pass below lists findings for team-lead reconcile) |
| `docs/tranches/D/PROGRESS.md` | NOT touched (team-lead updates at wave-close) |
| `docs/tranches/D/coordination/*.md` | NOT touched (coordination docs are the substrate; ratification confirms or names a delta against them, never edits them) |
| `docs/audits/runs/2026-05-27-D-audit/**` | NOT touched (the dev-era audit is the substrate, immutable at execution-time) |
| any source under `api/**`, `web/**`, `scripts/**`, `docker-compose*.yml` | NOT touched (Wα is a research wave; no source change before Wχ closes — Phase 0 discipline) |

**What Wα does NOT do** (scope honesty):
- No source files touched (the first source change is W1, post-Wχ).
- No new research wave authored from scratch — the dev-era audit IS the research; Wα ratifies it.
- No re-derivation of the per-app inventory, the deploy procedure, the CRUD-clause divergence map, the design findings, or the constellation matrix — these are the binding substrate's job, not Wα's.
- No greenfield contracts under `research/R-*-spec.md` (the C.Wα shape) — the binding contracts ARE the existing coordination docs + the existing audit lanes; Wα indexes them, does not duplicate them.
- No CF token usage — the token stays in the gitignored `.env`s.
- No host mutation — every live-host re-probe is read-only (`ls`, `cat`, `git status`, `docker ps`, `ss -tlnp`, `ufw status verbose`, `openssl x509 -noout`), pasted into the ratification record.

---

## §3 — The four ratification lanes (R1 / R2 / R3 / R4)

Each lane has a binding substrate (the dev-era audit doc), a ratification check (the live re-probe), a verdict shape, and a scope boundary. Lanes are file-disjoint and may run in parallel (2–3 agents per `D.md §3` Wα row + the 4-agents/wave ceiling, DA6 §5 + NA6 §3).

### §3.1 — R1: CRUD-CONTRACT v2.0.0 design + the `palette_slug` FK contract

**Substrate** (binding):
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md` — the audit lane (the ~11 divergent clauses, the live `palette-api` v2.0.0 inventory, the value.js-side I.W1–W4 sketch, the colour-lift orthogonality).
- `docs/tranches/D/coordination/CRUD-COHESION.md` — the cross-repo ask doc (the two KISS relaxations, the disposition).
- `docs/tranches/B/coordination/CRUD-CONTRACT.md` + `CONFORMANCE-MATRIX.md` + `CRUD-CONSTELLATION.md` — the B-era contract + matrix + the orphan-row carried since the value.js-C retirement.

**Ratification check** (live re-probe, read-only):
- `curl -sI https://api.color.babb.dev/health` (or the path the live `palette-api-api-1` serves) confirms the service still HTTP 200 + still the v2.0.0 build (per `package.json`, DA3 §1).
- `git -C ~/Programming/value.js rev-parse HEAD` (the value.js repo at execution-time) confirms `value.js/api/` source has not advanced beyond the audit-time SHA in a way that would invalidate the ~11-clause divergence list — if it has, the delta is named.
- A spot-check of the live `palette_slug` FK: `git grep -n "palette_slug" api/models/visualization.py api/lib/crud/etag.py web/src/lib/api.ts` confirms the FK is still at the cited sites (`:119,163,177` + `etag.py:14` + `api.ts:41,65,73`).

**Verdict shape** (the lane's record):
- `RATIFIED-AS-IS` if the dev-era findings hold: the ~11 divergent clauses still hold, the live `palette-api` still HTTP 200, the two KISS relaxations (§2 admits user-supplied slugs; §0 binds behaviour-not-layout) survive Wχ-P3 (the cohesion-KISS probe).
- `RATIFIED-WITH-DELTA` if (e.g.) value.js shipped a 2.1.0 in the interim that closed any of the 11 clauses, or the live service changed shape, or the `palette_slug` FK moved. The delta is recorded with `file:line` + the impact on the W5 plan.
- The **`palette_slug` FK contract clause** is authored regardless (the one binding cross-repo artefact `DA3 §5` "Critical design notes" §3 names): what fourier guarantees about the slug it stores (shape `[a-z0-9][a-z0-9-]*` ≤ 120, unique-within-`visualization`, may be `None`), what value.js guarantees about resolving it (`GET /palettes/{slug}` returns 200 if exists + visible-to-caller, 404 otherwise; no hash in URL). Lands at `docs/tranches/D/research/README.md` under "R1 — `palette_slug` FK contract".
- The **W3-vs-δ disposition for the C4.5/C4.6 visibility-transition guard** (the open question `D.md §7` left for Wα): the guard either folds into the contract v2.0.0 as a clause (δ at W5) or stays a backend-only γ-thread item (W3). Decide here; record at `research/README.md`.

**Files**: `docs/tranches/D/research/README.md` (the lane's section); `docs/tranches/D/research/R1-cohesion-delta.md` only if `RATIFIED-WITH-DELTA`.

**Out of scope**: re-authoring the divergence map (it lives in `DA3 §3`); authoring the value.js-side tranche (it is a value.js tranche, user-re-mandate-gated per `DA3 §5` + `D.md §1 δ`); the colour-lift `sampleToSVGPath` consume (orthogonal, bounded W5 sub-item, fires iff value.js publishes — `DA3 §4`).

### §3.2 — R2: prod-deploy-safety on the shared host

**Substrate** (binding):
- `docs/audits/runs/2026-05-27-D-audit/DA4-host-deploy-prod.md` — the live host audit (the pre-A `8818ae5` finding, the dirty-tree + missing-volume + foreign-CA + dispatcher-weakness + co-tenant blast-radius ledger, the 4-phase deploy sequence in DA4 §6).
- `docs/tranches/C/waves/W1.md` — the C-era deploy-hook spec (the four improvements: `flock` + real `:8100` health-gate + rebuild-on-rollback + dirty-tree-fail-loud + `last-known-green` marker).
- `docs/tranches/C/coordination/DEPLOY-RECONCILE.md` — the host-residual coordination doc.
- `docs/tranches/C/infra/blob-backend-dr.md:64` — the `docker volume create image_blobs` precondition.
- `D/waves/W0.md §1` — the W0 baseline (host SHA, dirty paths, missing volume, foreign-CA subject).

**Ratification check** (live re-probe, read-only):
- `ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD && git status --porcelain"` — confirm HEAD still `8818ae5`; confirm `M docker-compose.prod.yml`, `M docker-compose.yml`, `?? ssl/` still hold.
- `docker volume inspect image_blobs` — confirm still absent (`Error: no such volume`).
- `docker exec fourier-analysis-backend-1 env | grep MONGO_URI` — confirm inline plaintext password + `tlsAllowInvalidCertificates=true` still in the live env (DA4 §1.2).
- `openssl x509 -in /var/www/fourier-analysis/ssl/mongo-ca.pem -noout -subject` — confirm `CN=mbabb.fridayinstitute.net` still the live CA (DA4 §3.2) — the foreign subject for `gen-mongo-certs.sh` reuse.
- `grep -c flock /opt/deploy/scripts/dispatch.sh && grep -c porcelain /opt/deploy/scripts/dispatch.sh` — confirm both `0` still (the four improvements still absent).
- `ls -la /opt/deploy/hooks.json /opt/deploy/.env` — confirm `0664 mbabb:mbabb` perms still (the §1.4 hardening still pending).

**Verdict shape**:
- `RATIFIED-AS-IS` if every fact above re-confirms. Expected outcome.
- `RATIFIED-WITH-DELTA` if the host moved (the very rare case — e.g. someone re-ran `gen-mongo-certs.sh` since 2026-05-27, or the dispatcher was rewritten, or `image_blobs` was created out-of-band). Each delta named; the W1 plan is re-scoped accordingly.

**Files**: `docs/tranches/D/research/README.md` (the lane's section); `docs/tranches/D/research/R2-deploy-delta.md` only if `RATIFIED-WITH-DELTA`.

**Out of scope**: re-deriving the deploy procedure (it lives in `DA4 §6` + `C/W1.md` + `DEPLOY-RECONCILE.md`); rewriting the shared `/opt/deploy/dispatch.sh` (constellation-flagged host-ops, not Wα — DA6 §1(a) + `D.md §3 W1` row); proposing changes to the sibling-repo arms.

### §3.3 — R3: ingress + domain-naming + the palette-api provenance reconcile

**Substrate** (binding):
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` — the live container + Apache ingress map.
- `NA4-deployability-matrix.md` — the per-app split-vs-all-mbabb decision + the DNS-already-provisioned fact.
- `NA5-ingress-cors-security.md` — the `api.<app>.babb.dev` recipe + the origin-LE TLS resolution + the per-app CORS audit.
- `docs/tranches/D/coordination/DOMAIN-NAMING.md` — the `<app>.babb.dev`/`api.<app>.babb.dev` convention + the current ingress reality + the open palette-api provenance question.
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md §3.2`/§8 — the TLS-path resolution (grey-cloud + origin LE) + the four-move per-backend recipe.

**Ratification check** (live re-probe, read-only):
- `dig +short api.fourier.babb.dev` — confirm the wildcard `*.babb.dev` still resolves to CF (or — better — that the grey-cloud A record has been written; if neither, NA3's "DNS is already provisioned" claim is delta-relevant).
- `getent hosts color.babb.dev` — confirm GH Pages still the front (vs CF Pages flipped); NA4 §0 said "DNS already provisioned for the split" so live state may have advanced.
- `cat /etc/apache2/sites-enabled/babb-dev.conf` (read-only) — confirm `fourier.babb.dev` still the only fourier vhost (no `api.fourier.babb.dev` vhost yet).
- `ls /home/mbabb/Programming/palette-api/.git/config 2>&1 || echo "not a git repo"` — confirm the palette-api host dir is **a standalone repo** (the reconcile DOMAIN-NAMING §3 asked Wα to do): is it a fresh clone of `value.js`, a checkout of `value.js/api/` only, an rsync from the value.js repo to a host-only directory, or a divergent copy? NA1 + NA4 + CONSTELLATION-DEPLOY §2 settle "standalone rsync, not `value.js/api/`" — Wα re-confirms.
- `docker exec palette-api-api-1 printenv ALLOWED_ORIGINS` — confirm the CORS list still empty (NA5 §0 headline); `docker exec floridify-backend printenv BACKEND_CORS_ORIGINS` — confirm still stale `mbabb.friday.institute` (NA5 §0).

**Verdict shape**:
- `RATIFIED-AS-IS` if every fact above re-confirms.
- `RATIFIED-WITH-DELTA` if (e.g.) someone added an `api.fourier.babb.dev` vhost in the interim, or rewrote palette-api's CORS allow-list, or the palette-api host repo turned out to be a checkout vs an rsync.
- The **palette-api provenance answer** is recorded (the standalone-repo-on-host, deployed via the dispatcher's `mkbabb/value.js` arm). This is the W11 (palette-api → color rename) gate: the rename touches the standalone host repo + its compose project + its package name, not `value.js/api/`. Record at `research/README.md` under "R3 — palette-api provenance".

**Files**: `docs/tranches/D/research/README.md` (the lane's section); `docs/tranches/D/research/R3-ingress-delta.md` only if `RATIFIED-WITH-DELTA`.

**Out of scope**: re-deriving the api-`<app>` recipe (it lives in `NA5 §1` + `CONSTELLATION-DEPLOY §8`); proposing a different TLS path (the grey-cloud + origin LE resolution is bound by user direction, `CONSTELLATION-DEPLOY §3.2`); designing the rename (it lands at W11, user-re-mandate-gated — `D.md §3 W11` row).

### §3.4 — R4: the constellation matrix + the pilot-then-rollout ordering

**Substrate** (binding):
- `docs/audits/runs/2026-05-27-D-audit/normalization/NA1-server-inventory.md` §2 — the 7-app constellation table.
- `NA2-cf-pages-recipe.md` — the wrangler recipe.
- `NA3-dns-plan.md` — the programmatic CF-API approach + the don't-break list.
- `NA6-guard-wave-structure.md` — the smallest-honest-mechanism + the pilot-then-rollout argument + the CF-token discipline.
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` §2/§7/§8 — the binding constellation plan.

**Ratification check** (live re-probe, read-only):
- `docker compose ls -a` (on the host) — confirm the 4 compose projects (fourier-analysis, floridify, palette-api, csp-solver) still running; speedtest still absent from compose-ls (off to CF Pages); no new compose project appeared.
- `ls /etc/letsencrypt/live/sudoku.babb.dev/` — confirm the live LE cert covering fourier/sudoku/words SANs is still there; `openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text | grep -A1 "Subject Alternative Name"` — confirm the SAN set (for `certbot --expand` extension at W10).
- `git -C ~/Programming/keyframes.js rev-parse HEAD 2>/dev/null || echo "keyframes.js not on host"` — confirm keyframes.js's GH-Pages provenance unchanged.
- `git -C /var/www/grammar log -1 --format='%cI %h'` — confirm the bbnf-lang dirty-master state (1009 commits / 14d activity per CONSTELLATION-DEPLOY §2 keynote — the grammar DEFER gate).

**Verdict shape**:
- `RATIFIED-AS-IS` if the constellation matrix re-confirms.
- `RATIFIED-WITH-DELTA` if (e.g.) a new app appeared on the host since 2026-05-27, or grammar's quiet window opened, or keyframes.js cut a release, or the CF token perm-set was silently rotated.
- The **pilot-then-rollout ordering** is re-confirmed (fourier W1/W2/W9 → keyframes + value.js/color off GH Pages at W9 → sudoku split at later W10 → grammar DEFERRED).
- The **CF token discipline** re-confirmed: in gitignored `.env`s + the CI secret store, NEVER committed, not rotated per user direction, referenced by name.

**Files**: `docs/tranches/D/research/README.md` (the lane's section); `docs/tranches/D/research/R4-constellation-delta.md` only if `RATIFIED-WITH-DELTA`.

**Out of scope**: re-deriving the wrangler recipe (NA2); re-deriving the DNS-as-code script shape (NA3); proposing IaC/Terraform for the DNS surface (NA6 §1(a) rejects as gold-plating); proposing Traefik/k8s ingress (NA6 §1(c) rejects); proposing a deep rename beyond palette-api → color (NA6 §1(d) rejects).

---

## §4 — The narrowed-follow-up policy (the at-most-one-lane rule)

Wα may dispatch **at most one** narrowed follow-up research lane, if and only if a `RATIFIED-WITH-DELTA` verdict surfaces in any of R1–R4 **and** the delta is load-bearing on a Wχ probe or an implementation-wave plan. The lane authors a focused `R<n>-<subject>.md` under `docs/tranches/D/research/` with a KISS-ordered verdict + per-line invariant-12 justification for any deviation from the dev-era finding. The narrowed lane does **not** re-author the dev-era substrate — it surfaces the delta + names the impact.

Expected outcome: **zero narrowed lanes** (the dev-era audit was deep + recent — execution-time deltas should be small). Recording the policy ensures Wα knows when to spawn and when not to.

**Multiple deltas across multiple lanes** — fold them into one consolidated `R-deltas.md` artefact (not separate per-lane files); the 4-agents/wave ceiling holds regardless (DA6 §5 + NA6 §3).

**No delta** — Wα closes with the four lanes recording `RATIFIED-AS-IS` and the `research/README.md` index citing the audit substrate as the binding evidence. This is the expected close.

---

## §5 — The research-contracts index (`docs/tranches/D/research/README.md`)

The one binding artefact Wα produces. Shape (the four sections, one per lane; plus a header + footer):

```
# D — research contracts index (ratified at Wα close)

**Status**: ratified at Wα close. **Authored**: 2026-05-27 (folding the
D-development audit substrate). **Authority**: this index binds the Wχ probes
and the W1–W12 implementation; deviation requires re-opening Wα.

## R1 — CRUD-CONTRACT v2.0.0 + the `palette_slug` FK contract
- Verdict: RATIFIED-AS-IS / RATIFIED-WITH-DELTA (named)
- Authority: docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md;
            docs/tranches/D/coordination/CRUD-COHESION.md
- Live re-probe results: <pasted>
- `palette_slug` FK clause: <recorded>
- C4.5/C4.6 visibility-transition guard: W3 / δ verdict <recorded>

## R2 — prod-deploy-safety
- Verdict: …
- Authority: docs/audits/runs/2026-05-27-D-audit/DA4-host-deploy-prod.md;
            docs/tranches/C/waves/W1.md;
            docs/tranches/C/coordination/DEPLOY-RECONCILE.md
- Live re-probe results: <pasted>

## R3 — ingress + domain-naming + palette-api provenance
- Verdict: …
- Authority: docs/audits/runs/2026-05-27-D-audit/normalization/{NA1,NA4,NA5}.md;
            docs/tranches/D/coordination/{DOMAIN-NAMING,CONSTELLATION-DEPLOY}.md
- Live re-probe results: <pasted>
- palette-api provenance answer: <recorded>

## R4 — constellation matrix + pilot-then-rollout
- Verdict: …
- Authority: docs/audits/runs/2026-05-27-D-audit/normalization/{NA1,NA2,NA3,NA6}.md;
            docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md
- Live re-probe results: <pasted>
- CF token discipline re-confirmed: <YES/NO>

## Narrowed follow-up lanes (if any)
<zero or one file>
```

The index is fourier-tracked at `docs/tranches/D/research/README.md`; the substrate it cites lives across the audit run + the coordination docs + the C waves (the precepts submodule for `infra/`-promoted material — `tls.md`, `blob-backend-dr.md`, the deploy precept — at W2).

---

## §6 — Agent dispatch (2–3 parallel)

Per `D.md §3` Wα row "2–3 parallel" + the 4-agents/wave ceiling (DA6 §5 + NA6 §3). Two configurations: **2-agent** (one agent per cluster) is the KISS default; **3-agent** (one agent per cluster + a dedicated narrowed-follow-up if a delta surfaces mid-wave) only if a delta is detected at the early ratification checks.

### Wα.a — R1 + R2 (the legacy-completion + the deploy-safety cluster)

- **Goal**: R1 + R2 ratified, the `palette_slug` FK clause recorded, the C4.5/C4.6 W3-vs-δ verdict recorded, the live re-probes pasted into the index.
- **Mechanism**: read-only re-probes per §3.1 and §3.2; the ratification verdicts authored into `research/README.md` sections "R1" and "R2"; if a delta surfaces in either, the consolidated `R-deltas.md` opens.
- **Files**: `docs/tranches/D/research/README.md` (create — sections R1 + R2); `docs/tranches/D/research/R-deltas.md` (create iff a delta surfaces).
- **Sub-gates**: each of §3.1 and §3.2's ratification-check commands has a pasted output in the index; the verdict line per lane is one of `RATIFIED-AS-IS` / `RATIFIED-WITH-DELTA: <delta>`; the `palette_slug` FK clause section names what fourier guarantees + what value.js guarantees; the C4.5/C4.6 disposition is one of `W3` / `δ` with a one-sentence rationale.

### Wα.b — R3 + R4 (the ingress + constellation cluster)

- **Goal**: R3 + R4 ratified, the palette-api provenance answer recorded, the CF token discipline re-confirmed, the live re-probes pasted into the index.
- **Mechanism**: read-only re-probes per §3.3 and §3.4; the ratification verdicts authored into `research/README.md` sections "R3" and "R4"; if a delta surfaces in either, fold into `R-deltas.md`.
- **Files**: `docs/tranches/D/research/README.md` (create — sections R3 + R4); `docs/tranches/D/research/R-deltas.md` (append iff a delta surfaces).
- **Sub-gates**: each of §3.3 and §3.4's ratification-check commands has a pasted output in the index; the verdict line per lane is one of `RATIFIED-AS-IS` / `RATIFIED-WITH-DELTA: <delta>`; the palette-api provenance answer is one sentence (`standalone-repo on the host at /home/mbabb/Programming/palette-api, deployed via the dispatcher's mkbabb/value.js case arm, NOT value.js/api/`); the CF-token-discipline re-confirmation cites NA6 §2 + CONSTELLATION-DEPLOY §6.

### Wα.c (optional — only if a delta surfaces) — the narrowed follow-up

- **Goal**: the consolidated `R-deltas.md` records the delta(s) found across R1–R4, with `file:line` or pasted SSH evidence + KISS-ordered remediation per-delta + the impact on Wχ probes + the impact on implementation waves.
- **Files**: `docs/tranches/D/research/R-deltas.md`.
- **Sub-gates**: every delta has its evidence (file:line or pasted SSH); every delta names its impact on (a) which Wχ probe + (b) which implementation wave + (c) the KISS-ordered remediation; no delta is silently absorbed.

**Disjointness**: Wα.a touches `research/README.md` R1+R2 sections + (optionally) `R-deltas.md`; Wα.b touches `research/README.md` R3+R4 sections + (optionally) `R-deltas.md`. The shared `R-deltas.md` is append-only with section headers; the orchestrator integration commit reconciles if both agents append.

---

## §7 — Hard-gate ledger

| # | Gate | How proven | Repo-local vs host |
|---|---|---|---|
| Wα-G1 | `docs/tranches/D/research/README.md` exists, indexes the four ratification lanes (R1, R2, R3, R4) against their substrate sources | `test -f`; `git grep -nE "## R[1-4]" docs/tranches/D/research/README.md` returns ≥ 4 | repo-local |
| Wα-G2 | Each lane's ratification verdict is recorded as `RATIFIED-AS-IS` or `RATIFIED-WITH-DELTA: <delta>` | `git grep -nE "Verdict: RATIFIED" docs/tranches/D/research/README.md` returns ≥ 4 | repo-local |
| Wα-G3 | The live re-probe outputs are pasted into the index (read-only — `ls`/`cat`/`git status`/`docker ps`/`ss`/`ufw`/`openssl x509`) | the `Live re-probe results:` sub-section under each lane carries pasted command + output | host (read-only) — performed during Wα; the pastes are the artefact |
| Wα-G4 | The `palette_slug` FK contract clause is recorded under R1 | `git grep -n "palette_slug FK clause" docs/tranches/D/research/README.md` returns ≥ 1; the clause names what fourier guarantees + what value.js guarantees | repo-local |
| Wα-G5 | The C4.5/C4.6 visibility-transition-guard W3-vs-δ disposition is recorded under R1 | `git grep -nE "C4\.5|visibility-transition" docs/tranches/D/research/README.md` returns ≥ 1 with a `W3` or `δ` verdict + a one-sentence rationale | repo-local |
| Wα-G6 | The palette-api provenance answer is recorded under R3 (`standalone-repo at /home/mbabb/Programming/palette-api`) | `git grep -nE "palette-api provenance" docs/tranches/D/research/README.md` returns ≥ 1; the answer cites NA4 + CONSTELLATION-DEPLOY §2 | repo-local |
| Wα-G7 | The CF-token discipline re-confirmed under R4 | `git grep -nE "CF.token discipline" docs/tranches/D/research/README.md` returns ≥ 1; cites NA6 §2 + CONSTELLATION-DEPLOY §6 | repo-local |
| Wα-G8 | The narrowed-follow-up lane exists IFF any lane carries `RATIFIED-WITH-DELTA`; absent IFF all four ratify clean | conditional: if `RATIFIED-WITH-DELTA` appears anywhere, `test -f docs/tranches/D/research/R-deltas.md`; else `test ! -f docs/tranches/D/research/R-deltas.md` | repo-local |
| Wα-G9 | No source files touched | `git diff --stat HEAD~1 HEAD -- 'api/**' 'web/**' 'scripts/**' 'docker-compose*.yml'` returns zero lines | repo-local |
| Wα-G10 | The Wχ probe set (P1–P5) is scoped against the ratified substrate | `docs/tranches/D/waves/Wchi.md` exists (authored in parallel with Wα close) and each P1–P5 cites this ratified substrate; Wα's close note confirms scope sufficiency | repo-local |

**Headline**: every gate is repo-local except G3 (the host re-probes), which is host-read-only and whose evidence is the pasted output in the index — the host work is read-only observation, not mutation. No source change in this wave.

---

## §8 — Out of scope (KISS / invariant 12)

- **No re-research of any audit lane's findings.** The dev-era audit IS the research; Wα ratifies. Re-deriving the divergence map (DA3), the host inventory (DA4), the design findings (design/A1–A4), the constellation matrix (NA1/NA4), or the deploy procedure (DA4 §6 + C/W1) is gold-plating (DA6 §1 + NA6 §1).
- **No greenfield `R-*-spec.md` contracts.** The C.Wα shape of "four `R-*-spec.md` greenfield contracts" is rejected: the binding contracts ARE the existing coordination docs (`coordination/{CRUD-COHESION,DOMAIN-NAMING,CONSTELLATION-DEPLOY}.md`) + the existing audit lanes. Wα indexes them — does not duplicate.
- **No source change**, on principle (Phase 0 discipline, `D.md §4`) — the first source change is W1, post-Wχ.
- **No host mutation.** The host re-probes are read-only (`ls`/`cat`/`git status`/`docker ps`/`ss`/`ufw`/`openssl x509 -noout`); pasted into the index. Any mutation belongs to W1.
- **No CF token usage.** The token stays in the gitignored `.env`s; the live re-probes use SSH read commands that don't require CF API access (NA4 §0 already established "DNS is already provisioned for the split" — Wα re-confirms with `dig`/`getent` only).
- **No new threads / no new waves.** The five threads (α / β / γ / δ / ε / α′) + the wave set (W0/Wα/Wχ/W1–W12) are fixed by `D.md §3`; Wα does not add or split.
- **No Wχ probe pre-emption.** The P1–P5 verdicts are Wχ's job; Wα scopes them but does not run them.
- **No precept-submodule edit.** The precepts promotion (`tls.md`, `blob-backend-dr.md`, the deploy precept, the `<app>.babb.dev` naming precept) is W2's, not Wα's.

---

## §9 — Dependencies + ordering

- **Depends on**: W0 closed (`waves/W0.md` — the baseline + the Wα charter); the 10+6-lane D-development audit landed (`docs/audits/runs/2026-05-27-D-audit/`); `D.md` + `PROGRESS.md` + the three `coordination/*.md` authored.
- **Blocks**: Wχ (the challenge wave); every implementation wave W1–W12 cites the Wα-ratified research-contracts index.
- **Independent of**: no other wave runs in parallel with Wα (per `D.md §3`: the W0 → Wα → Wχ research-first gate is strictly sequenced).

---

## §10 — Verification artefacts (what Wα commits)

- `docs/tranches/D/research/README.md` — the binding research-contracts index, with the four ratification verdicts + the four sets of live re-probe outputs + the `palette_slug` FK clause + the C4.5/C4.6 disposition + the palette-api provenance answer + the CF-token discipline re-confirmation.
- `docs/tranches/D/research/R-deltas.md` — only if `RATIFIED-WITH-DELTA` surfaces; else absent.
- The Wα close-record updates to this file (`waves/Walpha.md`): the per-lane verdicts table + the close note ("dispatched to Wχ — every probe scope confirmed against ratified evidence").
- `git diff --stat` of the Wα commit shows only `docs/tranches/D/research/**` + `docs/tranches/D/waves/Walpha.md` modified; **no source change** (the headline Wα discipline).

---

## §11 — Archaeology

Wα at D is structurally different from Wα at C: C.Wα was four greenfield research lanes producing `R1-storage-backend.md` / `R2-cicd.md` / `R3-tls.md` / `R4-janitor-reload.md` + four `R-*-spec.md` contracts (the binding research substrate the Wχ probes attacked). C went in with no prod SSH + a thinner pre-audit substrate; the lanes had real work to do.

D went in with a 10+6-lane D-development audit + the user's "tranche development only" mandate explicitly produced the research deliverables ahead of Wα open. The lanes at D-Wα are therefore ratification not research — confirm the substrate against live state, dispatch at most one narrowed follow-up if a genuine delta surfaces, index. The `SYNTHESIS.md §7` "Path forward" makes this explicit: "the D wave specs harden at Wχ per the research-first discipline (δ is the research-first thread; α/β/γ/ε are direct)."

The shape mismatch is honest: a tranche whose audit lanes were done in development cannot pretend Wα is greenfield research. The KISS choice — bind the existing substrate, ratify, index, dispatch Wχ — preserves the W0 → Wα → Wχ research-first gate discipline without re-doing work the audit already did. This is the precept-faithful execution of an unusually well-audited tranche, not a research-wave skip.

---

## §12 — Summary

Wα is a **ratification + research-dispatch wave**, not a greenfield research wave — because the 10+6-lane D-development audit already executed Wα's substantive research (R1 = `DA3` + `CRUD-COHESION.md`; R2 = `DA4` + `C/W1` + `DEPLOY-RECONCILE`; R3 = `DOMAIN-NAMING` + the 6 `NA*` lanes + `CONSTELLATION-DEPLOY`; R4 = `NA1–NA6` + `CONSTELLATION-DEPLOY`). Wα at execution confirms the dev-era findings hold against the live tree + host, dispatches at most one narrowed follow-up lane if a genuine delta surfaces (the expected outcome is zero — the audit was recent + deep), and produces the binding `docs/tranches/D/research/README.md` research-contracts index that Wχ probes and W1–W12 cite. The `palette_slug` FK contract clause + the C4.5/C4.6 W3-vs-δ disposition + the palette-api provenance answer + the CF-token discipline re-confirmation land in the index as the one new substantive output. No source change (Phase 0 discipline). Hard ceiling 4 agents/wave; D-Wα peaks at 2 (or 3 if a mid-wave delta opens the narrowed-follow-up agent). The strict Wα → Wχ gate opens on this record's close + the index's landing.

---

## §X — Congruence findings (for team-lead reconcile)

The following incongruences between this wave spec and `D.md` / `PROGRESS.md` / `coordination/*.md` were surfaced during Wα authoring. Do NOT edit centrally from here; team-lead reconciles.

1. **`PROGRESS.md` Wα row lists "R1 + R2; optional R3 value.js alignment-tranche shape"** while **`D.md §3` Wα row lists "R1 CRUD-CONTRACT v2.0.0 design + R2 prod-deploy-safety + R3 ingress + domain-naming"** (no "optional R4 / NA-folded constellation"). The two agree on R1 + R2 but disagree on R3 (PROGRESS = optional value.js alignment-tranche shape; D.md = ingress + DNS + TLS + palette-api provenance). NA-folding effectively added a fourth lane (R4 = constellation matrix). Wα's record above treats four lanes (R1/R2/R3/R4) per D.md + NA-folding; `PROGRESS.md` should be updated to list the four ratification lanes consistently. Same finding raised in `W0.md §X.6`.

2. **`D.md §3` Wα row "R3" includes "the **palette-api provenance discrepancy**" as an open question for Wα** but the NA-folded coordination doc `CONSTELLATION-DEPLOY.md §2` row 2 (palette-api col) + `NA4 §0` already record the answer ("**standalone rsync, not value.js/api**"). The question is no longer open; the Wα ratification re-confirms only. Reconcile path: `D.md §3 Wα` R3 cell should be updated to say "ratify the palette-api provenance answer (standalone-repo, not value.js/api) against live state" rather than "the provenance discrepancy" framed as open. Same finding raised in `W0.md §X.5`.

3. **`D.md §1 α′` and `D.md §3` table footer mention "R4 (the constellation matrix), landed this round as `normalization/NA1-6`"** — confirming the dev-era audit covered R4 — but `D.md §3` Wα row text itself lists only R1/R2/R3 (the R4 is implicit in the NA-folding). Wα authoring above treats R4 as a fourth ratification lane (per the NA-folding). Reconcile: `D.md §3` Wα row text should explicitly list R4 (constellation matrix) alongside R1/R2/R3.

4. **`D.md §7` "Inherited from B/C" carries "The C4.5/C4.6 visibility-transition guard (struck at C.W4) → **W3 or δ** (decide at Wα — it intersects the contract v2.0.0)"** — Wα is asked to decide. This wave's §3.1 + §10 + Wα-G5 ledger discharge the decision; the rationale recorded under R1 in `research/README.md`. Reconcile: at Wα close, `D.md §7` should be updated to remove the "decide at Wα" clause and record the verdict (W3 vs δ).

5. **The "R3" / `R-deploy-spec` shape mismatch from C** — C.Wα authored `R-deploy-spec.md` as a greenfield contract that the live host then contradicted (forcing the C.Wχ-P2 reconcile + the C.W1 §1 "rejection as fiction"). D.Wα explicitly does NOT author a parallel `R-deploy-spec`-style contract — the binding contract is the existing `DA4 §6` 4-phase deploy sequence + the existing C.W1 `scripts/deploy-hook.sh` (already in tree). This is intentional, not an oversight: D learned from C that greenfield-spec-against-live-host is a fiction-factory. Reconcile: record this lesson explicitly in `D.md §3` Wα row text (or in a one-line "Wα authors no greenfield contracts; binds the existing substrate" note in `D.md §4` Phase 0).

6. **Provisional `D.md` agent count "2–3 parallel"** — Wα's §6 above lists 2 default + 1 conditional (= 3) if a mid-wave delta surfaces. This matches `D.md §3` Wα "2–3 parallel" exactly. **NO incongruence** — recording for completeness.

7. **The Wα close ordering vs the Wχ scope sufficiency** — Wα closes when the Wχ probe set (P1–P5) is "fully scoped against the ratified evidence and ready to fire" (this wave's `Wα-G10`); the Wχ scoping work itself lives at `waves/Wchi.md` (authored in parallel with Wα close per the team-lead's parallelization mandate). The two waves are file-disjoint (Wα touches `research/`; Wχ touches `waves/Wchi.md` + later, on execution, an `audit/` directory). The ordering is fine — Wα closes against the Wχ scope, Wχ executes against the Wα ratification. Recording for clarity; **no incongruence**.

8. **Whether `docs/tranches/D/research/` is a new directory or an existing one** — at W0 close, the dir does not exist (W0 only writes to `docs/tranches/D/waves/`). Wα creates `docs/tranches/D/research/README.md` and (conditionally) `research/R-deltas.md`. Reconcile path: confirm the team-lead's commit-ordering tolerates Wα being the first commit under `research/`; the C-tranche precedent (`docs/tranches/C/research/`) shows the directory shape is acceptable.

9. **The `D.md §3` Wα row's "(the **palette-api provenance discrepancy** — prod deploys from standalone `/home/mbabb/Programming/palette-api`, not `value.js/api/`; how `color.babb.dev` GitHub Pages reaches the API today)"** asks two sub-questions: (a) palette-api provenance (answered above + in NA1/NA4/CONSTELLATION-DEPLOY); (b) "how `color.babb.dev` GH Pages reaches the API today" — the answer is in the read-only ingress recon (NA5 §1 confirms `default-ssl.conf`'s `/colors/` path-proxy on `mbabb.fi.ncsu.edu` → `localhost:8130`; the GH Pages `color.babb.dev` frontend fetches via CORS to that legacy path, gap-filled by NA5 §0's "palette-api `ALLOWED_ORIGINS` is EMPTY in the live container" finding — CORS effectively closed; the live wiring works only because the CORS preflight is bypassed somewhere, or the frontend doesn't actually call the API yet, or it goes via a non-standard route). Wα should record this as an explicit answer under R3 — the GH-Pages-to-API path is currently broken or non-existent, which is why the W9 CF-Pages frontend migration + the W10 `api.color.babb.dev` + the CORS fix all need to land together. Reconcile: this nuance is worth surfacing at `D.md §3` Wα or in the R3 lane record.

10. **The validation-matrix `KeyError: 'storage_uri'` finding** (`validation-matrix.md §2`) — surfaces in W0.md §6.2 as evidence for the code-and-migration-together invariant, and again as a γ-thread sub-item (W3) per the typed-asset transposition (`DA1 §3.3`). It is also implicitly a ε-thread harness item (the local e2e ran red because of it). Reconcile: this finding is correctly threaded across W3 (γ — typed asset model) + W1 (α — migration-with-deploy) + W6 (ε — the `COMPUTE_RATE_LIMIT` harness fix for the rate-limit failures); recording for completeness that all three threads address it together.

End of Wα.
