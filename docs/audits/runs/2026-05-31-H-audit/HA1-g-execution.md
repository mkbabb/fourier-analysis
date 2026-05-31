# HA1 — falsification of tranche G's close (g-execution lane)

**Lane**: HA1 — STRICTLY READ-ONLY. Zero mutations made (no source/host edits, no commits, no restarts).
**Subject**: tranche G, closed GREEN at fourier `5e29ed0` (W9) + follow-up `b28c3fa`; deploy-repo `a7b58ab`.
**Method**: re-derived each G hard-gate independently; live prod probes (Playwright + curl); CI run forensics (`gh run`); source read at file:line.
**Date**: 2026-05-31.

---

## VERDICT

**G's close SURVIVES falsification on its load-bearing claims, but carries ONE material overstatement that must fold into H to be honest-in-full.**

The substantive transpositions G claims are REAL and verified live: δ (3→0 third-party origins) is LIVE and clean; β.2 (one IP identity) is correct and honestly caveated; γ (legacy-zero) greps clean; inv-26 (single contract source) holds at the collapsed boundary; inv-25 (deploy-of-record) cites a genuine automated SPA `deploy_run_id`; the backend `read_only` posture is sound (no live write path escapes `/tmp` or `/data/blobs`); `--proxy-headers` removal breaks nothing. G did NOT regress the e2e suite.

The one defect: **FINAL.md §2's CI-green gate row ("pytest ✅", "vue-tsc + build ✅", "T7 ✅") is an overstatement** — the full `ci.yml` pipeline was RED on **every commit of G** (48/48 recent CI runs = `failure`), and **remains RED after close** because the e2e job fails on real Playwright assertions. The pytest gate was verified LOCALLY while CI's api-tests job could not even spawn pytest. This mirrors exactly the F-overstatement G was born to correct (claiming "verified" against a surface that was actually red) — G reproduced the anti-pattern one layer up.

---

## §1 — The CI-green overstatement (the headline; CONFIRMED)

**Claim (FINAL.md §2, lines 34–36):**
> | **pytest** | ✅ | 132 passed / 83 skipped (+1 new per-client test). |
> | **vue-tsc + build** | ✅ | green. |
> | **T7 conformance** | ✅ | 12/12 PASS. |

**Reality:**
- **CI has NEVER been green.** `gh run list --workflow CI --limit 100` → `[{"failure":48}]`. Every push since before F closed (`d34d21b`) through G's close (`5e29ed0`) and the post-close `b28c3fa` is `failure`.
- **The pytest gate was LOCAL-only.** FINAL cites "132 passed / 83 skipped" — that is the no-Mongo local count. In CI (live Mongo), the real count is **215 passed** (run `26719598467`, job `78744167383`). But during all of G, the CI `api-tests` job was RED with `Failed to spawn: pytest` — `ci.yml:63` synced `--extra web` (pytest lives in `--extra dev`). That was fixed only in `b28c3fa`, which lands **after** the W9 close commit `5e29ed0` (`git log` confirms ordering). So when G's FINAL stamped "pytest ✅", the authoritative CI surface for pytest was red.
- **`vue-tsc + build ✅` is true** (the `web-build` job is green: run `26719598467` job `78744167387` ✓) — but FINAL presents all three gate rows as if the pipeline as a whole passed, which it did not and does not.

This is the same class of error as F's: a gate marked ✅ against a local/partial check while the standing automated surface (CI) is red. Per G's own inv-25 ethos ("no 'LIVE' claimed without an automated deploy_run_id"), a "pytest ✅" should cite a green CI run id — none exists.

## §2 — The e2e failure: ROOT CAUSE + G did NOT cause it (the single most important finding)

**The e2e job fails on real Playwright assertions and STILL fails post-close** (run `26719598467`, job `78744167384`: backend boots ✓, vite boots ✓, `Run Playwright e2e` ✗, exit 1).

**Root cause — a stale-spec / structural-DOM mismatch, PRE-EXISTING, not a G regression:**

The dominant signature (51 occurrences in the failed log) is:
```
Error: locator.setInputFiles: strict mode violation:
  locator('input[type="file"]') resolved to 2 elements:
    1) <input type="file" ... data-v-bf700a2f> aka .first()
    2) <input type="file" ... data-v-fcf6c19f> aka getByRole('complementary').locator(...)
```
The specs (`contour-extraction.spec.ts:18`, `workspace-flow.spec.ts`) assume ONE `input[type="file"]`. There are now TWO:
- `web/src/components/visualization/ImageUpload.vue:122`
- `web/src/components/visualization/VisualizationView.vue:201` (`canvasFileInput`)

