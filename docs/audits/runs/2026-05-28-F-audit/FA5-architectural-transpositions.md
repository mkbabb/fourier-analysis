# FA5 — Architectural transpositions for F

**Lane**: FA5 of the 6-lane F-development workflow `wnjru1x3a`.
**Subject**: F-suitable architectural transpositions — elegance / simplicity / performance / NO-legacy. Default to ADD — reject any transposition that secretly adds complexity disguised as elegance.

## §1 — The transposition list

| ID | Name | Class | Subject | KISS-score | Wave-fit | Verdict |
|---|---|---|---|---|---|---|
| **F-T-S1** | compute_cache parametric collapse + `compute_bases` wiring | simplicity | `api/services/compute_cache.py` + `api/routers/contours.py:36-67` | REDUCE | F.W2 | **RECOMMENDED** |
| **F-T-N1** | Drop legacy `status` field from `FormattedPalette` | NO-legacy | `value.js/api/src/format/palette.ts:29,81` + 4 demo call-sites | REDUCE | F.W7 (cross-repo) | **RECOMMENDED** |
| **F-T-E1** | Auto-discover `migrate_*.py` (drop MIGRATIONS list) | elegance | `api/scripts/run_pending_migrations.py:56-60` | REDUCE | F.W7 | **RECOMMENDED** |
| **F-T-S2** | Inline `apiFetchWithETag` / `adminFetch` at single call-sites; expose only `coreFetch` + thin `apiFetch` | simplicity | `web/src/lib/api.ts:285-309` | EQUAL → REDUCE | F.W7 | **RECOMMENDED-CAUTIOUS** |
| **F-T-S3** | Execute `update-webhook-urls.sh --apply` + delete `/opt/deploy/scripts/dispatch.sh` | NO-legacy | `scripts/update-webhook-urls.sh` + host dispatcher | REDUCE | F.W3 (ops gate) | **RECOMMENDED** |
| **F-T-P1** | Lazy-load `katex` on `/paper` only via `vendor-paper` chunk | performance | `web/vite.config.ts:57` + 4 katex import sites | ADD | F.W5 | **REJECTED-AS-ADD** |
| **F-T-E2** | Per-call-site migration of `web/src/lib/types.ts` hand-mirror → `api-schema.d.ts` | elegance | `web/src/lib/types.ts` (~30 exports) → 23 importer files | ADD | — | **REJECTED-AS-DECORATIVE** |

## §2 — The RECOMMENDED-for-F

### F-T-S1 — compute_cache parametric collapse + `compute_bases` wiring

`compute_cache.py:44-91` keys / lookups / stores against `(contour_hash, n_harmonics, n_points)` — a 3-field positional contract specific to epicycles. `compute_bases` (`contours.py:56-67`) has the same shape (contour_hash + 4 params) but **ZERO caching** despite being on the same `/compute/*` axis. Refactor: change `cache_key` / `lookup` / `store` to take `params: dict` (canonical-JSON serialised; sorted keys) → one cache serves both endpoints. Then wire `compute_bases` to use it.

- **Reduces**: the parameter list duplication; the asymmetry between two sibling compute routes; the "TODO: cache bases too" latent debt.
- **Risk**: low — `compute_cache` is fail-open (lines 59-62, 89-91); a hash-collision is impossible across (epicycles, bases) call-sites because the params dict already includes `max_degree`/`levels` which epicycles never carries.
- **Gate**: `db.epicycle_cache` → `db.compute_cache` rename; two `CACHE_HIT` log lines emitted on second `compute_bases` call with identical params.

### F-T-N1 — Drop legacy `status` field from `FormattedPalette`

