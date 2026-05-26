# H5 — value.js-C plan + value.js A/B deep-read

**Date**: 2026-05-18
**Agent**: H5 — hardening, read-only.
**Scope**: value.js-C close-lineage verification; C.md §5 critical-files inventory verification; `Palette` type proposal; `migrate-palette-schema.ts` shape; gaps in C.md against value.js reality; cross-repo timing.
**Citations are `repo-relative-path:line` against `/Users/mkbabb/Programming/value.js/` unless prefixed `fourier-analysis/`.

---

## §1 — Close-lineage verification

### §1.1 — A → B → C is canonical for value.js

Confirmed. Three independent attestations agree:

- `docs/tranches/A/A.md:8` declares A as "first tranche authored in this repo" (no predecessor).
- `docs/tranches/B/B.md:4` declares B "Successor to: A (value.js HEAD `191d66a` at B open; A.W0–W4 closed; A.W5 uncommitted; A.W6/W7 planned-not-run)". A is in-flight at B open — its close lands inside B.W0 (`docs/tranches/B/B.md:39`).
- `docs/tranches/C/C.md:4` declares C "Successor to: B — value.js's close-A-and-simplify tranche (in flight at 2026-05-18, planning-only at this authoring). C opens only after B close. (A close lands inside B.W0; the close lineage is therefore A → B → C.)"

### §1.2 — B's invariant B1 does not preclude C from opening

`docs/tranches/B/B.md:29` defines B1 as: "Close A before opening new structural work. B.W1 through B.W5 do not run while A.W5/W6/W7 are open. B.W0 closes A honestly; only then does B's own structural work proceed."

B1 binds **B's own** wave order (B.W1..B.W5 wait on A close). It does not forbid a successor tranche C from being authored or opening after B closes. C.md is explicit that C opens "TBD (after value.js-B close AND fourier-B's joint research+challenge close)" (`docs/tranches/C/C.md:7`), which honours B1 by waiting on B's close, not preempting it.

**Verdict: B1 does not preclude C; C correctly waits on B's close gate.**

### §1.3 — B's close artefact list is well-defined and does not implicitly start CRUD work

B.W5 (the close ceremony) and B.W4 (the library audit) were the most plausible cross-leakage candidates. Reviewed:

- `docs/tranches/B/waves/B.W4.md:14-26` — Lane A is a **READ-ONLY** library gap audit producing `audit/B.W4-library-gap.md`. Explicitly: "The audit is read-only; any actionable items become B's call after the audit lands." (line 24). Lane B does WIP disposition on `src/parsing/**` + `src/units/interpolate.ts` — none of these are palette / colorScale / sampleToSVGPath territory.
- `docs/tranches/B/waves/B.W5.md` — pure close ceremony: FINAL.md, doc-drift, integrity sweep. No `api/` or `palette-api` touch (`grep -n "CRUD\|palette-api\|formatPalette\|api/src" B.W5.md` returns nothing).
- `docs/tranches/B/B.md:81-84` — B's out-of-bounds list pins: "104-error shadcn-vue generated cluster" (deferred), "glass-ui-side variant/primitive ships" (Q's), "8 keyframes.js / coord-Q overlap" (A's). No `api/src/**` work is in-scope.
- `docs/tranches/B/findings.md:127-129` — items routed to "potential value.js tranche C scope" are named explicitly, never silently deferred. CRUD work is one such named destination.

**Verdict: B's FINAL.md artefact list at close is well-defined and does not implicitly start CRUD work.** B closes on `src/` cohesion + WIP + typecheck + e2e + doc drift; nothing in `api/src/` or in the `Palette` domain.

### §1.4 — One small lineage clarification needed in C.md

`docs/tranches/C/C.md:7` says C opens after "value.js-B close AND fourier-B's joint research+challenge close." But C.md §3 W0 (line 39) closes on "value.js-B confirmed closed; fourier-B joint Wα + Wχ artefacts cited; `CRUD-CONTRACT.md` ratified by joint sign-off." The contract is ratified at fourier-B.W1, **after** Wχ. The constellation timing diagram (`docs/tranches/C/coordination/CRUD-CONSTELLATION.md:69-87`) and fourier's own constellation (`fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:84-89`) say the same thing: C opens after value.js-B close + fourier-B.W1 ratify.

The C.md §opening prose is one step earlier than the actual gate. **Recommendation**: C.md:7 should read "Open: TBD (after value.js-B close AND fourier-B.W1 ratify)" to match §3.W0 and the constellation diagrams. This is a 1-line wording fix, not a structural problem.

---

## §2 — Critical-files inventory verification (C.md §5)

C.md §5 (`docs/tranches/C/C.md:63-74`) lists files by surface. Each row was opened and verified:

| C.md surface | C.md claim | Verified state | Verdict |
|---|---|---|---|
| Library — Palette type | `src/index.ts`, `src/transform/**`, `src/parsing/**` | `Palette` type does NOT exist in `src/`. `grep -rn "interface Palette\b\|type Palette\b" src/` returns nothing (`src/quantize/index.ts:55` has a `sortPalette` helper only). The 355-line `src/index.ts` (verified read) re-exports colour, parsing, math, easing, transform; no `Palette` symbol. | **ACCURATE — confirmed gap.** |
| Library — `colorScale` | `src/transform/**`, public re-exports | `src/transform/` contains only `decompose.ts` (matrix decomposition) + `CLAUDE.md`. No `colorScale` symbol anywhere in `src/`. `grep -rn "colorScale" src/` returns nothing. | **ACCURATE — confirmed gap.** |
| Library — `sampleToSVGPath` | `src/easing.ts` (generalises the cubic-bezier sampler) | `src/easing.ts` is 497 lines. `src/math.ts:68-83` ships `cubicBezierToSVG(x1, y1, x2, y2)` (already public via `src/index.ts:224`). A generic `sampleToSVGPath(fn, n)` does NOT exist. C.md says "generalises the cubic-bezier sampler" — but the sampler is in `src/math.ts`, not `src/easing.ts`. **Inventory row points at the wrong file.** The generalisation idea is sound; the file pointer is misaligned. | **PARTIALLY INACCURATE — file pointer should be `src/math.ts` or "math + easing".** |
| palette-api — `formatPalette` ?? fallback | `api/src/routes/palettes.ts` (retire `formatPalette` `??` fallback) | `api/src/routes/palettes.ts:11-27` carries the exact pattern with the comment "Ensure new fields always have defaults for pre-migration documents" — fields `tags`, `versionCount`, `forkCount`, `forkOf`, `forkOfHash`, `currentHash`, `oklabColors`. **All seven `??` defaults present.** | **ACCURATE.** |
| palette-api — facility | `api/src/slugWords.ts`, `routes/{sessions,admin}.ts`, `cron.ts`, `hash.ts`, `db.ts`, `middleware.ts` | All files present (`ls api/src/`): `slugWords.ts`, `cron.ts`, `db.ts`, `hash.ts`, `middleware.ts`, `types.ts`, `migrate-oklab.ts`, `migrate-slugs.ts`, plus `routes/`. `api/src/types.ts` is **5 lines only** — it exports a single `AppEnv` type; it carries no `Palette` doc shape (palette shapes are inline in `routes/palettes.ts`). | **ACCURATE — except `types.ts` is much smaller than the §5 wording suggests; the "Palette doc shape matches library + contract" work in W2 is essentially a new authoring, not an edit.** |
| palette-api — migration | `api/src/migrate-palette-schema.ts` (create) | Does not exist. `migrate-slugs.ts` (74 lines) and `migrate-oklab.ts` (85 lines) exist as the `@mkbabb` precedent. | **ACCURATE.** |
| Demo — palette-browser | `demo/@/components/custom/palette-browser/**` | Directory exists; **38 entries** at top level (`ls`); **43 files total** including `composables/` (6 files). Files: 36 SFCs + `composables/` subdir + `index.ts`. The consumer surface is non-trivial. | **ACCURATE (count: 38 entries / 43 files).** |
| Demo — color-picker | `demo/color-picker/**` | `App.vue` (298 lines), `index.html`, `vite.d.ts`, `public/`. Top-level is small — most logic lives in `demo/@/composables/`. | **ACCURATE but light — most palette wiring is in `demo/@/composables/palette/usePaletteManagerWiring.ts` and `usePaletteManager.ts`, not in `color-picker/`.** |
| Demo — hero-lab | `demo/hero-lab/**` | `App.vue`, `index.html`, `hero-lab.css`, `components/` (6 SFCs), `lib/` (`helpers.ts`, `types.ts`, `palettes.ts`). `lib/palettes.ts:3-` defines `HERO_PALETTES: HeroPalettePreset[]` — a **separate type** from the demo `Palette` type. `lib/types.ts:3-12` declares `HeroPalettePreset { id, label, description, surface, surfaceAlt, shadow, tileStops, atmosphereStops }`. | **ACCURATE — but hero-lab's `HeroPalettePreset` carries demo-specific fields (surface/shadow); it is NOT a `Palette` in the C-proposed sense. W3 will need to either compose the library `Palette` inside `HeroPalettePreset` or replace it. C.md does not name this distinction.** |

### §2.1 — Inventory gap: the demo ALREADY HAS a `Palette` interface

This is the biggest miss in C.md §5.

`demo/@/lib/palette/types.ts:1-28` defines:

```ts
export interface PaletteColor { css: string; name?: string; position: number; }

export interface Palette {
    id: string;
    name: string;
    slug: string;
    userSlug?: string;
    colors: PaletteColor[];
    oklabColors?: { L: number; a: number; b: number }[];
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    isLocal: boolean;
    voted?: boolean;
    voteCount?: number;
    status?: "published" | "featured";
    currentHash?: string;
    versionCount?: number;
    forkOf?: string | null;
    forkOfHash?: string | null;
    forkCount?: number;
}
```

This is consumed by ≥ 14 files I verified (sample: `demo/@/composables/palette/{usePaletteStore,useBrowsePalettes,usePaletteActions,useSlugMigration,usePaletteExport,usePaletteManager}.ts`, `demo/@/composables/auth/useAdminUsers.ts`, `demo/@/components/custom/mix/MixSourceSelector.vue`). The demo also already ships `demo/@/lib/palette/mix.ts` (`mixPalettes(palettes, options)`), `export.ts`, `api.ts`, `utils.ts:14 createSlug(name)`.

The demo's `Palette` is **API DTO shape** — slug, voteCount, forkOf, isLocal, status. This is the persistence wire-shape, not a pure library domain type. C.md §1 ¶17.1 says "fourier's `colors.ts` and value.js's demo both consume this type; neither rebuilds it" — but **value.js's demo already has it**, and the new library `Palette` will need to be a DIFFERENT shape (pure domain, no `isLocal`/`voteCount`/`slug`). The migration story is therefore:

- Library: ship pure `Palette` (stops + ramps + ops, no identity / no persistence).
- Demo: keep `SavedPalette` (or rename existing `Palette` → `PersistedPalette`) for the API DTO, **compose** the library `Palette` as the inner content.
- API: same composition — `palettes` collection row carries `{ slug, ...metadata, content: LibraryPalette }`.

**This is a critical refactor C.W1/W3 must own and C.md does not name.** The demo `Palette` rename / refactor is consumer-side churn that touches 14+ files.

### §2.2 — The demo also has `mixPalettes` already

`demo/@/lib/palette/mix.ts:70-102` ships `mixPalettes(palettes, options)`. This is exactly a `colorScale`-adjacent primitive (palette-level mixing across N palettes with strategies). C.W1's `colorScale(stops, t)` is finer-grained — single-palette sampling at parameter `t` — but the relationship is non-trivial. `mixPalettes` already calls `mixColorsN` (the library function), so C.W1 could express `colorScale` as `mixColorsN([stops[i], stops[i+1]], [1-t', t'])` underneath. **C.md does not acknowledge `mixPalettes` exists; W1 needs an explicit cohabitation plan: either `mixPalettes` moves to the library and depends on `colorScale`, or it stays in demo and consumes `colorScale`.**

### §2.3 — The demo has a CSS-string ↔ raw-color shim (`color-utils.ts`)

`demo/@/lib/color-utils.ts:21-` ships `cssToRawColor(css, space)` and `rawColorToCSS(color, outputSpace?)`. This exists because library `mixColors` / `color2` operate on `Color<number>` (raw numeric components, normalized [0,1]), not on CSS strings. A library `colorScale(stops, t)` where `stops` are CSS strings would either need to internalize this shim or be defined against raw `Color` objects (consistent with the library but inconvenient at call sites). **C.W1 must decide the signature with this shim in mind**; the easiest convergence is: ship `colorScale<C extends Color>(stops: C[], t: number, opts?: …): C` operating on library `Color`, and let the demo's existing `cssToRawColor`/`rawColorToCSS` wrap it. The shim might itself promote into the library (a public `colorFromCSS`/`colorToCSS` pair) — see §5 gaps.

---

## §3 — Sharpened `Palette` type proposal (substrate for C.W1)

### §3.1 — Parent colour space: OKLCh (with justification)

The user constellation question (`docs/tranches/C/research/README.md:21`) asks whether `Palette` should compose over `LCh` or `OKLCh`. Recommendation: **OKLCh**.

Justification, grounded in extant value.js code:

1. **Library default for mixing is OKLab** (`src/units/color/mix.ts:31` — `mixColorsN(..., space: ColorSpace = "oklab", ...)`; `src/units/color/utils.ts:1098` — `mixColors(..., space: "oklab", ...)`). The library has already committed to the OKLab family for interpolation.
2. **`palette-api` server-side colour search is OKLab** (`api/src/routes/palettes.ts:48-93` — `cssToOklab()`; `api/src/migrate-oklab.ts:8-45` — same).
3. **OKLCh is OKLab in polar form** (`src/units/color/utils.ts:142-145` — `oklab2oklch/oklch2oklab`). Same colourimetry, but the *hue* axis lets `Palette` interpolation use the library's existing `HueInterpolationMethod` ("shorter"/"longer"/"increasing"/"decreasing") for hue ramps. OKLab cartesian interpolation does not have this affordance.
4. **`gamutMapOKLab` ships** (`src/index.ts:206` — `gamutMapOKLab`). Gamut-safe operations on `Palette` reduce to library calls without new machinery.
5. **LCh is CIE 1976 Lab**, which has the well-documented perceptual non-uniformity OKLab corrects. Choosing LCh over OKLCh would re-introduce a fault the library has already paid down.
6. **Storage compatibility**: `Palette` serde to JSON does NOT have to be OKLCh — stops can serialize as CSS strings (`#rrggbb`, `oklch(...)`, `rgb(...)`) and parse-on-load. OKLCh is the *internal* working space.

### §3.2 — Concrete TypeScript signature

Land at `src/palette/index.ts` (new directory; pattern matches `src/transform/`, `src/quantize/`, `src/parsing/`). Re-exported from `src/index.ts` barrel.

```ts
// src/palette/types.ts

import type { OKLCHColor, Color } from "../units/color";
import type { ColorSpace } from "../units/color/constants";
import type { HueInterpolationMethod } from "../units/color/utils";

/**
 * One named stop in a Palette.
 *
 * `position` is in [0, 1]. `color` is parsed and resolved to OKLCh
 * eagerly on construction (Palette is the working space; serde is
 * separate). `name` is an optional designer-supplied label.
 */
export interface PaletteStop {
    readonly position: number;
    readonly color: OKLCHColor<number>;
    readonly name?: string;
}

/**
 * An optional named ramp — a sub-sequence of stops carrying a role.
 * Example: { name: "accent", stopIndices: [3, 4, 5] }. Empty `ramps`
 * is the common case.
 */
export interface PaletteRamp {
    readonly name: string;
    readonly stopIndices: readonly number[];
}

/**
 * The library Palette — a pure ordered colour-stop sequence in OKLCh.
 * No persistence, no identity (slug/id/owner live in consuming apps).
 *
 * Construction is value-typed: stops are sorted on `position`, colours
 * are converted to OKLCh on input. The instance is immutable; operations
 * return new instances.
 *
 * Cohort invariant 15 (Domain in lib, persistence in app).
 */
export class Palette {
    readonly stops: readonly PaletteStop[];
    readonly ramps: readonly PaletteRamp[];

    constructor(stops: PaletteStop[], ramps?: PaletteRamp[]);

    /** Construct from CSS strings. Throws on parse failure. */
    static fromCSS(
        colors: ReadonlyArray<{ css: string; position?: number; name?: string }>,
        ramps?: PaletteRamp[],
    ): Palette;

    /** Sample at parameter t ∈ [0,1]. Cylindrical hue interp via `hueMethod`. */
    sample(t: number, hueMethod?: HueInterpolationMethod): OKLCHColor<number>;

    /** Resample to N evenly-spaced stops (lossy; new Palette). */
    resample(n: number, hueMethod?: HueInterpolationMethod): Palette;

    /** Project every stop into `space`, returning Color<number> array. */
    toSpace(space: ColorSpace): Color<number>[];

    /** CSS-string list, one per stop, in the target output space. */
    toCSS(outputSpace?: ColorSpace): string[];

    /** Gamut-map every stop to sRGB (uses gamutMapOKLab under the hood). */
    toSRGBSafe(): Palette;

    /** JSON serde (lossless if stops were CSS; OKLCh-numeric otherwise). */
    toJSON(): PaletteJSON;
    static fromJSON(data: PaletteJSON): Palette;

    /** Structural equality on stops + ramps. */
    equals(other: Palette): boolean;
}

/**
 * Serde format. CSS strings are preferred (lossless designer intent);
 * raw OKLCh triples are accepted as a fallback for code-built palettes.
 */
export interface PaletteJSON {
    stops: ReadonlyArray<
        | { css: string; position: number; name?: string }
        | { oklch: [L: number, C: number, h: number]; position: number; name?: string; alpha?: number }
    >;
    ramps?: PaletteRamp[];
}

/**
 * Sample N CSS-string stops at parameter t. The free-function form of
 * Palette.sample, no construction required — for cases where call sites
 * already hold raw stops.
 */
export function colorScale(
    stops: ReadonlyArray<string>,
    t: number,
    opts?: { hueMethod?: HueInterpolationMethod; outputSpace?: ColorSpace },
): string;
```

### §3.3 — `sampleToSVGPath` signature (the second C.W1 primitive)

```ts
// src/math.ts (extends existing cubicBezierToSVG family)

/**
 * Sample a univariate function f: [0,1] → [0,1] and emit an SVG <path d="…"/> string.
 * Generalises `cubicBezierToSVG` — the cubic-bezier sampler becomes
 *   sampleToSVGPath((t) => cubicBezier(t, x1, y1, x2, y2)[1], n).
 *
 * `n` is the number of samples (defaults to 200 — same density as the
 * existing sampler at step 0.001 over [0,1] is 1000; 200 is a sensible
 * default for the easing-curve UI in fourier).
 */
export function sampleToSVGPath(
    fn: (t: number) => number | [number, number],
    n?: number,
    opts?: { viewBox?: [number, number]; format?: "d-attribute" | "full-path-element" },
): string;
```

Justification: fourier's `web/src/lib/easings.ts` ships a hand-rolled sampler for the easing-curve UI that already exists in spirit at `src/math.ts:68-83` (`cubicBezierToSVG`). Generalising via `sampleToSVGPath` lets fourier retire the workaround (cohort invariant 4: substrate with consumer).

### §3.4 — Why this shape, in five sentences

1. **OKLCh internal** because the library's mixing surface is OKLab; OKLCh adds the hue axis needed for designer-grade ramps without a new conversion path.
2. **Stops are immutable** because mutation cascades through the consumer Vue stores; constructor-time normalisation (sort, parse, OKLCh) is the only branchy code path.
3. **No identity fields** (no `slug`, `id`, `owner`, `voteCount`) per invariant 15 — those are the demo's `Palette` (renamed → `PersistedPalette`) wrapping this one.
4. **`fromCSS` is the front door** because every existing caller has CSS strings; raw OKLCh construction is the secondary path.
5. **JSON serde tolerates both CSS strings and raw OKLCh** so designer intent survives a roundtrip and code-built palettes are also expressible.

---

## §4 — `migrate-palette-schema.ts` shape

### §4.1 — Idiom extracted from `migrate-slugs.ts` and `migrate-oklab.ts`

Read both files in full (`api/src/migrate-slugs.ts:1-74`, `api/src/migrate-oklab.ts:1-85`). The shared idiom:

1. **Single file under `api/src/`**, runnable with `npx tsx src/migrate-XXX.ts`.
2. **`dotenv/config` first** to pick up `MONGODB_URI`.
3. **Idempotent by design** — `migrate-slugs.ts:31-36` skips sessions that already have a `userSlug`; `migrate-oklab.ts:53-58` queries only palettes missing `oklabColors`. Re-runs are safe.
4. **Console log progress** — counts (created/skipped/updated) reported.
5. **Top-level `main()` / `migrate()`** wrapped in `.catch(err => { console.error(...); process.exit(1); })`.
6. **Direct Mongo access** — `migrate-oklab.ts` uses `new MongoClient(uri)` directly; `migrate-slugs.ts` reuses `./db.js`'s `getDb`. Either is acceptable; using `getDb` is slightly cleaner (reuses the indexes idempotency).
7. **No transaction** — both are eventual-consistency safe via the idempotent filters.
8. **No reversibility script** — but both are filtered such that a second run is a no-op, which is the migration-safety bar invariant 17 admits.

### §4.2 — Proposed `migrate-palette-schema.ts` shape

Purpose: retire the seven `??` defaults in `formatPalette` (`api/src/routes/palettes.ts:18-26`) by backfilling **all** palettes with the fields, so reads return them without the runtime fallback.

```ts
// api/src/migrate-palette-schema.ts
//
// One-time migration: backfill schema defaults on all palette documents
// so `formatPalette` can stop carrying its `??` per-field fallback.
//
// Usage: npx tsx src/migrate-palette-schema.ts
// Idempotent: only updates documents missing the field; safe to re-run.

import "dotenv/config";
import { getDb, closeDb } from "./db.js";
import { computeContentHash } from "./hash.js";

const DEFAULTS = {
    tags: [],
    versionCount: 1,
    forkCount: 0,
    forkOf: null,
    forkOfHash: null,
    oklabColors: [],          // already migrated by migrate-oklab.ts; included for completeness
    // currentHash: computed per-document, not a static default
} as const;

interface MigrationReport {
    total: number;
    updated: number;
    perField: Record<keyof typeof DEFAULTS, number>;
    hashesComputed: number;
    spotCheck: Array<{ slug: string; before: string[]; after: string[] }>;
}

async function migrate(): Promise<MigrationReport> {
    const db = await getDb();
    const report: MigrationReport = {
        total: 0, updated: 0, hashesComputed: 0, spotCheck: [],
        perField: { tags: 0, versionCount: 0, forkCount: 0, forkOf: 0, forkOfHash: 0, oklabColors: 0 },
    };

    const cursor = db.collection("palettes").find({});
    for await (const doc of cursor) {
        report.total++;
        const update: Record<string, unknown> = {};
        const before: string[] = [];

        for (const [field, defaultValue] of Object.entries(DEFAULTS)) {
            if (doc[field] === undefined) {
                update[field] = defaultValue;
                report.perField[field as keyof typeof DEFAULTS]++;
                before.push(field);
            }
        }

        if (doc.currentHash === undefined || doc.currentHash === null) {
            update.currentHash = computeContentHash(doc.name, doc.colors ?? []);
            report.hashesComputed++;
            before.push("currentHash");
        }

        if (Object.keys(update).length > 0) {
            await db.collection("palettes").updateOne({ _id: doc._id }, { $set: update });
            report.updated++;
            if (report.spotCheck.length < 5) {
                report.spotCheck.push({
                    slug: doc.slug,
                    before,
                    after: Object.keys(update),
                });
            }
        }
    }

    // Post-condition check: no palette should be missing any default field.
    const stillMissing = await db.collection("palettes").countDocuments({
        $or: Object.keys(DEFAULTS).map(k => ({ [k]: { $exists: false } })),
    });
    if (stillMissing > 0) {
        throw new Error(`Migration incomplete: ${stillMissing} palettes still missing one or more default fields`);
    }

    return report;
}

migrate()
    .then(async (r) => {
        console.log(`[migrate-palette-schema] total=${r.total} updated=${r.updated} hashesComputed=${r.hashesComputed}`);
        console.log(`[migrate-palette-schema] perField=`, r.perField);
        console.log(`[migrate-palette-schema] spotCheck=`, JSON.stringify(r.spotCheck, null, 2));
        await closeDb();
    })
    .catch(async (err) => {
        console.error("[migrate-palette-schema] failed:", err);
        await closeDb().catch(() => {});
        process.exit(1);
    });
```

### §4.3 — Why this shape

- **Iterates everything**, not a filter — because we want the *count of palettes missing each field* in the report, which is the backfill verification artefact invariant 17 demands (`docs/tranches/C/C.md:33`).
- **Per-document `$set` only on missing fields** — so re-runs are no-ops once converged.
- **`computeContentHash` reuses `hash.ts`** — no logic duplication; if the hash algorithm changes, this migrator picks it up.
- **Post-condition check** — `stillMissing > 0` throws. The script either completes the convergence or fails loudly. There is no silent partial migration.
- **`spotCheck` sample of 5** is the "spot-check diff" the invariant requires.
- **The `currentHash` backfill** is the only non-static default — included because `formatPalette` currently defaults `currentHash: doc.currentHash ?? null` (`routes/palettes.ts:24`) and the ratified contract should not admit a null content-hash on a real palette.

### §4.4 — Retirement step (paired with the migrator)

After the migrator runs successfully on the production database, the same C.W2 commit deletes lines `routes/palettes.ts:18-26` and writes the bare:

```ts
function formatPalette(doc: any, votedSlugs?: Set<string>): any {
    const { _id, sessionToken, ...rest } = doc;
    return {
        id: _id.toString(),
        ...rest,
        isLocal: false,
        voted: votedSlugs ? votedSlugs.has(doc.slug) : undefined,
    };
}
```

The deletion-proof is the gate per invariant 17 (`docs/tranches/C/C.md:33`).

---

## §5 — Gaps in C.md against value.js reality

Ordered by severity.

### §5.1 — CRITICAL: demo already has `Palette` interface (covered in §2.1)

C.md asserts the library `Palette` is a clean greenfield. In fact `demo/@/lib/palette/types.ts:7-28` defines a `Palette` consumed by 14+ files. C.W1 must:

1. Name the demo's existing `Palette` something else (suggestion: `PersistedPalette` — explicitly the API-DTO shape).
2. Or have the demo `Palette` *compose* the library `Palette` as an inner `content: LibraryPalette` field.

Either way, the rename / refactor is non-trivial consumer churn that C.md §3 does not budget for. The W1 entry says "demo swaps at least one site to prove the type is real" — but the entire demo `palette/` directory is going to be touched by the type rename.

### §5.2 — CRITICAL: hero-lab has a parallel "palette" type (covered in §2 row 9)

`demo/hero-lab/lib/types.ts:3-12` declares `HeroPalettePreset` with demo-specific fields (`surface`, `surfaceAlt`, `shadow`, `tileStops`, `atmosphereStops`). C.W3 needs an explicit position on whether `HeroPalettePreset` (i) absorbs a library `Palette` as a `content` field, (ii) is replaced wholesale by a library `Palette + ramps`, or (iii) remains separate as a non-`Palette` UI preset. C.md §5 currently treats hero-lab as a single-row consumer; it is actually a divergent palette type.

### §5.3 — CRITICAL: `mixPalettes` already in demo (covered in §2.2)

`demo/@/lib/palette/mix.ts:70` ships `mixPalettes(palettes, options)` — a palette-level mixing primitive C.md does not mention. This is library-shaped logic in the demo. W1 should either lift it to the library (alongside `colorScale`) or document why it stays demo-side.

### §5.4 — HIGH: `cssToRawColor`/`rawColorToCSS` shim is library-shaped (covered in §2.3)

`demo/@/lib/color-utils.ts:21,51` exists because the library's `Color<number>` ↔ CSS-string surface is missing. This is the same family of gap as `colorScale` and `sampleToSVGPath`. C.md should explicitly name whether `colorFromCSS(css, space)` / `colorToCSS(color, outputSpace?)` joins the C.W1 trio or is explicitly deferred.

### §5.5 — HIGH: `migrate-palette-schema.ts` should backfill `currentHash`

C.md §1.21 says the migrator retires `formatPalette`'s `??` defaulting. The defaulting includes `currentHash: doc.currentHash ?? null` (`routes/palettes.ts:24`), but C.md does not explicitly require the migrator to compute and backfill `currentHash` on documents missing it. The §4.2 shape above includes this; C.md §3.W2 close-on text should explicitly mention "currentHash backfilled on all documents using `hash.ts:computeContentHash`."

### §5.6 — HIGH: `cron.ts` unbounded `$nin` is still in code

`docs/tranches/C/coordination/CRUD-CONSTELLATION.md:47` says: "aligned to contract cron policy (W2); no unbounded `$nin` (mirrors fourier-A.W4 janitor invert)." Verified: `api/src/cron.ts:24` still uses `paletteSlug: { $nin: paletteSlugs }` where `paletteSlugs = await db.collection("palettes").distinct("slug")` — exactly the unbounded `$nin` pattern. **C.W2 must include the janitor invert** (delete `slug: { $nin: ... }`; instead, walk votes and look up their palette). C.md §5 row "cron.ts" lists the file in W2 but does not name the invert as a gate; CRUD-CONSTELLATION names it but does not pin it as a W2 close-on. **Recommend C.md §3 W2 close-on text explicitly add: "`cron.ts` orphan-vote cleanup walks votes and looks up palettes; no unbounded `$nin`."**

### §5.7 — MEDIUM: file-pointer for `sampleToSVGPath` misaligned (covered in §2 row 3)

C.md §5 row 3 says `src/easing.ts`. Should say `src/math.ts` (existing `cubicBezierToSVG` lives there) or "math + easing — generalise `cubicBezierToSVG` and add the easing-friendly default density." This is a one-cell fix.

### §5.8 — MEDIUM: `api/src/types.ts` is 5 lines

C.md §5 row "palette-api — types + helpers" says `api/src/types.ts` is "extended (W2) — `Palette` doc shape matches library + contract." But `types.ts` is 5 lines (`api/src/types.ts:1-7` — only `AppEnv`). Palette doc shape lives inline in `routes/palettes.ts`. **Recommend C.md §5 row updated to "`api/src/types.ts` (extend with `PaletteDoc` shape; current file is `AppEnv`-only) and `routes/palettes.ts` (consume the new type)."**

### §5.9 — MEDIUM: no e2e / vitest spec list

C.md §3 W1 close-on says "vitest covers". C.md §3 W2 close-on says "Playwright re-probe green". Neither pins which specs:

- W1 vitest needs: `Palette` construction (CSS + raw), sort-on-construct, `sample` at endpoints + middle, `resample` shape, `toSRGBSafe` gamut clamp, `toJSON`/`fromJSON` roundtrip, `colorScale` parameter sweep, `sampleToSVGPath` against the existing `cubicBezierToSVG` regression.
- W2 Playwright needs: palette save → reload → load (validates no `??` fallback regression); fork flow; vote flow; delete flow; admin moderation. The existing `e2e/smoke/` spec set (stood up by B.W4) is the natural carrier.
- W3 Playwright needs: color-picker palette flows (already covered by B.W4 smoke); hero-lab palette switching.

**Recommend C.md §3 each wave row carry a `tests:` sub-line naming the spec set.**

### §5.10 — LOW: opening-time ambiguity (covered in §1.4)

C.md:7 prose says "after value.js-B close AND fourier-B's joint research+challenge close." Actual gate per §3.W0 + constellation timing diagrams is "after value.js-B close AND fourier-B.W1 ratify CRUD-CONTRACT.md." Wording fix only.

### §5.11 — LOW: C.md missing doc-update lane

C.md §3 has no row for documentation updates. The npm version bump (W1 close-on says "npm version bump published" — `C.md:40`) implies a CHANGELOG; the API contract alignment (W2) implies a README/OpenAPI update; the demo migration (W3) implies a demo-side doc note. These will surface at W4 (close) — easier to budget them at W1/W2/W3 with a sub-line.

### §5.12 — LOW: C.md does not name the cohort-shared word-list research outcome

`research/README.md:11` says R3 binds C.W2 — "decides whether `slugWords.ts` extracts to a cohort-wide shared location or remains duplicated." C.md §3 W2 does not show a fork in scope based on R3's verdict. **Recommend C.md §3 W2 close-on note: "if joint Wα-R3 mandates extraction, the extraction is a sub-lane of W2; if R3 mandates two-copies, this row is a no-op."**

---

## §6 — Cross-repo timing verdict

### §6.1 — The asserted order

Per C.md §0 + §3.W0 + `coordination/CRUD-CONSTELLATION.md:55-87` + fourier-side `fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:69-104`:

1. fourier-A closes; value.js-A closes inside value.js-B.W0.
2. value.js-B executes and closes.
3. fourier-B opens; fourier-B.W0 → Wα (joint research) → Wχ (joint challenge).
4. fourier-B.W1 ratifies `CRUD-CONTRACT.md` (value.js sign-off).
5. **value.js-C opens** (requires value.js-B closed AND fourier-B.W1 ratified).
6. value.js-C.W0 acquires artefacts; C.W1 ships library `Palette`; C.W2 aligns api; C.W3 wires demo; C.W4 closes.
7. fourier-B.W3 (entity) runs in parallel with value.js-C.W1+W2; fourier-B.W4 (consumer wiring) consumes value.js-C.W1's published npm version.

### §6.2 — Is this the right order? Yes — with one fragile node

- **Step 4 → step 5 is the correct gate.** The contract is the substrate W2 implements against; opening C before the contract exists is wasted W0 time. Honouring §3.W0's "`CRUD-CONTRACT.md` ratified by joint sign-off" gate is correct.
- **Step 7 is the single hard cross-repo dependency** — fourier-B.W4 "consumes value.js-C.W1 published." This is named in both constellation docs (`docs/tranches/C/coordination/CRUD-CONSTELLATION.md:87`, `fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:104`). It is the right shape: substrate first, consumer second (invariant 4). The npm version bump is the explicit handoff.

### §6.3 — Deadlock scenarios — none structurally present

The only candidate for deadlock would be: "value.js-C.W1 needs the contract; contract is ratified at fourier-B.W1 which needs value.js sign-off; value.js sign-off comes from value.js-C." But the sign-off comes from the **same human user** who owns both repos (`fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:112`); it does not require a value.js-C agent to be dispatched. **No deadlock.**

A second candidate: "fourier-B.W3 (entity + migration) needs the library `Palette` to model `visualization.palette` storage." Checked the fourier-B.md (`fourier-analysis/docs/tranches/B/B.md:46`): "W3 fourier `visualization` entity + migration" — the migration is fourier-internal (snapshots + gallery + draft → `visualization`), and the **palette** field on the visualization can be modelled as a `LibraryPalette | null` placeholder until W4. Per the timing diagram, fourier-B.W3 runs in parallel with value.js-C.W1+W2; fourier-B.W4 (consumer wiring including `colors.ts` gut onto value.js) is what actually consumes the library Palette. **No deadlock.**

A third candidate: "value.js-C.W1 ships the library `Palette`; the demo `Palette` rename in W3 requires the api alignment in W2; api alignment in W2 implies the demo expects the new shape; the demo expects W1." Resolved by §5.1: W1 publishes the library `Palette` and the demo's existing `Palette` is renamed to `PersistedPalette` **inside W1** (single-commit refactor at npm-publish time), W2 aligns api to use library `Palette` as the inner content, W3 swaps demo sites. The dependency chain is linear: W1 → W2 → W3. **No deadlock.**

### §6.4 — Risks (not deadlocks, but worth naming)

- **R-T-1**: If fourier-B's joint Wα/Wχ surfaces a value.js-specific finding (e.g., "Palette should compose over LCh not OKLCh"), `docs/tranches/C/research/README.md:19-21` admits a "tightly-scoped mini-research" lane between W0 and W1. Good — this is the named escape valve.
- **R-T-2**: The npm version bump at C.W1 close must be available *before* fourier-B.W4 dispatches. If fourier-B.W3 + .W4 race the value.js-C.W1 publish, fourier-B.W4 cannot dispatch until the version is on npm. **Recommend**: C.md §3 W1 close-on explicitly says "version published AND `@latest` tag updated" — not just "npm version bump published." Currently this is implied by the fourier-side coordination doc but not pinned in C.md.
- **R-T-3**: C.md schedules W2 + W3 "may run concurrently" (`C.md:45`). They are disjoint at file bounds. The only conflict is **a shared meaning of `Palette`** — if W2 uses library `Palette` (post-W1 rename) and W3 swaps demo sites onto library `Palette`, both consume the same npm version. As long as W1 has published, W2/W3 concurrency is safe.

### §6.5 — Verdict

**The timing is correct, no deadlock, with three named risks (R-T-1..3). The C.md prose at line 7 should be tightened to match §3.W0's actual gate (CONTRACT ratified at fourier-B.W1, not at fourier-B.Wχ close).**

---

## §7 — Top three priorities to harden C.md before opening

1. **§5.1 + §5.2 + §5.3** — name the demo's existing `Palette` interface, `mixPalettes`, and `HeroPalettePreset` as **explicit consumer-side churn for W1/W3** with a one-line strategy each (rename / compose / replace). Add a W1 sub-lane "library Palette shape lands AND demo `Palette` interface renamed to `PersistedPalette`."
2. **§5.6** — add a W2 close-on line: "`cron.ts` orphan-vote cleanup walks votes and looks up palettes; no unbounded `$nin` (mirrors fourier-A.W4 janitor invert)." Currently named only in the constellation doc, not in C.md's hard gate.
3. **§5.9** — pin the test spec list at each wave row. Each wave's close-on currently says "vitest covers" / "Playwright re-probe" without naming the specs; without that the gates are checkable only by claim.

(Secondary, but easy wins: §5.7 file-pointer fix; §5.8 `types.ts` reality note; §1.4 / §5.10 opening-gate wording; §6.4 R-T-2 `@latest` tag pin.)

---

## §8 — Citations summary (key load-bearing)

- `docs/tranches/A/A.md:8` — A is first tranche.
- `docs/tranches/B/B.md:4, :29, :39, :81-84` — B is A's successor; B1; B.W0 closes A; B's out-of-bounds.
- `docs/tranches/B/waves/B.W4.md:14-26` — W4 Lane A read-only library audit, no CRUD.
- `docs/tranches/B/waves/B.W5.md` — close ceremony, no CRUD.
- `docs/tranches/C/C.md:7` — open gate (slight wording mismatch with §3.W0).
- `docs/tranches/C/C.md:33` — invariant 17 verified-not-hoped migration.
- `docs/tranches/C/C.md:63-74` — §5 critical files inventory.
- `docs/tranches/C/coordination/CRUD-CONSTELLATION.md:47` — cron no-unbounded-$nin.
- `docs/tranches/C/coordination/CRUD-CONSTELLATION.md:55-87` — timing diagram.
- `src/index.ts:1-355` — full library barrel; no `Palette`/`colorScale`/`sampleToSVGPath`.
- `src/math.ts:68-83` — `cubicBezierToSVG` (the generalisation seed).
- `src/easing.ts:1-497` — easings; bezier presets at line 326+.
- `src/units/color/utils.ts:1034, :1049, :1098` — `HueInterpolationMethod`, `interpolateHue`, `mixColors`.
- `src/units/color/mix.ts:28-60` — `mixColorsN` with OKLab default.
- `src/units/color/constants.ts:211, :214-230` — `ColorSpace` type; the 15 spaces.
- `src/quantize/index.ts:55` — only `sortPalette` symbol in `src/`.
- `api/src/routes/palettes.ts:11-27` — `formatPalette` `??` defaulting (the seven fields).
- `api/src/cron.ts:24` — unbounded `$nin`.
- `api/src/types.ts:1-7` — 5-line `AppEnv` only file (not the palette doc-shape carrier).
- `api/src/hash.ts:13` — `computeContentHash` (consumed by the migrator).
- `api/src/migrate-slugs.ts:1-74`, `api/src/migrate-oklab.ts:1-85` — migration idiom precedent.
- `api/src/db.ts:21-79` — collection indexes (palettes, palette_versions, votes, sessions, flags).
- `demo/@/lib/palette/types.ts:1-28` — **the demo's existing `Palette` and `PaletteColor`**.
- `demo/@/lib/palette/mix.ts:70-102` — **the demo's existing `mixPalettes`**.
- `demo/@/lib/color-utils.ts:21-` — `cssToRawColor`/`rawColorToCSS` shim.
- `demo/hero-lab/lib/types.ts:3-12` — **hero-lab's parallel `HeroPalettePreset`**.
- `demo/@/components/custom/palette-browser/` — 38 entries / 43 files.
- `fourier-analysis/docs/tranches/B/B.md:4-7, :43-47` — fourier-B cohort identity, wave schedule.
- `fourier-analysis/docs/tranches/B/coordination/CRUD-CONSTELLATION.md:69-104` — authoritative timing diagram.