Both file inputs PRE-DATE G:
- `VisualizationView.vue` file input: introduced `f91a656` (C.W4).
- `canvasFileInput`: introduced `9e5ba74` (a web mobile-UX commit, pre-G).

Secondary failures are also stale-spec, not G: `gallery.spec.ts:10` (`galleryTab`/`draftsTab` not visible), `paper-performance.spec.ts`, `visualization-crud.spec.ts` — all assert against an older UI. `settings-persistence.spec.ts:8` even carries a `TODO: Rewrite for asset-based persistence`. None of the failing specs reference any symbol G excised (grep of `web/e2e/` for `GalleryEntry|toGalleryEntry|owner_slug|like_limiter|/like|Snapshot|ContourData|CursorInfo|GalleryCursorResponse` → only incidental word-matches in comments).

**Why this surfaced DURING G but is not G's fault — the precise mechanism:**
- At F head `d34d21b` and G base `a2e05ea`, the CI failure was at the **`Run actions/checkout@v4`** step (run `26658250907` / `26664616781`): the submodules chronic (fetching private `docs/precepts`). **e2e never even ran.**
- G's `1174211` (W1) dropped `submodules:recursive` from the workflows. The FIRST CI run to get past checkout and actually EXECUTE e2e was `01c9767` (G.W1) — it ran 7m31s and FAILED on these same Playwright assertions (run id job `78675990865`).
- So **G's checkout-fix UNMASKED a long-latent broken e2e suite; it did not break it.** The e2e suite has likely been red (or unrun) since the specs were written against the pre-asset-based UI. G's W2 (type collapse) / W4 (GalleryEntry→Visualization) changes are NOT implicated — the failures are DOM-structure and stale-UI-text assertions, present before G's source touched anything.

**Honest characterization for H:** the "e2e green" was never claimed in FINAL (FINAL is silent on e2e), but FINAL's blanket "vue-tsc + build ✅" + "pytest ✅" gate table reads as "CI is green," which is false. The e2e suite is **stale and needs a rewrite for the asset-based architecture** (single-file-input selector scoping, gallery/paper/crud spec refresh). This is the largest honest residual.

## §3 — δ (self-hosted fonts) — LIVE + STABLE, claim SURVIVES

Probed live `https://fourier.babb.dev/paper` (Playwright `document.fonts` + `performance.getEntriesByType('resource')`):
- **Third-party origins: ZERO.** No googleapis/gstatic/jsdelivr in the resource list. The "3→0" claim is verified live.
- **Body font:** computed `"Computer Modern Serif", "Latin Modern Roman", "CMU Serif", Georgia, serif` — CM Serif face `status:"loaded"`. The `@font-face` family in `web/public/fonts.css:15` (`"Computer Modern Serif"`) **exactly matches** `--font-sans` in `web/src/style.css:14`. No mismatch.
- **KaTeX:** woff2 emitted same-origin into `dist/assets` and loaded (`KaTeX_Main-Regular-B22Nviop.woff2` in the live resource list; `KaTeX_Main 400/normal status:"loaded"`). Math renders correctly.
- **latin-ext risk:** the Fraunces/Fira-Code subsets are latin-only (`fonts.css:50,60,74` unicode-range). Live probe of the paper body found **zero** non-latin1 glyphs (`suspectGlyphs: []`) — the subset is adequate for the actual content. The theoretical risk (user-supplied gallery titles with ě/ł) is real but out of the paper surface; low severity.

**One cosmetic δ nit (not a regression, worth noting for H):** `web/src/style.css:56–67` adds `@font-face{font-family:KaTeX_Main; src:local("KaTeX_Main")}` overrides with **`local()` only, no woff2 fallback**. Because `style.css` is imported AFTER `katex.min.css` (`main.ts:5–6`) and these bare faces default to `weight:normal/style:normal`, they create a phantom face that on a machine without KaTeX installed locally resolves to **`status:"error"`** (confirmed live: a `KaTeX_Main weight:"normal" style:"normal" status:"error"` face exists in prod). It does NO functional harm — the explicit `weight:400` bundled woff2 face still loads and wins for rendering — but it makes `document.fonts.check('16px KaTeX_Main')` return `false` (a footgun) and emits an errored phantom face. Cosmetic; recommend H drop the `local()`-only KaTeX overrides or give them a woff2 `src`.

