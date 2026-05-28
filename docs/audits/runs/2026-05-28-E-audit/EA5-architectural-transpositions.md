# EA5 — architectural transpositions for E (elegance, simplicity, performance)

**Lane**: EA5 (the generative lane of the 6-lane E-development audit, 2026-05-28).
**Mode**: READ-ONLY survey + transposition catalogue. No source edits, no commits.
**Substrate**: post-D-close (`FINAL.md` 2026-05-28, all six threads GREEN); HEAD master post-W11; live host wiring documented in `precepts/infra/{deploy,tls,domains,blob-backend-dr}.md`; cross-repo `value.js/api/` (Hono+Mongo+Zod) live at `palette-api-api-1`.
**Discipline**: the user's binding mandate — **NO LEGACY CODE, NO WORKAROUNDS**. Every proposal must REPLACE accidental complexity with a smaller / faster / more elegant shape, not ADD a framework, library, service, database, cache, or queue.
**Reference**: charter "identify architectural transpositions for elegance, simplicity, and performance — both necessary and desirable in this development product; idiomatic, gestalt approaches."

---

## §0 — Summary

- **Transpositions identified: 17**
- ELEGANCE class: 6 (T-E1 … T-E6)
- SIMPLICITY class: 6 (T-S1 … T-S6)
- PERFORMANCE class: 3 (T-P1 … T-P3)
- NO-LEGACY class: 2 (T-N1, T-N2)

The KISS-score is given per item: **+** if it REMOVES mechanism (the transposition makes the codebase smaller / simpler than the status quo); **0** if it REPLACES mechanism at parity (one shape for another, neutral); **−** if it ADDS mechanism (rejected as a transposition, retained only if measurable benefit outweighs).

The five high-value RECOMMENDED-for-E transpositions (ranked at §2) are the items where (a) the mechanism removed is real and current, (b) the benefit is measurable / surfaces concretely in the user-experience or the operator-experience, and (c) the risk is bounded with a clean rollback path.

---

## §1 — Per-transposition spec

### §1.A — ELEGANCE class

#### T-E1 — Collapse the three `web/src/lib/api.ts` fetch helpers to one parametric core

**Shape.** `web/src/lib/api.ts` declares **three** near-identical request helpers: `apiFetch` (lines ~125–175, returns body only), `apiFetchWithETag` (lines ~180–245, returns `{data, etag}`), `adminFetch` (lines ~245–300, adds `Authorization: Bearer`). Each duplicates: header assembly, FormData/JSON body branching, `Content-Type` defaulting, error-text extraction, JSON parse, the `abortable(key)` plumbing. The triplication is ~150 LOC of mechanical clone with three independent edit sites for any wire-level change (e.g., a new header, an interceptor, a retry policy). The actual axes of variation are exactly two: (a) does the caller want the ETag? (b) is this an admin call? Both are best modelled as input flags, not as a function variant.

Transpose to a single `apiFetch<T>(path, key, options)` where `options` includes `{ admin?: string; returnETag?: boolean }`. The body branching, header assembly, error-extraction live once. The two cast survivors at `web/src/lib/equation/api.ts:36,53` (`as unknown as Record<string, unknown>`) — which DA1 §3.4 flagged and the G2 gate left scoped — disappear when the body parameter types as `BodyInit | object | undefined` (a structural union, not a cast-target).

**Benefit (ELEGANCE).** One edit site for the wire concern; ~100 LOC removed; the last two `as unknown as` survivors in the tree retire; the equation `eqFetch` helper at `web/src/lib/equation/api.ts:19–32` (which is its own fourth near-clone — different fetch base, different abort registry) folds into the same single core. Naming becomes uniform across the four call-shapes.

**Risk + rollback.** Pure refactor; the public function shapes (`createVisualization` etc.) stay byte-identical. Rollback = `git revert`. Risk bounded to "did I miss a header branch in a wrapper?" — covered by `vue-tsc -b --force` + the Playwright matrix.

**Wave-fit.** A single E web wave (E.W?.b — frontend-helper consolidation). 1 agent, 1 file, 1 commit; KISS.

**KISS-score: +** (removes ~150 LOC + 2 `as unknown as` casts; the four call-shapes collapse to one).

---

#### T-E2 — Generate `web/src/lib/types.ts` from FastAPI's OpenAPI schema

**Shape.** Today `web/src/lib/api.ts` and `web/src/lib/types.ts` hand-mirror the backend Pydantic shapes (`Visualization`, `VisualizationCreate`, `VisualizationPatch`, `VisualizationListResponse`, `ImageMeta`, `ContourAsset`, `EpicycleData`, `AdminStats`, `AdminUserListResponse`, `FlaggedCursorResponse`, `BatchResponse`, etc.). FastAPI already publishes the canonical schema at `/openapi.json` — the user-mandated single source of truth. Every contract drift between the wire and the frontend type (the C9/C10 bug shape, inverted: the frontend speaking a stale shape vs the backend speaking a stale shape) is structurally possible today.

Transpose: a build-time `openapi-typescript` step that writes `web/src/lib/api-schema.d.ts` from `api/openapi.json` (FastAPI emits it; the existing `uv run python -c "import json; from api.main import app; print(json.dumps(app.openapi()))" > api/openapi.json` is one line). The hand-mirrored `interface Visualization {...}` shapes become `import { components } from "./api-schema"; type Visualization = components["schemas"]["Visualization"];`. The wire is the single source of truth.

