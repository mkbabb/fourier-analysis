# C.W0 — open · baseline audit · research dispatch

**Wave**: W0 (the open/dispatch/baseline gate; 1 agent — team-lead authored). **Authored**: 2026-05-27. **Predecessor close confirmed**: B closed at `fc5b3b0` (`B/FINAL.md`); the C-development expansion committed at `9003cba`. **Status on completion**: the strict gate W0 → Wα → Wχ opens once this record + the Wα dispatch land.

This record is the *binding baseline* — every Wα research lane and every Wχ probe measures against the facts catalogued here, grounded in `file:line` against the live tree (not the audit's remembered anchors, which `CA5` already found drifted). Where this record and `C.md` disagree on a fact, this record (read fresh from the tree on 2026-05-27) governs and `C.md` is corrected at Wχ harden.

## §0 — Gate checklist (W0 completion criterion, from `C.md §3`)

| W0 deliverable | State | Evidence |
|---|---|---|
| B confirmed closed (`fc5b3b0`) | ✅ | `git log`; `B/FINAL.md` |
| infra-baseline snapshot committed | ✅ | §1 below |
| B-residual catalog committed | ✅ | §2 below |
| `--reload` baseline finding recorded | ✅ | §3 below |
| brittleness window §8 ratified-or-removed | ✅ ratified-provisional | §4 below |
| research lanes dispatched | ⇒ | §5 below (the Wα charter) |

## §1 — Infra baseline snapshot (thread α + β surfaces)

### §1.1 — The deploy path (`scripts/deploy.sh`, 43 L)

Manual SSH-push. `git push origin master` → `ssh -p 1022 mbabb@mbabb.fridayinstitute.net` → `git reset --hard origin/master` → `docker compose … build --parallel && up -d` → `sleep 5` → health-check. Single-operator, single-key, no rollback path beyond a manual re-push of an earlier SHA. This is the surface W1 retires.

- **The health-check port bug** (`deploy.sh:38-39`): curls `http://localhost:8091/api/health` and `:8091/`. **Live prod binds `:8100`** (`docker-compose.prod.yml:72` — `127.0.0.1:${HTTP_PORT:-8100}:80`). The health check has been checking a dead port; it "passes" only via the `|| echo "not responding"` swallow. Moot post-retirement (W1), but recorded as the canonical example of why an unobservable deploy hides drift.

### §1.2 — TLS posture (`docker-compose.prod.yml` — 3 sites)

The mongod *server* is already TLS-correct: `--tlsMode requireTLS` with `--tlsCertificateKeyFile /etc/ssl/mongo.pem` + `--tlsCAFile /etc/ssl/mongo-ca.pem` (`:45-47`). The unfaithfulness is in the trust posture around it — **3 sites** (matches `CA5`):

| Site | Line | What it does | W2 disposition |
|---|---|---|---|
| client MONGO_URI | `:8` | `…&tls=true&tlsAllowInvalidCertificates=true` — the app trusts any cert | remove `tlsAllowInvalidCertificates`; trust via mounted CA (`tlsCAFile`) |
| mongod server | `:48` | `--tlsAllowConnectionsWithoutCertificates` — accepts certless clients | remove once the client presents/validates properly (Wα-R3 decides mutual-TLS vs server-only) |
| healthcheck | `:53` | mongosh `--tls --tlsAllowInvalidCertificates` | point mongosh at the CA file |

The cert provenance (self-signed? issuer? rotation?) is **unknown from the tree** — `/etc/ssl/mongo.pem` is mounted at deploy, not committed. **Wα-R3 must surface where these certs come from**; an invariant-19 "verified-cert issuer recorded" gate cannot be met until the provenance is known.

### §1.3 — Secrets in compose (W1 sub-gate — mostly already satisfied)

`docker-compose.prod.yml` does **not** commit plaintext credentials: `MONGO_PASSWORD` is `${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}` (required-error interpolation) at `:8,:44,:51`; `MONGO_USER` defaults to a non-secret `fourier-admin`. Dev (`docker-compose.yml:14`) carries `fourier-dev-only` as an explicit dev default — acceptable. **Finding**: the "secrets out of compose files" gate (`C.md §6`) is **already met for passwords**; W1's secret work is therefore narrow — confirm no secret enters via the new webhook receiver's config, and document the `${VAR:?}` convention in `docs/precepts/infra/`. This is a *refinement*, not a crisis; W1's headline remains the deploy retirement.

### §1.4 — Port map

| Surface | Dev | Prod | Source |
|---|---|---|---|
| backend (uvicorn) | `8000:8000` | internal only (`ports: !reset []`) | `docker-compose.yml:7`, `prod.yml:5` |
| frontend (vite/nginx) | `3000:3000` | internal only | `docker-compose.yml:25`, `prod.yml:27` |
| nginx reverse proxy | — | `127.0.0.1:8100:80` | `prod.yml:72` |
| nginx → backend | — | `proxy_pass backend:8000` | `nginx/fourier.conf:10,21,32` |

The canonical prod port is **8100** (loopback-only, fronted by the host's outer reverse proxy). `project_infra_plan.md`'s "fourier 8100" target is **already the live value** — W2's port work is ratification + the deploy.sh `:8091` correction (which W1 moots), not a renumber.

### §1.5 — Image-blob storage (thread β surface — `api/services/image_storage.py`)

Two inline `Binary` blobs per image doc, sha256-deduped:
- **primary** — `blob: Binary(content)` (the W5 relocation target; `CA5` anchor `:104`).
- **thumbnail** — `thumbnail: Binary(thumb_bytes)` (AVIF, `_THUMBNAIL_MAX_DIM`-bounded), written at `:77,:79,:91`. **A second blob `C.md` now names** (invariant 18) — W5 must relocate both, not just the primary.

The `images` collection already carries the B.W3 `pinned` + `last_accessed_at` substrate (W5 builds on it; no `$nin` re-introduction). `storage_budget_gb` config + eviction were **already retired at B.W3** (`CA5` correction — `C.md §1`/§7 reflect this); W5's gate is the inline-write relocation + `storage_uri` recording, not config retirement.

## §2 — B-residual catalog (thread γ — the one precept violation)

### §2.1 — The `snapshot_hash` legacy DTO band

The B convergence collapsed five identity schemes to one `slug` **on the backend** (`snapshots.py` deleted; no `snapshot_hash` identity survives server-side — `CA1` confirmed). The frontend still **mirrors the slug into DTO fields named `snapshot_hash`** — a slug value under a legacy name. Live grep (`git grep -nE "snapshot_hash|snapshotHash" web/src`) returns **~30 hits**, broader than `CA1`'s sample. Catalogued by disposition:

**Type roots (the actual legacy names — rename targets):**
- `web/src/lib/types.ts:89,116,192` — `snapshot_hash: string` in three DTO interfaces.

**Store mirror sites (where the slug is shoved into the legacy slot):**
- `web/src/stores/gallery.ts:29` (`return e.snapshot_hash`), `:37` (`snapshot_hash: v.slug` — the mirror), `:162,:240` (comments).
- `web/src/stores/workspace.ts:26-27` (comments documenting the mirror), `:33,:364` (per `CA1`).

**Component consumers (read `.snapshot_hash` as a key/id — ~20 sites):**
- `GalleryView.vue:73,117,118,119,139,373`; `VisualizationView.vue:112`;
  `gallery/GalleryCard.vue:32,82,129,150,159,168`; `gallery/GalleryCardModal.vue:124,173,183`;
  `gallery/GalleryFeaturedCarousel.vue:29`; `gallery/GalleryGrid.vue:37`;
  `gallery/GalleryInfiniteGrid.vue:32,36`; `gallery/GalleryMarquee.vue:37,53`;
  `composables/useWorkspaceLoader.ts:24,25,26,37` (the `snapshotHash` route-param camel variant).

**Benign (already-retired references in comments/strings — leave or tidy):**
- `api.ts:24,405`; `gallery.ts:10,17`; `router/index.ts:26` — these *document the retirement*; not identity-bearing. Invariant 20's grep is "zero on identity *paths*" — these comment mentions are not violations but W4 may tidy them for a clean grep.

### §2.2 — The masking cast (`as unknown as`)

`git grep -n "as unknown as"` on the converged surface returns **exactly one** hit: `web/src/components/visualization/gallery/AdminFlaggedPanel.vue:56` — `})) as unknown as { … }`, masking the stale `FlaggedListResponse` type's truth gap. This is the invariant-20 cast to remove; `FlaggedListResponse` reconciles to the cursor envelope at W4.

### §2.3 — The 14 conformance skip-skeletons

`api/tests/conformance/` holds **14** test files (`test_{admin,etag,idempotency,identity,janitor,ownership,pagination,problem,rate_limit,sessions,slug_format,soft_delete,url_shape,visibility}.py`). **Every one** is `pytestmark = pytest.mark.skip(...)` + a lone `test_placeholder()`. Worse than inert: the skip reason reads *"conformance skeleton — implemented at B.W3"* — a claim of implementation that did not occur. `CONFORMANCE-MATRIX.md` cites these paths as evidence. **W4 fills-or-retires each honestly**: implement against the now-landed `api/lib/crud/` utilities + the `visualization` entity, or strike the row from the matrix. No skip-stub may remain cited as evidence. (`C.md` says "15"; the tree has 14 — the count corrects to **14** at Wχ harden.)

## §3 — The `--reload` compute-abort baseline finding

`scripts/dev.sh:74-76` launches the dev backend with `uvicorn … --reload --reload-dir api --reload-dir src`. uvicorn's reloader **kills and respawns the worker on any file change under the watched dirs** — including a write to `src/` mid-compute, which aborts an in-flight epicycle/Chebyshev computation. **Dev-only**: the `Dockerfile` has **no `--reload`** (prod runs without it; the production server is unaffected). W3 disposition (KISS-ordered): (a) narrow the `--reload-dir` watch to exclude the compute path, or (b) scope compute off the reloaded process, or (c) — only if a + b prove insufficient — route compute to a background task. The baseline confirms this is a *developer-ergonomics* fix, not a production correctness defect; W3 picks the smallest mechanism.

## §4 — Brittleness window §8 — ratified (provisional)

Ratified **provisional**, pending Wα-R1. `C.md §8` declares a possible W5 dual-read window for the image-blob cutover. `CA5` ranks **filesystem+nginx** first precisely because it admits an atomic per-document cutover (write file → set `storage_uri` → delete inline `blob` in one document update), which **removes the window**. The window stands declared until Wα-R1 returns its verdict; Wχ-P3 tests whether the chosen backend's cutover is genuinely atomic, and if so the window is struck at Wχ close. W1–W4 close green with no window regardless.

## §5 — Wα research dispatch (the W0 → Wα gate)

Four parallel lanes dispatched (hard ceiling 10/wave; this wave runs 4). Each lane produces a `docs/tranches/C/research/` artefact and a KISS-ordered verdict measured against this baseline. The lanes share no write bounds.

| Lane | Charter | Deliverable | Measures against |
|---|---|---|---|
| **R1 — storage backend** | Survey filesystem+nginx ⊳ GridFS ⊳ MinIO ⊳ managed-S3 against invariant 12/18. Per-backend: new-container/dependency/cost cost; the migration shape (primary **and** thumbnail); whether an atomic per-doc cutover is possible (→ §4 window). KISS-ordered verdict with per-line invariant-12 justification for any backend above filesystem. | `research/R1-storage-backend.md` + `research/R-storage-spec.md` (the chosen backend's migration + serving contract) | §1.5, §4 |
| **R2 — webhook CI/CD** | Survey the webhook-deploy shape that replaces `deploy.sh`: auth model (HMAC-signed payload? deploy token? — not SSH-key reuse, invariant 19); the rollback path (intentional-bad-commit recovery); failure modes (partial build, health-check fail); does it **truly** replace `deploy.sh` end-to-end or leave a manual remnant. | `research/R2-cicd.md` + `research/R-deploy-spec.md` | §1.1, §1.3 |
| **R3 — MongoDB TLS** | Audit the cert provenance the tree hides (where does `/etc/ssl/mongo.pem` come from; self-signed vs CA-issued; rotation; verification mode). Specify the verified-cert posture that removes all 3 §1.2 sites: client trusts a mounted CA, server requires client certs or server-only-TLS (decide), healthcheck validates. prod↔dev parity. | `research/R3-tls.md` + `research/R-tls-spec.md` | §1.2 |
| **R4 — janitor audit-log + `--reload`** | Spec the `admin_audit` row each of the 9 `delete_many` sites (`janitor.py:73,113,139,147,155,163,168,265,273`) emits (category, count, cutoff, timestamp); partial-failure recovery semantics (re-run idempotence); and the smallest `--reload` compute-abort fix per §3. | `research/R4-janitor-reload.md` | §3, janitor §2-adjacent |

**Gate**: Wα closes when all four artefacts land + a `research/README.md` index reconciles them; then Wχ (P1–P4) opens. No infra/storage/frontend source changes commit before Wχ closes (Phase 0 discipline, `C.md §4`).

## §6 — What W0 did NOT do (scope honesty)

- No source files touched (W0 is open/baseline/dispatch only; the first source change is W1, post-Wχ).
- No research verdicts pre-empted — R1's backend choice, R2's webhook shape, R3's TLS mode are **open questions** this record frames, not decides.
- The conditional thread δ (colour-consume) is not a W0 concern; it surfaces at W4 dispatch gated on a value.js publish (`coordination/COLOUR-LIFT.md`).