## §4 — β.2 (one IP identity) — CORRECT + HONESTLY CAVEATED

- `api/services/rate_limiter.py:226` keys on `get_client_ip(request)` → `hash_ip`. `get_client_ip` (`api/dependencies.py:182–198`) reads `X-Real-IP` (nginx `real_ip`), falls back to `request.client.host` only for direct calls. Correct single-identity resolver.
- **WORKERS=4 effective-ceiling**: `api/Dockerfile:32` `WORKERS=4`, per-process in-memory limiter → effective ceiling ~4×180 ≈ **720/min**, NOT 180. This is **honestly booked**: `rate_limiter.py:147–151` documents it as an explicit caveat, and FINAL.md §4 lists it as a named residual. The nginx `api_general` edge (30 r/s) is the real backstop. The convergence is not undermined — the per-CLIENT keying (the actual β.2 aim) is correct; only the absolute number is soft. Honest.
- **`--proxy-headers` removal — NO fallout.** Sole consumer of `request.client.host` is `get_client_ip` (grep confirms). NO code reads `request.url.scheme` / sets `secure=` cookies from scheme / issues `RedirectResponse` from `request.url` — only `request.url.path` is used (`main.py:119`, `idempotency.py:73`, `rate_limiter.py:222`). Removing uvicorn's XFF/scheme rewrite breaks nothing; nginx `real_ip` is the single trust boundary (`Dockerfile:33–37`). Sound.

## §5 — backend `read_only` — NO subtle breakage

`docker-compose.prod.yml`: backend `read_only: true` + `tmpfs: [/tmp]` + rw volume `image_blobs:/data/blobs`. Traced every write path:
- `api/services/image_storage.py:200,202,122` `write_bytes` → `_blob_dir()` = `/data/blobs` (rw volume). OK.
- `image_storage.py:242` `tempfile.NamedTemporaryFile(delete=False)` → default `/tmp` (tmpfs). No `TMPDIR` override. OK.
- `api/routers/images.py:191,194` + `image_storage.py:82` `img.save(buf, ...)` → `buf` is `BytesIO` (in-memory). OK.
- `UV_CACHE_DIR=/tmp/uv-cache` (`Dockerfile:30`). OK.
- **matplotlib font-cache 500 risk — does NOT apply.** The api compute path imports `fourier_analysis.{bases,contours,epicycles,shortest_tour}` (`computation.py:12–15`); `fourier_analysis/__init__.py` imports only series/epicycles/bases. NONE transitively import matplotlib or cv2 (grep clean). The matplotlib `savefig` calls live in `src/fourier_analysis/{figures,animation,cli_plotting}.py` — NOT reachable from the API. So no `~/.cache/matplotlib` write on the read-only FS.
- **Live confirmation:** prod `GET /api/health` = 200, `GET /api/visualizations?limit=1` = 200. (Per the read-only mandate I issued no write probes.)

No live write path escapes `/tmp` or `/data/blobs`. The `read_only` posture is sound.

## §6 — inv-26 (single contract source) — HOLDS at boundary; PARTIAL honestly booked

- The unused codegen is gone: `web/src/lib/api-schema.d.ts` and `web/scripts/gen-types.sh` do not exist; no `openapi-typescript`/`gen-types` references in `package.json`/`src`. The collapsed api↔web boundary is one source.
- **The 4th hand-type island is REAL and HONEST.** `web/src/lib/equation/types.ts` has **10 importers** (grep confirmed). FINAL.md §4 books it explicitly as "a distinct equation-domain contract (10 importers), not a duplicate… out of inv-26's named scope." This is an honest partial, correctly labeled — NOT an overstatement. inv-26 as scoped (the api↔web boundary) holds.

## §7 — γ excision (W4) — legacy-zero CLEAN; one low-severity tz edge

- `grep` for `like_limiter` / `toGalleryEntry` / `GalleryEntry` / `datetime.utcnow` across live `api/` + `web/src/` → only doc-comment matches (`migrate_visualization.py:108` describes OLD naive data; a `GalleryEntry` mention in a comment). No live code. Clean.
- **`datetime.utcnow → now(tz=UTC)` (5× + more) — low-severity latent edge.** All write sites now stamp **aware** datetimes (consistent; `database.py:27` even relies on this for cutoff comparisons). The risk: `softdelete.py:66` `deleted_at < datetime.now(UTC) - timedelta(...)` compares a STORED `deleted_at` against an aware value. Rows written by the OLD naive `utcnow()` (pre-G) would raise `TypeError: can't compare offset-naive and offset-aware`. New rows are aware-safe; only legacy pre-G rows are exposed, and only on the soft-delete-grace path. Worth a one-line note/migration in H; not a close-blocker. The `compute_cache.py:105` site G changed is write-only (no comparison) — zero risk there.

