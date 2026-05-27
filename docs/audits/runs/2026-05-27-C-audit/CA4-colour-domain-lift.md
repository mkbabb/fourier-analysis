# CA4 — Colour-Domain Lift design (the headline B residual)

**Lane**: fourier-analysis tranche-C DEVELOPMENT, audit lane CA4 (planning only — one deliverable, no source edits, no commits).
**Date**: 2026-05-27.
**Subject repos**: `~/Programming/fourier-analysis/web/src/lib/{colors,easings}.ts` (consumers) + `~/Programming/value.js` @ v0.10.0 (lift target).
**Charter**: design the precise shape of the colour-domain lift B deferred onto value.js's never-built library `Palette` / `colorScale` / `sampleToSVGPath`. value.js-C is RETIRED (R2 §1 absence proofs confirmed live). This audit asks: what is the *honest* minimal lift, and what stays in fourier as app-glue.

**Prior-art anchors read**: `docs/tranches/B/research/R2-valuejs-surface.md` (orphan confirmation + live surface), `coordination/CRUD-CONTRACT.md §9` (R3 disposition table — `Palette`/`colorScale`/`sampleToSVGPath` rows held as `library`-latent, "0 library" counted), `B.md:41` (Invariant 15 verbatim), `B.md:43` (Invariant 16 verbatim).

---

## §0 — Method & ground truth

Read every symbol in `colors.ts` (117 L) and `easings.ts` (127 L); enumerated all consumers via `git grep`; read `value.js/src/index.ts` (the 307-line public barrel), `src/math.ts`, `src/units/color/{dispatch,mix,index}.ts`, `src/parsing/color.ts`. Confirmed:

- value.js v0.10.0 ships **no** library `Palette` domain type, **no** `colorScale`, **no** `sampleToSVGPath` (R2 §2; re-grepped). The api-side `Palette` (`api/src/models.ts:66`) is a **persisted Mongo doc**, not a domain type.
- value.js **does** ship the full colour *operations* substrate a `Palette` would compose from: `parseCSSColor`, `color2` (dispatch convert across 15 spaces), `OKLCHColor` class, `mixColors`/`mixColorsN(colors, weights?, space="oklab", hueMethod="shorter")`, `interpolateHue`, `gamutMap`/`gamutMapOKLab`, `getOklchLightness`, `Color.toString()` (emits CSS), plus `math.ts` `lerp`/`scale`/`clamp` and the bezier-specific `cubicBezierToSVG(x1,y1,x2,y2)`.
- Invariant 15 (`B.md:41`): *domain type + pure ops in the library; storage/ownership/slug-addressing in the app; no persistence/db/http in value.js.* Testable gate: `grep -rE "mongodb|express|hono|fetch\(" value.js/src/` → zero.
- Invariant 16 (`B.md:43`): *shared by contract + per-language utility modules; frameworks rejected.* A library colour *type* is **not** a framework (no control inversion, no codegen, no lifecycle ownership) — so it is admissible *if* it is genuine domain logic, not app-glue dressed up.

---

## §1 — Disposition table (every symbol)

### `colors.ts` (117 L)

