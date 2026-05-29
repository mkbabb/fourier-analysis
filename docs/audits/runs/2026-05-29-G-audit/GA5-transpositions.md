# GA5 — Architectural Transpositions (Tranche G, ARCHITECTURE/ELEGANCE lane)

READ-ONLY survey. Mandate: "architectural transpositions in the sake of elegance, simplicity,
and performance above all… NO legacy code, NO quick solutions, NO workarounds: idiomatic,
gestalt approaches." Each candidate: CURRENT shape → WHY → GESTALT end-state → BLAST RADIUS →
PRIORITY. Priority = (elegance+perf gain) / risk. Tags: **[E]** elegance/simplicity, **[P]** performance.

The codebase is already disciplined: no TODO/FIXME/HACK markers, no `_AVAILABLE` flags, the
W5 `coreFetch` collapse and W2 compute-cache symmetry are genuine prior wins. The candidates
below are the *remaining* gestalt moves, ranked.

---

## T1 — `api-schema.d.ts` codegen is imported by NOTHING; `types.ts` hand-mirrors it [E] — TOP

**Current shape.** `web/src/lib/api-schema.d.ts` is a 65 KB / ~1900-line GENERATED
openapi-typescript artifact (committed, refreshed via `web/scripts/gen-types.sh`, npm script
`gen-types`). Its own header (and `gen-types.sh`, citing "E.W8 T-E2 — retires the hand-mirrored
types at `web/src/lib/types.ts`") claims it is the canonical source of truth. **It is imported
by zero files** (`grep -rln "from.*api-schema" web/src` → only itself). Every consumer instead
imports from the 239-line hand-written `web/src/lib/types.ts` and from `web/src/lib/api.ts`
(which *also* hand-declares `Visualization`/`VisualizationCreate`/`VisualizationPatch`/
`VisualizationListResponse` inline, lines 27–81).

**Why it's inelegant/legacy.** This is the exact "hand-mirror class of bug" T-E2 set out to
*close*, left half-done: the generated contract exists, is regenerated, ships in the bundle's
type-check graph — but the hand-written mirror it was meant to replace still shadows it
everywhere. Two sources of truth for the api↔web contract (three, counting the inline block in
`api.ts`), and the one that is *derived from the Pydantic models* is the one nobody reads. This
is precisely inv-11 (parallel implementations that should converge to one identity).

**Gestalt end-state.** Pick ONE source of truth and delete the other two:
- **Option A (idiomatic codegen):** make `api-schema.d.ts` real — re-export thin named aliases
  (`export type Visualization = components["schemas"]["Visualization"]`) from a small `types.ts`
  facade, repoint all consumers, delete the hand-written interfaces and the inline `api.ts`
  block. Wire `gen-types` into the build so drift is structurally impossible.
- **Option B (drop the codegen):** if the team prefers curated hand types (view-models diverge
  from wire shapes — see T4), then DELETE `api-schema.d.ts` + `gen-types.sh` + the npm script
  entirely; they are 65 KB of dead weight masquerading as the source of truth.

Either is fine; the sin is keeping both. Recommend **A** — the Pydantic models are the honest
origin and codegen makes the contract self-healing.

**Blast radius.** Medium. ~20 import sites across stores/components if A; near-zero if B
(delete-only). Type-only change — no runtime behavior. Bounded, mechanical.

**Priority.** HIGHEST. Pure elegance + closes a named inv-11 duplication the repo already
*believes* it closed. Low risk (types compile-time only).

---

## T2 — Two IP-resolution identities: full XFF-aware resolver vs. `request.client.host` [E][P] — TOP

**Current shape.** `api/dependencies.py:182 get_client_ip()` is a careful resolver: XFF
last-hop → `X-Real-IP` → `request.client.host` → `"unknown"`. There is a second `hash_ip`
there (`:196`). Meanwhile the rate limiter (`api/services/rate_limiter.py:227`) does
`client_ip = request.client.host if request.client else "unknown"` with its *own* `hash_ip`
(`:24`) — and never consults `get_client_ip`. The 30-line DEPLOYMENT NOTE at
`rate_limiter.py:139–152` documents the consequence as a *named residual*: behind the live
2-hop chain (Apache → nginx → backend) every client collapses to one nginx-seen bucket, so the
read budget is a global aggregate cap, not per-client.

**Why it's inelegant/legacy/slow.** Two IP-handling paths (the literal inv-11 candidate from
the charter) AND two `hash_ip` definitions. The rate limiter deliberately ignores the resolver
that already exists three files over, then writes 30 lines explaining why the result is wrong.
The "perf" angle: the limiter currently can't protect a real attacker's bucket without
nuking all legitimate traffic, so the budget is set to a toothless 1200/min — the rate limiter
is functionally decorative until this converges.