## §8 — inv-25 (deploy-of-record) — SPA claim HOLDS

- **SPA:** `deploy-pages.yml` exists, triggers `on: push: branches:[master]`, ships via `scripts/pages-deploy.sh` to CF Pages. Cited run `26695021489` is a genuine automated, push-triggered success (job "build + ship SPA → Cloudflare Pages" ✓ 55s). inv-25 SPA gate is real — this is the actual correction of F's "δ never shipped" overstatement, and it holds.
- **API:** webhook→deploy-hook chain (host journal cited in FINAL). Not independently re-probed read-only here, but consistent with deploy operational knowledge.
- **δ prod surface live-verified:** `robots.txt` served (CF content-signals variant), `<meta name="description">` present, `cmun*` fonts + `fonts.css` linked in `/` HTML (curl confirmed).

---

## §9 — What MUST fold into H to make G's close honest-in-full

1. **Correct the CI-green overstatement (REQUIRED).** FINAL.md §2's pytest/vue-tsc/T7 gate rows must either cite a GREEN CI run id or be re-labeled "local-only; CI red (e2e)." As authored, they assert a green pipeline that does not exist. (Evidence: 48/48 CI `failure`; `b28c3fa` post-dates the W9 close `5e29ed0`.)
2. **Repair OR honestly retire the e2e suite (the largest residual).** The specs assert against the pre-asset-based UI: scope `input[type="file"]` to `.first()` or a `data-testid`; refresh `gallery`/`paper-performance`/`visualization-crud`/`settings-persistence` specs (the last is already TODO'd). Root cause is stale specs + the dual file-input DOM (`ImageUpload.vue:122` + `VisualizationView.vue:201`), both pre-G — so this is debt G unmasked, not debt G owes, but it gates a truthful "CI green."
3. **Drop the `local()`-only KaTeX `@font-face` overrides** (`style.css:56–67`) or give them a real woff2 `src` — they produce an errored phantom face and a misleading `document.fonts.check` result. Cosmetic.
4. **Note/guard the aware/naive datetime edge** for pre-G soft-deleted rows (`softdelete.py:66`) — a one-line `.replace(tzinfo=UTC)` coalesce or a backfill.
5. (Already honest, keep as-is): WORKERS=4 ~720 effective ceiling (§4 residual), the 4th type island (§4 residual), frontend/mongo/nginx `read_only` staging residual — all correctly booked in FINAL §4.

## §10 — Evidence index
- CI all-red: `gh run list --workflow CI --limit 100 --jq … → [{"failure":48}]`.
- e2e fails post-close: run `26719598467`, job `78744167384`, `Run Playwright e2e` ✗ exit 1; api-tests `78744167383` ✓ (215 passed); web-build `78744167387` ✓.
- e2e first executed at G.W1 `01c9767` (job `78675990865`, 7m31s FAIL); never ran at F head `d34d21b` (run `26658250907`, failed at checkout).
- Dual file input: `web/src/components/visualization/ImageUpload.vue:122`, `web/src/components/visualization/VisualizationView.vue:201`; `canvasFileInput` introduced `9e5ba74`; VisualizationView input `f91a656` (C.W4).
- δ live: Playwright probe of `https://fourier.babb.dev/paper` — 0 third-party font origins; CM Serif loaded; KaTeX_Main 400 woff2 loaded; phantom `KaTeX_Main normal/normal status:error`.
- β.2: `rate_limiter.py:147–151,226`; `dependencies.py:182–198`; `Dockerfile:32–37`.
- read_only: `docker-compose.prod.yml` backend block; `image_storage.py:200,242`; `computation.py:12–15`; `fourier_analysis/__init__.py`.
- inv-26 island: `web/src/lib/equation/types.ts` (10 importers).
- inv-25 SPA: `deploy-pages.yml`; run `26695021489`.
- datetime edge: `softdelete.py:66`; `compute_cache.py:105`; `database.py:27`.

End of HA1-g-execution.md.