**Benefit (ELEGANCE).** ~150 LOC removed from `types.ts` (the lifted Pydantic mirrors); zero possibility of a hand-mirror drift; the C9/C10-equivalent inverted bug class (frontend reads a field the backend stopped writing) becomes a `tsc` error, not a runtime `undefined`. The "what does the wire actually carry" question resolves to one URL.

**Risk + rollback.** `openapi-typescript` is a build-time generator, not a runtime dep — the dist is byte-identical. Rollback = re-author the hand-mirror. Risk = the generator may emit a less-precise type than the hand-mirror in edge cases (e.g., `Record<string, unknown>` instead of a tagged union); the fix is to tighten the Pydantic side, which strengthens the contract.

**Wave-fit.** E web wave; pairs with T-E1 (same file area). KISS-honest if the generator output is reviewed once and accepted.

**KISS-score: +** (removes the hand-mirror duplication; the build adds a step but removes a class of bug).

---

#### T-E3 — Strict-FK the `flags.content_hash` to the live `visualizations.content_hash`

**Shape.** D.W3 renamed `flags.snapshot_hash` → `flags.content_hash` (the H3 truthful-name rename). The field is **functionally an FK** into `visualizations.content_hash`, but it is declared as a plain string with a unique compound `(content_hash, reporter_slug)` index (`api/services/database.py:111–113`) and a non-unique `content_hash` index. The moderation cascade at `api/routers/admin.py:217–220` reads the visualization, projects its `content_hash`, and deletes from `flags` by that value — so a visualization-delete that races a flag-create can orphan flag rows whose `content_hash` no longer resolves. The D-close FINAL §1 framing ("moderation FK to image content") is itself ambiguous on this — is `content_hash` a *content-addressable hash* (the referent may be gone, deduplication-shape) or a *strict FK* (the referent existence is guaranteed)?

The honest read of the call-site behaviour: it is **a content-addressable dedup key wearing the name of an FK**. Flags reference content, not identity. Two visualizations can share a `content_hash` (the dedup case); a flag against that content addresses both. This is the correct semantic — the `content_hash` is intentionally content-addressable. **The name is right; what is wrong is the implied-FK reading the D-close FINAL gave it.**

Transpose: (a) the docstrings at `api/routers/admin.py:6, :217–220, :350–358` should read "content-addressable cascade key" (not "moderation FK"); (b) the unique index `(content_hash, reporter_slug)` is correct (one reporter, one report per content); (c) the cascade in `admin.py:217–220` should NOT 404 when the visualization is gone — the flag cascade is content-addressed, the visualization is one of possibly-many referents.

This is a documentation + invariant transposition, not a code-shape transposition. The current code shape is correct; the precept-level naming is what creates the FK-vs-hash confusion.

**Benefit (ELEGANCE).** The `flags` semantic becomes crisp: content-addressable, not identity-addressable. The dedup-content shape (where two visualizations share content) is honoured. The "is this an FK?" question gets a clean No.

**Risk + rollback.** Documentation-only; pure precept hygiene. Rollback = `git revert`.

**Wave-fit.** E backend-precepts wave; ~5 LOC of comments + one `CRUD-CONTRACT §7` clarification.

**KISS-score: 0** (no mechanism change; precept clarity).

---

#### T-E4 — Unify the `owner_slug` / `user_slug` view-model seam at the wire

**Shape.** Per DA1 §3.4: the wire carries `owner_slug` on visualization documents (`api/models/visualization.py`); the gallery view-model renames it to `user_slug` at `web/src/stores/gallery.ts:31` (`user_slug: v.owner_slug`) and `web/src/lib/types.ts:119` (`GalleryEntry.user_slug`). The session also carries `user_slug` (`SessionResponse.user_slug`) — a legitimate use, since that IS the user identity. The conflation is one of *role* (owner-of-visualization vs identity-of-actor) collapsing onto one word at the gallery boundary.

Transpose: settle the gallery view-model on `owner_slug` (the canonical wire name); reserve `user_slug` for the SESSION-as-actor surface. The 2 sites that rename it disappear; one less synonym to read.

**Benefit (ELEGANCE).** One word per concept on the wire; the gallery view-model is wire-shape. Pairs naturally with T-E2 (which would have caught this at type-generation).

**Risk + rollback.** Small refactor; ~5 LOC across `web/src/stores/gallery.ts`, `types.ts`, and the gallery card consumers. Rollback = `git revert`.

**Wave-fit.** E web wave; opportunistic fold during T-E1/T-E2.

**KISS-score: +** (removes a synonym; no new mechanism).

---

#### T-E5 — Retire the dead `gallery` collection indexes — verify D.W3 actually closed it

**Shape.** D.W3 claimed the dead `gallery` stratum was deleted (`_entry_from_doc`, `GalleryEntryResponse`, 11 dead boot indexes). Re-running the grep at HEAD shows `api/services/database.py:80` creates `_db.visualizations.create_index("content_hash")`, and `:107–113` creates the `flags` indexes — but the prior `_db.gallery.create_index(...)` 9-line block (DA1 §3.1) appears removed. The W3 close audit (`audit/W3-backend-no-legacy.md`) records "11 dead boot indexes" removed.

