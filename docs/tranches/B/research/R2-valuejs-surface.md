# R2 — value.js Live Surface Re-Inventory (orphan confirmation)

**Lane**: fourier-analysis tranche-B research wave (Wα), lane R2 (re-scoped).
**Date**: 2026-05-26. **Mode**: research-only; one deliverable, zero source edits.
**Subject repo**: `~/Programming/value.js` @ HEAD `16129e0` ("Merge tranche-h into master — Tranche H close"), **v0.10.0**.
**Thesis**: confirm the orphan verdict (value.js-C RETIRED) against live code and inventory what the colour/palette surface *actually* is at v0.10.0.

**Original R2 charter** (now void): map value.js's library `Palette` + palette-api so fourier-B.W4 could re-point `colors.ts`/`easings.ts` onto them. That charter assumed value.js-C would publish a library `Palette` at `src/palette/`. C is **RETIRED**; this report re-scopes to confirm the absence and record what exists.

---

## §1 — Orphan confirmation (absence proofs)

**Structural absences — both confirmed empty (no such directory):**

```
$ find ~/Programming/value.js/src/palette
  bfs: error: /Users/mkbabb/Programming/value.js/src/palette: No such file or directory.

$ find ~/Programming/value.js/api/src/crud
  bfs: error: /Users/mkbabb/Programming/value.js/api/src/crud: No such file or directory.
```