`palette.ts:26-29` declares the field "Retained for backward-compat during I.W1 transition; drop at I.W4." That deadline already passed (we're at value.js-I.W1-W4 53-cell complete per memory). Demo consumers are: `useAdminUsers.ts:87,91`, `PaletteCardMenu.vue:131,133`, `PaletteCard.vue:37` — and all three Vue sites already use `palette.tier ?? palette.status` fallback. The fallback's left-hand wins; the right-hand is **dead branch**.

- **Reduces**: one field × the serialisation cost × the documented-as-legacy lie.
- **Risk**: low — `tier` is the canonical replacement and is already produced.
- **Gate**: `formatPalette()` returns no `status`; demo TS compile + e2e green; the `(palette.tier ?? palette.status)` expressions collapse to `palette.tier` in a paired demo PR.

### F-T-E1 — Auto-discover `migrate_*.py`

Runner explicitly enumerates 3 modules (`run_pending_migrations.py:56-60`). The filesystem (`api/scripts/migrate_*.py`) is already the source-of-truth — the list is a redundant index. The `migrations` collection's `(name, version)` index dedupes execution; the version-bump intent can live in a `MIGRATION_VERSION` module constant inside each `migrate_*.py`.

- **Reduces**: the human bookkeeping step of "add module then add to list."
- **Risk**: low — discovery is alphabetical, deterministic; the per-module `MIGRATION_VERSION` constant gates re-runs.
- **Gate**: new `migrate_foo.py` with `MIGRATION_VERSION = 1` and `main()` runs without runner edits.

### F-T-S2 — Inline thin wrappers; expose `coreFetch` + `apiFetch`

`apiFetchWithETag` (api.ts:285) and `adminFetch` (api.ts:298) are file-private (no `export`); they are 8-line passthroughs to `coreFetch`. Inlining at the 6-8 call-sites where each is used drops ~25 LOC and removes a level of indirection without changing the public surface.

- **Reduces**: two private helpers; two layers of "which fetch?" cognitive load.
- **Risk**: low (they're already private).
- **Gate**: `grep "apiFetchWithETag\|adminFetch" web/src/lib/api.ts | wc -l` → 0.

### F-T-S3 — Execute the host-flip

Script LIVE at `scripts/update-webhook-urls.sh`; the per-repo URLs at `deploy.babb.dev/hooks/<repo>` retire the multiplex dispatcher AND, per the script comment (lines 17-18), the latent-broken `mkbabb/value.js` dispatcher arm dies with it.

- **Reduces**: one host script (dispatch.sh); one latent-broken arm; the multi-repo coupling.
- **Risk**: medium-low — operator-coordinated; reversibility = revert each webhook URL via `gh api`.
- **Gate**: 5 `gh api repos/<owner>/<repo>/hooks/<id>/test` GREEN + dispatcher file deleted on host.

## §3 — REJECTED-as-ADD (the adversarial finding)

**F-T-P1 — "lazy-load katex on /paper only."** Looks elegant: katex is heavy; paper is a chunk-isolated route. **But**: `EquationPanel.vue` and `EquationResult.vue` import `katex` *directly* and are mounted on `/visualize` (`VisualizationView.vue:26,231`), not `/paper`. The `vendor-math` chunk (`vite.config.ts:57`) is already correctly placed — it loads with `/visualize`, where the user spends most of their time. "Lazy on /paper only" would require either (a) dynamic-import refactors at 4 component sites (adds Suspense/loading-state plumbing) or (b) accepting that katex still loads on /visualize, which is the status quo. This is **manufactured elegance**: the chunking is *already* optimal for the actual route topology; further "optimisation" trades observable load-time for code complexity. **Reject.**

## §4 — Per-call-site migrations (decorative or load-bearing?)

- **`web/src/lib/types.ts` hand-mirror → `api-schema.d.ts`**: 23 importer files; ~30 exported symbols; **decorative**. The hand-mirror is hand-written semantic types tuned for ergonomics (e.g. `WithETag<T>`, `Visibility = "draft" | "unlisted" | "public"`, store-shape types like `EpicycleData`). `api-schema.d.ts` (2287 LOC; openapi-typescript output) exposes raw `operations["..."]["responses"]["200"]["content"]["application/json"]` paths that no ergonomic caller wants to spell. **F-suitable move**: keep `types.ts` curated, but auto-generate a *narrow* re-export adapter that bridges the two — NOT a full per-call-site migration. The 23-file rewrite is decorative churn; the load-bearing win is drift-detection (a type-test that asserts the curated types remain assignable to the schema types).
- **value.js demo per-call-site `ifMatch` / `idempotencyKey`**: the plumbing exists in `client.ts:58-76,105-109` but is exercised by **0** call-sites under `demo/@/lib/palette/api/` (verified by grep). Per-call-site adoption here is **load-bearing** for `PATCH /palettes/{slug}` (palettes.ts:82) and the admin mutations (admin-palettes.ts:24-62) — these are the optimistic-concurrency hot paths. Decorative for the POST-create paths (sessions, color-proposals) where idempotency-key is theoretical. **Targeted adoption ~5 call-sites**, not the full ~20.

## §5 — Headline finding

The highest-leverage F transposition is the **compute_cache parametric collapse + bases wiring (F-T-S1)** — it discharges the W7 asymmetry in one shape-change — while the seductive "katex lazy-load on `/paper` only" (F-T-P1) is the manufactured-elegance trap because EquationPanel / EquationResult already mount on `/visualize`, making the vendor-math chunk's current placement load-bearing.