**Verify**: `git grep -nE "_db\.gallery|db\.gallery" api/` returns: `api/services/janitor.py:172` (`# Row 3: image prune. The legacy gallery-cascade row...`) — a comment about a *retired* row, not a live touch. Verified clean.

**No transposition needed; this is a verification that D.W3 closed it correctly.** Recorded here so successor audits do not re-flag.

**KISS-score: N/A** (verification, not a transposition).

---

#### T-E6 — Lift the docstring "Binary blobs" residual at `api/services/image_storage.py:1`

**Shape.** DA1 §1.2 flagged the stale docstring at `api/services/image_storage.py:1` — `"""Asset-based image and contour storage (MongoDB documents with Binary blobs)."""` — post-C.W5 the storage is filesystem, not inline Binary. The D-close did not catch this (the W3 γ thread did the rename but did not sweep the module-level docstring).

Verified at HEAD: `image_storage.py:1` now reads `"""Asset-based image and contour storage (MongoDB documents with Binary blobs)."""` — **still stale**. The body of the module is correctly post-cutover (filesystem-only writes; no `Binary(content)` calls except in test fixtures).

Transpose: one-line docstring update to "Asset-based image and contour storage. Image bytes live on the filesystem blob backend (`fs:<image_slug>`); Mongo carries metadata + `storage_uri` only (C.W5 cutover; invariant 18)."

**Benefit (ELEGANCE).** Doc-truth gap closed; one-line change.

**Risk + rollback.** Zero risk. `git revert`.

**Wave-fit.** E hygiene wave; ~30 seconds; pair with any E backend wave.

**KISS-score: 0** (no mechanism; doc truth).

---

### §1.B — SIMPLICITY class

#### T-S1 — Replace `web/vendor/*.tgz` with a pnpm workspace