| symbol | domain-or-glue | lift-target | rationale |
|---|---|---|---|
| `STATIC` (golden/rainbow/pink/emerald consts) | **glue** | keep-in-fourier | Brand palette of *this* app's viz. Not domain logic. |
| `cssVarToHex(varName)` | **glue** | keep-in-fourier | Reads `getComputedStyle(document.documentElement)` — **DOM-bound**. Cannot enter value.js (no DOM dependency in the lib; would also violate the spirit of inv-15's "no app environment in lib"). Its *internal* hsl/rgb→hex parsing duplicates value.js, but the CSS-var read is pure app-glue. |
| `hslToHex(h,s,l)` | **dup** | delete-as-dup | Exact duplicate of `parseCSSColor("hsl(...)")` → `color2(c,"srgb")` → `.toString()`. value.js owns HSL→sRGB. Inline this into `cssVarToHex`'s body via the lib. |
| `rgbToHex(r,g,b)` | **dup** | delete-as-dup | Duplicate of `color2`/serialize path. The 6 lines of manual hex padding are reproducible from `RGBColor(...).toString()` + a hex formatter, but see KISS note §5 — this is trivial enough that *not* lifting is defensible. Flagged dup, low-priority delete. |
| `VIZ_COLORS` (reactive obj) | **glue** | keep-in-fourier | Vue `reactive()` brand-token store. Framework-bound (Vue), app-specific keys (`fourier`/`chebyshev`/`legendre`). Stays. |
| `resolveVizColors()` | **glue** | keep-in-fourier | Reads `--viz-*` CSS vars + writes the reactive store. DOM + Vue + app tokens. Stays. |
| `hexToRgba(hex, alpha)` | **dup** (mild) | keep-in-fourier (or delete-as-dup) | Reproducible via `parseCSSColor(hex)` → set alpha → `.toString()`, but the consumers (`BasisCanvas`, `epicycles`, `golden-shimmer`) call it in **hot canvas-draw paths** where a 3-line string template is materially cheaper than a parse+convert+serialize round-trip. Keep as a perf-justified glue helper. |
| `hexToRgb(hex)` | **dup** (mild) | keep-in-fourier | Same reasoning — `[r,g,b]` extraction, hot path. Reproducible via lib but not worth the allocation. Keep. |

**colors.ts verdict: 0 genuine domain symbols. 4 glue (stay), 1 DOM-glue (stay), 2 dup (delete-able), 2 mild-dup (keep on perf grounds).** There is **no `Palette` hiding in `colors.ts`** — it is a brand-token + DOM-resolution module end to end.

### `easings.ts` (127 L)

| symbol | domain-or-glue | lift-target | rationale |
|---|---|---|---|
| `EasingFn`, `EasingPreset` (types) | glue | keep-in-fourier | Thin app types; `EasingFn = (t)=>number` is already value.js's `TimingFunction` shape — re-export, don't redefine. |
| `EASING_LABELS` | **glue** | keep-in-fourier | Human-facing UI strings for *this* app's morph picker. Presentation. Stays. |
| `EASING_PRESETS` | glue | keep-in-fourier | Curated subset of value.js `timingFunctions` + labels. App curation. Stays (already backed by lib `timingFunctions`). |
| `EASING_PRESET_NAMES` | glue | keep-in-fourier | `Object.keys` of the above. Stays. |
| `getEasingFn(name)` | glue | keep-in-fourier | App lookup with linear-fallback. Stays. |
| `AnimationEasingName`, `ANIMATION_EASINGS` | **glue** | keep-in-fourier | App's compact in-out subset + `description` UI copy. Presentation. Stays. |
| `generateCurveSVGPath(fn, n=32)` | **DOMAIN** | **lift → value.js `sampleToSVGPath`** | This is the **one true domain symbol**: "sample an arbitrary `fn` at `n+1` points → SVG path `d` string." Pure, generic, framework-free. value.js already has the bezier-specific `cubicBezierToSVG`; this generalises it. This is the load-bearing lift. |
| `_svgCache` | glue | keep-in-fourier | App-level memo of *this* app's curve previews. Stays. |
| `getEasingSVGPath(name)` | glue | keep-in-fourier | Caches `generateCurveSVGPath(ANIMATION_EASINGS[name].fn)`. App-specific. Stays — but its **body** re-points onto the lifted `sampleToSVGPath`. |
| `easingCurvePath(name)` | **glue, dup-of-self** | keep-in-fourier (collapse) | Second SVG sampler — same algorithm as `generateCurveSVGPath` but hardcoded to a 40×20 viewBox with `steps=24`. **Internal duplication**: it should be re-expressed as `sampleToSVGPath(fn, 24)` mapped into the viewBox. Domain core lifts; viewBox transform stays app-side. |

**easings.ts verdict: 1 genuine domain symbol (`generateCurveSVGPath` → `sampleToSVGPath`). The rest is app presentation/curation glue, plus 1 internal duplicate (`easingCurvePath`) that collapses onto the lifted primitive.**

### Aggregate count

- **Domain (lift to value.js): 1** — the generic SVG sampler (`generateCurveSVGPath` → `sampleToSVGPath`).
- **Glue (stay in fourier): 14** — all brand tokens, Vue reactives, DOM reads, UI labels, app caches, hot-path hex helpers.
- **Dup (delete-as-dup): 2 hard** (`hslToHex`, `rgbToHex`) **+ 2 mild** (`hexToRgba`, `hexToRgb` — keep on perf grounds) **+ 1 internal** (`easingCurvePath` collapses onto the lifted primitive).
- **`Palette` domain symbols found in either file: ZERO.** The B charter's premise — that a `Palette` lives latent in `colors.ts` waiting to be lifted — does **not hold**. `colors.ts` is brand tokens + DOM glue, not a palette domain object.

---

## §2 — `Palette` domain type design (the speculative axis)

A *bona fide* library `Palette` would be a value-object over an ordered list of colour stops, with pure construct/validate/interpolate/sample/serialize/gamut-map ops. Parent colour space **OKLCh** per prior H5 hardening (value.js's CSS-L4-recommended space; `OKLCHColor` exists). Design, for completeness:

```ts
// value.js: src/units/color/palette.ts  (NEW module, lib-side)
export interface PaletteStop {
    color: Color;     // any value.js Color; canonicalised to OKLCh on construct
    position: number; // [0,1], monotonic non-decreasing
}

export class Palette {
    readonly stops: readonly PaletteStop[];   // sorted, validated, OKLCh-canonical
    readonly space: ColorSpace;               // interpolation space, default "oklch"
    readonly hueMethod: HueInterpolationMethod; // default "shorter"

    // — construct —
    static fromStops(stops: PaletteStop[], space?, hueMethod?): Palette;
    static fromColors(colors: Color[], space?, hueMethod?): Palette; // even spacing
    static fromCSS(s: string): Palette;        // parse `gradient(...)`-ish or csv

    // — validate (pure, throws or returns issues) —
    validate(): void;                          // monotonic positions, ≥1 stop, in-gamut-able

    // — interpolate / sample —
    at(t: number): Color;                      // single sample, OKLCh-interpolated
    sample(n: number): Color[];                // n evenly-spaced samples
    interpolate(t: number): Color;             // alias of at()

    // — gamut —
    gamutMap(target?: ColorSpace): Palette;    // map every sampled colour into gamut

    // — serialize —
    toCSS(): string;                           // CSS color stops / gradient string
    toJSON(): { stops: {color:string; position:number}[]; space; hueMethod };
    static fromJSON(j): Palette;
}
```

Every operation is **pure** and composes from already-shipped primitives: `color2` (canonicalise to OKLCh), `mixColorsN`/`mixColors`+`interpolateHue` (the `at`/`sample` core), `gamutMap` (the gamut op), `Color.toString()` (`toCSS`). No new colour math is invented — `Palette` is purely a *container + sampler* over the existing operation set.

**How it differs from value.js's api-side persisted `Palette`** (`api/src/models.ts:66`): the api doc is a **storage record** — string-slug `_id`, `colors`/`oklabColors` string arrays, `tags`/`voteCount`/`sessionToken`/`userSlug`/`status`/`forkOf`/`versionCount`. That is persistence + ownership + slug-addressing — explicitly **app/api layer per Invariant 15**. The library `Palette` above has **no** id, owner, votes, or status; it is the pure domain value the api doc would *serialize from* (`Palette.toJSON()` feeds `colors`/`oklabColors`; the api adds the storage envelope). This is exactly the inv-15 split: domain in lib, persistence in app. The B-planned `Palette → PersistedPalette` rename is the same idea.

**The honest caveat (carried to §5):** *fourier does not currently have a single consumer that needs this `Palette`.* `colors.ts` is brand tokens, not gradients/stops. `VIZ_COLORS.rainbow` is the *only* multi-stop array, and nothing samples it as a scale. So this type is **specified-but-not-pulled** by fourier-C.

---

## §3 — `colorScale` + `sampleToSVGPath` signatures & homes

### `sampleToSVGPath` — the one warranted lift

```ts
// value.js: src/math.ts  (generalises the existing cubicBezierToSVG at line 69)
/**
 * Sample fn at n+1 evenly-spaced points over [0,1] and emit an SVG path
 * `d` string. Pure; no DOM. The y-flip / viewBox transform is the caller's.
 */
export function sampleToSVGPath(
    fn: (t: number) => number,
    n = 32,
    opts?: { precision?: number; flipY?: boolean },
): string;
```

Home: **`src/math.ts`**, exported from the barrel alongside `cubicBezierToSVG`/`cubicBezierToString`. `cubicBezierToSVG` becomes a thin specialisation (`sampleToSVGPath(t => cubicBezier(t,…)[1], 1000)`), eliminating its hand-rolled `for t += 0.001` loop. This is a **genuine math primitive**, framework-free, sub-30-LOC — squarely inside Invariant 16's "library, not framework" line. It directly absorbs fourier's `generateCurveSVGPath`.

### `colorScale` — the borderline lift

```ts
// value.js: src/units/color/palette.ts  (or a one-liner sugar over Palette)
/** Evaluate an N-stop colour scale at parameter t ∈ [0,1]. */
export function colorScale(
    stops: (Color | PaletteStop)[],
    t: number,
    opts?: { space?: ColorSpace; hueMethod?: HueInterpolationMethod },
): Color;
```

Home: **`src/units/color/`** (new `palette.ts`, or fold into `mix.ts`). Body is `mixColorsN` with positions resolved to weights — i.e. it is **sugar over `mixColorsN` + `interpolateHue`**, which already exist. **Whether to lift it at all is the §5 question.**

---

## §4 — fourier consumer shape post-lift + invariant compliance

**`easings.ts` post-lift** (the real change):
- `generateCurveSVGPath` → **deleted**; its body replaced by `import { sampleToSVGPath } from "@mkbabb/value.js"`.
- `getEasingSVGPath` body → `sampleToSVGPath(ANIMATION_EASINGS[name].fn)` (cache wrapper stays).
- `easingCurvePath` body → `sampleToSVGPath(fn, 24)` post-processed into the 40×20 viewBox (the viewBox transform is app-glue, stays).
- Everything else (`EASING_PRESETS`, `ANIMATION_EASINGS`, labels, `getEasingFn`) stays — it is app curation. `easings.ts` shrinks ~10 LOC, not deleted, **not a re-export shim**.

**`colors.ts` post-lift:** essentially **unchanged**. Optionally fold `hslToHex`/`rgbToHex` into `cssVarToHex` via lib calls (saves ~15 LOC, marginal). The file is **not** a re-export shim and is **not** deleted — there is no `Palette` here to re-point. It stays as fourier's brand-token + DOM-resolution module. The B charter's "gut `colors.ts`" was premised on a `Palette` that the file does not contain; R2 §5 already recorded this ("`colors.ts` is HELD, not gutted, correctly").

**Consumer surface unchanged for callers:** all 16 import sites (`VIZ_COLORS`, `hexToRgba`, `EASING_PRESETS`, `getEasingSVGPath`, etc.) keep their current import paths. The lift is *internal* to `easings.ts`'s implementation; no consumer re-points.

**Invariant 15 compliance:** the `Palette` type (if built) + `colorScale` + `sampleToSVGPath` are all pure domain/math — no persistence, no db, no http. Gate `grep -rE "mongodb|express|hono|fetch\(" value.js/src/` stays zero. ✓ The DOM-bound `cssVarToHex`/`resolveVizColors` correctly **stay in fourier** (lib must not touch the DOM) — this is inv-15-compliant by *exclusion*. ✓

**Invariant 16 compliance:** `sampleToSVGPath` and `colorScale` are *called-from* functions — no control inversion, no codegen, no lifecycle ownership. They are library functions, not a framework. ✓ A `Palette` *class* is a value-object, still not a framework. The R3 disposition table (`§9`) already classes these rows as `library` (held latent). Lifting `sampleToSVGPath` realises one of those rows without opening any framework surface.

---

## §5 — KISS guard: minimal honest version

**Is this a genuine domain lift or scope-creep?** *Mostly scope-creep, with one genuine kernel.*

The B charter framed "the colour-domain lift" as gutting `colors.ts` onto a library `Palette`. **The disposition table (§1) shows `colors.ts` contains zero `Palette`-shaped domain logic** — it is brand tokens + DOM reads. R2 §5 already reached this verdict ("no value.js target; fallback-primary is the only honest path"). Building a `Palette` type to absorb `colors.ts` is solving a problem fourier does not have: **fourier has no gradient/scale consumer**. `VIZ_COLORS.rainbow` is never sampled as a scale.

**The one genuine kernel:** `easings.ts`'s `generateCurveSVGPath` *is* real, generic, pure domain code that (a) duplicates a fourier-internal sibling (`easingCurvePath`) and (b) generalises an existing value.js primitive (`cubicBezierToSVG`). Lifting it to `sampleToSVGPath` in `src/math.ts` is a clean, ~25-LOC, framework-free, immediately-consumed win that also de-dups value.js's own bezier path emitter. **This lift is warranted.**

**Minimal honest version (recommended):**
1. **LIFT `sampleToSVGPath(fn, n)` → `value.js/src/math.ts`** (generalise `cubicBezierToSVG`). fourier's `easings.ts` consumes it; `easingCurvePath` collapses onto it. ← *the entire honest lift.*
2. **DEFER `Palette` + `colorScale`** as specified-but-not-pulled. Keep them as latent affordances (exactly as `CRUD-CONTRACT.md §9` already holds them — "0 library counted, held as cohort-latent"). Do **not** build a `Palette` class with no fourier consumer; that is the "library nobody calls" anti-pattern, KISS-rejected. Build it the day a real gradient/scale consumer lands (image-quantize palette UI, or a `colorScale`-driven heatmap).
3. **Optionally** delete `hslToHex`/`rgbToHex` dups inside `cssVarToHex` (marginal; defensible to skip).

**Verdict: the full lift is NOT warranted. The KISS answer is a narrow lift — `sampleToSVGPath` only.** The `Palette`/`colorScale` axis is real domain modelling but premature for fourier; it stays a specified, un-pulled affordance until a consumer exists. This also keeps value.js-C's RETIRED status honest: C tries to land *one* pure math primitive both repos can use, not resurrect the whole orphaned `Palette` charter on spec.