**Gestalt end-state.** ONE IP identity. Promote `get_client_ip` + `hash_ip` to a single home
(`api/dependencies.py` or a tiny `api/lib/net.py`); the rate-limiter middleware calls it.
Pair with nginx `set_real_ip_from` + `real_ip_header X-Forwarded-For` (host config, deploy
repo) so `request.client.host` is the *true* client through the chain — then the XFF parsing
and the resolver converge to the same honest value and the budget can drop to a real per-client
number. Delete the duplicate `hash_ip`.

**Blast radius.** Small in-repo (1 import + 1 call-site swap; delete 1 dup function). The
nginx `real_ip` half lives in the `deploy` repo (thread ζ / inv-22 territory) — coordinate, but
the Python convergence stands alone and is safe to land first.

**Priority.** HIGH. Closes the charter's flagship inv-11 example + an honest perf/security win.
Risk low for the in-repo half.

---

## T3 — `deploy-hook.sh` near-duplicated between fourier-analysis and the `deploy` template [E] — HIGH

**Current shape.** `fourier-analysis/scripts/deploy-hook.sh` (196 lines) and
`deploy/templates/deploy-hook.sh` (220 lines) are near-clones; the template header literally
says "Distilled from fourier-analysis/scripts/deploy-hook.sh (the maturest reference shape)."
The diff is comments + a few hardening lines. `deploy/host/dispatch.sh` (102 lines) is the
third arm.

**Why it's legacy.** The deploy spine forked: fourier carries its own copy, `deploy` carries
the "standard" copy derived from it, and they drift (the template has 24 extra lines fourier
lacks). This is the deploy-hook ⇆ dispatch duality the charter calls out, and tranche F thread
ζ already names `mkbabb/deploy` as the versioned home.

**Gestalt end-state.** `deploy/templates/deploy-hook.sh` is the single source; fourier's copy
is *generated/vendored* from it (a `make deploy-hook` or a thin `scripts/deploy-hook.sh` that
`source`s the installed template with repo-specific env vars: `SERVICE=backend`, `HTTP_PORT`,
`/var/www/fourier-analysis`). No hand-maintained second copy.

**Blast radius.** Medium — touches live deploy; must be verified on host (inv-22 health gate).
Cross-repo (coordinate with thread ζ, which already owns this).

**Priority.** HIGH elegance, but **defer to thread ζ** — it is already scoped there. G should
*confirm convergence happens*, not re-do it.

---

## T4 — `Visualization` → `GalleryEntry` denormalizing projection [E] — MEDIUM

**Current shape.** `web/src/stores/gallery.ts:26 toGalleryEntry()` maps the canonical
`Visualization` (api.ts) onto a *narrower* `GalleryEntry` view-shape (types.ts:115), renaming
`owner_slug`→`user_slug` and dropping `visibility`/`content_hash`/`title`/`tags`/etc. Five
gallery components (`GalleryView`, `GalleryCard`, `GalleryMarquee`, `GalleryFeaturedCarousel`,
`GalleryInfiniteGrid`, `GalleryCardModal`) all type against `GalleryEntry`.

**Why it's inelegant.** This is residual denormalization from the pre-B world where gallery
entries were a separate entity. Post-convergence (CRUD-CONTRACT §1, "one user-named noun")
there is exactly one entity; the projection now exists only to rename `owner_slug`→`user_slug`
and shed fields the cards happen not to read. It's a lossy adapter with no semantic purpose —
the card components could consume `Visualization` directly.