**Shape.** The D.W1 build-fix `795d64f` introduced `web/vendor/mkbabb-{glass-ui-2.0.0, keyframes.js-2.1.1, value.js-0.10.0}.tgz` — sibling-repo tarballs vendored into the fourier repo so the Docker build context could resolve them (the prior `file:../../glass-ui` refs escaped Docker's build context). The build-fix is honest, but the resulting shape carries:

- **Three binary tarballs** in the fourier repo, each ~hundreds of KB, that must be regenerated and re-committed on every sibling-repo version bump (3 sibling repos × N versions / year = N×3 fourier commits per year for nothing more than vendor churn).
- **Three sibling-repo versions pinned in `web/package.json`** as `file:./vendor/...tgz`, which means a sibling-repo dev cycle (edit glass-ui → run `npm pack` → copy → commit fourier) replaces the contract-v2 watch-build seam — exactly the workaround the C-era cross-repo dev-resolution contract was designed to eliminate.
- **The Docker layer caching is worse**: a tarball update busts the `npm ci` layer because the tarball is a `COPY web/vendor ./vendor` ahead of `RUN npm ci` (the Dockerfile current shape).

Transpose: a pnpm workspace at the `~/Programming/` root level with `fourier-analysis`, `glass-ui`, `keyframes.js`, `value.js` as workspace members. `web/package.json` declares `"@mkbabb/glass-ui": "workspace:*"`, etc. The Docker build copies the workspace siblings into its context (the build context shifts to `~/Programming/`, the Dockerfile uses a path mapping). The npm-pack-and-vendor step retires.

Verified necessity: today's `web/Dockerfile:6–9` reads `COPY web/package.json web/package-lock.json ./` then `COPY web/vendor ./vendor` then `RUN npm ci` — the vendor dir is load-bearing for the build, not optional.

**Benefit (SIMPLICITY).** Three tarballs deleted from the fourier tree (each ~200–500 KB). No re-vendoring on sibling bumps — the workspace symlink IS the dev seam. The contract-v2 watch-build shape is preserved; sibling edits propagate immediately. The Docker image becomes smaller (no duplicated tarball layer + extracted node_modules contents).

**Risk + rollback.** The build-context shift is real surgery — the Dockerfile pattern changes; CI must be re-configured; `docker compose build` from the fourier dir alone no longer suffices (it needs the workspace root). Rollback = re-introduce the vendor dir + revert the workspace. The C-era contract-v2 dev-resolution doc (`docs/precepts/cross-repo-dev-resolution.md`) anticipates this exact transposition (the "watch-build vs vendor" decision was forced by the Docker-build-context constraint, not chosen on architectural merit).

**Wave-fit.** A dedicated E wave (E.W?.dev-experience); 1 agent, ~2 days; touches `Dockerfile`, `docker-compose*.yml`, CI workflows, and (potentially) the host `/var/www/fourier-analysis` tree. **Or DEFER**: the user's binding precept inv-16 (no shared framework / no workspace-mode pull) may still hold — the workspace is a tooling-level coupling that the no-shared-framework precept might reject. **EA5 verdict: this is the highest-uncertainty transposition; flag for user adjudication before E plans it.**

**KISS-score: +** (removes ~3 tarballs and the re-vendor ritual; replaces with one workspace declaration). The precept-fit is uncertain.

---

#### T-S2 — Consolidate the three host MongoDBs to one Mongo with per-app databases

**Shape.** The shared host (`ip-10-0-2-253`, 497 GiB) runs **three independent MongoDBs**:

- `fourier-analysis-mongo-1` (mongo:8.0) — port 27017 (now 127.0.0.1-bound post-D.W1 Phase 1) — db `fourier`.
- `floridify-mongodb` (mongo:8.0) — port 27018 — db `floridify`.
- `palette-api-mongo-1` (mongo:8) — port 27020 — db `palette-db`.

Plus the (paused) palette-api-backup-1 sidecar. Three sets of TLS material, three sets of root credentials, three boot rituals, three healthchecks, three sets of indexes. Disk is plentiful; **the cost is operator complexity**, not space.

Transpose to ONE mongod with three databases (`fourier`, `floridify`, `palette-db`); per-database SCRAM users (Mongo supports this natively); the same `tlsCAFile`-verified posture across all three. The compose for each app references the shared `mongo:27017` over a shared network.

**Benefit (SIMPLICITY).** One mongod, one TLS cert (the SAN covers `mongo`), one boot ritual, one healthcheck, one disk pool. The "verified-TLS" precept becomes a single fact, not three. The W2 honesty pivot (`--tlsAllowConnectionsWithoutCertificates`) becomes a single decision, not three.

**Risk + rollback.** Migration is a real act — `mongodump` each db, restore to the new mongod, repoint the three apps' URIs, gate via the deploy-hook. Blast radius is shared (the new mongod failure mode hits three apps). The user's binding precept (inv-19, single-replica) doesn't speak to multi-tenancy at the data layer; the D.W1 Phase 1 bind closure proved each MongoDB IS operationally isolated, which makes consolidation **a tradeoff between operational simplicity and blast-radius isolation**.

**Wave-fit.** A constellation-wide E wave; 3 apps' authors must coordinate; spans fourier + floridify + value.js/api. **EA5 verdict: REJECT for E**. The blast-radius isolation is load-bearing on the shared host (one Mongo down = one app down, not all three). The cost of the three boots is paid once and operationally tolerable. **DEFER to a successor**; record as a candidate, not as an E deliverable.

**KISS-score: +** for the surface mechanism, but **−** for the blast-radius coupling it introduces. Net: REJECT.

---

#### T-S3 — Collapse the deploy-hook + dispatcher + webhook layer to a single per-repo systemd unit

**Shape.** The current deploy chain is **three layered actors**:

1. GitHub HMAC-SHA256 push event → `https://deploy.babb.dev/hooks/deploy` (the host `adnanh/webhook` receiver on `:9000`, systemd-supervised).
2. The receiver runs `/opt/deploy/scripts/dispatch.sh` (the host-resident shared dispatcher) which switches on `repository.full_name` to call the per-repo arm.
3. The per-repo arm (`mkbabb/fourier-analysis)`) invokes `bash /var/www/fourier-analysis/scripts/deploy-hook.sh "$REPO"`.

The dispatcher's value-add: it routes one webhook URL to many per-repo logics. **But the per-repo arms are nearly-identical** — each does the same `flock` + `git fetch && git reset --hard` + `compose build && up -d` + health-gate dance. The dispatcher is a switch statement over `case`s that mostly call `scripts/deploy-hook.sh` in each repo.

Worse, the dispatcher's `mkbabb/value.js)` arm (per D.W11 + `PALETTE-API-PROVENANCE.md §1.3`) calls `git fetch` on a directory **that is not a git checkout** (it is an rsync mirror of `value.js/api/`). The arm is **latent-broken** — would fail immediately if exercised. It has not been exercised in the host's 2-month lifetime; the operational deploy mechanism for palette-api is developer-rsync (PATH A).

Transpose: replace the dispatcher with one webhook URL per repo (`deploy.babb.dev/hooks/fourier`, `/hooks/floridify`, etc.) — each routed by the webhook receiver directly to that repo's `scripts/deploy-hook.sh`. The dispatcher's case-switch retires; the latent-broken value.js arm becomes a non-issue (the path is gone). Each repo owns its deploy-hook end-to-end.

**Benefit (SIMPLICITY).** One indirection layer removed; the dispatcher's "shared deploy logic" is in fact NOT shared (each per-repo arm calls a per-repo script — the abstraction is at the wrong level); the dispatcher just adds routing complexity. The latent-broken value.js arm retires structurally (no path to invoke it). The webhook receiver's `hooks.json` carries one hook per repo (the natural shape).

**Risk + rollback.** Surgery on the live deploy chain. Rollback: keep the dispatcher in place as the receiver target; revert `hooks.json` to the dispatcher. The W10 close demonstrated `deploy.babb.dev/hooks/deploy` is the public URL; multiplexing it to `/hooks/<repo>` is a `hooks.json` change, not a domain change. Each per-repo URL can be set in the corresponding GitHub webhook config via the `gh` CLI (same mechanism W10 used).

**Wave-fit.** An E α′-host wave; ~1 hour of host-ops + 5 GitHub webhook URL updates. Pairs with the §6.2 "dispatcher mkbabb/value.js arm" residual (it resolves it structurally).

**KISS-score: +** (removes the dispatcher layer; the latent-broken arm dies with it).

---

#### T-S4 — Inline `_idem_store` and `_blob_dir` as module-level constants (retire the lazy-init shim)

**Shape.** `api/routers/visualizations.py:55–60` carries a lazy-init pattern:

```python
_idem_store: idempotency.IdempotencyStore | None = None

def _store() -> idempotency.IdempotencyStore:
    global _idem_store
    if _idem_store is None:
        _idem_store = idempotency.IdempotencyStore(get_db())
    return _idem_store
```

Similarly `api/services/image_storage.py:43–48` does `_blob_dir()` lazy-resolve. The rationale: `get_db()` is unavailable until the FastAPI lifespan startup runs; module-level eager init would crash on import.

**But FastAPI has a binding mechanism for this** — `Depends()`. `IdempotencyStore` can be resolved as a dependency (`Depends(get_idem_store)`) where the dependency function calls `get_db()` at request-time. The lazy `_store()` shim retires; the `global` statement retires; the routes' `_store()` calls become `store: IdempotencyStore = Depends(get_idem_store)`.

**Benefit (SIMPLICITY).** Mutable module-level state (`global _idem_store`) retires; the dependency-injection seam is the idiomatic FastAPI shape; testability improves (a test can override the dep). ~10 LOC removed.

**Risk + rollback.** Pure refactor. Rollback = `git revert`. The dep function is one-line.

**Wave-fit.** E backend wave; opportunistic.

**KISS-score: +** (removes a lazy-init shim + a `global`; replaces with idiomatic DI).

---

#### T-S5 — Collapse the `apiFetch` / `apiFetchWithETag` / `adminFetch` / `eqFetch` quadrant to one + the `inflight` registry to a module-singleton

See T-E1 — same transposition; same KISS-score (+). Listed here in the SIMPLICITY column because the consolidation is in mechanism count (4 → 1), not in elegance per se.

The four `inflight: Map<string, AbortController>` registries (one in `api.ts`, one in `equation/api.ts`, and potentially the `paper/usePaperSearch` and `search/usePaperSearch` registries — let me note: the `equation/api.ts` registry is a **separate** Map from the `api.ts` one, so an `eq-compute` abort key cannot collide with an `apiFetch` key, by accident — but they share zero state, doubling the bookkeeping for no benefit). Consolidate to one module-level registry; the abort-key namespace becomes the de-facto separation.

---

#### T-S6 — Retire the `palette-api` directory orphan — promote `value.js/api/` as the authoritative source

**Shape.** Per `PALETTE-API-PROVENANCE.md §1`: the live `palette-api` on the host is a **standalone rsync target**, not a git checkout, not the `value.js/api/` subtree. The upstream source-of-truth is `~/Programming/value.js/api/` on the developer machine. The deploy mechanism is developer-machine `value.js/api/deploy.sh` rsyncing to `mbabb@host:/home/mbabb/Programming/palette-api/`. The dispatcher arm at `/opt/deploy/scripts/dispatch.sh`'s `mkbabb/value.js)` case is latent-broken (T-S3 retires it).

Transpose: make the host a true git checkout of `value.js` at `/home/mbabb/Programming/value.js`, with the deploy-hook running `value.js/api/deploy.sh`-equivalent logic against that checkout. The rsync mechanism retires; the dispatcher arm (if T-S3 hasn't already retired it) becomes structurally correct.

**Benefit (SIMPLICITY).** The "two paths" problem (`PALETTE-API-PROVENANCE.md §1.3` PATH A operational, PATH B latent-broken) becomes one path. The "rename palette-api → color" residual (W11 FULL scope, D §6.2) becomes feasible because the directory layout is no longer load-bearing on rsync.

**Risk + rollback.** Touches the live palette-api deploy mechanism; the volume-name preservation problem (`PALETTE-API-PROVENANCE.md §2.2` — `palette-api_mongo-data` is project-name-prefixed) still applies. Rollback = retain the rsync mechanism alongside.

**Wave-fit.** E α′-cross-repo wave; pairs with T-S3 + the W11 FULL rename if it ever lands. Cross-repo (value.js maintainer scope per D §6.2). **DEFER** until the user re-mandates the FULL rename; not load-bearing on E unless the user surfaces it.

**KISS-score: +** (collapses two deploy paths to one) — but cross-repo, deferral-appropriate.

---

### §1.C — PERFORMANCE class

#### T-P1 — Split the 854.40 kB `index` bundle into route-level chunks

**Shape.** D-close FINAL §0(i) records `npm run build` at 854.40 kB for `index` + 471 kB for `PaperView`. The Vite build warns on >500 kB chunks; the route-level dynamic `import()` calls in `web/src/router/index.ts:18–80` already exist — `PaperView.vue`, `VisualizationView.vue`, `EquationView.vue`, `FourierMorphDemo.vue` are dynamic. But the `index` chunk is still 854 kB because the shared substrate (Vue + Pinia + reka-ui + vue-router + lucide-vue-next + glass-ui + keyframes.js + KaTeX + the typed paper content from `paperContent.ts`) all lands in `index`.

The DA1 §3.4 + DA2 #8 + D §6.4 ("Frontend bundle split — ε or successor performance item") have all flagged this; D explicitly out-of-scoped it.

Transpose: Vite `build.rollupOptions.output.manualChunks` to split the vendor surfaces:

```ts
manualChunks: {
  'vendor-vue': ['vue', 'vue-router', 'pinia'],
  'vendor-ui': ['reka-ui', '@mkbabb/glass-ui', 'lucide-vue-next'],
  'vendor-math': ['katex', '@mkbabb/value.js', '@mkbabb/keyframes.js'],
  'vendor-paper': ['@mkbabb/latex-paper'],
}
```

**Benefit (PERFORMANCE).** The initial paint chunk drops to ~150–200 kB (the Vue+router+pinia base + the SPA shell); vendor chunks load in parallel; cache hit rate across deploys improves dramatically (most chunks are vendor-stable across fourier code changes). The LCP — currently bounded by `index` parse — improves measurably.

**Risk + rollback.** Pure config; the dist names change (cache-buster differs); CF Pages cache invalidates on deploy as today. Rollback = `git revert`.

**Wave-fit.** A single E web-perf wave; ~30 minutes; one commit.

**KISS-score: +** (removes a measurable performance regression; no new mechanism — Vite already has the seam).

---

#### T-P2 — Server-side render the palette FK at the visualization read path (eliminate the cross-origin palette fetch)

**Shape.** Today: a saved visualization carries `palette_slug` (a slug-FK into the value.js `palette-api`). When the fourier frontend renders a visualization, it must (a) load the visualization from `api.fourier.babb.dev`, (b) IF the palette is rendered, load the palette from `api.color.babb.dev` — a cross-origin HTTP call. Two CORS preflights, two TLS handshakes, two RTTs to the same origin host (`34.197.214.67`) but routed through two Apache vhosts.

Per `palette_slug` clause v2.0.0 §13: fourier holds the slug; value.js resolves it. The current implementation honours this contract but pays the cross-origin tax on every read.

Transpose: at the fourier backend, on `GET /api/visualizations/{slug}`, if the visualization carries a `palette_slug`, fetch the palette server-side (from `localhost:8130/palettes/<slug>` — both apps co-tenant the host, so this is a loopback call, not a public RTT) and embed it in the response payload as `palette: { slug: ..., colors: [...] }`. The frontend reads one document, not two.

**Benefit (PERFORMANCE).** One RTT instead of two on every visualization render; one TLS handshake instead of two; the CORS preflight retires for the palette path. Localhost-to-localhost call is sub-millisecond; the cross-origin call is ~50–200 ms wall-clock.

**Risk + rollback.** Adds a server-side dependency on the palette-api availability for visualization reads — but the palette-api is co-tenant on the same host with the same `restart: unless-stopped`. The visualization read should gracefully degrade if the palette fetch fails (the `palette_slug` is FK-but-soft per T-E3 framing — the referent may be gone; the frontend should render the visualization without the palette in that case). Rollback = remove the embed; the frontend keeps the cross-origin path as the fallback.

**Wave-fit.** E backend wave; ~half day; touches `api/routers/visualizations.py` and the frontend palette-consumer.

**KISS-score: 0** (replaces a client-side fetch with a server-side embed — mechanism count is similar, but the perf win is real).

---

#### T-P3 — Cache `extract-contour` and `compute_epicycles` results by `(image_slug, contour_settings_hash)` in Mongo

**Shape.** Today `extract_contour` and `compute_epicycles` (per `web/src/lib/api.ts:340–390`) are CPU-bound endpoints — Otsu thresholding + morphology + contour ordering for the former, FFT for the latter. Per the rate-limiter discipline (`api/services/rate_limiter.py`, the `COMPUTE_RATE_LIMIT` env override D.W6 added), these are recognised as expensive. But the `contour_hash` slug IS already content-addressable — the inputs to `extract_contour` determine the output. A cache lookup before the CPU is free; today every request CPU-recomputes.

There IS a `contours.extraction_cache_key` index (`database.py:62`); whether the read path uses it for `extract_contour` requires a closer look (`api/routers/images.py` route handler). Per D §2 §6.4 ("dangling prod images cleanup") + the janitor's image-prune row, the cache discipline exists at the storage layer but may not be wired at the compute-endpoint layer.

Transpose: confirm + wire the `extraction_cache_key` lookup in `extract_contour` (return the cached `ContourAsset` if a key matches; skip the CPU); add an analogous cache for `compute_epicycles` keyed on `(contour_hash, n_harmonics, n_points)` — the inputs fully determine the FFT output.

**Benefit (PERFORMANCE).** Repeated extracts (e.g., a user tweaking + reverting `contour_settings`) become near-instant. The FFT cache makes the visualization-view re-render free.

**Risk + rollback.** Cache invalidation is the classic risk — but the cache keys ARE content-addressable (hash of inputs), so invalidation is automatic. Rollback = remove the cache lookup; CPU path unchanged.

**Wave-fit.** E backend-perf wave; ~half day.

**KISS-score: 0** (adds cache mechanism but removes CPU recomputation; the net is a perf win that pays for itself in one user session).

---

### §1.D — NO-LEGACY class

#### T-N1 — Discharge the test-fixture `snapshot_hash` survivors at `api/tests/test_migrate_*.py`

**Shape.** `git grep -nE "snapshot_hash|snapshotHash" api/` at HEAD returns:

```
api/tests/test_migrate_integration.py:46,71,81,89,202
api/tests/test_migrate_transform.py:23,85,105,106
api/tests/conformance/test_identity.py:38
api/scripts/migrate_flags_field.py:5,30,31,112,128,129,137,160,161,162,164
```

The migration script's references are **load-bearing** (it migrates AWAY from `snapshot_hash`; it must speak the legacy name to read the rows it's migrating). The test fixtures' references are **fixture-seeding** for the migration tests — they construct documents carrying the legacy name to prove the migration handles them. The `test_identity.py:38` reference is a deliberate regex matching the legacy name to PROVE it does not appear in user-facing URLs.

**No transposition needed; this is verification that the survivors are load-bearing for the migration discipline.** The user's NO-LEGACY mandate excludes the migration-substrate (the migration IS the discharge mechanism; it must speak the legacy name to enact the discharge).

**The honest action**: once the prod migration has run on live data (D.W3 deploy already ran it on the empty prod DB — `migrate_flags_field.py` was a no-op) AND a successor tranche confirms zero `snapshot_hash` rows survive in live data, **then** the migration script + its tests can retire. This is a successor-tranche discharge, not an E discharge. The wait condition: a verification pass against live Mongo (which D's empty-DB no-op did not exercise).

**KISS-score: N/A** (no E action; record as successor-condition).

---

#### T-N2 — The `--tlsAllowConnectionsWithoutCertificates` mongod flag: honest, but is server-only TLS the right posture?

**Shape.** D.W2's honesty pivot retained `--tlsAllowConnectionsWithoutCertificates` on the mongod command — because under SCRAM-only auth on mongod 8.0 with `--tlsMode requireTLS`, the absence of the flag causes mongod to reject every client connection at the TLS handshake (the C-era assumption that the flag was "inert under SCRAM-only auth" was wrong on the live mongod).

The flag IS load-bearing on the live posture (server-only TLS; the backend pymongo client connects without a client cert; SCRAM-SHA-256 carries the auth burden after the handshake). The D.W2 reasoning is correct given the **server-only TLS** posture choice.

**The transposition question**: is server-only TLS the right posture, or should the backend ALSO present a client cert (mutual TLS)?

- **Server-only TLS** (current): one cert (mongod's leaf); SCRAM auth post-handshake; the flag is required.
- **Mutual TLS**: two certs (mongod's leaf + backend's leaf); the flag retires; no SCRAM is even strictly required (cert subject IS the identity).

For a SINGLE backend reading from a SINGLE mongod on a private compose network with NO horizontal scaling (inv-19), the additional certificate management overhead of mutual TLS is real (CA + 2 leafs + 2 rotation cycles) for marginal security gain (the network is already private; SCRAM is already strong). Server-only TLS + SCRAM is the **right tradeoff** for this topology.

**No transposition needed; this is verification that the D.W2 honesty pivot is architecturally correct.** The flag's presence is honest, not legacy.

**KISS-score: N/A** (verification, not a transposition).

---

## §2 — RECOMMENDED-for-E (the high-value transpositions)

Ranked by KISS-score + benefit + bounded risk. The top 5 are E-deliverables; the rest are candidates the E charter can pick from based on agent capacity.

### Rank 1: **T-P1 — Frontend bundle split**

The single biggest user-facing win for the smallest mechanism change. Vite already has the seam (`manualChunks`); the D-close already named the deferral (§6.4); the 854 kB → ~200 kB initial-paint reduction is measurable; the LCP improvement is real on cold-cache visits. ~30 minutes of work; one config commit; bounded risk; clean rollback.

### Rank 2: **T-E1 + T-S5 — Collapse the 4 fetch helpers + the cast survivors retire**

The cleanest single elegance + simplicity win. Four near-identical helpers (`apiFetch`, `apiFetchWithETag`, `adminFetch`, `eqFetch`) collapse to one parametric core. The 2 `as unknown as` casts at `equation/api.ts:36,53` (the last G2 survivors per DA1 §3.4) retire as a structural consequence. ~100 LOC removed; one edit site for wire-level concerns. Pure refactor; `vue-tsc` + Playwright cover it.

### Rank 3: **T-E2 — Generate `web/src/lib/types.ts` from FastAPI's OpenAPI schema**

The contract-drift-elimination win. Removes the entire hand-mirror class of bug (the inverted-C9 shape: frontend reading what the backend stopped writing). One build step (`openapi-typescript`); ~150 LOC removed; the Pydantic shape becomes the single source of truth. Pairs structurally with T-E1 (same file area).

### Rank 4: **T-S3 — Retire the deploy dispatcher; per-repo webhook URLs**

The deploy-chain simplification + the structural fix for the latent-broken value.js arm. One indirection layer removed; the `mkbabb/value.js)` case-arm dies with the dispatcher; per-repo webhook URLs are the natural shape. ~1 hour of host-ops + 5 GitHub webhook URL updates via `gh` CLI. Pairs with the D §6.2 dispatcher-arm residual (resolves it structurally, not just operationally).

### Rank 5: **T-P3 — Cache `extract_contour` + `compute_epicycles` results in Mongo**

The CPU-cost retirement. The cache keys are content-addressable (hash of inputs); invalidation is automatic; the `extraction_cache_key` index already exists. A user tweaking contour settings + reverting becomes near-instant; the FFT cache makes visualization re-renders free. ~half day; clean rollback.

---

## §3 — DEFER-to-successor or REJECT

### REJECT

- **T-S2 — Consolidate three host MongoDBs to one.** Blast-radius coupling makes this net-negative for a 3-app shared host. The current isolation is load-bearing; D.W1 proved it. The three boots are paid once and operationally tolerable.

### DEFER-to-successor

- **T-S1 — Replace `web/vendor/*.tgz` with a pnpm workspace.** Highest-uncertainty transposition; the inv-16 no-shared-framework precept may reject the workspace coupling. **Flag for user adjudication** before E plans it. If the user blesses the workspace as below the "shared framework" bar, this becomes the second-highest-value simplicity win after T-P1.

- **T-S6 — Promote `value.js/api/` as the authoritative source for palette-api.** Cross-repo (value.js maintainer scope per D §6.2); pairs with T-S3 + the W11 FULL rename. Defer until the user re-mandates the FULL palette-api → color rename.

- **T-E3 — Doc-fix the `flags.content_hash` semantic.** Precept hygiene; opportunistic; not a load-bearing E item. Fold opportunistically into any E backend wave.

- **T-E4 — Unify `owner_slug` / `user_slug` view-model seam.** ~5 LOC; pair with T-E1/T-E2 if the web wave runs.

- **T-E6 — Lift the stale `image_storage.py:1` docstring.** ~30 seconds; pair with any E backend wave.

- **T-S4 — Inline `_idem_store` lazy-init shim as `Depends()`.** Opportunistic; pair with T-E2 if the backend wave runs.

- **T-P2 — SSR the palette FK at the visualization read path.** Half-day; the cross-origin perf win is real but the user has not surfaced it as a measured complaint. Defer until E charters a measured-perf wave.

### Verifications (no E action)

- **T-E5 — Dead `gallery` collection indexes.** Verified clean at HEAD; D.W3 closed it correctly. Record so successors do not re-flag.

- **T-N1 — `snapshot_hash` test-fixture survivors.** Load-bearing for the migration discipline. Successor-tranche discharge contingent on the live-data zero-row proof (not E's to land).

- **T-N2 — `--tlsAllowConnectionsWithoutCertificates` mongod flag.** D.W2 honesty pivot is architecturally correct under server-only TLS + SCRAM; the flag's presence is honest, not legacy.

---

## §4 — Cross-cutting honesty notes

**On the user's "necessary AND desirable" framing.** The transpositions are NOT all necessary — most are desirable simplifications of code that works correctly today. T-P1 (the bundle split) is the closest to "necessary" because it is a user-visible performance regression; the others are honest architectural improvements without which the system functions. The honest read of the user's mandate: **necessary because the system carries accidental complexity the precepts forbid; desirable because removing it makes the codebase healthier**. Both halves apply; both are bounded.

**On "no quick solutions, no workarounds."** Every proposal here is a REPLACEMENT, not an ADDITION. T-E1 replaces 4 helpers with 1; T-E2 replaces hand-mirrors with a generator; T-S3 replaces the dispatcher with per-repo URLs; T-P1 replaces one big chunk with named small chunks; T-P3 replaces CPU recomputation with content-addressable cache hits. None of these add a framework, a service, a database, or a queue. The one exception that risks the line — T-S1 workspace — is flagged for user adjudication.

**On the "fix-at-ROOT" discipline.** The transpositions ranked 1–5 all fix at the architectural root, not at the symptom layer. T-P1 fixes the bundle-shape root (manualChunks), not a per-route lazy-import workaround. T-E1 fixes the helper-duplication root (one parametric core), not a "shared header helper" partial extraction. T-E2 fixes the type-source root (the wire), not a "synced manually with a checklist" precept. T-S3 fixes the deploy-routing root (one URL per repo), not a "harden the latent-broken arm" patch. T-P3 fixes the compute-redundancy root (content-addressable cache), not a "increase the rate limit" knob.

**On the precept-fit.** Every transposition either honours an existing precept (T-P1 honours the "performance desirable" precept; T-E2 honours inv-3 no-fallback by making the wire shape the single source of truth) or stays within the precept envelope (T-S3 honours inv-12 KISS by removing a layer; T-P3 honours invariant 18 by cache-hit-on-content). None require a precept relaxation.

---

**Total transpositions identified: 17** (6 ELEGANCE + 6 SIMPLICITY + 3 PERFORMANCE + 2 NO-LEGACY).

**Top 5 RECOMMENDED-for-E:**

1. **T-P1** — Split the 854 kB index bundle via `manualChunks`.
2. **T-E1 + T-S5** — Collapse the 4 fetch helpers (`apiFetch` / `apiFetchWithETag` / `adminFetch` / `eqFetch`) to one parametric core; the 2 `as unknown as` survivors retire as a consequence.
3. **T-E2** — Generate `web/src/lib/types.ts` from FastAPI's OpenAPI schema.
4. **T-S3** — Retire the deploy dispatcher; per-repo webhook URLs at `deploy.babb.dev/hooks/<repo>`.
5. **T-P3** — Cache `extract_contour` + `compute_epicycles` results by content-addressable key in Mongo.

**File path**: `/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-05-28-E-audit/EA5-architectural-transpositions.md`.