- The library **`Palette` domain type at `src/palette/` does NOT exist** (Axis 2 orphan — C/FINAL.md §2 Axis 2). `src/` top-level holds only: `easing.ts`, `index.ts`, `math.ts`, `utils.ts`, `vite-env.d.ts`, and the dirs `parsing/`, `quantize/`, `transform/`, `units/`. No `palette*` / `Palette*` anywhere in `src/`.
- The **`api/src/crud/` utility-module (8 files per the C-plan U4 spec) does NOT exist** (Axis 1 architectural mismatch — obviated by D.W2 Lane C's `service+repository+errors+events+DI+zod` shape).

**C retirement state**: `~/Programming/value.js/docs/tranches/C/FINAL.md` exists (21407 bytes, dated 2026-05-26), status **RETIRED via the AB+1 retrospective pattern**. The library-`Palette` axis is recorded as *orphaned absent user re-mandate*; the CRUD-CONTRACT ratification as *never executed / cohort dissolved*; the api-alignment axis as *discharged-by-D-and-E under different theses*.

**value.js HEAD / version**: commit `16129e012ef6d4ac08420d55518de986850b190f`, package version **0.10.0** (tranches D→E→F→G→H ran past C under unrelated theses; H is the v0.10.0 close).

**Crosswalk note**: the cohort coordination doc the charter named lives at `~/Programming/value.js/docs/tranches/C/coordination/CRUD-CONSTELLATION.md` (the value.js-side mirror), *not* `docs/tranches/B/coordination/`. The fourier-side authoritative one is `~/Programming/fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md` (exists, 18808 bytes). The C-side mirror's "value.js-side structural inventory" table planned `src/index.ts` to gain `Palette`/`colorScale`/`sampleToSVGPath` exports and `transform/` to host `colorScale` — none landed. Live reality matches the orphan narrative exactly.

---

## §2 — Live colour/palette LIBRARY surface (v0.10.0)

Read from `~/Programming/value.js/src/index.ts` (307 lines, the public barrel) and module dirs. The library is a **colour-authority + CSS-value library**, not a palette-domain library. What exists today:

**Colour types** (`src/units/color/`): `Color` base + 15 space classes (`RGBColor`, `HSLColor`, `HSVColor`, `HWBColor`, `LABColor`, `LCHColor`, `OKLABColor`, `OKLCHColor`, `XYZColor`, `KelvinColor`, `LinearSRGBColor`, `DisplayP3Color`, `AdobeRGBColor`, `ProPhotoRGBColor`, `Rec2020Color`). Type `ColorSpaceMap`.

**Palette-relevant domain operations that DO exist** (the construct/validate/interpolate/serialize/gamut-map axes the charter asked about):
- **Construct / parse**: `parseCSSColor`, `CSSColor`, `color2` (dispatch convert), `colorUnit2`, `registerColorNames` / `clearCustomColorNames` / `getCustomColorNames` (custom named-colour registry).
- **Validate / normalize**: `normalizeColor`, `normalizeColorUnit`, `normalizeColorUnits`, `normalizeColorUnitComponent`, `isColorUnit`, `getFormattedColorSpaceRange`.
- **Interpolate / mix**: `lerpColorValue`, `mixColors`, `mixColorsN` (N-colour mix), `interpolateHue` (type `HueInterpolationMethod`), `CYLINDRICAL_HUE_COMPONENT`.
- **Gamut-map**: full module `src/units/color/gamut.ts` — `gamutMap`, `gamutMapOKLab`, `gamutMapSRGB`, `deltaEOK` / `DELTA_E_OK_JND`, `isInSRGBGamut`, `findCusp`, `findGamutIntersection`, `oklabToLinearSRGB`, `srgbToOKLab`, `oklabToRgb255`, etc.
- **Accent / contrast helpers**: `computeSafeAccent`, `safeAccentColor`, `needsContrastAdjustment`, `getOklchLightness`.
- **Quantize** (`src/quantize/`): `quantizePixels`, `dominantColor` (types `QuantizeOptions`, `QuantizedColor`) — extract dominant colours from pixel data; the closest thing to "derive a palette from an image".
- **Colour-filter solve**: `rgb2ColorFilter`, `cssFiltersToString`.
- **Serialize**: colours serialize via `CSSColor` / parsing/serialize surface; CSS stylesheet AST round-trips via `parseCSSStylesheet` / `serializeStylesheet` / `formatCSS`.

**Adjacent surfaces**: easing/timing (`src/easing.ts` — ~30 named easings, `cssLinear`, `bezierPresets`, `timingFunctions`); math primitives (`src/math.ts` — `clamp`, `scale`, `lerp`, `logerp`, `deCasteljau`, `cubicBezier`, `interpBezier`, `cubicBezierToSVG`, `cubicBezierToString`); transform decomposition (`src/transform/decompose.ts` — `decomposeMatrix2D/3D`, `slerp`, `interpolateDecomposed`); colour matrix math (`transformMat3`, `invertMat3`, etc.).

**The two named gaps — verdict ABSENT (confirmed by grep across `src/` + `api/`):**

- **`colorScale(stops, t)` — ABSENT.** `grep -rn "colorScale" src api` → zero hits. There is **no first-class palette/colour-scale evaluator** in the library. The pieces a `colorScale` would compose from exist (`mixColorsN`, `lerpColorValue`, `interpolateHue`, `gamutMap`), but no function packages "given N stops, sample at parameter t" into one call. (C/FINAL.md §2 Axis 2 confirms: "`colorScale(stops, t, opts?)` is absent from the library surface".)
- **`sampleToSVGPath(fn, n)` — ABSENT.** `grep -rn "sampleToSVGPath" src api` → zero hits. The existing primitive is **`cubicBezierToSVG`** (`src/math.ts`, exported from the barrel) — bezier-specific, NOT the generic "sample arbitrary `fn` at `n` points → SVG path `d` string" the C.W1 plan would have generalised to. (C/FINAL.md §2 Axis 2 confirms: "`src/math.ts:69` still carries `cubicBezierToSVG` … never generalised".)

**Net**: value.js v0.10.0 is a rich *colour-operations* library but carries **no palette-domain object** and **neither of the two cohort-named generic helpers**. The D→H evolution did not incidentally land them.

---

## §3 — Live palette-api surface (v0.10.0, post D-H refactors)

The api is a **Hono + MongoDB ("palette-api")** service, entry `api/src/index.ts`. The C-plan envisioned monolithic `routes/{palettes,colors,sessions,admin}.ts` + a `types.ts` doc-shape extension + an `api/src/crud/` util module. Live reality is the **D.W2 god-module split**: routes are now *directories*, doc shapes live in `models.ts`, and a `repositories/` + `services/` + `format/` + `errors/` + `events/` layering replaces the planned crud util.

**Live tree** (`api/src/`): `index.ts`, `models.ts` (9-collection doc shapes), `db.ts`, `cron.ts`, `hash.ts`, `slugWords.ts`, `regex.ts`, `types.ts` (AppEnv only), plus dirs `cache/`, `db/`, `errors/`, `events/`, `format/`, `middleware/`, `migrations/`, `repositories/`, `routes/`, `services/`, `validation/`.

**9 MongoDB collections** (`models.ts`): `palettes`, `palette_versions`, `votes`, `sessions`, `proposed_names`, `tags`, `flags`, `admin_audit`, `users`. (Note: the `Palette` interface that *does* exist is the **api-side persisted MongoDB document shape** in `api/src/models.ts:66-86` — string-slug `_id`, `colors`/`oklabColors`/`tags`/`voteCount`/`sessionToken`/`userSlug`/`status`/`forkOf`/`versionCount`. This is the *storage* shape, NOT the *library domain* `Palette` the charter sought. The C-plan's intended `Palette → PersistedPalette` split — domain in lib, storage in app — never landed; the storage shape is all that exists.)

**CRUD lifecycle** (routes under `api/src/routes/palettes/`): split into `crud.ts`, `flags.ts`, `forks.ts`, `versions.ts`, `votes.ts`, fronted by `index.ts`. Routes call **services** (`api/src/services/palette/`: `crud.ts`, `crud-list.ts`, `flags.ts`, `forks.ts`, `oklab.ts`, `versions.ts`, `votes.ts`), which call **repositories** (`api/src/repositories/palette.ts` — owns ALL `palettes`-collection query/projection/write; routes never touch `db.collection(...)` directly per D.W2 Lane C #2). Constructor-DI wires typed `Collection<T>` handles via `middleware/inject-services.ts`. Palette write-path also derives `oklabColors` (the `oklab.ts` service) and content-hash versioning.

**Slug algorithm** (`api/src/slugWords.ts`): adjective-verb-noun word-lists (`ADJECTIVES` ~128 entries, `VERBS` ~120 entries, plus a NOUNS list) generated via `crypto`; takes a `UserRepository` (collision check against existing slugs). The word-lists are **still hardcoded inline** — the C-plan U2 relocation to a shared `coordination/SLUG-WORDS.md` precepts file never executed (C/FINAL.md §2: "PENDING-NO-PULL … no second consumer").

**Session / ownership model**: `sessions` collection keyed by uuid token (`_id`), carries `ipHash`, optional `userSlug`, `createdAt`/`lastSeenAt`/`expiresAt`. Resolved per-request by `middleware/resolve-session.ts`. Ownership on palettes is dual: a **legacy `sessionToken` shim** + the newer **`userSlug`** field (`models.ts:73-75` — "Legacy ownership shim — replaced by `userSlug` once migration completes"). Users (`_id` = user slug) carry `status` (`active`/`suspended`).

**Soft-delete posture**: there is **no soft-delete `deletedAt` tombstone field** on palettes. Status is the lifecycle enum `published | featured | hidden | draft` (`models.ts:29`). "Hidden" is the closest soft-hide; the cron does *hard* deletes of expired/stale sessions and orphaned votes. (The C-plan's `softdelete.ts` util module — part of the obviated `api/src/crud/` — never landed.)

**Cron behaviour** (`api/src/cron.ts`, scheduled `0 3 * * *` UTC in `index.ts`): the E.W2 Lane A rewrite. The handler pulls cached `Services.repositories` via the same lazy DI factory as `injectServices` (no Hono context), then runs three sweeps: (1) expired sessions `sessions.deleteExpired(now)`, (2) stale sessions `sessions.deleteStale(now − 30d)`, (3) orphaned votes `votes.deleteOrphaned(paletteSlugs)` bounded by the **positive** slug list `palettes.listAllSlugs()`. The cron file itself no longer issues raw `db.collection(...)` calls or an unbounded `$nin` — see §4 for the nuance on where `$nin` survives.

---

## §4 — 13-surface conformance reality (spot-checked)

C/FINAL.md does not enumerate "13 surfaces" as a single list, but the discharge/obviation table (§2 + §6) and the D-attributed contract items map to the spot-checkable claims. **Verified against live code (≥3 required; 5 checked):**

| Claim (C/FINAL.md attribution) | Live-code spot-check | Verdict |
|---|---|---|
| **`formatPalette ??` per-field fallback excised** (D.W2 Lane D, commit `ee8bfa4`) | `formatPalette` lives at `api/src/format/palette.ts:45`; format is now its own dir (god-module split landed). | **LANDED** ✓ |
| **god-module split** (D.W2 Lane C) | `routes/`, `services/`, `repositories/`, `format/`, `errors/`, `events/` all separate dirs; routes/palettes split into 5 files; `PaletteRepository` header explicitly states routes never touch `db.collection("palettes")` directly. | **LANDED** ✓ |
| **repository layer** (D.W2 Lane C #2) | `api/src/repositories/` holds 9 repos (`palette`, `paletteVersion`, `vote`, `session`, `user`, `tag`, `flag`, `proposedName`, `adminAudit`); each constructor-DI'd a typed `Collection<T>`. | **LANDED** ✓ |
| **`withTransaction` coverage** | `grep -rln withTransaction api/src` → 11 files (`db.ts`, `inject-services.ts`, and 9 service files incl. all palette services + session/auth + admin). | **LANDED** ✓ |
| **as-any corpus to zero** | `grep -rn "as any" api/src src` → **2 hits**, both in `middleware/resolve-session.ts:35,47` (Mongo `_id` typing for token/userSlug lookups). Near-zero, not strictly zero. | **LANDED (≈zero; 2 residual)** ✓~ |
| **cron.ts `$nin` invert/retirement** (E.W2 Lane A) | `cron.ts` itself carries no `$nin` and delegates to repositories. BUT `$nin` still lives at `api/src/repositories/vote.ts:100` (`deleteMany({ paletteSlug: { $nin: validSlugs } })`) — the orphaned-vote sweep. Per C/FINAL.md §2 this is *discharged-in-spirit*: the sweep is now **bounded by the positive `palettes.listAllSlugs()` list**, not an unbounded scan; the C-planned `pinned`-flag mechanism was never built — a *different* remediation closed the same hole. | **DISCHARGED-IN-SPIRIT** (the `$nin` operator persists but is bounded; C's exact `pinned` design was obviated) |

**Unbuilt (parked / obviated, never landed):**
- Library `Palette` at `src/palette/` — **ORPHANED** (Axis 2; §1 absence proof).
- `colorScale` + `sampleToSVGPath` — **ABSENT** (§2).
- `api/src/crud/` 8-file util module — **OBVIATED** by the repository/service architecture.
- `slugWords.ts` → shared precepts-data relocation — **PENDING-NO-PULL** (still inline).
- CRUD-CONTRACT.md value.js ratification — **NEVER EXECUTED / DISSOLVED** (no `CRUD-CONTRACT.md` in value.js).
- Demo `Palette → PersistedPalette` rename + native lib-`Palette` consumption — **ORPHANED** (Axis 2 follow-on).

**Reading**: the api-side *engineering* improvements (god-module split, repository/service/format layering, withTransaction, as-any cleanup, bounded cron) all landed under D/E's own theses — incidentally satisfying the C-shaped intent. The *palette-domain* axis (library `Palette`, `colorScale`, `sampleToSVGPath`, contract ratification) landed **nowhere**. The "6/13 landed" framing is consistent: the engineering half discharged, the domain half orphaned.

---

## §5 — fourier-B.W4 impact confirmation

**The W4 `colors.ts`/`easings.ts` gut has NO value.js target. Fallback-primary is the only honest path.**

Live fourier-side state (`~/Programming/fourier-analysis/web/`):
- `web/src/lib/colors.ts` — **exists** (3476 bytes; defines `VIZ_COLORS` etc.). There is **no library `Palette` to import it onto** (§1). The planned "gut `colors.ts` onto value.js `Palette`" has no landing surface.
- `web/src/lib/easings.ts` — **exists** (4685 bytes); `generateCurveSVGPath(fn, n=32)` at line 89 is fourier's **own** SVG-path sampler. value.js's `sampleToSVGPath` is **ABSENT** (§2), so this primitive must stay fourier-internal — there is nothing to re-point onto.
- value.js pin: `web/package.json:18` → `"@mkbabb/value.js": "file:../../value.js"` (local file link, now resolving to v0.10.0). The surface fourier *can* consume already exists and is rich (`parseCSSColor`, `color2`, `mixColors`/`mixColorsN`, gamut mapping, easings) — none of which is the `Palette`/`colorScale`/`sampleToSVGPath` trio.

**Confirmation of the C/FINAL.md §5 impact statement against live reality:**
1. fourier-B.W4's fallback contract **is** the primary path — confirmed; W4 collapses to the admin/store re-point only, no cross-repo `Palette` import.
2. `colors.ts` does **not** gut onto a value.js `Palette` — confirmed; the file is HELD (not gutted), correctly recorded as a named B-residual.
3. `easings.ts` `generateCurveSVGPath` stays as fourier's own primitive — confirmed; value.js will not materialise `sampleToSVGPath`.
4. The cross-repo dependency is **severed, not delayed** — confirmed; C is RETIRED, no future value.js wave (H rejects new architectural axes) owns the library-`Palette` work absent a fresh user re-mandate.

**The W4.b agent's work is PROGRESS-residual only**: holding `colors.ts`/`easings.ts` as named B-residuals (not gutting them) is correct and final. There is no value.js artefact to converge onto; the fallback-primary posture is not a degraded path — it is the only structurally honest one, because the target it would have replaced was never built.

---

## Report-back summary

- **Orphan CONFIRMED: YES.** `src/palette/` and `api/src/crud/` both absent (find errors); value.js @ `16129e0` / v0.10.0; C/FINAL.md = RETIRED.
- **`colorScale` verdict: ABSENT** (zero grep hits across `src/`+`api/`). **`sampleToSVGPath` verdict: ABSENT** — only the bezier-specific `cubicBezierToSVG` exists in `src/math.ts`, never generalised.
- **W4 fallback-primary is the only honest option: CONFIRMED.** No library `Palette` to import; `colors.ts`/`easings.ts` correctly held as B-residuals; cross-repo dependency severed, not delayed.