**Gestalt end-state.** Delete `toGalleryEntry` + the `GalleryEntry` type; have the gallery
components accept `Visualization` (or a `Pick<Visualization, …>` if narrowing is genuinely
desired for prop-surface hygiene). One entity type end-to-end, matching the backend's converged
identity.

**Blast radius.** Medium — 6 components + the store; the `user_slug`/`owner_slug` rename must be
chased through templates. Mechanical, type-guided.

**Priority.** MEDIUM. Real elegance (removes a vestige of a retired entity), moderate churn.

---

## T5 — LCP critical path: home route `/paper` front-loads the heaviest chunks + 3 CDNs [P] — HIGH

**Current shape.** Default route is `/paper` (`router/index.ts:8` → `getSavedTab()` defaults
`/paper`). First paint therefore pulls: `index` 479 KB + `PaperView` 460 KB + `vendor-math`
340 KB (katex + value.js) + `vendor-ui` 220 KB + `vendor-vue` 121 KB ≈ **1.6 MB of JS** before
the LCP element. `index.html` also has on the critical path: a **render-blocking** KaTeX
stylesheet from `cdn.jsdelivr.net`, Google Fonts CSS (2 families) from `fonts.googleapis.com`,
and Computer Modern `.woff` preloads + CSS from `cdn.jsdelivr.net` — **three** third-party
origins, each a fresh TLS+DNS round trip on the LCP path. (Prod 403s WebFetch behind CF, so the
live LCP wasn't directly measured this run; the bundle/HTML evidence is on-disk.)

**Why it's slow.** Tranche F narrowed the 7–8 s LCP to font-pin and *deferred* route-lazy +
self-host as "manufactured." Re-examining: routes ARE already lazy (good), but the *landing*
route is the single heaviest one, and the three external CDNs are a real, un-manufactured
latency tax — DNS+TLS to jsdelivr/Google on a cold visit easily costs 300–800 ms before a
byte of font/CSS arrives, and the KaTeX CSS is render-blocking.

**Gestalt end-state (two honest, separable wins):**
1. **Self-host the fonts + KaTeX CSS.** Vendor the 3 CM `.woff`, the KaTeX CSS, and (subset)
   Fraunces/Fira into `dist/` so they're same-origin behind CF's edge + `immutable`
   Cache-Control. Collapses 3 third-party origins → 0. This is the *real* perf win F deferred;
   it is not manufactured — it removes cross-origin RTTs from the critical path. (KaTeX font
   files are already `font-display: swap` + `local()` in `style.css:56`, so only the CSS + CM
   fonts remain external.)
2. **Make the LCP element cheap.** `/paper` renders a large typeset document; ensure the
   above-the-fold hero/title paints from the `index`+`vendor-vue` chunks without waiting on
   `PaperView`'s 460 KB compile/render path (the paper plugin). If feasible, render a static
   hero from `index.html`/`App.vue` shell so LCP fires before the paper chunk resolves.

**Blast radius.** (1) is low-risk, bounded, and high-value (build-config + a few `<link>`
swaps). (2) is higher-risk (touches the paper render path) — scope carefully or defer.

**Priority.** HIGH for (1) — the clearest standalone perf win in the repo. MEDIUM/defer for (2).

---

## T6 — Dead exported types in `web/src/lib/types.ts` [E] — MEDIUM (quick)

**Current shape.** `lib/types.ts` exports several types with **zero live consumers** (verified
by grep across `.ts`/`.vue`, excluding the declaration files):
- `NotationMode`, `EquationTier` — duplicated verbatim at `lib/equation/types.ts:1–2`, and
  *every* consumer imports the equation-dir copy. The `lib/types.ts` copies are dead.
- `Snapshot` (`:88`), `ContourData` (`:29`), `GalleryCursorResponse` (`:158`),
  `CursorInfo` (`:153`) — no importers at all.

**Why it's legacy.** Vestiges of retired shapes (the old `Snapshot` entity, the old
`{total,page,pages}`/`CursorInfo` gallery pagination superseded by the cursor envelope). Dead
exports that invite accidental re-use of stale contracts (inv-15: "module nobody calls").

**Gestalt end-state.** Delete the six dead exports. Keep the single canonical `NotationMode`/
`EquationTier` in `lib/equation/types.ts`. (Largely subsumed by T1 Option B, but worth booking
independently since it lands even under T1 Option A.)

**Blast radius.** Trivial — delete-only, no importers.

**Priority.** MEDIUM elegance / LOW effort. Bundle with T1.

---

## T7 — `compute_cache.py` uses `datetime.utcnow()` (naive) under a `tz_aware` client [E] — LOW

**Current shape.** `compute_cache.py:105` writes `"created_at": datetime.utcnow()` (naive),
while `database.py:28` opens the Motor client with `tz_aware=True` and the rest of the codebase
standardizes on `datetime.now(UTC)` (dependencies.py, database.py `touch_document`).

**Why it's inelegant/legacy.** `datetime.utcnow()` is deprecated in 3.12+ and produces a naive
datetime that round-trips inconsistently with the aware-everywhere convention the project
adopted precisely to avoid naive/aware `TypeError`s (see the `tz_aware` comment at database.py:26).
It works today only because the TTL index doesn't compare against an aware cutoff — a latent trap.

**Gestalt end-state.** `from datetime import UTC` → `datetime.now(UTC)`, matching the rest of
the codebase. One time convention.

**Blast radius.** Trivial — one line. TTL semantics unchanged (UTC instant identical).

**Priority.** LOW but free. Bundle into any G backend wave.

---

## Observations (NOT transpositions — confirming prior wins held)

- **`coreFetch` collapse (E.W5) is genuinely clean.** `apiFetch`/`apiFetchWithETag`/`adminFetch`
  are thin pass-throughs over one core; only `apiFetch` is exported and `equation/api.ts`
  correctly shares it. No 4th-helper regression. The two `checkImageHash`/`imageUrl` raw
  `fetch` calls (api.ts:322) are intentional (no-auth GET / URL builders) — leave them.
- **Compute-cache symmetry (F.W2) is sound** — one parametric `params` key serves epicycles +
  bases, fail-open, TTL-bounded. (Only the `utcnow` nit, T7.)
- **Mongo index shapes (database.py) are well-formed** — cursor compound indexes match the
  sort axes, janitor predicates are index-backed (the W4.a `$nin` scan is gone). No index work
  needed.
- **`compute_concurrency` semaphore + timeout (computation.py)** is the right shape for the
  onnx/rembg cost; no transposition warranted (the C4 onnx warning flood is already silenced at
  `api/__init__.py`).

---

## Ranked summary

| # | Transposition | Tag | Gain | Risk | Priority |
|---|---|---|---|---|---|
| T1 | One api↔web contract source (kill 2 of 3 mirrors) | E | High | Low | **TOP** |
| T2 | One IP-resolution identity (+ real per-client budget) | E·P | High | Low (in-repo) | **TOP** |
| T5(1) | Self-host fonts + KaTeX CSS (kill 3 CDN RTTs) | P | High | Low | **HIGH** |
| T3 | Converge deploy-hook to single template | E | High | Med | HIGH (→ζ) |
| T4 | Drop `GalleryEntry` projection; use `Visualization` | E | Med | Med | MED |
| T6 | Delete 6 dead exports in `lib/types.ts` | E | Med | Triv | MED |
| T5(2) | Cheap-LCP hero before paper chunk | P | Med | Med | MED/defer |
| T7 | `utcnow()` → `now(UTC)` in compute_cache | E | Low | Triv | LOW |

**inv-21 bounding note:** T1, T2(in-repo), T6, T7 are all low-blast-radius and could share one
"contract + convention convergence" wave. T5(1) is a standalone perf wave. T3 belongs to ζ. T4
and T5(2) are the two that warrant their own scoped wave with verification.
